import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import originalSqlDb from '../data/originalSqlDatabase.json';
import { Data0ArchiveManager } from './data0StreamPlugin';
import { FirebaseGameDb } from './firebaseDb';

const CMD_ACCEPT_CREATE = 13;
const CMD_ACCEPT_DELETE = 15;
const CMD_ACCESS_JOIN = 30;
const CMD_ASSIGN_SERVER_ID = 31;
const CMD_ACCEPT_JOIN = 32;
const CMD_ALL_READY = 33;
const CMD_USER_DB = 40;
const CMD_ENVIR_INFO = 41;
const CMD_CREATE_CHAR = 50;
const CMD_DELETE_CHAR = 52;
const CMD_NPC_ADD = 60;
const CMD_ITEM_EXCHANGE = 88;
const CMD_ITEM_EQUIP_OK = 98;
const CMD_EVENT = 100;
const CMD_CHANGE_MAP = 110;
const CMD_ITEM_BUY_REQ = 128;
const CMD_ITEM_SELL_REQ = 129;
const CMD_CONNECT_INFO = 200;
const CMD_INTERFACE_PEACE = 300;
const CMD_INTERFACE_BATTLE = 301;
const CMD_LEVELUP_POINT = 410;
const CMD_LEVELUP_POINT_OK = 420;
const CMD_CALL_SMALLMENU = 2000;
const CMD_STORE_ITEMLIST = 2001;
const CMD_CHR_ITEM_INFO_0 = 5000;
const CMD_CHR_ITEM_INFO_1 = 5001;
const CMD_CHR_ITEM_INFO_2 = 5002;
const CMD_CHAR_INFO_BASIC = 5003;
const CMD_CHAR_INFO_MAGIC = 5004;
const CMD_CHAR_INFO_SKILL = 5005;
const CMD_GIVE_ITEM = 5007;
const CMD_CHAR_INFO_TAC_SKILL_EXP = 5008;
const CMD_ACCESS_LOGIN = 6066;
const CMD_ACCEPT_LOGIN = 6067;
const CMD_CONNECT_AGENT_SERVER_CONFORM = 6098;
const CMD_ON_CONNECT = 6099;
const CMD_MOVE = 6100;
const CMD_ATTACK_RESULT = 6110;
const CMD_THROW_ATTACK = 6112;
const CMD_THROW_RESULT = 6113;
const CMD_ATTACK = 6200;
const CMD_CHAT_DATA = 6250;
const CMD_ISTHERE_CHARNAME = 7540;
const CMD_THEREIS_NO_CHARNAME = 7541;
const CMD_NPC_CHAT_DATA = 8427;
const CMD_AGENT_SERVER_IP = 8930;
const CMD_CONNECT_INFO1 = 10000;
const CMD_SUBTRACT_MONEY = 10056;
const CMD_ADD_MONEY = 10057;
const CMD_THROW_DICE = 10088;
const CMD_CREATE_ABILITY = 10089;
const CMD_CHECK_NEW_CHAR = 10120;
const CMD_CHECK_NEW_CHAR_OK = 10121;
const CMD_ACCEPT_JOIN_KEIN = 10152;
const CMD_RESET_JOB = 10213;
const CMD_SELECT_NATION = 10215;
const CMD_SCRIPT_MESSAGE_BOX = 10273;
const CMD_SELECTED_CHAR_RESULT_CLIENT_BOTH_DB_DEMON = 16103;
const CMD_QSF_COMMAND = 25001;

export interface WasmItemAttr {
  item_no: number;
  attr: [number, number, number, number, number, number];
}

export interface WasmCharacterRecord {
  name: string;
  gender: number; // 0 = female, 1 = male
  face: number;
  age: number;
  arigement: number;
  body_r: number;
  body_g: number;
  body_b: number;
  cloth_r: number;
  cloth_g: number;
  cloth_b: number;
  tactics: number;
  cla: number; // 0=Warrior, 1=Thief, 2=Archer, 3=Wizard, 4=Priest
  job: number;
  spell: number;
  level: number;
  exp: number;
  money: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  sp: number;
  maxSp: number;
  reservedPoint: number;
  nation: number; // 3=Vyseus, 4=Zypern, 6=Yilse
  mapName: string;
  tileX: number;
  tileY: number;
  abilities: number[]; // 11 stats: STR, CON, DEX, WIS, INT, MOVP, CHA, ENDU, MOR, LUCK, WSPS
  inv: WasmItemAttr[][][]; // [3][3][8]
  equip: WasmItemAttr[]; // [8]
  quick: WasmItemAttr[]; // [6]
}

interface WasmAccountRecord {
  id: string;
  email?: string;
  passwordHash?: string;
  createdAt?: string;
  nation: number;
  characters: Array<WasmCharacterRecord | null>; // 4 slots
}

interface MapSpawnConfig {
  mapName: string;
  tileX: number;
  tileY: number;
}

const START_MAP_BY_POSITION: Record<number, MapSpawnConfig> = {
  1: { mapName: 'K_SUNG2', tileX: 155, tileY: 165 }, // SC_HELTERNT_CASTLE
  2: { mapName: 'MA-IN', tileX: 256, tileY: 205 }, // SC_HELTERNT_VILLAGE
  3: { mapName: 'HU_VM', tileX: 120, tileY: 120 }, // SC_HUDAIN_RIVER
  4: { mapName: 'GRAY', tileX: 140, tileY: 140 }, // SC_GRAY_MOUNTAIN
  5: { mapName: 'KAL_OS', tileX: 130, tileY: 130 }, // SC_CALAHIL
  6: { mapName: 'BIS_I', tileX: 266, tileY: 280 }, // SC_BAISUS_IMPEL
  7: { mapName: 'RENES_C', tileX: 215, tileY: 195 }, // SC_RENUS
  8: { mapName: 'DEP', tileX: 180, tileY: 180 }, // SC_DEL_HAPPA
  9: { mapName: 'IRAMUS', tileX: 160, tileY: 160 }, // SC_IRAMUS
  10: { mapName: 'DEP', tileX: 180, tileY: 180 }, // SC_DIPH_UBEN
  11: { mapName: 'SCHOLIUM', tileX: 20, tileY: 12 }, // SC_SCHOLIUM (Tutorial 1 classroom)
  12: { mapName: 'TYNEN', tileX: 185, tileY: 190 }, // SC_TYREN
  13: { mapName: 'BARANTAN', tileX: 230, tileY: 225 }, // SC_BARANTAN
  14: { mapName: 'SCHOLIUM2', tileX: 20, tileY: 12 } // SC_SCHOLIUM2 (Tutorial 2 classroom)
};

// Base dice table from MenuStart.cpp (s_aSum5 / basic_ability)
const BASE_CLASS_ABILITIES: number[][] = [
  // STR, CON, DEX, WIS, INT, MOVP, CHA, ENDU, MOR, LUCK, WSPS
  [15, 13, 11, 10, 10, 10, 10, 12, 10, 10, 10], // Warrior (0)
  [11, 10, 16, 10, 10, 13, 10, 11, 10, 10, 10], // Thief (1)
  [12, 10, 16, 10, 10, 13, 10, 10, 10, 10, 10], // Archer (2)
  [10, 10, 10, 11, 16, 10, 10, 10, 10, 10, 14], // Wizard (3)
  [10, 11, 10, 16, 11, 10, 10, 10, 10, 10, 14]  // Priest (4)
];

const DEFAULT_EQUIP_DURABILITY = ((200 << 16) | 200) >>> 0; // MAKELONG(200, 200) -> 20/20 durability

function emptyItem(): WasmItemAttr {
  return { item_no: 0, attr: [0, 0, 0, 0, 0, 0] };
}

function makeItem(item_no: number, durationOrCount = DEFAULT_EQUIP_DURABILITY): WasmItemAttr {
  return { item_no, attr: [durationOrCount, 0, 0, 0, 0, 0] };
}

function getArmorVisualShape(itemNo: number | undefined, gender: number): number {
  if (!itemNo || itemNo === 8037 || itemNo === 8038) return 96; // Casual Wear
  if (itemNo === 8008) return gender === 0 ? 11 : 19; // Light Leather
  if (itemNo === 8002) return 7; // Robe
  return 96;
}

function getWeaponVisualShape(itemNo: number | undefined): number {
  if (!itemNo) return 0;
  switch (itemNo) {
    case 6001: return 29; // Dagger
    case 6002:
    case 6163: return 23; // Short Sword / M4U Sword
    case 6024: return 57; // Short Staff
    case 6028: return 49; // Short Bow
    case 6035:
    case 6062: return 61; // Mace / Small Hammer
    case 6142: return 29; // Double Dagger
    default: return 23;
  }
}

function getShieldVisualShape(itemNo: number | undefined): number {
  if (!itemNo) return 0;
  if (itemNo === 8066) return 79; // Small Shield
  return 0;
}

function writeFixedString(buf: Buffer, str: string, offset: number, maxLen: number): void {
  buf.fill(0, offset, offset + maxLen);
  if (!str) return;
  const bytes = Buffer.from(str, 'ascii');
  bytes.copy(buf, offset, 0, Math.min(bytes.length, maxLen - 1));
}

function readFixedString(buf: Buffer, offset: number, maxLen: number): string {
  if (offset >= buf.length) return '';
  const end = Math.min(buf.length, offset + maxLen);
  let zero = offset;
  while (zero < end && buf[zero] !== 0) zero++;
  return buf.toString('utf8', offset, zero).trim();
}

function writeItemAttr(buf: Buffer, offset: number, item: WasmItemAttr | undefined): void {
  const it = item || emptyItem();
  buf.writeInt16LE(it.item_no || 0, offset);
  buf.writeUInt16LE(0, offset + 2);
  for (let i = 0; i < 6; i++) {
    buf.writeUInt32LE((it.attr && it.attr[i]) || 0, offset + 4 + i * 4);
  }
}

function framePacket(type: number, payload?: Buffer): Buffer {
  const data = payload || Buffer.alloc(0);
  const size = data.length;
  const totalWireLen = 2 + 5 + size;
  const out = Buffer.alloc(totalWireLen);
  out.writeUInt16LE(5 + size, 0); // wire packet size = header(5) + payload(size)
  out.writeInt16LE(type, 2);
  out.writeInt16LE(size, 4);
  out.writeUInt8(0, 6); // crc
  if (size > 0) {
    data.copy(out, 7);
  }
  return out;
}

export class WasmNetServer {
  private accounts = new Map<string, WasmAccountRecord>();
  private activeSession: {
    userId: string;
    selectedCharName: string;
    lastDice1: number;
    lastDice2: number;
    pendingOutgoing: Buffer[];
    pendingDialogSteps: Array<{ npcId: number; bubble: string; box: string }>;
    completedGuideEvents: Set<number>;
    currentNpcs: Array<{
      idNpc: number;
      nSprNo: number;
      nNameNo: number;
      tileX: number;
      tileY: number;
      nRace: number;
      eventNo: number;
      hp: number;
      maxHp: number;
    }>;
  } = {
    userId: 'admin',
    selectedCharName: '',
    lastDice1: 3,
    lastDice2: 2,
    pendingOutgoing: [],
    pendingDialogSteps: [],
    completedGuideEvents: new Set<number>(),
    currentNpcs: []
  };
  private dbFilePath: string;
  private data0: Data0ArchiveManager;
  private firebaseDb: FirebaseGameDb;
  private levelMaxExp: number[] = [];

  constructor(data0: Data0ArchiveManager) {
    this.data0 = data0;
    this.dbFilePath = path.resolve(process.cwd(), 'wasm_accounts_db.json');
    this.firebaseDb = new FirebaseGameDb();
    this.loadLevelExpTable();
    this.loadAccounts();
    if (this.firebaseDb.isEnabled()) {
      void this.initFirebaseSync();
    }
  }

  public loadLevelExpTable(): void {
    try {
      const raw = this.data0.readEntry('data/tables/levelexp.bin');
      if (raw && raw.length > 200) {
        const dec = Buffer.from(raw);
        for (let i = 0; i < dec.length - 1; i++) {
          dec[i] = (dec[i] - (100 + i)) & 0xff;
        }
        const maxLv = Math.min(200, Math.floor((dec.length - 1) / 100));
        for (let lv = 0; lv < maxLv; lv++) {
          this.levelMaxExp[lv] = dec.readInt32LE(lv * 100 + 4);
        }
      }
    } catch {
      // fallback handled in getLevelMaxExp
    }
  }

  private getLevelMaxExp(level: number): number {
    const val = this.levelMaxExp[level];
    if (typeof val === 'number' && val > 0) return val;
    return level <= 1 ? 259 : level * level * 300;
  }

  private grantExpAndCheckLevelUp(ch: WasmCharacterRecord, expGain: number, replies: Buffer[]): void {
    if (expGain <= 0) return;
    ch.exp = (ch.exp || 0) + expGain;

    while (ch.level < 150 && ch.exp > this.getLevelMaxExp(ch.level)) {
      ch.level += 1;
      ch.reservedPoint += 10;
      ch.maxHp += 18;
      ch.hp = ch.maxHp;
      const lvBuf = Buffer.alloc(48, 0);
      lvBuf.writeUInt16LE(1, 0); // HeroServerID = 1
      lvBuf.writeInt16LE(ch.reservedPoint, 2);
      lvBuf.writeInt16LE(ch.level, 4);
      lvBuf.writeInt32LE(ch.maxHp, 8);
      replies.push(framePacket(CMD_LEVELUP_POINT, lvBuf));
    }

    const expBuf = Buffer.alloc(12, 0);
    expBuf.writeInt16LE(21, 0); // EXP = 21
    expBuf.writeUInt32LE(ch.exp >>> 0, 4);
    replies.push(framePacket(CMD_CHAR_INFO_BASIC, expBuf));
    this.saveAccounts();
  }

  private async initFirebaseSync(): Promise<void> {
    await this.firebaseDb.syncReferenceDatabaseOnce(originalSqlDb as Record<string, any>);
    const cloudAccounts = await this.firebaseDb.loadAllAccounts();
    if (cloudAccounts && Object.keys(cloudAccounts).length > 0) {
      for (const [k, v] of Object.entries(cloudAccounts)) {
        if (v && typeof v === 'object') {
          this.accounts.set(k.toLowerCase(), v as WasmAccountRecord);
        }
      }
    } else if (this.accounts.size > 0) {
      // Seed existing local accounts to Firebase on first connection
      const obj: Record<string, WasmAccountRecord> = {};
      for (const [k, v] of this.accounts.entries()) obj[k] = v;
      await this.firebaseDb.saveAllAccounts(obj);
    }
  }

  private loadAccounts(): void {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = JSON.parse(fs.readFileSync(this.dbFilePath, 'utf8'));
        if (raw && typeof raw === 'object') {
          let migrated = false;
          for (const [k, v] of Object.entries(raw)) {
            const acc = v as WasmAccountRecord;
            if (acc && Array.isArray(acc.characters)) {
              for (const ch of acc.characters) {
                if (!ch) continue;
                if (!ch.cloth_r && !ch.cloth_g && !ch.cloth_b) {
                  ch.cloth_r = 200;
                  ch.cloth_g = 180;
                  ch.cloth_b = 160;
                  migrated = true;
                }
                if (!ch.body_r && !ch.body_g && !ch.body_b) {
                  ch.body_r = 230;
                  ch.body_g = 195;
                  ch.body_b = 165;
                  migrated = true;
                }
                const armorNo = ch.equip?.[3]?.item_no || 0;
                const weaponNo = ch.equip?.[0]?.item_no || 0;
                const hasLegacyStarter =
                  armorNo === 0 ||
                  armorNo === 8001 ||
                  armorNo === 8002 ||
                  weaponNo === 0 ||
                  weaponNo === 6022 ||
                  weaponNo === 6038 ||
                  weaponNo === 6055 ||
                  weaponNo === 6076 ||
                  ch.equip?.[0]?.attr?.[0] === 10000600;
                if (hasLegacyStarter) {
                  const defaults = this.createDefaultInventory(ch.cla || 0, ch.gender || 0);
                  ch.equip = defaults.equip;
                  ch.inv = defaults.inv;
                  ch.quick = defaults.quick;
                  migrated = true;
                }
              }
            }
            this.accounts.set(k.toLowerCase(), acc);
          }
          if (migrated) {
            this.saveAccounts();
          }
        }
      }
    } catch {
      // ignore
    }
  }

  private saveAccounts(): void {
    try {
      const obj: Record<string, WasmAccountRecord> = {};
      for (const [k, v] of this.accounts.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync(this.dbFilePath, JSON.stringify(obj, null, 2), 'utf8');
      if (this.firebaseDb.isEnabled()) {
        void this.firebaseDb.saveAllAccounts(obj);
      }
    } catch {
      // ignore
    }
  }

  private getOrCreateAccount(userId: string): WasmAccountRecord {
    const key = (userId || 'admin').toLowerCase();
    let acc = this.accounts.get(key);
    if (!acc) {
      acc = {
        id: userId || 'admin',
        nation: 3, // Vyseus default
        characters: [null, null, null, null]
      };
      this.accounts.set(key, acc);
      this.saveAccounts();
    }
    return acc;
  }

  private findChar(acc: WasmAccountRecord, name: string): WasmCharacterRecord | null {
    const target = (name || '').toLowerCase();
    for (const c of acc.characters) {
      if (c && c.name.toLowerCase() === target) return c;
    }
    for (const c of acc.characters) {
      if (c) return c;
    }
    return null;
  }

  private createDefaultInventory(cla: number, gender = 0): {
    inv: WasmItemAttr[][][];
    equip: WasmItemAttr[];
    quick: WasmItemAttr[];
  } {
    const inv: WasmItemAttr[][][] = [];
    for (let a = 0; a < 3; a++) {
      inv[a] = [];
      for (let b = 0; b < 3; b++) {
        inv[a][b] = [];
        for (let c = 0; c < 8; c++) {
          inv[a][b][c] = emptyItem();
        }
      }
    }
    const equip: WasmItemAttr[] = [];
    for (let i = 0; i < 8; i++) equip.push(emptyItem());
    const quick: WasmItemAttr[] = [];
    for (let i = 0; i < 6; i++) quick.push(emptyItem());

    const casualWearNo = gender === 0 ? 8038 : 8037; // 8038 = Female Casual wear, 8037 = Male Casual Wear

    // Equip starter weapon & Casual Wear based on class & gender (all 0 stat requirement items)
    // WT_WEAPON = 0, WT_SHIELD = 1, WT_HELMET = 2, WT_ARMOR = 3, WT_NECK = 4, WT_SHOES = 5
    equip[3] = makeItem(casualWearNo);
    equip[5] = makeItem(8022); // Leather Shoes

    if (cla === 0) {
      // Warrior
      equip[0] = makeItem(6163); // M4U Sword (0 req)
      equip[1] = makeItem(8066); // Small Shield (0 req)
      inv[0][0][0] = makeItem(6001); // Dagger (basic weapon)
      inv[0][0][1] = makeItem(6002); // Short Sword
    } else if (cla === 1) {
      // Thief
      equip[0] = makeItem(6001); // Dagger (0 req)
      inv[0][0][0] = makeItem(6001); // Spare Dagger
      inv[0][0][1] = makeItem(6142); // Double Dagger
    } else if (cla === 2) {
      // Archer
      equip[0] = makeItem(6028); // Short Bow (0 req)
      equip[1] = makeItem(7005); // Light Arrow (0 req)
      inv[0][0][0] = makeItem(6028); // Spare Short Bow
      inv[0][0][1] = makeItem(7005); // Spare Light Arrow
    } else if (cla === 3) {
      // Wizard
      equip[0] = makeItem(6024); // Short Staff (0 req)
      inv[0][0][0] = makeItem(6024); // Spare Short Staff
      inv[0][0][1] = makeItem(6001); // Dagger
    } else {
      // Priest
      equip[0] = makeItem(6062); // Small Hammer (0 req)
      equip[1] = makeItem(8066); // Small Shield (0 req)
      inv[0][0][0] = makeItem(6062); // Spare Small Hammer
      inv[0][0][1] = makeItem(6035); // Mace
    }

    // Basic clothing & starter consumables in bag [0][0] and quickbar
    inv[0][0][2] = makeItem(casualWearNo); // Female/Male Casual wear
    inv[0][0][3] = makeItem(8008); // Light Leather
    inv[0][0][4] = makeItem(4001); // Red Potion
    inv[0][0][5] = makeItem(4003); // Orange Potion
    inv[0][0][6] = makeItem(3002); // Bread
    quick[0] = makeItem(4001);
    quick[1] = makeItem(4003);

    return { inv, equip, quick };
  }

  private buildAcceptLoginPacket(acc: WasmAccountRecord): Buffer {
    // sizeof(t_server_accept_login) == 188 (4-byte aligned)
    const buf = Buffer.alloc(188, 0);
    buf.writeInt16LE(1, 0); // server_id = 1
    for (let i = 0; i < 4; i++) {
      const ch = acc.characters[i];
      if (!ch) continue;
      writeFixedString(buf, ch.name, 2 + i * 20, 20);
      buf.writeUInt8(ch.level || 1, 82 + i);
      buf.writeUInt8(ch.job || 20, 86 + i);
      buf.writeUInt8(ch.cla || 0, 90 + i);
      buf.writeUInt8(ch.gender || 0, 94 + i);
      buf.writeUInt8(ch.body_r || 230, 98 + i);
      buf.writeUInt8(ch.body_g || 195, 102 + i);
      buf.writeUInt8(ch.body_b || 165, 106 + i);
      buf.writeUInt8(ch.cloth_r || 200, 110 + i);
      buf.writeUInt8(ch.cloth_g || 180, 114 + i);
      buf.writeUInt8(ch.cloth_b || 160, 118 + i);
      buf.writeInt16LE(ch.age || 18, 122 + i * 2);
      // 2 bytes padding at 130..131 for unsigned int money[4]
      buf.writeUInt32LE(ch.money ?? 5000, 132 + i * 4);
      buf.writeUInt8(getArmorVisualShape(ch.equip?.[3]?.item_no, ch.gender || 0), 148 + i); // acc_equip1 (96 = Casual Wear)
      buf.writeUInt8(0, 152 + i); // acc_equip2
      buf.writeUInt8(getWeaponVisualShape(ch.equip?.[0]?.item_no), 156 + i); // acc_equip3 (weapon visual)
      buf.writeUInt8(getShieldVisualShape(ch.equip?.[1]?.item_no), 160 + i); // acc_equip4 (shield visual)
    }
    buf.writeInt8(acc.nation || 3, 164); // nation offset == 164
    buf.writeInt16LE(365, 166); // remained_day
    writeFixedString(buf, acc.id, 168, 20);
    return framePacket(CMD_ACCEPT_LOGIN, buf);
  }

  private buildUserDbPacket(ch: WasmCharacterRecord): Buffer {
    // sizeof(t_server_user_db_data) == 232 (4-byte aligned, mapname @ 128, nation @ 188)
    const buf = Buffer.alloc(232, 0);
    buf.writeInt16LE(ch.level || 1, 0);
    buf.writeUInt32LE(ch.exp || 0, 4);
    writeFixedString(buf, ch.name, 8, 20);

    // short int Attr[10] @ 28..47
    buf.writeInt16LE(ch.gender || 0, 28 + 0 * 2); // GENDER
    buf.writeInt16LE(ch.face || 0, 28 + 1 * 2); // FACE
    buf.writeInt16LE(ch.arigement || 0, 28 + 2 * 2); // ARIGEMENT
    buf.writeInt16LE(ch.cla || 0, 28 + 3 * 2); // CLASS
    buf.writeInt16LE(ch.spell || 0, 28 + 4 * 2); // SPELL
    buf.writeInt16LE(ch.tactics || 0, 28 + 5 * 2); // TACTICS

    // short int Avility[20] @ 48..87
    for (let i = 0; i < 11; i++) {
      buf.writeInt16LE(ch.abilities?.[i] ?? 12, 48 + i * 2);
    }

    buf.writeUInt32LE(ch.money ?? 5000, 88);
    buf.writeInt32LE(ch.hp || 120, 92);
    buf.writeInt32LE(ch.maxHp || 120, 96);
    buf.writeInt32LE(ch.mp || 100, 100);
    buf.writeInt32LE(ch.maxMp || 100, 104);
    buf.writeInt32LE(ch.sp || 100, 108);
    buf.writeInt32LE(ch.maxSp || 100, 112);

    buf.writeInt8(ch.spell || 0, 116);
    buf.writeUInt8(0, 117); // condition = 0 (normal)
    buf.writeInt16LE(ch.gender || 0, 118); // sprno (0 = female, 1 = male)

    const px = (ch.tileX || 20) * 32 + 16;
    const py = (ch.tileY || 12) * 32 + 16;
    buf.writeInt16LE(px, 120);
    buf.writeInt16LE(py, 122);

    buf.writeUInt8(getArmorVisualShape(ch.equip?.[3]?.item_no, ch.gender || 0), 124); // acc_equip1 (96 = Casual Wear)
    buf.writeUInt8(0, 125); // acc_equip2
    buf.writeUInt8(getWeaponVisualShape(ch.equip?.[0]?.item_no), 126); // acc_equip3 (weapon visual)
    buf.writeUInt8(getShieldVisualShape(ch.equip?.[1]?.item_no), 127); // acc_equip4 (shield visual)

    // mapname[20] @ 128..147
    writeFixedString(buf, ch.mapName || 'SCHOLIUM', 128, 20);

    buf.writeUInt8(ch.body_r || 230, 148);
    buf.writeUInt8(ch.body_g || 195, 149);
    buf.writeUInt8(ch.body_b || 165, 150);
    buf.writeUInt8(ch.cloth_r || 200, 151);
    buf.writeUInt8(ch.cloth_g || 180, 152);
    buf.writeUInt8(ch.cloth_b || 160, 153);

    buf.writeInt32LE(0, 156); // sight / potion_box1
    buf.writeInt16LE(ch.age || 18, 160);
    buf.writeInt16LE(0, 162); // openhouse
    buf.writeInt16LE(ch.reservedPoint || 0, 164);
    buf.writeInt8(0, 166); // viewtype = VIEWTYPE_NORMAL_
    buf.writeInt16LE(0, 168); // social_status
    buf.writeInt16LE(100, 170); // fame

    // nation @ 188 (bitfield: nation:3 in lower bits)
    const nationCode = ch.nation || 3;
    buf.writeUInt32LE(nationCode & 0x7, 188);

    return framePacket(CMD_USER_DB, buf);
  }

  private buildEnvirInfoPacket(mapName: string): Buffer {
    const buf = Buffer.alloc(36, 0);
    buf.writeUInt32LE(12, 0); // currtime_count (daytime)
    buf.writeUInt32LE(0, 4); // weather_count
    buf.writeUInt32LE(0, 8); // rainstart
    buf.writeUInt32LE(0, 12); // rainend
    buf.writeInt16LE(0, 16); // amount
    buf.writeInt16LE(20, 18); // temperature
    writeFixedString(buf, mapName, 20, 16);
    return framePacket(CMD_ENVIR_INFO, buf);
  }

  private buildMapNpcPackets(mapName: string, centerTileX: number, centerTileY: number): Buffer[] {
    const packets: Buffer[] = [];
    this.activeSession.currentNpcs = [];
    const npcTable: Record<string, any> = (originalSqlDb as any).npcTable || {};
    const bundle = this.data0.buildMapBundle(mapName);

    let nextNpcId = 10001;
    const addNpc = (sprNo: number, nameNo: number, tx: number, ty: number, race: number, eventNo: number) => {
      const idNpc = nextNpcId++;
      const isDummy = sprNo >= 92 && sprNo <= 97;
      const maxHp = race === 0 || isDummy ? 999999 : 90;
      this.activeSession.currentNpcs.push({
        idNpc,
        nSprNo: sprNo,
        nNameNo: nameNo,
        tileX: tx,
        tileY: ty,
        nRace: race,
        eventNo,
        hp: maxHp,
        maxHp
      });

      const px = tx * 32 + 16;
      const py = ty * 32 + 16;
      const buf = Buffer.alloc(16, 0);
      // DWORD 0: nX:15, nY:15, nStatus:2 (0 = alive)
      const w0 = ((px & 0x7fff) | ((py & 0x7fff) << 15)) >>> 0;
      // DWORD 1: nHomeX:10, nHomeY:10, nSprNo:9, nEventNpc:1, nAIType:1, nRecall:1
      const isEvent = eventNo > 0 ? 1 : 0;
      const w1 = ((tx & 0x3ff) | ((ty & 0x3ff) << 10) | ((sprNo & 0x1ff) << 20) | (isEvent << 29) | (1 << 30)) >>> 0;
      // DWORD 2: idNpc:16, nNameNo:13, nMutant:3
      const w2 = ((idNpc & 0xffff) | ((nameNo & 0x1fff) << 16)) >>> 0;
      // DWORD 3: nViewType:4, nAttr:4, nRace:4
      const w3 = (((race & 0x0f) << 8)) >>> 0;

      buf.writeUInt32LE(w0, 0);
      buf.writeUInt32LE(w1, 4);
      buf.writeUInt32LE(w2, 8);
      buf.writeUInt32LE(w3, 12);
      packets.push(framePacket(CMD_NPC_ADD, buf));
    };

    const upper = mapName.toUpperCase();
    let skbAdded = 0;
    if (bundle) {
      try {
        const parsed = JSON.parse(bundle.json);
        const spawns: Array<{ x: number; y: number; npcIndex: number; eventNo: number }> = parsed.skbSpawns || [];
        for (const sp of spawns) {
          if (skbAdded >= 200) break;
          const row = npcTable[String(sp.npcIndex)];
          const sprNo = row ? Number(row.sprNo) : 8;
          if (sprNo <= 0) continue;
          const isAnimalOrDummy =
            sprNo === 2 ||
            sprNo === 5 ||
            sprNo === 28 ||
            sprNo === 29 ||
            sprNo === 30 ||
            sprNo === 53 ||
            (sprNo >= 92 && sprNo <= 97);
          const isHumanNpc =
            !isAnimalOrDummy &&
            ((sprNo >= 18 && sprNo <= 27) ||
              (sprNo >= 63 && sprNo <= 90) ||
              row?.npcRace === 0 ||
              row?.npcRace === 1 ||
              (sp.eventNo > 0 && sp.eventNo < 20));
          const race = isHumanNpc ? 0 : 2;
          const evNo = sp.eventNo || (upper.startsWith('SCHOLIUM') && isHumanNpc ? 1 : 0);
          addNpc(sprNo, sp.npcIndex, sp.x, sp.y, race, evNo);
          skbAdded++;
        }
      } catch {
        // ignore
      }
    }

    if (upper === 'SCHOLIUM' || upper === 'SCHOLIUM2') {
      // Spawn standing Guide Instructor NPC directly inside the starting classroom (21, 16)
      addNpc(72, 80, 21, 16, 0, 1);
      if (skbAdded === 0) {
        addNpc(80, 80, centerTileX + 2, centerTileY - 4, 0, 1);
      }
    } else {
      // Town service NPCs near player spawn so shops/banks/healers/smiths work immediately
      addNpc(23, 11, centerTileX + 4, centerTileY - 2, 0, 201); // Blacksmith (Weapon/Armor Store)
      addNpc(69, 12, centerTileX - 4, centerTileY - 2, 0, 202); // Alchemist (Potion Store)
      addNpc(28, 13, centerTileX + 4, centerTileY + 3, 0, 203); // Banker
      addNpc(18, 14, centerTileX - 4, centerTileY + 3, 0, 204); // Guild / Skill Master
    }

    return packets;
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(`dr-online:${password}`).digest('hex');
  }

  public getPortalStats(): { online: boolean; accountsCount: number; firebaseConnected: boolean } {
    return {
      online: true,
      accountsCount: this.accounts.size,
      firebaseConnected: this.firebaseDb.isEnabled()
    };
  }

  private toPublicAccount(acc: WasmAccountRecord) {
    const classNames = ['Warrior', 'Thief', 'Archer', 'Wizard', 'Priest'];
    const nationNames: Record<number, string> = { 3: 'Vyseus', 4: 'Zypern', 6: 'Yllse' };
    return {
      id: acc.id,
      email: acc.email || '',
      nation: nationNames[acc.nation] || 'Vyseus',
      createdAt: acc.createdAt || '',
      characters: (acc.characters || [])
        .filter((c): c is WasmCharacterRecord => Boolean(c))
        .map((c) => ({
          name: c.name,
          level: c.level,
          className: classNames[c.cla] || 'Warrior',
          mapName: c.mapName
        }))
    };
  }

  public registerAccount(usernameRaw: string, emailRaw: string, passwordRaw: string): {
    ok: boolean;
    error?: string;
    account?: ReturnType<WasmNetServer['toPublicAccount']>;
  } {
    const username = (usernameRaw || '').trim();
    const email = (emailRaw || '').trim();
    const password = (passwordRaw || '').trim();
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
      return { ok: false, error: 'INVALID_USERNAME' };
    }
    if (!email || !email.includes('@')) {
      return { ok: false, error: 'INVALID_EMAIL' };
    }
    if (password.length < 4 || password.length > 20) {
      return { ok: false, error: 'INVALID_PASSWORD' };
    }
    const key = username.toLowerCase();
    if (this.accounts.has(key)) {
      return { ok: false, error: 'USERNAME_EXISTS' };
    }
    const acc: WasmAccountRecord = {
      id: username,
      email,
      passwordHash: this.hashPassword(password),
      createdAt: new Date().toISOString(),
      nation: 0,
      characters: [null, null, null, null]
    };
    this.accounts.set(key, acc);
    this.activeSession.userId = username;
    this.saveAccounts();
    return { ok: true, account: this.toPublicAccount(acc) };
  }

  public loginAccount(usernameRaw: string, passwordRaw: string): {
    ok: boolean;
    error?: string;
    account?: ReturnType<WasmNetServer['toPublicAccount']>;
  } {
    const username = (usernameRaw || '').trim();
    const password = (passwordRaw || '').trim();
    if (!username || !password) {
      return { ok: false, error: 'MISSING_CREDENTIALS' };
    }
    const key = username.toLowerCase();
    const acc = this.accounts.get(key);
    if (!acc) {
      return { ok: false, error: 'ACCOUNT_NOT_FOUND' };
    }
    if (acc.passwordHash && acc.passwordHash !== this.hashPassword(password)) {
      return { ok: false, error: 'WRONG_PASSWORD' };
    }
    this.activeSession.userId = acc.id;
    return { ok: true, account: this.toPublicAccount(acc) };
  }

  public handleConnect(port: number): Buffer {
    if (port === 9000) {
      // Proxy server connection: GetAgentServerIPAddress expects CMD_AGENT_SERVER_IP (8930) immediately
      const payload = Buffer.alloc(18, 0);
      writeFixedString(payload, '127.0.0.1', 0, 18);
      return framePacket(CMD_AGENT_SERVER_IP, payload);
    }
    // Agent / Map server connection: send CMD_ON_CONNECT (6099)
    const payload = Buffer.alloc(32, 0);
    return framePacket(CMD_ON_CONNECT, payload);
  }

  public handlePoll(): Buffer {
    if (this.activeSession.pendingOutgoing.length === 0) {
      return Buffer.alloc(0);
    }
    const out = Buffer.concat(this.activeSession.pendingOutgoing);
    this.activeSession.pendingOutgoing = [];
    return out;
  }

  public handleSend(rawBuf: Buffer): Buffer {
    const replies: Buffer[] = [];
    let offset = 0;

    while (offset + 7 <= rawBuf.length) {
      const wireLen = rawBuf.readUInt16LE(offset);
      const type = rawBuf.readInt16LE(offset + 2);
      const size = rawBuf.readInt16LE(offset + 4);
      const payloadStart = offset + 7;
      const packetEnd = offset + 2 + (wireLen >= 5 ? wireLen : 5 + Math.max(0, size));
      if (packetEnd > rawBuf.length) break;
      const payload = rawBuf.subarray(payloadStart, Math.min(rawBuf.length, payloadStart + Math.max(0, size)));
      offset = packetEnd;

      this.processPacket(type, payload, replies);
    }

    if (this.activeSession.pendingOutgoing.length > 0) {
      replies.push(...this.activeSession.pendingOutgoing);
      this.activeSession.pendingOutgoing = [];
    }

    return replies.length > 0 ? Buffer.concat(replies) : Buffer.alloc(0);
  }

  private processPacket(type: number, payload: Buffer, replies: Buffer[]): void {
    switch (type) {
      case CMD_CONNECT_AGENT_SERVER_CONFORM: {
        const userId = readFixedString(payload, 0, 20) || 'admin';
        this.activeSession.userId = userId;
        const resp = Buffer.alloc(44, 0);
        writeFixedString(resp, userId, 0, 20);
        resp.writeInt32LE(100, 40); // iKey = 100 (success)
        replies.push(framePacket(CMD_CONNECT_AGENT_SERVER_CONFORM, resp));
        break;
      }

      case CMD_ACCESS_LOGIN: {
        // HSEL_INITIAL (24 bytes) + id[20] @ 24
        const idFromPacket = payload.length >= 44 ? readFixedString(payload, 24, 20) : '';
        const userId = idFromPacket || this.activeSession.userId || 'admin';
        this.activeSession.userId = userId;
        const acc = this.getOrCreateAccount(userId);
        replies.push(this.buildAcceptLoginPacket(acc));
        break;
      }

      case CMD_SELECTED_CHAR_RESULT_CLIENT_BOTH_DB_DEMON: {
        const charName = payload.length >= 24 ? readFixedString(payload, 4, 20) : '';
        if (charName) this.activeSession.selectedCharName = charName;
        const resp = Buffer.alloc(28, 0);
        resp.writeInt32LE(1, 0); // iKey = 1 -> opens MN_START_MAP (+ MN_SELECT_TUTORIAL_LOGIN if lv < 8)
        writeFixedString(resp, charName || this.activeSession.selectedCharName, 4, 20);
        resp.writeInt32LE(1, 24);
        replies.push(framePacket(CMD_SELECTED_CHAR_RESULT_CLIENT_BOTH_DB_DEMON, resp));
        break;
      }

      case CMD_CREATE_ABILITY: {
        replies.push(framePacket(CMD_CREATE_ABILITY, Buffer.alloc(0)));
        break;
      }

      case CMD_THROW_DICE: {
        const d1 = 1 + Math.floor(Math.random() * 5);
        const d2 = 1 + Math.floor(Math.random() * 5);
        this.activeSession.lastDice1 = d1;
        this.activeSession.lastDice2 = d2;
        const resp = Buffer.alloc(2, 0);
        resp.writeInt8(d1, 0);
        resp.writeInt8(d2, 1);
        replies.push(framePacket(CMD_THROW_DICE, resp));
        break;
      }

      case CMD_CHECK_NEW_CHAR: {
        replies.push(framePacket(CMD_CHECK_NEW_CHAR_OK, Buffer.alloc(0)));
        break;
      }

      case CMD_ISTHERE_CHARNAME: {
        replies.push(framePacket(CMD_THEREIS_NO_CHARNAME, Buffer.alloc(0)));
        break;
      }

      case CMD_CREATE_CHAR: {
        const acc = this.getOrCreateAccount(this.activeSession.userId);
        const name = readFixedString(payload, 0, 20) || 'Hero';
        const gender = payload.readUInt8(20);
        const face = payload.readUInt8(21);
        const age = payload.readInt16LE(22);
        const arigement = payload.readUInt8(24);
        const body_r = payload.readUInt8(25);
        const body_g = payload.readUInt8(26);
        const body_b = payload.readUInt8(27);
        const cloth_r = payload.readUInt8(28);
        const cloth_g = payload.readUInt8(29);
        const cloth_b = payload.readUInt8(30);
        const tactics = payload.readUInt8(31);
        const cla = Math.min(4, Math.max(0, payload.readUInt8(32)));
        const job = payload.readUInt8(33);
        const spell = payload.readUInt8(34);

        const baseStats = [...(BASE_CLASS_ABILITIES[cla] || BASE_CLASS_ABILITIES[0])];
        baseStats[0] += this.activeSession.lastDice1;
        baseStats[1] += this.activeSession.lastDice2;

        const { inv, equip, quick } = this.createDefaultInventory(cla, gender);
        const newChar: WasmCharacterRecord = {
          name,
          gender,
          face,
          age: age || 18,
          arigement,
          body_r: body_r || 230,
          body_g: body_g || 195,
          body_b: body_b || 165,
          cloth_r: cloth_r || 200,
          cloth_g: cloth_g || 180,
          cloth_b: cloth_b || 160,
          tactics,
          cla,
          job,
          spell,
          level: 1,
          exp: 0,
          money: 5000,
          hp: 120,
          maxHp: 120,
          mp: 100,
          maxMp: 100,
          sp: 100,
          maxSp: 100,
          reservedPoint: 0,
          nation: acc.nation || 3,
          mapName: 'SCHOLIUM',
          tileX: 20,
          tileY: 12,
          abilities: baseStats,
          inv,
          equip,
          quick
        };

        let placed = false;
        for (let i = 0; i < 4; i++) {
          if (!acc.characters[i]) {
            acc.characters[i] = newChar;
            placed = true;
            break;
          }
        }
        if (!placed) acc.characters[0] = newChar;
        this.activeSession.selectedCharName = name;
        this.saveAccounts();

        replies.push(framePacket(CMD_ACCEPT_CREATE, Buffer.alloc(0)));
        break;
      }

      case CMD_RESET_JOB: {
        const acc = this.getOrCreateAccount(this.activeSession.userId);
        const job = payload.readUInt8(0);
        const cls = payload.readUInt8(1);
        const name = readFixedString(payload, 2, 20);
        const ch = this.findChar(acc, name || this.activeSession.selectedCharName);
        if (ch) {
          ch.job = job;
          ch.cla = cls;
          this.saveAccounts();
        }
        break;
      }

      case CMD_SELECT_NATION: {
        const acc = this.getOrCreateAccount(this.activeSession.userId);
        const nation = payload.readUInt8(0);
        const name = readFixedString(payload, 1, 20);
        if (nation > 0 && nation < 10) {
          acc.nation = nation;
          const ch = this.findChar(acc, name || this.activeSession.selectedCharName);
          if (ch) ch.nation = nation;
          this.saveAccounts();
        }
        break;
      }

      case CMD_DELETE_CHAR: {
        const acc = this.getOrCreateAccount(this.activeSession.userId);
        const name = readFixedString(payload, 0, 20).toLowerCase();
        for (let i = 0; i < 4; i++) {
          if (acc.characters[i] && acc.characters[i]!.name.toLowerCase() === name) {
            acc.characters[i] = null;
            break;
          }
        }
        this.saveAccounts();
        replies.push(framePacket(CMD_ACCEPT_DELETE, Buffer.alloc(0)));
        break;
      }

      case CMD_CONNECT_INFO: {
        const acc = this.getOrCreateAccount(this.activeSession.userId);
        const name = readFixedString(payload, 0, 20);
        const startPos = payload.length > 20 ? payload.readUInt8(20) : 99;
        if (name) this.activeSession.selectedCharName = name;
        const ch = this.findChar(acc, name || this.activeSession.selectedCharName);
        if (ch) {
          if (startPos !== 99 && START_MAP_BY_POSITION[startPos]) {
            const target = START_MAP_BY_POSITION[startPos];
            ch.mapName = target.mapName;
            ch.tileX = target.tileX;
            ch.tileY = target.tileY;
          } else if (!ch.mapName) {
            ch.mapName = ch.level <= 1 ? 'SCHOLIUM' : 'MA-IN';
            ch.tileX = ch.level <= 1 ? 20 : 256;
            ch.tileY = ch.level <= 1 ? 12 : 205;
          }
          if (
            ch.mapName.toUpperCase().startsWith('SCHOLIUM') &&
            (ch.tileX < 5 || ch.tileY < 5 || (ch.tileX === 103 && ch.tileY === 108))
          ) {
            ch.tileX = 20;
            ch.tileY = 12;
          }
          this.saveAccounts();
        }

        // Reply with CMD_CONNECT_INFO (k_server_connect_info_kein, 128 bytes zero-initialized)
        const resp = Buffer.alloc(128, 0);
        writeFixedString(resp, '127.0.0.1', 0, 18);
        writeFixedString(resp, '127.0.0.1', 18, 18);
        writeFixedString(resp, '127.0.0.1', 36, 18);
        resp.writeInt32LE(9001, 56); // port
        resp.writeUInt8(startPos, 60); // startposition
        replies.push(framePacket(CMD_CONNECT_INFO, resp));
        break;
      }

      case CMD_ACCESS_JOIN: {
        const acc = this.getOrCreateAccount(this.activeSession.userId);
        const name = payload.length >= 60 ? readFixedString(payload, 40, 20) : '';
        if (name) this.activeSession.selectedCharName = name;
        const ch =
          this.findChar(acc, name || this.activeSession.selectedCharName) ||
          acc.characters.find((c) => c !== null) ||
          null;

        if (ch) {
          if (
            ch.mapName.toUpperCase().startsWith('SCHOLIUM') &&
            (ch.tileX < 5 || ch.tileY < 5 || (ch.tileX === 103 && ch.tileY === 108))
          ) {
            ch.tileX = 20;
            ch.tileY = 12;
            this.saveAccounts();
          }
          const px = ch.tileX * 32 + 16;
          const py = ch.tileY * 32 + 16;
          // 1. CMD_USER_DB (allocates Hero in RecvHeroInit)
          replies.push(this.buildUserDbPacket(ch));
          // 2. CMD_ASSIGN_SERVER_ID (sets HeroServerID = Hero->id = 1)
          const assignBuf = Buffer.alloc(6, 0);
          assignBuf.writeInt16LE(1, 0);
          assignBuf.writeInt16LE(px, 2);
          assignBuf.writeInt16LE(py, 4);
          replies.push(framePacket(CMD_ASSIGN_SERVER_ID, assignBuf));
          // 3. CMD_ENVIR_INFO
          replies.push(this.buildEnvirInfoPacket(ch.mapName));
          // 4. CMD_ACCEPT_JOIN (unblocks DoAccessJoin -> RecvConnectInfo -> ListenCommand = CMD_CONNECT_INFO)
          // Note: RecvAcceptJoin expects pixel coordinates (divides p->x, p->y by TILE_SIZE = 32)!
          const acceptBuf = Buffer.alloc(4, 0);
          acceptBuf.writeInt16LE(px, 0);
          acceptBuf.writeInt16LE(py, 2);
          replies.push(framePacket(CMD_ACCEPT_JOIN, acceptBuf));
        }
        break;
      }

      case CMD_CHR_ITEM_INFO_0: {
        const acc = this.getOrCreateAccount(this.activeSession.userId);
        const ch = this.findChar(acc, this.activeSession.selectedCharName);
        if (ch) {
          // Also send equipped items (CMD_CHR_ITEM_INFO_1) and quickbar items (CMD_CHR_ITEM_INFO_2)
          const equipBuf = Buffer.alloc(224, 0);
          for (let i = 0; i < 8; i++) {
            writeItemAttr(equipBuf, i * 28, ch.equip?.[i]);
          }
          replies.push(framePacket(CMD_CHR_ITEM_INFO_1, equipBuf));

          const quickBuf = Buffer.alloc(168, 0);
          for (let i = 0; i < 6; i++) {
            writeItemAttr(quickBuf, i * 28, ch.quick?.[i]);
          }
          replies.push(framePacket(CMD_CHR_ITEM_INFO_2, quickBuf));

          for (let a = 0; a < 3; a++) {
            for (let b = 0; b < 3; b++) {
              // sizeof(t_chr_item_info0) == 228 (ar0, ar1, 2-byte pad, ItemAttr[8])
              const buf = Buffer.alloc(228, 0);
              buf.writeInt8(a, 0);
              buf.writeInt8(b, 1);
              for (let c = 0; c < 8; c++) {
                writeItemAttr(buf, 4 + c * 28, ch.inv?.[a]?.[b]?.[c]);
              }
              replies.push(framePacket(CMD_CHR_ITEM_INFO_0, buf));
            }
          }
        }
        break;
      }

      case CMD_CHR_ITEM_INFO_1: {
        const acc = this.getOrCreateAccount(this.activeSession.userId);
        const ch = this.findChar(acc, this.activeSession.selectedCharName);
        if (ch) {
          // sizeof(t_chr_item_info1) == 224 (ItemAttr[8])
          const buf = Buffer.alloc(224, 0);
          for (let i = 0; i < 8; i++) {
            writeItemAttr(buf, i * 28, ch.equip?.[i]);
          }
          replies.push(framePacket(CMD_CHR_ITEM_INFO_1, buf));
        }
        break;
      }

      case CMD_CHR_ITEM_INFO_2: {
        const acc = this.getOrCreateAccount(this.activeSession.userId);
        const ch = this.findChar(acc, this.activeSession.selectedCharName);
        if (ch) {
          // sizeof(t_chr_item_info2) == 168 (ItemAttr[6])
          const buf = Buffer.alloc(168, 0);
          for (let i = 0; i < 6; i++) {
            writeItemAttr(buf, i * 28, ch.quick?.[i]);
          }
          replies.push(framePacket(CMD_CHR_ITEM_INFO_2, buf));
        }
        break;
      }

      case CMD_CHAR_INFO_MAGIC: {
        const buf = Buffer.alloc(200, 0);
        // Unlock basic spells 1..15 so spellbook works out of the box
        for (let i = 1; i <= 15; i++) buf[i] = 1;
        replies.push(framePacket(CMD_CHAR_INFO_MAGIC, buf));
        break;
      }

      case CMD_CHAR_INFO_SKILL: {
        const buf = Buffer.alloc(200, 0);
        for (let i = 1; i <= 45; i++) buf[i] = 1;
        replies.push(framePacket(CMD_CHAR_INFO_SKILL, buf));
        break;
      }

      case CMD_CHAR_INFO_TAC_SKILL_EXP: {
        const buf = Buffer.alloc(72, 0);
        for (let i = 0; i < 13; i++) {
          buf.writeUInt32LE(1500, i * 4);
        }
        replies.push(framePacket(CMD_CHAR_INFO_TAC_SKILL_EXP, buf));
        break;
      }

      case CMD_CONNECT_INFO1: {
        replies.push(framePacket(CMD_ACCEPT_JOIN_KEIN, Buffer.alloc(0)));
        break;
      }

      case CMD_ALL_READY: {
        const acc = this.getOrCreateAccount(this.activeSession.userId);
        const ch = this.findChar(acc, this.activeSession.selectedCharName);
        if (ch) {
          const acceptBuf = Buffer.alloc(4, 0);
          acceptBuf.writeInt16LE(ch.tileX * 32 + 16, 0);
          acceptBuf.writeInt16LE(ch.tileY * 32 + 16, 2);
          replies.push(framePacket(CMD_ACCEPT_JOIN, acceptBuf));
          replies.push(...this.buildMapNpcPackets(ch.mapName, ch.tileX, ch.tileY));
        }
        break;
      }

      case CMD_MOVE: {
        const acc = this.getOrCreateAccount(this.activeSession.userId);
        const ch = this.findChar(acc, this.activeSession.selectedCharName);
        if (ch && payload.length >= 16) {
          const gox = payload.readInt16LE(12);
          const goy = payload.readInt16LE(14);
          if (gox > 0 && goy > 0) {
            // C++ client sends gox/goy in pixel coordinates (tile * 32 + 16)
            ch.tileX = gox >= 32 ? Math.floor(gox / 32) : gox;
            ch.tileY = goy >= 32 ? Math.floor(goy / 32) : goy;
            this.saveAccounts();
          }
        }
        break;
      }

      case CMD_CHAT_DATA: {
        if (payload.length >= 5) {
          const chatType = payload.readUInt8(2);
          const len = payload.readUInt8(3);
          const text = readFixedString(payload, 4, len || 200);
          const resp = Buffer.alloc(4 + text.length + 1, 0);
          resp.writeInt16LE(1, 0); // HeroServerID = 1
          resp.writeUInt8(chatType, 2);
          resp.writeUInt8(text.length + 1, 3);
          writeFixedString(resp, text, 4, text.length + 1);
          replies.push(framePacket(CMD_CHAT_DATA, resp));
        }
        break;
      }

      case CMD_INTERFACE_PEACE: {
        const buf = Buffer.alloc(2, 0);
        buf.writeInt16LE(1, 0);
        replies.push(framePacket(CMD_INTERFACE_PEACE, buf));
        break;
      }

      case CMD_INTERFACE_BATTLE: {
        const buf = Buffer.alloc(2, 0);
        buf.writeInt16LE(1, 0);
        replies.push(framePacket(CMD_INTERFACE_BATTLE, buf));
        break;
      }

      case CMD_EVENT: {
        const acc = this.getOrCreateAccount(this.activeSession.userId);
        const ch = this.findChar(acc, this.activeSession.selectedCharName);
        if (!ch || payload.length < 4) break;
        const evType = payload.readInt16LE(0);
        const evNo = payload.readInt16LE(2);

        const emitDialogStep = (_npcId: number, _overheadMsg: string, boxMsg: string, hasMoreSteps: boolean) => {
          // Send only the TALK modal (CMD_SCRIPT_MESSAGE_BOX) without duplicating an overhead chat bubble / chat log entry
          // Prefix '\x01' tells RecvScriptMessageBox that clicking DONE should advance to the next step
          const taggedBox = hasMoreSteps ? `\x01${boxMsg}` : boxMsg;
          const msgBuf = Buffer.alloc(300, 0);
          writeFixedString(msgBuf, taggedBox, 0, 299);
          replies.push(framePacket(CMD_SCRIPT_MESSAGE_BOX, msgBuf));
        };

        if (evType === 0 && evNo === 9999) {
          // Next step of an active multi-step NPC tutorial dialogue
          const nextStep = this.activeSession.pendingDialogSteps.shift();
          if (nextStep) {
            emitDialogStep(
              nextStep.npcId,
              nextStep.bubble,
              nextStep.box,
              this.activeSession.pendingDialogSteps.length > 0
            );
          }
          break;
        }

        if (evType === 0) {
          // EVENT_TYPE_NPC (0)
          const npc = this.activeSession.currentNpcs.find((n) => n.idNpc === evNo);
          if (npc) {
            const startDialogSequence = (npcId: number, steps: Array<{ bubble: string; box: string }>) => {
              if (steps.length === 0) return;
              this.activeSession.pendingDialogSteps = steps.slice(1).map((s) => ({
                npcId,
                bubble: s.bubble,
                box: s.box
              }));
              emitDialogStep(npcId, steps[0].bubble, steps[0].box, steps.length > 1);
            };

            const isTutorialMap = ch.mapName.toUpperCase().startsWith('SCHOLIUM');

            if (isTutorialMap && npc.eventNo >= 14 && npc.eventNo <= 19) {
              // SCHOLIUM Tutorial Shops (Weapon Shop=14/19, Smith=15, Store=16, Bakery=17, Alchemy=18)
              let shopLine = 'Welcome! Browse our beginner supplies before heading into battle.';
              let menuId = 18;
              let storeItems = [6001, 6002, 6024, 6028, 6035, 6062, 6163, 7005, 8008, 8022, 8037, 8038, 8066];
              if (npc.eventNo === 18) {
                shopLine = 'When you need Potion, come to me.';
                menuId = 22;
                storeItems = [4001, 4002, 4003, 4005];
              } else if (npc.eventNo === 17) {
                shopLine = 'A variety of dishes are ready. This market is cheaper than other places.';
                menuId = 22;
                storeItems = [3001, 3002, 4001, 4003];
              } else if (npc.eventNo === 15) {
                shopLine = 'I manage all the iron-made arms and defense items.';
              } else if (npc.eventNo === 16) {
                shopLine = 'Wizard Robe and leather shoes are sold only here.';
              }
              const chatBytes = Buffer.from(shopLine, 'ascii');
              const chatLen = Math.min(250, chatBytes.length);
              const chatBuf = Buffer.alloc(4 + chatLen + 1, 0);
              chatBuf.writeInt16LE(npc.idNpc, 0);
              chatBuf.writeUInt8(0, 2);
              chatBuf.writeUInt8(chatLen, 3);
              chatBytes.copy(chatBuf, 4, 0, chatLen);
              replies.push(framePacket(CMD_CHAT_DATA, chatBuf));

              const storeBuf = Buffer.alloc(6 + 300 * 2, 0);
              storeBuf.writeInt16LE(storeItems.length, 0);
              storeBuf.writeInt16LE(menuId, 2);
              storeBuf.writeInt16LE(1, 4);
              for (let i = 0; i < storeItems.length; i++) {
                storeBuf.writeInt16LE(storeItems[i], 6 + i * 2);
              }
              replies.push(framePacket(CMD_STORE_ITEMLIST, storeBuf));
            } else if (isTutorialMap || npc.eventNo === 100) {
              // Multi-step authentic Dragon Raja SCHOLIUM Guide Dialogues (en_quests.txt)
              const alreadyDone = this.activeSession.completedGuideEvents.has(npc.eventNo);
              let steps: Array<{ bubble: string; box: string }> = [
                {
                  bubble: 'Welcome to Dragon Raja!',
                  box: 'Welcome to Dragon Raja! Step onto the glowing Portal on the carpet to advance to the next room.'
                }
              ];

              switch (npc.eventNo) {
                case 1:
                  if (alreadyDone) {
                    this.activeSession.completedGuideEvents.delete(1);
                    steps = [
                      {
                        bubble: 'Go to the Portal Area on the blue carpet and meet the next instructor!',
                        box: 'Go to Portal Area: Walk out the door to the east hallway and step onto the glowing Portal on the blue carpet to enter Room 2!'
                      }
                    ];
                  } else {
                    this.activeSession.completedGuideEvents.add(1);
                    steps = [
                      {
                        bubble: "Welcome to Dragon Raja! I'll let you know the key functions of Main Interface.",
                        box: '[1/4] Welcome to Dragon Raja! There are 6 buttons in the center of the Main Interface: Character Sheet (A), Inventory (W), Party (P), Magic Book, Combat Skills and Common Skills.'
                      },
                      {
                        bubble: ch.spell === 1
                          ? 'The Red orb is Life, the Green orb is Divine, and the Yellow bar is Hunger.'
                          : 'The Red orb is Life, the Blue orb is Mana, and the Yellow bar is Hunger.',
                        box: ch.spell === 1
                          ? '[2/4] Life is recovered with Healing Potions, Hunger with bread, and Divine recovers over time. Below Hunger are 3 gauges for Magic, Weapon Tactic and Job Skill.'
                          : '[2/4] Life is recovered with Healing Potions, Mana with Mana Potions, and Hunger with bread. Below Hunger are 3 gauges for Magic, Weapon Tactic and Job Skill.'
                      },
                      {
                        bubble: 'Click PEACE (or press TAB) for BATTLE mode, and press Enter to chat!',
                        box: '[3/4] Click PEACE on the bottom-right (or press TAB) to enter BATTLE mode. Click MAP (M) to view locations, and press Enter to open the chat bar.'
                      },
                      {
                        bubble: 'Now that you are ready, go through the portal and talk to the person in the next room!',
                        box: '[4/4] Open your Inventory (W) to check your equipped weapon. Then walk through the doors to the blue carpet and step into the glowing Portal to reach Room 2!'
                      }
                    ];
                  }
                  break;
                case 2:
                  if (ch.level < 4) {
                    ch.level = 4;
                    ch.exp = 1500;
                    ch.reservedPoint += 30;
                    this.saveAccounts();
                    const lvBuf = Buffer.alloc(48, 0);
                    lvBuf.writeUInt16LE(1, 0);
                    lvBuf.writeInt16LE(ch.reservedPoint, 2);
                    lvBuf.writeInt16LE(ch.level, 4);
                    lvBuf.writeInt32LE(ch.maxHp, 8);
                    replies.push(framePacket(CMD_LEVELUP_POINT, lvBuf));
                  }
                  steps = [
                    {
                      bubble: "Hello! I'm gonna teach you how to battle and train.",
                      box: '[1/2] Battle Training: Equip your weapon, switch from PEACE to BATTLE (bottom-right button or TAB), and Left Click on the training mannequins to practice attacking!'
                    },
                    {
                      bubble: "Once you're done training, go through the north-east portal to continue!",
                      box: '[2/2] You have been granted Level 4 (+30 Ability Points)! Practice on the mannequins if you wish, then step into the glowing Portal on the north-east blue carpet!'
                    }
                  ];
                  break;
                case 3:
                  steps = [
                    {
                      bubble: 'You did a good job of Leveling Up! I will teach you the use of Ability points.',
                      box: '[1/2] Can you see the flashing LEVEL UP on the bottom-left of your HUD? Click it to open your Ability sheet! Every Level Up grants 10 points.'
                    },
                    {
                      bubble: 'Now that you have learnt about Abilities, go through the south portal!',
                      box: '[2/2] Primary stats: Warriors (STR/CON), Archers & Thieves (DEX/MOVP), Wizards (INT/WS), Priests (WIS/PS). Step into the south Portal when ready!'
                    }
                  ];
                  break;
                case 4:
                  steps = [
                    {
                      bubble: 'Every class can use Magic if you raise the needed Abilities and Tactic!',
                      box: '[1/2] Wizards use INT/WS & Magery (memorize spells from Magic Book); Priests use WIS/PS & Orison. Open the Spell Menu (star icon) to select a spell.'
                    },
                    {
                      bubble: "That's all I can tell you, move through the south portal!",
                      box: '[2/2] Right Click on yourself or a target to cast your selected spell, or bind spells to F1-F8 with Ctrl+F1..F8. Proceed to the south Portal!'
                    }
                  ];
                  break;
                case 5:
                  steps = [
                    {
                      bubble: 'You know what Tactic means? Tactic is your weapon and magic mastery level.',
                      box: '[1/2] Tactic measures your proficiency with each weapon type and magic school. Raising Tactic boosts attack power and unlocks stronger weapons!'
                    },
                    {
                      bubble: 'Head through the east portal on the blue carpet to the next stage!',
                      box: '[2/2] Check your Tactic progress in Character Sheet -> Tactics. Walk east onto the glowing Portal on the blue carpet to continue!'
                    }
                  ];
                  break;
                case 6:
                  steps = [
                    {
                      bubble: "What does 'Party' make you think about? Party lets you team up safely!",
                      box: '[1/2] Open the Party Menu (P) in PEACE mode, hold Ctrl and Left Click a player onto a slot (or type /party Name) to share EXP without hurting allies.'
                    },
                    {
                      bubble: 'Now go through the south portal to reach the shops and battle test area!',
                      box: '[2/2] Up to 6 adventurers can form a Party for bonus EXP. Step onto the south Portal on the blue carpet!'
                    }
                  ];
                  break;
                case 7:
                  steps = [
                    {
                      bubble: 'Now, your first battle test! Buy potions and equipment from the shops nearby!',
                      box: '[1/2] Speak with the Weapon, Blacksmith, Store, Bakery and Alchemy masters in this courtyard to buy potions, food and equipment.'
                    },
                    {
                      bubble: 'When finished, enter the glowing portal on the east side!',
                      box: '[2/2] Practice fighting monsters in the yard, then walk to the east blue carpet Portal (166, 70) to continue!'
                    }
                  ];
                  break;
                case 8:
                  steps = [
                    {
                      bubble: 'Are you curious about the stories under way in the world of Dragon Raja?',
                      box: "In Dragon Raja, the Scenario Quest 'Return of Dragon Lord' unfolds across the continent. Unite with fellow heroes! Proceed to the south Portal."
                    }
                  ];
                  break;
                case 9:
                  steps = [
                    {
                      bubble: "Hello, I'm going to tell you what Dual Class is.",
                      box: 'At Level 105 with 2000 Fame and an Extreme Stone, you can combine two classes into a Dual Class with bonus stats and a Dual Symbol! Step into the south Portal.'
                    }
                  ];
                  break;
                case 10:
                  steps = [
                    {
                      bubble: 'Guild is a community of players sharing ambition, Guild Marks, and Emporia!',
                      box: 'Guild members share a Guild Mark, ally protection, and compete in the Colossus Arena. Step into the east Portal to learn about the Three Nations!'
                    }
                  ];
                  break;
                case 11:
                  steps = [
                    {
                      bubble: 'There are three countries in Dragon Raja: Vyseus, Zypern and Yllse!',
                      box: 'Join Local War, Castle War, and Snow War for Fame and Dual Fame rewards! Head west to the glowing Portal (158, 109) to continue.'
                    }
                  ];
                  break;
                case 12:
                  steps = [
                    {
                      bubble: 'Do you wish to train efficiently? Fight monsters within 6 levels of you!',
                      box: 'Hunt monsters within 6 levels of your character, form Parties, and learn Job Skills (mining, farming, smithing, alchemy) in town! Step into the west Portal.'
                    }
                  ];
                  break;
                case 13:
                  steps = [
                    {
                      bubble: "Congratulations! Now it's time for you to travel to your nation's village!",
                      box: '[1/2] Congratulations on completing the Dragon Raja Guide! In town, visit the Alchemy shop for potions and hunt Slimes outside the gates.'
                    },
                    {
                      bubble: 'Step into the south exit portal whenever you are ready to enter your village!',
                      box: '[2/2] Walk south to the final exit archway (39, 145) to travel directly to your nation village!'
                    }
                  ];
                  break;
                case 20:
                  steps = [
                    {
                      bubble: 'Switch PEACE to BATTLE (or press TAB) to attack training targets!',
                      box: 'Training Dummy: Click PEACE on the bottom-right HUD (or press TAB) to switch to BATTLE mode, then Left Click the dummy to attack.'
                    }
                  ];
                  break;
                default:
                  if (npc.nRace === 2) {
                    steps = [
                      {
                        bubble: 'Switch PEACE to BATTLE (or press TAB) to practice combat!',
                        box: 'Training Creature: Click PEACE on the bottom-right HUD (or press TAB) to switch to BATTLE mode and practice combat.'
                      }
                    ];
                  }
                  break;
              }

              startDialogSequence(npc.idNpc, steps);
            } else if (npc.eventNo === 203) {
              // Banker -> MN_BANK_DEPOSIT (15)
              const smBuf = Buffer.alloc(4, 0);
              smBuf.writeInt16LE(15, 0);
              smBuf.writeInt16LE(0, 2);
              replies.push(framePacket(CMD_CALL_SMALLMENU, smBuf));
            } else {
              // Store / Blacksmith / Pharmacist -> send CMD_STORE_ITEMLIST (2001)
              const menuId = npc.eventNo === 202 || npc.eventNo === 102 ? 22 : 18;
              const storeItems =
                menuId === 22
                  ? [4001, 4002, 4003, 4005, 3001, 3002]
                  : [6001, 6002, 6024, 6028, 6035, 6062, 6163, 7005, 8008, 8022, 8037, 8038, 8066];
              const storeBuf = Buffer.alloc(6 + 300 * 2, 0);
              storeBuf.writeInt16LE(storeItems.length, 0);
              storeBuf.writeInt16LE(menuId, 2);
              storeBuf.writeInt16LE(1, 4);
              for (let i = 0; i < storeItems.length; i++) {
                storeBuf.writeInt16LE(storeItems[i], 6 + i * 2);
              }
              replies.push(framePacket(CMD_STORE_ITEMLIST, storeBuf));
            }
          }
        } else if (evType === 1) {
          // EVENT_TYPE_MAPTILE (portal carpet tile)
          if (ch.mapName.toUpperCase().startsWith('SCHOLIUM')) {
            // Exact arrival red-carpet portal coordinates from SCHOLIUM.toi2 (objects 4367 + 4501)
            const scholiumPortalTargets: Record<number, { x: number; y: number }> = {
              1: { x: 47, y: 8 },    // Area 2 arrival carpet: Combat & Training Dummies
              2: { x: 22, y: 51 },   // Area 3 arrival carpet: Level Up & Ability Points
              3: { x: 44, y: 75 },   // Area 4 arrival carpet: Magic & Spell Memorization
              4: { x: 57, y: 64 },   // Area 5 arrival carpet: Weapon & Magic Tactics
              5: { x: 110, y: 8 },   // Area 6 arrival carpet: Party System
              6: { x: 118, y: 45 },  // Area 7 arrival carpet: Shops & First Battle Test
              7: { x: 110, y: 51 },  // Area 8 arrival carpet: Dragon Raja Scenario
              8: { x: 87, y: 74 },   // Area 9 arrival carpet: Dual Class
              9: { x: 134, y: 77 },  // Area 10 arrival carpet: Guilds & Colossus
              10: { x: 185, y: 105 }, // Area 11 arrival carpet: Three Nations & Wars
              11: { x: 126, y: 117 }, // Area 12 arrival carpet: Efficient Training & Jobs
              12: { x: 85, y: 116 }   // Area 13 arrival carpet: Final Graduation Guide
            };

            const nextArea = scholiumPortalTargets[evNo];
            if (nextArea) {
              ch.tileX = nextArea.x;
              ch.tileY = nextArea.y;
              this.saveAccounts();

              // Instant intra-map portal teleport via CMD_QSF_COMMAND (QSF_COMMAND_TELEPORT = 1)
              const qsfBuf = Buffer.alloc(8, 0);
              qsfBuf.writeInt16LE(1, 0); // QSF_COMMAND_TELEPORT
              qsfBuf.writeInt16LE(1, 2); // target_id = HeroServerID
              qsfBuf.writeInt16LE(nextArea.x, 4);
              qsfBuf.writeInt16LE(nextArea.y, 6);
              replies.push(framePacket(CMD_QSF_COMMAND, qsfBuf));
            } else if (evNo === 13) {
              const targetMap = ch.nation === 4 ? 'RENES_C' : ch.nation === 6 ? 'BARANTAN' : 'MA-IN';
              const targetX = ch.nation === 4 ? 215 : ch.nation === 6 ? 230 : 256;
              const targetY = ch.nation === 4 ? 195 : ch.nation === 6 ? 225 : 205;
              ch.mapName = targetMap;
              ch.tileX = targetX;
              ch.tileY = targetY;
              if (ch.level < 2) ch.level = 2;
              this.saveAccounts();

              const mapBuf = Buffer.alloc(32, 0);
              writeFixedString(mapBuf, targetMap, 0, 20);
              mapBuf.writeInt32LE(9001, 20);
              mapBuf.writeInt16LE(targetX, 24);
              mapBuf.writeInt16LE(targetY, 26);
              mapBuf.writeInt16LE(1, 28);
              replies.push(framePacket(CMD_CHANGE_MAP, mapBuf));
            }
          }
        }
        break;
      }

      case CMD_ITEM_EXCHANGE: {
        replies.push(framePacket(CMD_ITEM_EQUIP_OK, Buffer.alloc(0)));
        break;
      }

      case CMD_ITEM_BUY_REQ: {
        const acc = this.getOrCreateAccount(this.activeSession.userId);
        const ch = this.findChar(acc, this.activeSession.selectedCharName);
        if (ch && payload.length >= 4) {
          const itemNo = payload.readInt16LE(2);
          if (itemNo > 0) {
            // Find first empty inventory slot
            outer: for (let a = 0; a < 3; a++) {
              for (let b = 0; b < 3; b++) {
                for (let c = 0; c < 8; c++) {
                  if (!ch.inv[a][b][c] || ch.inv[a][b][c].item_no === 0) {
                    const newItem = makeItem(itemNo);
                    ch.inv[a][b][c] = newItem;
                    this.saveAccounts();
                    const giveBuf = Buffer.alloc(32, 0);
                    giveBuf.writeInt8(a, 0);
                    giveBuf.writeInt8(b, 1);
                    giveBuf.writeInt8(c, 2);
                    writeItemAttr(giveBuf, 4, newItem);
                    replies.push(framePacket(CMD_GIVE_ITEM, giveBuf));
                    break outer;
                  }
                }
              }
            }
          }
        }
        break;
      }

      case CMD_ATTACK: {
        const acc = this.getOrCreateAccount(this.activeSession.userId);
        const ch = this.findChar(acc, this.activeSession.selectedCharName);
        if (ch && payload.length >= 2) {
          const idTarget = payload.readUInt16LE(0);
          const npc = this.activeSession.currentNpcs.find((n) => n.idNpc === idTarget);
          const isDummy = npc ? npc.nSprNo >= 92 && npc.nSprNo <= 97 : false;
          const isHumanGuardOrGuide = npc ? npc.nRace === 0 && !isDummy : false;

          const dmg = isHumanGuardOrGuide
            ? 0
            : 18 + Math.floor(Math.random() * 14) + Math.max(1, ch.level) * 4;

          let nResult = 2; // HIT_AND_NOTDEAD = 2
          if (isHumanGuardOrGuide) {
            nResult = 0; // HIT_FAILED = 0 (friendly human NPCs don't take damage)
          } else if (npc && !isDummy) {
            npc.hp -= dmg;
            if (npc.hp <= 0) {
              npc.hp = 0;
              nResult = 1; // HIT_AND_DEAD = 1
              // Schedule respawn after 8 seconds
              setTimeout(() => {
                npc.hp = npc.maxHp;
                const px = npc.tileX * 32 + 16;
                const py = npc.tileY * 32 + 16;
                const respawnBuf = Buffer.alloc(16, 0);
                const w0 = ((px & 0x7fff) | ((py & 0x7fff) << 15)) >>> 0;
                const isEv = npc.eventNo > 0 ? 1 : 0;
                const w1 =
                  ((npc.tileX & 0x3ff) |
                    ((npc.tileY & 0x3ff) << 10) |
                    ((npc.nSprNo & 0x1ff) << 20) |
                    (isEv << 29) |
                    (1 << 30)) >>>
                  0;
                const w2 = ((npc.idNpc & 0xffff) | ((npc.nNameNo & 0x1fff) << 16)) >>> 0;
                const w3 = ((npc.nRace & 0x0f) << 8) >>> 0;
                respawnBuf.writeUInt32LE(w0, 0);
                respawnBuf.writeUInt32LE(w1, 4);
                respawnBuf.writeUInt32LE(w2, 8);
                respawnBuf.writeUInt32LE(w3, 12);
                this.activeSession.pendingOutgoing.push(framePacket(CMD_NPC_ADD, respawnBuf));
              }, 8000);
            }
          }

          // struct t_attack_result (16 bytes): WORD idTarget @ 0, int32 nDamage @ 4, int16 nX @ 8, int16 nY @ 10, WORD wdEffect @ 12, BYTE nCombat @ 14, BYTE nResult @ 15
          const atkBuf = Buffer.alloc(16, 0);
          atkBuf.writeUInt16LE(idTarget, 0);
          atkBuf.writeInt32LE(-dmg, 4);
          atkBuf.writeInt16LE(0, 8);
          atkBuf.writeInt16LE(0, 10);
          atkBuf.writeUInt16LE(0, 12);
          atkBuf.writeUInt8(0, 14);
          atkBuf.writeUInt8(nResult, 15);
          replies.push(framePacket(CMD_ATTACK_RESULT, atkBuf));

          if (dmg > 0) {
            this.grantExpAndCheckLevelUp(ch, nResult === 1 ? 120 : 45, replies);
          }
        }
        break;
      }

      case CMD_THROW_ATTACK: {
        if (payload.length >= 2) {
          const idTarget = payload.readUInt16LE(0);
          const npc = this.activeSession.currentNpcs.find((n) => n.idNpc === idTarget);
          const px = npc ? npc.tileX * 32 + 16 : 0;
          const py = npc ? npc.tileY * 32 + 16 : 0;
          // struct t_server_throw_attack (10 bytes): WORD idCaster @ 0, WORD idTarget @ 2, int16 nX @ 4, int16 nY @ 6, BYTE nCombat @ 8
          const throwBuf = Buffer.alloc(10, 0);
          throwBuf.writeUInt16LE(1, 0); // HeroServerID = 1
          throwBuf.writeUInt16LE(idTarget, 2);
          throwBuf.writeInt16LE(px, 4);
          throwBuf.writeInt16LE(py, 6);
          throwBuf.writeUInt8(0, 8);
          replies.push(framePacket(CMD_THROW_ATTACK, throwBuf));
        }
        break;
      }

      case CMD_THROW_RESULT: {
        const acc = this.getOrCreateAccount(this.activeSession.userId);
        const ch = this.findChar(acc, this.activeSession.selectedCharName);
        if (ch && payload.length >= 6) {
          const idTarget = payload.readUInt16LE(0);
          const nX = payload.readInt16LE(2);
          const nY = payload.readInt16LE(4);
          const npc = this.activeSession.currentNpcs.find((n) => n.idNpc === idTarget);
          const isDummy = npc ? npc.nSprNo >= 92 && npc.nSprNo <= 97 : false;
          const isHumanGuardOrGuide = npc ? npc.nRace === 0 && !isDummy : false;
          const dmg = isHumanGuardOrGuide
            ? 0
            : 16 + Math.floor(Math.random() * 14) + Math.max(1, ch.level) * 4;
          let nResult = isHumanGuardOrGuide ? 0 : 2;
          if (npc && !isDummy && !isHumanGuardOrGuide) {
            npc.hp -= dmg;
            if (npc.hp <= 0) {
              npc.hp = 0;
              nResult = 1;
              setTimeout(() => {
                npc.hp = npc.maxHp;
                const px = npc.tileX * 32 + 16;
                const py = npc.tileY * 32 + 16;
                const respawnBuf = Buffer.alloc(16, 0);
                const w0 = ((px & 0x7fff) | ((py & 0x7fff) << 15)) >>> 0;
                const isEv = npc.eventNo > 0 ? 1 : 0;
                const w1 =
                  ((npc.tileX & 0x3ff) |
                    ((npc.tileY & 0x3ff) << 10) |
                    ((npc.nSprNo & 0x1ff) << 20) |
                    (isEv << 29) |
                    (1 << 30)) >>>
                  0;
                const w2 = ((npc.idNpc & 0xffff) | ((npc.nNameNo & 0x1fff) << 16)) >>> 0;
                const w3 = ((npc.nRace & 0x0f) << 8) >>> 0;
                respawnBuf.writeUInt32LE(w0, 0);
                respawnBuf.writeUInt32LE(w1, 4);
                respawnBuf.writeUInt32LE(w2, 8);
                respawnBuf.writeUInt32LE(w3, 12);
                this.activeSession.pendingOutgoing.push(framePacket(CMD_NPC_ADD, respawnBuf));
              }, 8000);
            }
          }
          // struct t_server_throw_result (16 bytes): WORD idTarget @ 0, int16 nX @ 2, int16 nY @ 4, 2-byte pad, int32 nDamage @ 8, WORD wdEffect @ 12, BYTE nCombat @ 14, BYTE nResult @ 15
          const resBuf = Buffer.alloc(16, 0);
          resBuf.writeUInt16LE(idTarget, 0);
          resBuf.writeInt16LE(nX, 2);
          resBuf.writeInt16LE(nY, 4);
          resBuf.writeInt32LE(-dmg, 8);
          resBuf.writeUInt16LE(0, 12);
          resBuf.writeUInt8(0, 14);
          resBuf.writeUInt8(nResult, 15);
          replies.push(framePacket(CMD_THROW_RESULT, resBuf));

          if (dmg > 0) {
            this.grantExpAndCheckLevelUp(ch, nResult === 1 ? 120 : 45, replies);
          }
        }
        break;
      }

      case CMD_LEVELUP_POINT: {
        const acc = this.getOrCreateAccount(this.activeSession.userId);
        const ch = this.findChar(acc, this.activeSession.selectedCharName);
        if (ch && payload.length >= 22) {
          for (let i = 0; i < 11; i++) {
            const add = payload.readUInt16LE(i * 2);
            if (add > 0 && ch.reservedPoint >= add) {
              ch.abilities[i] = (ch.abilities[i] || 10) + add;
              ch.reservedPoint -= add;
            }
          }
          this.saveAccounts();
          replies.push(framePacket(CMD_LEVELUP_POINT_OK, Buffer.alloc(0)));
        }
        break;
      }

      default:
        break;
    }
  }
}
