import originalSqlDb from '../data/originalSqlDatabase.json';

/**
 * Exact Dragon Raja Original Audio Engine (`directsound.cpp`, `Menu.h`, `gameproc.cpp`, `CharDataTable.cpp`).
 * Streams and decodes original PCM `.wav` files directly from `data0` (`sound/legacy/*.wav`).
 */
export class OriginalSoundEngine {
  public enabled = true;
  public musicVolume = 0.45;
  public sfxVolume = 0.70;

  private audioCtx: AudioContext | null = null;
  private sfxBufferCache = new Map<string, AudioBuffer>();
  private sfxLoadingPromises = new Map<string, Promise<AudioBuffer | null>>();

  private bgmAudio: HTMLAudioElement | null = null;
  private currentBgmFile = '';
  private unlockBound = false;

  constructor() {
    this.installAutoplayUnlock();
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (Ctx) {
        this.audioCtx = new Ctx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  private installAutoplayUnlock(): void {
    if (typeof window === 'undefined' || this.unlockBound) return;
    this.unlockBound = true;
    const unlock = () => {
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if (this.enabled && this.bgmAudio && this.bgmAudio.paused && this.currentBgmFile) {
        this.bgmAudio.volume = this.musicVolume;
        this.bgmAudio.play().catch(() => {});
      }
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('mousedown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  public playBgm(wavFile: string): void {
    if (!this.enabled) {
      this.stopBgm();
      return;
    }
    if (this.currentBgmFile === wavFile && this.bgmAudio && !this.bgmAudio.paused) {
      return;
    }
    if (this.currentBgmFile === wavFile && this.bgmAudio && this.bgmAudio.paused) {
      this.bgmAudio.volume = this.musicVolume;
      this.bgmAudio.play().catch(() => {});
      return;
    }
    this.stopBgm();
    this.currentBgmFile = wavFile;
    const audio = new Audio(`/api/data0/sound/${wavFile}`);
    audio.preload = 'auto';
    audio.loop = true;
    audio.volume = this.musicVolume;
    this.bgmAudio = audio;
    audio.play().catch(() => {
      // Will automatically resume on first pointerdown/keydown via installAutoplayUnlock
    });
  }

  /**
   * Exact Map BGM mapping from `Client/Debug/gameproc.cpp:4862` (`nMapBGM`) and `Menu.h` (`SN_START = 1`).
   */
  public playBgmForMap(mapId: string): void {
    const upper = mapId.toUpperCase();
    if (upper === 'LOGIN' || upper === 'CHAR_SELECT' || upper === 'CHAR_CREATE') {
      this.playBgm('0001.wav'); // SN_START = 1
    } else if (upper === 'MA-IN' || upper === 'RENES_C' || upper === 'BARANTAN') {
      this.playBgm('0003.wav'); // gameproc.cpp: case 0 (ma-in), case 19 (renes_c), case 62 (barantan) -> nMapBGM = 3
    } else if (upper === 'K_SUNG2' || upper === 'SCHOLIUM') {
      this.playBgm('0006.wav'); // gameproc.cpp: case 1 (k_sung2) -> nMapBGM = 6
    } else if (upper === 'FIREDUN1') {
      this.playBgm('0002.wav'); // gameproc.cpp: case 2 (firedun1) -> nMapBGM = 2
    } else if (upper === 'ICE-W01') {
      this.playBgm('0005.wav'); // gameproc.cpp: case 3 (ice-w01) -> nMapBGM = 5
    } else if (upper === 'SEDLESS' || upper === 'HUDSON' || upper === 'HEGMONIA') {
      this.playBgm('0004.wav'); // gameproc.cpp: case 4 (sedless) -> nMapBGM = 4
    } else if (upper === 'MON_ARENA' || upper === 'G_BATTLE') {
      this.playBgm('0008.wav');
    } else {
      this.playBgm('0003.wav');
    }
  }

  public playMapBgm(mapId: string): void {
    this.playBgmForMap(mapId);
  }

  public playLoginTheme(): void {
    this.playBgm('0001.wav');
  }

  public stopBgm(): void {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
      this.bgmAudio = null;
    }
  }

  public setVolumes(musicVol: number, sfxVol: number): void {
    this.musicVolume = Math.max(0, Math.min(1, musicVol));
    this.sfxVolume = Math.max(0, Math.min(1, sfxVol));
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.musicVolume;
    }
  }

  private async loadAudioBuffer(wavFile: string): Promise<AudioBuffer | null> {
    const cached = this.sfxBufferCache.get(wavFile);
    if (cached) return cached;
    const inflight = this.sfxLoadingPromises.get(wavFile);
    if (inflight) return inflight;

    const promise = (async () => {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return null;
        const res = await fetch(`/api/data0/sound/${wavFile}`);
        if (!res.ok) return null;
        const arrayBuf = await res.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arrayBuf.slice(0));
        this.sfxBufferCache.set(wavFile, decoded);
        return decoded;
      } catch {
        return null;
      } finally {
        this.sfxLoadingPromises.delete(wavFile);
      }
    })();

    this.sfxLoadingPromises.set(wavFile, promise);
    return promise;
  }

  public playWavSfx(wavFile: string, volumeScale = 1.0): void {
    if (!this.enabled) return;
    const vol = Math.max(0, Math.min(1, this.sfxVolume * volumeScale));
    const ctx = this.getAudioContext();
    if (ctx) {
      const cached = this.sfxBufferCache.get(wavFile);
      if (cached) {
        try {
          const src = ctx.createBufferSource();
          src.buffer = cached;
          const gain = ctx.createGain();
          gain.gain.value = vol;
          src.connect(gain);
          gain.connect(ctx.destination);
          src.start(0);
          return;
        } catch {
          // Fall through to async load
        }
      }
      this.loadAudioBuffer(wavFile).then((buf) => {
        if (!buf || !this.enabled) return;
        try {
          const src = ctx.createBufferSource();
          src.buffer = buf;
          const gain = ctx.createGain();
          gain.gain.value = vol;
          src.connect(gain);
          gain.connect(ctx.destination);
          src.start(0);
        } catch {
          // Ignore
        }
      });
      return;
    }

    try {
      const audio = new Audio(`/api/data0/sound/${wavFile}`);
      audio.volume = vol;
      audio.play().catch(() => {});
    } catch {
      // Ignore
    }
  }

  private stepToggle = false;

  // Exact Menu.h SN_* constants:
  // SN_CLICK = 1212, SN_SELECT_START = 1211, SN_TOUCH_START = 1214
  public playClick(): void {
    this.playWavSfx('1212.wav', 0.85);
  }

  public playTouch(): void {
    this.playWavSfx('1214.wav', 0.65);
  }

  public playSelectStart(): void {
    this.playWavSfx('1211.wav', 0.85);
  }

  // SN_DICE = 1210
  public playDice(): void {
    this.playWavSfx('1210.wav', 0.85);
  }

  // SN_MENU_OPEN = 1216, SN_MENU_CLOSE = 1217
  public playMenuOpen(): void {
    this.playWavSfx('1216.wav', 0.85);
  }

  public playMenuClose(): void {
    this.playWavSfx('1217.wav', 0.85);
  }

  // SN_MAGIC_BOOK_OPEN = 1221, SN_MAGIC_BOOK_CLOSE = 1222, SN_BOOK_NEXT = 1224
  public playMagicBookOpen(): void {
    this.playWavSfx('1221.wav', 0.85);
  }

  public playMagicBookClose(): void {
    this.playWavSfx('1222.wav', 0.85);
  }

  // SN_FIGHT / SN_SKILL / SN_MAGIC = 1218
  public playModeToggle(): void {
    this.playWavSfx('1218.wav', 0.85);
  }

  // SN_WARNING = 1213
  public playWarning(): void {
    this.playWavSfx('1213.wav', 0.85);
  }

  // SN_GET_ITEM = 1206, SN_DROP_ITEM = 1207
  public playItemPickup(): void {
    this.playWavSfx('1206.wav', 0.85);
  }

  public playItemDrop(): void {
    this.playWavSfx('1207.wav', 0.85);
  }

  // SN_ITEM_BUY = 1236, SN_ITEM_SELL = 1237
  public playBuySell(isBuy = true): void {
    this.playWavSfx(isBuy ? '1236.wav' : '1237.wav', 0.85);
  }

  // SN_WEAPON = 1200, SN_SHIELD = 1201, SN_ARMOR = 1202, SN_HELMET = 1203, SN_NECK/UNIQ = 1204, SN_SHOES = 1205
  public playEquip(slot?: string): void {
    const s = (slot || '').toLowerCase();
    if (s.includes('shield')) {
      this.playWavSfx('1201.wav', 0.85);
    } else if (s.includes('armor') || s.includes('body')) {
      this.playWavSfx('1202.wav', 0.85);
    } else if (s.includes('helm') || s.includes('head')) {
      this.playWavSfx('1203.wav', 0.85);
    } else if (s.includes('neck') || s.includes('ring') || s.includes('amulet') || s.includes('cape')) {
      this.playWavSfx('1204.wav', 0.85);
    } else if (s.includes('shoe') || s.includes('boot')) {
      this.playWavSfx('1205.wav', 0.85);
    } else {
      this.playWavSfx('1200.wav', 0.85);
    }
  }

  // SN_LV_EACH_UP = 1233
  public playStatUp(): void {
    this.playWavSfx('1233.wav', 0.85);
  }

  // SN_LEARN_MAGIC / SN_LEARN_SKILL = 1232
  public playLearnSkill(): void {
    this.playWavSfx('1232.wav', 0.85);
  }

  // Footsteps from 000AniTable.bin / 001AniTable.bin: Walk (1027/1028), Run (1035/1036)
  public playStep(isRunning = false): void {
    this.stepToggle = !this.stepToggle;
    if (isRunning) {
      this.playWavSfx(this.stepToggle ? '1035.wav' : '1036.wav', 0.42);
    } else {
      this.playWavSfx(this.stepToggle ? '1027.wav' : '1028.wav', 0.38);
    }
  }

  /**
   * Exact combat attack sound from `CharDataTable.cpp:1380..1510`:
   * - `9999` (`ReturnPCAutoWave`): weapon swing `0205.wav`/`0206.wav` + weapon impact `1053.wav`/`1052.wav`
   * - `13820` (Male) -> `0820.wav`..`0822.wav`; `13800` (Female) -> `0800.wav`..`0802.wav`
   */
  public playHit(isCrit = false, gender: 'MALE' | 'FEMALE' = 'MALE'): void {
    this.playWavSfx(isCrit ? '0206.wav' : '0205.wav', 0.82);
    if (isCrit || Math.random() < 0.45) {
      const base = gender === 'FEMALE' ? 800 : 820;
      const idx = base + Math.floor(Math.random() * 3);
      this.playWavSfx(`${String(idx).padStart(4, '0')}.wav`, 0.72);
    }
    setTimeout(() => {
      this.playWavSfx(isCrit ? '1052.wav' : '1053.wav', isCrit ? 0.92 : 0.78);
    }, 85);
  }

  /**
   * Plays the exact monster hit (act 3) or death cry (act 4) from `data/animations/characters/npc/xxxAniTable.bin`.
   */
  public playEntityHitSound(sprNo: number, isFatal = false): void {
    const aniTable = (originalSqlDb as any).aniTable || {};
    const entry = aniTable[String(sprNo)];
    if (!entry) return;
    const waves: number[] = isFatal
      ? entry.dieWaves?.length
        ? entry.dieWaves
        : entry.hurtWaves || []
      : entry.hurtWaves || [];
    const valid = waves.find((w: number) => w > 0 && w < 5000);
    if (valid) {
      setTimeout(() => {
        this.playWavSfx(`${String(valid).padStart(4, '0')}.wav`, 0.78);
      }, 95);
    }
  }

  public playSpell(school = 'arcane'): void {
    this.playWavSfx('1218.wav', 0.72);
    if (school === 'fire' || school === 'meteor') {
      this.playWavSfx('0101.wav', 0.85);
    } else if (school === 'lightning') {
      this.playWavSfx('0102.wav', 0.85);
    } else if (school === 'holy' || school === 'heal') {
      this.playWavSfx('0104.wav', 0.85);
    } else {
      this.playWavSfx('0100.wav', 0.80);
    }
  }

  // SN_EAT_POTION = 1209, SN_EAT_BREAD = 1208
  public playPotion(): void {
    this.playWavSfx('1209.wav', 0.85);
  }

  public playEatBread(): void {
    this.playWavSfx('1208.wav', 0.85);
  }

  // SN_CONGRATULATIONS = 62 (0062.wav)
  public playLevelUp(): void {
    this.playWavSfx('0062.wav', 0.92);
  }

  // SN_ITEM_REPAR = 1231
  public playForge(success = true): void {
    this.playWavSfx(success ? '1231.wav' : '1213.wav', 0.85);
  }
}

export const originalSoundEngine = new OriginalSoundEngine();
