// 高分辨率模块化立绘：B 式清晰赛璐璐结构 + A 式柔和面部过渡。
// 与地图小人共用 Appearance 编号；旧像素立绘仅作为异常回退。
import { ACCS, EYES, FACES, FRINGES, LENGTHS } from './face.js';
import {
  ACCENT_COLORS, appKey, CLOTH_COLORS, EYE_COLORS, HAIR_COLORS, SKINS,
} from './chargen.js';
import { mix, shade } from './pix.js';
import { portraitURL as pixelPortraitURL } from './portrait.js';

export const PORTRAIT_V2_SPEC = Object.freeze({
  version: 2,
  style: 'clean-cel-soft-face',
  width: 384,
  height: 512,
  anchors: Object.freeze({
    crown: Object.freeze([192, 48]),
    eyeLeft: Object.freeze([146, 211]),
    eyeRight: Object.freeze([238, 211]),
    nose: Object.freeze([192, 252]),
    mouth: Object.freeze([192, 286]),
    earLeft: Object.freeze([91, 207]),
    earRight: Object.freeze([293, 207]),
    chin: Object.freeze([192, 322]),
    shoulderY: 382,
  }),
  layers: Object.freeze([
    'backdrop', 'raceBack', 'hairBack', 'body', 'faceBase', 'eyes',
    'hairSide', 'fringe', 'raceFront', 'accessory', 'finish',
  ]),
  recolor: Object.freeze(['skin', 'iris', 'hair', 'clothA', 'clothB', 'accent']),
});

export const PORTRAIT_V2_PART_MAP = Object.freeze({
  face: FACES.map((part) => part.id),
  eye: EYES.map((part) => part.id),
  fringe: FRINGES.map((part) => part.id),
  hairLen: LENGTHS.map((part) => part.id),
});

const W = PORTRAIT_V2_SPEC.width;
const H = PORTRAIT_V2_SPEC.height;
const CX = 192;
const INK = '#211C2A';
const SOFT_INK = '#453B4E';

// Formal raster parts are enabled only as exact reviewed triples. Unreviewed
// faces, eyes, fringes and hairstyles stay on the procedural safety renderer;
// they must never be mixed with independently generated legacy assets.
export const RASTER_PARTS_VALIDATED = true;
export const FORMAL_RASTER_TRIPLES = Object.freeze([
  Object.freeze({ face: 'sharp', eye: 'round', fringe: 'part', hair: 'long' }),
  Object.freeze({ face: 'oval', eye: 'almond', fringe: 'part', hair: 'bob' }),
]);

const FACE_STYLE = [
  { id: 'round', temple: 91, cheek: 108, jaw: 91, chin: 48, earW: 24, earH: 51, nose: 'soft', mouth: 'warm' },
  { id: 'oval', temple: 90, cheek: 98, jaw: 76, chin: 39, earW: 21, earH: 54, nose: 'straight', mouth: 'calm' },
  { id: 'square', temple: 94, cheek: 101, jaw: 91, chin: 57, earW: 23, earH: 50, nose: 'wide', mouth: 'firm' },
  { id: 'sharp', temple: 91, cheek: 97, jaw: 66, chin: 27, earW: 20, earH: 53, nose: 'narrow', mouth: 'confident' },
  { id: 'chubby', temple: 96, cheek: 113, jaw: 101, chin: 53, earW: 25, earH: 49, nose: 'button', mouth: 'full' },
  { id: 'cat', temple: 92, cheek: 104, jaw: 72, chin: 33, earW: 21, earH: 52, nose: 'petite', mouth: 'playful' },
];

const EYE_STYLE = {
  round:  { w: 57, h: 31, tilt: 0, iris: 17 },
  almond: { w: 61, h: 27, tilt: -0.5, iris: 15 },
  sharp:  { w: 65, h: 22, tilt: -3.5, iris: 13 },
  up:     { w: 62, h: 25, tilt: -5, iris: 14 },
  droop:  { w: 59, h: 29, tilt: 4, iris: 16 },
  big:    { w: 61, h: 35, tilt: 0, iris: 19 },
  sleepy: { w: 61, h: 19, tilt: 1, iris: 12, lid: 0.45 },
  slit:   { w: 63, h: 20, tilt: -2, iris: 10, slit: true },
  glow:   { w: 60, h: 29, tilt: 0, iris: 17, glow: true },
  dull:   { w: 58, h: 25, tilt: 1, iris: 14, dull: true },
  star:   { w: 61, h: 33, tilt: 0, iris: 18, star: true },
  moon:   { w: 63, h: 19, tilt: -2, iris: 13, moon: true },
  gem:    { w: 58, h: 34, tilt: 0, iris: 18, gem: true },
  fox:    { w: 66, h: 20, tilt: -6, iris: 12 },
  puppy:  { w: 59, h: 32, tilt: 5, iris: 18 },
  mono:   { w: 61, h: 27, tilt: 0, iris: 16, mono: true },
  heart:  { w: 60, h: 31, tilt: 0, iris: 17, heart: true },
  wink:   { w: 61, h: 27, tilt: -1, iris: 15, wink: true },
};

function safeIndex(value, length) {
  const n = Number.isFinite(value) ? Math.round(value) : 0;
  return ((n % length) + length) % length;
}

function palette(a) {
  return {
    skin: SKINS[safeIndex(a.skin, SKINS.length)],
    iris: EYE_COLORS[safeIndex(a.eyeC, EYE_COLORS.length)],
    hair: HAIR_COLORS[safeIndex(a.hairC, HAIR_COLORS.length)],
    clothA: CLOTH_COLORS[safeIndex(a.clothA, CLOTH_COLORS.length)],
    clothB: CLOTH_COLORS[safeIndex(a.clothB, CLOTH_COLORS.length)],
    accent: ACCENT_COLORS[safeIndex(a.accC, ACCENT_COLORS.length)],
  };
}

function path(ctx, points, fill, stroke = INK, width = 2) {
  ctx.beginPath();
  for (const [kind, ...v] of points) {
    if (kind === 'M') ctx.moveTo(v[0], v[1]);
    else if (kind === 'L') ctx.lineTo(v[0], v[1]);
    else if (kind === 'C') ctx.bezierCurveTo(...v);
    else if (kind === 'Q') ctx.quadraticCurveTo(...v);
  }
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
}

function curve(ctx, points, color = SOFT_INK, width = 2, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.beginPath();
  for (const [kind, ...v] of points) {
    if (kind === 'M') ctx.moveTo(v[0], v[1]);
    else if (kind === 'L') ctx.lineTo(v[0], v[1]);
    else if (kind === 'C') ctx.bezierCurveTo(...v);
    else if (kind === 'Q') ctx.quadraticCurveTo(...v);
  }
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}

function ellipse(ctx, x, y, rx, ry, fill, stroke = null, width = 2) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function softEllipse(ctx, x, y, rx, ry, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
  g.addColorStop(0, color); g.addColorStop(1, `${color}00`);
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function drawBackdrop(ctx, pal) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, mix('#E8E8F1', pal.hair, 0.08));
  bg.addColorStop(0.58, '#D7D3DF');
  bg.addColorStop(1, mix('#AEA4BA', pal.clothA, 0.18));
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const halo = ctx.createRadialGradient(CX, 190, 24, CX, 190, 205);
  halo.addColorStop(0, '#FFFFFF9A'); halo.addColorStop(0.6, '#FFFFFF22'); halo.addColorStop(1, '#5D506500');
  ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#70657B'; ctx.lineWidth = 4; ctx.strokeRect(4, 4, W - 8, H - 8);
  ctx.strokeStyle = '#FFFFFF88'; ctx.lineWidth = 1; ctx.strokeRect(8, 8, W - 16, H - 16);
}

function drawRaceBack(ctx, race, pal) {
  const dark = shade(pal.hair, -0.35), hi = mix(pal.hair, pal.accent, 0.48);
  if ([1, 4, 6, 8].includes(race)) {
    for (const side of [-1, 1]) path(ctx, [
      ['M', CX + side * 58, 104], ['C', CX + side * 76, 72, CX + side * 91, 73, CX + side * 83, 123],
      ['C', CX + side * 73, 111, CX + side * 65, 105, CX + side * 58, 104],
    ], race === 4 ? mix(pal.skin, '#A87561', .32) : pal.skin, dark, 3);
  }
  if ([5, 10, 15].includes(race)) {
    for (const side of [-1, 1]) path(ctx, [
      ['M', CX + side * 43, 87], ['C', CX + side * 48, 48, CX + side * 77, 30, CX + side * 71, 86],
      ['C', CX + side * 63, 72, CX + side * 52, 71, CX + side * 43, 87],
    ], hi, dark, 4);
  }
  if (race === 11) path(ctx, [['M', 245, 105], ['C', 286, 65, 315, 69, 283, 126], ['C', 268, 117, 256, 111, 245, 105]], hi, dark, 3);
  if (race === 12) { ctx.save(); ctx.globalAlpha = .65; ellipse(ctx, CX, 75, 64, 17, null, pal.accent, 5); ctx.restore(); }
}

function hairFamily(index) {
  if (index === 0) return 'bald';
  if ([1, 7, 8, 12, 14, 19, 25].includes(index)) return 'short';
  if ([2, 6, 10, 20, 24, 33].includes(index)) return 'medium';
  if ([4, 9, 15, 17, 27, 30].includes(index)) return 'pony';
  if ([5, 26, 28, 31].includes(index)) return 'twin';
  if ([13, 18, 22, 32].includes(index)) return 'braid';
  return 'long';
}

function drawHairBack(ctx, hairIndex, pal) {
  const family = hairFamily(hairIndex);
  if (family === 'bald') return;
  const base = pal.hair, dark = shade(base, -0.42), mid = mix(base, '#6672B0', .2), hi = mix(base, '#9EA7ED', .4);
  const bottom = family === 'short' ? 273 : family === 'medium' ? 355 : 474;
  const spread = family === 'short' ? 104 : family === 'medium' ? 122 : 143;
  const grad = ctx.createLinearGradient(0, 50, 0, bottom);
  grad.addColorStop(0, mix(base, hi, .22)); grad.addColorStop(.28, base); grad.addColorStop(1, dark);
  path(ctx, [
    ['M', CX, 42], ['C', CX - 78, 38, CX - spread, 96, CX - spread, 194],
    ['C', CX - spread - 2, 286, CX - spread + 18, bottom - 12, CX - 98, bottom],
    ['C', CX - 51, bottom - 13, CX - 24, bottom - 19, CX, bottom - 8],
    ['C', CX + 24, bottom - 19, CX + 51, bottom - 13, CX + 98, bottom],
    ['C', CX + spread - 18, bottom - 12, CX + spread + 2, 286, CX + spread, 194],
    ['C', CX + spread, 96, CX + 78, 38, CX, 42],
  ], grad, dark, 4);
  ctx.save(); ctx.globalAlpha = .62;
  for (const side of [-1, 1]) curve(ctx, [
    ['M', CX + side * 16, 56], ['C', CX + side * 69, 76, CX + side * (spread - 8), 149, CX + side * (spread - 20), bottom - 18],
  ], hi, 9, .42);
  ctx.restore();
  if (family === 'pony') {
    const side = hairIndex % 2 ? -1 : 1, x = CX + side * 91;
    ellipse(ctx, x, 99, 34, 25, dark, INK, 3);
    path(ctx, [['M', x - 25, 111], ['C', x + side * 58, 145, x + side * 66, 310, x + side * 32, 463], ['C', x - side * 15, 422, x - side * 16, 194, x - 25, 111]], base, dark, 4);
    curve(ctx, [['M', x, 126], ['C', x + side * 33, 215, x + side * 40, 354, x + side * 24, 432]], hi, 10, .5);
  }
  if (family === 'twin') for (const side of [-1, 1]) {
    ellipse(ctx, CX + side * 94, 120, 26, 30, dark, INK, 3);
    path(ctx, [['M', CX + side * 91, 132], ['C', CX + side * 153, 187, CX + side * 149, 340, CX + side * 115, 462], ['C', CX + side * 77, 383, CX + side * 67, 223, CX + side * 91, 132]], base, dark, 4);
  }
  if (family === 'braid') {
    const side = hairIndex % 2 ? -1 : 1;
    for (let i = 0; i < 8; i++) ellipse(ctx, CX + side * (101 + Math.sin(i) * 7), 190 + i * 37, 22 - i * .7, 27, i % 2 ? mid : base, dark, 3);
  }
}

function drawBody(ctx, a, pal) {
  const top = safeIndex(a.wear?.top, 26), wide = safeIndex(a.bd, 3) * 13;
  const cloth = ctx.createLinearGradient(0, 352, 0, H);
  cloth.addColorStop(0, mix(pal.clothA, '#FFFFFF', .14)); cloth.addColorStop(1, shade(pal.clothA, -.38));
  path(ctx, [
    ['M', 150, 347], ['C', 116, 354, 75 - wide, 371, 32, 430], ['L', 9, 512], ['L', 375, 512],
    ['L', 352, 430], ['C', 309 + wide, 371, 268, 354, 234, 347],
  ], cloth, INK, 4);
  const collar = top % 5;
  if (collar === 0) {
    path(ctx, [['M', 155, 349], ['L', 192, 397], ['L', 229, 349], ['L', 246, 363], ['L', 192, 424], ['L', 138, 363]], pal.clothB, INK, 3);
  } else if (collar === 1) {
    path(ctx, [['M', 154, 346], ['C', 166, 368, 177, 378, 192, 386], ['C', 207, 378, 218, 368, 230, 346], ['L', 241, 365], ['C', 213, 400, 171, 400, 143, 365]], pal.clothB, INK, 3);
  } else if (collar === 2) {
    ctx.fillStyle = pal.clothB; ctx.fillRect(181, 361, 22, 151);
    curve(ctx, [['M', 192, 363], ['L', 192, 507]], pal.accent, 4);
  } else if (collar === 3) {
    path(ctx, [['M', 145, 352], ['C', 167, 371, 217, 371, 239, 352], ['L', 249, 377], ['C', 217, 393, 167, 393, 135, 377]], pal.clothB, INK, 3);
  } else {
    path(ctx, [['M', 159, 350], ['L', 192, 390], ['L', 225, 350], ['L', 235, 358], ['L', 207, 409], ['L', 177, 409], ['L', 149, 358]], pal.clothB, INK, 3);
  }
  curve(ctx, [['M', 75, 407], ['C', 123, 421, 147, 460, 155, 512]], mix(pal.clothA, '#FFFFFF', .28), 5, .35);
  if (top % 3 === 0) for (let y = 420; y < 501; y += 22) ellipse(ctx, 192, y, 4, 4, pal.accent, INK, 1.5);
}

function facePath(style) {
  return [
    ['M', CX, 92],
    ['C', CX - style.temple * .58, 88, CX - style.temple, 119, CX - style.temple, 186],
    ['C', CX - style.cheek, 222, CX - style.jaw, 286, CX - style.chin, 309],
    ['C', CX - style.chin * .55, 319, CX - 14, 324, CX, 326],
    ['C', CX + 14, 324, CX + style.chin * .55, 319, CX + style.chin, 309],
    ['C', CX + style.jaw, 286, CX + style.cheek, 222, CX + style.temple, 186],
    ['C', CX + style.temple, 119, CX + style.temple * .58, 88, CX, 92],
  ];
}

function drawFaceBase(ctx, faceIndex, pal) {
  const style = FACE_STYLE[safeIndex(faceIndex, FACE_STYLE.length)];
  const skinLight = mix(pal.skin, '#FFFFFF', .27), skinShade = mix(pal.skin, '#7D5365', .2);
  for (const side of [-1, 1]) {
    const x = CX + side * style.temple;
    ellipse(ctx, x, 210, style.earW, style.earH, pal.skin, INK, 2.5);
    curve(ctx, [['M', x - side * 4, 190], ['C', x + side * 10, 201, x + side * 10, 226, x - side * 3, 237]], skinShade, 2, .72);
  }
  const faceGrad = ctx.createLinearGradient(0, 92, 0, 326);
  faceGrad.addColorStop(0, skinLight); faceGrad.addColorStop(.55, pal.skin); faceGrad.addColorStop(1, skinShade);
  path(ctx, facePath(style), faceGrad, INK, 3);
  softEllipse(ctx, 140, 254, 41, 22, mix(pal.skin, '#EE8091', .48), .2);
  softEllipse(ctx, 244, 254, 41, 22, mix(pal.skin, '#EE8091', .48), .2);
  softEllipse(ctx, 192, 204, 62, 92, '#FFFFFF', .15);
  drawNoseMouth(ctx, style, pal);
}

function drawNoseMouth(ctx, style, pal) {
  const shadow = mix(pal.skin, '#845165', .46), lip = mix(pal.skin, '#A73955', .5), lipHi = mix(lip, '#FFFFFF', .42);
  const noseWidth = { soft: 13, straight: 11, wide: 17, narrow: 8, button: 15, petite: 8 }[style.nose];
  const noseLength = { soft: 30, straight: 36, wide: 31, narrow: 38, button: 25, petite: 27 }[style.nose];
  curve(ctx, [['M', 194, 221], ['C', 192, 233, 189, 243, 192 - noseWidth * .32, 252]], shadow, 2, .45);
  curve(ctx, [['M', 192 - noseWidth, 255], ['C', 188, 260, 196, 261, 192 + noseWidth, 255]], shadow, 1.8, .75);
  curve(ctx, [['M', 188, 222], ['C', 187, 237, 186, 245, 186, 248]], '#FFFFFF', 3, .38);
  const mouthWidth = { warm: 32, calm: 29, firm: 36, confident: 33, full: 35, playful: 30 }[style.mouth];
  const lift = style.mouth === 'warm' ? -3 : style.mouth === 'confident' || style.mouth === 'playful' ? -2 : 0;
  curve(ctx, [['M', CX - mouthWidth, 286], ['C', CX - 14, 282 + lift, CX - 8, 284, CX, 286], ['C', CX + 9, 282, CX + 16, 284 + lift, CX + mouthWidth, 286]], lip, 2.4, .95);
  curve(ctx, [['M', CX - mouthWidth + 5, 288], ['C', CX - 10, 300, CX + 12, 300, CX + mouthWidth - 5, 288]], lip, 1.4, .7);
  curve(ctx, [['M', CX - 12, 290], ['C', CX - 3, 294, CX + 5, 294, CX + 13, 290]], lipHi, 2.4, .58);
  if (style.mouth === 'full') softEllipse(ctx, CX, 291, 27, 9, lip, .16);
}

function drawOneEye(ctx, x, y, side, id, pal) {
  const s = EYE_STYLE[id] || EYE_STYLE.almond;
  if (s.wink && side > 0) {
    curve(ctx, [['M', x - 29, y], ['C', x - 10, y + 10, x + 11, y + 10, x + 29, y - 1]], INK, 4);
    return;
  }
  ctx.save(); ctx.translate(x, y); ctx.rotate((s.tilt * side * Math.PI) / 180);
  const w = s.w, h = s.h;
  ctx.beginPath(); ctx.moveTo(-w / 2, 0);
  ctx.bezierCurveTo(-w * .25, -h * .72, w * .22, -h * .72, w / 2, 0);
  ctx.bezierCurveTo(w * .22, h * .55, -w * .22, h * .58, -w / 2, 0); ctx.closePath();
  ctx.fillStyle = s.dull ? '#E5E0E2' : '#FFFDFC'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.3; ctx.stroke();
  ctx.save(); ctx.clip();
  const irisGrad = ctx.createRadialGradient(0, -3, 2, 0, 0, s.iris);
  irisGrad.addColorStop(0, mix(pal.iris, '#FFFFFF', .75));
  irisGrad.addColorStop(.48, mix(pal.iris, '#C7D8FF', .25));
  irisGrad.addColorStop(1, shade(pal.iris, -.45));
  ellipse(ctx, 0, 2, s.iris, s.iris * 1.05, irisGrad);
  if (s.mono) { ellipse(ctx, 0, 2, s.iris * .66, s.iris * .66, null, pal.accent, 3); ellipse(ctx, 0, 2, 4, 8, INK); }
  else if (s.heart) {
    ctx.fillStyle = shade(pal.iris, -.6); ctx.beginPath(); ctx.moveTo(0, 10); ctx.bezierCurveTo(-14, 0, -9, -11, 0, -4); ctx.bezierCurveTo(9, -11, 14, 0, 0, 10); ctx.fill();
  } else if (s.star) {
    ctx.fillStyle = shade(pal.iris, -.6); ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4 : 10; const px = Math.cos(a) * r, py = 2 + Math.sin(a) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.fill();
  } else if (s.moon) { ellipse(ctx, 1, 1, 7, 12, shade(pal.iris, -.62)); ellipse(ctx, 5, -2, 6, 11, pal.iris); }
  else { ellipse(ctx, 0, 3, s.slit ? 2.5 : 6, s.slit ? 11 : 9, shade(pal.iris, -.72)); }
  ellipse(ctx, -5, -6, 4.3, 4.3, '#FFFFFF'); ellipse(ctx, 4, 7, 2, 2, '#FFFFFFAA');
  if (s.glow) { ctx.shadowColor = pal.iris; ctx.shadowBlur = 10; ellipse(ctx, 0, 1, s.iris + 3, s.iris + 2, null, mix(pal.iris, '#FFFFFF', .45), 2); }
  ctx.restore();
  curve(ctx, [['M', -w / 2, 0], ['C', -w * .2, -h * .78, w * .25, -h * .78, w / 2, 0]], INK, 4.1);
  for (let i = 0; i < 3; i++) {
    const lx = side < 0 ? w / 2 - i * 6 : -w / 2 + i * 6;
    curve(ctx, [['M', lx, -1], ['L', lx + side * 5, -7 - i * 2]], INK, 1.5, .8);
  }
  if (s.lid) curve(ctx, [['M', -w / 2 + 4, -5], ['C', -10, -h * .25, 12, -h * .25, w / 2 - 4, -4]], mix(pal.skin, INK, .5), 4, s.lid);
  ctx.restore();
}

function drawEyes(ctx, eyeIndex, pal) {
  const id = EYES[safeIndex(eyeIndex, EYES.length)]?.id || 'almond';
  drawOneEye(ctx, 146, 211, -1, id, pal); drawOneEye(ctx, 238, 211, 1, id, pal);
  const s = EYE_STYLE[id] || EYE_STYLE.almond;
  const browTilt = s.tilt * .45;
  for (const side of [-1, 1]) {
    const x = CX + side * 47;
    curve(ctx, [['M', x - 25, 176 + browTilt * side], ['C', x - 7, 169, x + 9, 169, x + 25, 175 - browTilt * side]], mix(pal.hair, INK, .42), 3.2, .72);
  }
}

function drawHairFront(ctx, hairIndex, fringeIndex, pal) {
  if (hairFamily(hairIndex) === 'bald') return;
  const base = pal.hair, dark = shade(base, -.42), hi = mix(base, '#8F9BE3', .48);
  path(ctx, [
    ['M', 101, 176], ['C', 91, 101, 123, 48, 192, 43], ['C', 261, 48, 293, 101, 283, 176],
    ['C', 270, 136, 244, 105, 192, 104], ['C', 140, 105, 114, 136, 101, 176],
  ], base, dark, 3.5);
  for (const side of [-1, 1]) path(ctx, [
    ['M', CX + side * 84, 153], ['C', CX + side * 109, 197, CX + side * 102, 287, CX + side * 79, 341],
    ['C', CX + side * 57, 308, CX + side * 69, 220, CX + side * 63, 163],
  ], side < 0 ? mix(base, hi, .08) : dark, dark, 2.5);
  curve(ctx, [['M', 119, 116], ['C', 145, 63, 172, 58, 190, 52]], hi, 10, .58);
  curve(ctx, [['M', 207, 54], ['C', 245, 66, 267, 95, 279, 142]], hi, 8, .42);
  const id = FRINGES[safeIndex(fringeIndex, FRINGES.length)]?.id || 'part';
  if (id === 'none' || id === 'upswept') {
    if (id === 'upswept') for (const side of [-1, 1]) curve(ctx, [['M', CX, 104], ['C', CX + side * 16, 80, CX + side * 37, 71, CX + side * 55, 74]], hi, 7, .45);
    return;
  }
  const strand = (x0, y0, x1, y1, width, color = base) => path(ctx, [
    ['M', x0 - width / 2, y0], ['C', x0 - width * .7, y0 + 35, x1 - width * .45, y1 - 18, x1, y1],
    ['C', x1 + width * .45, y1 - 18, x0 + width * .7, y0 + 35, x0 + width / 2, y0],
  ], color, dark, 1.8);
  if (id === 'straight' || id === 'himecut') {
    for (let i = 0; i < 7; i++) strand(133 + i * 20, 103 + Math.abs(3 - i) * 3, 130 + i * 21, 191 + (i % 2) * 10, 24, i % 2 ? base : mix(base, hi, .09));
  } else if (id === 'part' || id === 'curtain') {
    for (const side of [-1, 1]) { strand(CX + side * 8, 93, CX + side * 58, id === 'curtain' ? 238 : 207, 37, side < 0 ? base : dark); strand(CX + side * 28, 92, CX + side * 80, 178, 29, base); }
  } else if (id === 'short' || id === 'wispy' || id === 'crescent') {
    for (let i = 0; i < 6; i++) strand(142 + i * 20, 100, 138 + i * 22, 168 + (i % 3) * 13, 18, i % 2 ? base : mix(base, hi, .1));
  } else if (id === 'spiky' || id === 'antenna') {
    for (let i = 0; i < 6; i++) strand(137 + i * 22, 99, 128 + i * 25, 178 + (i % 2) * 22, 22, i % 2 ? base : dark);
    if (id === 'antenna') strand(190, 65, 205, 29, 10, base);
  } else if (id === 'swept' || id === 'asym') {
    strand(132, 97, 229, 207, 52, base); strand(163, 89, 257, 171, 41, mix(base, hi, .08));
  } else if (id === 'braided') {
    for (let i = 0; i < 8; i++) ellipse(ctx, 123 + i * 20, 112 + Math.sin(i) * 7, 15, 11, i % 2 ? base : mix(base, hi, .12), dark, 2);
  }
}

function drawRaceFront(ctx, race, pal) {
  if (race === 2 || race === 17) { // 尖牙
    path(ctx, [['M', 168, 287], ['L', 175, 301], ['L', 180, 288]], '#FFFDF8', mix(pal.skin, INK, .4), 1);
    path(ctx, [['M', 204, 288], ['L', 209, 301], ['L', 216, 287]], '#FFFDF8', mix(pal.skin, INK, .4), 1);
  }
  if (race === 7) { for (const [x, y] of [[151, 253], [229, 246], [241, 265]]) ellipse(ctx, x, y, 2.3, 2.3, '#7D6D83'); }
  if (race === 9 || race === 10) { ellipse(ctx, 192, 191, 7, 7, pal.accent, INK, 2); curve(ctx, [['M', 192, 184], ['L', 192, 153]], pal.accent, 3); }
  if (race === 14) { for (const [x, y] of [[126, 270], [257, 180]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(.45); ctx.fillStyle = '#FFFFFF70'; ctx.fillRect(-7, -7, 14, 14); ctx.restore(); } }
  if (race === 16) { // 胡须种族
    curve(ctx, [['M', 151, 288], ['C', 166, 337, 218, 337, 233, 288]], shade(pal.hair, -.18), 18, .85);
  }
}

function drawAccessory(ctx, a, pal) {
  const id = safeIndex(a.acc, ACCS.length);
  if ([1, 2, 3, 6].includes(id)) {
    for (const x of [146, 238]) { ctx.beginPath(); ctx.roundRect(x - 35, 190, 70, 43, 12); ctx.strokeStyle = id === 6 ? pal.accent : '#665C6D'; ctx.lineWidth = 4; ctx.stroke(); }
    curve(ctx, [['M', 181, 208], ['C', 188, 203, 196, 203, 203, 208]], id === 6 ? pal.accent : '#665C6D', 4);
  } else if (id === 4) { ellipse(ctx, 270, 214, 22, 22, null, pal.accent, 4); curve(ctx, [['M', 285, 229], ['L', 303, 246]], pal.accent, 3); }
  else if (id === 5) { path(ctx, [['M', 108, 187], ['L', 181, 187], ['L', 174, 224], ['L', 112, 224]], '#312B36DD', INK, 2); }
  else if (id === 7) curve(ctx, [['M', 116, 166], ['C', 157, 155, 228, 155, 269, 166]], pal.accent, 6);
  else if (id === 8) { path(ctx, [['M', 116, 144], ['L', 269, 144], ['L', 260, 181], ['L', 124, 181]], pal.clothB, INK, 3); curve(ctx, [['M', 126, 156], ['L', 258, 156]], pal.accent, 4); }
  else if (id === 9) { path(ctx, [['M', 118, 106], ['L', 269, 106], ['L', 254, 145], ['L', 130, 145]], pal.clothB, INK, 3); }
  else if (id === 10) { ellipse(ctx, 286, 258, 9, 14, null, pal.accent, 3); curve(ctx, [['M', 286, 272], ['L', 286, 295]], pal.accent, 2); }
  else if (id === 13) { for (const [x, y, c] of [[272, 140, pal.accent], [290, 152, '#E78CB7'], [278, 162, '#F4C65B']]) ellipse(ctx, x, y, 11, 9, c, INK, 1.5); }
  else if (id === 14) { curve(ctx, [['M', 139, 160], ['C', 171, 148, 213, 148, 245, 160]], pal.accent, 4); ellipse(ctx, 192, 154, 7, 7, '#FFF5B8', pal.accent, 2); }
}

function drawFinish(ctx) {
  const vignette = ctx.createRadialGradient(CX, 222, 110, CX, 240, 315);
  vignette.addColorStop(.55, '#30273900'); vignette.addColorStop(1, '#30273945');
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
}

export function drawIllustratedPortrait(a) {
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const pal = palette(a), race = safeIndex(a.race, 18), hair = safeIndex(a.hairLen, LENGTHS.length);
  drawBackdrop(ctx, pal);
  drawRaceBack(ctx, race, pal);
  drawHairBack(ctx, hair, pal);
  drawBody(ctx, a, pal);
  // 颈部属于脸型肤色体系。
  const neck = ctx.createLinearGradient(0, 315, 0, 380); neck.addColorStop(0, pal.skin); neck.addColorStop(1, mix(pal.skin, '#70495B', .26));
  path(ctx, [['M', 160, 291], ['C', 164, 332, 159, 352, 143, 363], ['C', 164, 386, 220, 386, 241, 363], ['C', 225, 352, 220, 332, 224, 291]], neck, INK, 3);
  drawFaceBase(ctx, a.face, pal);
  drawEyes(ctx, a.eye, pal);
  drawHairFront(ctx, hair, a.fringe, pal);
  drawRaceFront(ctx, race, pal);
  drawAccessory(ctx, a, pal);
  drawFinish(ctx);
  return canvas;
}

const layerImages = new Map();
const tintedLayers = new Map();
function requestLayer(src) {
  if (typeof Image === 'undefined') return null;
  const known = layerImages.get(src);
  if (known) return known.complete && known.naturalWidth ? known : null;
  const image = new Image(); image.decoding = 'async'; image.src = src; layerImages.set(src, image);
  return null;
}

function tintLayer(image, kind, color) {
  const key = `${image.src}|${kind}|${color}`;
  const hit = tintedLayers.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return image;
  ctx.drawImage(image, 0, 0, W, H);
  const pixels = ctx.getImageData(0, 0, W, H), data = pixels.data;
  const target = color.replace('#', '');
  const tr = parseInt(target.slice(0, 2), 16), tg = parseInt(target.slice(2, 4), 16), tb = parseInt(target.slice(4, 6), 16);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 8) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const lum = r * .299 + g * .587 + b * .114;
    if (kind === 'hair') {
      if (lum < 20) continue;
      const light = Math.max(.24, Math.min(1.42, lum / 76));
      data[i] = Math.min(255, tr * light); data[i + 1] = Math.min(255, tg * light); data[i + 2] = Math.min(255, tb * light);
      if (lum > 75) { data[i] = (data[i] + 130) / 2; data[i + 1] = (data[i + 1] + 142) / 2; data[i + 2] = (data[i + 2] + 220) / 2; }
    } else if (kind === 'iris') {
      if (!(b > r + 12 && g > r + 5 && lum > 70)) continue;
      const light = Math.max(.42, Math.min(1.55, lum / 155));
      data[i] = Math.min(255, tr * light); data[i + 1] = Math.min(255, tg * light); data[i + 2] = Math.min(255, tb * light);
    } else if (kind === 'skin') {
      if (lum < 70) continue;
      const saturation = (Math.max(r, g, b) - Math.min(r, g, b)) / Math.max(1, Math.max(r, g, b));
      const light = Math.max(.38, Math.min(1.45, lum / 226));
      if (r > g + 12 && saturation > .12) {
        data[i] = Math.min(255, (tr * light) * .62 + r * .38);
        data[i + 1] = Math.min(255, (tg * light) * .62 + g * .38);
        data[i + 2] = Math.min(255, (tb * light) * .62 + b * .38);
      } else {
        data[i] = Math.min(255, tr * light); data[i + 1] = Math.min(255, tg * light); data[i + 2] = Math.min(255, tb * light);
      }
    }
  }
  ctx.putImageData(pixels, 0, 0);
  tintedLayers.set(key, canvas);
  if (tintedLayers.size > 180) tintedLayers.clear();
  return canvas;
}

function drawLayeredPortrait(a) {
  if (!RASTER_PARTS_VALIDATED) return null;
  if (typeof document === 'undefined') return null;
  const faceId = FACES[safeIndex(a.face, FACES.length)]?.id || 'round';
  const eyeId = EYES[safeIndex(a.eye, EYES.length)]?.id || 'round';
  const fringeId = FRINGES[safeIndex(a.fringe, FRINGES.length)]?.id || 'straight';
  const hairId = LENGTHS[safeIndex(a.hairLen, LENGTHS.length)]?.id || 'bald';
  const approved = FORMAL_RASTER_TRIPLES.find((part) => (
    part.face === faceId && part.eye === eyeId && part.fringe === fringeId && part.hair === hairId
  ));
  if (!approved) return null;
  const face = requestLayer(`assets/portrait-v2-formal/faces/${faceId}.png`);
  const eyes = requestLayer(`assets/portrait-v2-formal/eyes/${eyeId}.png`);
  const hair = requestLayer(`assets/portrait-v2-formal/hair/${hairId}.png`);
  if (!face || !eyes || !hair) return null;
  const pal = palette(a), canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  drawBackdrop(ctx, pal);
  drawBody(ctx, a, pal);
  ctx.drawImage(tintLayer(face, 'skin', pal.skin), 0, 0);
  ctx.drawImage(tintLayer(eyes, 'iris', pal.iris), 0, 0);
  ctx.drawImage(tintLayer(hair, 'hair', pal.hair), 0, 0);
  drawRaceFront(ctx, safeIndex(a.race, 18), pal);
  drawAccessory(ctx, a, pal);
  drawFinish(ctx);
  return canvas;
}

const cache = new Map();
const proceduralCache = new Map();
export function portraitURL(a) {
  const key = `v2:${appKey(a)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  try {
    const layered = drawLayeredPortrait(a);
    if (layered) {
      const url = layered.toDataURL('image/png'); cache.set(key, url);
      if (cache.size > 240) cache.clear();
      return url;
    }
    const fallback = proceduralCache.get(key) || drawIllustratedPortrait(a).toDataURL('image/png');
    proceduralCache.set(key, fallback);
    return fallback;
  } catch (err) {
    console.warn('illustrated portrait fallback', err);
    return pixelPortraitURL(a);
  }
}
