import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import type { Plugin } from 'vite';
import { WasmNetServer } from './wasmNetServer';

const DATA0_PATH =
  process.env.DR_DATA0_PATH || 'C:\\Program Files (x86)\\DragonRajaGlobal\\Live\\data\\data0';
const DATA0_URL = (process.env.DR_DATA0_URL || '').trim();
const LIVE_DIR = path.dirname(path.dirname(DATA0_PATH));

// Exact 0..10 tilesheet table extracted from DragonRaja.exe VA 0x00A2BF68
export const TILESHEET_NAMES = [
  'Ma-in',        // 0 (sheetId = 1)
  'K_Sung2',      // 1 (sheetId = 2)
  'mandun1',      // 2 (sheetId = 3)
  'firedun1',     // 3 (sheetId = 4)
  'gray',         // 4 (sheetId = 5)
  'sung_tile_00', // 5 (sheetId = 6)
  'hu_vm',        // 6 (sheetId = 7)
  'ICE-W01',      // 7 (sheetId = 8)
  'SOURCE',       // 8 (sheetId = 9)
  '10',           // 9 (sheetId = 10)
  '11'            // 10 (sheetId = 11)
];

interface ZipEntryMeta {
  name: string;
  method: number;
  cSize: number;
  uSize: number;
  lOff: number;
}

interface DecodedSprite {
  w: number;
  h: number;
  ox: number;
  oy: number;
  isRaw32: boolean;
  rgba: Uint8Array;
}

// CRC32 Table for fast PNG encoding
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(type: string, data: Uint8Array): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 4, 'ascii');
  if (data.length > 0) {
    Buffer.from(data.buffer, data.byteOffset, data.byteLength).copy(out, 8);
  }
  const crcVal = crc32(out.subarray(4, 8 + data.length));
  out.writeUInt32BE(crcVal, 8 + data.length);
  return out;
}

export function encodeRgbaToPng(width: number, height: number, rgba: Uint8Array, fast = false): Buffer {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const rawScanlines = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    rawScanlines[rowStart] = 0; // filter 0
    const srcOff = y * stride;
    Buffer.from(rgba.buffer, rgba.byteOffset + srcOff, stride).copy(rawScanlines, rowStart + 1);
  }

  const compressed = zlib.deflateSync(rawScanlines, { level: fast ? 1 : 4 });
  return Buffer.concat([
    sig,
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', compressed),
    makePngChunk('IEND', new Uint8Array(0))
  ]);
}

function rgb565ToR(px: number): number {
  const r5 = (px >>> 11) & 0x1f;
  return (r5 << 3) | (r5 >>> 2);
}
function rgb565ToG(px: number): number {
  const g6 = (px >>> 5) & 0x3f;
  return (g6 << 2) | (g6 >>> 4);
}
function rgb565ToB(px: number): number {
  const b5 = px & 0x1f;
  return (b5 << 3) | (b5 >>> 2);
}

export function decodeCspOrSouChunk(buf: Buffer, headerOff = 0): DecodedSprite | null {
  if (headerOff + 8 > buf.length) return null;
  const wRaw = buf.readUInt16LE(headerOff);
  const hRaw = buf.readUInt16LE(headerOff + 2);

  // Special case in .sou tilesheets (DragonRaja.exe fo:1188500):
  // w === 0xFFFF means an uncompressed 32x32 RGB565 tile (2048 bytes starting at headerOff + 4)
  if (wRaw === 0xffff) {
    const pixelStart = headerOff + 4;
    if (pixelStart + 2048 > buf.length) return null;
    const rgba = new Uint8Array(32 * 32 * 4);
    for (let i = 0; i < 1024; i++) {
      const px = buf.readUInt16LE(pixelStart + i * 2);
      const di = i * 4;
      rgba[di] = rgb565ToR(px);
      rgba[di + 1] = rgb565ToG(px);
      rgba[di + 2] = rgb565ToB(px);
      rgba[di + 3] = 255;
    }
    return { w: 32, h: 32, ox: 0, oy: 0, isRaw32: true, rgba };
  }

  if (headerOff + 12 > buf.length) return null;
  const w = wRaw;
  const h = hRaw;
  const ox = buf.readInt16LE(headerOff + 4);
  const oy = buf.readInt16LE(headerOff + 6);
  if (w === 0 || h === 0 || w > 2048 || h > 2048) return null;

  const rgba = new Uint8Array(w * h * 4);
  let ptr = headerOff + 12;

  for (let y = 0; y < h; y++) {
    let x = 0;
    let guard = 0;
    while (ptr + 2 <= buf.length && guard++ < 4096) {
      const skipBytes = buf.readUInt16LE(ptr);
      ptr += 2;
      if (skipBytes === 0xffff) break;
      x += skipBytes >> 1;
      if (ptr + 2 > buf.length) break;
      const copyBytes = buf.readUInt16LE(ptr);
      ptr += 2;
      const runPixels = copyBytes >> 1;
      for (let i = 0; i < runPixels; i++) {
        if (ptr + 2 > buf.length) break;
        const px = buf.readUInt16LE(ptr);
        ptr += 2;
        if (x >= 0 && x < w) {
          const di = (y * w + x) * 4;
          rgba[di] = rgb565ToR(px);
          rgba[di + 1] = rgb565ToG(px);
          rgba[di + 2] = rgb565ToB(px);
          rgba[di + 3] = 255;
        }
        x++;
      }
    }
  }

  return { w, h, ox, oy, isRaw32: false, rgba };
}

function blitAnchored(
  dstRgba: Uint8Array,
  dstW: number,
  dstH: number,
  spr: DecodedSprite,
  anchorX: number,
  anchorY: number
): void {
  const startX = anchorX - spr.ox;
  const startY = anchorY - spr.oy;
  for (let y = 0; y < spr.h; y++) {
    const dy = startY + y;
    if (dy < 0 || dy >= dstH) continue;
    for (let x = 0; x < spr.w; x++) {
      const dx = startX + x;
      if (dx < 0 || dx >= dstW) continue;
      const si = (y * spr.w + x) * 4;
      if (spr.rgba[si + 3] > 0) {
        const di = (dy * dstW + dx) * 4;
        dstRgba[di] = spr.rgba[si];
        dstRgba[di + 1] = spr.rgba[si + 1];
        dstRgba[di + 2] = spr.rgba[si + 2];
        dstRgba[di + 3] = 255;
      }
    }
  }
}

export class Data0ArchiveManager {
  private fd: number | null = null;
  private fileSize = 0;
  private initialized = false;
  private remoteInitPromise: Promise<void> | null = null;
  private entries = new Map<string, ZipEntryMeta>();
  private entriesByBasename = new Map<string, string[]>();
  private objectById = new Map<number, string>();
  private decompressedCache = new Map<string, Buffer>();
  private spritePngCache = new Map<string, { png: Buffer; w: number; h: number; ox: number; oy: number }>();
  private mapBundleCache = new Map<string, { json: string; atlasPng: Buffer }>();
  private soundListBinCache: Buffer | null = null;

  public isRemoteMode(): boolean {
    return Boolean(DATA0_URL) && !fs.existsSync(DATA0_PATH);
  }

  private parseCentralDirectory(buf: Buffer, cdCount: number): void {
    let ptr = 0;
    for (let i = 0; i < cdCount && ptr + 46 <= buf.length; i++) {
      const method = buf.readUInt16LE(ptr + 10);
      const cSize = buf.readUInt32LE(ptr + 20);
      const uSize = buf.readUInt32LE(ptr + 24);
      const nLen = buf.readUInt16LE(ptr + 28);
      const xLen = buf.readUInt16LE(ptr + 30);
      const cLen = buf.readUInt16LE(ptr + 32);
      const lOff = buf.readUInt32LE(ptr + 42);
      const name = buf.toString('utf8', ptr + 46, ptr + 46 + nLen).replace(/\\/g, '/');
      const lower = name.toLowerCase();

      this.entries.set(lower, { name, method, cSize, uSize, lOff });

      const base = lower.slice(lower.lastIndexOf('/') + 1);
      let list = this.entriesByBasename.get(base);
      if (!list) {
        list = [];
        this.entriesByBasename.set(base, list);
      }
      list.push(lower);

      if (lower.startsWith('images/objects/legacy/') && lower.endsWith('.csp')) {
        const stem = base.replace('.csp', '');
        const num = Number(stem);
        if (!Number.isNaN(num)) {
          this.objectById.set(num, lower);
          if (stem.length === 6 && stem.endsWith('01')) {
            const id4 = Number(stem.slice(0, 4));
            if (!this.objectById.has(id4)) {
              this.objectById.set(id4, lower);
            }
          }
        }
      }

      ptr += 46 + nLen + xLen + cLen;
    }
  }

  private readLocalSlice(offset: number, length: number): Buffer {
    if (this.fd === null) throw new Error('data0 fd not open');
    const out = Buffer.allocUnsafe(length);
    let readTotal = 0;
    while (readTotal < length) {
      const n = fs.readSync(this.fd, out, readTotal, length - readTotal, offset + readTotal);
      if (n <= 0) break;
      readTotal += n;
    }
    return readTotal === length ? out : out.subarray(0, readTotal);
  }

  private async fetchRemoteRange(start: number, endInclusive: number): Promise<Buffer> {
    const res = await fetch(DATA0_URL, {
      headers: { Range: `bytes=${start}-${endInclusive}` },
      redirect: 'follow'
    });
    if (!res.ok && res.status !== 206) {
      throw new Error(`Remote data0 range fetch failed: HTTP ${res.status}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }

  public ensureInitialized(): void {
    if (this.initialized) return;
    if (!fs.existsSync(DATA0_PATH)) return;

    this.fd = fs.openSync(DATA0_PATH, 'r');
    this.fileSize = fs.fstatSync(this.fd).size;

    const tailLen = Math.min(65557, this.fileSize);
    const tail = this.readLocalSlice(this.fileSize - tailLen, tailLen);
    let eocd = tail.length - 22;
    while (eocd >= 0 && tail.readUInt32LE(eocd) !== 0x06054b50) {
      eocd--;
    }
    if (eocd < 0) throw new Error('Invalid data0 ZIP: EOCD not found');

    const cdCount = tail.readUInt16LE(eocd + 10);
    const cdSize = tail.readUInt32LE(eocd + 12);
    const cdOff = tail.readUInt32LE(eocd + 16);
    const cdBuf = this.readLocalSlice(cdOff, cdSize);
    this.parseCentralDirectory(cdBuf, cdCount);
    this.initialized = true;
  }

  public async ensureInitializedAsync(): Promise<void> {
    if (this.initialized) return;
    if (!this.isRemoteMode()) {
      this.ensureInitialized();
      return;
    }
    if (this.remoteInitPromise) return this.remoteInitPromise;

    this.remoteInitPromise = (async () => {
      const headRes = await fetch(DATA0_URL, { method: 'HEAD', redirect: 'follow' });
      const contentLen = Number(headRes.headers.get('content-length') || '0');
      if (!contentLen || Number.isNaN(contentLen)) {
        throw new Error(`Could not determine Content-Length for DR_DATA0_URL (${headRes.status})`);
      }
      this.fileSize = contentLen;

      const tailLen = Math.min(65557, this.fileSize);
      const tail = await this.fetchRemoteRange(this.fileSize - tailLen, this.fileSize - 1);
      let eocd = tail.length - 22;
      while (eocd >= 0 && tail.readUInt32LE(eocd) !== 0x06054b50) {
        eocd--;
      }
      if (eocd < 0) throw new Error('Invalid remote data0 ZIP: EOCD not found');

      const cdCount = tail.readUInt16LE(eocd + 10);
      const cdSize = tail.readUInt32LE(eocd + 12);
      const cdOff = tail.readUInt32LE(eocd + 16);
      const cdBuf = await this.fetchRemoteRange(cdOff, cdOff + cdSize - 1);
      this.parseCentralDirectory(cdBuf, cdCount);
      this.initialized = true;

      // Preload levelexp.bin into cache so wasmNetServer synchronous lookup works immediately
      await this.readEntryAsync('data/tables/levelexp.bin').catch(() => {});
      console.log(`[Data0] Remote index ready (${this.entries.size} entries from DR_DATA0_URL)`);
    })();

    return this.remoteInitPromise;
  }

  private getSoundListBin(): Buffer {
    if (this.soundListBinCache) return this.soundListBinCache;
    // MAX_SOUND = 2500, sizeof(SOUNDLIST) = 20 (int32 list_Index, int32 static_Sound, char sound_FileName[10], 2-byte pad)
    const count = 2500;
    const bodyLen = count * 20;
    const out = Buffer.alloc(1 + bodyLen + 1, 0);
    for (let i = 0; i < count; i++) {
      const off = 1 + i * 20;
      out.writeInt32LE(i, off); // list_Index
      out.writeInt32LE(0, off + 4); // static_Sound = 0 (stream via dr_wasm_play_sound)
      const wavName = `${String(i).padStart(4, '0')}.wav`;
      out.write(wavName, off + 8, 'ascii');
    }
    let crc = 0;
    for (let i = 0; i < bodyLen; i++) {
      crc = (crc + out.readInt8(1 + i)) & 0xff;
    }
    out[0] = crc;
    out[1 + bodyLen] = crc;
    this.soundListBinCache = out;
    return out;
  }

  public resolveRawClientFile(relPath: string): Buffer | null {
    this.ensureInitialized();
    const clean = relPath
      .replace(/\\/g, '/')
      .replace(/\/+/g, '/')
      .replace(/^\.\//, '')
      .replace(/^\/+/, '')
      .trim()
      .toLowerCase();
    if (!clean) return null;

    const base = clean.slice(clean.lastIndexOf('/') + 1);

    // 1. Virtual / Synthesized configuration & table files required by the C++ client
    if (base === 'beta.ini') {
      return Buffer.from('0\n', 'utf8');
    }
    if (base === 'dragon.ini') {
      return Buffer.from(
        '[network]\nhost1=127.0.0.1\nhost2=127.0.0.1\n\n[server]\n0=DragonRaja\ncount=1\n\n[nation]\nnation=2\n\n[option]\nsound=1\nmusic=1\nmouse=100\nwhisper=1\nchat=1\nparty=1\n',
        'utf8'
      );
    }
    if (base === 'filter.txt') {
      return Buffer.from('#\n', 'utf8');
    }
    if (base === 'condition_table.bin') {
      return Buffer.alloc(258, 0);
    }
    if (base === 'soundlist.bin' || base === 'soundlist_eng.bin') {
      return this.getSoundListBin();
    }
    if (base === 'menu_image.txt') {
      return this.readEntry('data/misc/en_menu_image.txt');
    }
    if (base === 'menustring.txt') {
      return this.readEntry('data/strings/english/en_menustring.txt');
    }
    if (base === 'quest.txt') {
      return this.readEntry('data/strings/english/en_quests.txt');
    }
    if (base === 'questpic.txt' || base === 'randomtalk.dat') {
      return Buffer.from('', 'utf8');
    }
    if (base === 'questpic.bin') {
      return Buffer.alloc(4, 0);
    }

    // 2. Direct path match inside data0
    const direct = this.readEntry(clean);
    if (direct) return direct;

    // 3. Category-specific directory mappings (itemdata vs item, object, map/event, sound, magic, skill, effect)
    if (clean.startsWith('itemdata/') || clean.includes('/bag/')) {
      const hit = this.readEntry(`images/items/legacy/inventory/${base}`);
      if (hit) return hit;
    }
    if (clean.startsWith('item/')) {
      const hit = this.readEntry(`images/items/legacy/ground/${base}`);
      if (hit) return hit;
    }
    if (clean.startsWith('object/')) {
      const sub = clean.slice('object/'.length);
      const hit = this.readEntry(`images/objects/legacy/${sub}`);
      if (hit) return hit;
    }
    if (clean.startsWith('sound/') || clean.startsWith('sound_b5/')) {
      const hit = this.readEntry(`sound/legacy/${base}`);
      if (hit) return hit;
    }
    if (clean.startsWith('magic/')) {
      const hit = this.readEntry(`images/ui/legacy/icons/magic/${base}`);
      if (hit) return hit;
    }
    if (clean.startsWith('skill/')) {
      const hit = this.readEntry(`images/ui/legacy/icons/skill/${base}`);
      if (hit) return hit;
    }
    if (clean.startsWith('effect/es/')) {
      const hit = this.readEntry(`images/effects/legacy/es/${base}`);
      if (hit) return hit;
    }
    if (clean.startsWith('effect/')) {
      const hit = this.readEntry(`images/effects/legacy/${base}`);
      if (hit) return hit;
    }
    if (clean.startsWith('map/') || clean.startsWith('event/')) {
      if (base.endsWith('.sou')) {
        const hit = this.readEntry(`images/tilesheets/${base}`);
        if (hit) return hit;
      } else {
        const dotIdx = base.lastIndexOf('.');
        const stem = dotIdx > 0 ? base.slice(0, dotIdx) : base;
        const hit = this.readEntry(`maps/${stem}/${base}`);
        if (hit) return hit;
      }
    }

    // 4. Basename index lookup across all 15,485 data0 entries (preferring English localized UI/strings)
    const candidates = this.entriesByBasename.get(base);
    if (candidates && candidates.length > 0) {
      const enCandidate =
        candidates.find((c) => c.includes('/localized/en/') || c.includes('/english/')) ||
        candidates[0];
      const hit = this.readEntry(enCandidate);
      if (hit) return hit;
    }

    // 5. Fallback to Live/cfg or Live directory on disk
    const cfgPath = path.join(LIVE_DIR, 'cfg', base);
    if (fs.existsSync(cfgPath) && fs.statSync(cfgPath).isFile()) {
      return fs.readFileSync(cfgPath);
    }
    const diskPath = path.join(LIVE_DIR, clean);
    if (fs.existsSync(diskPath) && fs.statSync(diskPath).isFile()) {
      return fs.readFileSync(diskPath);
    }

    return null;
  }

  public readEntry(pathKey: string): Buffer | null {
    this.ensureInitialized();
    const clean = pathKey.replace(/^\/+/, '').toLowerCase();
    const cached = this.decompressedCache.get(clean);
    if (cached) return cached;

    const meta = this.entries.get(clean);
    if (!meta || this.fd === null) return null;

    const header = this.readLocalSlice(meta.lOff, 30);
    const ln = header.readUInt16LE(26);
    const lx = header.readUInt16LE(28);
    const dataStart = meta.lOff + 30 + ln + lx;
    const raw = this.readLocalSlice(dataStart, meta.cSize);
    const out = meta.method === 0 ? Buffer.from(raw) : zlib.inflateRawSync(raw);

    if (this.decompressedCache.size > 120) {
      const firstKey = this.decompressedCache.keys().next().value;
      if (firstKey) this.decompressedCache.delete(firstKey);
    }
    this.decompressedCache.set(clean, out);
    return out;
  }

  public async readEntryAsync(pathKey: string): Promise<Buffer | null> {
    if (!this.isRemoteMode()) {
      return this.readEntry(pathKey);
    }
    await this.ensureInitializedAsync();
    const clean = pathKey.replace(/^\/+/, '').toLowerCase();
    const cached = this.decompressedCache.get(clean);
    if (cached) return cached;

    const meta = this.entries.get(clean);
    if (!meta) return null;

    const guessExtra = 256;
    const endPos = Math.min(this.fileSize - 1, meta.lOff + 30 + guessExtra + meta.cSize - 1);
    let chunk = await this.fetchRemoteRange(meta.lOff, endPos);
    const ln = chunk.readUInt16LE(26);
    const lx = chunk.readUInt16LE(28);
    const relStart = 30 + ln + lx;
    let raw: Buffer;
    if (relStart + meta.cSize <= chunk.length) {
      raw = chunk.subarray(relStart, relStart + meta.cSize);
    } else {
      const absStart = meta.lOff + relStart;
      raw = await this.fetchRemoteRange(absStart, absStart + meta.cSize - 1);
    }
    const out = meta.method === 0 ? Buffer.from(raw) : zlib.inflateRawSync(raw);

    if (this.decompressedCache.size > 400) {
      const firstKey = this.decompressedCache.keys().next().value;
      if (firstKey) this.decompressedCache.delete(firstKey);
    }
    this.decompressedCache.set(clean, out);
    return out;
  }

  public async resolveRawClientFileAsync(relPath: string): Promise<Buffer | null> {
    if (!this.isRemoteMode()) {
      return this.resolveRawClientFile(relPath);
    }
    await this.ensureInitializedAsync();
    const clean = relPath
      .replace(/\\/g, '/')
      .replace(/\/+/g, '/')
      .replace(/^\.\//, '')
      .replace(/^\/+/, '')
      .trim()
      .toLowerCase();
    if (!clean) return null;

    const base = clean.slice(clean.lastIndexOf('/') + 1);

    if (base === 'beta.ini') return Buffer.from('0\n', 'utf8');
    if (base === 'dragon.ini') {
      return Buffer.from(
        '[network]\nhost1=127.0.0.1\nhost2=127.0.0.1\n\n[server]\n0=DragonRaja\ncount=1\n\n[nation]\nnation=2\n\n[option]\nsound=1\nmusic=1\nmouse=100\nwhisper=1\nchat=1\nparty=1\n',
        'utf8'
      );
    }
    if (base === 'filter.txt') return Buffer.from('#\n', 'utf8');
    if (base === 'condition_table.bin') return Buffer.alloc(258, 0);
    if (base === 'soundlist.bin' || base === 'soundlist_eng.bin') return this.getSoundListBin();
    if (base === 'menu_image.txt') return this.readEntryAsync('data/misc/en_menu_image.txt');
    if (base === 'menustring.txt') return this.readEntryAsync('data/strings/english/en_menustring.txt');
    if (base === 'quest.txt') return this.readEntryAsync('data/strings/english/en_quests.txt');
    if (base === 'questpic.txt' || base === 'randomtalk.dat') return Buffer.from('', 'utf8');
    if (base === 'questpic.bin') return Buffer.alloc(4, 0);

    const direct = await this.readEntryAsync(clean);
    if (direct) return direct;

    if (clean.startsWith('itemdata/') || clean.includes('/bag/')) {
      const hit = await this.readEntryAsync(`images/items/legacy/inventory/${base}`);
      if (hit) return hit;
    }
    if (clean.startsWith('item/')) {
      const hit = await this.readEntryAsync(`images/items/legacy/ground/${base}`);
      if (hit) return hit;
    }
    if (clean.startsWith('object/')) {
      const sub = clean.slice('object/'.length);
      const hit = await this.readEntryAsync(`images/objects/legacy/${sub}`);
      if (hit) return hit;
    }
    if (clean.startsWith('sound/') || clean.startsWith('sound_b5/')) {
      const hit = await this.readEntryAsync(`sound/legacy/${base}`);
      if (hit) return hit;
    }
    if (clean.startsWith('magic/')) {
      const hit = await this.readEntryAsync(`images/ui/legacy/icons/magic/${base}`);
      if (hit) return hit;
    }
    if (clean.startsWith('skill/')) {
      const hit = await this.readEntryAsync(`images/ui/legacy/icons/skill/${base}`);
      if (hit) return hit;
    }
    if (clean.startsWith('effect/es/')) {
      const hit = await this.readEntryAsync(`images/effects/legacy/es/${base}`);
      if (hit) return hit;
    }
    if (clean.startsWith('effect/')) {
      const hit = await this.readEntryAsync(`images/effects/legacy/${base}`);
      if (hit) return hit;
    }
    if (clean.startsWith('map/') || clean.startsWith('event/')) {
      if (base.endsWith('.sou')) {
        const hit = await this.readEntryAsync(`images/tilesheets/${base}`);
        if (hit) return hit;
      } else {
        const dotIdx = base.lastIndexOf('.');
        const stem = dotIdx > 0 ? base.slice(0, dotIdx) : base;
        const hit = await this.readEntryAsync(`maps/${stem}/${base}`);
        if (hit) return hit;
      }
    }

    const candidates = this.entriesByBasename.get(base);
    if (candidates && candidates.length > 0) {
      const enCandidate =
        candidates.find((c) => c.includes('/localized/en/') || c.includes('/english/')) ||
        candidates[0];
      const hit = await this.readEntryAsync(enCandidate);
      if (hit) return hit;
    }

    return null;
  }

  public getContainerFrameOffsets(buf: Buffer): number[] {
    if (buf.length < 6) return [];
    const count = buf.readUInt16LE(0);
    if (count === 0 || count > 8000 || 2 + count * 4 > buf.length) return [];

    const firstOff = buf.readUInt32LE(2);
    const offsets: number[] = [];
    if (firstOff > 0) {
      for (let i = 0; i < count; i++) {
        offsets.push(buf.readUInt32LE(2 + i * 4));
      }
    } else {
      // Sequential .spr format (e.g. NPC 008000.spr where offset table is 0s)
      let seqPos = 2 + count * 4;
      for (let i = 0; i < count; i++) {
        if (seqPos + 4 > buf.length) break;
        const chunkLen = buf.readUInt32LE(seqPos);
        offsets.push(seqPos);
        seqPos += 4 + chunkLen;
      }
    }
    return offsets;
  }

  private decodeFrameRaw(entryPath: string, frameIdx = 0): DecodedSprite | null {
    const buf = this.readEntry(entryPath);
    if (!buf) return null;
    if (entryPath.toLowerCase().endsWith('.csp')) {
      return decodeCspOrSouChunk(buf, 0);
    }
    const offsets = this.getContainerFrameOffsets(buf);
    if (frameIdx >= 0 && frameIdx < offsets.length) {
      const off = offsets[frameIdx];
      if (off > 0 && off + 8 <= buf.length) {
        return decodeCspOrSouChunk(buf, off + 4);
      }
    }
    return null;
  }

  public getSpritePng(
    entryPath: string,
    frameIdx = 0,
    anchor = false
  ): { png: Buffer; w: number; h: number; ox: number; oy: number } | null {
    const lowerPath = entryPath.toLowerCase();
    const isCompositePlayer = lowerPath === 'player/male' || lowerPath === 'player/female';
    const useAnchor = anchor || isCompositePlayer;
    const cacheKey = `${lowerPath}#${frameIdx}#${useAnchor ? 1 : 0}`;
    const hit = this.spritePngCache.get(cacheKey);
    if (hit) return hit;

    const ANW = 220;
    const ANH = 220;
    const ANX = 110;
    const ANY = 155;

    // PutTestAnimation (SmallMenu.cpp:313060) - Big 3D Pre-rendered Character Showcase for MN_SELECT_CHARACTER
    if (lowerPath.startsWith('charanibig/')) {
      const parts = lowerPath.split('/');
      const g = Math.max(0, Math.min(1, Number(parts[1]) || 0));
      const c = Math.max(0, Math.min(4, Number(parts[2]) || 0));
      const gabX = [
        [-12, -33, 0, -23, -20],
        [2, -23, -8, -13, -53]
      ];
      const gabY = [
        [68, 15, 0, 53, 63],
        [-31, -1, -29, -34, -37]
      ];
      const baseSprPath = `images/ui/legacy/misc/charanibig1${g}${c}.spr`;
      const baseBuf = this.readEntry(baseSprPath);
      if (!baseBuf) return null;
      const offsets = this.getContainerFrameOffsets(baseBuf);
      if (offsets.length === 0) return null;
      const wrappedIdx = ((frameIdx % offsets.length) + offsets.length) % offsets.length;

      const CW = 360;
      const CH = 440;
      const ax = 180 + gabX[g][c];
      const ay = 220 + gabY[g][c];
      const rgba = new Uint8Array(CW * CH * 4);
      let drewAny = false;
      for (const layerNum of [1, 2, 3]) {
        const spr = this.decodeFrameRaw(
          `images/ui/legacy/misc/charanibig${layerNum}${g}${c}.spr`,
          wrappedIdx
        );
        if (spr && spr.w > 0 && spr.h > 0) {
          blitAnchored(rgba, CW, CH, spr, ax, ay);
          drewAny = true;
        }
      }
      if (!drewAny) return null;
      const png = encodeRgbaToPng(CW, CH, rgba, true);
      const res = { png, w: CW, h: CH, ox: 180, oy: 220 };
      if (this.spritePngCache.size > 2500) {
        const fk = this.spritePngCache.keys().next().value;
        if (fk) this.spritePngCache.delete(fk);
      }
      this.spritePngCache.set(cacheKey, res);
      return res;
    }

    // PutTestAnimation2 (SmallMenu.cpp:313140) - Small 3D Pre-rendered Character Showcase for MN_MAKECHARACTER
    if (lowerPath.startsWith('charanismall/')) {
      const parts = lowerPath.split('/');
      const g = Math.max(0, Math.min(1, Number(parts[1]) || 0));
      const c = Math.max(0, Math.min(4, Number(parts[2]) || 0));
      const gabX2 = [
        [-12, -20, 3, -15, -14],
        [149, 148, 149, -16, -25]
      ];
      const gabY2 = [
        [68, 39, 38, 32, 73],
        [163, 164, 154, 27, 34]
      ];
      const sprPath = `images/ui/legacy/misc/charanismall${g}${c}.spr`;
      const sprBuf = this.readEntry(sprPath);
      if (!sprBuf) return null;
      const offsets = this.getContainerFrameOffsets(sprBuf);
      if (offsets.length === 0) return null;
      const wrappedIdx = ((frameIdx % offsets.length) + offsets.length) % offsets.length;
      const spr = this.decodeFrameRaw(sprPath, wrappedIdx);
      if (!spr) return null;

      const CW = 200;
      const CH = 220;
      const ax = 100 + gabX2[g][c];
      const ay = 110 + gabY2[g][c];
      const rgba = new Uint8Array(CW * CH * 4);
      blitAnchored(rgba, CW, CH, spr, ax, ay);
      const png = encodeRgbaToPng(CW, CH, rgba, true);
      const res = { png, w: CW, h: CH, ox: 100, oy: 110 };
      if (this.spritePngCache.size > 2500) {
        const fk = this.spritePngCache.keys().next().value;
        if (fk) this.spritePngCache.delete(fk);
      }
      this.spritePngCache.set(cacheKey, res);
      return res;
    }

    if (isCompositePlayer) {
      const isFemale = lowerPath === 'player/female';
      const dir = Math.floor(frameIdx / 75);
      const baseFolder = isFemale
        ? 'images/characters/player/legacy/female'
        : 'images/characters/player/legacy/male';

      const layers = isFemale
        ? dir >= 4 && dir <= 6
          ? ['000087.spr', '000061.spr', '000000.spr', '000001.spr', '000042.spr']
          : ['000000.spr', '000001.spr', '000042.spr', '000061.spr', '000087.spr']
        : dir >= 4 && dir <= 6
        ? ['001087.spr', '001061.spr', '001000.spr', '001001.spr', '001002.spr', '001042.spr']
        : ['001000.spr', '001001.spr', '001002.spr', '001042.spr', '001061.spr', '001087.spr'];

      const rgba = new Uint8Array(ANW * ANH * 4);
      let drewAny = false;
      for (const file of layers) {
        const spr = this.decodeFrameRaw(`${baseFolder}/${file}`, frameIdx);
        if (spr) {
          blitAnchored(rgba, ANW, ANH, spr, ANX, ANY);
          drewAny = true;
        }
      }
      if (!drewAny) return null;
      const png = encodeRgbaToPng(ANW, ANH, rgba, true);
      const res = { png, w: ANW, h: ANH, ox: ANX, oy: ANY };
      if (this.spritePngCache.size > 2500) {
        const fk = this.spritePngCache.keys().next().value;
        if (fk) this.spritePngCache.delete(fk);
      }
      this.spritePngCache.set(cacheKey, res);
      return res;
    }

    const decoded = this.decodeFrameRaw(entryPath, frameIdx);
    if (!decoded) return null;

    if (useAnchor) {
      const rgba = new Uint8Array(ANW * ANH * 4);
      const isSealstone =
        lowerPath.endsWith('/091000.spr') ||
        lowerPath.endsWith('/098000.spr') ||
        lowerPath.endsWith('/099000.spr');
      if (isSealstone && frameIdx > 0) {
        const baseStone = this.decodeFrameRaw(entryPath, 0);
        if (baseStone) {
          blitAnchored(rgba, ANW, ANH, baseStone, ANX, ANY);
        }
      }
      blitAnchored(rgba, ANW, ANH, decoded, ANX, ANY);
      const png = encodeRgbaToPng(ANW, ANH, rgba, true);
      const res = { png, w: ANW, h: ANH, ox: ANX, oy: ANY };
      if (this.spritePngCache.size > 2500) {
        const fk = this.spritePngCache.keys().next().value;
        if (fk) this.spritePngCache.delete(fk);
      }
      this.spritePngCache.set(cacheKey, res);
      return res;
    }

    const png = encodeRgbaToPng(decoded.w, decoded.h, decoded.rgba, true);
    const res = { png, w: decoded.w, h: decoded.h, ox: decoded.ox, oy: decoded.oy };
    if (this.spritePngCache.size > 2500) {
      const fk = this.spritePngCache.keys().next().value;
      if (fk) this.spritePngCache.delete(fk);
    }
    this.spritePngCache.set(cacheKey, res);
    return res;
  }

  public getObjectPng(objectId: number): { png: Buffer; w: number; h: number; ox: number; oy: number } | null {
    this.ensureInitialized();
    const pathKey = this.objectById.get(objectId);
    if (!pathKey) return null;
    return this.getSpritePng(pathKey, 0);
  }

  public getSprMetadata(entryPath: string): {
    count: number;
    frames: Array<{ idx: number; w: number; h: number; ox: number; oy: number }>;
  } | null {
    const buf = this.readEntry(entryPath);
    if (!buf) return null;
    const offsets = this.getContainerFrameOffsets(buf);
    const frames: Array<{ idx: number; w: number; h: number; ox: number; oy: number }> = [];
    for (let i = 0; i < offsets.length; i++) {
      const off = offsets[i];
      if (off > 0 && off + 16 <= buf.length) {
        const w = buf.readUInt16LE(off + 4);
        const h = buf.readUInt16LE(off + 6);
        const ox = buf.readInt16LE(off + 8);
        const oy = buf.readInt16LE(off + 10);
        if (w > 0 && h > 0 && w < 2048 && h < 2048) {
          frames.push({ idx: i, w, h, ox, oy });
        }
      }
    }
    return { count: offsets.length, frames };
  }

  public buildMapBundle(mapName: string): { json: string; atlasPng: Buffer } | null {
    const key = mapName.toUpperCase();
    const cached = this.mapBundleCache.get(key);
    if (cached) return cached;

    const mapBuf = this.readEntry(`maps/${mapName}/${mapName}.map`);
    if (!mapBuf || mapBuf.length < 10) return null;

    const width = mapBuf.readUInt16LE(2);
    const height = mapBuf.readUInt16LE(4);
    const cellCount = width * height;

    // 1. Parse .sou2 if present, otherwise map directly to the map's default .sou sheet
    const sou2Buf = this.readEntry(`maps/${mapName}/${mapName}.sou2`);
    const sou2Map = new Map<number, { sheetName: string; tileIdx: number }>();

    if (sou2Buf && sou2Buf.length >= 18) {
      const count = sou2Buf.readUInt32LE(4);
      for (let i = 0; i < count; i++) {
        const pos = 14 + i * 4;
        if (pos + 4 > sou2Buf.length) break;
        const tileIdx = sou2Buf.readUInt16LE(pos);
        const sheetId = sou2Buf.readInt16LE(pos + 2);
        if (tileIdx <= 3599 && sheetId >= 1 && sheetId <= 11) {
          sou2Map.set(i, {
            sheetName: TILESHEET_NAMES[sheetId - 1],
            tileIdx
          });
        }
      }
    } else {
      const fallbackSheet =
        TILESHEET_NAMES.find((s) => s.toLowerCase() === mapName.toLowerCase()) || 'SOURCE';
      for (let i = 0; i < 3600; i++) {
        sou2Map.set(i, { sheetName: fallbackSheet, tileIdx: i });
      }
    }

    // 2. Extract cells (back, front, roof, flags) and collect used sou2 tile IDs
    const gridWords = new Uint16Array(cellCount * 4);
    const usedSou2Ids = new Set<number>();
    let sumX = 0;
    let sumY = 0;
    let sumCount = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cellIdx = y * width + x;
        const off = 6 + cellIdx * 8;
        if (off + 8 > mapBuf.length) break;
        const d0 = mapBuf.readUInt32LE(off);
        const d1 = mapBuf.readUInt32LE(off + 4);

        const back = d0 & 0x0fff;
        const front = (d0 >>> 12) & 0x0fff;
        const roof = d1 & 0x0fff;
        // Exact Dragon Raja TILE bitfields from Mapserver/HigherLayers/Map.h:
        // d0 & 0x04000000 = attr_dont (ONLY collision bit! d1 & 0x04000000 is attr_light!)
        // d0 & 0x08000000 = attr_map (portal / event trigger)
        // d0 & 0x30000000 = attr_room (room / roof fade trigger)
        // d1 & 0x00001000 = show_roof
        // d1 & 0x08000000 = attr_inside (interior floor under roof)
        // d1 & 0x40000000 = attr_no_battle (safe zone)
        const blocked = back === 0 || (d0 & 0x04000000) !== 0 ? 1 : 0;
        const showRoof =
          (d0 & 0x30000000) !== 0 || (d1 & 0x08000000) !== 0 || (d1 & 0x1000) !== 0 || roof > 0
            ? 2
            : 0;
        const noBattle = (d1 & 0x40000000) !== 0 ? 4 : 0;
        const attrMap = (d0 & 0x08000000) !== 0 ? 8 : 0;

        const wIdx = cellIdx * 4;
        gridWords[wIdx] = back;
        gridWords[wIdx + 1] = front;
        gridWords[wIdx + 2] = roof;
        gridWords[wIdx + 3] = blocked | showRoof | noBattle | attrMap;

        if (back > 0) usedSou2Ids.add(back);
        if (front > 0) usedSou2Ids.add(front);
        if (roof > 0) usedSou2Ids.add(roof);

        if (front > 0 || roof > 0) {
          sumX += x;
          sumY += y;
          sumCount++;
        }
      }
    }

    const centerX = sumCount > 0 ? Math.round(sumX / sumCount) : Math.floor(width / 2);
    const centerY = sumCount > 0 ? Math.round(sumY / sumCount) : Math.floor(height / 2);

    // 3. Decode all used tiles from .sou files and pack into a 2048xN shelf atlas
    const decodedTiles = new Map<number, DecodedSprite>();
    const souBuffers = new Map<string, { buf: Buffer; offsets: number[] }>();

    for (const sou2Id of usedSou2Ids) {
      const mapping = sou2Map.get(sou2Id);
      if (!mapping) continue;
      let sheetObj = souBuffers.get(mapping.sheetName);
      if (!sheetObj) {
        const sb = this.readEntry(`images/tilesheets/${mapping.sheetName}.sou`);
        if (sb) {
          sheetObj = { buf: sb, offsets: this.getContainerFrameOffsets(sb) };
          souBuffers.set(mapping.sheetName, sheetObj);
        }
      }
      if (!sheetObj) continue;
      const sprOff = sheetObj.offsets[mapping.tileIdx];
      if (sprOff && sprOff + 8 <= sheetObj.buf.length) {
        const spr = decodeCspOrSouChunk(sheetObj.buf, sprOff + 4);
        if (spr) {
          decodedTiles.set(sou2Id, spr);
        }
      }
    }

    // Shelf-pack all decodedTiles into an atlas of width 2048
    const atlasW = 2048;
    let curX = 0;
    let curY = 0;
    let rowH = 0;
    const atlasRects: Record<
      number,
      { u: number; v: number; w: number; h: number; ox: number; oy: number; raw32: number }
    > = {};

    // Sort by height ascending so 32x32 tiles pack tightly at the top
    const sortedIds = [...decodedTiles.keys()].sort(
      (a, b) => decodedTiles.get(a)!.h - decodedTiles.get(b)!.h
    );

    for (const id of sortedIds) {
      const spr = decodedTiles.get(id)!;
      if (curX + spr.w > atlasW) {
        curX = 0;
        curY += rowH + 1;
        rowH = 0;
      }
      atlasRects[id] = {
        u: curX,
        v: curY,
        w: spr.w,
        h: spr.h,
        ox: spr.ox,
        oy: spr.oy,
        raw32: spr.isRaw32 ? 1 : 0
      };
      curX += spr.w + 1;
      if (spr.h > rowH) rowH = spr.h;
    }

    const atlasH = Math.max(64, curY + rowH + 2);
    const atlasRgba = new Uint8Array(atlasW * atlasH * 4);

    for (const id of sortedIds) {
      const spr = decodedTiles.get(id)!;
      const rect = atlasRects[id];
      for (let sy = 0; sy < spr.h; sy++) {
        const srcRow = sy * spr.w * 4;
        const dstRow = ((rect.v + sy) * atlasW + rect.u) * 4;
        atlasRgba.set(spr.rgba.subarray(srcRow, srcRow + spr.w * 4), dstRow);
      }
    }

    const atlasPng = encodeRgbaToPng(atlasW, atlasH, atlasRgba, true);

    // 4. Parse .toi2 map objects with exact .csp anchor offsets (sprOx, sprOy)
    const toi2Buf = this.readEntry(`maps/${mapName}/${mapName}.toi2`);
    const objects: Array<{
      id: number;
      x: number;
      y: number;
      ox: number;
      oy: number;
      sprOx: number;
      sprOy: number;
    }> = [];
    if (toi2Buf && toi2Buf.length >= 6) {
      const objCount = toi2Buf.readUInt16LE(2);
      const base = 6 + objCount * 4;
      const objAnchorCache = new Map<number, { sprOx: number; sprOy: number }>();

      for (let i = 0; i < objCount; i++) {
        const recOff = base + i * 132;
        if (recOff + 132 > toi2Buf.length) break;
        const id = toi2Buf.readUInt16LE(recOff);
        const x = toi2Buf.readUInt32LE(recOff + 12);
        const y = toi2Buf.readUInt32LE(recOff + 16);
        const ox = toi2Buf.readInt32LE(recOff + 28);
        const oy = toi2Buf.readInt32LE(recOff + 32);
        if (id > 0 && x > 0 && y > 0 && x < width * 32 && y < height * 32 && this.objectById.has(id)) {
          let anc = objAnchorCache.get(id);
          if (!anc) {
            const pathKey = this.objectById.get(id)!;
            const cBuf = this.readEntry(pathKey);
            if (cBuf && cBuf.length >= 12) {
              const wRaw = cBuf.readUInt16LE(0);
              anc =
                wRaw === 0xffff
                  ? { sprOx: 16, sprOy: 32 }
                  : { sprOx: cBuf.readInt16LE(4), sprOy: cBuf.readInt16LE(6) };
            } else {
              anc = { sprOx: 16, sprOy: 32 };
            }
            objAnchorCache.set(id, anc);
          }
          objects.push({ id, x, y, ox, oy, sprOx: anc.sprOx, sprOy: anc.sprOy });
        }
      }
    }

    // 5. Parse .skb (LoadSkillMapTable from Mapserver/HigherLayers/Skill.cpp & LegacySkillMap.h)
    // Each record is 40 bytes: int32 type, x, y, skillno, tileRange, probability, typeNum, subType, uint32 prev, next
    // skillno == 6 (TOOL_NPC_GENER): NPCGeneratePosition(typeNum, x, y, probability, tileRange)
    // skillno == 1..5: Farming(1), Mining(2), Fishing(3), Lumberjacking(4), Herb-Digging(5)
    const skbBuf = this.readEntry(`maps/${mapName}/${mapName}.skb`);
    const skbSpawns: Array<{
      x: number;
      y: number;
      npcIndex: number;
      eventNo: number;
      maxNo: number;
    }> = [];
    const skbSkills: Array<{
      x: number;
      y: number;
      skillno: number;
      tileRange: number;
      probability: number;
    }> = [];

    if (skbBuf && skbBuf.length >= 40) {
      const recCount = Math.floor(skbBuf.length / 40);
      for (let i = 0; i < recCount; i++) {
        const baseOff = i * 40;
        const x = skbBuf.readInt32LE(baseOff + 4);
        const y = skbBuf.readInt32LE(baseOff + 8);
        const skillno = skbBuf.readInt32LE(baseOff + 12);
        const tileRange = skbBuf.readInt32LE(baseOff + 16);
        const probability = skbBuf.readInt32LE(baseOff + 20);
        const typeNum = skbBuf.readInt32LE(baseOff + 24);
        if (x <= 0 || y <= 0 || x >= width || y >= height) continue;
        if (skillno === 6 && typeNum > 0) {
          skbSpawns.push({
            x,
            y,
            npcIndex: typeNum,
            eventNo: probability,
            maxNo: Math.max(1, tileRange)
          });
        } else if (skillno >= 1 && skillno <= 5) {
          skbSkills.push({
            x,
            y,
            skillno,
            tileRange,
            probability
          });
        }
      }
    }

    const gridBytes = Buffer.from(gridWords.buffer, gridWords.byteOffset, gridWords.byteLength);
    const payload = {
      mapName,
      width,
      height,
      centerX,
      centerY,
      atlasW,
      atlasH,
      atlasRects,
      objects,
      skbSpawns,
      skbSkills,
      gridBase64: gridBytes.toString('base64')
    };

    const bundle = {
      json: JSON.stringify(payload),
      atlasPng
    };
    this.mapBundleCache.set(key, bundle);
    return bundle;
  }
}

export const data0Manager = new Data0ArchiveManager();
export const wasmNetServer = new WasmNetServer(data0Manager);

export function createData0Middleware() {
  return (req: any, res: any, next: () => void) => {
    if (
      !req.url ||
      (!req.url.startsWith('/api/data0/') &&
        !req.url.startsWith('/api/wasm-net') &&
        !req.url.startsWith('/api/auth/'))
    ) {
      return next();
    }

    // Allow cross-origin requests from GitHub Pages (https://advancedchile.github.io)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      const pathname = parsedUrl.pathname;

      // 0. Web Portal Account Registration & Login API (backed by Firebase RTDB via wasmNetServer)
      if (pathname.startsWith('/api/auth/')) {
        if (pathname === '/api/auth/stats' && req.method === 'GET') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify(wasmNetServer.getPortalStats()));
          return;
        }
        if ((pathname === '/api/auth/register' || pathname === '/api/auth/login') && req.method === 'POST') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
          req.on('end', () => {
            try {
              const raw = Buffer.concat(chunks).toString('utf8');
              const body = raw ? JSON.parse(raw) : {};
              const result =
                pathname === '/api/auth/register'
                  ? wasmNetServer.registerAccount(body.username, body.email, body.password)
                  : wasmNetServer.loginAccount(body.username, body.password);
              res.statusCode = result.ok ? 200 : 400;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Cache-Control', 'no-store');
              res.end(JSON.stringify(result));
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'INVALID_JSON' }));
            }
          });
          return;
        }
        res.statusCode = 404;
        res.end();
        return;
      }

      // 0a. WebAssembly C++ Client Network Socket Bridge: /api/wasm-net
      if (pathname === '/api/wasm-net') {
        const op = parsedUrl.searchParams.get('op') || 'poll';
        const port = Number(parsedUrl.searchParams.get('port') || '9001');
        if (op === 'connect') {
          const out = wasmNetServer.handleConnect(port);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/octet-stream');
          res.setHeader('Cache-Control', 'no-store');
          res.end(out);
          return;
        }
        if (op === 'poll') {
          const out = wasmNetServer.handlePoll();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/octet-stream');
          res.setHeader('Cache-Control', 'no-store');
          res.end(out);
          return;
        }
        if (op === 'send') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
          req.on('end', () => {
            try {
              const body = chunks.length > 0 ? Buffer.concat(chunks) : Buffer.alloc(0);
              const out = wasmNetServer.handleSend(body);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/octet-stream');
              res.setHeader('Cache-Control', 'no-store');
              res.end(out);
            } catch (sendErr) {
              console.error('[wasm-net] handleSend error:', sendErr);
              res.statusCode = 500;
              res.end(Buffer.alloc(0));
            }
          });
          return;
        }
        res.statusCode = 200;
        res.end(Buffer.alloc(0));
        return;
      }

      // 0b. Raw Client File Stream for WebAssembly C++ Engine: /api/data0/raw?path=./data/NewStartLoginMenu.dat
      if (pathname === '/api/data0/raw') {
        const reqPath = parsedUrl.searchParams.get('path') || '';
        const sendRaw = (buf: Buffer | null) => {
          if (!buf) {
            res.statusCode = 204;
            res.end();
            return;
          }
          const isWav = reqPath.toLowerCase().endsWith('.wav');
          res.statusCode = 200;
          res.setHeader('Content-Type', isWav ? 'audio/wav' : 'application/octet-stream');
          res.setHeader('Content-Length', String(buf.length));
          res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
          res.end(buf);
        };
        if (data0Manager.isRemoteMode()) {
          data0Manager
            .resolveRawClientFileAsync(reqPath)
            .then(sendRaw)
            .catch(() => {
              res.statusCode = 502;
              res.end('Remote data0 fetch error');
            });
          return;
        }
        sendRaw(data0Manager.resolveRawClientFile(reqPath));
        return;
      }

      // 1. Audio stream: /api/data0/sound/0001.wav (supports HTTP Range for <audio> looping/seeking)
      if (pathname.startsWith('/api/data0/sound/')) {
        const wavFile = pathname.replace('/api/data0/sound/', '').replace(/[^a-zA-Z0-9_.-]/g, '');
        const buf = data0Manager.readEntry(`sound/legacy/${wavFile}`);
        if (!buf) {
          res.statusCode = 404;
          res.end('Sound not found');
          return;
        }
        const total = buf.length;
        const rangeHeader = req.headers?.range as string | undefined;
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

        if (rangeHeader && rangeHeader.startsWith('bytes=')) {
          const parts = rangeHeader.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10) || 0;
          const end = parts[1] ? Math.min(total - 1, parseInt(parts[1], 10)) : total - 1;
          if (start >= 0 && start < total && end >= start) {
            const chunk = buf.subarray(start, end + 1);
            res.statusCode = 206;
            res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
            res.setHeader('Content-Length', String(chunk.length));
            res.end(chunk);
            return;
          }
        }

        res.statusCode = 200;
        res.setHeader('Content-Length', String(total));
        res.end(buf);
        return;
      }

      // 2. Map JSON data: /api/data0/map/RENES_C
      if (pathname.startsWith('/api/data0/map/')) {
        const mapName = pathname.replace('/api/data0/map/', '').replace(/[^a-zA-Z0-9_-]/g, '');
        const bundle = data0Manager.buildMapBundle(mapName);
        if (!bundle) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: `Map ${mapName} not found` }));
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(bundle.json);
        return;
      }

      // 3. Map Tile Atlas PNG: /api/data0/map-atlas/RENES_C.png
      if (pathname.startsWith('/api/data0/map-atlas/')) {
        const mapName = pathname
          .replace('/api/data0/map-atlas/', '')
          .replace(/\.png$/i, '')
          .replace(/[^a-zA-Z0-9_-]/g, '');
        const bundle = data0Manager.buildMapBundle(mapName);
        if (!bundle) {
          res.statusCode = 404;
          res.end('Map atlas not found');
          return;
        }
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.end(bundle.atlasPng);
        return;
      }

      // 4. Map Object .csp PNG: /api/data0/object/2
      if (pathname.startsWith('/api/data0/object/')) {
        const objId = Number(pathname.replace('/api/data0/object/', '').replace(/\.png$/i, ''));
        const spr = data0Manager.getObjectPng(objId);
        if (!spr) {
          res.statusCode = 404;
          res.end('Object not found');
          return;
        }
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('X-Sprite-W', String(spr.w));
        res.setHeader('X-Sprite-H', String(spr.h));
        res.setHeader('X-Sprite-OX', String(spr.ox));
        res.setHeader('X-Sprite-OY', String(spr.oy));
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.end(spr.png);
        return;
      }

      // 5. Sprite container metadata: /api/data0/spr-meta?path=images/characters/player/legacy/male/001000.spr
      if (pathname === '/api/data0/spr-meta') {
        const entryPath = parsedUrl.searchParams.get('path') || '';
        const meta = data0Manager.getSprMetadata(entryPath);
        if (!meta) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Sprite container not found' }));
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.end(JSON.stringify(meta));
        return;
      }

      // 6. Single Sprite Frame PNG: /api/data0/sprite?path=...&frame=0&idx=0&anchor=1
      if (pathname === '/api/data0/sprite') {
        const entryPath = parsedUrl.searchParams.get('path') || '';
        const idxParam =
          parsedUrl.searchParams.get('frame') ??
          parsedUrl.searchParams.get('idx') ??
          '0';
        const idx = Number(idxParam);
        const anchor = parsedUrl.searchParams.get('anchor') === '1';
        const spr = data0Manager.getSpritePng(entryPath, idx, anchor);
        if (!spr) {
          res.statusCode = 404;
          res.end('Sprite frame not found');
          return;
        }
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('X-Sprite-W', String(spr.w));
        res.setHeader('X-Sprite-H', String(spr.h));
        res.setHeader('X-Sprite-OX', String(spr.ox));
        res.setHeader('X-Sprite-OY', String(spr.oy));
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.end(spr.png);
        return;
      }

      return next();
    } catch (err) {
      res.statusCode = 500;
      res.end(String(err));
    }
  };
}

export function dragonRajaData0Plugin(): Plugin {
  const middleware = createData0Middleware();
  return {
    name: 'dragon-raja-data0-stream',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    }
  };
}
