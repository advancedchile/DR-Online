import React, { useEffect, useState } from 'react';
import { soundManager } from '../../engine/SoundManager';
import {
  CharacterGender,
  PrimaryJobId,
  rollClassDiceAttributes,
  SavedCharacterProfile
} from '../../systems/CharacterStorage';
import { BaseAttributes, ClassId, NationId } from '../../types/game';

interface CharacterCreateScreenProps {
  slotIndex: number;
  onConfirmCreate: (profile: SavedCharacterProfile) => void;
  onCancel: () => void;
}

type CharGenSubStep =
  | 'gender'
  | 'name'
  | 'face'
  | 'arigement'
  | 'class'
  | 'spell'
  | 'color'
  | 'tactics'
  | 'job'
  | 'ability'
  | 'menu';

const STEP_ORDER: CharGenSubStep[] = [
  'gender',
  'name',
  'face',
  'arigement',
  'class',
  'spell',
  'color',
  'tactics',
  'job',
  'ability'
];

const CLASSES: Array<{ id: ClassId; index: number; dualDefault: string; defaultTactic: string }> = [
  { id: 'Warrior', index: 0, dualDefault: 'Dark Knight', defaultTactic: 'SWORDMANSHIP' },
  { id: 'Thief', index: 1, dualDefault: 'Night Hawk', defaultTactic: 'FENCING' },
  { id: 'Archer', index: 2, dualDefault: 'Highlander', defaultTactic: 'ARCHERY' },
  { id: 'Wizard', index: 3, dualDefault: 'Archmage', defaultTactic: 'MAGERY' },
  { id: 'Priest', index: 4, dualDefault: 'Saint', defaultTactic: 'ORISON' }
];

const NATIONS: Array<{ id: NationId; capitalMap: string; spawnX: number; spawnY: number }> = [
  { id: 'Vyseus', capitalMap: 'RENES_C', spawnX: 200, spawnY: 165 },
  { id: 'Zypern', capitalMap: 'barantan', spawnX: 263, spawnY: 185 },
  { id: 'Yllse', capitalMap: 'hegmonia', spawnX: 334, spawnY: 316 }
];

// Exact 7 Arigement (Values) from MenuStartSet.cpp (HN_MAKECHARACTER_ARIGEMENT_TEXT, spheres 154..160, symbols 801..807)
const ARIGEMENTS: Array<{ index: number; label: string; nation: NationId }> = [
  { index: 0, label: 'LIGHT', nation: 'Vyseus' },
  { index: 1, label: 'DARKNESS', nation: 'Zypern' },
  { index: 2, label: 'FIRE', nation: 'Zypern' },
  { index: 3, label: 'ICE', nation: 'Vyseus' },
  { index: 4, label: 'WIND', nation: 'Yllse' },
  { index: 5, label: 'EARTH', nation: 'Vyseus' },
  { index: 6, label: 'DRAGON', nation: 'Yllse' }
];

const JOBS: Array<{ id: PrimaryJobId; label: string; sprFrame: number }> = [
  { id: 'farming', label: 'FARMER', sprFrame: 563 },
  { id: 'mining', label: 'MINING', sprFrame: 564 },
  { id: 'fishing', label: 'FISHER', sprFrame: 565 },
  { id: 'lumberjacking', label: 'LUMBERJACK', sprFrame: 566 },
  { id: 'butchering', label: 'BUTCHER', sprFrame: 567 },
  { id: 'herbdigging', label: 'HERB DIGGER', sprFrame: 568 }
];

const TACTICS_MAN = [
  'CRAPPLE',
  'SWORDMANSHIP',
  'ARCHERY',
  'PARRYING',
  'MACE FIGHTING',
  'PIERCE',
  'WHIRL',
  'HURL',
  'ORISON',
  'DOUBLE SWORD',
  'DOUBLE MACE'
];

const TACTICS_WOMAN = [
  'CRAPPLE',
  'SWORDMANSHIP',
  'ARCHERY',
  'FENCING',
  'MACE FIGHTING',
  'PIERCE',
  'WHIRL',
  'HURL',
  'PARRYING',
  'ORISON'
];

// Exact menu buttons from SysMenu.dat[549..558] (109x22 each)
const STEP_BADGE_FRAME: Record<CharGenSubStep, number> = {
  gender: 549,
  job: 550,
  spell: 551,
  name: 552,
  class: 553,
  tactics: 554,
  color: 555,
  ability: 556,
  face: 557,
  arigement: 558,
  menu: 552
};

const STEP_EXPLAIN_TEXT: Record<CharGenSubStep, string> = {
  gender: 'Select your character gender (WOMAN or MAN) and click OK.',
  name: 'Type your character name (up to 15 letters) and click OK.',
  face: 'Use the left and right arrows to choose your character portrait.',
  arigement: 'Select your character elemental value and alignment sphere.',
  class: 'Select your combat class (Warrior, Thief, Archer, Wizard, Priest).',
  spell: 'Select Wizard Spell (WS) or Priest Spell (PS) magic affinity.',
  color: 'Adjust your character hair/skin and ornament RGB colors.',
  tactics: 'Select your primary weapon tactic skill to specialize in.',
  job: 'Select your primary gathering profession (6 basic jobs).',
  ability: 'Click the Dice button to roll bonus ability points for your class.',
  menu: 'Select a category to customize your character.'
};

export const CharacterCreateScreen: React.FC<CharacterCreateScreenProps> = ({
  slotIndex,
  onConfirmCreate,
  onCancel
}) => {
  const [name, setName] = useState('SansonPercival');
  const [gender, setGender] = useState<CharacterGender>('male');
  const [portraitIndex, setPortraitIndex] = useState(0);
  const [arigementIdx, setArigementIdx] = useState(0);
  const [nation, setNation] = useState<NationId>('Vyseus');
  const [className, setClassName] = useState<ClassId>('Warrior');
  const [spellType, setSpellType] = useState<'WIZARD' | 'PRIEST'>('WIZARD');
  const [tactic, setTactic] = useState<string>('SWORDMANSHIP');
  const [tacticPage, setTacticPage] = useState(0);
  const [primaryJob, setPrimaryJob] = useState<PrimaryJobId>('mining');
  const [jobPage, setJobPage] = useState(0);
  const [age, setAge] = useState(18);
  const [baseAttributes, setBaseAttributes] = useState<BaseAttributes>(() => rollClassDiceAttributes('Warrior'));
  const [bonusAttributes, setBonusAttributes] = useState<Partial<Record<keyof BaseAttributes, number>>>({
    STR: 3,
    CON: 2
  });
  const [subStep, setSubStep] = useState<CharGenSubStep>('gender');
  const [animStep, setAnimStep] = useState(0);
  const [diceRolling, setDiceRolling] = useState(false);
  const [showYesNoConfirm, setShowYesNoConfirm] = useState(false);
  const [hoverYesNo, setHoverYesNo] = useState<'yes' | 'no' | null>(null);
  const [stepBtnState, setStepBtnState] = useState<{
    hover: 'ok' | 'cancel' | 'left' | 'right' | null;
    press: 'ok' | 'cancel' | 'left' | 'right' | null;
  }>({ hover: null, press: null });
  const [rgbColor, setRgbColor] = useState({ r: 204, g: 146, b: 118, target: 'skin' as 'skin' | 'ornament' });

  // PutTestAnimation2 (SmallMenu.cpp:313140) cycles 22 frames of CharAniSmall{gender}{class}.spr
  useEffect(() => {
    const timer = window.setInterval(() => {
      setAnimStep((f) => (f + 1) % 22);
    }, 110);
    return () => window.clearInterval(timer);
  }, []);

  const computeClassBonus = (c: ClassId): Partial<Record<keyof BaseAttributes, number>> => {
    const r1 = 2 + Math.floor(Math.random() * 4); // +2..+5
    const r2 = 1 + Math.floor(Math.random() * 4); // +1..+4
    switch (c) {
      case 'Warrior':
        return { STR: r1, CON: r2 };
      case 'Thief':
        return { DEX: r1, MOVP: r2 };
      case 'Archer':
        return { DEX: r1, CON: r2 };
      case 'Wizard':
        return { INT: r1, WSPS: r2 };
      case 'Priest':
        return { WIS: r1, WSPS: r2 };
    }
  };

  const handleClassSelect = (c: ClassId) => {
    soundManager.playClick();
    setClassName(c);
    const clsObj = CLASSES.find((item) => item.id === c) || CLASSES[0];
    setTactic(clsObj.defaultTactic);
    setSpellType(c === 'Priest' ? 'PRIEST' : 'WIZARD');
    setBaseAttributes(rollClassDiceAttributes(c));
    setBonusAttributes(computeClassBonus(c));
  };

  const handleRollDice = () => {
    if (diceRolling) return;
    soundManager.playForge(true);
    setDiceRolling(true);
    setShowYesNoConfirm(false);
    let step = 0;
    const rollInterval = window.setInterval(() => {
      setBaseAttributes(rollClassDiceAttributes(className));
      setBonusAttributes(computeClassBonus(className));
      step++;
      if (step >= 6) {
        window.clearInterval(rollInterval);
        setDiceRolling(false);
        setShowYesNoConfirm(true);
      }
    }, 80);
  };

  const handleStepOk = () => {
    soundManager.playClick();
    const idx = STEP_ORDER.indexOf(subStep);
    if (idx >= 0 && idx < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[idx + 1];
      setSubStep(nextStep);
      if (nextStep === 'ability') {
        handleRollDice();
      }
    } else if (subStep === 'ability') {
      setShowYesNoConfirm(true);
    } else {
      setSubStep('gender');
    }
  };

  const handleStepCancel = () => {
    soundManager.playClick();
    if (subStep === 'gender') {
      onCancel();
      return;
    }
    const idx = STEP_ORDER.indexOf(subStep);
    if (idx > 0) {
      setShowYesNoConfirm(false);
      setSubStep(STEP_ORDER[idx - 1]);
    } else {
      onCancel();
    }
  };

  const handleCreate = () => {
    const cleanName = name.trim() || `Hero_${slotIndex + 1}`;
    const clsObj = CLASSES.find((c) => c.id === className) || CLASSES[0];
    const finalAttributes: BaseAttributes = { ...baseAttributes };
    (Object.keys(bonusAttributes) as Array<keyof BaseAttributes>).forEach((k) => {
      finalAttributes[k] = (finalAttributes[k] || 0) + (bonusAttributes[k] || 0);
    });

    soundManager.playLevelUp();
    // Newly created character starts at Level 1 in Beginner Tutorial (SCHOLIUM)
    // and then selects their starting village on MN_START_MAP!
    const profile: SavedCharacterProfile = {
      slotIndex,
      name: cleanName,
      gender,
      portraitIndex,
      nation,
      className,
      dualClass: clsObj.dualDefault,
      dualGrade: 1,
      primaryJob,
      level: 1,
      exp: 0,
      maxExp: 250,
      gold: 2000,
      fame: 100,
      mapId: 'scholium',
      tileX: 98,
      tileY: 112,
      attributes: finalAttributes,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    onConfirmCreate(profile);
  };

  const genderNum = gender === 'male' ? 1 : 0;
  const classObj = CLASSES.find((c) => c.id === className) || CLASSES[0];
  const faceDatMiddle = gender === 'female' ? 'images/ui/legacy/face_woman_m.dat' : 'images/ui/legacy/face_man_m.dat';
  const faceDatBig = gender === 'female' ? 'images/ui/legacy/face_woman_b.dat' : 'images/ui/legacy/face_man_b.dat';
  const maxFaces = gender === 'female' ? 7 : 8;
  const currentJobObj = JOBS.find((j) => j.id === primaryJob) || JOBS[0];
  const tacticsPool = gender === 'male' ? TACTICS_MAN : TACTICS_WOMAN;
  const maxTacticPages = Math.ceil(tacticsPool.length / 4);
  const visibleTactics = tacticsPool.slice(tacticPage * 4, tacticPage * 4 + 4);
  const visibleJobs = JOBS.slice(jobPage * 3, jobPage * 3 + 3);
  const usesPagingArrows = subStep === 'face' || subStep === 'tactics' || subStep === 'job';

  const handlePagePrev = () => {
    soundManager.playClick();
    if (subStep === 'face') {
      setPortraitIndex((p) => (p - 1 + maxFaces) % maxFaces);
    } else if (subStep === 'tactics') {
      setTacticPage((p) => (p - 1 + maxTacticPages) % maxTacticPages);
    } else if (subStep === 'job') {
      setJobPage((p) => (p - 1 + 2) % 2);
    }
  };

  const handlePageNext = () => {
    soundManager.playClick();
    if (subStep === 'face') {
      setPortraitIndex((p) => (p + 1) % maxFaces);
    } else if (subStep === 'tactics') {
      setTacticPage((p) => (p + 1) % maxTacticPages);
    } else if (subStep === 'job') {
      setJobPage((p) => (p + 1) % 2);
    }
  };

  const renderStatCell = (statKey: keyof BaseAttributes, left: number, top: number) => {
    const baseVal = baseAttributes[statKey];
    const bonusVal = bonusAttributes[statKey] || 0;
    return (
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width: 58,
          height: 15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: 2,
          fontFamily: 'Tahoma, sans-serif',
          fontSize: 11,
          color: '#ffffff',
          textShadow: '1px 1px 0 #000'
        }}
      >
        <span>{baseVal}</span>
        {bonusVal > 0 && (
          <span style={{ color: '#00ff66', marginLeft: 3, fontWeight: 700 }}>+{bonusVal}</span>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 900,
        userSelect: 'none'
      }}
    >
      {/* MN_MAKECHARACTER_BASIC (MenuStartSet.cpp:504): start_etc.dat[18] (800x600) */}
      <div
        style={{
          position: 'relative',
          width: 800,
          height: 600,
          backgroundImage: `url('/api/data0/sprite?path=images/ui/legacy/start_etc.dat&frame=18')`,
          backgroundSize: '800px 600px',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          overflow: 'hidden'
        }}
      >
        {/* Top Header Banner: SysMenu.dat[153] (591x87) at (23+80, 14+60) = (103, 74) */}
        <img
          src="/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=153"
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            left: 103,
            top: 74,
            width: 591,
            height: 87,
            pointerEvents: 'none',
            imageRendering: 'pixelated'
          }}
        />

        {/* =================================================================== */}
        {/* LEFT PANEL: MN_MAKECHARACTER_* (55+80=135, 75+60=135, 209x308)      */}
        {/* =================================================================== */}
        <div
          style={{
            position: 'absolute',
            left: 135,
            top: 135,
            width: 209,
            height: 308,
            backgroundImage: `url('/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=${
              subStep === 'color' ? 400 : 25
            }')`,
            backgroundSize: '209px 308px',
            backgroundRepeat: 'no-repeat',
            fontFamily: 'Tahoma, sans-serif',
            fontSize: 12,
            color: '#e5d0a1',
            textShadow: '1px 1px 0 #000'
          }}
        >
          {/* Arrow Cover Bar SysMenu.dat[26] (209x22) at (0, 45) OR Left/Right Paging Arrows */}
          {!usesPagingArrows ? (
            <img
              src="/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=26"
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                left: 0,
                top: 45,
                width: 209,
                height: 22,
                pointerEvents: 'none',
                imageRendering: 'pixelated'
              }}
            />
          ) : (
            <>
              {/* Left Arrow: SysMenu.dat[12] (15x15) at (27, 50) / hover-press [11] (19x19) at (25, 48) */}
              <div
                onMouseEnter={() => setStepBtnState((s) => ({ ...s, hover: 'left' }))}
                onMouseLeave={() => setStepBtnState({ hover: null, press: null })}
                onMouseDown={() => setStepBtnState((s) => ({ ...s, press: 'left' }))}
                onMouseUp={() => setStepBtnState((s) => ({ ...s, press: null }))}
                onClick={handlePagePrev}
                style={{
                  position: 'absolute',
                  left: 25,
                  top: 44,
                  width: 26,
                  height: 24,
                  cursor: 'pointer'
                }}
              >
                <img
                  src={`/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=${
                    stepBtnState.press === 'left' || stepBtnState.hover === 'left' ? 11 : 12
                  }`}
                  alt="Prev"
                  draggable={false}
                  style={{
                    position: 'absolute',
                    left: stepBtnState.press === 'left' || stepBtnState.hover === 'left' ? 0 : 2,
                    top: stepBtnState.press === 'left' || stepBtnState.hover === 'left' ? 4 : 6,
                    imageRendering: 'pixelated'
                  }}
                />
              </div>

              {/* Right Arrow: SysMenu.dat[14] (15x15) at (167, 50) / hover-press [13] (19x19) at (165, 48) */}
              <div
                onMouseEnter={() => setStepBtnState((s) => ({ ...s, hover: 'right' }))}
                onMouseLeave={() => setStepBtnState({ hover: null, press: null })}
                onMouseDown={() => setStepBtnState((s) => ({ ...s, press: 'right' }))}
                onMouseUp={() => setStepBtnState((s) => ({ ...s, press: null }))}
                onClick={handlePageNext}
                style={{
                  position: 'absolute',
                  left: 159,
                  top: 44,
                  width: 26,
                  height: 24,
                  cursor: 'pointer'
                }}
              >
                <img
                  src={`/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=${
                    stepBtnState.press === 'right' || stepBtnState.hover === 'right' ? 13 : 14
                  }`}
                  alt="Next"
                  draggable={false}
                  style={{
                    position: 'absolute',
                    left: stepBtnState.press === 'right' || stepBtnState.hover === 'right' ? 6 : 8,
                    top: stepBtnState.press === 'right' || stepBtnState.hover === 'right' ? 4 : 6,
                    imageRendering: 'pixelated'
                  }}
                />
              </div>
            </>
          )}

          {/* Step Title Badge: SysMenu.dat[549..558] (109x22) at (49, 45) */}
          <img
            src={`/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=${STEP_BADGE_FRAME[subStep]}`}
            alt={subStep}
            draggable={false}
            onClick={() => {
              soundManager.playClick();
              setSubStep(subStep === 'menu' ? 'gender' : 'menu');
            }}
            title="Click to jump between steps"
            style={{
              position: 'absolute',
              left: 49,
              top: 45,
              width: 109,
              height: 22,
              cursor: 'pointer',
              imageRendering: 'pixelated'
            }}
          />

          {/* STEP CONTENT: MENU OVERVIEW */}
          {subStep === 'menu' && (
            <div
              style={{
                position: 'absolute',
                left: 50,
                top: 68,
                width: 109,
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}
            >
              {STEP_ORDER.map((st) => (
                <img
                  key={st}
                  src={`/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=${STEP_BADGE_FRAME[st]}`}
                  alt={st}
                  draggable={false}
                  onClick={() => {
                    soundManager.playClick();
                    setSubStep(st);
                  }}
                  style={{
                    width: 109,
                    height: 21,
                    cursor: 'pointer',
                    imageRendering: 'pixelated'
                  }}
                />
              ))}
            </div>
          )}

          {/* STEP 1: MN_MAKECHARACTER_GENDER */}
          {subStep === 'gender' && (
            <>
              {(
                [
                  { id: 'female' as CharacterGender, label: 'WOMAN', yText: 117, yRect: 107 },
                  { id: 'male' as CharacterGender, label: 'MAN', yText: 180, yRect: 170 }
                ] as const
              ).map((g) => (
                <div
                  key={g.id}
                  onClick={() => {
                    soundManager.playClick();
                    setGender(g.id);
                    setPortraitIndex(0);
                  }}
                  onDoubleClick={handleStepOk}
                  style={{
                    position: 'absolute',
                    left: 19,
                    top: g.yRect,
                    width: 170,
                    height: 30,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {gender === g.id && (
                    <img
                      src="/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=16"
                      alt=""
                      draggable={false}
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: 170,
                        height: 30,
                        pointerEvents: 'none',
                        imageRendering: 'pixelated'
                      }}
                    />
                  )}
                  <span
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      color: gender === g.id ? '#ffff88' : '#d8cfa8',
                      fontWeight: 700,
                      letterSpacing: '0.5px'
                    }}
                  >
                    {g.label}
                  </span>
                </div>
              ))}
            </>
          )}

          {/* STEP 2: MN_MAKECHARACTER_NAME */}
          {subStep === 'name' && (
            <>
              {/* SysMenu.dat[19] (165x82) Name Frame at (22, 115) */}
              <img
                src="/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=19"
                alt=""
                draggable={false}
                style={{
                  position: 'absolute',
                  left: 22,
                  top: 115,
                  width: 165,
                  height: 82,
                  pointerEvents: 'none',
                  imageRendering: 'pixelated'
                }}
              />
              <input
                id="dr-chargen-name-step-input"
                type="text"
                value={name}
                autoFocus
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleStepOk();
                }}
                maxLength={15}
                style={{
                  position: 'absolute',
                  left: 44,
                  top: 145,
                  width: 121,
                  height: 20,
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffff88',
                  fontFamily: 'Tahoma, sans-serif',
                  fontSize: 12,
                  fontWeight: 700,
                  textAlign: 'center',
                  textShadow: '1px 1px 0 #000'
                }}
              />
            </>
          )}

          {/* STEP 3: MN_MAKECHARACTER_FACE */}
          {subStep === 'face' && (
            <>
              {/* Mirror Frame SysMenu.dat[24] (154x199) centered at x=27, y=77 */}
              <img
                src="/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=24"
                alt=""
                draggable={false}
                style={{
                  position: 'absolute',
                  left: 27,
                  top: 77,
                  width: 154,
                  height: 199,
                  pointerEvents: 'none',
                  imageRendering: 'pixelated'
                }}
              />
              {/* Big Face Portrait inside Mirror at (54, 108) */}
              <div
                onClick={handlePageNext}
                style={{
                  position: 'absolute',
                  left: 54,
                  top: 108,
                  width: 100,
                  height: 118,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden'
                }}
              >
                <img
                  src={`/api/data0/sprite?path=${faceDatBig}&frame=${portraitIndex}`}
                  alt="Face"
                  draggable={false}
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            </>
          )}

          {/* STEP 4: MN_MAKECHARACTER_ARIGEMENT */}
          {subStep === 'arigement' && (
            <>
              {ARIGEMENTS.map((ar, idx) => {
                const topRect = 80 + idx * 28;
                const isSel = arigementIdx === ar.index;
                return (
                  <div
                    key={ar.label}
                    onClick={() => {
                      soundManager.playClick();
                      setArigementIdx(ar.index);
                      setNation(ar.nation);
                    }}
                    onDoubleClick={handleStepOk}
                    style={{
                      position: 'absolute',
                      left: 19,
                      top: topRect,
                      width: 170,
                      height: 30,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {isSel && (
                      <img
                        src="/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=16"
                        alt=""
                        draggable={false}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: 170,
                          height: 30,
                          pointerEvents: 'none',
                          imageRendering: 'pixelated'
                        }}
                      />
                    )}
                    <span
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        color: isSel ? '#ffff88' : '#d8cfa8',
                        fontWeight: 700,
                        fontSize: 11
                      }}
                    >
                      {ar.label}
                    </span>
                  </div>
                );
              })}
            </>
          )}

          {/* STEP 5: MN_MAKECHARACTER_CLASS */}
          {subStep === 'class' && (
            <>
              {CLASSES.map((c, idx) => {
                const topRect = 90 + idx * 36;
                const isSel = className === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleClassSelect(c.id)}
                    onDoubleClick={handleStepOk}
                    style={{
                      position: 'absolute',
                      left: 19,
                      top: topRect,
                      width: 170,
                      height: 30,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {isSel && (
                      <img
                        src="/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=16"
                        alt=""
                        draggable={false}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: 170,
                          height: 30,
                          pointerEvents: 'none',
                          imageRendering: 'pixelated'
                        }}
                      />
                    )}
                    <span
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        color: isSel ? '#ffff88' : '#d8cfa8',
                        fontWeight: 700
                      }}
                    >
                      {c.id.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </>
          )}

          {/* STEP 6: MN_MAKECHARACTER_SPELL */}
          {subStep === 'spell' && (
            <>
              {(
                [
                  { id: 'WIZARD' as const, label: 'WIZARD SPELL', yRect: 100 },
                  { id: 'PRIEST' as const, label: 'PRIEST SPELL', yRect: 170 }
                ] as const
              ).map((sp) => {
                const isSel = spellType === sp.id;
                return (
                  <div
                    key={sp.id}
                    onClick={() => {
                      soundManager.playClick();
                      setSpellType(sp.id);
                    }}
                    onDoubleClick={handleStepOk}
                    style={{
                      position: 'absolute',
                      left: 19,
                      top: sp.yRect,
                      width: 170,
                      height: 30,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {isSel && (
                      <img
                        src="/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=16"
                        alt=""
                        draggable={false}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: 170,
                          height: 30,
                          pointerEvents: 'none',
                          imageRendering: 'pixelated'
                        }}
                      />
                    )}
                    <span
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        color: isSel ? '#ffff88' : '#d8cfa8',
                        fontWeight: 700
                      }}
                    >
                      {sp.label}
                    </span>
                  </div>
                );
              })}
            </>
          )}

          {/* STEP 7: MN_MAKECHARACTER_COLOR (SysMenu.dat[400]) */}
          {subStep === 'color' && (
            <>
              {/* Hair / Ornament radio indicator dot SysMenu.dat[0] */}
              <div
                onClick={() => {
                  soundManager.playClick();
                  setRgbColor((c) => ({ ...c, target: 'skin' }));
                }}
                style={{
                  position: 'absolute',
                  left: 44,
                  top: 92,
                  width: 96,
                  height: 29,
                  cursor: 'pointer'
                }}
              >
                {rgbColor.target === 'skin' && (
                  <img
                    src="/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=0"
                    alt=""
                    draggable={false}
                    style={{ position: 'absolute', left: 9, top: 5, imageRendering: 'pixelated' }}
                  />
                )}
              </div>
              <div
                onClick={() => {
                  soundManager.playClick();
                  setRgbColor((c) => ({ ...c, target: 'ornament' }));
                }}
                style={{
                  position: 'absolute',
                  left: 44,
                  top: 125,
                  width: 116,
                  height: 29,
                  cursor: 'pointer'
                }}
              >
                {rgbColor.target === 'ornament' && (
                  <img
                    src="/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=0"
                    alt=""
                    draggable={false}
                    style={{ position: 'absolute', left: 9, top: 4, imageRendering: 'pixelated' }}
                  />
                )}
              </div>

              {/* R / G / B Sliders at y=178, 208, 238 */}
              {(['r', 'g', 'b'] as const).map((ch, idx) => (
                <input
                  key={ch}
                  type="range"
                  min={0}
                  max={255}
                  value={rgbColor[ch]}
                  onChange={(e) => setRgbColor((prev) => ({ ...prev, [ch]: Number(e.target.value) }))}
                  style={{
                    position: 'absolute',
                    left: 72,
                    top: 178 + idx * 30,
                    width: 102,
                    height: 12,
                    accentColor: ch === 'r' ? '#cc3333' : ch === 'g' ? '#33aa33' : '#3366cc',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </>
          )}

          {/* STEP 8: MN_MAKECHARACTER_TACTICS */}
          {subStep === 'tactics' && (
            <>
              {visibleTactics.map((t, idx) => {
                const topRect = 103 + idx * 41;
                const isSel = tactic === t;
                return (
                  <div
                    key={t}
                    onClick={() => {
                      soundManager.playClick();
                      setTactic(t);
                    }}
                    onDoubleClick={handleStepOk}
                    style={{
                      position: 'absolute',
                      left: 19,
                      top: topRect,
                      width: 170,
                      height: 30,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {isSel && (
                      <img
                        src="/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=16"
                        alt=""
                        draggable={false}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: 170,
                          height: 30,
                          pointerEvents: 'none',
                          imageRendering: 'pixelated'
                        }}
                      />
                    )}
                    <span
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        color: isSel ? '#ffff88' : '#d8cfa8',
                        fontWeight: 700,
                        fontSize: 11
                      }}
                    >
                      {t}
                    </span>
                  </div>
                );
              })}
            </>
          )}

          {/* STEP 9: MN_MAKECHARACTER_JOB */}
          {subStep === 'job' && (
            <>
              {visibleJobs.map((j, idx) => {
                const topRect = 114 + idx * 52;
                const isSel = primaryJob === j.id;
                return (
                  <div
                    key={j.id}
                    onClick={() => {
                      soundManager.playClick();
                      setPrimaryJob(j.id);
                    }}
                    onDoubleClick={handleStepOk}
                    style={{
                      position: 'absolute',
                      left: 19,
                      top: topRect,
                      width: 170,
                      height: 30,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {isSel && (
                      <img
                        src="/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=16"
                        alt=""
                        draggable={false}
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: 170,
                          height: 30,
                          pointerEvents: 'none',
                          imageRendering: 'pixelated'
                        }}
                      />
                    )}
                    <span
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        color: isSel ? '#ffff88' : '#d8cfa8',
                        fontWeight: 700
                      }}
                    >
                      {j.label}
                    </span>
                  </div>
                );
              })}
            </>
          )}

          {/* STEP 10: MN_MAKECHARACTER_ABILITY (MenuStartSet.cpp:1869) */}
          {subStep === 'ability' && (
            <>
              {/* Dice Border Frame SysMenu.dat[8] (48x51) at (81, 144) */}
              <img
                src="/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=8"
                alt=""
                draggable={false}
                style={{
                  position: 'absolute',
                  left: 81,
                  top: 144,
                  width: 48,
                  height: 51,
                  pointerEvents: 'none',
                  imageRendering: 'pixelated'
                }}
              />
              {/* Dice Button SysMenu.dat[10] normal / [7] pressed at (85, 148) */}
              <img
                src={`/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=${diceRolling ? 7 : 10}`}
                alt="Roll Dice"
                draggable={false}
                onClick={handleRollDice}
                title="Click to roll ability dice"
                style={{
                  position: 'absolute',
                  left: 85,
                  top: 148,
                  width: 41,
                  height: 43,
                  cursor: 'pointer',
                  imageRendering: 'pixelated'
                }}
              />
            </>
          )}

          {/* Bottom CANCEL Button (9, 287, 91x16): normal=67, hover=847, press=65 */}
          <div
            onMouseEnter={() => setStepBtnState((s) => ({ ...s, hover: 'cancel' }))}
            onMouseLeave={() => setStepBtnState({ hover: null, press: null })}
            onMouseDown={() => setStepBtnState((s) => ({ ...s, press: 'cancel' }))}
            onMouseUp={() => setStepBtnState((s) => ({ ...s, press: null }))}
            onClick={handleStepCancel}
            style={{
              position: 'absolute',
              left: 9,
              top: 287,
              width: 91,
              height: 16,
              backgroundImage: `url('/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=${
                stepBtnState.press === 'cancel' ? 65 : stepBtnState.hover === 'cancel' ? 847 : 67
              }')`,
              backgroundSize: '91px 16px',
              backgroundRepeat: 'no-repeat',
              cursor: 'pointer'
            }}
          />

          {/* Bottom OK Button (108, 287, 91x16): normal=66, hover=846, press=64 */}
          <div
            onMouseEnter={() => setStepBtnState((s) => ({ ...s, hover: 'ok' }))}
            onMouseLeave={() => setStepBtnState({ hover: null, press: null })}
            onMouseDown={() => setStepBtnState((s) => ({ ...s, press: 'ok' }))}
            onMouseUp={() => setStepBtnState((s) => ({ ...s, press: null }))}
            onClick={handleStepOk}
            style={{
              position: 'absolute',
              left: 108,
              top: 287,
              width: 91,
              height: 16,
              backgroundImage: `url('/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=${
                stepBtnState.press === 'ok' ? 64 : stepBtnState.hover === 'ok' ? 846 : 66
              }')`,
              backgroundSize: '91px 16px',
              backgroundRepeat: 'no-repeat',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* Step Explanation Scroll Box: SysMenu.dat[9] (198x59) at (135+5, 135+315) = (140, 450) */}
        <div
          style={{
            position: 'absolute',
            left: 140,
            top: 450,
            width: 198,
            height: 59,
            backgroundImage: `url('/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=9')`,
            backgroundSize: '198px 59px',
            backgroundRepeat: 'no-repeat',
            padding: '10px 14px',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Tahoma, sans-serif',
            fontSize: 11,
            lineHeight: '14px',
            color: '#d8cfa8',
            textAlign: 'center',
            textShadow: '1px 1px 0 #000'
          }}
        >
          {STEP_EXPLAIN_TEXT[subStep]}
        </div>

        {/* =================================================================== */}
        {/* RIGHT PANEL: MN_MAKECHARACTER_CHEAK1 (SysMenu[27]) OR CHEAK3 ([28]) */}
        {/* =================================================================== */}
        {subStep === 'ability' ? (
          /* MN_MAKECHARACTER_CHEAK3 (MenuStartSet.cpp:614): SysMenu.dat[28] (255x320) at (409, 164) */
          <div
            style={{
              position: 'absolute',
              left: 409,
              top: 164,
              width: 255,
              height: 320,
              backgroundImage: `url('/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=28')`,
              backgroundSize: '255px 320px',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Wizard WS overlay label SysMenu.dat[75] (68x28) at (173, 204) */}
            {spellType === 'WIZARD' && (
              <img
                src="/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=75"
                alt="WS"
                draggable={false}
                style={{
                  position: 'absolute',
                  left: 173,
                  top: 204,
                  width: 68,
                  height: 28,
                  pointerEvents: 'none',
                  imageRendering: 'pixelated'
                }}
              />
            )}

            {/* Exact 11 Stat Cells from MenuStartSet.cpp:620..685 */}
            {renderStatCell('STR', 59, 86)}
            {renderStatCell('CON', 137, 86)}
            {renderStatCell('DEX', 20, 138)}
            {renderStatCell('WIS', 98, 138)}
            {renderStatCell('INT', 178, 138)}
            {renderStatCell('MOVP', 20, 188)}
            {renderStatCell('CHA', 98, 188)}
            {renderStatCell('ENDU', 178, 188)}
            {renderStatCell('MOR', 20, 238)}
            {renderStatCell('LUCK', 98, 238)}
            {renderStatCell('WSPS', 178, 238)}
          </div>
        ) : (
          /* MN_MAKECHARACTER_CHEAK1 (MenuStartSet.cpp:528): SysMenu.dat[27] (255x342) at (409, 164) */
          <div
            style={{
              position: 'absolute',
              left: 409,
              top: 164,
              width: 255,
              height: 342,
              backgroundImage: `url('/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=27')`,
              backgroundSize: '255px 342px',
              backgroundRepeat: 'no-repeat',
              fontFamily: 'Tahoma, sans-serif',
              fontSize: 11,
              color: '#e6dec8',
              textShadow: '1px 1px 0 #000'
            }}
          >
            {/* Field 6: DP_FACEIMAGE (FS_MIDDLE) at (26, 25) */}
            <div
              onClick={() => {
                soundManager.playClick();
                setSubStep('face');
              }}
              style={{
                position: 'absolute',
                left: 26,
                top: 25,
                width: 64,
                height: 78,
                cursor: 'pointer',
                overflow: 'hidden'
              }}
            >
              <img
                src={`/api/data0/sprite?path=${faceDatMiddle}&frame=${portraitIndex}`}
                alt="Portrait"
                draggable={false}
                style={{ width: 64, height: 78, imageRendering: 'pixelated' }}
              />
            </div>

            {/* Field 7: DP_ARIGEMENT Sphere (SysMenu[154+idx] at 27, 127 + SysMenu[801+idx] at 38, 133) */}
            <div
              onClick={() => {
                soundManager.playClick();
                setSubStep('arigement');
              }}
              style={{
                position: 'absolute',
                left: 27,
                top: 127,
                width: 60,
                height: 74,
                cursor: 'pointer'
              }}
            >
              <img
                src={`/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=${154 + arigementIdx}`}
                alt="Value Sphere"
                draggable={false}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  imageRendering: 'pixelated'
                }}
              />
              <img
                src={`/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=${801 + arigementIdx}`}
                alt=""
                draggable={false}
                style={{
                  position: 'absolute',
                  left: 11,
                  top: 6,
                  opacity: 0.85,
                  imageRendering: 'pixelated'
                }}
              />
            </div>

            {/* Field 5: DP_NAME at (115, 43) */}
            <input
              id="dr-chargen-name-input"
              type="text"
              value={name}
              onClick={() => setSubStep('name')}
              onChange={(e) => setName(e.target.value)}
              maxLength={15}
              style={{
                position: 'absolute',
                left: 112,
                top: 40,
                width: 122,
                height: 18,
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffff88',
                fontFamily: 'Tahoma, sans-serif',
                fontSize: 11,
                textAlign: 'left',
                paddingLeft: 3,
                textShadow: '1px 1px 0 #000'
              }}
            />

            {/* Field 8: DO_CHARACTER - PutTestAnimation2 (SmallMenu.cpp:313140) CharAniSmall{gender}{class}.spr */}
            <div
              onClick={() => {
                soundManager.playClick();
                setSubStep('class');
              }}
              style={{
                position: 'absolute',
                left: 123,
                top: 72,
                width: 102,
                height: 128,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'visible'
              }}
            >
              <img
                src={`/api/data0/sprite?path=charanismall/${genderNum}/${classObj.index}&frame=${animStep}`}
                alt={className}
                draggable={false}
                style={{
                  width: 180,
                  height: 180,
                  pointerEvents: 'none',
                  imageRendering: 'pixelated'
                }}
              />
            </div>

            {/* Field 4: DP_AGE (20, 252, w=58) */}
            <div
              style={{
                position: 'absolute',
                left: 20,
                top: 250,
                width: 58,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 4
              }}
            >
              {age}
            </div>

            {/* Field 0: DP_CLASS (98, 252, w=56) */}
            <div
              onClick={() => {
                soundManager.playClick();
                setSubStep('class');
              }}
              style={{
                position: 'absolute',
                left: 98,
                top: 250,
                width: 56,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 2,
                cursor: 'pointer'
              }}
            >
              {className.toUpperCase()}
            </div>

            {/* Field 1: DP_SPELL (175, 252, w=56) */}
            <div
              onClick={() => {
                soundManager.playClick();
                setSubStep('spell');
              }}
              style={{
                position: 'absolute',
                left: 175,
                top: 250,
                width: 56,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 2,
                cursor: 'pointer'
              }}
            >
              {spellType}
            </div>

            {/* Field 3: DP_TACTICS (85, 281, w=148) */}
            <div
              onClick={() => {
                soundManager.playClick();
                setSubStep('tactics');
              }}
              style={{
                position: 'absolute',
                left: 85,
                top: 279,
                width: 148,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 4,
                cursor: 'pointer'
              }}
            >
              {tactic}
            </div>

            {/* Field 2: DP_JOB (85, 309, w=148) */}
            <div
              onClick={() => {
                soundManager.playClick();
                setSubStep('job');
              }}
              style={{
                position: 'absolute',
                left: 85,
                top: 307,
                width: 148,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 4,
                cursor: 'pointer'
              }}
            >
              {currentJobObj.label}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MN_MESSAGEBOX_BIG (SysMenu[485]) + MN_YESNO (SysMenu[242])           */}
        {/* Shown after rolling dice in MN_MAKECHARACTER_ABILITY (MenuStart.cpp) */}
        {/* =================================================================== */}
        {subStep === 'ability' && showYesNoConfirm && (
          <>
            {/* MN_MESSAGEBOX_BIG: SysMenu.dat[485] (255x256) at (34+80=114, 110+60=170) */}
            <div
              style={{
                position: 'absolute',
                left: 114,
                top: 170,
                width: 255,
                height: 256,
                backgroundImage: `url('/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=485')`,
                backgroundSize: '255px 256px',
                backgroundRepeat: 'no-repeat',
                padding: '48px 28px 32px 28px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Tahoma, sans-serif',
                fontSize: 12,
                lineHeight: '18px',
                color: '#f0e6c8',
                textAlign: 'center',
                textShadow: '1px 1px 0 #000',
                zIndex: 20
              }}
            >
              <div>
                The numbers on the right are the initial ability stats of your character.
                <br />
                <br />
                If you are satisfied with these stats, click <b>&apos;YES&apos;</b> to complete character creation.
                <br />
                If not, click <b>&apos;NO&apos;</b> to roll the dice again.
              </div>
            </div>

            {/* MN_YESNO: SysMenu.dat[242] (106x78) at (270, 396) */}
            <div
              style={{
                position: 'absolute',
                left: 270,
                top: 396,
                width: 106,
                height: 78,
                backgroundImage: `url('/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=242')`,
                backgroundSize: '106px 78px',
                backgroundRepeat: 'no-repeat',
                zIndex: 25
              }}
            >
              {/* YES Button: (25, 15, 54x21), highlight SysMenu.dat[243] */}
              <div
                onMouseEnter={() => setHoverYesNo('yes')}
                onMouseLeave={() => setHoverYesNo(null)}
                onClick={handleCreate}
                style={{
                  position: 'absolute',
                  left: 25,
                  top: 15,
                  width: 56,
                  height: 21,
                  cursor: 'pointer'
                }}
              >
                {hoverYesNo === 'yes' && (
                  <img
                    src="/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=243"
                    alt="YES"
                    draggable={false}
                    style={{ width: 54, height: 21, imageRendering: 'pixelated' }}
                  />
                )}
              </div>

              {/* NO Button: (32, 43, 42x21), highlight SysMenu.dat[244] */}
              <div
                onMouseEnter={() => setHoverYesNo('no')}
                onMouseLeave={() => setHoverYesNo(null)}
                onClick={() => {
                  soundManager.playClick();
                  setShowYesNoConfirm(false);
                }}
                style={{
                  position: 'absolute',
                  left: 32,
                  top: 43,
                  width: 43,
                  height: 21,
                  cursor: 'pointer'
                }}
              >
                {hoverYesNo === 'no' && (
                  <img
                    src="/api/data0/sprite?path=images/ui/legacy/localized/en/SysMenu.dat&frame=244"
                    alt="NO"
                    draggable={false}
                    style={{ width: 42, height: 21, imageRendering: 'pixelated' }}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
