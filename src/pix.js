// 像素绘制原语：所有程序化像素资产（角色、家具、脏污、道具）共用
export const PAL = {
  wood: '#9B5B3C', woodDark: '#6E3C27', honey: '#F3B84B', cream: '#FFE6B0',
  ink: '#2A1A22', cyan: '#39D7D2', magenta: '#E45AD1', acid: '#8DDB4A',
  voidBg: '#15152F', star: '#3B3B6B', hi: '#FFF3A8', coral: '#FF6B5A',
  panel: '#241A26', panelEdge: '#4A3350', iron: '#5C5A6B', ironDark: '#33323F',
  stone: '#8A8A9B', water: '#4FC6D8', white: '#F5F1E6',
};

function clamp255(v        )         { return v < 0 ? 0 : v > 255 ? 255 : Math.round(v); }

export function hexToRgb(hex        )                           {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgbToHex(r        , g        , b        )         {
  return '#' + [r, g, b].map((v) => clamp255(v).toString(16).padStart(2, '0')).join('');
}

/** amt>0 变亮，amt<0 变暗 */
export function shade(hex        , amt        )         {
  const [r, g, b] = hexToRgb(hex);
  if (amt >= 0) return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  const k = 1 + amt;
  return rgbToHex(r * k, g * k, b * k);
}

export function mix(a        , b        , t        )         {
  const [r1, g1, b1] = hexToRgb(a); const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export function hexToNum(hex        )         { return parseInt(hex.replace('#', ''), 16); }

/** 逻辑分辨率画布：1 单位 = 1 像素，禁止任何抗锯齿绘制 */
export class Pix {
  w        ; h        ;
  canvas                   ;
  ctx                          ;
  constructor(w        , h        ) {
    this.w = w; this.h = h;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    this.canvas = c;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('2d context unavailable');
    ctx.imageSmoothingEnabled = false;
    this.ctx = ctx;
  }
  rect(x        , y        , w        , h        , c        )       {
    if (w <= 0 || h <= 0) return;
    this.ctx.fillStyle = c;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  px(x        , y        , c        )       { this.rect(x, y, 1, 1, c); }
  /** 居中横条 */
  row(cx        , y        , w        , c        )       { this.rect(Math.round(cx - w / 2), y, w, 1, c); }
  /** 像素圆盘 */
  disc(cx        , cy        , r        , c        )       {
    for (let y = -r; y <= r; y++) {
      const dx = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)) + 0.001);
      this.rect(cx - dx, cy + y, dx * 2 + 1, 1, c);
    }
  }
  ring(cx        , cy        , r        , c        )       {
    for (let a = 0; a < 64; a++) {
      const t = (a / 64) * Math.PI * 2;
      this.px(Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r), c);
    }
  }
  frame(x        , y        , w        , h        , c        )       {
    this.rect(x, y, w, 1, c); this.rect(x, y + h - 1, w, 1, c);
    this.rect(x, y, 1, h, c); this.rect(x + w - 1, y, 1, h, c);
  }
  clear()       { this.ctx.clearRect(0, 0, this.w, this.h); }
  dataURL()         { return this.canvas.toDataURL(); }

  // ---- 参考图的渲染语言三件套（必须在所有绘制完成后、按 rimLight → edgeShade → outline 的顺序跑）----
  // SOLID_A：只把不透明的“实体”当轮廓，半透明的地面投影不参与（否则影子会被描上一圈黑边）
          static SOLID_A = 140;
  /** 轮廓光：上缘提亮一阶，左右缘等量提亮（左右等量是为了守住镜像对称铁律） */
  rimLight(strength = 0.3)       {
    const img = this.ctx.getImageData(0, 0, this.w, this.h);
    const d = img.data, W = this.w, H = this.h, S = Pix.SOLID_A;
    const solid = (x        , y        )          =>
      x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] >= S;
    const out = new Uint8ClampedArray(d);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (d[i + 3] < S) continue;
      const t = !solid(x, y - 1), sd = !solid(x - 1, y) || !solid(x + 1, y);
      if (!t && !sd) continue;
      const k = t && sd ? strength * 1.3 : t ? strength : strength * 0.55;
      for (let c = 0; c < 3; c++) out[i + c] = d[i + c] + (255 - d[i + c]) * k;
    }
    img.data.set(out);
    this.ctx.putImageData(img, 0, 0);
  }
  /** 下缘压暗，出体积 */
  edgeShade(strength = 0.18)       {
    const img = this.ctx.getImageData(0, 0, this.w, this.h);
    const d = img.data, W = this.w, H = this.h, S = Pix.SOLID_A;
    const solid = (x        , y        )          =>
      x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] >= S;
    const out = new Uint8ClampedArray(d);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (d[i + 3] < S) continue;
      const b = !solid(x, y + 1);
      if (!b) continue;
      const k = 1 - strength;
      for (let c = 0; c < 3; c++) out[i + c] = d[i + c] * k;
    }
    img.data.set(out);
    this.ctx.putImageData(img, 0, 0);
  }
  /** 整体 1px 硬描边（只往透明像素里长，不覆盖画面） */
  outline(color        , alpha = 235)       {
    const img = this.ctx.getImageData(0, 0, this.w, this.h);
    const d = img.data, W = this.w, H = this.h, S = Pix.SOLID_A;
    const [or_, og, ob] = hexToRgb(color);
    const solid = (x        , y        )          =>
      x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] >= S;
    const out = new Uint8ClampedArray(d);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (d[i + 3] >= 40) continue;
      if (!solid(x - 1, y) && !solid(x + 1, y) && !solid(x, y - 1) && !solid(x, y + 1)) continue;
      out[i] = or_; out[i + 1] = og; out[i + 2] = ob; out[i + 3] = alpha;
    }
    img.data.set(out);
    this.ctx.putImageData(img, 0, 0);
  }
}

/** 可复现随机（xorshift） */
export class Rng {
          s        ;
  constructor(seed        ) { this.s = (seed | 0) || 1; }
  next()         {
    let x = this.s;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.s = x | 0;
    return ((x >>> 0) % 1000000) / 1000000;
  }
  int(n        )         { return Math.floor(this.next() * n) % n; }
  range(a        , b        )         { return a + this.next() * (b - a); }
  pick   (arr     )    { return arr[this.int(arr.length)]; }
  chance(p        )          { return this.next() < p; }
}
