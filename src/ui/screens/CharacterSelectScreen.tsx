import React, { useEffect, useState } from 'react';
import { soundManager } from '../../engine/SoundManager';
import { SavedCharacterProfile } from '../../systems/CharacterStorage';

interface CharacterSelectScreenProps {
  accountId: string;
  serverName: string;
  slots: Array<SavedCharacterProfile | null>;
  onStartGame: (character: SavedCharacterProfile) => void;
  onCreateCharacterInSlot: (slotIndex: number) => void;
  onDeleteCharacterInSlot: (slotIndex: number) => void;
  onBackToLogin: () => void;
}

// Exact coordinates from kh_menuset.cpp:3073-3142 (MN_SELECT_CHARACTER)
const SLOT_PANEL_POS: Array<{
  x: number;
  y: number;
  textX: number;
  textY: number;
  highlightFrame: number;
}> = [
  // Slot 0: Top-Left panel (Field 4 & Field 8)
  { x: 38, y: 20, textX: 60, textY: 53, highlightFrame: 7 },
  // Slot 1: Bottom-Left panel (Field 5 & Field 9)
  { x: 38, y: 254, textX: 60, textY: 286, highlightFrame: 8 },
  // Slot 2: Top-Right panel (Field 6 & Field 10)
  { x: 596, y: 20, textX: 617, textY: 53, highlightFrame: 9 },
  // Slot 3: Bottom-Right panel (Field 7 & Field 11)
  { x: 595, y: 254, textX: 617, textY: 286, highlightFrame: 10 }
];

const NATION_LABELS: Record<string, string> = {
  VYSEUS: 'Vyseus',
  ZYPERN: 'Zypern',
  YLLSE: 'Yllse'
};

function getClassAnimIndex(className: string): number {
  const c = (className || '').toLowerCase();
  if (c.includes('thief')) return 1;
  if (c.includes('archer')) return 2;
  if (c.includes('wizard')) return 3;
  if (c.includes('priest')) return 4;
  return 0; // WARRIOR
}

export const CharacterSelectScreen: React.FC<CharacterSelectScreenProps> = ({
  slots,
  onStartGame,
  onCreateCharacterInSlot,
  onDeleteCharacterInSlot,
  onBackToLogin
}) => {
  const [selectedSlot, setSelectedSlot] = useState<number>(() => {
    const firstValid = slots.findIndex((s) => s !== null);
    return firstValid >= 0 ? firstValid : 0;
  });
  const [animStep, setAnimStep] = useState(0);
  const [hoverBtn, setHoverBtn] = useState<'ok' | 'mid' | 'back' | null>(null);
  const [pressedBtn, setPressedBtn] = useState<'ok' | 'mid' | 'back' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    soundManager.playLoginTheme();
    const timer = window.setInterval(() => {
      setAnimStep((f) => (f + 1) % 120);
    }, 85);
    return () => window.clearInterval(timer);
  }, []);

  const currentChar = slots[selectedSlot];

  const handleOk = () => {
    soundManager.playClick();
    if (currentChar) {
      onStartGame(currentChar);
    } else {
      onCreateCharacterInSlot(selectedSlot);
    }
  };

  const handleMiddleButton = () => {
    soundManager.playClick();
    if (!currentChar) {
      onCreateCharacterInSlot(selectedSlot);
    } else {
      setConfirmDelete(true);
    }
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
      {/* Pure 800x600 Original NewSelectCharacter.dat[0] Screen */}
      <div
        style={{
          position: 'relative',
          width: 800,
          height: 600,
          backgroundImage: `url('/api/data0/sprite?path=images/ui/legacy/localized/en/newselectcharacter.dat&frame=0')`,
          backgroundSize: '800px 600px',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          overflow: 'hidden'
        }}
      >
        {/* 4 Character Slot Boxes (kh_menuset.cpp:3073-3142) */}
        {SLOT_PANEL_POS.map((panel, idx) => {
          const char = slots[idx];
          const isSelected = selectedSlot === idx;
          return (
            <React.Fragment key={idx}>
              <div
                onClick={() => {
                  soundManager.playClick();
                  setSelectedSlot(idx);
                  setAnimStep(0);
                }}
                onDoubleClick={() => {
                  soundManager.playClick();
                  if (char) {
                    onStartGame(char);
                  } else {
                    onCreateCharacterInSlot(idx);
                  }
                }}
                style={{
                  position: 'absolute',
                  left: panel.x,
                  top: panel.y,
                  width: 155,
                  height: 219,
                  backgroundImage: isSelected
                    ? `url('/api/data0/sprite?path=images/ui/legacy/localized/en/newselectcharacter.dat&frame=${panel.highlightFrame}')`
                    : 'none',
                  backgroundSize: '155px 219px',
                  backgroundRepeat: 'no-repeat',
                  cursor: 'pointer',
                  zIndex: 5
                }}
              />
              {/* DP_NAME_SELECT text fields (MenuStart.cpp: case DP_NAME_SELECT) */}
              {char && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 800,
                    height: 600,
                    pointerEvents: 'none',
                    fontFamily: 'Tahoma, sans-serif',
                    fontSize: 11,
                    color: isSelected ? '#ffffff' : '#d8d0c5',
                    textShadow: '1px 1px 0 #000',
                    zIndex: 6
                  }}
                >
                  {/* NAME: (textX, textY) */}
                  <div style={{ position: 'absolute', left: panel.textX, top: panel.textY - 2 }}>
                    {char.name}
                  </div>
                  {/* JOB: (textX, textY + 35) */}
                  <div style={{ position: 'absolute', left: panel.textX, top: panel.textY + 33 }}>
                    {char.primaryJob.toUpperCase()}
                  </div>
                  {/* CLASS: (textX + 52, textY + 57) */}
                  <div style={{ position: 'absolute', left: panel.textX + 52, top: panel.textY + 55 }}>
                    {char.className.toUpperCase()}
                  </div>
                  {/* AGE: (textX + 52, textY + 78) */}
                  <div style={{ position: 'absolute', left: panel.textX + 52, top: panel.textY + 76 }}>
                    18
                  </div>
                  {/* LEVEL: (textX + 52, textY + 101) */}
                  <div style={{ position: 'absolute', left: panel.textX + 52, top: panel.textY + 99 }}>
                    {char.level}
                  </div>
                  {/* NATION: (textX, textY + 140) */}
                  <div style={{ position: 'absolute', left: panel.textX, top: panel.textY + 138 }}>
                    {NATION_LABELS[char.nation] || char.nation}
                  </div>
                  {/* CRIT (nMoney): (textX, textY + 163) */}
                  <div style={{ position: 'absolute', left: panel.textX, top: panel.textY + 161 }}>
                    {(char.gold ?? 1000).toLocaleString()}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* PutTestAnimation (SmallMenu.cpp:313060) — Big 3D Pre-rendered Character Showcase at center stage (400, 300) */}
        {currentChar && (() => {
          const genderNum = currentChar.gender === 'female' ? 0 : 1;
          const classIdx = getClassAnimIndex(currentChar.className);
          return (
            <div
              onDoubleClick={() => {
                soundManager.playClick();
                onStartGame(currentChar);
              }}
              style={{
                position: 'absolute',
                left: 400 - 180,
                top: 300 - 220,
                width: 360,
                height: 440,
                cursor: 'pointer',
                zIndex: 4
              }}
            >
              <img
                src={`/api/data0/sprite?path=charanibig/${genderNum}/${classIdx}&frame=${animStep}`}
                alt={currentChar.name}
                draggable={false}
                style={{
                  width: 360,
                  height: 440,
                  imageRendering: 'pixelated'
                }}
              />
            </div>
          );
        })()}

        {/* Field 0: OK Button (x=94, y=506, w=199, h=62) -> hover=frame 6, press=frame 1 (kh_menuset.cpp:3060) */}
        <div
          onMouseEnter={() => {
            soundManager.playTouch();
            setHoverBtn('ok');
          }}
          onMouseLeave={() => {
            setHoverBtn(null);
            setPressedBtn(null);
          }}
          onMouseDown={() => setPressedBtn('ok')}
          onMouseUp={() => setPressedBtn(null)}
          onClick={handleOk}
          style={{
            position: 'absolute',
            left: 94,
            top: 506,
            width: 199,
            height: 62,
            backgroundImage:
              pressedBtn === 'ok'
                ? `url('/api/data0/sprite?path=images/ui/legacy/localized/en/newselectcharacter.dat&frame=1')`
                : hoverBtn === 'ok'
                ? `url('/api/data0/sprite?path=images/ui/legacy/localized/en/newselectcharacter.dat&frame=6')`
                : 'none',
            backgroundSize: '199px 62px',
            backgroundRepeat: 'no-repeat',
            cursor: 'pointer',
            zIndex: 10
          }}
        />

        {/* Field 3 & Field 2: DELETE CHARACTER (slot has char: hover=5, press=2) OR MAKE CHARACTER (slot empty: normal=11, hover=12, press=13) at (x=295, y=506, w=199, h=62) */}
        <div
          onMouseEnter={() => {
            soundManager.playTouch();
            setHoverBtn('mid');
          }}
          onMouseLeave={() => {
            setHoverBtn(null);
            setPressedBtn(null);
          }}
          onMouseDown={() => setPressedBtn('mid')}
          onMouseUp={() => setPressedBtn(null)}
          onClick={handleMiddleButton}
          style={{
            position: 'absolute',
            left: 295,
            top: 506,
            width: 199,
            height: 62,
            backgroundImage: !currentChar
              ? pressedBtn === 'mid'
                ? `url('/api/data0/sprite?path=images/ui/legacy/localized/en/newselectcharacter.dat&frame=13')`
                : hoverBtn === 'mid'
                ? `url('/api/data0/sprite?path=images/ui/legacy/localized/en/newselectcharacter.dat&frame=12')`
                : `url('/api/data0/sprite?path=images/ui/legacy/localized/en/newselectcharacter.dat&frame=11')`
              : pressedBtn === 'mid'
              ? `url('/api/data0/sprite?path=images/ui/legacy/localized/en/newselectcharacter.dat&frame=2')`
              : hoverBtn === 'mid'
              ? `url('/api/data0/sprite?path=images/ui/legacy/localized/en/newselectcharacter.dat&frame=5')`
              : 'none',
            backgroundSize: '199px 62px',
            backgroundRepeat: 'no-repeat',
            cursor: 'pointer',
            zIndex: 10
          }}
        />

        {/* Field 1: BACK Button (x=496, y=506, w=199, h=62) -> hover=frame 4, press=frame 3 (kh_menuset.cpp:3066) */}
        <div
          onMouseEnter={() => {
            soundManager.playTouch();
            setHoverBtn('back');
          }}
          onMouseLeave={() => {
            setHoverBtn(null);
            setPressedBtn(null);
          }}
          onMouseDown={() => setPressedBtn('back')}
          onMouseUp={() => setPressedBtn(null)}
          onClick={() => {
            soundManager.playClick();
            onBackToLogin();
          }}
          style={{
            position: 'absolute',
            left: 496,
            top: 506,
            width: 199,
            height: 62,
            backgroundImage:
              pressedBtn === 'back'
                ? `url('/api/data0/sprite?path=images/ui/legacy/localized/en/newselectcharacter.dat&frame=3')`
                : hoverBtn === 'back'
                ? `url('/api/data0/sprite?path=images/ui/legacy/localized/en/newselectcharacter.dat&frame=4')`
                : 'none',
            backgroundSize: '199px 62px',
            backgroundRepeat: 'no-repeat',
            cursor: 'pointer',
            zIndex: 10
          }}
        />

        {/* Original Delete Character Confirm Popup: images/ui/legacy/localized/en/delcharcomform.dat[0] (320x351) */}
        {confirmDelete && currentChar && (
          <div
            style={{
              position: 'absolute',
              left: 240,
              top: 124,
              width: 320,
              height: 351,
              backgroundImage: `url('/api/data0/sprite?path=images/ui/legacy/localized/en/delcharcomform.dat&frame=0')`,
              backgroundSize: '320px 351px',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
              zIndex: 25
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 40,
                top: 145,
                width: 240,
                textAlign: 'center',
                color: '#ffff88',
                fontFamily: 'Tahoma, sans-serif',
                fontSize: 12,
                textShadow: '1px 1px 0 #000'
              }}
            >
              Delete {currentChar.name}?
            </div>
            {/* OK button */}
            <div
              onClick={() => {
                soundManager.playClick();
                onDeleteCharacterInSlot(selectedSlot);
                setConfirmDelete(false);
              }}
              style={{
                position: 'absolute',
                left: 72,
                top: 295,
                width: 77,
                height: 24,
                backgroundImage: `url('/api/data0/sprite?path=images/ui/legacy/localized/en/delcharcomform.dat&frame=1')`,
                cursor: 'pointer'
              }}
            />
            {/* Cancel button */}
            <div
              onClick={() => {
                soundManager.playClick();
                setConfirmDelete(false);
              }}
              style={{
                position: 'absolute',
                left: 171,
                top: 295,
                width: 77,
                height: 24,
                backgroundImage: `url('/api/data0/sprite?path=images/ui/legacy/localized/en/delcharcomform.dat&frame=3')`,
                cursor: 'pointer'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
