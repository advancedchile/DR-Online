import extractedRaw from './extractedData.json';
import {
  AchievementEntry,
  ArenaLeaderboardEntry,
  CombatSkillEntry,
  CraftingRecipe,
  GameItem,
  JobSkillEntry,
  MailEntry,
  MapDefinition,
  QuestStepDialog,
  SpellEntry,
  TacticEntry,
  WorldEntity
} from '../types/game';

export const EXTRACTED_DATA = extractedRaw;

export const INITIAL_TACTICS: TacticEntry[] = [
  { id: 'crapple', name: 'Crapple (Unarmed)', level: 12, exp: 420, maxExp: 1000 },
  { id: 'swordmanship', name: 'Swordmanship', level: 38, exp: 2850, maxExp: 4000 },
  { id: 'archery', name: 'Archery', level: 24, exp: 1100, maxExp: 2500 },
  { id: 'fencing', name: 'Fencing / Axe', level: 21, exp: 900, maxExp: 2200 },
  { id: 'mace', name: 'Mace Fighting', level: 19, exp: 650, maxExp: 2000 },
  { id: 'pierce', name: 'Pierce / Spear', level: 22, exp: 1200, maxExp: 2300 },
  { id: 'whirl', name: 'Whirl / Staff', level: 29, exp: 1800, maxExp: 3000 },
  { id: 'hurl', name: 'Hurl / Throwing', level: 18, exp: 540, maxExp: 1900 },
  { id: 'parrying', name: 'Parrying (Shield)', level: 35, exp: 2600, maxExp: 3600 },
  { id: 'twinsword', name: 'Twinsword / 2H Swordmanship', level: 32, exp: 2100, maxExp: 3300 },
  { id: 'twomace', name: 'Twomace / 2H Hammer', level: 16, exp: 400, maxExp: 1700 },
  { id: 'magery', name: 'Magery (Arcane)', level: 36, exp: 2700, maxExp: 3700 },
  { id: 'orroy', name: 'Orroy (Divine)', level: 34, exp: 2300, maxExp: 3500 }
];

export const INITIAL_JOB_SKILLS: JobSkillEntry[] = [
  {
    id: 'mining',
    name: 'Mining',
    category: 'gathering',
    level: 42,
    exp: 3400,
    maxExp: 5000,
    gmTitle: 'Miner Grand Master',
    toolKeyword: 'Pickaxe',
    description: 'Extracts iron, mithril, gold, and rare ores from mineral veins.',
    iconUrl: '/assets/original/icons/skill/s001.png'
  },
  {
    id: 'lumberjacking',
    name: 'Lumberjacking',
    category: 'gathering',
    level: 36,
    exp: 2100,
    maxExp: 4200,
    gmTitle: 'Lumberjack Grand Master',
    toolKeyword: 'Hatchet',
    description: 'Harvests oak, beech, and mystical timber from ancient trees.',
    iconUrl: '/assets/original/icons/skill/s002.png'
  },
  {
    id: 'herbdigging',
    name: 'Herb Digging',
    category: 'gathering',
    level: 39,
    exp: 2800,
    maxExp: 4500,
    gmTitle: 'Herbalist Grand Master',
    toolKeyword: 'Hoe',
    description: 'Gathers medicinal herbs and alchemical roots across the continent.',
    iconUrl: '/assets/original/icons/skill/s003.png'
  },
  {
    id: 'fishing',
    name: 'Fishing',
    category: 'gathering',
    level: 31,
    exp: 1450,
    maxExp: 3500,
    gmTitle: 'Fisher Grand Master',
    toolKeyword: 'Fishing Rod',
    description: 'Catches river and sea fish along coastal and city waters.',
    iconUrl: '/assets/original/icons/skill/s004.png'
  },
  {
    id: 'farming',
    name: 'Farming',
    category: 'gathering',
    level: 28,
    exp: 1200,
    maxExp: 3100,
    gmTitle: 'Farmer Grand Master',
    toolKeyword: 'Sickle',
    description: 'Cultivates wheat, cotton, and crops in fertile fields.',
    iconUrl: '/assets/original/icons/skill/s005.png'
  },
  {
    id: 'butchering',
    name: 'Butchering',
    category: 'gathering',
    level: 33,
    exp: 1900,
    maxExp: 3800,
    gmTitle: 'Butcher Grand Master',
    toolKeyword: 'Cleaver',
    description: 'Harvests hides, leather, meat, and bone from slain monsters.',
    iconUrl: '/assets/original/icons/skill/s006.png'
  },
  {
    id: 'blacksmithing',
    name: 'Blacksmithing',
    category: 'crafting',
    level: 48,
    exp: 4100,
    maxExp: 5600,
    gmTitle: 'Blacksmith Grand Master',
    toolKeyword: 'Forge Hammer',
    description: 'Forges weapons, heavy plate armor, shields, and Rare/SokSung steel.',
    iconUrl: '/assets/original/icons/skill/s007.png'
  },
  {
    id: 'carpentry',
    name: 'Carpentry',
    category: 'crafting',
    level: 34,
    exp: 1850,
    maxExp: 3900,
    gmTitle: 'Carpenter Grand Master',
    toolKeyword: 'Saw',
    description: 'Crafts staves, shields, and structural war supplies.',
    iconUrl: '/assets/original/icons/skill/s008.png'
  },
  {
    id: 'bowmaking',
    name: 'Bowmaking',
    category: 'crafting',
    level: 37,
    exp: 2400,
    maxExp: 4300,
    gmTitle: 'Bowyer Grand Master',
    toolKeyword: 'Carving Knife',
    description: 'Fletches composite bows, longbows, and elemental arrows.',
    iconUrl: '/assets/original/icons/skill/s009.png'
  },
  {
    id: 'tailoring',
    name: 'Tailoring',
    category: 'crafting',
    level: 40,
    exp: 2950,
    maxExp: 4700,
    gmTitle: 'Tailor Grand Master',
    toolKeyword: 'Needle',
    description: 'Weaves robes, mantles, leather armor, and boots.',
    iconUrl: '/assets/original/icons/skill/s010.png'
  },
  {
    id: 'alchemy',
    name: 'Alchemy',
    category: 'crafting',
    level: 44,
    exp: 3600,
    maxExp: 5100,
    gmTitle: 'Alchemist Grand Master',
    toolKeyword: 'Alembic',
    description: 'Transmutes herbs and minerals into healing elixirs and Legend stones.',
    iconUrl: '/assets/original/icons/skill/s011.png'
  },
  {
    id: 'cooking',
    name: 'Cooking',
    category: 'crafting',
    level: 35,
    exp: 2050,
    maxExp: 4000,
    gmTitle: 'Chef Grand Master',
    toolKeyword: 'Cooking Pot',
    description: 'Prepares feasts that restore Health (SP/Hunger) and grant combat buffs.',
    iconUrl: '/assets/original/icons/skill/s012.png'
  }
];

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'rec_blood_sword',
    name: 'Forge Blood Executioner Sword',
    jobName: 'Blacksmithing',
    reqJobLevel: 25,
    resultItemName: 'Blood Executioner Sword',
    resultCategory: 'weapon',
    resultSlot: 'weapon',
    resultTier: 6,
    materials: [
      { name: 'Iron Ore', count: 2 },
      { name: 'Mithril Ore', count: 1 }
    ]
  },
  {
    id: 'rec_dragon_plate',
    name: 'Forge Dragon Scale Armor',
    jobName: 'Blacksmithing',
    reqJobLevel: 30,
    resultItemName: 'Dragon Scale Mail',
    resultCategory: 'armor',
    resultSlot: 'armor',
    resultTier: 7,
    materials: [
      { name: 'Mithril Ore', count: 2 },
      { name: 'Oak Timber', count: 1 }
    ]
  },
  {
    id: 'rec_elven_bow',
    name: 'Craft Windforce Longbow',
    jobName: 'Bowmaking',
    reqJobLevel: 20,
    resultItemName: 'Windforce Longbow',
    resultCategory: 'weapon',
    resultSlot: 'weapon',
    resultTier: 6,
    materials: [
      { name: 'Oak Timber', count: 2 },
      { name: 'Iron Ore', count: 1 }
    ]
  },
  {
    id: 'rec_archmage_robe',
    name: 'Weave Archmage Mantle',
    jobName: 'Tailoring',
    reqJobLevel: 22,
    resultItemName: 'Mantle of Dragon Raja',
    resultCategory: 'armor',
    resultSlot: 'mantle',
    resultTier: 7,
    materials: [
      { name: 'Moon Herb', count: 2 },
      { name: 'Oak Timber', count: 1 }
    ]
  },
  {
    id: 'rec_great_elixir',
    name: 'Brew Complete Healing Elixir (x5)',
    jobName: 'Alchemy',
    reqJobLevel: 15,
    resultItemName: 'Complete Healing Potion',
    resultCategory: 'potion',
    resultSlot: 'consumable',
    resultTier: 5,
    materials: [{ name: 'Moon Herb', count: 2 }]
  },
  {
    id: 'rec_roast_feast',
    name: 'Cook Royal Dragon Steak (x5)',
    jobName: 'Cooking',
    reqJobLevel: 10,
    resultItemName: 'Royal Roast Steak',
    resultCategory: 'food',
    resultSlot: 'consumable',
    resultTier: 4,
    materials: [{ name: 'Fresh Salmon', count: 2 }]
  }
];

export const MAP_DEFAULT_SPAWNS: Record<string, { x: number; z: number }> = {
  scholium: { x: 18, z: 22 },
  scholium2: { x: 124, z: 74 },
  RENES_C: { x: 200, z: 165 },
  'MA-IN': { x: 247, z: 107 },
  BIS_I: { x: 253, z: 449 },
  IRAMUS: { x: 92, z: 67 },
  DEP: { x: 276, z: 360 },
  TYNEN: { x: 445, z: 260 },
  barantan: { x: 329, z: 95 },
  hegmonia: { x: 334, z: 316 },
  FIREDUN1: { x: 104, z: 113 },
  G_BATTLE: { x: 99, z: 78 },
  mon_arena: { x: 184, z: 184 }
};

export const MAPS_CATALOG: MapDefinition[] = [
  {
    id: 'scholium',
    codeName: 'scholium',
    name: 'Scholium (Beginner Tutorial Academy)',
    nation: 'Neutral',
    biome: 'grassland',
    width: 170,
    depth: 170,
    safeZone: true,
    recommendedLevel: 'Lv. 1 - 7 (Tutorial)',
    weatherDefault: 'clear',
    buildings: []
  },
  {
    id: 'scholium2',
    codeName: 'scholium2',
    name: 'Scholium Hunting Ground (Novice Field)',
    nation: 'Neutral',
    biome: 'grassland',
    width: 170,
    depth: 170,
    safeZone: false,
    recommendedLevel: 'Lv. 1 - 7 (Novice)',
    weatherDefault: 'clear',
    buildings: []
  },
  {
    id: 'RENES_C',
    codeName: 'RENES_C',
    name: 'Renus City (Zypern Sanctuary)',
    nation: 'Zypern',
    biome: 'grassland',
    width: 440,
    depth: 450,
    safeZone: false,
    recommendedLevel: 'Lv. 1 - 45',
    weatherDefault: 'clear',
    buildings: []
  },
  {
    id: 'MA-IN',
    codeName: 'MA-IN',
    name: 'Helternt Village (Byseus Capital)',
    nation: 'Vyseus',
    biome: 'grassland',
    width: 512,
    depth: 512,
    safeZone: false,
    recommendedLevel: 'Lv. 1 - 70',
    weatherDefault: 'clear',
    buildings: []
  },
  {
    id: 'BIS_I',
    codeName: 'BIS_I',
    name: 'Byseus Impel (Frontier Stronghold)',
    nation: 'Vyseus',
    biome: 'grassland',
    width: 512,
    depth: 512,
    safeZone: false,
    recommendedLevel: 'Lv. 15 - 65',
    weatherDefault: 'clear',
    buildings: []
  },
  {
    id: 'IRAMUS',
    codeName: 'IRAMUS',
    name: 'Iramus (Northern Citadel)',
    nation: 'Zypern',
    biome: 'snow',
    width: 360,
    depth: 360,
    safeZone: false,
    recommendedLevel: 'Lv. 15 - 65',
    weatherDefault: 'snow',
    buildings: []
  },
  {
    id: 'DEP',
    codeName: 'DEP',
    name: 'Diph Uben (Southern Sanctuary)',
    nation: 'Zypern',
    biome: 'grassland',
    width: 440,
    depth: 440,
    safeZone: false,
    recommendedLevel: 'Lv. 15 - 65',
    weatherDefault: 'clear',
    buildings: []
  },
  {
    id: 'TYNEN',
    codeName: 'TYNEN',
    name: 'Tyren (Western Fortress)',
    nation: 'Zypern',
    biome: 'grassland',
    width: 512,
    depth: 512,
    safeZone: false,
    recommendedLevel: 'Lv. 15 - 70',
    weatherDefault: 'clear',
    buildings: []
  },
  {
    id: 'barantan',
    codeName: 'barantan',
    name: 'Barantan Fortress (Yllse Capital)',
    nation: 'Yllse',
    biome: 'snow',
    width: 480,
    depth: 420,
    safeZone: false,
    recommendedLevel: 'Lv. 1 - 95',
    weatherDefault: 'snow',
    buildings: []
  },
  {
    id: 'hegmonia',
    codeName: 'hegmonia',
    name: 'Hegmonia Oasis (Yllse Stronghold)',
    nation: 'Yllse',
    biome: 'desert',
    width: 540,
    depth: 540,
    safeZone: false,
    recommendedLevel: 'Lv. 50 - 110',
    weatherDefault: 'clear',
    buildings: []
  },
  {
    id: 'FIREDUN1',
    codeName: 'FIREDUN1',
    name: 'Abyssal Fire Cavern (Boss Lair)',
    nation: 'Neutral',
    biome: 'dungeon_fire',
    width: 240,
    depth: 240,
    safeZone: false,
    recommendedLevel: 'Lv. 75 - 150 (Dual Class)',
    weatherDefault: 'thunder',
    buildings: []
  },
  {
    id: 'G_BATTLE',
    codeName: 'G_BATTLE',
    name: 'Hadesz Nation War Battlefield',
    nation: 'Warzone',
    biome: 'battlefield',
    width: 200,
    depth: 180,
    safeZone: false,
    recommendedLevel: 'All Levels — Nation War & Guard Stones',
    weatherDefault: 'thunder',
    buildings: []
  },
  {
    id: 'mon_arena',
    codeName: 'mon_arena',
    name: 'Royal Colosseum & Boss Arena',
    nation: 'Neutral',
    biome: 'arena',
    width: 420,
    depth: 420,
    safeZone: false,
    recommendedLevel: 'Ranked PvP & Boss Rush',
    weatherDefault: 'clear',
    buildings: []
  }
];

export function createInitialMapEntities(mapId: string): WorldEntity[] {
  const entities: WorldEntity[] = [];
  const center = MAP_DEFAULT_SPAWNS[mapId] || { x: 231, z: 223 };
  const cx = center.x;
  const cz = center.z;

  if (mapId.toLowerCase() === 'scholium') {
    entities.push(
      {
        id: 'portal_scholium_city_start',
        name: 'Graduation Gate: Choose Starting City',
        type: 'portal',
        subType: 'portal_gold',
        x: 25,
        z: 18,
        level: 1,
        hp: 100,
        maxHp: 100,
        hostile: false,
        destMapId: 'START_MAP_SELECT',
        destX: 200,
        destZ: 165
      },
      {
        id: 'portal_scholium_to_scholium2',
        name: 'Portal: Novice Hunting Ground (SCHOLIUM2)',
        type: 'portal',
        subType: 'portal_blue',
        x: 112,
        z: 24,
        level: 1,
        hp: 100,
        maxHp: 100,
        hostile: false,
        destMapId: 'scholium2',
        destX: 124,
        destZ: 74
      },
      {
        id: 'portal_scholium_city_end',
        name: 'Graduation Gate: Choose Starting City',
        type: 'portal',
        subType: 'portal_gold',
        x: 108,
        z: 24,
        level: 1,
        hp: 100,
        maxHp: 100,
        hostile: false,
        destMapId: 'START_MAP_SELECT',
        destX: 200,
        destZ: 165
      }
    );
    return entities;
  } else if (mapId.toLowerCase() === 'scholium2') {
    entities.push(
      {
        id: 'portal_scholium2_city',
        name: 'Graduation Gate: Choose Starting City',
        type: 'portal',
        subType: 'portal_gold',
        x: 128,
        z: 70,
        level: 1,
        hp: 100,
        maxHp: 100,
        hostile: false,
        destMapId: 'START_MAP_SELECT',
        destX: 200,
        destZ: 165
      },
      {
        id: 'portal_scholium2_back',
        name: 'Return Gate: Scholium Academy',
        type: 'portal',
        subType: 'portal_blue',
        x: 120,
        z: 78,
        level: 1,
        hp: 100,
        maxHp: 100,
        hostile: false,
        destMapId: 'scholium',
        destX: 18,
        destZ: 22
      }
    );
    return entities;
  } else if (mapId === 'RENES_C') {
    // Authentic Town NPCs at Central Sanctuary Plaza (200, 165) & Southern Plaza (231, 223)
    const renesNpcs: Array<{
      id: string;
      name: string;
      title: string;
      subType: string;
      npcRole: 'legend_sage' | 'vendor' | 'priest_healer' | 'war_commander' | 'blacksmith';
      x: number;
      z: number;
      dialogId: string;
      sprNo: number;
    }> = [
      // Central Sanctuary Plaza (200, 165)
      {
        id: 'npc_blacksmith',
        name: 'Master Vulcan',
        title: '<Royal Blacksmith & Legend Sage>',
        subType: 'blacksmith',
        npcRole: 'legend_sage',
        x: 194,
        z: 162,
        dialogId: 'quest_1',
        sprNo: 18
      },
      {
        id: 'npc_vendor',
        name: 'Merchant Karl',
        title: '<Weapons, Potions & Provisions>',
        subType: 'vendor',
        npcRole: 'vendor',
        x: 194,
        z: 169,
        dialogId: 'quest_2',
        sprNo: 19
      },
      {
        id: 'npc_priest',
        name: 'High Priestess Orem',
        title: '<Temple of Orroy & Dual Class Guide>',
        subType: 'priest_healer',
        npcRole: 'priest_healer',
        x: 206,
        z: 162,
        dialogId: 'quest_3',
        sprNo: 68
      },
      {
        id: 'npc_commander',
        name: 'General Huch Nedval',
        title: '<Nation War & Arena Commander>',
        subType: 'war_commander',
        npcRole: 'war_commander',
        x: 200,
        z: 158,
        dialogId: 'quest_4',
        sprNo: 51
      },
      {
        id: 'npc_archmage',
        name: 'Archmage Tyburn',
        title: '<Wizard Guild & Spell Master>',
        subType: 'priest_healer',
        npcRole: 'priest_healer',
        x: 207,
        z: 168,
        dialogId: 'quest_3',
        sprNo: 64
      },
      {
        id: 'npc_job_master',
        name: 'Grand Master Artisan',
        title: '<Primary Job & Crafting Instructor>',
        subType: 'blacksmith',
        npcRole: 'blacksmith',
        x: 189,
        z: 165,
        dialogId: 'quest_1',
        sprNo: 18
      },
      // Southern Square (231, 223)
      {
        id: 'npc_south_vendor',
        name: 'Quartermaster Rolf',
        title: '<Southern Plaza Provisions>',
        subType: 'vendor',
        npcRole: 'vendor',
        x: 231,
        z: 221,
        dialogId: 'quest_2',
        sprNo: 19
      },
      {
        id: 'npc_south_smith',
        name: 'Armorer Gareth',
        title: '<Southern Plaza Weapon & Armor Repair>',
        subType: 'blacksmith',
        npcRole: 'blacksmith',
        x: 226,
        z: 224,
        dialogId: 'quest_1',
        sprNo: 18
      },
      {
        id: 'npc_south_healer',
        name: 'Sister Elena',
        title: '<Southern Plaza Healer>',
        subType: 'priest_healer',
        npcRole: 'priest_healer',
        x: 236,
        z: 224,
        dialogId: 'quest_3',
        sprNo: 68
      }
    ];

    for (const n of renesNpcs) {
      entities.push({
        id: n.id,
        name: n.name,
        title: n.title,
        type: 'npc',
        subType: n.subType,
        x: n.x,
        z: n.z,
        level: 99,
        hp: 9999,
        maxHp: 9999,
        nation: 'Zypern',
        hostile: false,
        npcRole: n.npcRole,
        dialogId: n.dialogId,
        sprNo: n.sprNo,
        direction: 0
      });
    }

    // Gathering Nodes located in the outskirts around Renes
    entities.push(
      {
        id: 'node_ore_1',
        name: 'Rich Mithril & Iron Vein',
        type: 'node',
        subType: 'mineral',
        x: cx - 14,
        z: cz - 6,
        level: 1,
        hp: 100,
        maxHp: 100,
        hostile: false,
        nodeJob: 'Mining',
        nodeResourceName: 'Mithril Ore',
        nodeRemaining: 25
      },
      {
        id: 'node_ore_2',
        name: 'Iron Ore Deposit',
        type: 'node',
        subType: 'mineral',
        x: cx - 13,
        z: cz + 6,
        level: 1,
        hp: 100,
        maxHp: 100,
        hostile: false,
        nodeJob: 'Mining',
        nodeResourceName: 'Iron Ore',
        nodeRemaining: 30
      },
      {
        id: 'node_tree_1',
        name: 'Ancient Oak Tree',
        type: 'node',
        subType: 'tree',
        x: cx + 14,
        z: cz - 6,
        level: 1,
        hp: 100,
        maxHp: 100,
        hostile: false,
        nodeJob: 'Lumberjacking',
        nodeResourceName: 'Oak Timber',
        nodeRemaining: 25
      },
      {
        id: 'node_herb_1',
        name: 'Glowing Moon Herb Patch',
        type: 'node',
        subType: 'herb',
        x: cx + 13,
        z: cz + 8,
        level: 1,
        hp: 100,
        maxHp: 100,
        hostile: false,
        nodeJob: 'Herb Digging',
        nodeResourceName: 'Moon Herb',
        nodeRemaining: 25
      },
      {
        id: 'node_fish_1',
        name: 'Renes River Fishing Spot',
        type: 'node',
        subType: 'fish',
        x: cx - 4,
        z: cz + 15,
        level: 1,
        hp: 100,
        maxHp: 100,
        hostile: false,
        nodeJob: 'Fishing',
        nodeResourceName: 'Fresh Salmon',
        nodeRemaining: 40
      }
    );

    // NO monsters inside Renes City Plazas!
    // Hunting monsters are placed only far outside the Southern Portal / Outskirts (around 187, 295..315)
    const renesOutskirtsMonsters = [
      { name: 'Wild Boar', sub: 'boar', lv: 8, hp: 320, x: 180, z: 298, tame: true },
      { name: 'Forest Goblin Scout', sub: 'goblin', lv: 14, hp: 520, x: 194, z: 302, tame: true },
      { name: 'Orc Berserker', sub: 'orc', lv: 25, hp: 980, x: 175, z: 308, tame: false },
      { name: 'Skeletal Spearman', sub: 'skeleton', lv: 32, hp: 1350, x: 202, z: 310, tame: false },
      { name: 'Dark Lizardman', sub: 'lizardman', lv: 40, hp: 1850, x: 185, z: 316, tame: true },
      { name: 'Stone Golem', sub: 'golem', lv: 48, hp: 2600, x: 198, z: 318, tame: false }
    ];
    renesOutskirtsMonsters.forEach((m, i) => {
      entities.push({
        id: `mon_renes_${i}`,
        name: m.name,
        type: 'monster',
        subType: m.sub,
        x: m.x,
        z: m.z,
        level: m.lv,
        hp: m.hp,
        maxHp: m.hp,
        hostile: true,
        tameable: m.tame
      });
    });

    // Warp Portals at outer plaza edges & RENES_C.bsd #30 Portal Area (187, 284)
    entities.push(
      {
        id: 'portal_to_main',
        name: 'Warp Gate: Wiseleton Hunting Grounds (MA-IN)',
        type: 'portal',
        subType: 'portal_blue',
        x: cx + 14,
        z: cz,
        level: 1,
        hp: 100,
        maxHp: 100,
        hostile: false,
        destMapId: 'MA-IN',
        destX: MAP_DEFAULT_SPAWNS['MA-IN'].x,
        destZ: MAP_DEFAULT_SPAWNS['MA-IN'].z
      },
      {
        id: 'portal_to_firedun',
        name: 'Warp Gate: Fire Cavern (FIREDUN1)',
        type: 'portal',
        subType: 'portal_red',
        x: cx - 14,
        z: cz,
        level: 75,
        hp: 100,
        maxHp: 100,
        hostile: false,
        destMapId: 'FIREDUN1',
        destX: MAP_DEFAULT_SPAWNS.FIREDUN1.x,
        destZ: MAP_DEFAULT_SPAWNS.FIREDUN1.z
      },
      {
        id: 'portal_to_war',
        name: 'Warp Gate: Nation War (G_BATTLE)',
        type: 'portal',
        subType: 'portal_gold',
        x: cx,
        z: cz - 11,
        level: 50,
        hp: 100,
        maxHp: 100,
        hostile: false,
        destMapId: 'G_BATTLE',
        destX: MAP_DEFAULT_SPAWNS.G_BATTLE.x,
        destZ: MAP_DEFAULT_SPAWNS.G_BATTLE.z
      },
      {
        id: 'portal_south_gate',
        name: 'Southern Gate Portal: Wiseleton (MA-IN)',
        type: 'portal',
        subType: 'portal_blue',
        x: 187,
        z: 284,
        level: 1,
        hp: 100,
        maxHp: 100,
        hostile: false,
        destMapId: 'MA-IN',
        destX: MAP_DEFAULT_SPAWNS['MA-IN'].x,
        destZ: MAP_DEFAULT_SPAWNS['MA-IN'].z
      }
    );
  } else if (mapId === 'FIREDUN1') {
    const dungeonMobs = [
      { name: 'Hell Hound', sub: 'boar', lv: 72, hp: 4200, x: cx - 6, z: cz + 4 },
      { name: 'Flame Gargoyle', sub: 'lizardman', lv: 85, hp: 5600, x: cx + 6, z: cz + 4 },
      { name: 'Abyssal Balrog', sub: 'golem', lv: 98, hp: 8500, x: cx - 5, z: cz - 4 },
      { name: 'Infernal Death Knight', sub: 'skeleton', lv: 105, hp: 9600, x: cx + 5, z: cz - 4 },
      { name: 'Red Dragon Amurtat [BOSS]', sub: 'dragon_boss', lv: 140, hp: 28000, x: cx, z: cz - 8 }
    ];
    dungeonMobs.forEach((m, i) => {
      entities.push({
        id: `mon_fire_${i}`,
        name: m.name,
        type: 'monster',
        subType: m.sub,
        x: m.x,
        z: m.z,
        level: m.lv,
        hp: m.hp,
        maxHp: m.hp,
        hostile: true,
        tameable: false
      });
    });
    entities.push({
      id: 'portal_back_renes',
      name: 'Return Gate: Renes City',
      type: 'portal',
      subType: 'portal_blue',
      x: cx,
      z: cz + 9,
      level: 1,
      hp: 100,
      maxHp: 100,
      hostile: false,
      destMapId: 'RENES_C',
      destX: MAP_DEFAULT_SPAWNS.RENES_C.x,
      destZ: MAP_DEFAULT_SPAWNS.RENES_C.z
    });
  } else if (mapId === 'G_BATTLE') {
    entities.push(
      {
        id: 'stone_vyseus',
        name: 'Vyseus Sacred Guard Stone',
        type: 'monster',
        subType: 'guard_stone',
        x: cx - 8,
        z: cz,
        level: 120,
        hp: 25000,
        maxHp: 25000,
        nation: 'Vyseus',
        hostile: false
      },
      {
        id: 'stone_zypern',
        name: 'Zypern Sacred Guard Stone',
        type: 'monster',
        subType: 'guard_stone',
        x: cx + 8,
        z: cz,
        level: 120,
        hp: 25000,
        maxHp: 25000,
        nation: 'Zypern',
        hostile: true
      },
      {
        id: 'stone_yllse',
        name: 'Yllse Sacred Guard Stone',
        type: 'monster',
        subType: 'guard_stone',
        x: cx,
        z: cz - 8,
        level: 120,
        hp: 25000,
        maxHp: 25000,
        nation: 'Yllse',
        hostile: true
      },
      {
        id: 'war_champ_zypern',
        name: 'Zypern Vanguard Commander',
        type: 'monster',
        subType: 'skeleton',
        x: cx + 5,
        z: cz + 2,
        level: 95,
        hp: 9500,
        maxHp: 9500,
        nation: 'Zypern',
        hostile: true
      },
      {
        id: 'war_champ_yllse',
        name: 'Yllse Blade Master',
        type: 'monster',
        subType: 'orc',
        x: cx,
        z: cz - 4,
        level: 95,
        hp: 9500,
        maxHp: 9500,
        nation: 'Yllse',
        hostile: true
      },
      {
        id: 'portal_war_exit',
        name: 'Return Gate: Renes City',
        type: 'portal',
        subType: 'portal_blue',
        x: cx,
        z: cz + 9,
        level: 1,
        hp: 100,
        maxHp: 100,
        hostile: false,
        destMapId: 'RENES_C',
        destX: MAP_DEFAULT_SPAWNS.RENES_C.x,
        destZ: MAP_DEFAULT_SPAWNS.RENES_C.z
      }
    );
  } else {
    // Town NPCs in Wiseleton (MA-IN), Barantan, and Hegmonia plazas
    if (mapId !== 'mon_arena') {
      entities.push(
        {
          id: `npc_${mapId}_smith`,
          name: `${mapId} Master Blacksmith`,
          title: '<Weapon & Armor Forge>',
          type: 'npc',
          subType: 'blacksmith',
          x: cx - 5,
          z: cz - 3,
          level: 99,
          hp: 9999,
          maxHp: 9999,
          nation: 'Vyseus',
          hostile: false,
          npcRole: 'blacksmith',
          dialogId: 'quest_1'
        },
        {
          id: `npc_${mapId}_vendor`,
          name: `${mapId} Quartermaster`,
          title: '<Potions & Provisions>',
          type: 'npc',
          subType: 'vendor',
          x: cx + 5,
          z: cz - 3,
          level: 85,
          hp: 9999,
          maxHp: 9999,
          nation: 'Vyseus',
          hostile: false,
          npcRole: 'vendor',
          dialogId: 'quest_2'
        },
        {
          id: `npc_${mapId}_healer`,
          name: `${mapId} High Cleric`,
          title: '<Sanctuary Healer>',
          type: 'npc',
          subType: 'priest_healer',
          x: cx,
          z: cz - 5,
          level: 99,
          hp: 9999,
          maxHp: 9999,
          nation: 'Vyseus',
          hostile: false,
          npcRole: 'priest_healer',
          dialogId: 'quest_3'
        }
      );
    }

    // Standard monsters placed outside the town plaza (or inside the arena)
    const baseLv = mapId === 'mon_arena' ? 85 : mapId === 'hegmonia' ? 65 : mapId === 'barantan' ? 55 : 35;
    const distOff = mapId === 'mon_arena' ? 6 : 18;
    const mobs = [
      { name: `${mapId} Guardian Knight`, sub: 'skeleton', x: cx - distOff, z: cz + distOff },
      { name: `${mapId} War Stalker`, sub: 'lizardman', x: cx + distOff, z: cz + distOff },
      { name: `${mapId} Titan Golem`, sub: 'golem', x: cx, z: cz + distOff + 4 },
      { name: `${mapId} Raiders`, sub: 'orc', x: cx - distOff + 4, z: cz + distOff + 3 }
    ];
    mobs.forEach((m, i) => {
      entities.push({
        id: `mon_${mapId}_${i}`,
        name: m.name,
        type: 'monster',
        subType: m.sub,
        x: m.x,
        z: m.z,
        level: baseLv + i * 6,
        hp: 1800 + i * 900,
        maxHp: 1800 + i * 900,
        hostile: true,
        tameable: true
      });
    });
    entities.push({
      id: `portal_${mapId}_renes`,
      name: 'Return Gate: Renes City',
      type: 'portal',
      subType: 'portal_blue',
      x: cx,
      z: cz + 7,
      level: 1,
      hp: 100,
      maxHp: 100,
      hostile: false,
      destMapId: 'RENES_C',
      destX: MAP_DEFAULT_SPAWNS.RENES_C.x,
      destZ: MAP_DEFAULT_SPAWNS.RENES_C.z
    });
  }

  return entities;
}

export function buildInitialSpells(): SpellEntry[] {
  const wiz: SpellEntry[] = EXTRACTED_DATA.wizardSpells.map((s, idx) => ({
    ...s,
    type: 'wizard' as const,
    learned: idx < 18
  }));
  const pri: SpellEntry[] = EXTRACTED_DATA.priestSpells.map((s, idx) => ({
    ...s,
    type: 'priest' as const,
    learned: idx < 12
  }));
  return [...wiz, ...pri];
}

export function buildInitialCombatSkills(): CombatSkillEntry[] {
  return EXTRACTED_DATA.combatSkills.map((cs, idx) => ({
    ...cs,
    learned: idx < 12
  }));
}

export function buildInitialQuests(): QuestStepDialog[] {
  const npcs = [
    { name: 'Master Vulcan', role: 'Royal Blacksmith & Legend Sage' },
    { name: 'Merchant Karl', role: 'Weapons & Provisions Vendor' },
    { name: 'High Priestess Orem', role: 'Temple of Orroy Guide' },
    { name: 'General Huch Nedval', role: 'Nation War & Arena Commander' }
  ];
  return EXTRACTED_DATA.quests.slice(0, 12).map((q, idx) => {
    const npc = npcs[idx % npcs.length];
    return {
      id: q.id,
      title: q.title.replace(/_/g, ' ').toUpperCase(),
      npcName: npc.name,
      npcRole: npc.role,
      steps: q.steps,
      rewardExp: q.rewardExp,
      rewardGold: q.rewardGold,
      rewardItemName: idx % 2 === 0 ? 'Legend Upgrade Stone (G2)' : 'Complete Healing Potion',
      status: idx === 0 ? 'active' : 'available',
      progress: 0,
      targetCount: 3
    };
  });
}

export function createStarterEquipmentAndBag(): {
  equipped: Partial<Record<string, GameItem>>;
  inventory: GameItem[];
  potionBox: GameItem[];
} {
  const rareMods = EXTRACTED_DATA.rareModifiers;
  const modForce = rareMods[0] || { id: 1, name: 'Force', explain: 'Increases physical damage' };
  const modVigor = rareMods[2] || { id: 3, name: 'Vigor', explain: 'Increases Attack Speed & Max HP' };
  const modSmart = rareMods[5] || { id: 6, name: 'Smart', explain: 'Increases Evasion & Movement' };

  const equipped: Partial<Record<string, GameItem>> = {
    weapon: {
      uid: 'eq_weapon_1',
      id: 'item_weapon_15',
      code: 15,
      name: 'Flame Blade of Vyseus [G2 Rare]',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/0601500.csp',
      category: 'weapon',
      slot: 'weapon',
      tier: 6,
      reqLevel: 40,
      price: 18500,
      quantity: 1,
      durability: 180,
      maxDurability: 180,
      attackMin: 68,
      attackMax: 112,
      defense: 0,
      tactic: 'Swordmanship',
      hpRestore: 0,
      mpRestore: 0,
      spRestore: 0,
      rarity: 'rare',
      grade: 2,
      rareStats: [
        { id: modForce.id, name: modForce.name, explain: modForce.explain, grade: 2, value: 24 },
        { id: modVigor.id, name: modVigor.name, explain: modVigor.explain, grade: 2, value: 18 }
      ]
    },
    shield: {
      uid: 'eq_shield_1',
      id: 'item_armor_4',
      code: 4,
      name: 'Chaos Shield [G1 Rare]',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/0800200.csp',
      category: 'armor',
      slot: 'shield',
      tier: 5,
      reqLevel: 35,
      price: 9200,
      quantity: 1,
      durability: 150,
      maxDurability: 150,
      attackMin: 0,
      attackMax: 0,
      defense: 42,
      tactic: 'Parrying',
      hpRestore: 0,
      mpRestore: 0,
      spRestore: 0,
      rarity: 'rare',
      grade: 1,
      rareStats: [{ id: modVigor.id, name: modVigor.name, explain: modVigor.explain, grade: 1, value: 12 }]
    },
    helmet: {
      uid: 'eq_helm_1',
      id: 'item_armor_12',
      code: 12,
      name: 'Grand Knight Visor [SokSung]',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/0801200.csp',
      category: 'armor',
      slot: 'helmet',
      tier: 5,
      reqLevel: 35,
      price: 11000,
      quantity: 1,
      durability: 140,
      maxDurability: 140,
      attackMin: 0,
      attackMax: 0,
      defense: 34,
      hpRestore: 0,
      mpRestore: 0,
      spRestore: 0,
      rarity: 'soksung',
      grade: 2,
      sokSungGroup: EXTRACTED_DATA.rareGroups[0]?.name || 'Guardian of Vyseus',
      rareStats: [{ id: modSmart.id, name: modSmart.name, explain: modSmart.explain, grade: 2, value: 16 }]
    },
    armor: {
      uid: 'eq_armor_1',
      id: 'item_armor_55',
      code: 55,
      name: 'Full Plate Armor [G2 Legend]',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/0805500.csp',
      category: 'armor',
      slot: 'armor',
      tier: 7,
      reqLevel: 45,
      price: 34000,
      quantity: 1,
      durability: 220,
      maxDurability: 220,
      attackMin: 0,
      attackMax: 0,
      defense: 78,
      hpRestore: 0,
      mpRestore: 0,
      spRestore: 0,
      rarity: 'legend',
      grade: 2,
      rareStats: [
        { id: modForce.id, name: modForce.name, explain: modForce.explain, grade: 2, value: 28 },
        { id: modVigor.id, name: modVigor.name, explain: modVigor.explain, grade: 2, value: 32 }
      ]
    },
    shoes: {
      uid: 'eq_shoes_1',
      id: 'item_armor_35',
      code: 35,
      name: 'Iron Boots [G1 Rare]',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/0803500.csp',
      category: 'armor',
      slot: 'shoes',
      tier: 5,
      reqLevel: 30,
      price: 7800,
      quantity: 1,
      durability: 120,
      maxDurability: 120,
      attackMin: 0,
      attackMax: 0,
      defense: 26,
      hpRestore: 0,
      mpRestore: 0,
      spRestore: 0,
      rarity: 'rare',
      grade: 1,
      rareStats: [{ id: modSmart.id, name: modSmart.name, explain: modSmart.explain, grade: 1, value: 20 }]
    },
    mantle: {
      uid: 'eq_mantle_1',
      id: 'item_accessory_39',
      code: 39,
      name: 'Cape of the Dragon Lord',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/0903900.csp',
      category: 'armor',
      slot: 'mantle',
      tier: 7,
      reqLevel: 40,
      price: 25000,
      quantity: 1,
      durability: 200,
      maxDurability: 200,
      attackMin: 8,
      attackMax: 15,
      defense: 38,
      hpRestore: 0,
      mpRestore: 0,
      spRestore: 0,
      rarity: 'legend',
      grade: 2,
      rareStats: [],
      enchantBonus: '+12% All Resist / +450 Max HP'
    },
    ring1: {
      uid: 'eq_ring_1',
      id: 'item_accessory_4',
      code: 4,
      name: 'Mighty Ring [G1 Rare]',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/0900400.csp',
      category: 'accessory',
      slot: 'ring1',
      tier: 4,
      reqLevel: 20,
      price: 6500,
      quantity: 1,
      durability: 120,
      maxDurability: 120,
      attackMin: 4,
      attackMax: 8,
      defense: 8,
      hpRestore: 0,
      mpRestore: 0,
      spRestore: 0,
      rarity: 'rare',
      grade: 1,
      rareStats: [{ id: modForce.id, name: modForce.name, explain: modForce.explain, grade: 1, value: 10 }]
    },
    necklace: {
      uid: 'eq_neck_1',
      id: 'item_accessory_15',
      code: 15,
      name: 'Amulet of Protection [G1 Rare]',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/0901500.csp',
      category: 'accessory',
      slot: 'necklace',
      tier: 4,
      reqLevel: 20,
      price: 7200,
      quantity: 1,
      durability: 120,
      maxDurability: 120,
      attackMin: 0,
      attackMax: 0,
      defense: 14,
      hpRestore: 0,
      mpRestore: 0,
      spRestore: 0,
      rarity: 'rare',
      grade: 1,
      rareStats: [{ id: modVigor.id, name: modVigor.name, explain: modVigor.explain, grade: 1, value: 12 }]
    },
    saddle: {
      uid: 'eq_saddle_1',
      id: 'item_acc_99',
      code: 99,
      name: 'Armored Warhorse Saddle',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/0804200.csp',
      category: 'accessory',
      slot: 'saddle',
      tier: 6,
      reqLevel: 30,
      price: 19000,
      quantity: 1,
      durability: 200,
      maxDurability: 200,
      attackMin: 0,
      attackMax: 0,
      defense: 22,
      hpRestore: 0,
      mpRestore: 0,
      spRestore: 0,
      rarity: 'rare',
      grade: 1,
      rareStats: [],
      enchantBonus: '+25% Mount Speed / +8 AC'
    },
    symbol: {
      uid: 'eq_symbol_1',
      id: 'item_symbol_1',
      code: 101,
      name: EXTRACTED_DATA.symbols[3]?.name || 'Symbol of the Dragon Knight',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/1100100.csp',
      category: 'accessory',
      slot: 'symbol',
      tier: 8,
      reqLevel: 40,
      price: 45000,
      quantity: 1,
      durability: 300,
      maxDurability: 300,
      attackMin: 15,
      attackMax: 25,
      defense: 25,
      hpRestore: 0,
      mpRestore: 0,
      spRestore: 0,
      rarity: 'symbol',
      grade: 3,
      rareStats: []
    }
  };

  const inventory: GameItem[] = [
    {
      uid: 'inv_fodder_1',
      id: 'item_weapon_22',
      code: 22,
      name: 'Two-Handed Sword [G1 Legend]',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/0602200.csp',
      category: 'weapon',
      slot: 'weapon',
      tier: 6,
      reqLevel: 40,
      price: 15000,
      quantity: 1,
      durability: 160,
      maxDurability: 160,
      attackMin: 74,
      attackMax: 128,
      defense: 0,
      tactic: 'Twinsword / 2H Swordmanship',
      hpRestore: 0,
      mpRestore: 0,
      spRestore: 0,
      rarity: 'legend',
      grade: 1,
      rareStats: [{ id: modForce.id, name: modForce.name, explain: modForce.explain, grade: 1, value: 16 }]
    },
    {
      uid: 'inv_staff_1',
      id: 'item_weapon_45',
      code: 45,
      name: 'Staff of Magic [G2 Rare]',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/0604500.csp',
      category: 'weapon',
      slot: 'weapon',
      tier: 6,
      reqLevel: 35,
      price: 14200,
      quantity: 1,
      durability: 140,
      maxDurability: 140,
      attackMin: 48,
      attackMax: 92,
      defense: 10,
      tactic: 'Whirl / Staff',
      hpRestore: 0,
      mpRestore: 0,
      spRestore: 0,
      rarity: 'rare',
      grade: 2,
      rareStats: [{ id: modSmart.id, name: modSmart.name, explain: modSmart.explain, grade: 2, value: 22 }]
    },
    {
      uid: 'inv_bow_1',
      id: 'item_weapon_62',
      code: 62,
      name: 'Composite Bow [G1 Rare]',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/0606200.csp',
      category: 'weapon',
      slot: 'weapon',
      tier: 5,
      reqLevel: 30,
      price: 11800,
      quantity: 1,
      durability: 150,
      maxDurability: 150,
      attackMin: 56,
      attackMax: 98,
      defense: 0,
      tactic: 'Archery',
      hpRestore: 0,
      mpRestore: 0,
      spRestore: 0,
      rarity: 'rare',
      grade: 1,
      rareStats: [{ id: modForce.id, name: modForce.name, explain: modForce.explain, grade: 1, value: 15 }]
    },
    {
      uid: 'inv_mat_mithril',
      id: 'mat_mithril',
      code: 201,
      name: 'Mithril Ore',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/0100500.csp',
      category: 'material_mineral',
      slot: 'material',
      tier: 4,
      reqLevel: 1,
      price: 240,
      quantity: 8,
      durability: 100,
      maxDurability: 100,
      attackMin: 0,
      attackMax: 0,
      defense: 0,
      hpRestore: 0,
      mpRestore: 0,
      spRestore: 0,
      rarity: 'normal',
      grade: 0,
      rareStats: []
    },
    {
      uid: 'inv_mat_iron',
      id: 'mat_iron',
      code: 202,
      name: 'Iron Ore',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/0100200.csp',
      category: 'material_mineral',
      slot: 'material',
      tier: 2,
      reqLevel: 1,
      price: 120,
      quantity: 12,
      durability: 100,
      maxDurability: 100,
      attackMin: 0,
      attackMax: 0,
      defense: 0,
      hpRestore: 0,
      mpRestore: 0,
      spRestore: 0,
      rarity: 'normal',
      grade: 0,
      rareStats: []
    },
    {
      uid: 'inv_mat_oak',
      id: 'mat_oak',
      code: 203,
      name: 'Timber',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/0102000.csp',
      category: 'material_plant',
      slot: 'material',
      tier: 3,
      reqLevel: 1,
      price: 110,
      quantity: 10,
      durability: 100,
      maxDurability: 100,
      attackMin: 0,
      attackMax: 0,
      defense: 0,
      hpRestore: 0,
      mpRestore: 0,
      spRestore: 0,
      rarity: 'normal',
      grade: 0,
      rareStats: []
    },
    {
      uid: 'inv_mat_herb',
      id: 'mat_herb',
      code: 204,
      name: 'Lavender Herb',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/0200400.csp',
      category: 'material_herb',
      slot: 'material',
      tier: 3,
      reqLevel: 1,
      price: 130,
      quantity: 10,
      durability: 100,
      maxDurability: 100,
      attackMin: 0,
      attackMax: 0,
      defense: 0,
      hpRestore: 0,
      mpRestore: 0,
      spRestore: 0,
      rarity: 'normal',
      grade: 0,
      rareStats: []
    },
    {
      uid: 'inv_mat_fish',
      id: 'mat_fish',
      code: 205,
      name: 'Roast Beef',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/0300100.csp',
      category: 'food',
      slot: 'consumable',
      tier: 2,
      reqLevel: 1,
      price: 90,
      quantity: 6,
      durability: 100,
      maxDurability: 100,
      attackMin: 0,
      attackMax: 0,
      defense: 0,
      hpRestore: 60,
      mpRestore: 0,
      spRestore: 45,
      rarity: 'normal',
      grade: 0,
      rareStats: []
    }
  ];

  const potionBox: GameItem[] = [
    {
      uid: 'pbox_hp',
      id: 'pot_hp_max',
      code: 301,
      name: 'Full Healing Potion',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/0400300.csp',
      category: 'potion',
      slot: 'consumable',
      tier: 5,
      reqLevel: 1,
      price: 250,
      quantity: 25,
      durability: 100,
      maxDurability: 100,
      attackMin: 0,
      attackMax: 0,
      defense: 0,
      hpRestore: 650,
      mpRestore: 0,
      spRestore: 0,
      rarity: 'normal',
      grade: 0,
      rareStats: []
    },
    {
      uid: 'pbox_mp',
      id: 'pot_mp_max',
      code: 302,
      name: 'Full Mana Potion',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/0400400.csp',
      category: 'potion',
      slot: 'consumable',
      tier: 5,
      reqLevel: 1,
      price: 250,
      quantity: 25,
      durability: 100,
      maxDurability: 100,
      attackMin: 0,
      attackMax: 0,
      defense: 0,
      hpRestore: 0,
      mpRestore: 500,
      spRestore: 0,
      rarity: 'normal',
      grade: 0,
      rareStats: []
    },
    {
      uid: 'pbox_food',
      id: 'food_steak',
      code: 303,
      name: 'Roast Chicken',
      iconUrl: '/api/data0/sprite?path=images/items/legacy/inventory/0302000.csp',
      category: 'food',
      slot: 'consumable',
      tier: 4,
      reqLevel: 1,
      price: 180,
      quantity: 15,
      durability: 100,
      maxDurability: 100,
      attackMin: 0,
      attackMax: 0,
      defense: 0,
      hpRestore: 150,
      mpRestore: 0,
      spRestore: 80,
      rarity: 'normal',
      grade: 0,
      rareStats: []
    }
  ];

  return { equipped, inventory, potionBox };
}

export const INITIAL_ACHIEVEMENTS: AchievementEntry[] = [
  {
    id: 'ach_1',
    title: 'Slayer of Renes Outskirts',
    category: 'Combat',
    description: 'Defeat 10 monsters in Battle or PK mode.',
    progress: 3,
    goal: 10,
    unlocked: false,
    rewardTitle: '<Blade of Renes>',
    rewardFame: 50
  },
  {
    id: 'ach_2',
    title: 'Grand Master Artisan',
    category: 'Crafting',
    description: 'Gather resources or craft 5 items using Primary Jobs.',
    progress: 2,
    goal: 5,
    unlocked: false,
    rewardTitle: '<Royal Craftsman>',
    rewardFame: 80
  },
  {
    id: 'ach_3',
    title: 'Legend Forgemaster',
    category: 'Legend',
    description: 'Upgrade or forge a Rare/Legend item at the Legend Workshop.',
    progress: 0,
    goal: 1,
    unlocked: false,
    rewardTitle: '<SokSung Sage>',
    rewardFame: 150
  },
  {
    id: 'ach_4',
    title: 'Vanguard of Hadesz',
    category: 'Nation War',
    description: 'Participate in Nation War (G_BATTLE) or damage an enemy Guard Stone.',
    progress: 1,
    goal: 1,
    unlocked: true,
    rewardTitle: '<War Hero of Vyseus>',
    rewardFame: 200
  }
];

export const INITIAL_MAILS: MailEntry[] = [
  {
    id: 'mail_1',
    sender: 'King of Vyseus',
    subject: 'Welcome to Dragon Raja 3D Pixel (v1.8.5.18)',
    body: 'Brave adventurer! The continent of Hadesz faces war once more against Zypern and Yllse. Visit Master Vulcan in Renes City to upgrade your Legend items, and press [TAB] to enter Battle Mode.',
    date: 'Today',
    read: false,
    attachedGold: 50000,
    claimed: false
  },
  {
    id: 'mail_2',
    sender: 'Master Vulcan',
    subject: 'Legend Workshop & SokSung Crafting Ready',
    body: 'I have prepared the Royal Smithy in Renes City. Bring your G1-G4 Legend equipment, Saddles, and Mantles to enchant and upgrade them to G5 Mythic grade.',
    date: 'Yesterday',
    read: true,
    attachedGold: 15000,
    claimed: true
  }
];

export const INITIAL_ARENA_LEADERBOARD: ArenaLeaderboardEntry[] = [
  {
    rank: 1,
    name: 'HuchNedval',
    nation: 'Vyseus',
    className: 'Warrior',
    dualClass: 'Dragon Slayer (D5)',
    level: 150,
    rating: 2480,
    wins: 142,
    losses: 18
  },
  {
    rank: 2,
    name: 'SansonPercival',
    nation: 'Vyseus',
    className: 'Warrior',
    dualClass: 'Paladin (D4)',
    level: 145,
    rating: 2390,
    wins: 128,
    losses: 24
  },
  {
    rank: 3,
    name: 'Tyburn',
    nation: 'Zypern',
    className: 'Wizard',
    dualClass: 'Archmage (D5)',
    level: 148,
    rating: 2355,
    wins: 119,
    losses: 27
  },
  {
    rank: 4,
    name: 'IrurilSereniel',
    nation: 'Yllse',
    className: 'Archer',
    dualClass: 'Highlander (D5)',
    level: 150,
    rating: 2310,
    wins: 110,
    losses: 21
  },
  {
    rank: 5,
    name: 'Afoum',
    nation: 'Zypern',
    className: 'Thief',
    dualClass: 'Night Hawk (D4)',
    level: 142,
    rating: 2240,
    wins: 98,
    losses: 31
  }
];
