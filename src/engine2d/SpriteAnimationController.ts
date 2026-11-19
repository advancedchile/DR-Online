import { CharacterGender } from '../systems/CharacterStorage';
import { WorldEntity } from '../types/game';
import originalSqlDb from '../data/originalSqlDatabase.json';

export type Direction8 = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7; // 0=S, 1=SW, 2=W, 3=NW, 4=N, 5=NE, 6=E, 7=SE
export type SpriteActionState = 'idle' | 'walk' | 'run' | 'attack';

export interface CachedSpriteFrame {
  img: HTMLImageElement;
  loaded: boolean;
  failed: boolean;
  w: number;
  h: number;
}

export interface SpriteAnimSpec {
  path: string;
  perDir: number;
  idle: number[];
  walk: number[];
  run?: number[];
  attack: number[];
  attackWave?: number;
  dieWave?: number;
}

const rawPlayerSpecs = (originalSqlDb as any).playerAniSpecs || {};

const PLAYER_SPECS: Record<CharacterGender, SpriteAnimSpec> = {
  male: {
    path: 'player/male',
    perDir: 75,
    idle: rawPlayerSpecs['1']?.idle || [1, 1, 2, 2, 3, 3, 2, 2],
    walk: rawPlayerSpecs['1']?.walk || [4, 5, 6, 7, 8, 9],
    run: rawPlayerSpecs['1']?.run || [44, 45, 46, 47, 48, 49],
    attack: rawPlayerSpecs['1']?.attack || [19, 19, 21, 22, 22],
    attackWave: rawPlayerSpecs['1']?.attackWave || 205
  },
  female: {
    path: 'player/female',
    perDir: 75,
    idle: rawPlayerSpecs['0']?.idle || [1, 1, 2, 2, 3, 3, 2, 2],
    walk: rawPlayerSpecs['0']?.walk || [4, 5, 6, 7, 8, 9],
    run: rawPlayerSpecs['0']?.run || [44, 45, 46, 47, 48, 49],
    attack: rawPlayerSpecs['0']?.attack || [19, 19, 21, 22, 22],
    attackWave: rawPlayerSpecs['0']?.attackWave || 205
  }
};

const HORSE_SPEC: SpriteAnimSpec = {
  path: 'images/characters/player/legacy/horse/h000.spr',
  perDir: 75,
  idle: [1, 2, 3, 2],
  walk: [10, 11, 12, 13, 14, 15],
  run: [44, 45, 46, 47, 48, 49],
  attack: [19, 21, 22, 23, 24, 25, 26]
};

// Build exact AniTable.bin sprite table for every SprNO (2..199) in data0
const SPR_NO_SPECS: Record<number, SpriteAnimSpec> = {};
const rawSprSpecs = (originalSqlDb as any).sprSpecs || {};
for (const key of Object.keys(rawSprSpecs)) {
  const s = rawSprSpecs[key];
  const sprNo = Number(s.sprNo ?? key);
  SPR_NO_SPECS[sprNo] = {
    path: s.sprPath,
    perDir: s.perDir,
    idle: Array.isArray(s.idle) && s.idle.length > 0 ? s.idle : [0],
    walk: Array.isArray(s.walk) && s.walk.length > 0 ? s.walk : [0],
    attack: Array.isArray(s.attack) && s.attack.length > 0 ? s.attack : [0],
    attackWave: s.attackWave || 0,
    dieWave: s.dieWave || 0
  };
}

function getSpecBySprNo(sprNo: number, fallbackSprNo = 8): SpriteAnimSpec {
  return (
    SPR_NO_SPECS[sprNo] ||
    SPR_NO_SPECS[fallbackSprNo] || {
      path: `images/characters/npc/legacy/${String(sprNo).padStart(3, '0')}000.spr`,
      perDir: 20,
      idle: [0, 1, 2, 3],
      walk: [4, 5, 6, 7, 8, 9],
      attack: [13, 14, 15, 16, 17]
    }
  );
}

// Named role/subType mapping to authentic SprNO from npc_generation_sp
const ENTITY_SPRITE_MAP: Record<string, SpriteAnimSpec> = {
  // Town Shopkeepers & NPCs (SprNO 56, 71..80, 18..23)
  blacksmith: getSpecBySprNo(74),
  legend_sage: getSpecBySprNo(71),
  vendor: getSpecBySprNo(76),
  priest_healer: getSpecBySprNo(56),
  war_commander: getSpecBySprNo(18),
  guard: getSpecBySprNo(18),
  bartender: getSpecBySprNo(72),
  baker: getSpecBySprNo(73),
  clothier: getSpecBySprNo(75),
  butcher: getSpecBySprNo(77),
  candlemaker: getSpecBySprNo(78),
  alchemist: getSpecBySprNo(79),
  bard: getSpecBySprNo(80),
  villager_woman: getSpecBySprNo(21),
  villager_man: getSpecBySprNo(22),
  // Animals & Dummies
  hen: getSpecBySprNo(28),
  dog: getSpecBySprNo(29),
  cow: getSpecBySprNo(30),
  sheep: getSpecBySprNo(53),
  dummy: getSpecBySprNo(92),
  // Monsters
  zombie: getSpecBySprNo(5),
  boar: getSpecBySprNo(6),
  slime: getSpecBySprNo(6),
  skeleton: getSpecBySprNo(7),
  goblin: getSpecBySprNo(8),
  orc: getSpecBySprNo(9),
  golem: getSpecBySprNo(10),
  lizardman: getSpecBySprNo(12),
  guard_stone: getSpecBySprNo(91),
  dragon_boss: getSpecBySprNo(17)
};

export class SpriteAnimationController {
  private frameCache = new Map<string, CachedSpriteFrame>();
  private objectCache = new Map<number, CachedSpriteFrame>();

  /**
   * Computes 8-way direction (0=S, 1=SW, 2=W, 3=NW, 4=N, 5=NE, 6=E, 7=SE)
   * from delta vector (dx, dy).
   */
  public static getDirection8(dx: number, dy: number, fallback: Direction8 = 0): Direction8 {
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return fallback;
    const angle = Math.atan2(dy, dx); // -PI..PI, 0 is East (+x), PI/2 is South (+y)
    // Shift so PI/2 (South) is 0, going clockwise: S, SW, W, NW, N, NE, E, SE
    const shifted = angle - Math.PI / 2;
    const normalized = ((shifted % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const sector = Math.round((normalized / (Math.PI * 2)) * 8) % 8;
    return sector as Direction8;
  }

  public getPlayerSpriteSpec(gender: CharacterGender): SpriteAnimSpec {
    return PLAYER_SPECS[gender] || PLAYER_SPECS.male;
  }

  public getHorseSpriteSpec(): SpriteAnimSpec {
    return HORSE_SPEC;
  }

  public getEntitySpriteSpec(entity: WorldEntity): SpriteAnimSpec {
    const anyEnt = entity as any;
    if (typeof anyEnt.sprNo === 'number' && SPR_NO_SPECS[anyEnt.sprNo]) {
      return SPR_NO_SPECS[anyEnt.sprNo];
    }
    if (typeof entity.subType === 'string' && entity.subType.startsWith('spr_')) {
      const sprNo = Number(entity.subType.slice(4));
      if (SPR_NO_SPECS[sprNo]) {
        return SPR_NO_SPECS[sprNo];
      }
    }
    if (entity.type === 'npc' && entity.npcRole && ENTITY_SPRITE_MAP[entity.npcRole]) {
      return ENTITY_SPRITE_MAP[entity.npcRole];
    }
    if (ENTITY_SPRITE_MAP[entity.subType]) {
      return ENTITY_SPRITE_MAP[entity.subType];
    }
    return ENTITY_SPRITE_MAP.goblin;
  }

  /**
   * Computes exact AniTable.bin frame index inside a Dragon Raja .spr container
   * for a given direction (0..7), action ('idle' | 'walk' | 'attack'), and animation tick.
   */
  public computeSpecFrameIndex(
    dir: Direction8,
    action: SpriteActionState,
    tick: number,
    spec: SpriteAnimSpec
  ): number {
    const seq =
      action === 'run'
        ? spec.run || spec.walk
        : action === 'walk'
        ? spec.walk
        : action === 'attack'
        ? spec.attack
        : spec.idle;
    const cFrame = seq[tick % seq.length] ?? seq[0] ?? 0;
    return dir * spec.perDir + cFrame;
  }

  /**
   * Requests an anchored 220x220 sprite frame (foot anchor at 110, 155) from `/api/data0/sprite`
   * and returns it if ready, or falls back to the base idle frame for that direction while loading.
   */
  public getSpecFrameImage(
    spec: SpriteAnimSpec,
    dir: Direction8,
    action: SpriteActionState,
    tick: number
  ): CachedSpriteFrame | null {
    const frameIdx = this.computeSpecFrameIndex(dir, action, tick, spec);
    const exact = this.ensureFrameLoaded(spec.path, frameIdx);
    if (exact.loaded && !exact.failed) {
      return exact;
    }

    // Fallback to direction idle frame 0
    const dirIdleIdx = dir * spec.perDir + (spec.idle[0] ?? 0);
    if (dirIdleIdx !== frameIdx) {
      const dirFallback = this.ensureFrameLoaded(spec.path, dirIdleIdx);
      if (dirFallback.loaded && !dirFallback.failed) {
        return dirFallback;
      }
    }

    // Fallback to South idle frame 0
    const southIdleIdx = spec.idle[0] ?? 0;
    if (southIdleIdx !== frameIdx) {
      const zeroFallback = this.ensureFrameLoaded(spec.path, southIdleIdx);
      if (zeroFallback.loaded && !zeroFallback.failed) {
        return zeroFallback;
      }
    }

    return null;
  }

  public getMapObjectImage(objId: number): CachedSpriteFrame | null {
    let entry = this.objectCache.get(objId);
    if (!entry) {
      const img = new Image();
      const record: CachedSpriteFrame = {
        img,
        loaded: false,
        failed: false,
        w: 32,
        h: 32
      };
      img.onload = () => {
        record.loaded = true;
        record.w = img.naturalWidth || 32;
        record.h = img.naturalHeight || 32;
      };
      img.onerror = () => {
        record.failed = true;
      };
      img.src = `/api/data0/object/${objId}.png`;
      this.objectCache.set(objId, record);
      entry = record;
    }
    return entry.loaded && !entry.failed ? entry : null;
  }

  private ensureFrameLoaded(sprPath: string, frameIdx: number): CachedSpriteFrame {
    const key = `${sprPath}#${frameIdx}#anchor1`;
    const existing = this.frameCache.get(key);
    if (existing) return existing;

    const img = new Image();
    const record: CachedSpriteFrame = {
      img,
      loaded: false,
      failed: false,
      w: 220,
      h: 220
    };
    img.onload = () => {
      record.loaded = true;
      record.w = img.naturalWidth || 220;
      record.h = img.naturalHeight || 220;
    };
    img.onerror = () => {
      record.failed = true;
    };
    img.src = `/api/data0/sprite?path=${encodeURIComponent(sprPath)}&idx=${frameIdx}&anchor=1`;
    this.frameCache.set(key, record);
    return record;
  }
}

export const spriteController = new SpriteAnimationController();
