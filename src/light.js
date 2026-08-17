import { furnFootprint } from './world.js';

export const LIGHT_KINDS = new Set(['lamp', 'fireplace', 'lightbar', 'lightcol', 'stove']);
export const SHADOWLESS = new Set(['lamp', 'lightbar', 'lightcol']);

export function mixRgb(a, b, t) {
  const k = Math.max(0, Math.min(1, t));
  const ar = a >> 16 & 255, ag = a >> 8 & 255, ab = a & 255;
  const br = b >> 16 & 255, bg = b >> 8 & 255, bb = b & 255;
  return (Math.round(ar + (br - ar) * k) << 16)
    | (Math.round(ag + (bg - ag) * k) << 8)
    | Math.round(ab + (bb - ab) * k);
}

export function mulRgb(a, b) {
  return (Math.round(((a >> 16) & 255) * ((b >> 16) & 255) / 255) << 16)
    | (Math.round(((a >> 8) & 255) * ((b >> 8) & 255) / 255) << 8)
    | Math.round((a & 255) * (b & 255) / 255);
}

export function lightProfile(kind, quality = 1, color = '#F3B84B') {
  const q = Math.max(1, quality || 1);
  if (kind === 'fireplace') return { kind, radius: 5.2, strength: 0.6, color: color || '#E4732C', bloom: 80, alpha: 0.3 };
  if (kind === 'stove') return { kind, radius: 3.6, strength: 0.52, color: color || '#E4732C', bloom: 56, alpha: 0.25 };
  if (kind === 'lightbar') return { kind, radius: 3.6 + q * 0.46, strength: 0.47, color, bloom: 48 + q * 10, alpha: 0.24 };
  if (kind === 'lightcol') return { kind, radius: 4.0 + q * 0.4, strength: 0.52, color, bloom: 50 + q * 8, alpha: 0.26 };
  if (kind === 'sconce') return { kind, radius: 4.2, strength: 0.56, color: color || '#F3B84B', bloom: 70, alpha: 0.29 };
  return { kind: kind || 'lamp', radius: 3.9 + q * 0.32, strength: 0.54, color: color || '#F3B84B', bloom: 59 + q * 7, alpha: 0.28 };
}

export function makeLight(kind, x, y, quality = 1, color = '#F3B84B') {
  return { x, y, ...lightProfile(kind, quality, color) };
}

export function worldLights(tavern, wallDeco = {}, glowOf = () => '#F3B84B') {
  const lights = [];
  for (const f of tavern.furns || []) {
    if (!LIGHT_KINDS.has(f.kind)) continue;
    const [fw, fh] = furnFootprint(f.kind, f.dir);
    const light = makeLight(f.kind, f.x + fw / 2, f.y + fh / 2, f.quality, glowOf(f));
    if (f.kind === 'stove') light.furn = f.id;
    lights.push(light);
  }
  for (const r of tavern.rooms || []) {
    const pick = wallDeco[r.kind] || wallDeco.dining || ['sconce'];
    for (let x = r.x; x < r.x + r.w; x++) {
      for (let y = r.y; y < r.y + r.h; y++) {
        const sides = [[0, 0, -1], [1, 0, 1], [2, -1, 0], [3, 1, 0]];
        for (const [side, dx, dy] of sides) {
          const nb = tavern.roomAt(x + dx, y + dy);
          if (nb) continue;
          if ((x * 5 + y * 3 + side) % 4 !== 0) continue;
          if (pick[(x + y + side) % pick.length] !== 'sconce') continue;
          const ox = side === 0 ? 0.5 : side === 1 ? 0.5 : side === 2 ? 0.62 : 0.38;
          const oy = side === 0 ? 0.62 : side === 1 ? 0.38 : 0.5;
          lights.push(makeLight('sconce', x + ox, y + oy, 1, '#F3B84B'));
        }
      }
    }
  }
  return lights;
}

export function tileWarmth(tx, ty, lights) {
  let warmth = 0.38;
  for (const light of lights) {
    const dist = Math.hypot(tx + 0.5 - light.x, ty + 0.5 - light.y);
    if (dist >= light.radius) continue;
    const fall = (1 - dist / light.radius) ** 1.25;
    warmth = Math.max(warmth, 0.38 + fall * light.strength * 0.62);
  }
  return Math.min(1, warmth);
}

export function edgeOcclusion(tavern, tx, ty) {
  const room = tavern.roomAt(tx, ty);
  if (!room) return 1;
  let occ = 1;
  if (!tavern.roomAt(tx, ty - 1) || tavern.roomAt(tx, ty - 1).id !== room.id) occ *= 0.93;
  if (!tavern.roomAt(tx, ty + 1) || tavern.roomAt(tx, ty + 1).id !== room.id) occ *= 0.93;
  if (!tavern.roomAt(tx - 1, ty) || tavern.roomAt(tx - 1, ty).id !== room.id) occ *= 0.93;
  if (!tavern.roomAt(tx + 1, ty) || tavern.roomAt(tx + 1, ty).id !== room.id) occ *= 0.93;
  return occ;
}

export function floorLightTint(warmth, base = 0xFFFFFF, lift = 1) {
  const t = Math.max(0, Math.min(1, warmth));
  const cool = 0xC9A57C;
  const mid = 0xF0D6A8;
  const hot = 0xFFEBC0;
  const lit = t < 0.5 ? mixRgb(cool, mid, t * 2) : mixRgb(mid, hot, (t - 0.5) * 2);
  let color = mulRgb(base, lit);
  if (lift > 1) color = mixRgb(color, 0xFFF4DC, Math.min(0.4, lift - 1));
  return color;
}

export function contactShadow(kind, fw, fh, tile = 32) {
  if (SHADOWLESS.has(kind)) return null;
  return {
    width: fw * tile * 0.86,
    height: Math.max(6, fh * tile * 0.36),
    alpha: kind === 'chair' ? 0.18 : 0.26,
    dy: fh * tile * 0.16,
  };
}

export function nightShadeAlpha(dayActive) {
  return dayActive ? 0.03 : 0.08;
}
