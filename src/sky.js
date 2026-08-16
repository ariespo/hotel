import { mix, Rng } from './pix.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function skyBandColor(colors, index, total, fallback) {
  if (!colors.length) return fallback;
  if (colors.length === 1 || total <= 1) return colors[0];
  const position = clamp(index / (total - 1), 0, 1) * (colors.length - 1);
  const from = Math.floor(position), to = Math.min(colors.length - 1, from + 1);
  return mix(colors[from], colors[to], position - from);
}

/**
 * Build a deterministic, resolution-aware pixel sky plan. Keeping generation
 * separate from Pixi makes resize behaviour stable and regression-testable.
 */
export function createSkyPlan(width, height, seed = 4242) {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const area = w * h;
  const rng = new Rng(seed);

  const bands = Array.from({ length: 20 }, (_, index) => {
    const t = index / 19;
    const violetLift = Math.sin(t * Math.PI) * 0.08;
    return {
      y: Math.floor(index * h / 20),
      height: Math.ceil(h / 20) + 1,
      color: mix(mix('#070817', '#17142d', t), '#34204a', violetLift),
    };
  });

  const nebulaCount = clamp(Math.round(area / 18000), 28, 92);
  const nebula = Array.from({ length: nebulaCount }, (_, index) => {
    const t = (index + rng.next() * 1.8) / (nebulaCount + 1);
    const x = t * w + rng.range(-w * 0.1, w * 0.1);
    const centerY = h * (0.78 - t * 0.25) + Math.sin(t * Math.PI * 3) * h * 0.035;
    return {
      x,
      y: centerY + rng.range(-h * 0.1, h * 0.1),
      rx: rng.range(18, Math.max(24, w * 0.085)),
      ry: rng.range(5, Math.max(9, h * 0.026)),
      color: [0x3b52a8, 0x7044ad, 0x2b8aaa, 0xa34a9d][rng.int(4)],
      alpha: rng.range(0.035, 0.105),
    };
  });

  const starCount = clamp(Math.round(area / 3900), 120, 360);
  const stars = Array.from({ length: starCount }, () => {
    const nearBand = rng.chance(0.28);
    const x = rng.next() * w;
    const bandY = h * (0.76 - (x / w) * 0.24);
    const y = nearBand ? clamp(bandY + rng.range(-h * 0.12, h * 0.12), 0, h) : rng.next() * h;
    const roll = rng.next();
    return {
      x: Math.round(x), y: Math.round(y),
      size: roll > 0.975 ? 3 : roll > 0.82 ? 2 : 1,
      color: nearBand
        ? [0x76edff, 0x9a9cff, 0xe38aff][rng.int(3)]
        : [0xb5c1f2, 0xd0d8ff, 0x8192e0, 0xffe4a8][rng.int(4)],
      alpha: rng.range(0.48, 0.98),
    };
  });

  const glintCount = clamp(Math.round(area / 62000), 8, 24);
  const glints = Array.from({ length: glintCount }, (_, index) => ({
    x: Math.round(rng.range(12, Math.max(13, w - 12))),
    y: Math.round(rng.range(12, Math.max(13, h - 12))),
    radius: rng.chance(0.18) ? 5 : rng.chance(0.42) ? 3 : 2,
    color: [0xffe7a6, 0x8ceeff, 0xc8a5ff][rng.int(3)],
    phase: index % 2,
  }));

  const galaxySize = clamp(Math.round(Math.min(w, h) * 0.135), 42, 112);
  const galaxy = {
    x: Math.round(w * 0.79), y: Math.round(h * 0.2),
    rx: galaxySize, ry: Math.round(galaxySize * 0.42),
    rotation: -0.22,
  };
  const galaxyDust = Array.from({ length: 150 }, (_, index) => {
    const t = (index + rng.next()) / 150;
    const arm = index % 3;
    const angle = galaxy.rotation + arm * Math.PI * 2 / 3 + t * Math.PI * 3.8 + rng.range(-0.18, 0.18);
    const radius = galaxy.rx * (0.08 + t * 0.92);
    return {
      x: Math.round(galaxy.x + Math.cos(angle) * radius + rng.range(-2, 2)),
      y: Math.round(galaxy.y + Math.sin(angle) * radius * 0.42 + rng.range(-1.5, 1.5)),
      size: rng.chance(0.035) ? 3 : t < 0.18 || rng.chance(0.14) ? 2 : 1,
      color: t < 0.2 ? 0xffd47a : [0xb978ef, 0x727de3, 0x8fdcff][rng.int(3)],
      alpha: rng.range(0.42, 0.92) * (1 - t * 0.2),
    };
  });

  return { width: w, height: h, bands, nebula, stars, glints, galaxy, galaxyDust };
}
