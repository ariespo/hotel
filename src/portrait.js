// 一对一程序化像素立绘：与地图小人共用 Appearance 编号，但使用独立的半身像绘制规格。
// 新部件只能追加在源数组末尾；本文件的映射完整性测试会阻止“有小人部件、无立绘部件”。
import { BODIES, PANTS, SOCKS } from './body.js';
import { ACCS, EYES, FACES, FRINGES, LENGTHS } from './face.js';
import {
  ACCENT_COLORS, appKey, BACK_ACCESSORY_IDS, CLOTH_COLORS, EYE_COLORS, HAIR_COLORS, HAND_NAMES, RACE_NAMES, SKINS,
} from './chargen.js';
import { mix, Pix } from './pix.js';

export const PORTRAIT_W = 112;
export const PORTRAIT_H = 144;
const CX = PORTRAIT_W / 2;
const INK = '#160F1A';

const FACE_SPECS = [
  { id: 'round', top: 32, cheek: 43, jaw: 38, chin: 24 },
  { id: 'oval', top: 30, cheek: 40, jaw: 34, chin: 20 },
  { id: 'square', top: 36, cheek: 42, jaw: 40, chin: 30 },
  { id: 'sharp', top: 31, cheek: 40, jaw: 30, chin: 14 },
  { id: 'chubby', top: 36, cheek: 47, jaw: 43, chin: 28 },
  { id: 'cat', top: 31, cheek: 41, jaw: 31, chin: 17 },
];

const HAIR_SPECS = LENGTHS.map((part, index) => ({
  id: part.id,
  backLength: [20, 27, 34, 56, 47, 52, 38, 20, 27, 35, 47, 43, 25, 54, 32, 38, 45, 49, 51, 30, 45, 53, 54, 34, 46, 26, 55, 51, 45, 50, 42, 44, 54, 47][index],
  side: [0, 4, 7, 10, 6, 11, 9, 1, 5, 7, 10, 10, 5, 7, 8, 7, 10, 9, 11, 4, 13, 10, 12, 7, 9, 5, 12, 8, 11, 12, 8, 9, 8, 13][index],
  motif: index,
}));

const FRINGE_SPECS = FRINGES.map((part, index) => ({ id: part.id, motif: index }));
const EYE_SPECS = EYES.map((part, index) => ({ id: part.id, motif: index }));
const ACC_SPECS = ACCS.map((part, index) => ({ id: part.id, motif: index }));
const OUTFIT_SPECS = BODIES.map((part, index) => ({ id: part.id, motif: index }));
const PANTS_SPECS = PANTS.map((part, index) => ({ id: part.id, motif: index }));
const SOCK_SPECS = SOCKS.map((part, index) => ({ id: part.id, motif: index }));
const RACE_SPECS = RACE_NAMES.map((name, index) => ({ id: index, name, motif: index }));
const HAND_SPECS = HAND_NAMES.map((name, index) => ({ id: index, name, motif: index }));

/** 可审计的一对一映射清单；测试直接对照原捏脸部件 ID。 */
export const PORTRAIT_PART_MAP = Object.freeze({
  face: FACE_SPECS, eye: EYE_SPECS, fringe: FRINGE_SPECS, hairLen: HAIR_SPECS,
  acc: ACC_SPECS, race: RACE_SPECS, top: OUTFIT_SPECS, leg: PANTS_SPECS, sock: SOCK_SPECS, hand: HAND_SPECS,
});

export function portraitMappingFor(a) {
  return {
    face: FACE_SPECS[a.face % FACE_SPECS.length].id,
    eye: EYE_SPECS[a.eye % EYE_SPECS.length].id,
    fringe: FRINGE_SPECS[a.fringe % FRINGE_SPECS.length].id,
    hairLen: HAIR_SPECS[a.hairLen % HAIR_SPECS.length].id,
    acc: ACC_SPECS[(a.acc || 0) % ACC_SPECS.length].id,
    race: RACE_SPECS[a.race % RACE_SPECS.length].id,
    top: OUTFIT_SPECS[a.wear.top % OUTFIT_SPECS.length].id,
    leg: PANTS_SPECS[(a.wear.leg || 0) % PANTS_SPECS.length].id,
    sock: SOCK_SPECS[(a.wear.sock || 0) % SOCK_SPECS.length].id,
    hand: HAND_SPECS[(a.wear.hand || 0) % HAND_SPECS.length].id,
  };
}

function palette(a) {
  return {
    skin: SKINS[a.skin % SKINS.length], hair: HAIR_COLORS[a.hairC % HAIR_COLORS.length],
    eye: EYE_COLORS[a.eyeC % EYE_COLORS.length], clothA: CLOTH_COLORS[a.clothA % CLOTH_COLORS.length],
    clothB: CLOTH_COLORS[a.clothB % CLOTH_COLORS.length], accent: ACCENT_COLORS[a.accC % ACCENT_COLORS.length],
  };
}

function poly(p, points, color) {
  const minY = Math.ceil(Math.min(...points.map(([, y]) => y)));
  const maxY = Math.floor(Math.max(...points.map(([, y]) => y)));
  for (let y = minY; y <= maxY; y++) {
    const scanY = y + .5;
    const hits = [];
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % points.length];
      if ((y1 <= scanY && y2 > scanY) || (y2 <= scanY && y1 > scanY)) {
        hits.push(x1 + ((scanY - y1) * (x2 - x1)) / (y2 - y1));
      }
    }
    hits.sort((a, b) => a - b);
    for (let i = 0; i + 1 < hits.length; i += 2) {
      const left = Math.ceil(hits[i]), right = Math.floor(hits[i + 1]);
      if (right >= left) p.rect(left, y, right - left + 1, 1, color);
    }
  }
}

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function drawBackdrop(p, a, pal) {
  p.rect(0, 0, p.w, p.h, '#17162D');
  p.rect(4, 4, p.w - 8, p.h - 8, '#242342');
  p.rect(7, 7, p.w - 14, p.h - 14, mix('#242342', pal.clothA, .12));
  const seed = hash(appKey(a));
  for (let i = 0; i < 22; i++) {
    const x = 10 + ((seed + i * 37) % 92), y = 9 + ((seed * (i + 3) + i * 19) % 74);
    p.px(x, y, i % 6 === 0 ? pal.accent : '#7775A5');
  }
  p.rect(8, 119, 96, 17, mix(pal.clothA, '#0B0914', .62));
  p.rect(8, 119, 96, 2, pal.accent);
  p.frame(4, 4, p.w - 8, p.h - 8, '#8C6F95');
  p.px(5, 5, '#FFF3A8'); p.px(p.w - 6, 5, '#FFF3A8');
}

function drawBackAccessory(p, a, pal) {
  const id = (a.wear.hand || 0) % HAND_SPECS.length;
  if (id === 5) { // 武士刀
    for (let i = 0; i < 70; i++) { const x = 88 - Math.floor(i * .45), y = 34 + i; p.rect(x, y, 3, 2, INK); p.px(x + 1, y, i < 10 ? pal.accent : '#633C42'); }
    p.rect(84, 30, 12, 4, INK); p.rect(86, 29, 8, 3, pal.accent);
  } else if (id === 7) { // 背包
    p.rect(20, 82, 72, 57, INK); p.rect(24, 84, 64, 55, '#6E3C27'); p.rect(31, 76, 50, 13, INK); p.rect(34, 79, 44, 9, '#9B5B3C');
    p.rect(29, 101, 54, 4, pal.accent); p.rect(49, 105, 14, 28, '#4A3038');
  } else if (id === 11) { // 机械羽翼
    for (const side of [-1, 1]) {
      const sx = side < 0 ? 18 : 94;
      poly(p, [[56, 82], [sx, 55], [sx + side * 13, 67], [35 + (side > 0 ? 42 : 0), 93]], INK);
      poly(p, [[55, 84], [sx, 59], [sx + side * 9, 68], [38 + (side > 0 ? 36 : 0), 90]], '#8A8A9B');
      p.rect(side < 0 ? 7 : 99, 65, 7, 22, pal.accent);
    }
  }
}

function drawHairBack(p, spec, pal) {
  if (spec.id === 'bald' || spec.id === 'buzz') return;
  const y0 = 18, y1 = Math.min(122, 39 + spec.backLength);
  const width = 51 + spec.side;
  poly(p, [[CX - 25, y0 + 7], [CX - width / 2, 39], [CX - width / 2 + 3, y1], [CX, y1 + (spec.motif % 3) * 3], [CX + width / 2 - 3, y1], [CX + width / 2, 39], [CX + 25, y0 + 7]], INK);
  poly(p, [[CX - 22, y0 + 7], [CX - width / 2 + 3, 40], [CX - width / 2 + 6, y1 - 3], [CX, y1], [CX + width / 2 - 6, y1 - 3], [CX + width / 2 - 3, 40], [CX + 22, y0 + 7]], pal.hair);
  const shade = mix(pal.hair, '#090711', .42), hi = mix(pal.hair, '#FFFFFF', .3);
  p.rect(CX - width / 2 + 6, 42, 4, Math.max(6, y1 - 48), shade);
  p.rect(CX + width / 2 - 10, 39, 3, Math.max(6, y1 - 47), hi);
  if (['tail', 'lowtail', 'topknot', 'halfup'].includes(spec.id)) { p.rect(80, 35, 17, 50, INK); p.rect(82, 37, 13, 46, pal.hair); p.rect(78, 34, 17, 7, pal.accent); }
  if (['twin', 'drill', 'butterfly'].includes(spec.id)) for (const side of [-1, 1]) { const x = side < 0 ? 8 : 89; p.rect(x, 45, 15, 51, INK); p.rect(x + 2, 47, 11, 47, pal.hair); p.rect(x + 1, 43, 14, 7, pal.accent); }
  if (spec.id === 'braid' || spec.id === 'sidebraid' || spec.id === 'viking') for (let y = 55; y < y1; y += 8) { const x = spec.id === 'sidebraid' ? 84 : (y / 8) % 2 ? 29 : 76; p.disc(x, y, 5, INK); p.disc(x, y, 3, pal.hair); }
  if (spec.id === 'afro' || spec.id === 'cloud' || spec.id === 'curly') for (let i = 0; i < 14; i++) { const x = 23 + (i % 7) * 11, y = 18 + Math.floor(i / 7) * 18 + (i % 2) * 4; p.disc(x, y, spec.id === 'afro' ? 9 : 7, INK); p.disc(x, y, spec.id === 'afro' ? 7 : 5, pal.hair); }
}

function faceWidth(spec, row) {
  if (row < 5) return spec.top - (5 - row) * 3;
  if (row < 16) return Math.round(spec.top + (spec.cheek - spec.top) * ((row - 5) / 11));
  if (row < 28) return Math.round(spec.cheek + (spec.jaw - spec.cheek) * ((row - 16) / 12));
  return Math.max(spec.chin, Math.round(spec.jaw + (spec.chin - spec.jaw) * ((row - 28) / 8)));
}

function drawRaceBack(p, race, pal) {
  if (race === 1) { poly(p, [[31, 45], [7, 37], [25, 55]], INK); poly(p, [[29, 46], [11, 40], [26, 52]], pal.skin); poly(p, [[81, 45], [105, 37], [87, 55]], INK); poly(p, [[83, 46], [101, 40], [86, 52]], pal.skin); }
  if (race === 3) for (const s of [-1, 1]) { const x = CX + s * 22; poly(p, [[x, 25], [x + s * 11, 8], [x + s * 16, 31]], INK); poly(p, [[x + s, 25], [x + s * 10, 12], [x + s * 13, 29]], pal.hair); }
  if ([4, 5].includes(race)) for (const s of [-1, 1]) { const x = CX + s * 20; poly(p, [[x, 28], [x + s * 7, 6], [x + s * 15, race === 5 ? 16 : 22]], INK); poly(p, [[x + s * 2, 27], [x + s * 8, 10], [x + s * 12, race === 5 ? 17 : 22]], race === 5 ? '#4A3038' : pal.accent); }
  if (race === 6) { p.ring(CX, 13, 22, '#FFF3A8'); p.ring(CX, 14, 21, pal.accent); }
  if (race === 8) { p.disc(CX, 28, 30, mix(pal.skin, pal.accent, .28)); p.rect(30, 8, 52, 5, mix(pal.skin, '#FFFFFF', .35)); }
  if (race === 9) { p.rect(82, 27, 13, 32, INK); p.rect(84, 29, 9, 28, '#8A8A9B'); p.rect(CX, 5, 3, 18, '#8A8A9B'); p.disc(CX + 1, 5, 3, pal.accent); }
  if (race === 10) for (const s of [-1, 1]) { p.rect(CX + s * 15, 4, 2, 23, INK); p.disc(CX + s * 16, 4, 3, pal.accent); }
  if (race === 11) { poly(p, [[76, 27], [98, 16], [91, 43]], INK); poly(p, [[79, 28], [94, 20], [88, 40]], pal.accent); }
  if (race === 12) { p.ring(CX, 35, 34, pal.accent); for (let i = 0; i < 8; i++) p.disc(17 + i * 11, 13 + (i % 2) * 8, 2, '#FFF3A8'); }
  if (race === 13) { p.disc(86, 27, 10, INK); for (let i = 0; i < 6; i++) p.disc(86 + Math.round(Math.cos(i) * 8), 27 + Math.round(Math.sin(i) * 8), 4, i % 2 ? pal.accent : '#E45AD1'); }
  if (race === 14) for (const [x, y] of [[26, 31], [84, 25], [91, 49]]) { p.rect(x, y, 12, 12, INK); p.rect(x + 2, y + 2, 8, 8, '#8A8A9B'); }
  if (race === 15) for (const s of [-1, 1]) poly(p, [[CX + s * 17, 26], [CX + s * 29, 4], [CX + s * 31, 35]], mix(pal.skin, '#0B0714', .6));
}

function drawFace(p, a, pal) {
  const spec = FACE_SPECS[a.face % FACE_SPECS.length];
  const y0 = 29;
  for (let row = 0; row < 37; row++) {
    const w = faceWidth(spec, row);
    p.row(CX, y0 + row, w + 4, INK); p.row(CX, y0 + row, w, row < 4 ? mix(pal.skin, '#FFFFFF', .1) : pal.skin);
  }
  p.rect(CX - 7, 64, 14, 19, INK); p.rect(CX - 5, 64, 10, 18, pal.skin);
  p.rect(CX - 17, 55, 4, 7, mix(pal.skin, '#5C3040', .18)); p.rect(CX + 14, 55, 4, 7, mix(pal.skin, '#5C3040', .18));
  if (a.race === 7) { p.rect(35, 50, 7, 2, '#665A71'); p.rect(72, 57, 9, 2, '#665A71'); p.px(78, 59, '#665A71'); }
  if (a.race === 16) { p.rect(34, 65, 44, 15, INK); p.rect(37, 66, 38, 13, pal.hair); for (let x = 39; x < 74; x += 7) p.rect(x, 76, 4, 6, pal.hair); }
  if (a.race === 2 || a.race === 17) { p.rect(39, 66, 4, 7, '#F5F1E6'); p.rect(70, 66, 4, 7, '#F5F1E6'); }
}

function drawEyes(p, eyeIndex, pal) {
  const id = EYE_SPECS[eyeIndex % EYE_SPECS.length].id;
  const y = ['sharp', 'sleepy', 'fox', 'moon'].includes(id) ? 50 : 48;
  const h = ['big', 'droop', 'star', 'gem', 'puppy'].includes(id) ? 8 : 6;
  const w = ['sharp', 'fox', 'moon'].includes(id) ? 12 : 10;
  for (const s of [-1, 1]) {
    const x = CX + s * 13 - w / 2;
    p.rect(x - 1, y - 1, w + 2, h + 2, INK);
    if (id === 'wink' && s > 0) { p.rect(x, y + 2, w, 2, pal.eye); continue; }
    if (id === 'moon') { p.rect(x, y + 1, w, 2, pal.eye); p.rect(x + 2, y + 3, w - 4, 1, pal.eye); continue; }
    p.rect(x, y, w, h, '#F8F3E8'); p.rect(CX + s * 13 - 3, y + 1, 6, h - 1, pal.eye); p.rect(CX + s * 13 - 1, y + 1, 2, h, INK);
    p.px(CX + s * 13 - 2, y + 1, '#FFFFFF');
    if (id === 'slit') p.rect(CX + s * 13, y + 1, 1, h - 1, '#FFF3A8');
    if (id === 'mono') { p.frame(x + 1, y + 1, w - 2, h - 2, pal.accent); p.px(CX + s * 13, y + 2, '#FFFFFF'); }
    if (['star', 'glow', 'gem'].includes(id)) { p.px(CX + s * 13 - 4, y + 3, pal.accent); p.px(CX + s * 13 + 4, y + 3, pal.accent); }
    if (id === 'heart') { p.px(CX + s * 13 - 2, y + 2, '#E45AD1'); p.px(CX + s * 13 + 2, y + 2, '#E45AD1'); p.rect(CX + s * 13 - 2, y + 3, 5, 3, '#E45AD1'); }
  }
}

function drawFringe(p, fringeIndex, pal) {
  const id = FRINGE_SPECS[fringeIndex % FRINGE_SPECS.length].id;
  if (id === 'none' || id === 'upswept') return;
  p.rect(31, 24, 50, 12, INK); p.rect(33, 25, 46, 10, pal.hair);
  const shade = mix(pal.hair, '#090711', .38), hi = mix(pal.hair, '#FFFFFF', .32);
  if (id === 'straight' || id === 'himecut') { for (let x = 33; x < 80; x += 7) p.rect(x, 32, 5, 15 + (x % 3), x % 2 ? shade : pal.hair); }
  else if (id === 'part' || id === 'curtain') { poly(p, [[34, 31], [54, 27], [48, 47], [33, 39]], pal.hair); poly(p, [[78, 31], [58, 27], [64, 47], [79, 39]], shade); p.rect(55, 26, 2, 11, hi); }
  else if (id === 'short' || id === 'wispy' || id === 'crescent') for (let x = 35; x < 78; x += 8) poly(p, [[x, 30], [x + 7, 30], [x + 3, 41 + (x % 4)]], x % 3 ? pal.hair : hi);
  else if (id === 'spiky' || id === 'antenna') for (let x = 32; x < 81; x += 9) poly(p, [[x, 34], [x + 8, 27], [x + 6, 43]], x % 2 ? pal.hair : shade);
  else if (id === 'swept' || id === 'asym') poly(p, [[31, 27], [81, 25], [68, 45], [49, 38], [35, 47]], pal.hair);
  else if (id === 'braided') { for (let x = 34; x < 78; x += 7) p.disc(x, 33 + (x % 3), 4, x % 2 ? shade : pal.hair); }
  p.rect(38, 27, 22, 2, hi);
}

function drawBody(p, a, pal) {
  const top = OUTFIT_SPECS[a.wear.top % OUTFIT_SPECS.length];
  const bodyWide = [0, 4, 10][a.bd % 3];
  const left = 21 - bodyWide / 2, right = 91 + bodyWide / 2;
  poly(p, [[43, 77], [30, 81], [left, 96], [13, 137], [99, 137], [right, 96], [82, 81], [69, 77]], INK);
  poly(p, [[44, 80], [32, 84], [left + 3, 98], [17, 135], [95, 135], [right - 3, 98], [80, 84], [68, 80]], pal.clothA);
  p.rect(29, 91, 6, 41, mix(pal.clothA, '#FFFFFF', .16)); p.rect(77, 91, 6, 41, mix(pal.clothA, '#090711', .32));
  // 26 套衣装：编号决定领型、门襟与材质纹样，颜色仍完全跟随捏脸。
  const m = top.motif;
  if ([1, 4, 16, 21, 24].includes(m)) { poly(p, [[43, 80], [56, 96], [69, 80], [76, 85], [56, 105], [36, 85]], pal.clothB); p.rect(54, 95, 4, 40, pal.accent); }
  else if ([2, 9, 15, 22].includes(m)) { poly(p, [[35, 84], [56, 101], [77, 84], [69, 111], [43, 111]], pal.clothB); p.disc(56, 101, 5, pal.accent); }
  else if ([7, 19].includes(m)) { for (let y = 88; y < 126; y += 9) { p.rect(30, y, 52, 3, '#8A8A9B'); p.px(35 + (y % 5), y + 1, '#FFF3A8'); } }
  else if ([8, 20, 23, 25].includes(m)) { for (let y = 91; y < 132; y += 5) p.rect(31, y, 50, 1, y % 2 ? pal.clothB : mix(pal.clothA, '#FFFFFF', .18)); }
  else { p.rect(53, 82, 6, 53, pal.clothB); for (let y = 91; y < 128; y += 9) p.disc(56, y, 2, pal.accent); }
  if ([0, 11, 18].includes(m)) { p.rect(33, 91, 46, 42, mix(pal.clothB, '#FFFFFF', .08)); p.rect(36, 95, 40, 3, pal.accent); p.rect(52, 99, 8, 34, pal.clothB); }
  if ([3, 5, 13, 17].includes(m)) { p.rect(25, 84, 62, 8, pal.clothB); for (let x = 27; x < 86; x += 8) p.disc(x, 84, 5, mix(pal.clothB, '#FFFFFF', .14)); }
  // 裤装与袜装在下沿各保留一条明确纹样，让三分之二身立绘仍能一对一反映完整穿搭。
  const leg = PANTS_SPECS[(a.wear.leg || 0) % PANTS_SPECS.length].motif;
  const sock = SOCK_SPECS[(a.wear.sock || 0) % SOCK_SPECS.length].motif;
  p.rect(19, 132, 74, 4, leg % 2 ? pal.clothB : mix(pal.clothB, INK, .3));
  for (let x = 22 + (leg % 4); x < 92; x += 8 + (leg % 3)) p.rect(x, 132, 3, 4, pal.accent);
  p.rect(19, 136, 74, 2, sock % 3 === 0 ? '#F5F1E6' : sock % 3 === 1 ? pal.accent : mix(pal.clothA, '#FFFFFF', .32));
  for (let x = 21 + (sock % 5); x < 92; x += 6 + (sock % 4)) p.px(x, 137, sock % 2 ? pal.clothB : '#F5F1E6');
}

function drawAccessory(p, id, pal) {
  if (!id || BACK_ACCESSORY_IDS.has(id)) return;
  if (id === 1) { p.rect(7, 112, 42, 5, INK); p.rect(9, 110, 38, 5, '#C9AE8A'); p.rect(18, 103, 17, 8, '#F5F1E6'); }
  else if (id === 2) { p.rect(12, 105, 19, 25, INK); p.rect(15, 106, 13, 20, '#C9922F'); p.rect(17, 107, 9, 4, '#FFF3A8'); }
  else if (id === 3) { p.rect(91, 72, 4, 67, INK); p.rect(92, 73, 2, 64, '#8E5A2B'); p.rect(82, 126, 19, 10, '#C9A87A'); }
  else if (id === 4) { p.rect(83, 98, 23, 31, INK); p.rect(86, 101, 17, 24, '#FFF3A8'); p.rect(91, 92, 7, 8, '#8A8A9B'); }
  else if (id === 6) { p.rect(94, 46, 4, 93, INK); p.rect(95, 47, 2, 90, '#8E5A2B'); p.disc(96, 39, 12, INK); p.disc(96, 39, 8, pal.accent); p.px(96, 33, '#FFFFFF'); }
  else if (id === 8) { poly(p, [[8, 102], [38, 96], [51, 112], [22, 119]], INK); poly(p, [[11, 103], [37, 99], [47, 111], [23, 116]], pal.clothB); p.rect(28, 102, 3, 14, pal.accent); }
  else if (id === 9) { p.rect(93, 49, 3, 90, INK); poly(p, [[55, 40], [105, 39], [96, 17], [69, 18]], INK); poly(p, [[59, 38], [101, 37], [94, 21], [70, 21]], pal.clothB); p.rect(77, 20, 3, 17, pal.accent); }
  else if (id === 10) { p.rect(77, 111, 25, 27, INK); p.rect(81, 115, 17, 19, '#3A5A8C'); p.rect(84, 121, 11, 10, pal.accent); }
}

function drawFaceAccessory(p, id, pal) {
  if (!id) return;
  if ([1, 2, 3, 6].includes(id)) { const color = id === 3 ? '#17131F' : id === 6 ? pal.accent : '#8A8A9B'; p.frame(32, 45, 20, 16, color); p.frame(60, 45, 20, 16, color); p.rect(52, 50, 8, 3, color); if (id === 6) p.rect(28, 40, 57, 4, color); }
  else if (id === 4) { p.ring(70, 53, 11, pal.accent); p.rect(79, 60, 12, 2, pal.accent); }
  else if (id === 5) { p.rect(31, 46, 23, 18, INK); p.rect(52, 51, 23, 3, INK); }
  else if (id === 7) p.rect(29, 34, 55, 5, pal.accent);
  else if (id === 8) { p.rect(27, 27, 59, 16, pal.clothB); p.rect(30, 30, 53, 5, pal.accent); }
  else if (id === 9) { p.rect(29, 18, 56, 12, INK); p.rect(32, 20, 50, 9, pal.clothB); p.rect(37, 15, 32, 5, pal.accent); }
  else if (id === 10) { p.ring(83, 62, 4, pal.accent); p.rect(82, 66, 2, 9, pal.accent); }
  else if (id === 11) { poly(p, [[35, 61], [78, 61], [72, 74], [41, 74]], mix(pal.clothB, '#FFFFFF', .18)); p.rect(37, 61, 39, 2, pal.accent); }
  else if (id === 12) { p.rect(37, 60, 39, 13, '#D9DDE3'); p.rect(39, 63, 35, 2, '#8A8A9B'); }
  else if (id === 13) { p.disc(83, 31, 8, '#E45AD1'); p.disc(76, 31, 5, pal.accent); p.disc(86, 24, 5, '#F3B84B'); }
  else if (id === 14) { p.rect(37, 38, 39, 3, pal.accent); p.disc(CX, 38, 4, '#FFF3A8'); }
}

export function drawPortrait(a) {
  const p = new Pix(PORTRAIT_W, PORTRAIT_H), pal = palette(a);
  drawBackdrop(p, a, pal);
  drawBackAccessory(p, a, pal);
  drawRaceBack(p, a.race % RACE_SPECS.length, pal);
  const hair = HAIR_SPECS[a.hairLen % HAIR_SPECS.length];
  drawHairBack(p, hair, pal);
  drawBody(p, a, pal);
  drawFace(p, a, pal);
  drawEyes(p, a.eye, pal);
  drawFringe(p, a.fringe, pal);
  drawFaceAccessory(p, (a.acc || 0) % ACC_SPECS.length, pal);
  drawAccessory(p, (a.wear.hand || 0) % HAND_SPECS.length, pal);
  p.rimLight(.16); p.edgeShade(.12); p.outline(INK, 245);
  // 重画边框，避免人物描边侵入 UI 框。
  p.frame(4, 4, p.w - 8, p.h - 8, '#A4859C'); p.frame(6, 6, p.w - 12, p.h - 12, '#4F4268');
  return p;
}

const portraitCache = new Map();
export function portraitURL(a) {
  const key = appKey(a);
  const hit = portraitCache.get(key);
  if (hit) return hit;
  const url = drawPortrait(a).dataURL();
  portraitCache.set(key, url);
  if (portraitCache.size > 300) portraitCache.clear();
  return url;
}
