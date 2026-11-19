import fs from 'node:fs';

const sqlPath = 'C:\\Users\\Usuario\\DR pixel\\original_sources\\FungCoder_dragonraja\\database\\dragonraja.sql';
const data0Path = 'C:\\Program Files (x86)\\DragonRajaGlobal\\Live\\data\\data0';
const extractedPath = 'C:\\Users\\Usuario\\DR pixel\\src\\data\\extractedData.json';

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

// Index all inventory .csp files in data0
const zipBuf = fs.readFileSync(data0Path);
let eocd = zipBuf.length - 22;
while (eocd >= 0 && zipBuf.readUInt32LE(eocd) !== 0x06054b50) {
  eocd--;
}
const cdCount = zipBuf.readUInt16LE(eocd + 10);
const cdOff = zipBuf.readUInt32LE(eocd + 16);
const validCspSet = new Set();
const cspByKind = {};
let ptr = cdOff;
for (let i = 0; i < cdCount; i++) {
  const nLen = zipBuf.readUInt16LE(ptr + 28);
  const xLen = zipBuf.readUInt16LE(ptr + 30);
  const cLen = zipBuf.readUInt16LE(ptr + 32);
  const name = zipBuf.toString('utf8', ptr + 46, ptr + 46 + nLen).toLowerCase();
  if (name.startsWith('images/items/legacy/inventory/') && name.endsWith('.csp')) {
    const code7 = name.split('/').pop().replace('.csp', '');
    validCspSet.add(code7);
    const kind = Math.floor(Number(code7) / 100000);
    if (!cspByKind[kind]) cspByKind[kind] = [];
    cspByKind[kind].push(code7);
  }
  ptr += 46 + nLen + xLen + cLen;
}

function resolveIconUrl(imgNo, kindNum, itemId) {
  const candidates = [];
  if (imgNo && imgNo > 0) {
    candidates.push(String(imgNo).padStart(7, '0'));
    // Sometimes SQL Image_Number is e.g. 6001 instead of 600100
    if (imgNo < 100000) {
      candidates.push(String(imgNo * 100).padStart(7, '0'));
    }
  }
  candidates.push(String(kindNum * 100000 + Math.max(1, itemId) * 100).padStart(7, '0'));

  for (const c of candidates) {
    if (validCspSet.has(c)) {
      return `/api/data0/sprite?path=images/items/legacy/inventory/${c}.csp`;
    }
  }
  const pool = cspByKind[kindNum] || cspByKind[0] || ['0000100'];
  const fallback = pool[Math.abs(itemId) % pool.length];
  return `/api/data0/sprite?path=images/items/legacy/inventory/${fallback}.csp`;
}

const tableConfigs = [
  { table: 'item_plant', kind: 0, prefix: 'item_plant', defaultCat: 'material_plant', defaultSlot: 'material' },
  { table: 'item_mineral', kind: 1, prefix: 'item_mineral', defaultCat: 'material_mineral', defaultSlot: 'material' },
  { table: 'item_herb', kind: 2, prefix: 'item_herb', defaultCat: 'material_herb', defaultSlot: 'material' },
  { table: 'item_cook', kind: 3, prefix: 'item_cook', defaultCat: 'food', defaultSlot: 'consumable' },
  { table: 'item_potion', kind: 4, prefix: 'item_potion', defaultCat: 'potion', defaultSlot: 'consumable' },
  { table: 'item_tool', kind: 5, prefix: 'item_tool', defaultCat: 'tool', defaultSlot: 'tool' },
  { table: 'item_weapon', kind: 6, prefix: 'item_weapon', defaultCat: 'weapon', defaultSlot: 'weapon' },
  { table: 'item_disposable', kind: 7, prefix: 'item_disposable', defaultCat: 'weapon', defaultSlot: 'weapon' },
  { table: 'item_armor', kind: 8, prefix: 'item_armor', defaultCat: 'armor', defaultSlot: 'armor' },
  { table: 'item_accessory', kind: 9, prefix: 'item_accessory', defaultCat: 'accessory', defaultSlot: 'ring1' },
  { table: 'item_etc', kind: 10, prefix: 'item_etc', defaultCat: 'etc', defaultSlot: 'consumable' },
];

const allItems = [];
const seenIds = new Set();

for (const cfg of tableConfigs) {
  const rows = parseInsertObjects(sql, cfg.table).sort((a, b) => Number(a.Item_id ?? 0) - Number(b.Item_id ?? 0));
  console.log(`Table ${cfg.table}: ${rows.length} rows`);
  for (const r of rows) {
    const itemId = Number(r.Item_id ?? 0);
    if (itemId <= 0) continue;
    const name = String(r.Name || r.Han_Name || '').trim();
    if (!name || name === '0' || name.startsWith('?')) continue;

    const id = `${cfg.prefix}_${itemId}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const imgNo = Number(r.Image_Number ?? r.Image_number ?? 0);
    const iconUrl = resolveIconUrl(imgNo, cfg.kind, itemId);
    const lv = Math.max(1, Number(r.lv ?? 1));
    const reqLevel = Math.max(1, Number(r.Need3_lv ?? r.Need2_lv ?? Math.max(1, Math.floor(lv / 2))));
    const tier = Math.max(1, Math.min(10, Math.ceil(lv / 10)));
    const baseVal = Number(r.base_value ?? 0);
    const price = baseVal > 0 ? baseVal : Math.max(10, lv * 25);

    const wearAble = Number(r.wear_able ?? 0);
    let slot = cfg.defaultSlot;
    let category = cfg.defaultCat;

    if (cfg.table === 'item_armor') {
      if (wearAble === 3) slot = 'shield';
      else if (wearAble === 4) slot = 'helmet';
      else if (wearAble === 5) slot = 'armor';
      else if (wearAble === 6) slot = 'necklace';
      else if (wearAble === 7) slot = 'shoes';
      else if (wearAble === 8) slot = 'mantle';
      else if (name.toLowerCase().includes('shield') || name.toLowerCase().includes('buckler')) slot = 'shield';
      else if (name.toLowerCase().includes('helm') || name.toLowerCase().includes('hat') || name.toLowerCase().includes('cap') || name.toLowerCase().includes('crown') || name.toLowerCase().includes('visor')) slot = 'helmet';
      else if (name.toLowerCase().includes('shoe') || name.toLowerCase().includes('boot') || name.toLowerCase().includes('sandal') || name.toLowerCase().includes('greave')) slot = 'shoes';
      else if (name.toLowerCase().includes('cape') || name.toLowerCase().includes('mantle') || name.toLowerCase().includes('robe')) slot = 'mantle';
    } else if (cfg.table === 'item_accessory') {
      if (wearAble === 6 || name.toLowerCase().includes('neck') || name.toLowerCase().includes('amulet') || name.toLowerCase().includes('pendant')) {
        slot = 'necklace';
      } else if (name.toLowerCase().includes('cape') || name.toLowerCase().includes('mantle')) {
        slot = 'mantle';
      } else {
        slot = 'ring1';
      }
    }

    const rawDmg = Number(r.Damage ?? 0);
    // In Dragon Raja SQL, Damage can be encoded or direct; normalize to sensible min/max
    const dmgBase = rawDmg > 1000 ? Math.round((rawDmg % 1000) * 1.8) + Math.floor(lv * 1.2) : rawDmg;
    const attackMin = cfg.table === 'item_weapon' || cfg.table === 'item_disposable'
      ? Math.max(4, Math.round(dmgBase * 0.75) || lv * 2)
      : 0;
    const attackMax = cfg.table === 'item_weapon' || cfg.table === 'item_disposable'
      ? Math.max(attackMin + 4, dmgBase || lv * 3)
      : 0;

    const rawDef = Number(r.Defense_power ?? r.Defense_rate ?? 0);
    const defense = cfg.table === 'item_armor' || cfg.table === 'item_accessory'
      ? Math.max(2, rawDef > 0 ? rawDef : Math.round(lv * 0.8))
      : 0;

    const hpRestore = Math.max(0, Number(r.hp ?? 0));
    const mpRestore = Math.max(0, Number(r.mp ?? 0));
    const spRestore = Math.max(0, Number(r.ap ?? r.nutrition1 ?? 0));

    allItems.push({
      id,
      code: itemId || 1,
      name,
      category,
      slot,
      tier,
      reqLevel,
      price,
      iconUrl,
      imageNumber: imgNo,
      attackMin,
      attackMax,
      defense,
      hpRestore,
      mpRestore,
      spRestore,
    });
  }
}

const existing = JSON.parse(fs.readFileSync(extractedPath, 'utf8'));
existing.items = allItems;
existing.meta.counts.items = allItems.length;
fs.writeFileSync(extractedPath, JSON.stringify(existing, null, 2), 'utf8');
console.log('Updated extractedData.json with total items:', allItems.length);
