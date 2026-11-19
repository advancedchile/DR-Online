export type NationId = 'Vyseus' | 'Zypern' | 'Yllse';

export type ClassId = 'Warrior' | 'Thief' | 'Archer' | 'Wizard' | 'Priest';

export type CombatMode = 'Peace' | 'Battle' | 'PK';

export type EquipmentSlot =
  | 'weapon'
  | 'shield'
  | 'helmet'
  | 'armor'
  | 'shoes'
  | 'ring1'
  | 'ring2'
  | 'necklace'
  | 'mantle'
  | 'saddle'
  | 'symbol';

export interface BaseAttributes {
  STR: number;
  CON: number;
  DEX: number;
  WIS: number;
  INT: number;
  MOVP: number;
  CHA: number;
  ENDU: number;
  MOR: number;
  LUCK: number;
  WSPS?: number;
}

export interface ElementalResists {
  Poison: number;
  Curse: number;
  Fire: number;
  Ice: number;
  Elect: number;
  Holy: number;
}

export interface TacticEntry {
  id: string;
  name: string;
  level: number;
  exp: number;
  maxExp: number;
}

export interface RareStatLine {
  id: number;
  name: string;
  explain: string;
  grade: number; // G1..G5
  value: number;
}

export interface GameItem {
  uid: string;
  id: string;
  code: number;
  name: string;
  iconUrl?: string;
  category:
    | 'weapon'
    | 'armor'
    | 'accessory'
    | 'potion'
    | 'food'
    | 'material_plant'
    | 'material_mineral'
    | 'material_herb'
    | 'tool'
    | 'etc';
  slot: string;
  tier: number;
  reqLevel: number;
  price: number;
  quantity: number;
  durability: number;
  maxDurability: number;
  attackMin: number;
  attackMax: number;
  defense: number;
  tactic?: string;
  hpRestore: number;
  mpRestore: number;
  spRestore: number;
  // Rare / SokSung / Legend properties
  rarity: 'normal' | 'rare' | 'soksung' | 'legend' | 'symbol';
  grade: number; // 0 for normal, 1..5 for G1..G5
  rareStats: RareStatLine[];
  sokSungGroup?: string;
  enchantBonus?: string;
}

export interface SpellEntry {
  id: string;
  index: number;
  name: string;
  description: string;
  type: 'wizard' | 'priest';
  circle: number;
  reqLevel: number;
  mpCost?: number;
  dpCost?: number;
  power: number;
  element?: string;
  role?: string;
  iconUrl?: string;
  learned: boolean;
}

export interface CombatSkillEntry {
  id: string;
  index: number;
  name: string;
  description: string;
  group: string;
  tier: number;
  reqLevel: number;
  cpCost: number;
  damageMultiplier: number;
  iconUrl?: string;
  learned: boolean;
}

export interface JobSkillEntry {
  id: string;
  name: string;
  category: 'gathering' | 'crafting';
  level: number;
  exp: number;
  maxExp: number;
  gmTitle: string;
  toolKeyword: string;
  description: string;
  iconUrl?: string;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  jobName: string;
  reqJobLevel: number;
  resultItemName: string;
  resultCategory: GameItem['category'];
  resultSlot: string;
  resultTier: number;
  materials: { name: string; count: number }[];
}

export interface WorldEntity {
  id: string;
  name: string;
  type: 'monster' | 'npc' | 'node' | 'portal' | 'tamed' | 'other_player';
  subType: string;
  sprNo?: number;
  direction?: number;
  x: number;
  z: number;
  targetX?: number;
  targetZ?: number;
  level: number;
  hp: number;
  maxHp: number;
  nation?: NationId;
  guild?: string;
  pkMode?: boolean;
  hostile: boolean;
  tameable?: boolean;
  ownerId?: string;
  // For NPCs
  npcRole?: 'vendor' | 'blacksmith' | 'quest' | 'priest_healer' | 'arena_master' | 'war_commander' | 'legend_sage';
  dialogId?: string;
  title?: string;
  // For Gathering Nodes
  nodeJob?: string;
  nodeResourceName?: string;
  nodeRemaining?: number;
  // For Portals
  destMapId?: string;
  destX?: number;
  destZ?: number;
  // Animation state
  lastHitTime?: number;
  attackAnimTime?: number;
  respawnAt?: number;
}

export interface BuildingStructure {
  id: string;
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  wallStyle: 'stone' | 'timber' | 'castle' | 'temple' | 'dark_brick';
  roofStyle: 'red_tile' | 'blue_slate' | 'thatch' | 'gold_dome' | 'obsidian';
  doorSide: 'south' | 'east' | 'west' | 'north';
}

export interface MapDefinition {
  id: string;
  codeName: string;
  name: string;
  nation: NationId | 'Neutral' | 'Warzone';
  biome: 'grassland' | 'desert' | 'snow' | 'dungeon_fire' | 'battlefield' | 'arena';
  width: number;
  depth: number;
  safeZone: boolean;
  recommendedLevel: string;
  weatherDefault: 'clear' | 'rain' | 'snow' | 'thunder';
  buildings: BuildingStructure[];
}

export interface QuestStepDialog {
  id: string;
  title: string;
  npcName: string;
  npcRole: string;
  steps: string[];
  rewardExp: number;
  rewardGold: number;
  rewardItemName?: string;
  status: 'available' | 'active' | 'completed';
  progress: number;
  targetCount: number;
}

export interface ChatMessage {
  id: string;
  channel: 'Normal' | 'Party' | 'Guild' | 'Nation' | 'Whisper' | 'System';
  sender: string;
  nation?: NationId;
  text: string;
  timestamp: string;
}

export interface FloatingTextEvent {
  id: string;
  x: number;
  y: number;
  z: number;
  text: string;
  color: string;
  createdAt: number;
  isCrit?: boolean;
}

export interface VisualEffectEvent {
  id: string;
  type: 'fire' | 'ice' | 'lightning' | 'holy' | 'heal' | 'slash' | 'meteor' | 'levelup' | 'gather' | 'ping';
  x: number;
  z: number;
  targetX?: number;
  targetZ?: number;
  color: string;
  createdAt: number;
  duration: number;
  label?: string;
}

export interface AutoClickerSettings {
  enabled: boolean;
  cps: number; // Clicks per second (1 - 20)
  holdMovement: boolean;
  holdCheck: boolean;
  notOnUI: boolean;
  autoAttackNearest: boolean;
}

export interface GameOptionsState {
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  weatherEffects: boolean;
  weatherOverride: 'map_default' | 'clear' | 'rain' | 'snow' | 'thunder';
  magicEffectShake: boolean;
  showGrid: boolean;
  showMinimap: boolean;
  keepMapCentered: boolean;
  goreEffects: boolean;
  showFloatingDamage: boolean;
  tameAutoAttack: boolean;
  tameAutoDefense: boolean;
  chatLocked: boolean;
  autoClicker: AutoClickerSettings;
}

export interface AchievementEntry {
  id: string;
  title: string;
  category: 'Combat' | 'Crafting' | 'Exploration' | 'Nation War' | 'Legend';
  description: string;
  progress: number;
  goal: number;
  unlocked: boolean;
  rewardTitle: string;
  rewardFame: number;
}

export interface MailEntry {
  id: string;
  sender: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  attachedGold?: number;
  claimed?: boolean;
}

export interface NationWarState {
  active: boolean;
  phase: 'Preparation' | 'Invasion' | 'Guard Stone Assault' | 'Victory';
  timeRemainingSec: number;
  scores: Record<NationId, number>;
  guardStones: {
    id: string;
    name: string;
    nation: NationId;
    hp: number;
    maxHp: number;
  }[];
  monsterWarWave: number;
}

export interface ArenaLeaderboardEntry {
  rank: number;
  name: string;
  nation: NationId;
  className: ClassId;
  dualClass: string;
  level: number;
  rating: number;
  wins: number;
  losses: number;
}

export type ActiveWindowId =
  | 'character'
  | 'inventory'
  | 'spells'
  | 'combat_skills'
  | 'jobs'
  | 'legend_workshop'
  | 'vendor'
  | 'arena_war'
  | 'party_guild'
  | 'achievements'
  | 'mail'
  | 'options'
  | 'world_map';
