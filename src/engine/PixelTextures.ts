import * as THREE from 'three';

export class PixelTextureBank {
  private cache = new Map<string, THREE.CanvasTexture>();

  private createPixelCanvas(
    key: string,
    size: number,
    drawFn: (ctx: CanvasRenderingContext2D, size: number) => void,
    repeatX = 1,
    repeatY = 1
  ): THREE.CanvasTexture {
    const cacheKey = `${key}_${repeatX}_${repeatY}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    if (repeatX > 1 || repeatY > 1) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeatX, repeatY);
    }

    this.cache.set(cacheKey, tex);
    return tex;
  }

  public getBiomeGroundTexture(biome: string, repeat = 24): THREE.CanvasTexture {
    return this.createPixelCanvas(
      `ground_${biome}`,
      16,
      (ctx, s) => {
        if (biome === 'grassland') {
          ctx.fillStyle = '#2d5a27';
          ctx.fillRect(0, 0, s, s);
          const shades = ['#36692f', '#24491f', '#3f7736', '#4c853e'];
          for (let y = 0; y < s; y++) {
            for (let x = 0; x < s; x++) {
              const h = (x * 13 + y * 29) % 11;
              if (h < 4) {
                ctx.fillStyle = shades[h];
                ctx.fillRect(x, y, 1, 1);
              }
            }
          }
          // Tiny pixel wildflowers
          ctx.fillStyle = '#eab308';
          ctx.fillRect(3, 5, 1, 1);
          ctx.fillStyle = '#93c5fd';
          ctx.fillRect(11, 12, 1, 1);
        } else if (biome === 'snow') {
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(0, 0, s, s);
          const shades = ['#e2e8f0', '#94a3b8', '#f8fafc', '#bfdbfe'];
          for (let y = 0; y < s; y++) {
            for (let x = 0; x < s; x++) {
              const h = (x * 17 + y * 23) % 9;
              if (h < 4) {
                ctx.fillStyle = shades[h];
                ctx.fillRect(x, y, 1, 1);
              }
            }
          }
        } else if (biome === 'desert') {
          ctx.fillStyle = '#b4833e';
          ctx.fillRect(0, 0, s, s);
          const shades = ['#c8964e', '#9c6d2c', '#d6a55c', '#85581f'];
          for (let y = 0; y < s; y++) {
            for (let x = 0; x < s; x++) {
              const h = (x * 19 + y * 7) % 8;
              if (h < 4) {
                ctx.fillStyle = shades[h];
                ctx.fillRect(x, y, 1, 1);
              }
            }
          }
        } else if (biome === 'dungeon_fire') {
          ctx.fillStyle = '#231618';
          ctx.fillRect(0, 0, s, s);
          for (let y = 0; y < s; y++) {
            for (let x = 0; x < s; x++) {
              const h = (x * 23 + y * 31) % 13;
              if (h === 0) {
                ctx.fillStyle = '#ea580c';
                ctx.fillRect(x, y, 1, 1);
              } else if (h < 4) {
                ctx.fillStyle = '#331f22';
                ctx.fillRect(x, y, 1, 1);
              }
            }
          }
        } else if (biome === 'battlefield') {
          ctx.fillStyle = '#3b332b';
          ctx.fillRect(0, 0, s, s);
          const shades = ['#4a4036', '#2b251f', '#57493d', '#6e2620'];
          for (let y = 0; y < s; y++) {
            for (let x = 0; x < s; x++) {
              const h = (x * 15 + y * 19) % 10;
              if (h < 4) {
                ctx.fillStyle = shades[h];
                ctx.fillRect(x, y, 1, 1);
              }
            }
          }
        } else {
          // Arena marble stone
          ctx.fillStyle = '#57534e';
          ctx.fillRect(0, 0, s, s);
          ctx.strokeStyle = '#44403c';
          ctx.strokeRect(0, 0, s, s);
          ctx.fillStyle = '#78716c';
          ctx.fillRect(2, 2, 5, 5);
          ctx.fillRect(9, 9, 5, 5);
        }
      },
      repeat,
      repeat
    );
  }

  public getCobbleRoadTexture(repeatX = 8, repeatY = 8): THREE.CanvasTexture {
    return this.createPixelCanvas(
      'cobble_road',
      16,
      (ctx, s) => {
        ctx.fillStyle = '#44403c';
        ctx.fillRect(0, 0, s, s);
        const stones = [
          [1, 1, 6, 6, '#645d56'],
          [8, 1, 7, 5, '#57534e'],
          [1, 8, 7, 7, '#57534e'],
          [9, 7, 6, 8, '#716a62']
        ] as const;
        for (const [x, y, w, h, col] of stones) {
          ctx.fillStyle = col;
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = '#78716c';
          ctx.fillRect(x, y, w - 1, 1);
        }
      },
      repeatX,
      repeatY
    );
  }

  public getWaterTexture(repeatX = 8, repeatY = 8): THREE.CanvasTexture {
    return this.createPixelCanvas(
      'water_tile',
      16,
      (ctx, s) => {
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(0, 0, s, s);
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(0, 3, s, 3);
        ctx.fillRect(0, 10, s, 3);
        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(2, 4, 4, 1);
        ctx.fillRect(9, 11, 5, 1);
      },
      repeatX,
      repeatY
    );
  }

  public getWallTexture(style: string): THREE.CanvasTexture {
    return this.createPixelCanvas(
      `wall_${style}`,
      16,
      (ctx, s) => {
        if (style === 'timber') {
          ctx.fillStyle = '#d6c5a3';
          ctx.fillRect(0, 0, s, s);
          ctx.fillStyle = '#5c3a21';
          ctx.fillRect(0, 0, s, 2);
          ctx.fillRect(0, 14, s, 2);
          ctx.fillRect(0, 0, 2, s);
          ctx.fillRect(14, 0, 2, s);
          ctx.fillRect(7, 0, 2, s);
        } else if (style === 'temple') {
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(0, 0, s, s);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(0, 7, s, 1);
          ctx.fillRect(7, 0, 1, s);
          ctx.fillStyle = '#eab308';
          ctx.fillRect(3, 3, 2, 10);
          ctx.fillRect(11, 3, 2, 10);
        } else if (style === 'dark_brick') {
          ctx.fillStyle = '#27171a';
          ctx.fillRect(0, 0, s, s);
          ctx.fillStyle = '#451a1c';
          ctx.fillRect(1, 1, 6, 6);
          ctx.fillRect(8, 1, 7, 6);
          ctx.fillRect(1, 8, 14, 6);
        } else {
          // Stone / Castle
          ctx.fillStyle = '#57534e';
          ctx.fillRect(0, 0, s, s);
          ctx.fillStyle = '#78716c';
          ctx.fillRect(1, 1, 6, 3);
          ctx.fillRect(8, 1, 7, 3);
          ctx.fillRect(0, 5, 4, 3);
          ctx.fillRect(5, 5, 6, 3);
          ctx.fillRect(12, 5, 4, 3);
          ctx.fillRect(1, 9, 7, 3);
          ctx.fillRect(9, 9, 6, 3);
          ctx.fillRect(0, 13, 6, 3);
          ctx.fillRect(7, 13, 8, 3);
        }
      },
      2,
      2
    );
  }

  public getRoofTexture(style: string): THREE.CanvasTexture {
    return this.createPixelCanvas(
      `roof_${style}`,
      16,
      (ctx, s) => {
        const baseMap: Record<string, [string, string, string]> = {
          red_tile: ['#991b1b', '#b91c1c', '#7f1d1d'],
          blue_slate: ['#1e3a8a', '#2563eb', '#172554'],
          thatch: ['#a16207', '#ca8a04', '#713f12'],
          gold_dome: ['#b45309', '#f59e0b', '#78350f'],
          obsidian: ['#18181b', '#3f3f46', '#09090b']
        };
        const [c1, c2, c3] = baseMap[style] || baseMap.red_tile;
        ctx.fillStyle = c1;
        ctx.fillRect(0, 0, s, s);
        for (let y = 0; y < s; y += 4) {
          ctx.fillStyle = c3;
          ctx.fillRect(0, y + 3, s, 1);
          for (let x = (y % 8 === 0 ? 0 : 2); x < s; x += 4) {
            ctx.fillStyle = c2;
            ctx.fillRect(x, y, 3, 2);
          }
        }
      },
      3,
      3
    );
  }
}

export const pixelTextures = new PixelTextureBank();
