import originalSqlDb from './originalSqlDatabase.json';
import { WorldEntity } from '../types/game';

export interface SkbSpawnRecord {
  x: number;
  y: number;
  npcIndex: number;
  eventNo: number;
  maxNo: number;
}

export interface SkbSkillRecord {
  x: number;
  y: number;
  skillno: number;
  tileRange: number;
  probability: number;
}

interface SqlNpcRow {
  no: number;
  sprNo: number;
  name: string;
  npcRace: number;
  lvMin: number;
  lvMax: number;
  hp: number;
  exp: number;
  movp: number;
  strikeDamage: number;
  baseDefense: number;
  moneyMin: number;
  moneyMax: number;
}

const npcTable: Record<string, SqlNpcRow> = (originalSqlDb as any).npcTable || {};

const SKILL_NODE_META: Record<
  number,
  { subType: string; name: string; nodeJob: string; nodeResourceName: string }
> = {
  1: {
    subType: 'wheat_field',
    name: 'Wheat Field',
    nodeJob: 'Farming',
    nodeResourceName: 'Wheat'
  },
  2: {
    subType: 'iron_vein',
    name: 'Iron Ore Vein',
    nodeJob: 'Mining',
    nodeResourceName: 'Iron Ore'
  },
  3: {
    subType: 'fishing_spot',
    name: 'Fishing Shoal',
    nodeJob: 'Fishing',
    nodeResourceName: 'Fresh Carp'
  },
  4: {
    subType: 'oak_tree',
    name: 'Lumber Tree',
    nodeJob: 'Lumberjacking',
    nodeResourceName: 'Oak Log'
  },
  5: {
    subType: 'herb_bush',
    name: 'Medicinal Herb',
    nodeJob: 'Herb-Digging',
    nodeResourceName: 'Healing Herb'
  }
};

function getNpcRoleAndTitle(
  sprNo: number,
  rawName: string,
  eventNo = 0
): {
  npcRole: NonNullable<WorldEntity['npcRole']>;
  displayName: string;
  title: string;
} {
  const cleanName = rawName.replace(/''/g, "'").trim();
  switch (sprNo) {
    case 71:
      if (eventNo === 27) {
        return {
          npcRole: 'vendor',
          displayName: 'Master of Bank',
          title: 'Renes Depository Bank'
        };
      }
      return {
        npcRole: 'legend_sage',
        displayName: cleanName || 'Master of Town',
        title: 'City Hall'
      };
    case 72:
      if (eventNo === 31) {
        return {
          npcRole: 'vendor',
          displayName: 'Master of Public House',
          title: 'Public House & Inn'
        };
      }
      if (eventNo === 30) {
        return {
          npcRole: 'vendor',
          displayName: 'Master of Slopshop',
          title: 'Tailor & Cloth Guild'
        };
      }
      return {
        npcRole: 'vendor',
        displayName: cleanName || 'Master of Bar',
        title: 'Tavern & Pub'
      };
    case 73:
      return {
        npcRole: 'vendor',
        displayName: cleanName || 'Master of Bakery',
        title: 'Bakery & Restaurant'
      };
    case 74:
      if (eventNo === 59) {
        return {
          npcRole: 'blacksmith',
          displayName: 'Master of Carpentry',
          title: 'Woodworking Guild'
        };
      }
      return {
        npcRole: 'blacksmith',
        displayName: cleanName || "Master of Smith's Shop",
        title: 'Blacksmith & Repair'
      };
    case 75:
      if (eventNo === 34) {
        return {
          npcRole: 'blacksmith',
          displayName: 'Master of Bowcraft',
          title: 'Bowmaking Guild'
        };
      }
      return {
        npcRole: 'blacksmith',
        displayName: cleanName || 'Master of Weapon Shop',
        title: 'Weapon & Armor Shop'
      };
    case 76:
      if (eventNo === 39) {
        return {
          npcRole: 'vendor',
          displayName: 'Master of Herb Shop',
          title: 'Herb & Apothecary Guild'
        };
      }
      if (eventNo === 25) {
        return {
          npcRole: 'vendor',
          displayName: 'Master of Farm',
          title: 'Farming Guild'
        };
      }
      return {
        npcRole: 'vendor',
        displayName: cleanName || 'Master of Store',
        title: 'General Goods Store'
      };
    case 77:
      return {
        npcRole: 'vendor',
        displayName: cleanName || 'Master of Butchery',
        title: 'Shambles & Butcher Guild'
      };
    case 78:
      return {
        npcRole: 'vendor',
        displayName: cleanName || 'Master of CandleMaker',
        title: 'Candlemaking Guild'
      };
    case 79:
      if (eventNo === 32 || eventNo === 5 || eventNo === 57) {
        return {
          npcRole: 'vendor',
          displayName: 'Master of Magic Guild',
          title: 'Wizard & Magic Guild'
        };
      }
      return {
        npcRole: 'vendor',
        displayName: cleanName || 'Master of Alchemy',
        title: 'Alchemy & Potion Guild'
      };
    case 80:
      return {
        npcRole: 'quest',
        displayName: cleanName || 'Woman Bard',
        title: 'Wandering Minstrel'
      };
    case 22:
      if (eventNo === 8 || eventNo === 36) {
        return {
          npcRole: 'war_commander',
          displayName: 'Master of Academy',
          title: 'Combat Skill Academy'
        };
      }
      return {
        npcRole: 'quest',
        displayName: cleanName || 'Warrior',
        title: 'Citizen'
      };
    case 56:
      return {
        npcRole: 'priest_healer',
        displayName: cleanName || 'Teferi',
        title: 'Hospital & Temple Healer'
      };
    case 18:
    case 19:
    case 20:
      return {
        npcRole: 'war_commander',
        displayName: cleanName || 'Royal Guard',
        title: 'City Guard'
      };
    case 91:
    case 98:
    case 99:
      return {
        npcRole: 'war_commander',
        displayName: cleanName || 'Nation Sealstone',
        title: 'Sacred Sealstone'
      };
    default:
      return {
        npcRole: 'quest',
        displayName: cleanName || 'Town Citizen',
        title: 'Citizen'
      };
  }
}

/**
 * Generates the authentic map entities (NPCs, Shopkeepers, Guards, Animals, Dummies,
 * Monsters, Gathering Nodes, and Map Portals) directly from the original `.skb`
 * (`LoadSkillMapTable` in `Mapserver/HigherLayers/Skill.cpp`) and `dragonraja.sql` (`npc_generation_sp`).
 */
export function buildAuthenticMapEntitiesFromSkb(
  mapId: string,
  mapKey: string,
  skbSpawns: SkbSpawnRecord[],
  skbSkills: SkbSkillRecord[],
  gridWords: Uint16Array,
  width: number,
  height: number
): WorldEntity[] {
  const entities: WorldEntity[] = [];
  const upperKey = mapKey.toUpperCase();

  // Town safe center coordinates where hostile monsters must never spawn
  const safeCenters: Array<{ x: number; y: number; radius: number }> = [];
  if (upperKey === 'RENES_C') {
    safeCenters.push({ x: 200, y: 165, radius: 60 });
    safeCenters.push({ x: 231, y: 223, radius: 45 });
    safeCenters.push({ x: 180, y: 65, radius: 25 });
  } else if (upperKey === 'MA-IN') {
    safeCenters.push({ x: 247, y: 107, radius: 60 });
    safeCenters.push({ x: 245, y: 245, radius: 50 });
    safeCenters.push({ x: 278, y: 11, radius: 25 });
  } else if (upperKey === 'BIS_I') {
    safeCenters.push({ x: 253, y: 449, radius: 55 });
  } else if (upperKey === 'IRAMUS') {
    safeCenters.push({ x: 92, y: 67, radius: 55 });
  } else if (upperKey === 'DEP') {
    safeCenters.push({ x: 276, y: 360, radius: 55 });
  } else if (upperKey === 'TYNEN') {
    safeCenters.push({ x: 445, y: 260, radius: 55 });
  } else if (upperKey === 'BARANTAN') {
    safeCenters.push({ x: 329, y: 95, radius: 60 });
    safeCenters.push({ x: 263, y: 185, radius: 45 });
  } else if (upperKey === 'SCHOLIUM') {
    safeCenters.push({ x: 18, y: 22, radius: 35 });
  } else if (upperKey === 'K_SUNG2') {
    safeCenters.push({ x: 135, y: 155, radius: 42 });
  }

  // 1. Spawn NPCs, Guards, Animals, Dummies & Monsters from .skb (skillno == 6)
  for (let i = 0; i < skbSpawns.length; i++) {
    const sp = skbSpawns[i];
    const row = npcTable[String(sp.npcIndex)];
    if (!row) continue;

    const tx = Math.max(2, Math.min(width - 3, sp.x));
    const ty = Math.max(2, Math.min(height - 3, sp.y));
    const cellFlags = gridWords[(ty * width + tx) * 4 + 3] || 0;
    const isNoBattleTile = (cellFlags & 4) !== 0;

    const sprNo = row.sprNo || row.no;
    const subType = `spr_${sprNo}`;
    const worldX = tx;
    const worldZ = ty;

    // Friendly Human NPCs (npcRace == 1), Guards (npcRace == 2), Sealstones (npcRace == 11)
    if (row.npcRace === 1 || row.npcRace === 2 || row.npcRace === 11) {
      const meta = getNpcRoleAndTitle(sprNo, row.name, sp.eventNo);
      const isScholium = upperKey === 'SCHOLIUM' || upperKey === 'SCHOLIUM2';
      const displayName =
        isScholium && sprNo === 80
          ? `Tutorial Instructor #${sp.eventNo || i + 1}`
          : isScholium && sprNo === 22
            ? 'Combat Instructor'
            : meta.displayName;
      const title = isScholium ? 'Scholium Tutorial Academy' : meta.title;
      entities.push({
        id: `${mapId}_skb_npc_${i}_${sp.npcIndex}`,
        name: displayName,
        type: 'npc',
        subType,
        sprNo,
        x: worldX,
        z: worldZ,
        level: row.lvMin || 50,
        hp: row.hp || 10000,
        maxHp: row.hp || 10000,
        hostile: false,
        npcRole: meta.npcRole,
        title,
        dialogId: isScholium ? `tutorial_${sp.eventNo || 1}` : undefined
      });
      continue;
    }

    // Training Dummies & Archery Targets (npcRace == 0, SprNO 92..96)
    if (row.npcRace === 0 || (sprNo >= 92 && sprNo <= 96)) {
      entities.push({
        id: `${mapId}_skb_dummy_${i}_${sp.npcIndex}`,
        name: row.name.replace(/''/g, "'") || 'Training Dummy',
        type: 'monster',
        subType,
        sprNo,
        x: worldX,
        z: worldZ,
        level: 1,
        hp: 500,
        maxHp: 500,
        hostile: false
      });
      continue;
    }

    // Passive Farm Animals (npcRace == 8: Hens=28, Dog=29, Cow=30, Sheep=53)
    if (row.npcRace === 8) {
      entities.push({
        id: `${mapId}_skb_animal_${i}_${sp.npcIndex}`,
        name: row.name.replace(/''/g, "'"),
        type: 'monster',
        subType,
        sprNo,
        x: worldX,
        z: worldZ,
        level: Math.max(1, row.lvMin || 1),
        hp: Math.max(60, Math.min(400, row.hp || 120)),
        maxHp: Math.max(60, Math.min(400, row.hp || 120)),
        hostile: false,
        tameable: true
      });
      continue;
    }

    // Hostile Monsters (npcRace == 9, etc.)
    // Never spawn hostile monsters on safe-zone tiles or inside town plazas!
    if (isNoBattleTile) continue;
    let insideSafePlaza = false;
    for (const sc of safeCenters) {
      if (Math.hypot(tx - sc.x, ty - sc.y) < sc.radius) {
        insideSafePlaza = true;
        break;
      }
    }
    if (insideSafePlaza) continue;

    // Scale monster HP reasonably for early levels so lv 1..15 players can hunt them authentically
    const lv = Math.max(1, row.lvMin || 5);
    const scaledHp = lv <= 15 ? Math.max(80, lv * 28) : Math.max(250, Math.floor(row.hp * 0.35));

    entities.push({
      id: `${mapId}_skb_mob_${i}_${sp.npcIndex}`,
      name: row.name.replace(/''/g, "'"),
      type: 'monster',
      subType,
      sprNo,
      x: worldX,
      z: worldZ,
      level: lv,
      hp: scaledHp,
      maxHp: scaledHp,
      hostile: true,
      tameable: false
    });
  }

  // 2. Spawn Gathering Resource Nodes from .skb (skillno == 1..5), deduplicated per 12x12 tile sector
  const seenNodeSectors = new Set<string>();
  for (let i = 0; i < skbSkills.length; i++) {
    const sk = skbSkills[i];
    const meta = SKILL_NODE_META[sk.skillno];
    if (!meta) continue;
    const sectorKey = `${sk.skillno}_${Math.floor(sk.x / 14)}_${Math.floor(sk.y / 14)}`;
    if (seenNodeSectors.has(sectorKey)) continue;
    seenNodeSectors.add(sectorKey);

    entities.push({
      id: `${mapId}_skb_node_${i}_${sk.skillno}`,
      name: meta.name,
      type: 'node',
      subType: meta.subType,
      x: sk.x,
      z: sk.y,
      level: 1,
      hp: 100,
      maxHp: 100,
      hostile: false,
      nodeJob: meta.nodeJob,
      nodeResourceName: meta.nodeResourceName,
      nodeRemaining: 5
    });
  }

  // 3. Authentic Map Portals (.ent / map_info transitions)
  if (upperKey === 'RENES_C') {
    entities.push(
      {
        id: `${mapId}_portal_vyseus`,
        name: 'Portal to Wiseleton (MA-IN)',
        type: 'portal',
        subType: 'gate',
        x: 180,
        z: 60,
        level: 1,
        hp: 100,
        maxHp: 100,
        hostile: false,
        destMapId: 'MA-IN'
      },
      {
        id: `${mapId}_portal_barantan`,
        name: 'Portal to Barantan',
        type: 'portal',
        subType: 'gate',
        x: 205,
        z: 195,
        level: 1,
        hp: 100,
        maxHp: 100,
        hostile: false,
        destMapId: 'barantan'
      }
    );
  } else if (upperKey === 'MA-IN') {
    entities.push(
      {
        id: `${mapId}_portal_renes`,
        name: 'Portal to Renes City',
        type: 'portal',
        subType: 'gate',
        x: 235,
        z: 245,
        level: 1,
        hp: 100,
        maxHp: 100,
        hostile: false,
        destMapId: 'RENES_C'
      },
      {
        id: `${mapId}_portal_ksung2`,
        name: 'Portal to Fire Cavern (FIREDUN1)',
        type: 'portal',
        subType: 'gate',
        x: 265,
        z: 245,
        level: 1,
        hp: 100,
        maxHp: 100,
        hostile: false,
        destMapId: 'FIREDUN1'
      }
    );
  } else if (upperKey === 'BARANTAN') {
    entities.push({
      id: `${mapId}_portal_renes`,
      name: 'Portal to Renes City',
      type: 'portal',
      subType: 'gate',
      x: 55,
      z: 130,
      level: 1,
      hp: 100,
      maxHp: 100,
      hostile: false,
      destMapId: 'RENES_C'
    });
  } else if (upperKey !== 'SCHOLIUM' && upperKey !== 'SCHOLIUM2') {
    entities.push({
      id: `${mapId}_portal_renes`,
      name: 'Portal to Renes City',
      type: 'portal',
      subType: 'gate',
      x: Math.floor(width / 2),
      z: Math.floor(height / 2),
      level: 1,
      hp: 100,
      maxHp: 100,
      hostile: false,
      destMapId: 'RENES_C'
    });
  }

  return entities;
}
