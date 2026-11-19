import fs from 'node:fs';
import zlib from 'node:zlib';

const sqlPath = 'C:\\Users\\Usuario\\DR pixel\\original_sources\\FungCoder_dragonraja\\database\\dragonraja.sql';
const data0Path = 'C:\\Program Files (x86)\\DragonRajaGlobal\\Live\\data\\data0';

const sql = fs.readFileSync(sqlPath, 'utf8');

function parseInsertObjects(sqlText, tableName) {
  const rows = [];
  const marker = 'INSERT INTO `' + tableName + '`';
  let pos = 0;
  while (true) {
    const startIdx = sqlText.indexOf(marker, pos);
    if (startIdx === -1) break;
    const valuesIdx = sqlText.indexOf('VALUES', startIdx + marker.length);
    if (valuesIdx === -1) break;
    const colHeader = sqlText.slice(startIdx + marker.length, valuesIdx);
    const cols = [];
    const colRe = /`([^`]+)`/g;
    let cm;
    while ((cm = colRe.exec(colHeader)) !== null) {
      cols.push(cm[1]);
    }

    const valStart = valuesIdx + 'VALUES'.length;
    let inStr = false;
    let escape = false;
    let inTuple = false;
    let currentTuple = [];
    let currentToken = '';
    let i = valStart;
    for (; i < sqlText.length; i++) {
      const ch = sqlText[i];
      if (inStr) {
        if (escape) {
          currentToken += ch;
          escape = false;
        } else if (ch === '\\') {
          escape = true;
        } else if (ch === "'") {
          inStr = false;
        } else {
          currentToken += ch;
        }
      } else {
        if (ch === "'") {
          inStr = true;
        } else if (ch === '(' && !inTuple) {
          inTuple = true;
          currentTuple = [];
          currentToken = '';
        } else if (ch === ')' && inTuple) {
          currentTuple.push(parseToken(currentToken.trim()));
          if (cols.length > 0) {
            const obj = {};
            for (let c = 0; c < cols.length; c++) {
              obj[cols[c]] = currentTuple[c];
            }
            rows.push(obj);
          } else {
            rows.push(currentTuple);
          }
          inTuple = false;
          currentToken = '';
        } else if (ch === ',' && inTuple) {
          currentTuple.push(parseToken(currentToken.trim()));
          currentToken = '';
        } else if (ch === ';' && !inTuple) {
          break;
        } else if (inTuple) {
          currentToken += ch;
        }
      }
    }
    pos = i + 1;
  }
  return rows;
}

function parseToken(t) {
  if (t === 'NULL' || t === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return t;
}

const npcRows = parseInsertObjects(sql, 'npc_generation_sp');
console.log('Parsed npc_generation_sp rows:', npcRows.length);

const mapInfoRows = parseInsertObjects(sql, 'map_info');
console.log('Parsed map_info rows:', mapInfoRows.length);

const aliveZoneRows = parseInsertObjects(sql, 'alive_zone');
console.log('Parsed alive_zone rows:', aliveZoneRows.length);

const abilityDivideRows = parseInsertObjects(sql, 'ability_divide');
console.log('Parsed ability_divide rows:', abilityDivideRows.length);

const lv2ExpRows = parseInsertObjects(sql, 'npc_lv2exp');
console.log('Parsed npc_lv2exp rows:', lv2ExpRows.length);

// Read ZIP Central Directory from data0
const zipBuf = fs.readFileSync(data0Path);
let eocd = zipBuf.length - 22;
while (eocd >= 0 && zipBuf.readUInt32LE(eocd) !== 0x06054b50) {
  eocd--;
}
const cdCount = zipBuf.readUInt16LE(eocd + 10);
const cdOff = zipBuf.readUInt32LE(eocd + 16);
const entries = new Map();
let ptr = cdOff;
for (let i = 0; i < cdCount; i++) {
  const method = zipBuf.readUInt16LE(ptr + 10);
  const cSize = zipBuf.readUInt32LE(ptr + 20);
  const uSize = zipBuf.readUInt32LE(ptr + 24);
  const nLen = zipBuf.readUInt16LE(ptr + 28);
  const xLen = zipBuf.readUInt16LE(ptr + 30);
  const cLen = zipBuf.readUInt16LE(ptr + 32);
  const lOff = zipBuf.readUInt32LE(ptr + 42);
  const name = zipBuf.toString('utf8', ptr + 46, ptr + 46 + nLen);
  entries.set(name.toLowerCase(), { name, method, cSize, uSize, lOff });
  ptr += 46 + nLen + xLen + cLen;
}

function readZipEntry(relPath) {
  const meta = entries.get(relPath.toLowerCase());
  if (!meta) return null;
  const ln = zipBuf.readUInt16LE(meta.lOff + 26);
  const lx = zipBuf.readUInt16LE(meta.lOff + 28);
  const dataStart = meta.lOff + 30 + ln + lx;
  const raw = zipBuf.subarray(dataStart, dataStart + meta.cSize);
  return meta.method === 0 ? Buffer.from(raw) : zlib.inflateRawSync(raw);
}

const HEADER_SIZE = 21;
const REC_SIZE = 404; // sizeof(PCANIMATIONTABLE) = 4 + 40*4 + 80*3 = 404

function parseAniRecord(aniBuf, recIdx, maxFrame = 75) {
  if (!aniBuf) return null;
  const base = HEADER_SIZE + recIdx * REC_SIZE;
  if (base + REC_SIZE > aniBuf.length) return null;
  const cnt = aniBuf.readInt32LE(base);
  if (cnt <= 0 || cnt > 40) return null;
  const frames = [];
  let firstWave = 0;
  for (let k = 0; k < cnt; k++) {
    const f = aniBuf[base + 4 + k];
    if (f < maxFrame) frames.push(f);
    const wv = aniBuf.readInt16LE(base + 164 + k * 2);
    if (wv > 0 && firstWave === 0) firstWave = wv;
  }
  return frames.length > 0 ? { frames, wave: firstWave } : null;
}

const playerAniSpecs = {};
for (const gender of [0, 1]) {
  const pad = String(gender).padStart(3, '0');
  const aniBuf = readZipEntry(`data/animations/characters/player/legacy/${pad}AniTable.bin`);
  if (aniBuf) {
    playerAniSpecs[gender] = {
      idle: parseAniRecord(aniBuf, 0, 75)?.frames || [0],
      walk: parseAniRecord(aniBuf, 1, 75)?.frames || [0],
      battleWalk: parseAniRecord(aniBuf, 2, 75)?.frames || [0],
      battleIdle: parseAniRecord(aniBuf, 3, 75)?.frames || [0],
      attack: parseAniRecord(aniBuf, 4, 75)?.frames || [0],
      attackBow: parseAniRecord(aniBuf, 8, 75)?.frames || [0],
      run: parseAniRecord(aniBuf, 12, 75)?.frames || [0],
      attacked: parseAniRecord(aniBuf, 13, 75)?.frames || [0],
      die: parseAniRecord(aniBuf, 14, 75)?.frames || [0],
      magic: parseAniRecord(aniBuf, 16, 75)?.frames || [0],
      sit: parseAniRecord(aniBuf, 17, 75)?.frames || [0],
      attackWave: parseAniRecord(aniBuf, 4, 75)?.wave || 205,
    };
  }
}

const sprSpecs = {};
for (let sprNo = 2; sprNo <= 199; sprNo++) {
  const pad = String(sprNo).padStart(3, '0');
  const sprPath = `images/characters/npc/legacy/${pad}000.spr`;
  const sprBuf = readZipEntry(sprPath);
  if (!sprBuf || sprBuf.length < 6) continue;
  const totalFrames = sprBuf.readUInt16LE(0);
  const perDir = Math.max(1, Math.floor(totalFrames / 8));

  const aniPath = `data/animations/characters/npc/legacy/${pad}AniTable.bin`;
  const aniBuf = readZipEntry(aniPath);
  let idle = [0];
  let walk = [0];
  let attack = [0];
  let attacked = [0];
  let die = [0];
  let attackWave = 0;
  let dieWave = 0;

  if (aniBuf && aniBuf.length >= HEADER_SIZE + REC_SIZE) {
    const r0 = parseAniRecord(aniBuf, 0, perDir); // MON1_NONE
    const r1 = parseAniRecord(aniBuf, 1, perDir); // MON1_BATTLE_WALK
    const r2 = parseAniRecord(aniBuf, 2, perDir); // MON1_ATTACKED
    const r3 = parseAniRecord(aniBuf, 3, perDir); // MON1_DIE
    const r4 = parseAniRecord(aniBuf, 4, perDir) || parseAniRecord(aniBuf, 5, perDir); // MON1_BATTLE_ATTACK / MAGIC
    if (r0) idle = r0.frames;
    if (r1) walk = r1.frames;
    else if (perDir >= 4) walk = Array.from({ length: Math.min(8, perDir) }, (_, idx) => idx);
    if (r2) attacked = r2.frames;
    if (r3) {
      die = r3.frames;
      dieWave = r3.wave;
    }
    if (r4) {
      attack = r4.frames;
      attackWave = r4.wave;
    } else {
      attack = walk;
    }
  } else {
    idle = [0];
    walk = Array.from({ length: Math.min(8, perDir) }, (_, idx) => idx);
    attack = walk;
  }

  sprSpecs[sprNo] = {
    sprNo,
    sprPath,
    totalFrames,
    perDir,
    idle,
    walk,
    attack,
    attacked,
    die,
    attackWave,
    dieWave,
  };
}

console.log('Extracted sprSpecs count:', Object.keys(sprSpecs).length);
console.log('Sample sprSpecs[18] (Guard):', sprSpecs[18]);
console.log('Sample sprSpecs[71] (Master of Town):', sprSpecs[71]);
console.log('Sample sprSpecs[28] (Hens):', sprSpecs[28]);

const npcTable = {};
for (const r of npcRows) {
  const no = Number(r.no ?? 0);
  const sprNo = Number(r.SprNO ?? no);
  const hanName = String(r.han_name || '').trim();
  const name = String(r.Name || hanName || `NPC_${no}`).trim();
  const npcRace = Number(r.NpcRace ?? 0);
  const lvMin = Number(r.LvMin ?? 1);
  const lvMax = Number(r.LvMax ?? lvMin);
  const hp = Number(r.NpcLife ?? 100);
  const exp = Number(r.NpcExp ?? 10);
  const movp = Number(r.Movp ?? 50);
  const strikeDamage = Number(r.StrikeDamage ?? 10);
  const baseDefense = Number(r.BaseDefense ?? 5);
  const moneyMin = Number(r.Money_min ?? 0);
  const moneyMax = Number(r.Money_Max ?? 0);

  npcTable[no] = {
    no,
    sprNo,
    name,
    npcRace,
    lvMin,
    lvMax,
    hp: Math.max(20, hp),
    exp: Math.max(0, exp),
    movp: Math.max(0, movp),
    strikeDamage: Math.max(1, strikeDamage),
    baseDefense: Math.max(0, baseDefense),
    moneyMin,
    moneyMax,
  };
}

const mapInfoTable = {};
for (const r of mapInfoRows) {
  const num = Number(r.number ?? 0);
  const mapfile = String(r.mapfile || '').trim().toUpperCase();
  const mapname = String(r.mapname || mapfile).trim();
  if (!mapfile) continue;
  mapInfoTable[mapfile] = {
    number: num,
    mapfile,
    mapname,
    nation: Number(r.nation ?? 0),
    lvMin: Number(r.LvMin ?? 1),
    lvMax: Number(r.LvMax ?? 99),
    beginX: 180,
    beginY: 65,
  };
}

for (const r of aliveZoneRows) {
  const mapNumber = Number(r.Map_number ?? 0);
  const x = Number(r.X ?? 0);
  const y = Number(r.Y ?? 0);
  const isFull = Number(r.Alive_word_type ?? 0);
  for (const mf of Object.keys(mapInfoTable)) {
    if (mapInfoTable[mf].number === mapNumber && x > 0 && y > 0) {
      if (isFull === 1 || !mapInfoTable[mf].hasAliveZone) {
        mapInfoTable[mf].beginX = x;
        mapInfoTable[mf].beginY = y;
        mapInfoTable[mf].hasAliveZone = true;
      }
    }
  }
}

const outputData = {
  playerAniSpecs,
  sprSpecs,
  npcTable,
  mapInfoTable,
  abilityDivide: abilityDivideRows,
  lv2Exp: lv2ExpRows.slice(0, 155).map((r) => ({
    level: Number(r.lv ?? r.level ?? 1),
    exp: Number(r.exp ?? 100),
  })),
};

const outPath = 'C:\\Users\\Usuario\\DR pixel\\src\\data\\originalSqlDatabase.json';
fs.writeFileSync(outPath, JSON.stringify(outputData, null, 2), 'utf8');
console.log('Wrote', outPath, 'size:', fs.statSync(outPath).size, 'bytes');
