import React, { useState } from 'react';
import { originalSoundEngine } from '../../audio/OriginalSoundEngine';
import { GameOptionsState } from '../../types/game';

interface OptionMenuWindowProps {
  options: GameOptionsState;
  isMounted: boolean;
  onUpdateOptions: (next: GameOptionsState) => void;
  onToggleMount: () => void;
  onMoveToHometown?: () => void;
  onLogOut?: () => void;
  onClose: () => void;
}

const NEWSYSTEM_DAT = 'images/ui/legacy/localized/en/newsystem.dat';
const newSystemSprite = (frame: number) =>
  `/api/data0/sprite?path=${encodeURIComponent(NEWSYSTEM_DAT)}&frame=${frame}`;

export const OptionMenuWindow: React.FC<OptionMenuWindowProps> = ({
  options,
  onUpdateOptions,
  onMoveToHometown,
  onLogOut,
  onClose
}) => {
  // In kh_menuset.cpp:3887, pressing O or clicking Option on HUD opens MN_SYSTEM (NewSystem.dat[0], 175x187).
  // Clicking "Option" inside MN_SYSTEM opens MN_SYSTEM_OPTION (SysMenu.dat[764], 286x351).
  const [subView, setSubView] = useState<'system' | 'option' | 'help'>('system');
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const [cancelHover, setCancelHover] = useState(false);
  const [cancelPress, setCancelPress] = useState(false);

  const [soundVol, setSoundVol] = useState(() =>
    options.soundEnabled ? Math.round((options.sfxVolume ?? 0.65) * 100) : 0
  );
  const [musicVol, setMusicVol] = useState(() =>
    options.soundEnabled ? Math.round((options.musicVolume ?? 0.45) * 100) : 0
  );
  const [mouseSpeed, setMouseSpeed] = useState(65);
  const [scrollSpeed, setScrollSpeed] = useState(60);
  const [checks, setChecks] = useState({
    gore: options.goreEffects ?? true,
    counter: options.showFloatingDamage ?? true,
    action: options.autoClicker.enabled,
    whisper: true
  });

  const applyVolumes = (nextMusicPct: number, nextSoundPct: number) => {
    const enabled = nextMusicPct > 0 || nextSoundPct > 0;
    const mVol = Math.max(0, Math.min(1, nextMusicPct / 100));
    const sVol = Math.max(0, Math.min(1, nextSoundPct / 100));
    originalSoundEngine.enabled = enabled;
    originalSoundEngine.setVolumes(mVol, sVol);
    onUpdateOptions({
      ...options,
      soundEnabled: enabled,
      musicVolume: mVol,
      sfxVolume: sVol
    });
  };

  // 1. MN_SYSTEM (kh_menuset.cpp:3887 - NewSystem.dat[0], 175x187 at x=295, y=117)
  if (subView === 'system') {
    const systemRows: Array<{ idx: number; y: number; action: () => void }> = [
      // Field 4: Move to Hometown (27, 46, 121x20)
      {
        idx: 0,
        y: 46,
        action: () => {
          originalSoundEngine.playClick();
          onMoveToHometown?.();
          onClose();
        }
      },
      // Field 0: Option -> MN_SYSTEM_OPTION (27, 70, 121x20)
      {
        idx: 1,
        y: 70,
        action: () => {
          originalSoundEngine.playMenuOpen();
          setSubView('option');
        }
      },
      // Field 1: Help -> SWD_HELP (27, 94, 121x20)
      {
        idx: 2,
        y: 94,
        action: () => {
          originalSoundEngine.playMenuOpen();
          setSubView('help');
        }
      },
      // Field 2: Log Out -> MN_SYSTEM_LOGOUT (27, 118, 121x20)
      {
        idx: 3,
        y: 118,
        action: () => {
          originalSoundEngine.playMenuClose();
          if (onLogOut) {
            onLogOut();
          } else {
            onClose();
          }
        }
      }
    ];

    return (
      <div
        className="dr-orig-1to1-frame"
        style={{
          position: 'fixed',
          left: 'calc(50vw - 88px)',
          top: 'max(40px, calc(50vh - 150px))',
          width: 175,
          height: 187,
          backgroundImage: `url('${newSystemSprite(0)}')`,
          backgroundSize: '175px 187px',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          zIndex: 85,
          userSelect: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => {
          e.preventDefault();
          originalSoundEngine.playMenuClose();
          onClose();
        }}
      >
        {systemRows.map((row) => (
          <div
            key={row.idx}
            onMouseEnter={() => {
              setHoverRow(row.idx);
              originalSoundEngine.playTouch();
            }}
            onMouseLeave={() => setHoverRow(null)}
            onClick={row.action}
            style={{
              position: 'absolute',
              left: 27,
              top: row.y,
              width: 121,
              height: 20,
              cursor: 'pointer'
            }}
          >
            {hoverRow === row.idx && (
              <img
                src={newSystemSprite(1)}
                alt=""
                draggable={false}
                style={{
                  width: 121,
                  height: 20,
                  imageRendering: 'pixelated',
                  pointerEvents: 'none'
                }}
              />
            )}
          </div>
        ))}

        {/* Field 3: SWD_SMALLMENU_END (Cancel / Close at 49, 152, 75x27, NewSystem.dat[2]/[3]) */}
        <div
          onMouseEnter={() => {
            setCancelHover(true);
            originalSoundEngine.playTouch();
          }}
          onMouseLeave={() => {
            setCancelHover(false);
            setCancelPress(false);
          }}
          onMouseDown={() => setCancelPress(true)}
          onMouseUp={() => setCancelPress(false)}
          onClick={() => {
            originalSoundEngine.playMenuClose();
            onClose();
          }}
          style={{
            position: 'absolute',
            left: 49,
            top: 152,
            width: 75,
            height: 27,
            cursor: 'pointer'
          }}
        >
          {(cancelHover || cancelPress) && (
            <img
              src={newSystemSprite(cancelPress ? 3 : 2)}
              alt=""
              draggable={false}
              style={{
                width: 75,
                height: 27,
                imageRendering: 'pixelated',
                pointerEvents: 'none'
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // 2. SWD_HELP (Original Dragon Raja Key Guide Book - SysMenu.dat[218] 389x236)
  if (subView === 'help') {
    return (
      <div
        className="dr-orig-1to1-frame"
        style={{
          position: 'fixed',
          left: 'calc(50vw - 194px)',
          top: 'max(30px, calc(50vh - 150px))',
          width: 389,
          height: 236,
          backgroundImage: `url('/assets/original/ui/windows/quest_dialog_bg.png')`,
          backgroundSize: '389px 236px',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          zIndex: 85,
          userSelect: 'none',
          fontFamily: 'Tahoma, sans-serif',
          fontSize: 11,
          color: '#2b1b0e'
        }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => {
          e.preventDefault();
          originalSoundEngine.playMenuClose();
          setSubView('system');
        }}
      >
        <div
          onClick={() => {
            originalSoundEngine.playMenuClose();
            setSubView('system');
          }}
          style={{
            position: 'absolute',
            left: 0,
            top: 20,
            width: 42,
            height: 40,
            cursor: 'pointer'
          }}
        />
        <div style={{ position: 'absolute', left: 32, top: 28, width: 148, lineHeight: 1.55 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>[SHORTCUT KEYS]</div>
          <div>[Q] Status / Ability</div>
          <div>[W] Item / Equip Bag</div>
          <div>[E] Party Menu</div>
          <div>[A] Magic / Orison Book</div>
          <div>[S] Combat Skills</div>
          <div>[D] Job Skill Book</div>
          <div>[F] Friend List</div>
          <div>[O] System / Option</div>
        </div>
        <div style={{ position: 'absolute', left: 206, top: 28, width: 152, lineHeight: 1.55 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>[COMBAT &amp; CONTROLS]</div>
          <div>[TAB] Peace / Battle Mode</div>
          <div>[1-5] Quick Belt Items</div>
          <div>[M] World Map</div>
          <div>[L] Mail Box</div>
          <div>[Ctrl+Z] Today&apos;s Notice</div>
          <div>[Enter] Chat Bar</div>
          <div>[Left Click] Move / Attack</div>
          <div>[Right Click] Cast Quick Spell</div>
        </div>
      </div>
    );
  }

  // 3. MN_SYSTEM_OPTION (SmallMenuSet.cpp:136 - SysMenu.dat[764], 286x351)
  const sliders = [
    {
      label: 'sound',
      y: 82,
      val: soundVol,
      setVal: (v: number) => {
        setSoundVol(v);
        applyVolumes(musicVol, v);
        originalSoundEngine.playClick();
      }
    },
    {
      label: 'music',
      y: 108,
      val: musicVol,
      setVal: (v: number) => {
        setMusicVol(v);
        applyVolumes(v, soundVol);
      }
    },
    { label: 'mouse', y: 134, val: mouseSpeed, setVal: setMouseSpeed },
    { label: 'scroll', y: 160, val: scrollSpeed, setVal: setScrollSpeed }
  ];

  const checkPositions: Array<{ key: keyof typeof checks; x: number }> = [
    { key: 'gore', x: 35 },
    { key: 'counter', x: 96 },
    { key: 'action', x: 158 },
    { key: 'whisper', x: 221 }
  ];

  return (
    <div
      className="dr-orig-1to1-frame"
      style={{
        position: 'fixed',
        left: 'calc(50vw - 143px)',
        top: 'max(15px, calc(50vh - 220px))',
        width: 286,
        height: 351,
        backgroundImage: `url('/assets/original/ui/windows/option_orig_bg.png')`,
        backgroundSize: '286px 351px',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        zIndex: 85,
        userSelect: 'none'
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault();
        originalSoundEngine.playMenuClose();
        setSubView('system');
      }}
    >
      {/* 4 Engraved Sliders: SOUND EFFECT (y=82), MUSIC (y=108), MOUSE SPEED (y=134), SCROLL SPEED (y=160) */}
      {sliders.map((sl) => (
        <React.Fragment key={sl.label}>
          <div
            onClick={() => sl.setVal(Math.max(0, sl.val - 10))}
            style={{
              position: 'absolute',
              left: 118,
              top: sl.y,
              width: 14,
              height: 16,
              cursor: 'pointer'
            }}
          />
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = Math.max(
                0,
                Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100))
              );
              sl.setVal(pct);
            }}
            style={{
              position: 'absolute',
              left: 135,
              top: sl.y + 2,
              width: 86,
              height: 11,
              cursor: 'pointer'
            }}
          >
            <div
              style={{
                width: `${sl.val}%`,
                height: '100%',
                backgroundColor: '#c9a654'
              }}
            />
          </div>
          <div
            onClick={() => sl.setVal(Math.min(100, sl.val + 10))}
            style={{
              position: 'absolute',
              left: 224,
              top: sl.y,
              width: 14,
              height: 16,
              cursor: 'pointer'
            }}
          />
        </React.Fragment>
      ))}

      {/* 4 Engraved GAME DISPLAY Checkboxes: GORE, COUNTER, ACTION, WHISPER (y=227) */}
      {checkPositions.map((cb) => {
        const checked = checks[cb.key];
        return (
          <div
            key={cb.key}
            onClick={() => {
              originalSoundEngine.playClick();
              const nextVal = !checked;
              setChecks((prev) => ({ ...prev, [cb.key]: nextVal }));
              if (cb.key === 'action') {
                onUpdateOptions({
                  ...options,
                  autoClicker: { ...options.autoClicker, enabled: nextVal }
                });
              } else if (cb.key === 'gore') {
                onUpdateOptions({ ...options, goreEffects: nextVal });
              } else if (cb.key === 'counter') {
                onUpdateOptions({ ...options, showFloatingDamage: nextVal });
              }
            }}
            style={{
              position: 'absolute',
              left: cb.x,
              top: 226,
              width: 18,
              height: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffff66',
              fontSize: 12,
              fontWeight: 700
            }}
          >
            {checked ? '✓' : ''}
          </div>
        );
      })}

      {/* Native O K Button Hotspot at bottom (108, 286, 68x26) */}
      <div
        onClick={() => {
          originalSoundEngine.playMenuClose();
          onClose();
        }}
        style={{
          position: 'absolute',
          left: 108,
          top: 286,
          width: 68,
          height: 26,
          cursor: 'pointer'
        }}
      />
    </div>
  );
};
