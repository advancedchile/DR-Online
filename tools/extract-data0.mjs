import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const DATA0_PATH = 'C:\\Program Files (x86)\\DragonRajaGlobal\\Live\\data\\data0';
const PROJECT_ROOT = 'C:\\Users\\Usuario\\DR pixel';
const OUT_DATA_DIR = path.join(PROJECT_ROOT, 'src', 'data');
const PUBLIC_AUDIO_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'audio');
const PUBLIC_ORIG_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'original');

fs.mkdirSync(OUT_DATA_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_AUDIO_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_ORIG_DIR, { recursive: true });

// Pure Node.js CRC32 + PNG Encoder (zero external dependencies)
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(typeStr, dataBuf) {
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(dataBuf.length, 0);
  const typeBuf = Buffer.from(typeStr, 'ascii');
  const crcInput = Buffer.concat([typeBuf, dataBuf]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, dataBuf, crcBuf]);
}

function encodeRGBAtoPNG(width, height, rgbaBuf) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth 8
  ihdr[9] = 6; // color type 6 = RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const rawScanlines = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    rawScanlines[rowStart] = 0; // Filter type 0 (None)
    rgbaBuf.copy(rawScanlines, rowStart + 1, y * stride, (y + 1) * stride);
  }

  const compressed = zlib.deflateSync(rawScanlines, { level: 6 });
  return Buffer.concat([
    sig,
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', compressed),
    makePngChunk('IEND', Buffer.alloc(0))
  ]);
}

/**
 * Decodes a Dragon Raja 16-bit RLE .csp sprite buffer (starting at cspOffset) into RGBA8888 + PNG.
 * Format:
 *   +0: uint16LE width
 *   +2: uint16LE height
 *   +4: int16LE ox
 *   +6: int16LE oy
 *   +8: uint32LE dataSize
 *   +12: RLE scanlines (skipBytes: u16, if 0xFFFF -> EOL, else copyBytes: u16, followed by RGB565 pixels)
 */
function decodeCspToPng(buf, cspOffset = 0) {
  if (!buf || cspOffset + 12 > buf.length) return null;
  const width = buf.readUInt16LE(cspOffset);
  const height = buf.readUInt16LE(cspOffset + 2);
  const ox = buf.readInt16LE(cspOffset + 4);
  const oy = buf.readInt16LE(cspOffset + 6);
  const dataSize = buf.readUInt32LE(cspOffset + 8);

  if (width === 0 || height === 0 || width > 2048 || height > 2048) return null;

  const rgba = Buffer.alloc(width * height * 4, 0);
  let ptr = cspOffset + 12;
  const endPtr = Math.min(buf.length, cspOffset + 12 + dataSize);

  for (let y = 0; y < height && ptr + 2 <= endPtr; y++) {
    let x = 0;
    while (ptr + 2 <= endPtr) {
      const skipBytes = buf.readUInt16LE(ptr);
      ptr += 2;
      if (skipBytes === 0xffff) break; // End of scanline
      if (ptr + 2 > endPtr) break;
      const copyBytes = buf.readUInt16LE(ptr);
      ptr += 2;

      x += skipBytes >> 1;
      const count = copyBytes >> 1;
      for (let i = 0; i < count; i++) {
        if (ptr + 2 > endPtr) break;
        const px = buf.readUInt16LE(ptr);
        ptr += 2;
        if (x >= 0 && x < width) {
          // RGB565 -> 8-bit R, G, B
          const r5 = (px >> 11) & 0x1f;
          const g6 = (px >> 5) & 0x3f;
          const b5 = px & 0x1f;
          const dstIdx = (y * width + x) * 4;
          rgba[dstIdx] = (r5 << 3) | (r5 >> 2);
          rgba[dstIdx + 1] = (g6 << 2) | (g6 >> 4);
          rgba[dstIdx + 2] = (b5 << 3) | (b5 >> 2);
          rgba[dstIdx + 3] = 255;
        }
        x++;
      }
    }
  }

  return {
    width,
    height,
    ox,
    oy,
    pngBuffer: encodeRGBAtoPNG(width, height, rgba)
  };
}

/**
 * Decodes sprite #index from a Dragon Raja multi-sprite .dat / .spr / .sou archive.
 */
function decodeDatSpriteToPng(datBuf, spriteIndex = 0) {
  if (!datBuf || datBuf.length < 6) return null;
  const count = datBuf.readUInt16LE(0);
  if (spriteIndex < 0 || spriteIndex >= count) return null;
  const offsetPos = 2 + spriteIndex * 4;
  if (offsetPos + 4 > datBuf.length) return null;
  const spriteChunkOffset = datBuf.readUInt32LE(offsetPos);
  if (spriteChunkOffset + 16 > datBuf.length) return null;
  // At spriteChunkOffset: uint32LE chunkLen, followed by 12-byte CSP header + RLE data
  return decodeCspToPng(datBuf, spriteChunkOffset + 4);
}

class FastZipReader {
  constructor(filePath) {
    this.fd = fs.openSync(filePath, 'r');
    const stat = fs.fstatSync(this.fd);
    this.fileSize = stat.size;
    this.entries = new Map();
    this.allEntryNames = [];
    this._readCentralDirectory();
  }

  _readCentralDirectory() {
    const tailSize = Math.min(65557, this.fileSize);
    const tailBuf = Buffer.alloc(tailSize);
    fs.readSync(this.fd, tailBuf, 0, tailSize, this.fileSize - tailSize);

    let eocdPos = -1;
    for (let i = tailSize - 22; i >= 0; i--) {
      if (tailBuf.readUInt32LE(i) === 0x06054b50) {
        eocdPos = i;
        break;
      }
    }
    if (eocdPos === -1) {
      throw new Error('Could not find End of Central Directory in data0');
    }

    const totalEntries = tailBuf.readUInt16LE(eocdPos + 10);
    const cdSize = tailBuf.readUInt32LE(eocdPos + 12);
    const cdOffset = tailBuf.readUInt32LE(eocdPos + 16);

    const cdBuf = Buffer.alloc(cdSize);
    fs.readSync(this.fd, cdBuf, 0, cdSize, cdOffset);

    let ptr = 0;
    for (let i = 0; i < totalEntries && ptr < cdSize; i++) {
      const sig = cdBuf.readUInt32LE(ptr);
      if (sig !== 0x02014b50) break;

      const method = cdBuf.readUInt16LE(ptr + 10);
      const compSize = cdBuf.readUInt32LE(ptr + 20);
      const uncompSize = cdBuf.readUInt32LE(ptr + 24);
      const nameLen = cdBuf.readUInt16LE(ptr + 28);
      const extraLen = cdBuf.readUInt16LE(ptr + 30);
      const commentLen = cdBuf.readUInt16LE(ptr + 32);
      const localHeaderOffset = cdBuf.readUInt32LE(ptr + 42);

      const rawName = cdBuf.subarray(ptr + 46, ptr + 46 + nameLen).toString('utf8');
      const normalized = rawName.replace(/\\/g, '/');

      const entry = {
        name: normalized,
        method,
        compSize,
        uncompSize,
        localHeaderOffset
      };
      this.entries.set(normalized.toLowerCase(), entry);
      this.allEntryNames.push(normalized);

      ptr += 46 + nameLen + extraLen + commentLen;
    }
  }

  readEntryBuffer(entryPath) {
    const entry = this.entries.get(entryPath.replace(/\\/g, '/').toLowerCase());
    if (!entry) return null;

    const localHdr = Buffer.alloc(30);
    fs.readSync(this.fd, localHdr, 0, 30, entry.localHeaderOffset);
    if (localHdr.readUInt32LE(0) !== 0x04034b50) {
      throw new Error(`Invalid local header for ${entryPath}`);
    }
    const nameLen = localHdr.readUInt16LE(26);
    const extraLen = localHdr.readUInt16LE(28);
    const dataOffset = entry.localHeaderOffset + 30 + nameLen + extraLen;

    const compBuf = Buffer.alloc(entry.compSize);
    fs.readSync(this.fd, compBuf, 0, entry.compSize, dataOffset);

    if (entry.method === 0) return compBuf;
    if (entry.method === 8) return zlib.inflateRawSync(compBuf);
    throw new Error(`Unsupported compression method ${entry.method} for ${entryPath}`);
  }

  readEntryText(entryPath) {
    const buf = this.readEntryBuffer(entryPath);
    if (!buf) return '';
    return buf.toString('utf8');
  }

  close() {
    fs.closeSync(this.fd);
  }
}

function parseKeyValueTxt(text) {
  const map = {};
  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('//')) continue;
    const match = line.match(/^(#[A-Za-z0-9_]+)\s+"([^"]*)"/);
    if (match) {
      map[match[1]] = match[2].trim();
    }
  }
  return map;
}

function inferWeaponTactic(name) {
  const n = name.toLowerCase();
  if (
    n.includes('two-hand') ||
    n.includes('two hand') ||
    n.includes('2h') ||
    n.includes('claymore') ||
    n.includes('executioner') ||
    n.includes('bastard') ||
    n.includes('great sword')
  ) {
    return 'Twinsword / 2H Swordmanship';
  }
  if (
    n.includes('sword') ||
    n.includes('sabre') ||
    n.includes('rapier') ||
    n.includes('blade') ||
    n.includes('scimitar') ||
    n.includes('falchion')
  ) {
    return 'Swordmanship';
  }
  if (n.includes('axe') || n.includes('hatchet') || n.includes('tomahawk') || n.includes('halberd') || n.includes('poleaxe')) {
    return 'Fencing / Axe';
  }
  if (n.includes('mace') || n.includes('hammer') || n.includes('club') || n.includes('flail') || n.includes('morning')) {
    return 'Mace Fighting';
  }
  if (n.includes('spear') || n.includes('lance') || n.includes('pike') || n.includes('trident') || n.includes('javelin')) {
    return 'Pierce / Spear';
  }
  if (n.includes('staff') || n.includes('wand') || n.includes('rod') || n.includes('stick') || n.includes('cane')) {
    return 'Whirl / Staff';
  }
  if (n.includes('bow') || n.includes('crossbow') || n.includes('longbow')) {
    return 'Archery';
  }
  if (n.includes('knife') || n.includes('dagger') || n.includes('dirk') || n.includes('stiletto') || n.includes('throwing')) {
    return 'Hurl / Throwing';
  }
  if (n.includes('shield') || n.includes('buckler') || n.includes('targe')) {
    return 'Parrying';
  }
  return 'Swordmanship';
}

function extractOriginalGraphics(zip) {
  console.log('Extracting & converting original Dragon Raja graphics (.csp, .dat, .spr, .sou -> .png)...');
  let convertedCount = 0;

  const saveCspEntry = (zipPath, outRelPath) => {
    const buf = zip.readEntryBuffer(zipPath);
    if (!buf) return false;
    const res = decodeCspToPng(buf, 0);
    if (!res) return false;
    const fullOut = path.join(PUBLIC_ORIG_DIR, outRelPath);
    fs.mkdirSync(path.dirname(fullOut), { recursive: true });
    fs.writeFileSync(fullOut, res.pngBuffer);
    convertedCount++;
    return true;
  };

  const saveDatEntry = (zipPath, spriteIdx, outRelPath) => {
    const buf = zip.readEntryBuffer(zipPath);
    if (!buf) return false;
    const res = decodeDatSpriteToPng(buf, spriteIdx);
    if (!res) return false;
    const fullOut = path.join(PUBLIC_ORIG_DIR, outRelPath);
    fs.mkdirSync(path.dirname(fullOut), { recursive: true });
    fs.writeFileSync(fullOut, res.pngBuffer);
    convertedCount++;
    return true;
  };

  // 1. Extract all MainInterface .csp resources (exact HUD from MainInterface.xml)
  const mainUiEntries = zip.allEntryNames.filter(
    (n) => n.toLowerCase().startsWith('data/ui/resources/maininterface/') && n.toLowerCase().endsWith('.csp')
  );
  for (const entryName of mainUiEntries) {
    const rel = entryName.slice('data/UI/Resources/MainInterface/'.length).replace(/\.csp$/i, '.png');
    saveCspEntry(entryName, path.join('ui/main', rel.toLowerCase()));
  }

  // 2. Extract Extra, OptionMenu, Achievement, Arena, and MW .csp resources
  const extraDirs = ['Extra', 'OptionMenu', 'Arena', 'MW'];
  for (const dirName of extraDirs) {
    const list = zip.allEntryNames.filter(
      (n) => n.toLowerCase().startsWith(`data/ui/resources/${dirName.toLowerCase()}/`) && n.toLowerCase().endsWith('.csp')
    );
    for (const entryName of list) {
      const rel = entryName.slice(`data/UI/Resources/${dirName}/`.length).replace(/\.csp$/i, '.png');
      saveCspEntry(entryName, path.join('ui', dirName.toLowerCase(), rel.toLowerCase()));
    }
  }
  saveCspEntry('data/UI/Achievement/Resources/Background.csp', 'ui/windows/achievement_bg.png');
  saveCspEntry('images/ui/misc/item_slot.csp', 'ui/misc/item_slot.png');
  saveCspEntry('images/ui/currencies/dual_fame.csp', 'ui/misc/dual_fame.png');
  saveCspEntry('images/ui/currencies/fame.csp', 'ui/misc/fame.png');
  saveCspEntry('images/ui/currencies/war_points.csp', 'ui/misc/war_points.png');
  saveCspEntry('images/ui/legacy/renus.csp', 'ui/maps/renes.png');
  saveCspEntry('images/ui/legacy/barantan.csp', 'ui/maps/barantan.png');
  saveCspEntry('images/ui/legacy/heltern.csp', 'ui/maps/heltern.png');

  // 3. Extract all 30 sprites of CharacterSheet_en.dat
  const csBuf = zip.readEntryBuffer('images/ui/CharacterSheet/CharacterSheet_en.dat');
  if (csBuf) {
    const count = csBuf.readUInt16LE(0);
    for (let i = 0; i < count; i++) {
      const res = decodeDatSpriteToPng(csBuf, i);
      if (res) {
        const p = path.join(PUBLIC_ORIG_DIR, `ui/charsheet/cs_${i}.png`);
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, res.pngBuffer);
        convertedCount++;
      }
    }
  }

  // 4. Extract Original Window Backgrounds from localized/en/*.dat and legacy/*.dat
  const windowDatTargets = [
    ['images/ui/legacy/localized/en/NewInventory.dat', 0, 'ui/windows/inventory_bg.png'],
    ['images/ui/legacy/localized/en/NewInventory.dat', 1, 'ui/windows/inventory_paperdoll.png'],
    ['images/ui/legacy/localized/en/SkillMaster.dat', 0, 'ui/windows/skillmaster_bg.png'],
    ['images/ui/legacy/localized/en/ItemMakeRare.dat', 0, 'ui/windows/itemmake_bg.png'],
    ['images/ui/legacy/localized/en/Merchant.dat', 0, 'ui/windows/merchant_bg.png'],
    ['images/ui/legacy/localized/en/ARENA.dat', 0, 'ui/windows/arena_bg.png'],
    ['images/ui/legacy/localized/en/WarStatus.dat', 0, 'ui/windows/warstatus_bg.png'],
    ['images/ui/legacy/localized/en/NewParty.dat', 0, 'ui/windows/party_bg.png'],
    ['images/ui/legacy/localized/en/guild_menu.dat', 0, 'ui/windows/guild_bg.png'],
    ['images/ui/legacy/localized/en/sys_mail.dat', 0, 'ui/windows/mail_bg.png'],
    ['images/ui/legacy/localized/en/NewSelectMap.dat', 0, 'ui/windows/worldmap_bg.png'],
    ['images/ui/legacy/localized/en/dual_img.dat', 0, 'ui/windows/dual_bg.png'],
    ['images/ui/legacy/localized/en/legend_dual_img.dat', 0, 'ui/windows/legend_dual_bg.png'],
    ['images/ui/legacy/localized/en/map00.dat', 0, 'ui/maps/map00.png'],
    ['images/ui/legacy/localized/en/map01.dat', 0, 'ui/maps/map01.png'],
    ['images/ui/legacy/questuj.dat', 0, 'ui/windows/quest_dialog_bg.png'],
    ['images/ui/legacy/questuj.dat', 1, 'ui/windows/quest_dialog_p2.png'],
    ['images/ui/buttons/rect_button.dat', 0, 'ui/buttons/rect_normal.png'],
    ['images/ui/buttons/rect_button.dat', 1, 'ui/buttons/rect_hover.png'],
    ['images/ui/buttons/rect_button.dat', 2, 'ui/buttons/rect_pressed.png']
  ];
  for (const [zp, idx, out] of windowDatTargets) {
    saveDatEntry(zp, idx, out);
  }

  // Extract character portraits (face_man_b.dat & face_woman_b.dat)
  for (let i = 0; i < 8; i++) {
    saveDatEntry('images/ui/legacy/face_man_b.dat', i, `ui/portraits/man_${i}.png`);
    saveDatEntry('images/ui/legacy/face_woman_b.dat', i, `ui/portraits/woman_${i}.png`);
  }

  // 5. Extract Wizard & Priest Spell Icons, Job Skill Icons, and Combat Skill Icons
  const magicIconEntries = zip.allEntryNames.filter(
    (n) => n.toLowerCase().startsWith('images/ui/legacy/icons/magic/') && n.toLowerCase().endsWith('.csp')
  );
  for (const entryName of magicIconEntries) {
    const base = path.basename(entryName).replace(/\.csp$/i, '.png').toLowerCase();
    saveCspEntry(entryName, `icons/magic/${base}`);
  }

  const skillIconEntries = zip.allEntryNames.filter(
    (n) => n.toLowerCase().startsWith('images/ui/legacy/icons/skill/') && n.toLowerCase().endsWith('.csp')
  );
  for (const entryName of skillIconEntries) {
    const base = path.basename(entryName).replace(/\.csp$/i, '.png').toLowerCase();
    saveCspEntry(entryName, `icons/skill/${base}`);
  }

  const csIconBuf = zip.readEntryBuffer('images/ui/legacy/CombatSkillIcon.dat');
  if (csIconBuf) {
    const count = Math.min(45, csIconBuf.readUInt16LE(0));
    for (let i = 0; i < count; i++) {
      const res = decodeDatSpriteToPng(csIconBuf, i);
      if (res) {
        const p = path.join(PUBLIC_ORIG_DIR, `icons/cskills/cs_${i}.png`);
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, res.pngBuffer);
        convertedCount++;
      }
    }
  }

  // 6. Extract 80 Original Inventory Item Icons (weapons, armors, potions, materials)
  const invItemEntries = zip.allEntryNames
    .filter((n) => n.toLowerCase().startsWith('images/items/legacy/inventory/') && n.toLowerCase().endsWith('.csp'))
    .slice(0, 80);
  const extractedItemIcons = [];
  for (let i = 0; i < invItemEntries.length; i++) {
    const relOut = `icons/items/item_${i}.png`;
    if (saveCspEntry(invItemEntries[i], relOut)) {
      extractedItemIcons.push(`/assets/original/${relOut}`);
    }
  }

  // 7. Extract Original Terrain Tiles from .sou tilesheets
  const tileTargets = [
    ['images/tilesheets/ma-in.sou', 2, 'world/tiles/grass_1.png'],
    ['images/tilesheets/ma-in.sou', 3, 'world/tiles/grass_2.png'],
    ['images/tilesheets/ma-in.sou', 11, 'world/tiles/cobble_1.png'],
    ['images/tilesheets/ma-in.sou', 12, 'world/tiles/cobble_2.png'],
    ['images/tilesheets/ma-in.sou', 15, 'world/tiles/dirt_1.png'],
    ['images/tilesheets/ice-w01.sou', 1, 'world/tiles/snow_1.png'],
    ['images/tilesheets/firedun1.sou', 1, 'world/tiles/dungeon_1.png'],
    ['images/tilesheets/10.sou', 1, 'world/tiles/sand_1.png']
  ];
  for (const [zp, idx, out] of tileTargets) {
    saveDatEntry(zp, idx, out);
  }

  // 8. Extract Original Map Objects (Trees, Medieval Houses, Roofs, Walls, Rocks, Fountains, Statues)
  const objectTargets = [
    ['images/objects/legacy/0/0001.CSP', 'world/objects/tree_1.png'],
    ['images/objects/legacy/0/0002.CSP', 'world/objects/tree_large.png'],
    ['images/objects/legacy/0/000801.CSP', 'world/objects/tree_oak.png'],
    ['images/objects/legacy/0/0012.CSP', 'world/objects/tree_pine.png'],
    ['images/objects/legacy/0/0014.CSP', 'world/objects/bush_herb.png'],
    ['images/objects/legacy/2/2003.CSP', 'world/objects/torch_post.png'],
    ['images/objects/legacy/2/2007.CSP', 'world/objects/fountain.png'],
    ['images/objects/legacy/3/3003.CSP', 'world/objects/ore_vein.png'],
    ['images/objects/legacy/3/3006.CSP', 'world/objects/rock_crystal.png'],
    ['images/objects/legacy/4/4001.CSP', 'world/objects/castle_wall.png'],
    ['images/objects/legacy/4/4007.CSP', 'world/objects/castle_tower.png'],
    ['images/objects/legacy/5/5001.CSP', 'world/objects/house_smithy.png'],
    ['images/objects/legacy/5/5008.CSP', 'world/objects/house_tavern.png'],
    ['images/objects/legacy/5/5009.CSP', 'world/objects/house_temple.png'],
    ['images/objects/legacy/6/6101.CSP', 'world/objects/roof_small.png'],
    ['images/objects/legacy/6/6103.CSP', 'world/objects/roof_large.png'],
    ['images/objects/legacy/6/6104.CSP', 'world/objects/roof_tower.png'],
    ['images/objects/legacy/7/690801.CSP', 'world/objects/citadel_keep.png'],
    ['images/objects/legacy/7/7277.csp', 'world/objects/guard_stone.png']
  ];
  for (const [zp, out] of objectTargets) {
    saveCspEntry(zp, out);
  }

  // 9. Extract Original Character, NPC & Monster Sprites from .spr archives
  const sprTargets = [
    ['images/characters/player/legacy/920001.spr', 0, 'world/sprites/hero_knight.png'],
    ['images/characters/player/legacy/920002.spr', 0, 'world/sprites/hero_mounted.png'],
    ['images/characters/npc/legacy/002000.spr', 0, 'world/sprites/npc_vulcan.png'],
    ['images/characters/npc/legacy/003000.spr', 0, 'world/sprites/npc_karl.png'],
    ['images/characters/npc/legacy/004000.SPR', 0, 'world/sprites/npc_orem.png'],
    ['images/characters/npc/legacy/005000.spr', 0, 'world/sprites/npc_nedval.png'],
    ['images/characters/npc/legacy/007000.spr', 0, 'world/sprites/mob_boar.png'],
    ['images/characters/npc/legacy/009000.spr', 0, 'world/sprites/mob_goblin.png'],
    ['images/characters/npc/legacy/012000.spr', 0, 'world/sprites/mob_orc.png'],
    ['images/characters/npc/legacy/015000.spr', 0, 'world/sprites/mob_skeleton.png'],
    ['images/characters/npc/legacy/018000.spr', 0, 'world/sprites/mob_lizardman.png'],
    ['images/characters/npc/legacy/022000.spr', 0, 'world/sprites/mob_golem.png'],
    ['images/characters/npc/legacy/030000.spr', 0, 'world/sprites/mob_dragon.png']
  ];
  for (const [zp, idx, out] of sprTargets) {
    saveDatEntry(zp, idx, out);
  }

  console.log(`Converted ${convertedCount} original Dragon Raja sprites into PNGs in public/assets/original/`);
  return { convertedCount, extractedItemIcons };
}

function main() {
  console.log('Opening Dragon Raja data0 archive:', DATA0_PATH);
  const zip = new FastZipReader(DATA0_PATH);
  console.log(`Indexed ${zip.allEntryNames.length} entries from data0.`);

  const { convertedCount, extractedItemIcons } = extractOriginalGraphics(zip);

  // Parse strings
  const itemsTxt = parseKeyValueTxt(zip.readEntryText('data/strings/english/en_items.txt'));
  const skillsTxt = parseKeyValueTxt(zip.readEntryText('data/strings/english/en_skills.txt'));
  const raresTxt = parseKeyValueTxt(zip.readEntryText('data/strings/english/en_rares.txt'));
  const generalTxt = parseKeyValueTxt(zip.readEntryText('data/strings/english/en_general.txt'));
  const questsRaw = zip.readEntryText('data/strings/english/en_quests.txt');

  // Build Item Catalog with original icon paths
  const items = [];
  const categoryConfig = [
    { prefix: '#STR_ITEM_WEAPON_', category: 'weapon', slot: 'weapon', basePrice: 450 },
    { prefix: '#STR_ITEM_ARMOR_', category: 'armor', slot: 'armor', basePrice: 380 },
    { prefix: '#STR_ITEM_ACCESSORY_', category: 'accessory', slot: 'accessory', basePrice: 600 },
    { prefix: '#STR_ITEM_POTION_', category: 'potion', slot: 'consumable', basePrice: 65 },
    { prefix: '#STR_ITEM_COOK_', category: 'food', slot: 'consumable', basePrice: 45 },
    { prefix: '#STR_ITEM_PLANT_', category: 'material_plant', slot: 'material', basePrice: 25 },
    { prefix: '#STR_ITEM_MINERAL_', category: 'material_mineral', slot: 'material', basePrice: 40 },
    { prefix: '#STR_ITEM_HERB_', category: 'material_herb', slot: 'material', basePrice: 35 },
    { prefix: '#STR_ITEM_TOOL_', category: 'tool', slot: 'weapon', basePrice: 180 },
    { prefix: '#STR_ITEM_ETC_', category: 'etc', slot: 'material', basePrice: 90 }
  ];

  const seenNames = new Set();
  for (const [key, name] of Object.entries(itemsTxt)) {
    if (!name || name.length < 2 || name.startsWith('?')) continue;
    const cfg = categoryConfig.find((c) => key.startsWith(c.prefix));
    if (!cfg) continue;

    const idNum = parseInt(key.replace(cfg.prefix, ''), 10) || 1;
    const dedupKey = `${cfg.category}:${name.toLowerCase()}`;
    if (seenNames.has(dedupKey)) continue;
    seenNames.add(dedupKey);

    let slot = cfg.slot;
    const lower = name.toLowerCase();
    if (cfg.category === 'armor') {
      if (lower.includes('helm') || lower.includes('hat') || lower.includes('cap') || lower.includes('crown') || lower.includes('circlet') || lower.includes('ribbon')) {
        slot = 'helmet';
      } else if (lower.includes('shoe') || lower.includes('boot') || lower.includes('greave') || lower.includes('sandal')) {
        slot = 'shoes';
      } else if (lower.includes('shield') || lower.includes('buckler')) {
        slot = 'shield';
      } else if (lower.includes('mantle') || lower.includes('cape') || lower.includes('cloak')) {
        slot = 'mantle';
      } else {
        slot = 'armor';
      }
    } else if (cfg.category === 'accessory') {
      if (lower.includes('ring')) slot = 'ring';
      else if (lower.includes('saddle') || lower.includes('horse')) slot = 'saddle';
      else slot = 'necklace';
    }

    const tier = Math.min(10, Math.max(1, Math.ceil((idNum % 80) / 8)));
    const reqLevel = Math.max(1, tier * 10 - 8);
    const iconUrl =
      extractedItemIcons.length > 0
        ? extractedItemIcons[(items.length + idNum) % extractedItemIcons.length]
        : '/assets/original/icons/items/item_0.png';

    items.push({
      id: key.replace('#STR_', '').toLowerCase(),
      code: idNum,
      name,
      category: cfg.category,
      slot,
      tier,
      reqLevel,
      price: cfg.basePrice * tier,
      iconUrl,
      attackMin: cfg.category === 'weapon' ? 8 + tier * 11 : 0,
      attackMax: cfg.category === 'weapon' ? 16 + tier * 18 : 0,
      defense: cfg.category === 'armor' ? 5 + tier * 9 : cfg.category === 'accessory' ? 2 + tier * 4 : 0,
      tactic: cfg.category === 'weapon' ? inferWeaponTactic(name) : undefined,
      hpRestore: cfg.category === 'potion' && (lower.includes('red') || lower.includes('heal') || lower.includes('life') || lower.includes('blood')) ? 120 * tier : 0,
      mpRestore: cfg.category === 'potion' && (lower.includes('blue') || lower.includes('mana') || lower.includes('magic')) ? 100 * tier : 0,
      spRestore: cfg.category === 'food' ? 35 + tier * 10 : 0
    });
  }

  // Parse Wizard & Priest Spells with original icon URLs
  const wizardSpells = [];
  for (let i = 1; i <= 100; i++) {
    const name = skillsTxt[`#STR_MAGIC_WIZARD_NAME_${i}`];
    const explain = skillsTxt[`#STR_MAGIC_WIZARD_EXPLAIN_${i}`] || 'Ancient Dragon Raja arcane incantation.';
    if (name && name.trim()) {
      const circle = Math.min(12, Math.max(1, Math.ceil(i / 6)));
      const lower = name.toLowerCase();
      let element = 'arcane';
      if (lower.includes('fire') || lower.includes('flame') || lower.includes('meteor') || lower.includes('blaze')) element = 'fire';
      else if (lower.includes('ice') || lower.includes('cold') || lower.includes('frost') || lower.includes('freeze') || lower.includes('snow')) element = 'ice';
      else if (lower.includes('light') || lower.includes('thunder') || lower.includes('bolt') || lower.includes('spark')) element = 'lightning';
      else if (lower.includes('stone') || lower.includes('earth') || lower.includes('rock') || lower.includes('wall')) element = 'earth';
      else if (lower.includes('protect') || lower.includes('shield') || lower.includes('speed') || lower.includes('sight') || lower.includes('invis')) element = 'support';

      const pad = String(i).padStart(3, '0');
      wizardSpells.push({
        id: `wiz_${i}`,
        index: i,
        name: name.trim(),
        description: explain.trim(),
        type: 'wizard',
        circle,
        reqLevel: Math.max(1, (circle - 1) * 8 + 1),
        mpCost: 8 + circle * 12,
        power: 35 + circle * 42,
        element,
        iconUrl: `/assets/original/icons/magic/w${pad}.png`
      });
    }
  }

  const priestSpells = [];
  for (const [key, name] of Object.entries(skillsTxt)) {
    if (!key.startsWith('#STR_MAGIC_PRIEST_NAME_')) continue;
    const suffix = key.replace('#STR_MAGIC_PRIEST_NAME_', '');
    const i = parseInt(suffix, 10) || 151;
    const explain = skillsTxt[`#STR_MAGIC_PRIEST_EXPLAIN_${suffix}`] || 'Sacred Orroy divine prayer.';
    if (name && name.trim() && !name.startsWith('?')) {
      const idx = priestSpells.length + 1;
      const circle = Math.min(10, Math.max(1, Math.ceil(idx / 4)));
      const lower = name.toLowerCase();
      let role = 'holy_attack';
      if (lower.includes('heal') || lower.includes('cure') || lower.includes('recover') || lower.includes('life') || lower.includes('miracle') || lower.includes('restore')) role = 'heal';
      else if (lower.includes('bless') || lower.includes('protect') || lower.includes('shield') || lower.includes('holy') || lower.includes('armor') || lower.includes('pray') || lower.includes('authority')) role = 'buff';

      const pIdx = Math.min(42, idx);
      const pad = String(pIdx).padStart(3, '0');
      priestSpells.push({
        id: `pri_${i}`,
        index: i,
        name: name.trim(),
        description: explain.trim(),
        type: 'priest',
        circle,
        reqLevel: Math.max(1, (circle - 1) * 9 + 1),
        dpCost: 10 + circle * 14,
        power: 40 + circle * 45,
        role,
        iconUrl: `/assets/original/icons/magic/p${pad}.png`
      });
    }
  }

  const combatSkillGroups = [];
  for (const [key, val] of Object.entries(skillsTxt)) {
    if (key.startsWith('#STR_COMBAT_SKILL_GROUP_NAME_') && val && val.trim()) {
      combatSkillGroups.push(val.trim());
    }
  }
  if (combatSkillGroups.length === 0) {
    combatSkillGroups.push('Lightning', 'Earth', 'Wind', 'Darkness', 'Fire', 'Ice');
  }

  const combatSkills = [];
  for (const [key, name] of Object.entries(skillsTxt)) {
    if (!key.startsWith('#STR_COMBAT_SKILL_NAME_')) continue;
    const suffix = key.replace('#STR_COMBAT_SKILL_NAME_', '');
    const explain = skillsTxt[`#STR_COMBAT_SKILL_EXPLAIN_${suffix}`] || 'Master combat technique consuming CP.';
    if (name && name.trim() && !name.startsWith('?')) {
      const idx = combatSkills.length;
      const groupIdx = idx % combatSkillGroups.length;
      const tier = Math.floor(idx / 6) + 1;
      combatSkills.push({
        id: `cs_${suffix}`,
        index: 215 + idx,
        name: name.trim(),
        description: explain.trim(),
        group: combatSkillGroups[groupIdx] || 'Lightning',
        tier,
        reqLevel: Math.max(10, tier * 16),
        cpCost: 15 + tier * 18,
        damageMultiplier: +(1.35 + tier * 0.35).toFixed(2),
        iconUrl: `/assets/original/icons/cskills/cs_${idx % 45}.png`
      });
    }
  }

  const jobSkills = [];
  for (let i = 0; i < 60; i++) {
    const name = skillsTxt[`#STR_SKILL_NAME_${i}`];
    const explain = skillsTxt[`#STR_SKILL_EXPLAIN_${i}`];
    if (name && name.trim() && !name.startsWith('?')) {
      const pad = String(Math.max(1, (jobSkills.length % 40) + 1)).padStart(3, '0');
      jobSkills.push({
        id: `job_${i}`,
        index: i,
        name: name.trim(),
        description: (explain || 'Primary citizen skill of Dragon Raja.').trim(),
        iconUrl: `/assets/original/icons/skill/s${pad}.png`
      });
    }
  }

  const rareModifiers = [];
  for (let i = 1; i <= 130; i++) {
    const name = raresTxt[`#STR_RARE_NAME_${i}`];
    const explain = raresTxt[`#STR_RARE_EXPLAIN_${i}`];
    if (name && name.trim() && !name.startsWith('?')) {
      rareModifiers.push({
        id: i,
        name: name.trim(),
        explain: (explain || 'Enhances item attributes.').trim(),
        bonusPerGrade: 4 + (i % 9) * 2
      });
    }
  }

  const rareGroups = [];
  for (const [key, name] of Object.entries(raresTxt)) {
    if (key.startsWith('#STR_RARE_GROUP_NAME_') && name && name.trim() && !name.startsWith('?')) {
      const id = parseInt(key.replace('#STR_RARE_GROUP_NAME_', ''), 10) || rareGroups.length + 1;
      rareGroups.push({ id, name: name.trim() });
    }
  }

  const legendSets = [];
  for (let g = 1; g <= 25; g++) {
    const names = [];
    for (let s = 1; s <= 15; s++) {
      const n = raresTxt[`#STR_RARE_LEGEND_NAME_${g}_${s}`];
      if (n && n.trim()) names.push(n.trim());
    }
    if (names.length > 0) {
      legendSets.push({ groupIndex: g, items: names });
    }
  }

  const symbols = [];
  for (let i = 1; i <= 30; i++) {
    const name = raresTxt[`#STR_RARE_SYMBOL_NAME_${i}`];
    if (name && name.trim()) {
      symbols.push({
        id: i,
        name: name.trim(),
        grade: Math.min(5, Math.ceil(i / 5)),
        statBonus: `+${8 + i * 3} All Stats / +${4 + i}% Force`
      });
    }
  }

  const dualClasses = {
    WARRIOR: [],
    THIEF: [],
    ARCHER: [],
    WIZARD: [],
    PRIEST: []
  };
  for (const cls of Object.keys(dualClasses)) {
    for (let i = 0; i < 6; i++) {
      const name = generalTxt[`#STR_${cls}_DUALCLASS_NAME_${i}`];
      const explain = generalTxt[`#STR_${cls}_DUALCLASS_EXPLAIN_${i}`];
      if (name && name.trim()) {
        dualClasses[cls].push({
          index: i,
          name: name.trim(),
          explain: (explain || '').trim()
        });
      }
    }
  }

  const quests = [];
  const questLines = questsRaw.split(/\r?\n/);
  let currentSection = 'Renes & Continent Chronicles';
  let currentSteps = [];
  let questCounter = 1;

  for (const rawLine of questLines) {
    const line = rawLine.trim();
    if (line.startsWith('//')) {
      if (currentSteps.length >= 2) {
        quests.push({
          id: `quest_${questCounter++}`,
          title: currentSection,
          steps: currentSteps.slice(0, 8),
          rewardExp: 1500 * questCounter,
          rewardGold: 2500 * questCounter
        });
      }
      currentSection = line.replace(/^\/\/+\s*/, '').trim() || `Chronicle #${questCounter}`;
      currentSteps = [];
    } else {
      const m = line.match(/^#[A-Z0-9_]+\s+"([^"]+)"/);
      if (m && m[1].trim().length > 10) {
        currentSteps.push(m[1].trim());
      }
    }
    if (quests.length >= 30) break;
  }

  zip.close();

  const payload = {
    meta: {
      sourceVersion: 'Dragon Raja Global v1.8.5.18',
      extractedAt: new Date().toISOString(),
      convertedOriginalPngs: convertedCount,
      counts: {
        items: items.length,
        wizardSpells: wizardSpells.length,
        priestSpells: priestSpells.length,
        combatSkills: combatSkills.length,
        jobSkills: jobSkills.length,
        rareModifiers: rareModifiers.length,
        rareGroups: rareGroups.length,
        legendSets: legendSets.length,
        symbols: symbols.length,
        quests: quests.length
      }
    },
    items: items.slice(0, 450),
    wizardSpells,
    priestSpells,
    combatSkillGroups,
    combatSkills,
    jobSkills,
    rareModifiers,
    rareGroups,
    legendSets,
    symbols,
    dualClasses,
    quests
  };

  const outPath = path.join(OUT_DATA_DIR, 'extractedData.json');
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log('Successfully extracted data0 catalogs & original PNG graphics!');
  console.log('Summary:', payload.meta);
}

main();
