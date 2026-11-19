import { BaseAttributes, ClassId, NationId } from '../types/game';

export type CharacterGender = 'male' | 'female';

export type PrimaryJobId =
  | 'mining'
  | 'lumberjacking'
  | 'herbdigging'
  | 'fishing'
  | 'farming'
  | 'butchering';

export interface SavedCharacterProfile {
  slotIndex: number; // 0..3
  name: string;
  gender: CharacterGender;
  portraitIndex: number; // 0..7 -> man_0..7 or woman_0..7
  nation: NationId;
  className: ClassId;
  dualClass: string;
  dualGrade: number;
  primaryJob: PrimaryJobId;
  level: number;
  exp: number;
  maxExp: number;
  gold: number;
  fame: number;
  mapId: string;
  tileX: number;
  tileY: number;
  attributes: BaseAttributes;
  createdAt: string;
}

const STORAGE_KEY = 'dragon_raja_original_chars_v4';

const DEFAULT_CHARACTERS: Array<SavedCharacterProfile | null> = [
  {
    slotIndex: 0,
    name: 'HuchNedval',
    gender: 'male',
    portraitIndex: 0,
    nation: 'Vyseus',
    className: 'Warrior',
    dualClass: 'Dark Knight',
    dualGrade: 3,
    primaryJob: 'mining',
    level: 52,
    exp: 14200,
    maxExp: 25000,
    gold: 125000,
    fame: 1420,
    mapId: 'RENES_C',
    tileX: 200,
    tileY: 165,
    attributes: {
      STR: 145,
      CON: 132,
      DEX: 118,
      WIS: 95,
      INT: 110,
      MOVP: 105,
      CHA: 88,
      ENDU: 120,
      MOR: 96,
      LUCK: 84
    },
    createdAt: '2026-11-06'
  },
  {
    slotIndex: 1,
    name: 'IrurilSereniel',
    gender: 'female',
    portraitIndex: 1,
    nation: 'Yllse',
    className: 'Archer',
    dualClass: 'Highlander',
    dualGrade: 4,
    primaryJob: 'lumberjacking',
    level: 68,
    exp: 19400,
    maxExp: 34000,
    gold: 210000,
    fame: 1890,
    mapId: 'RENES_C',
    tileX: 202,
    tileY: 166,
    attributes: {
      STR: 118,
      CON: 112,
      DEX: 168,
      WIS: 104,
      INT: 115,
      MOVP: 135,
      CHA: 96,
      ENDU: 110,
      MOR: 102,
      LUCK: 114
    },
    createdAt: '2026-11-06'
  },
  null,
  null
];

export function loadCharacterSlots(): Array<SavedCharacterProfile | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CHARACTERS));
      return [...DEFAULT_CHARACTERS];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 4) {
      return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return [...DEFAULT_CHARACTERS];
}

export function saveCharacterToSlot(slotIndex: number, profile: SavedCharacterProfile): Array<SavedCharacterProfile | null> {
  const slots = loadCharacterSlots();
  slots[slotIndex] = { ...profile, slotIndex };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  } catch {
    // ignore
  }
  return slots;
}

export function deleteCharacterFromSlot(slotIndex: number): Array<SavedCharacterProfile | null> {
  const slots = loadCharacterSlots();
  slots[slotIndex] = null;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  } catch {
    // ignore
  }
  return slots;
}

export function getCharacterPortraitUrl(gender: CharacterGender, portraitIndex: number): string {
  const clamped = Math.max(0, Math.min(7, portraitIndex));
  return gender === 'female'
    ? `/assets/original/ui/portraits/woman_${clamped}.png`
    : `/assets/original/ui/portraits/man_${clamped}.png`;
}

export function rollClassDiceAttributes(className: ClassId): BaseAttributes {
  const rand = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));

  switch (className) {
    case 'Warrior':
      return {
        STR: rand(42, 58),
        CON: rand(40, 56),
        DEX: rand(28, 42),
        WIS: rand(15, 25),
        INT: rand(15, 25),
        MOVP: rand(26, 38),
        CHA: rand(18, 30),
        ENDU: rand(38, 52),
        MOR: rand(22, 34),
        LUCK: rand(18, 32)
      };
    case 'Thief':
      return {
        STR: rand(32, 46),
        CON: rand(28, 40),
        DEX: rand(45, 60),
        WIS: rand(16, 26),
        INT: rand(20, 32),
        MOVP: rand(40, 55),
        CHA: rand(18, 30),
        ENDU: rand(28, 40),
        MOR: rand(20, 32),
        LUCK: rand(35, 52)
      };
    case 'Archer':
      return {
        STR: rand(34, 48),
        CON: rand(30, 42),
        DEX: rand(46, 62),
        WIS: rand(18, 28),
        INT: rand(20, 32),
        MOVP: rand(38, 52),
        CHA: rand(20, 32),
        ENDU: rand(30, 42),
        MOR: rand(22, 34),
        LUCK: rand(28, 44)
      };
    case 'Wizard':
      return {
        STR: rand(16, 26),
        CON: rand(24, 36),
        DEX: rand(24, 36),
        WIS: rand(22, 34),
        INT: rand(48, 64),
        MOVP: rand(26, 38),
        CHA: rand(24, 38),
        ENDU: rand(24, 36),
        MOR: rand(24, 36),
        LUCK: rand(24, 38)
      };
    case 'Priest':
      return {
        STR: rand(24, 36),
        CON: rand(32, 46),
        DEX: rand(22, 34),
        WIS: rand(48, 64),
        INT: rand(22, 34),
        MOVP: rand(26, 38),
        CHA: rand(30, 45),
        ENDU: rand(32, 46),
        MOR: rand(38, 54),
        LUCK: rand(24, 38)
      };
  }
}
