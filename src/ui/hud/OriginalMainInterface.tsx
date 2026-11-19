import React, { useEffect, useRef, useState } from 'react';
import { originalSoundEngine } from '../../audio/OriginalSoundEngine';
import {
  ActiveWindowId,
  ClassId,
  CombatMode,
  CombatSkillEntry,
  GameItem,
  GameOptionsState,
  JobSkillEntry,
  SpellEntry,
  TacticEntry
} from '../../types/game';

interface OriginalMainInterfaceProps {
  playerName: string;
  playerClass: ClassId;
  level: number;
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  dp: number;
  maxDp: number;
  sp: number;
  maxSp: number;
  cp: number;
  maxCp: number;
  statPoints: number;
  combatMode: CombatMode;
  isMounted: boolean;
  potionBox: GameItem[];
  inventory: GameItem[];
  quickSpell?: SpellEntry;
  quickCombatSkill?: CombatSkillEntry;
  activeTactic?: TacticEntry;
  activeJob?: JobSkillEntry;
  options: GameOptionsState;
  activeWindow: ActiveWindowId | null;
  onToggleWindow: (win: ActiveWindowId) => void;
  onSetCombatMode: (mode: CombatMode) => void;
  onUsePotionSlot: (slotIndex: number) => void;
  onUseInventoryQuickItem: (item: GameItem) => void;
  onCastQuickSpell: () => void;
  onUseQuickCombatSkill: () => void;
  onToggleAutoClicker: () => void;
  onToggleMount: () => void;
  onSendChat: (channel: 'Normal' | 'Party' | 'Guild' | 'Nation' | 'Whisper', text: string) => void;
}

const NEW_EMOTE_DAT = 'images/ui/legacy/newemote.dat';
const FRIEND_MENU_DAT = 'images/ui/legacy/localized/en/friend_menu.dat';

const emoteSprite = (frame: number) =>
  `/api/data0/sprite?path=${encodeURIComponent(NEW_EMOTE_DAT)}&frame=${frame}`;
const friendSprite = (frame: number) =>
  `/api/data0/sprite?path=${encodeURIComponent(FRIEND_MENU_DAT)}&frame=${frame}`;

const EMOTE_LABELS = [
  'Smile ^_^',
  'Laugh ^O^',
  'Wink ;)',
  'Blush ^_^;',
  'Surprise o_O',
  'Cry T_T',
  'Angry >_<',
  'Cool B)',
  'Sleep zZz',
  'Cheer \\o/',
  'Question ?',
  'Exclaim !',
  'Love <3',
  'Sweat -_-;',
  'Grin :D',
  'Sad :(',
  'Victory V',
  'Dizzy @_@',
  'Shout !',
  'Bow _(_)_'
];

interface ImgButtonProps {
  x: number;
  y: number;
  baseName: string;
  title?: string;
  active?: boolean;
  onClick: () => void;
}

const OriginalHudImageButton: React.FC<ImgButtonProps> = ({
  x,
  y,
  baseName,
  title,
  active,
  onClick
}) => {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const stateSuffix = pressed || active ? 'pressed' : hovered ? 'highlighted' : 'normal';
  const src = `/assets/original/ui/main/${baseName}_${stateSuffix}.png`;

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      onMouseEnter={() => {
        setHovered(true);
        originalSoundEngine.playTouch();
      }}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      className="dr-orig-hud-btn"
      style={{ left: x, top: y }}
    >
      <img src={src} alt="" draggable={false} />
    </button>
  );
};

export const OriginalMainInterface: React.FC<OriginalMainInterfaceProps> = ({
  playerName,
  playerClass,
  level,
  exp,
  maxExp,
  hp,
  maxHp,
  mp,
  maxMp,
  dp,
  maxDp,
  sp,
  maxSp,
  cp,
  maxCp,
  combatMode,
  potionBox,
  inventory,
  quickSpell,
  activeTactic,
  activeJob,
  activeWindow,
  onToggleWindow,
  onSetCombatMode,
  onUsePotionSlot,
  onUseInventoryQuickItem,
  onCastQuickSpell,
  onUseQuickCombatSkill,
  onSendChat
}) => {
  const [chatChannel, setChatChannel] = useState<'Normal' | 'Party' | 'Guild' | 'Nation' | 'Whisper'>('Normal');
  const [chatInput, setChatInput] = useState('');
  const [isChatInputOpen, setIsChatInputOpen] = useState(false);
  const [isChatLocked, setIsChatLocked] = useState(false);
  const chatInputRef = useRef<HTMLInputElement | null>(null);

  // Authentic MN_FACE Emoticon Bar (kh_menuset.cpp:3796 - NewEmote.dat[0])
  const [isEmoteBarOpen, setIsEmoteBarOpen] = useState(false);
  const [hoveredEmoteIdx, setHoveredEmoteIdx] = useState<number | null>(null);

  // Authentic MN_FRIEND_MENU Window (SmallMenuSet.cpp:7741 - friend_menu.dat[1])
  const [isFriendMenuOpen, setIsFriendMenuOpen] = useState(false);
  const [friends, setFriends] = useState<Array<{ name: string; online: boolean }>>([
    { name: 'HuchNedval', online: true },
    { name: 'SansonPercival', online: true },
    { name: 'Karl', online: true },
    { name: 'IrurilSereniel', online: false },
    { name: 'Tyburn', online: false }
  ]);
  const [newFriendInput, setNewFriendInput] = useState('');
  const [showFriendRegistInput, setShowFriendRegistInput] = useState(false);
  const [friendBtnHover, setFriendBtnHover] = useState<'regist' | 'close' | null>(null);
  const [friendBtnPress, setFriendBtnPress] = useState<'regist' | 'close' | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        if (e.key === 'Escape' && isChatInputOpen && !isChatLocked) {
          e.preventDefault();
          setIsChatInputOpen(false);
          chatInputRef.current?.blur();
        }
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        setIsChatInputOpen(true);
        window.setTimeout(() => {
          chatInputRef.current?.focus();
        }, 10);
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        originalSoundEngine.playMenuOpen();
        setIsFriendMenuOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsEmoteBarOpen(false);
        setIsFriendMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChatInputOpen, isChatLocked]);

  const isPriestOrDivine = playerClass === 'Priest';
  const manaVal = isPriestOrDivine ? dp : mp;
  const manaMax = isPriestOrDivine ? maxDp : maxMp;

  const hpPct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  const mpPct = Math.max(0, Math.min(1, manaVal / Math.max(1, manaMax)));
  const cpPct = Math.max(0, Math.min(1, cp / Math.max(1, maxCp)));
  const spPct = Math.max(0, Math.min(1, sp / Math.max(1, maxSp)));
  const expPct = Math.max(0, Math.min(1, exp / Math.max(1, maxExp)));
  const tacticPct = activeTactic
    ? Math.max(0, Math.min(1, activeTactic.exp / Math.max(1, activeTactic.maxExp)))
    : 0.5;
  const jobPct = activeJob
    ? Math.max(0, Math.min(1, activeJob.exp / Math.max(1, activeJob.maxExp)))
    : 0.4;

  const hpFillHeight = Math.round(91 * hpPct);
  const mpFillHeight = Math.round(91 * mpPct);
  const cpFillHeight = Math.round(107 * cpPct);

  const combatBtnBase =
    combatMode === 'Peace' ? 'peace' : combatMode === 'Battle' ? 'battle' : 'pk';

  const channelImgMap: Record<typeof chatChannel, string> = {
    Normal: '/assets/original/ui/main/chatnormal.png',
    Party: '/assets/original/ui/main/chatparty.png',
    Guild: '/assets/original/ui/main/chatguild.png',
    Nation: '/assets/original/ui/main/chatnation.png',
    Whisper: '/assets/original/ui/main/chatwhisper.png'
  };

  const cycleChannel = () => {
    originalSoundEngine.playClick();
    const order: Array<typeof chatChannel> = ['Normal', 'Party', 'Guild', 'Nation', 'Whisper'];
    const nextIdx = (order.indexOf(chatChannel) + 1) % order.length;
    setChatChannel(order[nextIdx]);
  };

  // Up to 5 quick slots at x=459, 492, 526, 559, 592, y=69 (MainInterface.xml)
  const quickSlotX = [459, 492, 526, 559, 592];
  const quickItems: Array<GameItem | undefined> = [
    potionBox[0],
    potionBox[1],
    potionBox[2],
    inventory[0],
    inventory[1]
  ];

  // Exact 20 Emoticon coordinates inside MN_FACE (kh_menuset.cpp:3824-3846)
  const emotePositions: Array<{ frame: number; x: number; y: number }> = [
    { frame: 2, x: 16, y: 12 },
    { frame: 3, x: 59, y: 13 },
    { frame: 4, x: 99, y: 14 },
    { frame: 5, x: 139, y: 14 },
    { frame: 6, x: 179, y: 15 },
    { frame: 7, x: 219, y: 13 },
    { frame: 8, x: 264, y: 14 },
    { frame: 9, x: 302, y: 15 },
    { frame: 10, x: 345, y: 13 },
    { frame: 11, x: 384, y: 14 },
    { frame: 12, x: 14, y: 55 },
    { frame: 13, x: 59, y: 58 },
    { frame: 14, x: 95, y: 53 },
    { frame: 15, x: 138, y: 51 },
    { frame: 16, x: 179, y: 55 },
    { frame: 17, x: 219, y: 55 },
    { frame: 18, x: 260, y: 58 },
    { frame: 19, x: 300, y: 52 },
    { frame: 20, x: 345, y: 54 },
    { frame: 21, x: 381, y: 52 }
  ];

  return (
    <div className="dr-orig-main-interface-wrapper">
      <div className="dr-orig-main-interface">
        {/* Authentic MN_FACE Emoticon Popup (kh_menuset.cpp:3796 - NewEmote.dat[0], 450x122 at x=98) */}
        {isEmoteBarOpen && (
          <div
            style={{
              position: 'absolute',
              left: 98,
              top: -124,
              width: 450,
              height: 122,
              backgroundImage: `url('${emoteSprite(0)}')`,
              backgroundSize: '450px 122px',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
              zIndex: 90,
              pointerEvents: 'auto',
              userSelect: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {emotePositions.map((em, idx) => (
              <div
                key={em.frame}
                onMouseEnter={() => {
                  setHoveredEmoteIdx(idx);
                  originalSoundEngine.playTouch();
                }}
                onMouseLeave={() => setHoveredEmoteIdx(null)}
                onClick={() => {
                  originalSoundEngine.playClick();
                  setIsEmoteBarOpen(false);
                  onSendChat('Normal', `${EMOTE_LABELS[idx] || '^_^'}`);
                }}
                style={{
                  position: 'absolute',
                  left: em.x,
                  top: em.y,
                  width: 38,
                  height: 36,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  filter: hoveredEmoteIdx === idx ? 'brightness(1.25)' : 'none'
                }}
              >
                <img
                  src={emoteSprite(em.frame)}
                  alt=""
                  draggable={false}
                  style={{ imageRendering: 'pixelated', pointerEvents: 'none' }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Authentic MN_FRIEND_MENU Window (SmallMenuSet.cpp:7741 - friend_menu.dat[1], 216x336) */}
        {isFriendMenuOpen && (
          <div
            style={{
              position: 'fixed',
              left: 'calc(50vw + 58px)',
              top: 'max(16px, calc(50vh - 240px))',
              width: 216,
              height: 336,
              backgroundImage: `url('${friendSprite(1)}')`,
              backgroundSize: '216px 336px',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
              zIndex: 88,
              pointerEvents: 'auto',
              userSelect: 'none',
              fontFamily: 'Tahoma, sans-serif',
              fontSize: 11,
              color: '#e8dec5'
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
              e.preventDefault();
              originalSoundEngine.playMenuClose();
              setIsFriendMenuOpen(false);
            }}
          >
            {/* Field 0: FT_FRIEND_NAME list at (25, 55, 170x195) */}
            <div
              style={{
                position: 'absolute',
                left: 25,
                top: 55,
                width: 165,
                height: 195,
                overflowY: 'auto'
              }}
            >
              {friends.map((fr, i) => (
                <div
                  key={i}
                  onClick={() => {
                    originalSoundEngine.playClick();
                    setChatChannel('Whisper');
                    setIsChatInputOpen(true);
                    setChatInput(`/${fr.name} `);
                    window.setTimeout(() => chatInputRef.current?.focus(), 10);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '3px 4px',
                    cursor: 'pointer',
                    color: fr.online ? '#86efac' : '#9ca3af',
                    textShadow: '1px 1px 0 #000'
                  }}
                >
                  <span>{fr.name}</span>
                  <span style={{ fontSize: 10 }}>{fr.online ? 'ON' : 'OFF'}</span>
                </div>
              ))}

              {showFriendRegistInput && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newFriendInput.trim()) {
                      setFriends((prev) => [
                        ...prev,
                        { name: newFriendInput.trim(), online: true }
                      ]);
                      setNewFriendInput('');
                    }
                    setShowFriendRegistInput(false);
                  }}
                  style={{ marginTop: 6 }}
                >
                  <input
                    type="text"
                    value={newFriendInput}
                    onChange={(e) => setNewFriendInput(e.target.value)}
                    placeholder="Friend Name..."
                    autoFocus
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.65)',
                      border: '1px solid #8c734b',
                      color: '#fff',
                      fontSize: 11,
                      padding: '2px 4px',
                      outline: 'none'
                    }}
                  />
                </form>
              )}
            </div>

            {/* Field 2: MN_FRIEND_REGIST Button at (21, 291, 76x27) - friend_menu.dat[5]/[6] */}
            <div
              onMouseEnter={() => {
                setFriendBtnHover('regist');
                originalSoundEngine.playTouch();
              }}
              onMouseLeave={() => {
                setFriendBtnHover(null);
                setFriendBtnPress(null);
              }}
              onMouseDown={() => setFriendBtnPress('regist')}
              onMouseUp={() => setFriendBtnPress(null)}
              onClick={() => {
                originalSoundEngine.playClick();
                setShowFriendRegistInput((prev) => !prev);
              }}
              style={{
                position: 'absolute',
                left: 21,
                top: 291,
                width: 75,
                height: 27,
                cursor: 'pointer'
              }}
            >
              {(friendBtnHover === 'regist' || friendBtnPress === 'regist') && (
                <img
                  src={friendSprite(friendBtnPress === 'regist' ? 6 : 5)}
                  alt=""
                  draggable={false}
                  style={{ width: 75, height: 27, imageRendering: 'pixelated', pointerEvents: 'none' }}
                />
              )}
            </div>

            {/* Field 1: SWD_SMALLMENU_CLOSE Button at (117, 291, 76x27) - friend_menu.dat[7]/[8] */}
            <div
              onMouseEnter={() => {
                setFriendBtnHover('close');
                originalSoundEngine.playTouch();
              }}
              onMouseLeave={() => {
                setFriendBtnHover(null);
                setFriendBtnPress(null);
              }}
              onMouseDown={() => setFriendBtnPress('close')}
              onMouseUp={() => setFriendBtnPress(null)}
              onClick={() => {
                originalSoundEngine.playMenuClose();
                setIsFriendMenuOpen(false);
              }}
              style={{
                position: 'absolute',
                left: 117,
                top: 291,
                width: 75,
                height: 27,
                cursor: 'pointer'
              }}
            >
              {(friendBtnHover === 'close' || friendBtnPress === 'close') && (
                <img
                  src={friendSprite(friendBtnPress === 'close' ? 8 : 7)}
                  alt=""
                  draggable={false}
                  style={{ width: 75, height: 27, imageRendering: 'pixelated', pointerEvents: 'none' }}
                />
              )}
            </div>
          </div>
        )}

        {/* Base 801x109 Original Background from data/ui/Resources/MainInterface/background.csp */}
        <img
          src="/assets/original/ui/main/background.png"
          alt="Dragon Raja MainInterface"
          className="dr-orig-main-bg"
          draggable={false}
        />

        {/* 1. LEFT VERTICAL HP GAUGE (x=0, y=2, fillX=4, fillY=17, fillLength=91) */}
        <div className="dr-orig-vgauge" style={{ left: 0, top: 2, width: 65, height: 108 }}>
          <img
            src="/assets/original/ui/main/hpgauge_empty.png"
            alt=""
            className="dr-orig-vgauge-empty"
            draggable={false}
          />
          <div
            className="dr-orig-vgauge-crop"
            style={{
              left: 4,
              bottom: 0,
              width: 57,
              height: hpFillHeight
            }}
          >
            <img
              src={
                hpPct >= 0.99
                  ? '/assets/original/ui/main/hpgauge_full.png'
                  : '/assets/original/ui/main/hpgauge_fill.png'
              }
              alt=""
              style={{ position: 'absolute', left: 0, bottom: 0 }}
              draggable={false}
            />
          </div>
        </div>

        {/* 2. RIGHT VERTICAL MP / DP GAUGE (x=721, y=2, fillX=21, fillY=17, fillLength=91) */}
        <div className="dr-orig-vgauge" style={{ left: 721, top: 2, width: 80, height: 108 }}>
          <img
            src={
              isPriestOrDivine
                ? '/assets/original/ui/main/dpgauge_empty.png'
                : '/assets/original/ui/main/mpgauge_empty.png'
            }
            alt=""
            className="dr-orig-vgauge-empty"
            draggable={false}
          />
          <div
            className="dr-orig-vgauge-crop"
            style={{
              left: 21,
              bottom: 0,
              width: 58,
              height: mpFillHeight
            }}
          >
            <img
              src={
                isPriestOrDivine
                  ? mpPct >= 0.99
                    ? '/assets/original/ui/main/dpgauge_full.png'
                    : '/assets/original/ui/main/dpgauge_fill.png'
                  : mpPct >= 0.99
                  ? '/assets/original/ui/main/mpgauge_full.png'
                  : '/assets/original/ui/main/mpgauge_fill.png'
              }
              alt=""
              style={{ position: 'absolute', left: 0, bottom: 0 }}
              draggable={false}
            />
          </div>
        </div>

        {/* 3. RIGHT CP PLATE (x=722, y=1) */}
        <div
          className="dr-orig-vgauge"
          style={{ left: 722, top: 1, width: 41, height: 108, cursor: 'pointer' }}
          onClick={onUseQuickCombatSkill}
        >
          <img
            src="/assets/original/ui/main/cpgauge_empty.png"
            alt=""
            className="dr-orig-vgauge-empty"
            draggable={false}
          />
          <div
            className="dr-orig-vgauge-crop"
            style={{
              left: 0,
              bottom: 0,
              width: 41,
              height: cpFillHeight
            }}
          >
            <img
              src="/assets/original/ui/main/cpcountgauge_fill.png"
              alt=""
              style={{ position: 'absolute', left: 0, bottom: 0 }}
              draggable={false}
            />
          </div>
        </div>

        {/* 4. HORIZONTAL GAUGES (MainInterface.xml) */}
        {/* Hunger / SP (x=66, y=38, fillLength=120) */}
        <div className="dr-orig-hgauge" style={{ left: 66, top: 38, width: 120, height: 8 }}>
          <img src="/assets/original/ui/main/hunger_empty.png" alt="" draggable={false} />
          <div className="dr-orig-hgauge-crop" style={{ width: Math.round(120 * spPct) }}>
            <img
              src={
                spPct >= 0.99
                  ? '/assets/original/ui/main/hunger_full.png'
                  : '/assets/original/ui/main/hunger_fill.png'
              }
              alt=""
              draggable={false}
            />
          </div>
        </div>

        {/* Magic Tactic Exp (x=66, y=51, fillLength=119) */}
        <div className="dr-orig-hgauge" style={{ left: 66, top: 51, width: 119, height: 14 }}>
          <img src="/assets/original/ui/main/tactics_empty.png" alt="" draggable={false} />
          <div className="dr-orig-hgauge-crop" style={{ width: Math.round(119 * tacticPct) }}>
            <img src="/assets/original/ui/main/tactics_fill.png" alt="" draggable={false} />
          </div>
          <span className="dr-orig-hgauge-label">{isPriestOrDivine ? 'Orison' : 'Magery'}</span>
        </div>

        {/* Weapon Tactic Exp (x=66, y=69, fillLength=119) */}
        <div className="dr-orig-hgauge" style={{ left: 66, top: 69, width: 119, height: 14 }}>
          <img src="/assets/original/ui/main/tactics_empty.png" alt="" draggable={false} />
          <div className="dr-orig-hgauge-crop" style={{ width: Math.round(119 * tacticPct) }}>
            <img src="/assets/original/ui/main/tactics_fill.png" alt="" draggable={false} />
          </div>
          <span className="dr-orig-hgauge-label">
            {activeTactic ? activeTactic.name : 'Swordmanship'}
          </span>
        </div>

        {/* Job Skill Exp (x=66, y=88, fillLength=119) */}
        <div className="dr-orig-hgauge" style={{ left: 66, top: 88, width: 119, height: 14 }}>
          <img src="/assets/original/ui/main/tactics_empty.png" alt="" draggable={false} />
          <div className="dr-orig-hgauge-crop" style={{ width: Math.round(119 * jobPct) }}>
            <img src="/assets/original/ui/main/tactics_fill.png" alt="" draggable={false} />
          </div>
          <span className="dr-orig-hgauge-label">{activeJob ? activeJob.name : 'Mining'}</span>
        </div>

        {/* Main Level EXP Gauge (x=393, y=43, fillLength=224) */}
        <div className="dr-orig-hgauge" style={{ left: 393, top: 43, width: 224, height: 16 }}>
          <img src="/assets/original/ui/main/expgauge_empty.png" alt="" draggable={false} />
          <div className="dr-orig-hgauge-crop" style={{ width: Math.round(224 * expPct) }}>
            <img
              src={
                expPct >= 0.99
                  ? '/assets/original/ui/main/expgauge_full.png'
                  : '/assets/original/ui/main/expgauge_fill.png'
              }
              alt=""
              draggable={false}
            />
          </div>
        </div>

        {/* 5. ORIGINAL HUD IMAGE BUTTONS AT EXACT MainInterface.xml & kh_menuset.cpp COORDINATES */}
        {/* Emotes [DO_FACE_MENU] (x=66, y=12) -> toggles MN_FACE (NewEmote.dat[0]) */}
        <OriginalHudImageButton
          x={66}
          y={12}
          baseName="emotes"
          active={isEmoteBarOpen}
          onClick={() => {
            originalSoundEngine.playClick();
            setIsEmoteBarOpen((prev) => !prev);
          }}
        />

        {/* Friends [F] (x=99, y=16) -> toggles MN_FRIEND_MENU (friend_menu.dat[1]) */}
        <OriginalHudImageButton
          x={99}
          y={16}
          baseName="friends"
          active={isFriendMenuOpen}
          onClick={() => {
            originalSoundEngine.playMenuOpen();
            setIsFriendMenuOpen((prev) => !prev);
          }}
        />

        {/* Status [Q] (x=194, y=67) */}
        <OriginalHudImageButton
          x={194}
          y={67}
          baseName="status"
          active={activeWindow === 'character'}
          onClick={() => onToggleWindow('character')}
        />

        {/* Bag / Inventory [W] (x=237, y=67) */}
        <OriginalHudImageButton
          x={237}
          y={67}
          baseName="bag"
          active={activeWindow === 'inventory'}
          onClick={() => onToggleWindow('inventory')}
        />

        {/* Party [E] (x=282, y=67) */}
        <OriginalHudImageButton
          x={282}
          y={67}
          baseName="party"
          active={activeWindow === 'party_guild'}
          onClick={() => onToggleWindow('party_guild')}
        />

        {/* Spells [A] (x=326, y=67) */}
        <OriginalHudImageButton
          x={326}
          y={67}
          baseName="spells"
          active={activeWindow === 'spells'}
          onClick={() => {
            originalSoundEngine.playMagicBookOpen();
            onToggleWindow('spells');
          }}
        />

        {/* CSkills [S] (x=369, y=67) */}
        <OriginalHudImageButton
          x={369}
          y={67}
          baseName="cs"
          active={activeWindow === 'combat_skills'}
          onClick={() => onToggleWindow('combat_skills')}
        />

        {/* Skills / Primary Jobs [D] (x=414, y=67) */}
        <OriginalHudImageButton
          x={414}
          y={67}
          baseName="skills"
          active={activeWindow === 'jobs'}
          onClick={() => onToggleWindow('jobs')}
        />

        {/* 5 Quick Item Slots (x=459, 492, 526, 559, 592, y=69) */}
        {quickSlotX.map((qx, idx) => {
          const item = quickItems[idx];
          return (
            <button
              key={qx}
              type="button"
              className="dr-orig-quick-item-slot"
              style={{ left: qx, top: 69, width: 30, height: 30 }}
              onClick={() => {
                if (!item) return;
                if (idx < 3) onUsePotionSlot(idx);
                else onUseInventoryQuickItem(item);
              }}
            >
              {item?.iconUrl && (
                <img src={item.iconUrl} alt="" className="dr-orig-slot-icon" draggable={false} />
              )}
              {item && <span className="dr-orig-slot-qty">{item.quantity}</span>}
            </button>
          );
        })}

        {/* Mails [L] (x=638, y=42) */}
        <OriginalHudImageButton
          x={638}
          y={42}
          baseName="mails"
          active={activeWindow === 'mail'}
          onClick={() => onToggleWindow('mail')}
        />

        {/* Options / System [O] (x=638, y=75) -> opens MN_SYSTEM */}
        <OriginalHudImageButton
          x={638}
          y={75}
          baseName="options"
          active={activeWindow === 'options'}
          onClick={() => onToggleWindow('options')}
        />

        {/* Today's Notice / Events [Ctrl+Z] (x=674, y=28) -> opens MN_NATION_TODAY_NOTICE */}
        <OriginalHudImageButton
          x={674}
          y={28}
          baseName="events"
          active={activeWindow === 'achievements'}
          onClick={() => onToggleWindow('achievements')}
        />

        {/* Peace / Battle / PK Mode Toggle [TAB] (x=673, y=59) */}
        <OriginalHudImageButton
          x={673}
          y={59}
          baseName={combatBtnBase}
          onClick={() => {
            originalSoundEngine.playModeToggle();
            onSetCombatMode(
              combatMode === 'Peace' ? 'Battle' : combatMode === 'Battle' ? 'PK' : 'Peace'
            );
          }}
        />

        {/* World Map [M] (x=673, y=83) */}
        <OriginalHudImageButton
          x={673}
          y={83}
          baseName="map"
          active={activeWindow === 'world_map'}
          onClick={() => onToggleWindow('world_map')}
        />

        {/* War / Nation Status [X] (x=701, y=21) */}
        <OriginalHudImageButton
          x={701}
          y={21}
          baseName="war"
          active={activeWindow === 'arena_war'}
          onClick={() => onToggleWindow('arena_war')}
        />

        {/* 6. ORIGINAL CHAT BAR (MainInterface.xml: x=102, y=4, hidden until Enter pressed) */}
        {isChatInputOpen ? (
          <div className="dr-orig-chatbar-slot" style={{ left: 102, top: 4, zIndex: 5 }}>
            <img
              src="/assets/original/ui/main/chatbar.png"
              alt=""
              draggable={false}
              style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
            />
            <img
              src="/assets/original/ui/main/chatbackground.png"
              alt=""
              draggable={false}
              style={{ position: 'absolute', left: 59, top: 4, pointerEvents: 'none' }}
            />
            <button
              type="button"
              className="dr-orig-chat-channel-btn"
              style={{ left: 63, top: 4 }}
              onClick={cycleChannel}
            >
              <img src={channelImgMap[chatChannel]} alt={chatChannel} draggable={false} />
            </button>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (chatInput.trim()) {
                  onSendChat(chatChannel, chatInput.trim());
                  setChatInput('');
                }
                if (!isChatLocked) {
                  setIsChatInputOpen(false);
                }
              }}
            >
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="dr-orig-chat-input"
                style={{ left: 188, top: 4, width: 310, height: 20 }}
              />
            </form>
            {/* RuiMainChatLockedButton (x=638 -> relative 536, y=3) */}
            <button
              type="button"
              onClick={() => {
                originalSoundEngine.playClick();
                setIsChatLocked((l) => !l);
              }}
              style={{
                position: 'absolute',
                left: 536,
                top: 3,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer'
              }}
            >
              <img
                src={
                  isChatLocked
                    ? '/assets/original/ui/main/chatlocked.png'
                    : '/assets/original/ui/main/chatunlocked.png'
                }
                alt=""
                draggable={false}
              />
            </button>
          </div>
        ) : (
          /* Invisible click area on top chat bar region so clicking it also opens chat */
          <div
            onClick={() => {
              originalSoundEngine.playClick();
              setIsChatInputOpen(true);
              window.setTimeout(() => chatInputRef.current?.focus(), 10);
            }}
            style={{
              position: 'absolute',
              left: 161,
              top: 4,
              width: 450,
              height: 24,
              cursor: 'text'
            }}
          />
        )}

        {/* 7. QUICK MAGIC SLOT (QuickMagic.xml: 43x43 anchored at BOTTOMRIGHT x=1, y=-149) */}
        <div
          className="dr-orig-quickmagic-box"
          style={{ left: 757, top: -83, width: 43, height: 43 }}
          onClick={onCastQuickSpell}
        >
          <img
            src="/assets/original/ui/main/quickmagic.png"
            alt=""
            draggable={false}
            className="dr-orig-quickmagic-frame"
          />
          {quickSpell?.iconUrl && (
            <img
              src={quickSpell.iconUrl}
              alt=""
              className="dr-orig-quickmagic-icon"
              draggable={false}
            />
          )}
        </div>

        {/* 8. EXACT LABELS FROM MainInterface.xml */}
        {/* PlayerName (x=197, y=44, w=140) */}
        <div className="dr-orig-label" style={{ left: 197, top: 44, width: 140 }}>
          {playerName}
        </div>

        {/* PlayerLevel (x=350, y=44, w=32) */}
        <div className="dr-orig-label" style={{ left: 350, top: 44, width: 32 }}>
          {level}
        </div>

        {/* PlayerHP (x=0, y=94, w=64) */}
        <div className="dr-orig-label dr-orig-label-num" style={{ left: 0, top: 94, width: 64 }}>
          {hp}/{maxHp}
        </div>

        {/* PlayerMP (x=736, y=94, w=64) */}
        <div className="dr-orig-label dr-orig-label-num" style={{ left: 736, top: 94, width: 64 }}>
          {manaVal}/{manaMax}
        </div>

        {/* ExpPercent (x=397, y=44, w=76) */}
        <div className="dr-orig-label dr-orig-label-num" style={{ left: 397, top: 44, width: 76 }}>
          {(expPct * 100).toFixed(1)}%
        </div>

        {/* Exp (x=480, y=44, w=134) */}
        <div className="dr-orig-label dr-orig-label-num" style={{ left: 480, top: 44, width: 134 }}>
          {exp.toLocaleString()} / {maxExp.toLocaleString()}
        </div>
      </div>
    </div>
  );
};
