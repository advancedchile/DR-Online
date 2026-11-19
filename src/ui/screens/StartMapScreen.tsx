import React, { useState } from 'react';
import { SavedCharacterProfile } from '../../systems/CharacterStorage';
import { soundManager } from '../../engine/SoundManager';

interface StartMapScreenProps {
  character: SavedCharacterProfile;
  /** If true, opens with MN_SELECT_TUTORIAL_LOGIN modal active (for new/level<=7 characters) */
  initialShowTutorialModal?: boolean;
  /** If true, hides MN_SELECT_TUTORIAL_LOGIN and shows city selection directly (e.g. when graduating from SCHOLIUM) */
  forceCitySelectionOnly?: boolean;
  onConnectToMap: (mapId: string, tileX: number, tileY: number) => void;
  onBack: () => void;
}

const NEW_SELECT_MAP = (frame: number) =>
  `/api/data0/sprite?path=images/ui/legacy/localized/en/NewSelectMap.dat&frame=${frame}`;
const START_MAP = (frame: number) =>
  `/api/data0/sprite?path=images/ui/legacy/start_map.dat&frame=${frame}`;
const TUTORIAL_IMG = (frame: number) =>
  `/api/data0/sprite?path=images/ui/legacy/localized/en/SelectLoginTutorial.dat&frame=${frame}`;

interface SelectableCityDef {
  id: string;
  scCode: number;
  name: string;
  nation: string;
  mapId: string;
  spawnX: number;
  spawnZ: number;
  x: number;
  y: number;
  checkLeft: number;
  checkTop: number;
  checkRight: number;
  checkBottom: number;
  imageB: number;
  imageC: number;
}

/**
 * Exact city definitions from kh_menuset.cpp:2835-2960 (MN_START_MAP FT_SELECT_CITY)
 * and DragonServer.cpp:800-908 (StartMapPosition)
 */
const SELECTABLE_CITIES: SelectableCityDef[] = [
  {
    id: 'helternt',
    scCode: 0, // SC_HELTERNT_VILLAGE
    name: 'Helternt Village',
    nation: 'Byseus',
    mapId: 'MA-IN',
    spawnX: 247,
    spawnZ: 107,
    x: 44,
    y: 112,
    checkLeft: 64,
    checkTop: 132,
    checkRight: 121,
    checkBottom: 185,
    imageB: 7,
    imageC: 17,
  },
  {
    id: 'baisus_impel',
    scCode: 2, // SC_BAISUS_IMPEL
    name: 'Byseus Impel',
    nation: 'Byseus',
    mapId: 'BIS_I',
    spawnX: 253,
    spawnZ: 449,
    x: 290,
    y: 221,
    checkLeft: 310,
    checkTop: 241,
    checkRight: 367,
    checkBottom: 294,
    imageB: 8,
    imageC: 18,
  },
  {
    id: 'renus',
    scCode: 5, // SC_RENUS
    name: 'Renus City',
    nation: 'Zypern',
    mapId: 'RENES_C',
    spawnX: 200,
    spawnZ: 165,
    x: 156,
    y: 158,
    checkLeft: 176,
    checkTop: 178,
    checkRight: 233,
    checkBottom: 231,
    imageB: 9,
    imageC: 19,
  },
  {
    id: 'barantan',
    scCode: 7, // SC_BARANTAN
    name: 'Barantan',
    nation: 'Yllse',
    mapId: 'barantan',
    spawnX: 329,
    spawnZ: 95,
    x: 520,
    y: 225,
    checkLeft: 520,
    checkTop: 243,
    checkRight: 610,
    checkBottom: 313,
    imageB: 5,
    imageC: 6,
  },
  {
    id: 'iramus',
    scCode: 10, // SC_IRAMUS
    name: 'Iramus',
    nation: 'Zypern',
    mapId: 'IRAMUS',
    spawnX: 92,
    spawnZ: 67,
    x: 219,
    y: 187,
    checkLeft: 239,
    checkTop: 207,
    checkRight: 296,
    checkBottom: 260,
    imageB: 11,
    imageC: 21,
  },
  {
    id: 'diph_uben',
    scCode: 11, // SC_DIPH_UBEN
    name: 'Diph Uben',
    nation: 'Zypern',
    mapId: 'DEP',
    spawnX: 276,
    spawnZ: 360,
    x: 151,
    y: 382,
    checkLeft: 171,
    checkTop: 402,
    checkRight: 228,
    checkBottom: 455,
    imageB: 12,
    imageC: 22,
  },
  {
    id: 'tyren',
    scCode: 13, // SC_TYREN
    name: 'Tyren',
    nation: 'Zypern',
    mapId: 'TYNEN',
    spawnX: 445,
    spawnZ: 260,
    x: 82,
    y: 334,
    checkLeft: 102,
    checkTop: 354,
    checkRight: 159,
    checkBottom: 407,
    imageB: 10,
    imageC: 28,
  },
];

export const StartMapScreen: React.FC<StartMapScreenProps> = ({
  character,
  initialShowTutorialModal,
  forceCitySelectionOnly = false,
  onConnectToMap,
  onBack,
}) => {
  // Determine default selected city based on character's current map or nation
  const defaultCityId = (() => {
    const found = SELECTABLE_CITIES.find(
      (c) => c.mapId.toLowerCase() === (character.mapId || '').toLowerCase()
    );
    if (found) return found.id;
    if (character.nation === 'Yllse') return 'barantan';
    if (character.nation === 'Vyseus') return 'helternt';
    return 'renus';
  })();

  const [selectedCityId, setSelectedCityId] = useState<string>(defaultCityId);
  const [hoveredCityId, setHoveredCityId] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<'back' | 'connect' | 'recent' | null>(null);
  const [pressedBtn, setPressedBtn] = useState<'back' | 'connect' | 'recent' | null>(null);

  // In original DragonRaja (MenuStart.cpp:2415 / kh_menuset.cpp:3276), characters with Level <= 7
  // are prompted with MN_SELECT_TUTORIAL_LOGIN (Beginner Tutorial SCHOLIUM, Novice Ground SCHOLIUM2, or Village)
  const shouldShowTutorialModal =
    !forceCitySelectionOnly &&
    (initialShowTutorialModal ?? (character.level <= 7 || character.mapId?.toLowerCase() === 'scholium'));

  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(shouldShowTutorialModal);
  // 0 = SC_SCHOLIUM (Beginner Tutorial), 1 = SC_SCHOLIUM2 (Novice Ground), 2 = -1 (Select Starting Village)
  const [tutorialOption, setTutorialOption] = useState<0 | 1 | 2>(0);
  const [hoveredTutBtn, setHoveredTutBtn] = useState<'ok' | 'cancel' | null>(null);
  const [pressedTutBtn, setPressedTutBtn] = useState<'ok' | 'cancel' | null>(null);

  const selectedCity =
    SELECTABLE_CITIES.find((c) => c.id === selectedCityId) || SELECTABLE_CITIES[2];

  const handleConnectSelectedCity = () => {
    soundManager.playClick();
    // If character is level <= 7 and hasn't dismissed tutorial modal yet, open tutorial modal unless forceCitySelectionOnly
    onConnectToMap(selectedCity.mapId, selectedCity.spawnX, selectedCity.spawnZ);
  };

  const handleRecentLogout = () => {
    soundManager.playClick();
    if (
      character.mapId &&
      character.mapId.toLowerCase() !== 'scholium' &&
      character.mapId.toLowerCase() !== 'scholium2'
    ) {
      onConnectToMap(character.mapId, character.tileX || 200, character.tileY || 165);
    } else {
      onConnectToMap(selectedCity.mapId, selectedCity.spawnX, selectedCity.spawnZ);
    }
  };

  const handleTutorialOk = () => {
    soundManager.playClick();
    if (tutorialOption === 0) {
      // SC_SCHOLIUM: Beginner Tutorial (StartMapPosition xy_pos_basic[33] = 4, 23 / 18, 22)
      onConnectToMap('scholium', 18, 22);
    } else if (tutorialOption === 1) {
      // SC_SCHOLIUM2: Novice Training Ground (StartMapPosition xy_pos_basic[34] = 124, 74)
      onConnectToMap('scholium2', 124, 74);
    } else {
      // -1: Let player choose their starting city on MN_START_MAP
      setShowTutorialModal(false);
    }
  };

  const handleTutorialCancel = () => {
    soundManager.playClick();
    setShowTutorialModal(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        zIndex: 1000,
      }}
    >
      {/* MN_START_MAP: 800x600 container */}
      <div
        style={{
          position: 'relative',
          width: 800,
          height: 600,
          backgroundImage: `url("${NEW_SELECT_MAP(0)}")`,
          backgroundSize: '800px 600px',
          backgroundRepeat: 'no-repeat',
          overflow: 'hidden',
        }}
      >
        {/* 7 Selectable Cities (FT_SELECT_CITY in MenuStart.cpp:2895-2980) */}
        {SELECTABLE_CITIES.map((city) => {
          const isSelected = selectedCityId === city.id;
          const isHovered = hoveredCityId === city.id;
          const showHighlight = isSelected || isHovered;

          return (
            <React.Fragment key={city.id}>
              {/* Highlighted building artwork (start_map.dat[image_b] at x, y) + city name banner (start_map.dat[image_c] at x+20, y+20) */}
              {showHighlight && (
                <>
                  <img
                    src={START_MAP(city.imageB)}
                    alt={city.name}
                    draggable={false}
                    style={{
                      position: 'absolute',
                      left: city.x,
                      top: city.y,
                      pointerEvents: 'none',
                      imageRendering: 'pixelated',
                    }}
                  />
                  <img
                    src={START_MAP(city.imageC)}
                    alt={`${city.name} label`}
                    draggable={false}
                    style={{
                      position: 'absolute',
                      left: city.x + 20,
                      top: city.y + 20,
                      pointerEvents: 'none',
                      imageRendering: 'pixelated',
                      zIndex: 3,
                    }}
                  />
                </>
              )}

              {/* City marker pin (start_map.dat[29], 19x19 with ox=10, oy=9 -> drawn at checkLeft-10, checkTop-9) */}
              <img
                src={START_MAP(29)}
                alt=""
                draggable={false}
                style={{
                  position: 'absolute',
                  left: city.checkLeft - 10,
                  top: city.checkTop - 9,
                  pointerEvents: 'none',
                  imageRendering: 'pixelated',
                  zIndex: 2,
                }}
              />

              {/* Hitbox rCheakBox */}
              <div
                onMouseEnter={() => {
                  setHoveredCityId(city.id);
                  soundManager.playTouch();
                }}
                onMouseLeave={() => setHoveredCityId((prev) => (prev === city.id ? null : prev))}
                onClick={() => {
                  soundManager.playClick();
                  setSelectedCityId(city.id);
                }}
                onDoubleClick={() => {
                  soundManager.playClick();
                  onConnectToMap(city.mapId, city.spawnX, city.spawnZ);
                }}
                title={`${city.name} (${city.nation})`}
                style={{
                  position: 'absolute',
                  left: city.checkLeft,
                  top: city.checkTop,
                  width: city.checkRight - city.checkLeft,
                  height: city.checkBottom - city.checkTop,
                  zIndex: 4,
                }}
              />
            </React.Fragment>
          );
        })}

        {/* Selected City Indicator text at top-right map banner */}
        <div
          style={{
            position: 'absolute',
            left: 520,
            top: 22,
            width: 250,
            textAlign: 'right',
            fontFamily: 'Tahoma, sans-serif',
            fontSize: 12,
            color: '#f5e19c',
            textShadow: '1px 1px 1px #000',
            pointerEvents: 'none',
          }}
        >
          Destination: <b>{selectedCity.name}</b> ({selectedCity.nation})
        </div>

        {/* Bottom Buttons (kh_menuset.cpp:2815-2828):
            field[0] BACK: x=99, y=523, w=200, h=62, press=1 (ox=1), hover=2
            field[1] CONNECT: x=300, y=523, w=200, h=62, press=3, hover=4
            field[2] RECENT LOGOUT: x=501, y=523, w=200, h=62, press=5 (ox=1), hover=6 */}
        {/* BACK (99, 523) */}
        <div
          onMouseEnter={() => {
            setHoveredBtn('back');
            soundManager.playTouch();
          }}
          onMouseLeave={() => {
            setHoveredBtn(null);
            setPressedBtn(null);
          }}
          onMouseDown={() => setPressedBtn('back')}
          onMouseUp={() => setPressedBtn(null)}
          onClick={() => {
            soundManager.playClick();
            onBack();
          }}
          style={{
            position: 'absolute',
            left: 99,
            top: 523,
            width: 200,
            height: 62,
            zIndex: 5,
          }}
        >
          {(hoveredBtn === 'back' || pressedBtn === 'back') && (
            <img
              src={NEW_SELECT_MAP(pressedBtn === 'back' ? 1 : 2)}
              alt="Back"
              draggable={false}
              style={{
                position: 'absolute',
                left: pressedBtn === 'back' ? -1 : 0,
                top: 0,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* CONNECT (300, 523) */}
        <div
          onMouseEnter={() => {
            setHoveredBtn('connect');
            soundManager.playTouch();
          }}
          onMouseLeave={() => {
            setHoveredBtn(null);
            setPressedBtn(null);
          }}
          onMouseDown={() => setPressedBtn('connect')}
          onMouseUp={() => setPressedBtn(null)}
          onClick={handleConnectSelectedCity}
          style={{
            position: 'absolute',
            left: 300,
            top: 523,
            width: 200,
            height: 62,
            zIndex: 5,
          }}
        >
          {(hoveredBtn === 'connect' || pressedBtn === 'connect') && (
            <img
              src={NEW_SELECT_MAP(pressedBtn === 'connect' ? 3 : 4)}
              alt="Connect"
              draggable={false}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* RECENT LOGOUT (501, 523) */}
        <div
          onMouseEnter={() => {
            setHoveredBtn('recent');
            soundManager.playTouch();
          }}
          onMouseLeave={() => {
            setHoveredBtn(null);
            setPressedBtn(null);
          }}
          onMouseDown={() => setPressedBtn('recent')}
          onMouseUp={() => setPressedBtn(null)}
          onClick={handleRecentLogout}
          style={{
            position: 'absolute',
            left: 501,
            top: 523,
            width: 200,
            height: 62,
            zIndex: 5,
          }}
        >
          {(hoveredBtn === 'recent' || pressedBtn === 'recent') && (
            <img
              src={NEW_SELECT_MAP(pressedBtn === 'recent' ? 5 : 6)}
              alt="Recent Logout"
              draggable={false}
              style={{
                position: 'absolute',
                left: pressedBtn === 'recent' ? -1 : 0,
                top: 0,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* MN_SELECT_TUTORIAL_LOGIN modal (kh_menuset.cpp:3276-3295)
            Position: (301, 100), Base frame: SelectLoginTutorial.dat[0] (197x207) */}
        {showTutorialModal && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              zIndex: 20,
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 301,
                top: 100,
                width: 197,
                height: 207,
                backgroundImage: `url("${TUTORIAL_IMG(0)}")`,
                backgroundSize: '197px 207px',
                backgroundRepeat: 'no-repeat',
              }}
            >
              {/* Selection highlight bar: SelectLoginTutorial.dat[1] (132x20)
                  Option 0 (SC_SCHOLIUM): (31, 57)
                  Option 1 (SC_SCHOLIUM2): (31, 86)
                  Option 2 (-1 Village): (31, 117) */}
              <img
                src={TUTORIAL_IMG(1)}
                alt=""
                draggable={false}
                style={{
                  position: 'absolute',
                  left: 31,
                  top: tutorialOption === 0 ? 57 : tutorialOption === 1 ? 86 : 117,
                  width: 132,
                  height: 20,
                  pointerEvents: 'none',
                }}
              />

              {/* Option 0 hitbox: Beginner Tutorial (SC_SCHOLIUM) */}
              <div
                onClick={() => {
                  soundManager.playClick();
                  setTutorialOption(0);
                }}
                onDoubleClick={() => {
                  soundManager.playClick();
                  onConnectToMap('scholium', 18, 22);
                }}
                style={{
                  position: 'absolute',
                  left: 31,
                  top: 57,
                  width: 132,
                  height: 20,
                }}
              />

              {/* Option 1 hitbox: Novice Hunting Ground (SC_SCHOLIUM2) */}
              <div
                onClick={() => {
                  soundManager.playClick();
                  setTutorialOption(1);
                }}
                onDoubleClick={() => {
                  soundManager.playClick();
                  onConnectToMap('scholium2', 124, 74);
                }}
                style={{
                  position: 'absolute',
                  left: 31,
                  top: 86,
                  width: 132,
                  height: 20,
                }}
              />

              {/* Option 2 hitbox: Connect to Village (-1) */}
              <div
                onClick={() => {
                  soundManager.playClick();
                  setTutorialOption(2);
                }}
                onDoubleClick={() => {
                  soundManager.playClick();
                  setShowTutorialModal(false);
                }}
                style={{
                  position: 'absolute',
                  left: 31,
                  top: 117,
                  width: 132,
                  height: 20,
                }}
              />

              {/* OK button at (18, 162, 76x27): hover=3, press=4 */}
              <div
                onMouseEnter={() => {
                  setHoveredTutBtn('ok');
                  soundManager.playTouch();
                }}
                onMouseLeave={() => {
                  setHoveredTutBtn(null);
                  setPressedTutBtn(null);
                }}
                onMouseDown={() => setPressedTutBtn('ok')}
                onMouseUp={() => setPressedTutBtn(null)}
                onClick={handleTutorialOk}
                style={{
                  position: 'absolute',
                  left: 18,
                  top: 162,
                  width: 76,
                  height: 27,
                }}
              >
                {(hoveredTutBtn === 'ok' || pressedTutBtn === 'ok') && (
                  <img
                    src={TUTORIAL_IMG(pressedTutBtn === 'ok' ? 4 : 3)}
                    alt="OK"
                    draggable={false}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>

              {/* Cancel button at (101, 162, 76x27): hover=6, press=7 */}
              <div
                onMouseEnter={() => {
                  setHoveredTutBtn('cancel');
                  soundManager.playTouch();
                }}
                onMouseLeave={() => {
                  setHoveredTutBtn(null);
                  setPressedTutBtn(null);
                }}
                onMouseDown={() => setPressedTutBtn('cancel')}
                onMouseUp={() => setPressedTutBtn(null)}
                onClick={handleTutorialCancel}
                style={{
                  position: 'absolute',
                  left: 101,
                  top: 162,
                  width: 76,
                  height: 27,
                }}
              >
                {(hoveredTutBtn === 'cancel' || pressedTutBtn === 'cancel') && (
                  <img
                    src={TUTORIAL_IMG(pressedTutBtn === 'cancel' ? 7 : 6)}
                    alt="Cancel"
                    draggable={false}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
