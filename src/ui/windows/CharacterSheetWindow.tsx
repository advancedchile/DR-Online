import React, { useState } from 'react';
import {
  ActiveWindowId,
  BaseAttributes,
  ClassId,
  ElementalResists,
  GameItem,
  JobSkillEntry,
  NationId,
  TacticEntry
} from '../../types/game';

interface CharacterSheetWindowProps {
  playerName: string;
  playerNation: NationId;
  playerClass: ClassId;
  dualClass: string;
  dualGrade: number;
  level: number;
  exp: number;
  maxExp: number;
  gold: number;
  fame: number;
  beatCount: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  sp: number;
  maxSp: number;
  statPoints: number;
  attributes: BaseAttributes;
  resists: ElementalResists;
  tactics: TacticEntry[];
  equipped: Partial<Record<string, GameItem>>;
  jobSkills: JobSkillEntry[];
  onAllocateStat: (stat: keyof BaseAttributes, amt: number) => void;
  onGrantBonusPoints: () => void;
  onChangeNation: (n: NationId) => void;
  onChangeClass: (c: ClassId, dual: string) => void;
  onOpenWindow: (win: ActiveWindowId) => void;
  onClose: () => void;
}

export const CharacterSheetWindow: React.FC<CharacterSheetWindowProps> = ({
  playerName,
  playerNation,
  playerClass,
  level,
  exp,
  maxExp,
  gold,
  fame,
  beatCount,
  hp,
  maxHp,
  mp,
  maxMp,
  sp,
  maxSp,
  statPoints,
  attributes,
  resists,
  tactics,
  equipped,
  jobSkills,
  onAllocateStat,
  onOpenWindow,
  onClose
}) => {
  const [page, setPage] = useState<'status' | 'ability' | 'tactic'>('status');

  const weapon = equipped.weapon;
  const totalAc = Object.values(equipped).reduce((acc, it) => acc + (it?.defense || 0), 45);
  const atkMin = (weapon?.attackMin || 25) + Math.floor(attributes.STR * 0.7);
  const atkMax = (weapon?.attackMax || 48) + Math.floor(attributes.STR * 1.15);
  const activeTac =
    tactics.find((t) => (weapon?.tactic || 'Swordmanship').includes(t.name.split(' ')[0])) ||
    tactics[1];
  const topJob = jobSkills[0]?.name || 'Miner';

  const bgUrl =
    page === 'status'
      ? '/assets/original/ui/charsheet/cs_0.png'
      : page === 'ability'
      ? '/assets/original/ui/charsheet/cs_1.png'
      : '/assets/original/ui/charsheet/cs_2.png';

  const leftStats: Array<keyof BaseAttributes> = [
    'STR',
    'CON',
    'DEX',
    'WIS',
    'INT',
    'MOVP',
    'CHA',
    'ENDU',
    'MOR'
  ];

  const resistKeys: Array<keyof ElementalResists> = [
    'Poison',
    'Curse',
    'Fire',
    'Ice',
    'Elect',
    'Holy'
  ];

  return (
    /* Exact CharacterSheet.xml: width="321" height="351" anchored at TOPLEFT x="0" y="0" */
    <div
      className="dr-orig-charsheet"
      style={{
        position: 'fixed',
        left: 'max(0px, calc(50vw - 400px))',
        top: 'max(0px, calc(50vh - 300px))',
        width: 320,
        height: 351,
        zIndex: 60,
        userSelect: 'none'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Exact 320x351 Original Background Sprite from NewStatus.dat */}
      <img src={bgUrl} alt={page} className="dr-orig-cs-bg" draggable={false} />

      {/* PAGE 1: CharacterSheetStatusPage (Exact coordinates from CharacterSheet.xml) */}
      {page === 'status' && (
        <>
          {/* Portrait (x=14, y=49, w=60, h=65) */}
          <img
            src="/assets/original/ui/portraits/man_0.png"
            alt={playerName}
            style={{
              position: 'absolute',
              left: 16,
              top: 49,
              width: 58,
              height: 64,
              objectFit: 'cover',
              imageRendering: 'pixelated'
            }}
            draggable={false}
          />
          {/* Name (x=80, y=53) */}
          <div className="dr-orig-cs-val" style={{ left: 82, top: 47, width: 105 }}>
            {playerName}
          </div>
          {/* Class (x=210, y=53) */}
          <div className="dr-orig-cs-val" style={{ left: 196, top: 47, width: 112 }}>
            {playerClass}
          </div>
          {/* Level (x=75, y=84) */}
          <div className="dr-orig-cs-val" style={{ left: 75, top: 78, width: 38 }}>
            {level}
          </div>
          {/* Exp (x=117, y=84) */}
          <div className="dr-orig-cs-val" style={{ left: 117, top: 78, width: 88 }}>
            {exp.toLocaleString()}
          </div>
          {/* ExpNext (x=212, y=84) */}
          <div className="dr-orig-cs-val" style={{ left: 212, top: 78, width: 92 }}>
            {maxExp.toLocaleString()}
          </div>
          {/* Job (x=92, y=134) */}
          <div className="dr-orig-cs-val" style={{ left: 82, top: 128, width: 96 }}>
            {topJob} ({playerNation})
          </div>
          {/* Money (x=218, y=134) */}
          <div className="dr-orig-cs-val" style={{ left: 205, top: 128, width: 100 }}>
            {gold.toLocaleString()}
          </div>
          {/* HP (x=68, y=172) */}
          <div className="dr-orig-cs-val" style={{ left: 68, top: 165, width: 95 }}>
            {hp} / {maxHp}
          </div>
          {/* Fame (x=231, y=172) */}
          <div className="dr-orig-cs-val" style={{ left: 218, top: 165, width: 85 }}>
            {fame}
          </div>
          {/* MP (x=68, y=198) */}
          <div className="dr-orig-cs-val" style={{ left: 68, top: 191, width: 95 }}>
            {mp} / {maxMp}
          </div>
          {/* Beat (x=231, y=198) */}
          <div className="dr-orig-cs-val" style={{ left: 218, top: 191, width: 85 }}>
            {beatCount}
          </div>
          {/* Health/SP (x=68, y=224) */}
          <div className="dr-orig-cs-val" style={{ left: 68, top: 217, width: 95 }}>
            {sp} / {maxSp}
          </div>
          {/* AC (x=231, y=224) */}
          <div className="dr-orig-cs-val" style={{ left: 218, top: 217, width: 85 }}>
            {totalAc}
          </div>
          {/* Tactic (x=68, y=250) */}
          <div className="dr-orig-cs-val" style={{ left: 68, top: 243, width: 95 }}>
            {activeTac.name} ({activeTac.level})
          </div>
          {/* Damage (x=231, y=250) */}
          <div className="dr-orig-cs-val" style={{ left: 215, top: 243, width: 90 }}>
            {atkMin} - {atkMax}
          </div>
        </>
      )}

      {/* PAGE 2: CharacterSheetAbilityPage (Exact coordinates from CharacterSheet.xml) */}
      {page === 'ability' && (
        <>
          {leftStats.map((st, idx) => {
            const rowY = 98 + idx * 25;
            const btnY = 94 + idx * 25;
            return (
              <React.Fragment key={st}>
                <div className="dr-orig-cs-val" style={{ left: 90, top: rowY - 6, width: 42 }}>
                  {attributes[st]}
                </div>
                <button
                  type="button"
                  className="dr-orig-cs-plus-btn"
                  style={{ left: 135, top: btnY, width: 19, height: 19 }}
                  disabled={statPoints <= 0}
                  onClick={() => onAllocateStat(st, 1)}
                >
                  <img
                    src={
                      statPoints > 0
                        ? '/assets/original/ui/charsheet/cs_20.png'
                        : '/assets/original/ui/charsheet/cs_22.png'
                    }
                    alt="+"
                    draggable={false}
                  />
                </button>
              </React.Fragment>
            );
          })}

          {/* 10th Stat: LUCK / WSPS (x=253, y=97, button at x=289, y=94) */}
          <div className="dr-orig-cs-val" style={{ left: 245, top: 91, width: 40 }}>
            {attributes.LUCK}
          </div>
          <button
            type="button"
            className="dr-orig-cs-plus-btn"
            style={{ left: 289, top: 94, width: 19, height: 19 }}
            disabled={statPoints <= 0}
            onClick={() => onAllocateStat('LUCK', 1)}
          >
            <img
              src={
                statPoints > 0
                  ? '/assets/original/ui/charsheet/cs_20.png'
                  : '/assets/original/ui/charsheet/cs_22.png'
              }
              alt="+"
              draggable={false}
            />
          </button>

          {/* 6 Elemental Resistances (x=241, y=136..261, step 25) */}
          {resistKeys.map((rk, idx) => (
            <div
              key={rk}
              className="dr-orig-cs-val"
              style={{ left: 241, top: 130 + idx * 25, width: 55 }}
            >
              {resists[rk]}
            </div>
          ))}

          {/* Remaining Stat Points (x=249, y=298) */}
          <div
            className="dr-orig-cs-val"
            style={{ left: 238, top: 292, width: 45, color: '#fde047', fontWeight: 700 }}
          >
            {statPoints}
          </div>
        </>
      )}

      {/* PAGE 3: CharacterSheetTacticPage (Exact 11 rows at y=57..287, step 23) */}
      {page === 'tactic' && (
        <>
          {tactics.slice(0, 11).map((tac, idx) => {
            const rowY = 51 + idx * 23;
            return (
              <React.Fragment key={tac.id}>
                <div className="dr-orig-cs-val" style={{ left: 128, top: rowY, width: 28 }}>
                  {tac.level}
                </div>
                <div className="dr-orig-cs-val" style={{ left: 162, top: rowY, width: 68 }}>
                  {tac.exp.toLocaleString()}
                </div>
                <div className="dr-orig-cs-val" style={{ left: 235, top: rowY, width: 72 }}>
                  {tac.maxExp.toLocaleString()}
                </div>
              </React.Fragment>
            );
          })}
        </>
      )}

      {/* BOTTOM 4 ORIGINAL BUTTONS (y=323, x=4, 82, 160, 238, w=78, h=24) */}
      {/* Button 1 (x=4, y=323): Switch between Status and Ability */}
      <button
        type="button"
        className="dr-orig-cs-bottom-btn"
        style={{ left: 4, top: 323, width: 78, height: 24 }}
        onClick={() => setPage(page === 'status' ? 'ability' : 'status')}
      >
        <img
          src={
            page === 'status'
              ? '/assets/original/ui/charsheet/cs_7.png'
              : '/assets/original/ui/charsheet/cs_4.png'
          }
          alt=""
          draggable={false}
        />
      </button>

      {/* Button 2 (x=82, y=323): Switch to Tactic or Ability */}
      <button
        type="button"
        className="dr-orig-cs-bottom-btn"
        style={{ left: 82, top: 323, width: 78, height: 24 }}
        onClick={() => setPage(page === 'tactic' ? 'ability' : 'tactic')}
      >
        <img
          src={
            page === 'tactic'
              ? '/assets/original/ui/charsheet/cs_7.png'
              : '/assets/original/ui/charsheet/cs_10.png'
          }
          alt=""
          draggable={false}
        />
      </button>

      {/* Button 3 (x=160, y=323): System / Options */}
      <button
        type="button"
        className="dr-orig-cs-bottom-btn"
        style={{ left: 160, top: 323, width: 78, height: 24 }}
        onClick={() => onOpenWindow('options')}
      >
        <img src="/assets/original/ui/charsheet/cs_13.png" alt="" draggable={false} />
      </button>

      {/* Button 4 (x=238, y=323): Done / Close */}
      <button
        type="button"
        className="dr-orig-cs-bottom-btn"
        style={{ left: 238, top: 323, width: 78, height: 24 }}
        onClick={onClose}
      >
        <img src="/assets/original/ui/charsheet/cs_16.png" alt="" draggable={false} />
      </button>
    </div>
  );
};
