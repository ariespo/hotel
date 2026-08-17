// 家具：严格正上方（无透视）逐层像素绘制，一份贴图靠整数 90° 旋转得到四向。
// 打光一律「边缘暗、中心亮」的对称打光；唯一方向性的是使用面标记（旋转时应当跟着转）。
import { Pix, PAL, mix, shade } from './pix.js';
import { ao, cloth, disc3, liquid, mat, metal, planks, plate, stone, useEdge } from './mat.js';

export const T = 32; // 每格像素

/** 高清家具品质件：同一俯视模型上叠黄铜包角，II 抛光、III 金边，旋转不穿帮。 */
export function hdQualityHardware(fw, fh, quality) {
  const w = Math.max(T, fw * T), h = Math.max(T, fh * T);
  const p = new Pix(w, h);
  if (quality < 2) return p;
  const brass = quality >= 3 ? '#F3D98A' : '#C9922F';
  const dark = quality >= 3 ? '#8A5A18' : '#6A4216';
  const inset = 2;
  const arm = Math.max(6, Math.round(Math.min(w, h) * 0.2));
  const corners = [
    [inset, inset, 1, 1],
    [w - 1 - inset, inset, -1, 1],
    [inset, h - 1 - inset, 1, -1],
    [w - 1 - inset, h - 1 - inset, -1, -1],
  ];
  for (const [x, y, sx, sy] of corners) {
    const hx = sx < 0 ? x - arm : x;
    const vy = sy < 0 ? y - arm : y;
    p.rect(hx, y, arm + 1, 3, dark);
    p.rect(x, vy, 3, arm + 1, dark);
    p.rect(hx, y + (sy < 0 ? 1 : 0), arm + 1, 1, brass);
    p.rect(x + (sx < 0 ? 1 : 0), vy, 1, arm + 1, brass);
    p.px(x, y, quality >= 3 ? PAL.cream : brass);
  }
  if (quality >= 3) {
    p.rect(inset + 1, inset + 1, w - inset * 2 - 2, 1, mix(brass, '#FFFFFF', 0.25));
    p.rect(inset + 1, h - 2 - inset, w - inset * 2 - 2, 1, mix(brass, '#FFFFFF', 0.25));
    p.rect(inset + 1, inset + 1, 1, h - inset * 2 - 2, mix(brass, '#FFFFFF', 0.25));
    p.rect(w - 2 - inset, inset + 1, 1, h - inset * 2 - 2, mix(brass, '#FFFFFF', 0.25));
  }
  return p;
}

const WOOD = mat('#9B5B3C');
const WOOD_DARK = mat('#6E3C27');
const WOOD_WARM = mat('#B5763F');
const IRON = mat('#5C5A6B');
const STEEL = mat('#8A8A9B');
const BRASS_DEFAULT = '#C9922F';
let BRASS = mat(BRASS_DEFAULT);

function qualityTrim(p     , w        , h        , q        )       {
  if (q < 2) return;
  // 黄铜角件（不再用整圈霓虹边框——那看着像贴纸）
  const br = shade(BRASS.base, 0.05), brD = shade(BRASS.base, -0.45);
  for (const [x, y, sx, sy] of [[2, 2, 1, 1], [w - 3, 2, -1, 1], [2, h - 3, 1, -1], [w - 3, h - 3, -1, -1]]              ) {
    p.rect(x, y, sx * 4 > 0 ? 4 : 1, 1, brD);
    p.rect(x, y, 1, sy * 4 > 0 ? 4 : 1, brD);
    if (sx < 0) p.rect(x - 3, y, 4, 1, brD);
    if (sy < 0) p.rect(x, y - 3, 1, 4, brD);
    p.px(x, y, br);
  }
  if (q >= 3) {
    // 顶级：中缝一条黄铜镶线 + 两颗宝石
    p.rect(4, h - 5, w - 8, 1, brD);
    p.rect(4, h - 6, w - 8, 1, br);
    for (const gx of [Math.round(w * 0.32), Math.round(w * 0.68)]) {
      p.disc(gx, h - 5, 2, brD);
      p.disc(gx, h - 5, 1, PAL.cyan);
      p.px(gx, h - 6, PAL.cream);
    }
  }
}

/** 小件（1×1）的品质标记：黄铜铆钉，避免角件把小家具框成相框 */
function smallTrim(p     , cx        , y        , q        )       {
  if (q < 2) return;
  p.px(cx - 3, y, shade(BRASS.base, -0.45));
  p.px(cx - 2, y, BRASS.base);
  p.px(cx + 2, y, BRASS.base);
  p.px(cx + 3, y, shade(BRASS.base, -0.45));
  if (q >= 3) { p.disc(cx, y, 1, shade(BRASS.base, -0.4)); p.px(cx, y, PAL.cyan); }
}

/** 灶台：铸铁台面 + 火眼 + 使用面旋钮 */
function stove(p     , q        )       {
  metal(p, 0, 0, 64, 32, IRON);
  p.rect(3, 3, 58, 26, shade(IRON.base, -0.08));
  const burners = q >= 3 ? 4 : 2;
  for (let i = 0; i < burners; i++) {
    const cx = Math.round(64 / (burners + 1)) * (i + 1);
    p.disc(cx, 14, 9, shade(IRON.base, -0.4));
    p.disc(cx, 14, 8, shade(IRON.base, -0.22));
    for (let a = 0; a < 8; a++) {
      const t = (a / 8) * Math.PI * 2;
      p.rect(Math.round(cx + Math.cos(t) * 4), Math.round(14 + Math.sin(t) * 4), 2, 1, shade(IRON.base, -0.5));
    }
    p.disc(cx, 14, 4, q >= 3 ? '#7A4BE0' : '#8C3A1E');
    p.disc(cx, 14, 3, q >= 3 ? PAL.magenta : '#E8722C');
    p.disc(cx, 14, 1, PAL.hi);
    p.px(cx - 2, 12, PAL.cream);
  }
  p.rect(2, 2, 60, 1, shade(STEEL.base, 0.3));
  p.rect(2, 29, 60, 1, shade(IRON.base, -0.45));
  for (let i = 0; i < 3; i++) {
    const kx = 14 + i * 18;
    p.disc(kx, 27, 3, shade(BRASS.base, -0.45));
    p.disc(kx, 27, 2, BRASS.base);
    p.px(kx, 26, PAL.cream);
    p.px(kx, 28, shade(BRASS.base, -0.5));
  }
  useEdge(p, 64, 32, shade(PAL.honey, -0.15));
  ao(p, 0, 0, 64, 32);
  qualityTrim(p, 64, 32, q);
}

/** 备餐台：木台 + 砧板 + 食材 + 刀 + 香料罐 + 抹布 */
function prep(p     , q        )       {
  planks(p, 0, 0, 64, 32, WOOD, 11);
  const board = mat(q >= 2 ? '#E7D5A8' : '#D8B98A');
  plate(p, 6, 6, 28, 20, board);
  for (let i = 9; i < 32; i += 4) p.rect(i, 8, 1, 16, shade(board.base, -0.14));
  for (let i = 0; i < 5; i++) p.rect(10 + i * 3, 20 - i, 2, 1, shade(board.base, -0.3));
  p.disc(14, 12, 3, '#8DDB4A'); p.disc(14, 12, 1, shade('#8DDB4A', 0.4));
  p.disc(21, 11, 2, '#FF6B5A'); p.px(20, 10, PAL.cream);
  p.rect(24, 16, 6, 3, '#E8C25A'); p.rect(24, 16, 6, 1, shade('#E8C25A', 0.3));
  p.rect(38, 7, 2, 13, shade(STEEL.base, 0.35));
  p.rect(39, 7, 1, 13, PAL.white);
  p.rect(37, 20, 4, 5, shade(WOOD_DARK.base, 0.05));
  p.px(38, 22, shade(WOOD_DARK.base, -0.4));
  for (let i = 0; i < 2; i++) {
    const jx = 46 + i * 9;
    plate(p, jx, 8, 7, 10, mat(i ? '#B33C4E' : '#4C5FA8'));
    p.rect(jx + 1, 8, 5, 2, shade(PAL.cream, -0.05));
    p.px(jx + 2, 12, PAL.cream);
  }
  cloth(p, 44, 20, 16, 8, mat(q >= 3 ? '#39D7D2' : '#7FB7C9'), false);
  useEdge(p, 64, 32, shade(PAL.cream, -0.2));
  ao(p, 0, 0, 64, 32);
  qualityTrim(p, 64, 32, q);
}

/** 出餐台：保温灯 + 成品盘位 */
function pass(p     , q        )       {
  planks(p, 0, 0, 64, 32, WOOD_WARM, 5);
  p.rect(3, 3, 58, 4, shade(BRASS.base, -0.5));
  p.rect(4, 4, 56, 2, PAL.honey);
  for (let i = 6; i < 58; i += 6) p.px(i, 5, PAL.hi);
  p.rect(3, 7, 58, 1, 'rgba(243,184,75,0.35)');
  const slots = q >= 3 ? 3 : 2;
  for (let i = 0; i < slots; i++) {
    const cx = Math.round(64 / (slots + 1)) * (i + 1);
    p.disc(cx, 19, 8, shade(STEEL.base, -0.35));
    p.disc(cx, 19, 7, '#E7E2D2');
    p.disc(cx, 19, 5, PAL.white);
    p.disc(cx, 19, 3, PAL.acid);
    p.px(cx - 2, 17, PAL.hi);
    p.rect(cx - 3, 24, 6, 1, 'rgba(10,7,16,0.25)');
  }
  useEdge(p, 64, 32, PAL.acid);
  ao(p, 0, 0, 64, 32);
  qualityTrim(p, 64, 32, q);
}

/** 洗涤槽：石台 + 水池 + 龙头 + 沥水架 */
function sink(p     , q        )       {
  stone(p, 0, 0, 64, 32, STEEL, 9);
  plate(p, 5, 6, 32, 21, mat(shade(STEEL.base, -0.3)));
  liquid(p, 8, 9, 26, 15, q >= 2 ? shade(PAL.water, 0.12) : PAL.water);
  p.rect(9, 10, 24, 1, shade(PAL.water, 0.5));
  p.disc(21, 17, 2, shade(PAL.water, -0.35));
  p.rect(19, 2, 4, 6, shade(STEEL.base, -0.45));
  p.rect(20, 3, 2, 5, q >= 2 ? BRASS.base : STEEL.base);
  p.rect(19, 2, 9, 2, shade(STEEL.base, -0.45));
  p.rect(20, 3, 7, 1, q >= 2 ? shade(BRASS.base, 0.3) : shade(STEEL.base, 0.3));
  p.rect(42, 6, 18, 21, shade(STEEL.base, -0.28));
  for (let i = 0; i < 3; i++) {
    p.rect(43, 8 + i * 6, 16, 4, '#E7E2D2');
    p.rect(43, 8 + i * 6, 16, 1, PAL.white);
    p.px(45, 9 + i * 6, PAL.hi);
  }
  useEdge(p, 64, 32, shade(PAL.water, 0.2));
  ao(p, 0, 0, 64, 32);
  qualityTrim(p, 64, 32, q);
}

/** 储物架：木框 + 三格货物（麻袋/罐头/瓶子） */
function shelf(p     , q        )       {
  planks(p, 0, 0, 64, 32, WOOD_DARK, 3);
  for (let c = 0; c < 3; c++) {
    const x = 3 + c * 20;
    p.rect(x, 4, 18, 24, shade(WOOD_DARK.base, -0.45));
    p.rect(x + 1, 5, 16, 22, shade(WOOD_DARK.base, -0.3));
    if (c === 0) {
      for (const [sx, sy, r] of [[x + 6, 11, 5], [x + 12, 20, 4], [x + 5, 21, 3]]              ) {
        p.disc(sx, sy, r, shade('#D8BC85', -0.45));
        p.disc(sx, sy, r - 1, '#D8BC85');
        p.disc(sx, sy - 1, Math.max(1, r - 3), shade('#D8BC85', 0.2));
        p.px(sx, sy - r + 1, '#8E5A2B');
      }
    }
    if (c === 1) {
      for (let i = 0; i < 2; i++) {
        const jy = 7 + i * 11;
        plate(p, x + 3, jy, 12, 9, mat(i ? '#B5824B' : '#7A6A4B'));
        p.rect(x + 4, jy + 2, 10, 5, i ? PAL.coral : PAL.acid);
        p.rect(x + 4, jy + 2, 10, 1, shade(i ? PAL.coral : PAL.acid, 0.35));
      }
    }
    if (c === 2) {
      for (let i = 0; i < 3; i++) {
        const bx = x + 2 + i * 5;
        const col = i === 1 ? PAL.cyan : i === 0 ? PAL.magenta : PAL.honey;
        p.rect(bx, 8, 4, 12, shade(col, -0.35));
        p.rect(bx + 1, 9, 2, 10, col);
        p.px(bx + 1, 10, PAL.cream);
        p.rect(bx + 1, 6, 2, 2, shade(WOOD.base, -0.2));
      }
      p.rect(x + 2, 22, 14, 4, shade('#D8BC85', -0.1));
      p.rect(x + 2, 22, 14, 1, '#E7D5A8');
    }
  }
  useEdge(p, 64, 32, shade(PAL.cream, -0.3));
  // 品质差异：II 级起黄铜压条 + 增补货物，III 级挂香草串
  if (q >= 2) {
    p.rect(1, 1, 62, 2, shade(BRASS.base, -0.2));
    p.rect(1, 1, 62, 1, shade(BRASS.base, 0.25));
    p.disc(55, 9, 3, '#C9922F'); p.px(54, 8, '#F3D98A');
  }
  if (q >= 3) {
    for (const hx of [10, 16, 22]) {
      p.rect(hx, 2, 1, 3, '#5B4632');
      p.disc(hx, 6, 2, '#5B8A4E'); p.px(hx - 1, 5, '#7FB069');
    }
  }
  ao(p, 0, 0, 64, 32);
  qualityTrim(p, 64, 32, q);
}

/** 沙发：靠背 + 三坐垫 + 木脚 */
function couch(p     , q        )       {
  const frame = mat('#7A4B33');
  planks(p, 0, 0, 64, 32, frame, 17);
  const fabric = mat(q >= 3 ? '#7A4BE0' : q >= 2 ? '#B33C4E' : '#4C5FA8');
  cloth(p, 2, 2, 60, 9, mat(shade(fabric.base, -0.16)));
  for (let i = 0; i < 3; i++) cloth(p, 3 + i * 20, 12, 18, 16, fabric);
  for (let i = 0; i < 3; i++) {
    p.rect(5 + i * 20, 19, 14, 1, shade(fabric.base, -0.28));
    p.rect(5 + i * 20, 20, 14, 1, shade(fabric.base, 0.16));
  }
  if (q >= 2) for (let i = 0; i < 3; i++) { p.px(11 + i * 20, 15, PAL.cream); p.px(12 + i * 20, 16, shade(PAL.cream, -0.3)); }
  for (const x of [3, 58]) { p.rect(x, 29, 3, 2, shade(frame.base, -0.5)); p.px(x, 29, shade(frame.base, 0.2)); }
  if (q >= 3) {
    p.disc(9, 12, 4, '#F3D98A'); p.disc(9, 12, 3, '#D98E2B');
    p.disc(55, 12, 4, '#F3D98A'); p.disc(55, 12, 3, '#D98E2B');
    p.rect(3, 28, 58, 2, shade(BRASS.base, -0.15));
  }

  useEdge(p, 64, 32, shade(fabric.base, 0.35));
  ao(p, 0, 0, 64, 32);
  qualityTrim(p, 64, 32, q);
}

/** 圆餐桌：放射木纹 + 桌布 + 烛台 */
function table(p     , q        )       {
  disc3(p, 16, 16, 15, WOOD);
  for (let a = 0; a < 20; a++) {
    const t = (a / 20) * Math.PI * 2;
    for (let r = 5; r < 13; r++) {
      if ((a + r) % 3 !== 0) continue;
      p.px(Math.round(16 + Math.cos(t) * r), Math.round(16 + Math.sin(t) * r), shade(WOOD.base, a % 2 ? -0.14 : 0.1));
    }
  }
  p.ring(16, 16, 14, WOOD.ink);
  p.ring(16, 16, 13, shade(WOOD.base, -0.3));
  if (q >= 2) {
    const c = q >= 3 ? mix('#B33C4E', '#2A1A22', 0.25) : mix(PAL.cream, '#9B5B3C', 0.18);
    p.disc(16, 16, 10, shade(c, -0.3));
    p.disc(16, 16, 9, c);
    for (let a = 0; a < 12; a++) {
      const t = (a / 12) * Math.PI * 2;
      p.px(Math.round(16 + Math.cos(t) * 9), Math.round(16 + Math.sin(t) * 9), shade(c, -0.45));
    }
    for (let j = 8; j < 25; j++) for (let i = 8; i < 25; i++) {
      if ((i + j) % 6 === 0 && (i - 16) * (i - 16) + (j - 16) * (j - 16) < 64) p.px(i, j, shade(c, -0.12));
    }
  }
  p.disc(16, 17, 3, shade(BRASS.base, -0.4));
  p.disc(16, 17, 2, BRASS.base);
  p.rect(15, 11, 2, 6, PAL.cream);
  p.rect(15, 11, 2, 1, shade(PAL.cream, -0.25));
  p.px(15, 10, PAL.honey); p.px(16, 9, PAL.hi); p.px(15, 8, shade(PAL.honey, 0.4));
  if (q >= 3) {
    for (let a = 0; a < 16; a++) {
      const t = (a / 16) * Math.PI * 2;
      p.px(Math.round(16 + Math.cos(t) * 10), Math.round(16 + Math.sin(t) * 10), BRASS.base);
    }
    p.rect(14, 9, 4, 2, shade(BRASS.base, -0.1));
  }

  ao(p, 1, 1, 30, 30);
}

/** 椅子：圆角座面 + 高靠背（=朝向）+ 前腿，剪影一眼是椅子 */
function chair(p     , q        )       {
  const frame = mat('#96612F');
  const cush = mat(q >= 3 ? '#8C4BC0' : q >= 2 ? '#B33C4E' : '#7E6A46');
  // 靠背：比座面宽、顶部抹圆
  const bt = mat(shade(frame.base, -0.06));
  p.rect(5, 1, 22, 7, bt.ink);
  p.rect(6, 2, 20, 5, bt.base);
  p.rect(6, 2, 20, 1, shade(frame.base, 0.32));
  p.rect(6, 6, 20, 1, shade(frame.base, -0.4));
  for (const cx of [5, 26]) { p.ctx.clearRect(cx, 1, 1, 1); }
  // 靠背与座面之间的两根立柱
  for (const cx of [8, 23]) { p.rect(cx, 8, 2, 3, shade(frame.base, -0.35)); p.px(cx, 8, shade(frame.base, 0.15)); }
  // 座面：圆角木盘
  p.rect(7, 10, 18, 16, frame.ink);
  p.rect(8, 11, 16, 14, frame.lo);
  p.rect(8, 12, 16, 12, frame.base);
  p.rect(9, 13, 14, 10, shade(frame.base, 0.09));
  for (const [cx, cy] of [[7, 10], [24, 10], [7, 25], [24, 25], [8, 11], [23, 11], [8, 24], [23, 24]]              ) p.ctx.clearRect(cx, cy, 1, 1);
  p.rect(10, 17, 12, 1, shade(frame.base, -0.24));  // 一条木缝就够
  // 坐垫
  cloth(p, 11, 13, 10, 9, cush);
  p.px(14, 15, shade(cush.base, 0.45));
  p.rect(12, 21, 8, 1, shade(cush.base, -0.32));
  // 前腿
  for (const lx of [9, 21]) {
    p.rect(lx, 26, 3, 4, shade(frame.base, -0.5));
    p.rect(lx, 26, 1, 4, shade(frame.base, -0.28));
    p.px(lx + 2, 29, shade(frame.base, -0.62));
  }
  smallTrim(p, 16, 4, q);
  if (q >= 2) { p.disc(16, 2, 2, shade(BRASS.base, -0.1)); p.px(16, 1, '#F3D98A'); }
  if (q >= 3) { p.rect(6, 3, 1, 3, BRASS.base); p.rect(25, 3, 1, 3, BRASS.base); p.rect(8, 26, 16, 1, shade(BRASS.base, -0.1)); }

  useEdge(p, 32, 32, shade(cush.base, 0.4));
  ao(p, 5, 0, 22, 32);
}

/** 酒桶：桶顶木条 + 铁箍 + 龙头（使用面） */
function keg(p     , q        )       {
  disc3(p, 16, 15, 13, WOOD_DARK);
  for (let a = 0; a < 24; a++) {
    const t = (a / 24) * Math.PI * 2;
    for (let r = 6; r <= 12; r += 3) {
      if ((a + r) % 4 === 0) p.px(Math.round(16 + Math.cos(t) * r), Math.round(15 + Math.sin(t) * r), shade(WOOD_DARK.base, -0.2));
    }
  }
  for (let i = -12; i <= 12; i += 6) {
    for (let y = 4; y < 27; y++) {
      const dx = i, dy = y - 15;
      if (dx * dx + dy * dy > 11 * 11) continue;
      p.px(16 + dx, y, shade(WOOD_DARK.base, -0.36));
      p.px(16 + dx + 1, y, shade(WOOD_DARK.base, 0.1));
    }
  }
  p.ring(16, 15, 12, shade(IRON.base, -0.2));
  p.ring(16, 15, 11, IRON.base);
  p.ring(16, 15, 7, shade(IRON.base, -0.2));
  p.ring(16, 15, 6, IRON.base);
  p.disc(16, 15, 4, shade(WOOD_DARK.base, -0.5));
  p.disc(16, 15, 3, q >= 3 ? PAL.cyan : PAL.magenta);
  p.px(15, 14, PAL.cream);
  if (q >= 2) p.ring(16, 15, 13, shade(BRASS.base, 0.1));
  p.rect(14, 26, 4, 4, shade(IRON.base, -0.45));
  p.rect(15, 27, 2, 3, IRON.base);
  p.rect(13, 29, 6, 2, shade(BRASS.base, -0.2));
  p.rect(14, 29, 4, 1, BRASS.base);
  p.px(16, 31, PAL.honey);
  if (q >= 2) { p.rect(5, 5, 4, 5, '#D8BC85'); p.rect(5, 5, 4, 1, '#8A5A38'); p.rect(6, 10, 2, 1, '#8A5A38'); }
  if (q >= 3) { p.disc(24, 5, 3, '#5B8A4E'); p.px(23, 4, '#7FB069'); p.rect(23, 8, 3, 2, '#B5763F'); }

  ao(p, 2, 1, 28, 30);
}


/** 书架（2×1）：木框 + 两排彩色书脊 + 小摆件 */
function bookshelf(p     , q        )       {
  const frame = mat('#6E4529');
  planks(p, 0, 0, 64, 32, frame, 23);
  p.rect(3, 3, 58, 26, shade(frame.base, -0.48));
  p.rect(4, 4, 56, 24, shade(frame.base, -0.56));
  for (const y of [15, 27]) { p.rect(3, y, 58, 2, frame.base); p.rect(3, y, 58, 1, frame.hi); }
  const cols = ['#B33C4E', '#4C5FA8', '#2E5B3A', '#C9922F', '#7A4BE0', '#39A9A0', '#D98E2B', '#8DDB4A'];
  let x = 5;
  for (let i = 0; x < 57; i++) {
    const bw = 2 + (i % 2), bh = 8 + ((i * 5) % 4), c = cols[(i * 3) % cols.length];
    p.rect(x, 15 - bh, bw, bh, shade(c, -0.12));
    p.px(x, 15 - bh, shade(c, 0.3));
    x += bw + (i % 4 === 3 ? 2 : 1);
  }
  x = 5;
  for (let i = 0; x < 44; i++) {
    const bw = 2 + ((i + 1) % 2), bh = 8 + ((i * 7) % 4), c = cols[(i * 5 + 2) % cols.length];
    p.rect(x, 27 - bh, bw, bh, shade(c, -0.12));
    p.px(x, 27 - bh, shade(c, 0.3));
    x += bw + 1;
  }
  p.disc(52, 22, 4, '#2E5B3A'); p.rect(50, 24, 5, 3, '#B5763F');
  if (q >= 2) { p.rect(46, 6, 8, 9, '#F1EAE0'); p.rect(47, 7, 6, 7, '#C9922F'); }
  if (q >= 3) { p.px(49, 10, '#B33C4E'); p.px(51, 10, '#B33C4E'); p.px(48, 11, '#B33C4E'); p.px(50, 11, '#B33C4E'); p.px(52, 11, '#B33C4E'); p.px(50, 12, '#B33C4E'); }
  useEdge(p, 64, 32, shade(frame.base, 0.35));
  ao(p, 0, 0, 64, 32);
  qualityTrim(p, 64, 32, q);
}

/** 茶桌（1×1）：小圆桌 + 白瓷茶壶 + 两杯茶 */
function teatable(p     , q        )       {
  disc3(p, 16, 17, 14, WOOD_WARM);
  p.ring(16, 17, 13, WOOD_WARM.ink);
  p.disc(13, 14, 5, '#F1EAE0');
  p.ring(13, 14, 5, '#C6BBB2');
  p.rect(17, 12, 4, 2, '#F1EAE0');
  p.rect(8, 13, 2, 3, '#F1EAE0');
  p.disc(13, 10, 2, '#C6BBB2');
  p.px(11, 12, '#FFFFFF');
  p.disc(23, 21, 3, '#F1EAE0'); p.disc(23, 21, 2, '#C9922F');
  p.disc(9, 24, 3, '#F1EAE0'); p.disc(9, 24, 2, '#7FB069');
  if (q >= 2) { p.px(13, 6, '#F1EAE0'); p.px(12, 5, '#F1EAE0'); p.px(14, 4, '#F1EAE0'); }
  useEdge(p, 32, 32, shade(WOOD_WARM.base, 0.35));
  ao(p, 0, 0, 32, 32);
  qualityTrim(p, 32, 32, q);
}

/** 梳妆台（1×1）：圆镜 + 小桌 + 抽屉与台面小物 */
function vanity(p     , q        )       {
  const frame = mat('#7A4B33');
  planks(p, 3, 16, 26, 14, frame, 29);
  p.rect(6, 20, 20, 4, shade(frame.base, -0.2));
  p.px(16, 22, '#C9922F');
  // 铜框圆镜：粗框 + 内圈阴影 + 玻璃斜光（原来像颗白球，踩过）
  p.disc(16, 10, 8, shade('#C9922F', -0.5));
  p.disc(16, 10, 7, '#C9922F');
  p.disc(16, 10, 6, shade('#9AB8BC', -0.15));
  p.disc(16, 10, 5, '#BFE0E4');
  p.rect(13, 6, 1, 6, '#EAFBFC');
  p.px(14, 5, '#EAFBFC');
  p.rect(15, 16, 2, 2, shade('#C9922F', -0.3));
  p.rect(7, 13, 5, 2, '#C9922F');
  p.rect(22, 11, 3, 4, '#E45AD1'); p.px(23, 10, '#F1EAE0');
  if (q >= 2) p.disc(25, 14, 2, '#B33C4E');
  useEdge(p, 32, 32, shade(frame.base, 0.35));
  ao(p, 0, 0, 32, 32);
  qualityTrim(p, 32, 32, q);
}

/** 大银幕（2×1，放映厅）：深色边框 + 微光幕面 + 底排音响 */
function screen(p     , q        )       {
  const frame = mat('#241F30');
  metal(p, 0, 0, 64, 32, frame, false);
  // 幕面：微光渐变 + 淡淡画面
  const glowC = q >= 3 ? '#B8E8F0' : q >= 2 ? '#A8C8E0' : '#93A8C8';
  p.rect(4, 3, 56, 22, shade(glowC, -0.55));
  p.rect(5, 4, 54, 20, shade(glowC, -0.35));
  p.rect(5, 4, 54, 8, shade(glowC, -0.15));
  p.rect(5, 4, 54, 3, glowC);
  // 幕面上的剪影画面（山与月）
  p.disc(44, 10, 4, shade(glowC, -0.05));
  p.rect(5, 17, 54, 7, shade(glowC, -0.42));
  p.rect(10, 14, 12, 3, shade(glowC, -0.3));
  p.rect(28, 15, 16, 2, shade(glowC, -0.28));
  // 底排音响
  for (const x of [6, 52]) { p.rect(x, 26, 6, 5, shade(frame.base, 0.1)); p.px(x + 2, 28, shade(frame.base, -0.3)); }
  if (q >= 2) { p.rect(2, 1, 60, 1, shade(BRASS.base, -0.1)); }
  useEdge(p, 64, 32, shade(glowC, 0.2));
  ao(p, 0, 0, 64, 32);
  qualityTrim(p, 64, 32, q);
}

/** 喷泉（2×2，庭院）：圆形石池 + 涌水 + 中心喷柱 */
function fountain(p     , q        )       {
  const rock = mat(q >= 3 ? '#8A8A9B' : '#7A7A88');
  stone(p, 0, 0, 64, 64, rock, 17);
  // 外池壁
  p.disc(32, 32, 29, shade(rock.base, -0.35));
  p.disc(32, 32, 27, rock.base);
  p.disc(32, 32, 25, shade(rock.base, -0.2));
  // 池水
  p.disc(32, 32, 23, shade(PAL.water, -0.25));
  p.disc(32, 32, 21, PAL.water);
  for (let a = 0; a < 10; a++) {
    const t = (a / 10) * Math.PI * 2;
    p.px(Math.round(32 + Math.cos(t) * 16), Math.round(32 + Math.sin(t) * 16), '#EAF6FF');
  }
  // 中心喷柱与喷头
  p.disc(32, 32, 8, shade(rock.base, -0.15));
  p.disc(32, 32, 6, rock.base);
  p.rect(30, 26, 4, 6, shade(rock.base, -0.1));
  p.disc(32, 25, 3, shade(rock.base, 0.15));
  p.px(31, 24, '#EAF6FF');
  if (q >= 2) for (let a = 0; a < 8; a++) {
    const t = (a / 8) * Math.PI * 2 + 0.4;
    p.px(Math.round(32 + Math.cos(t) * 27), Math.round(32 + Math.sin(t) * 27), shade(BRASS.base, -0.1));
  }
  useEdge(p, 64, 64, shade(PAL.water, 0.2));
  ao(p, 0, 0, 64, 64);
  qualityTrim(p, 64, 64, q);
}

/** 雕像（1×1）：石座 + 小鸟石像 */
function statue(p     , q        )       {
  const rock = mat(q >= 3 ? '#9A93A8' : '#7E7A8C');
  // 基座
  p.rect(6, 22, 20, 8, rock.ink);
  p.rect(7, 23, 18, 6, rock.base);
  p.rect(7, 23, 18, 1, shade(rock.base, 0.25));
  p.rect(9, 18, 14, 5, shade(rock.base, -0.15));
  // 小鸟立像：身、头、喙、尾
  p.disc(16, 12, 5, shade(rock.base, 0.05));
  p.disc(14, 8, 3, shade(rock.base, 0.05));
  p.px(11, 8, shade(rock.base, -0.3));
  p.rect(19, 13, 5, 2, shade(rock.base, -0.1));
  p.px(13, 7, rock.ink);
  if (q >= 2) { p.rect(7, 21, 18, 1, shade(BRASS.base, -0.1)); }
  if (q >= 3) { p.px(14, 8, '#F3D98A'); }
  ao(p, 0, 0, 32, 32);
  qualityTrim(p, 32, 32, q);
}

/** 落地钟（1×1）：木壳 + 圆表盘 + 摆锤窗 */
function clock(p     , q        )       {
  const frame = mat(q >= 3 ? '#5E3A24' : '#7A4B33');
  planks(p, 6, 0, 20, 32, frame, 37);
  p.rect(6, 0, 20, 32, frame.ink);
  p.rect(7, 1, 18, 30, frame.base);
  // 表盘
  p.disc(16, 8, 6, shade(frame.base, -0.3));
  p.disc(16, 8, 5, '#F1EAE0');
  p.px(16, 8, '#2A1A22'); p.rect(16, 4, 1, 4, '#2A1A22'); p.rect(16, 8, 3, 1, '#2A1A22');
  // 摆锤窗
  p.rect(11, 16, 10, 12, shade(frame.base, -0.45));
  p.rect(12, 17, 8, 10, '#2A1A22');
  p.rect(15, 18, 2, 6, shade(BRASS.base, -0.2));
  p.disc(16, 25, 2, BRASS.base);
  if (q >= 2) { p.rect(6, 0, 20, 1, shade(BRASS.base, 0.1)); }
  ao(p, 0, 0, 32, 32);
  qualityTrim(p, 32, 32, q);
}

/** 挂旗（1×1）：旗杆横杆 + 垂旗 + 纹章 */
function banner(p     , q        )       {
  const clothC = q >= 3 ? '#7A4BE0' : q >= 2 ? '#B33C4E' : '#4C5FA8';
  // 横杆
  p.rect(4, 2, 24, 2, shade(WOOD_DARK.base, -0.1));
  p.disc(4, 3, 2, shade(BRASS.base, -0.1)); p.disc(28, 3, 2, shade(BRASS.base, -0.1));
  // 旗面（下缘尖角）
  p.rect(7, 4, 18, 22, shade(clothC, -0.3));
  p.rect(8, 4, 16, 21, clothC);
  p.px(8, 25, clothC); p.px(23, 25, clothC);
  for (let x = 9; x < 23; x += 2) { p.px(x, 26, clothC); p.px(x + 1, 25, clothC); }
  // 纹章：菱形
  p.px(15, 10, PAL.cream); p.rect(14, 11, 3, 3, PAL.cream); p.px(15, 14, PAL.cream);
  p.rect(8, 4, 16, 1, shade(clothC, 0.25));
  if (q >= 2) { p.rect(8, 4, 1, 21, shade(BRASS.base, -0.05)); p.rect(23, 4, 1, 21, shade(BRASS.base, -0.05)); }
  ao(p, 0, 0, 32, 32);
  qualityTrim(p, 32, 32, q);
}

/** 水族箱（2×1）：玻璃缸 + 水 + 小鱼 + 水草 */
function aquarium(p     , q        )       {
  const frame = mat('#5E4632');
  planks(p, 0, 26, 64, 6, frame, 13);                 // 底柜
  p.rect(2, 2, 60, 25, '#0E1A24');                    // 缸体边框
  p.rect(4, 4, 56, 21, shade(PAL.water, -0.5));       // 水（深）
  p.rect(4, 4, 56, 10, shade(PAL.water, -0.3));       // 上层较亮
  p.rect(4, 4, 56, 2, shade(PAL.water, 0.1));         // 水面线
  // 水草
  for (const gx of [10, 14, 48]) { p.rect(gx, 16, 2, 8, '#3E7A3A'); p.rect(gx + 2, 18, 2, 6, '#5B8A4E'); }
  p.rect(6, 22, 52, 2, '#C9B48A');                    // 底砂
  // 两条小鱼
  const fc = q >= 3 ? '#E45AD1' : q >= 2 ? '#E4732C' : '#F3B84B';
  p.rect(20, 11, 5, 2, fc); p.px(25, 11, fc); p.px(19, 10, fc);
  p.rect(38, 17, 4, 2, shade(fc, -0.2)); p.px(42, 17, shade(fc, -0.2));
  // 玻璃反光
  p.rect(7, 5, 2, 18, 'rgba(255,255,255,0.18)');
  p.rect(11, 5, 1, 18, 'rgba(255,255,255,0.10)');
  if (q >= 2) { p.rect(2, 2, 60, 1, shade(BRASS.base, -0.1)); }
  ao(p, 0, 0, 64, 32);
  qualityTrim(p, 64, 32, q);
}

/** 酒柜（2×1）：木柜 + 三层藏酒 */
function winecabinet(p     , q        )       {
  const frame = mat(q >= 3 ? '#4E2E1E' : '#6E4529');
  planks(p, 0, 0, 64, 32, frame, 19);
  p.rect(3, 3, 58, 26, shade(frame.base, -0.5));
  for (const y of [11, 20]) { p.rect(3, y, 58, 2, frame.base); p.rect(3, y, 58, 1, frame.hi); }
  // 瓶子：两层
  const cols = ['#5B8A4E', '#7A2E3E', '#3A4E8A', '#8A6A2E'];
  for (let i = 0; i < 7; i++) {
    const c = cols[i % cols.length];
    p.rect(6 + i * 8, 5, 3, 6, shade(c, -0.15)); p.rect(7 + i * 8, 3, 1, 2, shade(c, 0.2));
  }
  for (let i = 0; i < 7; i++) {
    const c = cols[(i + 2) % cols.length];
    p.rect(6 + i * 8, 14, 3, 6, shade(c, -0.15)); p.rect(7 + i * 8, 12, 1, 2, shade(c, 0.2));
  }
  // 底层抽屉
  p.rect(5, 23, 24, 5, shade(frame.base, -0.2)); p.px(17, 25, BRASS.base);
  p.rect(35, 23, 24, 5, shade(frame.base, -0.2)); p.px(47, 25, BRASS.base);
  if (q >= 2) { p.rect(1, 1, 62, 1, shade(BRASS.base, -0.1)); }
  ao(p, 0, 0, 64, 32);
  qualityTrim(p, 64, 32, q);
}

/** 花坛（2×1，庭院）：木框 + 沃土 + 花丛 */
function flowerbed(p     , q        )       {
  const frame = mat('#8A5A38');
  planks(p, 0, 0, 64, 32, frame, 41);
  p.rect(3, 3, 58, 26, shade(frame.base, -0.4));
  p.rect(4, 4, 56, 24, '#4E3220');                    // 土
  for (let i = 0; i < 12; i++) p.px(6 + (i * 37 % 52), 6 + (i * 13 % 20), 'rgba(20,12,6,0.5)');
  // 花：颜色随品质
  const c1 = q >= 3 ? '#E45AD1' : q >= 2 ? '#E4737F' : '#F3D98A';
  const c2 = q >= 3 ? '#8DDB4A' : '#FFF6E0';
  for (let i = 0; i < 5; i++) {
    const x = 10 + i * 11, y = 10 + (i % 2) * 9;
    p.rect(x, y + 3, 1, 5, '#3E7A3A');
    p.px(x - 1, y, c1); p.px(x + 1, y, c1); p.px(x, y - 1, c1); p.px(x, y + 1, c1); p.px(x, y, c2);
  }
  for (let i = 0; i < 4; i++) {
    const x = 14 + i * 12, y = 20 + (i % 2) * 4;
    p.rect(x, y + 2, 1, 4, '#3E7A3A');
    p.px(x - 1, y, c2); p.px(x + 1, y, c2); p.px(x, y - 1, c2); p.px(x, y, c1);
  }
  if (q >= 2) { p.rect(1, 1, 62, 1, shade(BRASS.base, -0.1)); }
  ao(p, 0, 0, 64, 32);
  qualityTrim(p, 64, 32, q);
}

/** 长椅（2×1）：木板条 + 铁艺腿 */
function bench(p     , q        )       {
  const wood = mat(q >= 3 ? '#6E4529' : '#96612F');
  // 靠背板条
  for (let i = 0; i < 3; i++) {
    p.rect(3, 3 + i * 4, 58, 3, wood.ink);
    p.rect(4, 3 + i * 4, 56, 2, wood.base);
    p.rect(4, 3 + i * 4, 56, 1, shade(wood.base, 0.25));
  }
  // 座面板条
  for (let i = 0; i < 3; i++) {
    p.rect(3, 17 + i * 4, 58, 3, wood.ink);
    p.rect(4, 17 + i * 4, 56, 2, shade(wood.base, -0.05));
  }
  // 铁艺侧架
  for (const x of [4, 56]) {
    p.rect(x, 1, 3, 29, '#3A3542');
    p.rect(x, 14, 3, 3, '#3A3542');
    p.disc(x + 1, 1, 2, '#4A4552');
  }
  if (q >= 2) { p.rect(4, 15, 56, 1, shade(BRASS.base, -0.1)); }
  ao(p, 0, 0, 64, 32);
  qualityTrim(p, 64, 32, q);
}

/** 望远镜（2×1，星象台）：三脚架 + 斜指长镜筒 + 黄铜目镜 */
function telescope(p     , q        )       {
  const frame = mat('#6E4529');
  // 三脚架
  for (const [x0, x1] of [[24, 14], [32, 32], [40, 50]]              ) {
    p.rect(Math.min(x0, x1), 26, Math.abs(x1 - x0) + 2, 2, shade(frame.base, -0.2));
    p.rect(Math.min(x0, x1), 26, Math.abs(x1 - x0) + 2, 1, frame.base);
  }
  p.disc(32, 26, 3, shade(frame.base, -0.15));
  // 镜筒（斜指右上）
  const tube = q >= 3 ? '#C9922F' : q >= 2 ? '#8A8A9B' : '#5C5A6B';
  for (let i = 0; i < 7; i++) {
    const x = 18 + i * 4, y = 22 - i * 3, w = 7 - (i > 4 ? 1 : 0);
    p.rect(x, y, 6, w, shade(tube, -0.25));
    p.rect(x, y, 6, 2, tube);
    p.rect(x, y, 6, 1, shade(tube, 0.3));
  }
  // 目镜与主镜口
  p.rect(14, 22, 5, 5, shade(BRASS.base, -0.2));
  p.rect(44, 1, 5, 6, shade(BRASS.base, 0.1));
  p.rect(45, 2, 3, 4, '#BFE0E4');
  if (q >= 2) { p.rect(20, 18, 20, 1, shade(BRASS.base, 0.1)); }
  useEdge(p, 64, 32, shade(BRASS.base, 0.3));
  ao(p, 0, 0, 64, 32);
  qualityTrim(p, 64, 32, q);
}

/** 街机（1×1，游艺厅）：彩壳机台 + 闪光屏 + 摇杆按钮 */
function arcadem(p     , q        )       {
  const body = mat(q >= 3 ? '#7A4BE0' : q >= 2 ? '#B33C4E' : '#2E5B8A');
  // 机身
  p.rect(5, 1, 22, 30, shade(body.base, -0.4));
  p.rect(6, 1, 20, 29, body.base);
  p.rect(6, 1, 20, 2, shade(body.base, 0.3));       //  marquee
  p.px(9, 2, PAL.cream); p.px(12, 2, PAL.cyan); p.px(15, 2, PAL.magenta); p.px(18, 2, PAL.hi);
  // 屏幕
  p.rect(8, 5, 16, 12, '#101426');
  p.rect(9, 6, 14, 10, '#2E4A6B');
  p.px(11, 8, PAL.cyan); p.px(13, 10, PAL.hi); p.px(17, 8, PAL.magenta); p.px(19, 12, PAL.cyan); p.px(15, 13, PAL.cream);
  // 台面：摇杆 + 按钮
  p.rect(6, 18, 20, 4, shade(body.base, -0.2));
  p.px(11, 19, '#2A1A22'); p.px(11, 18, '#B33C4E');
  p.px(17, 19, '#F3B84B'); p.px(20, 19, '#8DDB4A'); p.px(23, 19, PAL.cyan);
  if (q >= 2) { p.rect(5, 23, 22, 2, shade(BRASS.base, -0.15)); }
  if (q >= 3) { p.px(6, 1, '#F3D98A'); p.px(25, 1, '#F3D98A'); }
  useEdge(p, 32, 32, shade(body.base, 0.4));
  ao(p, 0, 0, 32, 32);
  qualityTrim(p, 32, 32, q);
}

/** 炼金釜（2×1，炼金房）：圆肚铜釜 + 绿汤 + 木架 */
function cauldron(p     , q        )       {
  // 支架
  for (const [x0, x1] of [[16, 8], [32, 32], [48, 56]]              ) {
    p.rect(Math.min(x0, x1), 24, Math.abs(x1 - x0) + 2, 3, shade(WOOD_DARK.base, -0.2));
  }
  // 釜体
  const pot = mat(q >= 3 ? '#5A4A6B' : '#3E3A46');
  p.disc(32, 17, 15, pot.ink);
  p.disc(32, 16, 14, pot.base);
  p.disc(32, 14, 12, shade(pot.base, 0.12));
  // 汤面
  const brew = q >= 3 ? '#E45AD1' : q >= 2 ? '#8DDB4A' : '#39D7D2';
  p.disc(32, 13, 10, shade(brew, -0.3));
  p.disc(32, 13, 9, brew);
  p.disc(28, 11, 2, shade(brew, 0.3)); p.disc(36, 14, 2, shade(brew, 0.25)); p.disc(32, 15, 1, shade(brew, 0.35));
  // 釜耳
  p.rect(15, 14, 4, 3, pot.ink); p.rect(45, 14, 4, 3, pot.ink);
  if (q >= 2) { p.disc(32, 13, 10, ''); p.ring(32, 16, 14, shade(BRASS.base, -0.1)); }
  useEdge(p, 64, 32, shade(brew, 0.3));
  ao(p, 0, 0, 64, 32);
  qualityTrim(p, 64, 32, q);
}

/** 水晶簇（1×1）：底岩 + 三根棱柱水晶 */
function crystal(p     , q        )       {
  const rock = mat('#5A5064');
  p.disc(16, 26, 12, shade(rock.base, -0.3));
  p.disc(16, 25, 11, rock.base);
  const c = q >= 3 ? '#E45AD1' : q >= 2 ? '#39D7D2' : '#7A9BE0';
  // 三根水晶：梯形棱柱
  const spike = (x        , y        , h        , w        )       => {
    for (let i = 0; i < h; i++) {
      const ww = Math.max(1, Math.round(w * (1 - i / h)));
      p.rect(x - (ww >> 1), y - i, ww, 1, i < 2 ? shade(c, -0.3) : c);
    }
    p.px(x, y - h, shade(c, 0.4));
  };
  spike(16, 22, 14, 6);
  spike(9, 24, 9, 5);
  spike(23, 24, 10, 5);
  // 高光
  p.px(15, 14, '#FFFFFF'); p.px(9, 20, '#FFFFFF'); p.px(23, 19, '#FFFFFF');
  ao(p, 0, 0, 32, 32);
  qualityTrim(p, 32, 32, q);
}

/** 街机屏闪帧 */
function arcadePix(f        )      {
  const p = new Pix(16, 12);
  const cols = [PAL.cyan, PAL.magenta, '#F3B84B', '#8DDB4A'];
  for (let i = 0; i < 4; i++) {
    const x = (i * 5 + f * 3) % 15, y = (i * 3 + f * 2) % 10;
    p.px(x, y, cols[(i + f) % 4]);
    if (i % 2) p.px(x + 1, y, cols[(i + f) % 4]);
  }
  return p;
}

/** 设备工作动效帧：火焰（灶台/壁炉） */
function flamePix(f        )      {
  const p = new Pix(14, 16);
  const lean = [2, 0, -2][f % 3];
  for (let y = 2; y < 16; y++) {
    const t = y / 16;
    const w = Math.round(1.5 + Math.sin(t * Math.PI) * 4.5);
    const cx = 7 + Math.round(lean * (1 - t) * (1 - t));
    p.row(cx, y, w * 2, '#E4732C');
    if (y > 6) p.row(cx, y, Math.max(2, w - 1), '#F3B84B');
    if (y > 10) p.row(cx, y, 2, '#FFF3A8');
  }
  return p;
}

/** 气泡帧（酒桶打酒时） */
function bubblePix(f        )      {
  const p = new Pix(10, 14);
  for (let i = 0; i < 3; i++) {
    const y = 12 - ((f * 4 + i * 5) % 14);
    const x = 3 + ((i * 3 + f) % 4);
    p.disc(x, y, 1, '#EAF6FF');
  }
  p.rect(4, 12, 3, 2, '#C9922F');
  return p;
}

/** 水花帧（洗涤槽洗涮时） */
function splashPix(f        )      {
  const p = new Pix(12, 10);
  const h = [2, 4, 3][f % 3];
  p.px(3, 8 - h, '#EAF6FF'); p.px(8, 7 - h, '#EAF6FF');
  p.px(5, 9 - h, PAL.water); p.px(6, 8 - h, '#EAF6FF');
  for (let x = 1; x < 11; x += 2) p.px(x, 8, PAL.water);
  return p;
}

/** 设备动效帧入口：返回 null 表示该设备没有动效 */
export function equipAnimPix(kind        , f        )             {
  if (kind === 'stove' || kind === 'fireplace') return flamePix(f);
  if (kind === 'keg') return bubblePix(f);
  if (kind === 'sink') return splashPix(f);
  if (kind === 'fountain') return splashPix(f);
  if (kind === 'aquarium') return bubblePix(f);
  if (kind === 'cauldron') return bubblePix(f);
  if (kind === 'arcadem') return arcadePix(f);
  return null;
}

const DRAW                                              = {
  stove, prep, pass, sink, shelf, couch, table, chair, keg,
  fireplace, plant, lamp, bunk, icebox, lightbar, lightcol, bed, pool, billiardtable, piano, desk,
  bookshelf, teatable, vanity,
  doublebed, kingbed,
  screen, fountain, statue, clock, banner,
  aquarium, winecabinet, flowerbed, bench,
  telescope, arcadem, cauldron, crystal,
};


/** 壁炉（2×1）：石砌炉膛 + 柴堆 + 火焰（对称打光，无透视） */
function fireplace(p     , q        )       {
  const rock = mat('#6B6472');
  stone(p, 0, 0, 64, 32, rock, 11);
  p.rect(2, 2, 60, 28, shade(rock.base, -0.1));
  // 炉膛
  const mouthW = q >= 3 ? 34 : 28;
  const x0 = Math.round(32 - mouthW / 2);
  p.rect(x0, 6, mouthW, 20, '#160F12');
  p.rect(x0 + 1, 7, mouthW - 2, 18, '#241318');
  // 柴
  for (let i = 0; i < 4; i++) {
    const wx = x0 + 4 + i * Math.round((mouthW - 10) / 4);
    p.rect(wx, 20, 5, 3, shade(WOOD_DARK.base, -0.25));
    p.rect(wx, 20, 5, 1, shade(WOOD_DARK.base, 0.12));
  }
  // 火焰：中心亮、两侧暗，天然对称
  const flames = q >= 3 ? 3 : 2;
  for (let i = 0; i < flames; i++) {
    const fx = Math.round(32 + (i - (flames - 1) / 2) * 9);
    const hh = 9 + (i === Math.floor(flames / 2) ? 3 : 0);
    for (let y = 0; y < hh; y++) {
      const wdt = Math.max(1, Math.round((hh - y) / 2.2));
      const c = y < 2 ? '#FFF3A8' : y < 5 ? '#F3B84B' : '#E4732C';
      p.rect(fx - wdt, 19 - y, wdt * 2, 1, c);
    }
  }
  // 炉台与炉架
  p.rect(x0 - 2, 26, mouthW + 4, 3, shade(rock.base, -0.35));
  p.rect(x0 - 2, 26, mouthW + 4, 1, shade(rock.base, 0.18));
  p.rect(x0, 25, mouthW, 1, shade(IRON.base, -0.2));
  for (let i = x0 + 2; i < x0 + mouthW; i += 4) p.rect(i, 23, 1, 3, IRON.base);
  if (q >= 2) { p.rect(6, 4, 52, 1, shade(BRASS.base, -0.3)); p.rect(6, 5, 52, 1, BRASS.base); }
  ao(p, 0, 0, 64, 32);
  qualityTrim(p, 64, 32, q);
}

/** 位面盆栽（1×1）：陶盆 + 叶片（叶片左右成对，旋转不露馅） */
function plant(p     , q        )       {
  const pot = mat('#B0603C');
  p.disc(16, 24, 8, shade(pot.base, -0.45));
  p.disc(16, 24, 7, pot.base);
  p.rect(9, 18, 14, 3, shade(pot.base, 0.14));
  p.rect(9, 21, 14, 1, shade(pot.base, -0.3));
  p.disc(16, 20, 6, shade('#3A2A22', 0));
  const leaf = q >= 3 ? '#7A4BE0' : q >= 2 ? '#8DDB4A' : '#5E9E3F';
  // 主干
  p.rect(15, 8, 2, 12, shade(leaf, -0.45));
  // 成对叶片
  for (const [dy, len] of [[9, 7], [12, 8], [15, 6]]              ) {
    for (const sgn of [-1, 1]) {
      for (let i = 1; i <= len; i++) {
        const yy = dy + Math.round(i * 0.45);
        p.px(16 + sgn * i, yy, i > len - 2 ? shade(leaf, -0.3) : leaf);
        if (i < len - 1) p.px(16 + sgn * i, yy + 1, shade(leaf, -0.18));
      }
    }
  }
  p.px(16, 7, shade(leaf, 0.3));
  if (q >= 3) { p.px(13, 10, PAL.cream); p.px(19, 13, PAL.cream); }
  smallTrim(p, 16, 28, q);
  ao(p, 0, 0, 32, 32);
}

/** 星灯（1×1）：铜座 + 发光灯罩，中心最亮 */
function lamp(p     , q        )       {
  p.disc(16, 27, 7, shade(BRASS.base, -0.5));
  p.disc(16, 27, 6, shade(BRASS.base, -0.15));
  p.rect(15, 16, 2, 11, shade(BRASS.base, -0.3));
  p.rect(15, 16, 1, 11, BRASS.base);
  const glow = q >= 3 ? PAL.cyan : q >= 2 ? '#F3B84B' : '#E8C25A';
  p.disc(16, 12, 8, shade(BRASS.base, -0.5));
  p.disc(16, 12, 7, shade(glow, -0.35));
  p.disc(16, 12, 5, glow);
  p.disc(16, 12, 3, mix(glow, PAL.cream, 0.6));
  p.px(16, 12, PAL.cream);
  for (let a = 0; a < 8; a++) {
    const t = (a / 8) * Math.PI * 2;
    p.px(Math.round(16 + Math.cos(t) * 9), Math.round(12 + Math.sin(t) * 9), mix(glow, '#241D33', 0.45));
  }
  if (q >= 3) p.ring(16, 12, 10, mix(glow, '#241D33', 0.6));
  smallTrim(p, 16, 30, q);
}

/** 双层床（2×1）：员工休息位，铁架 + 两层床垫 + 枕头 */
/** 大床（2×1，休息室）：客床同款横式——床头板在左、枕头、被子右铺，配色更居家 */
function bunk(p     , q        )       {
  const frame = mat('#8A5A38');
  planks(p, 0, 0, 64, 32, frame, 25);
  // 床头板（左侧立板 + 上下柱头）
  p.rect(1, 1, 7, 30, shade(frame.base, -0.25));
  p.rect(1, 1, 7, 1, shade(frame.base, 0.3));
  p.disc(4, 4, 3, shade(frame.base, -0.1)); p.disc(4, 4, 2, shade(frame.base, 0.25));
  p.disc(4, 28, 3, shade(frame.base, -0.1)); p.disc(4, 28, 2, shade(frame.base, 0.25));
  // 床垫
  p.rect(8, 4, 51, 24, shade('#F1EAE0', -0.12));
  p.rect(8, 4, 51, 23, '#F1EAE0');
  // 枕头
  p.rect(10, 7, 12, 18, shade(PAL.cream, -0.25));
  p.rect(11, 8, 10, 16, PAL.cream);
  p.rect(11, 14, 10, 1, shade(PAL.cream, -0.15));
  p.px(12, 9, '#FFFFFF');
  // 被子：居家绿/暖橙配色
  const quilt = mat(q >= 3 ? '#8C4BC0' : q >= 2 ? '#D98E2B' : '#5B8A4E');
  p.rect(24, 5, 34, 23, shade(quilt.base, -0.35));
  p.rect(25, 6, 33, 21, quilt.base);
  cloth(p, 24, 5, 5, 23, mat(shade(quilt.base, 0.18)));
  for (let y = 9; y < 27; y += 5) p.rect(30, y, 27, 1, shade(quilt.base, -0.18));
  p.rect(25, 6, 33, 1, shade(quilt.base, 0.28));
  if (q >= 2) {
    p.rect(50, 6, 3, 21, shade(BRASS.base, -0.05));
    // 叠在床尾的小毯子
    p.rect(54, 8, 5, 17, '#F1EAE0');
    p.rect(54, 8, 5, 2, shade(quilt.base, 0.3));
  }
  p.rect(60, 3, 3, 26, shade(frame.base, -0.15));
  p.rect(60, 3, 3, 1, shade(frame.base, 0.2));
  useEdge(p, 64, 32, shade(quilt.base, 0.4));
  ao(p, 0, 0, 64, 32);
  qualityTrim(p, 64, 32, q);
}

function icebox(p     , q        )       {
  metal(p, 0, 0, 64, 32, STEEL);
  p.rect(2, 2, 60, 28, shade(STEEL.base, -0.06));
  // 两扇门（左右对称）
  for (const x0 of [4, 34]) {
    p.rect(x0, 5, 26, 22, shade(STEEL.base, -0.2));
    p.rect(x0 + 1, 6, 24, 20, shade('#BFD8E4', 0));
    p.rect(x0 + 1, 6, 24, 1, '#E8F4FA');
    // 霜斑
    for (let i = 0; i < 14; i++) {
      const fx = x0 + 3 + ((i * 7) % 20), fy = 8 + ((i * 5) % 16);
      p.px(fx, fy, '#F2FBFF');
      if (i % 3 === 0) p.px(fx + 1, fy + 1, '#DCEEF7');
    }
  }
  // 中缝与把手
  p.rect(31, 4, 2, 24, shade(STEEL.base, -0.45));
  for (const hx of [27, 36]) { p.rect(hx, 12, 2, 9, shade(IRON.base, -0.3)); p.rect(hx, 12, 1, 9, BRASS.base); }
  // 制冷格栅
  for (let i = 6; i < 58; i += 4) p.rect(i, 28, 2, 2, shade(STEEL.base, -0.35));
  if (q >= 3) { p.disc(16, 16, 3, mix(PAL.cyan, '#0E1A22', 0.25)); p.disc(48, 16, 3, mix(PAL.cyan, '#0E1A22', 0.25)); }
  useEdge(p, 64, 32, PAL.cyan);
  ao(p, 0, 0, 64, 32);
  qualityTrim(p, 64, 32, q);
}


/** 灯光条（2×1）：金属灯槽 + 发光灯管，灯管色＝房间风格点缀色（BRASS 已按风格替换） */
function lightbar(p     , q        )       {
  const glow = BRASS.base;
  metal(p, 0, 10, 64, 12, IRON, false);
  p.rect(2, 12, 60, 8, shade(IRON.base, -0.25));
  // 灯管：中心最亮，两端收暗（对称，旋转安全）
  const tubeH = q >= 3 ? 6 : q >= 2 ? 5 : 4;
  const y0 = 16 - Math.floor(tubeH / 2);
  p.rect(4, y0, 56, tubeH, shade(glow, -0.45));
  p.rect(5, y0 + 1, 54, tubeH - 2, glow);
  p.rect(6, y0 + 1, 52, 1, mix(glow, '#FFFFFF', 0.6));
  for (let i = 8; i < 56; i += 8) p.rect(i, y0 + 1, 2, tubeH - 2, mix(glow, '#FFFFFF', 0.35));
  // 端盖
  for (const x of [0, 60]) { p.rect(x, y0 - 2, 4, tubeH + 4, shade(IRON.base, -0.35)); p.rect(x, y0 - 1, 4, 1, STEEL.base); }
  // 溢光（上下对称，旋转后仍然对称）
  p.rect(3, y0 - 2, 58, 1, mix(glow, '#241D33', 0.55));
  p.rect(3, y0 + tubeH + 1, 58, 1, mix(glow, '#241D33', 0.55));
  if (q >= 2) { p.rect(2, 11, 60, 1, shade(BRASS.base, -0.1)); p.rect(2, 20, 60, 1, shade(BRASS.base, -0.35)); }
  if (q >= 3) for (let i = 6; i < 58; i += 12) { p.px(i, 12, mix(glow, '#FFFFFF', 0.7)); p.px(i, 19, mix(glow, '#FFFFFF', 0.7)); }
  ao(p, 0, 10, 64, 12);
}

/** 光柱（1×1）：立式灯柱，四面同形，旋转无痕 */
function lightcol(p     , q        )       {
  const glow = BRASS.base;
  // 底座
  p.disc(16, 26, 8, shade(IRON.base, -0.5));
  p.disc(16, 26, 7, IRON.base);
  p.disc(16, 26, 5, shade(IRON.base, 0.15));
  // 柱体：中心亮、边缘暗
  const w = q >= 3 ? 10 : q >= 2 ? 8 : 6;
  const x0 = 16 - w / 2;
  p.rect(x0 - 1, 4, w + 2, 22, shade(glow, -0.55));
  p.rect(x0, 5, w, 21, shade(glow, -0.15));
  p.rect(x0 + 1, 5, w - 2, 21, glow);
  p.rect(16 - 1, 5, 2, 21, mix(glow, '#FFFFFF', 0.55));
  for (let y = 7; y < 25; y += 4) p.rect(x0, y, w, 1, mix(glow, '#241D33', 0.35));
  // 顶帽
  p.rect(x0 - 2, 2, w + 4, 3, shade(IRON.base, -0.3));
  p.rect(x0 - 2, 2, w + 4, 1, STEEL.base);
  p.disc(16, 3, 1, mix(glow, '#FFFFFF', 0.8));
  if (q >= 2) { p.rect(x0 - 2, 24, w + 4, 1, shade(BRASS.base, -0.1)); }
  smallTrim(p, 16, 29, q);
  ao(p, 6, 24, 20, 6);
}


/** 客床（2×1）：木床架 + 被褥 + 两端对称枕头 */
function bed(p     , q        )       {
  const frame = mat('#7A4B33');
  // 床体木框（横向：头在左、尾在右）
  planks(p, 0, 0, 64, 32, frame, 21);
  // 床头板（左侧立板 + 上下两枚柱头）
  p.rect(1, 1, 7, 30, shade(frame.base, -0.25));
  p.rect(1, 1, 7, 1, shade(frame.base, 0.3));
  p.disc(4, 4, 3, shade(frame.base, -0.1)); p.disc(4, 4, 2, shade(frame.base, 0.25));
  p.disc(4, 28, 3, shade(frame.base, -0.1)); p.disc(4, 28, 2, shade(frame.base, 0.25));
  // 床垫
  p.rect(8, 4, 51, 24, shade('#F1EAE0', -0.12));
  p.rect(8, 4, 51, 23, '#F1EAE0');
  // 枕头（靠左居中，滚边 + 中缝 + 高光）
  p.rect(10, 7, 12, 18, shade(PAL.cream, -0.25));
  p.rect(11, 8, 10, 16, PAL.cream);
  p.rect(11, 14, 10, 1, shade(PAL.cream, -0.15));
  p.px(12, 9, '#FFFFFF');
  // 被子：从左 1/3 处盖到床尾，左侧翻折一道 + 横向压褶
  const quilt = mat(q >= 3 ? '#7A4BE0' : q >= 2 ? '#B33C4E' : '#4C7FA8');
  p.rect(24, 5, 34, 23, shade(quilt.base, -0.35));
  p.rect(25, 6, 33, 21, quilt.base);
  cloth(p, 24, 5, 5, 23, mat(shade(quilt.base, 0.18)));
  for (let y = 9; y < 27; y += 5) p.rect(30, y, 27, 1, shade(quilt.base, -0.18));
  p.rect(25, 6, 33, 1, shade(quilt.base, 0.28));
  if (q >= 2) p.rect(50, 6, 3, 21, shade(BRASS.base, -0.05));   // 床尾压边
  // 床尾板（右侧，略低）
  p.rect(60, 3, 3, 26, shade(frame.base, -0.15));
  p.rect(60, 3, 3, 1, shade(frame.base, 0.2));
  useEdge(p, 64, 32, shade(quilt.base, 0.4));
  ao(p, 0, 0, 64, 32);
  qualityTrim(p, 64, 32, q);
}

/** 大床（2×2，横向）：左床头板 + 上下双枕 + 大被右铺 */
function doublebed(p     , q        )       {
  const frame = mat('#6E4529');
  planks(p, 0, 0, 64, 64, frame, 33);
  // 床头板（左侧，通高 + 内嵌板）
  p.rect(1, 1, 9, 62, shade(frame.base, -0.2));
  p.rect(1, 1, 9, 2, shade(frame.base, 0.28));
  p.rect(3, 6, 5, 52, shade(frame.base, -0.35));
  // 床垫
  p.rect(10, 4, 49, 56, shade('#F1EAE0', -0.12));
  p.rect(10, 4, 49, 55, '#F1EAE0');
  // 上下两个枕头
  for (const y0 of [8, 34]) {
    p.rect(12, y0, 12, 22, shade(PAL.cream, -0.25));
    p.rect(13, y0 + 1, 10, 20, PAL.cream);
    p.rect(13, y0 + 10, 10, 1, shade(PAL.cream, -0.15));
    p.px(14, y0 + 3, '#FFFFFF');
  }
  // 大被：左缘翻折 + 横褶 + 上下中缝
  const quilt = mat(q >= 3 ? '#7A4BE0' : q >= 2 ? '#B33C4E' : '#4C7FA8');
  p.rect(26, 5, 32, 54, shade(quilt.base, -0.35));
  p.rect(27, 6, 31, 53, quilt.base);
  cloth(p, 26, 5, 5, 54, mat(shade(quilt.base, 0.18)));
  for (let y = 10; y < 58; y += 8) p.rect(32, y, 25, 1, shade(quilt.base, -0.18));
  p.rect(27, 31, 31, 1, shade(quilt.base, -0.3));
  if (q >= 2) p.rect(52, 6, 3, 53, shade(BRASS.base, -0.05));
  p.rect(60, 3, 3, 58, shade(frame.base, -0.15));
  useEdge(p, 64, 64, shade(quilt.base, 0.4));
  ao(p, 0, 0, 64, 64);
  qualityTrim(p, 64, 64, q);
}

/** 豪华大床（3×2，横向）：软包钮扣床头 + 双枕长抱枕 + 床尾毯 */
function kingbed(p     , q        )       {
  const frame = mat('#5E3A24');
  planks(p, 0, 0, 96, 64, frame, 41);
  // 软包床头（左侧通高）：分格 + 钮扣点
  p.rect(1, 1, 13, 62, shade(frame.base, -0.3));
  p.rect(2, 2, 11, 60, q >= 2 ? '#7A4B5E' : '#6E5A46');
  for (let x = 4; x < 12; x += 4) for (let y = 6; y < 60; y += 9) p.px(x, y, 'rgba(20,10,14,0.55)');
  p.rect(1, 1, 13, 1, shade(frame.base, 0.3));
  // 床垫
  p.rect(14, 4, 77, 56, shade('#F1EAE0', -0.12));
  p.rect(14, 4, 77, 55, '#F1EAE0');
  // 上下双大枕 + 长抱枕
  for (const y0 of [8, 36]) {
    p.rect(16, y0, 14, 26, shade(PAL.cream, -0.25));
    p.rect(17, y0 + 1, 12, 24, PAL.cream);
    p.px(18, y0 + 3, '#FFFFFF');
  }
  const bolster = q >= 2 ? '#B33C4E' : '#4C7FA8';
  p.rect(32, 20, 7, 26, shade(bolster, -0.2));
  p.rect(32, 20, 2, 26, shade(bolster, 0.25));
  p.disc(35, 20, 3, shade(bolster, -0.3)); p.disc(35, 45, 3, shade(bolster, -0.3));
  // 大被 + 床尾毯（右侧）
  const quilt = mat(q >= 3 ? '#8C4BC0' : q >= 2 ? '#B33C4E' : '#4C7FA8');
  p.rect(40, 5, 50, 54, shade(quilt.base, -0.35));
  p.rect(41, 6, 49, 53, quilt.base);
  cloth(p, 40, 5, 5, 54, mat(shade(quilt.base, 0.18)));
  for (let y = 12; y < 58; y += 9) p.rect(46, y, 43, 1, shade(quilt.base, -0.18));
  p.rect(72, 6, 6, 53, shade(BRASS.base, -0.15));
  p.rect(72, 6, 6, 1, shade(BRASS.base, 0.25));
  for (let y = 10; y < 58; y += 8) p.px(74, y, shade(BRASS.base, 0.1));
  p.rect(92, 3, 3, 58, shade(frame.base, -0.15));
  useEdge(p, 96, 64, shade(quilt.base, 0.4));
  ao(p, 0, 0, 96, 64);
  qualityTrim(p, 96, 64, q);
}

/** 汤池（2×2）：石砌池沿 + 温泉水 + 蒸汽白点，四向对称 */
function pool(p     , q        )       {
  const rock = mat('#6E6A78');
  stone(p, 0, 0, 64, 64, rock, 7);
  // 池沿：一圈石块（对称）
  for (let i = 0; i < 64; i += 8) {
    p.rect(i, 1, 7, 5, shade(rock.base, i % 16 ? 0.08 : -0.1));
    p.rect(i, 58, 7, 5, shade(rock.base, i % 16 ? -0.08 : 0.06));
    p.rect(1, i, 5, 7, shade(rock.base, i % 16 ? 0.06 : -0.12));
    p.rect(58, i, 5, 7, shade(rock.base, i % 16 ? -0.1 : 0.08));
  }
  // 水面
  const water = q >= 3 ? '#4FBFD9' : q >= 2 ? '#4AA8C8' : '#3E8FAE';
  p.rect(6, 6, 52, 52, shade(water, -0.42));
  liquid(p, 7, 7, 50, 50, water);
  // 同心涟漪（居中，旋转不变）
  for (const r of [20, 14, 8]) p.ring(32, 32, r, 'rgba(255,255,255,0.16)');
  p.disc(32, 32, 3, mix(water, '#FFFFFF', 0.35));
  // 蒸汽白点（四角对称）
  for (const [dx, dy] of [[10, 10], [10, -10], [-10, 10], [-10, -10]]              ) {
    p.px(32 + dx, 32 + dy, 'rgba(255,255,255,0.5)');
    p.px(32 + dx, 32 + dy - 1, 'rgba(255,255,255,0.28)');
  }
  if (q >= 2) {
    // 池心汤口 + 黄铜口沿
    p.ring(32, 32, 5, shade(BRASS.base, -0.35));
    p.disc(32, 32, 2, mix('#FFFFFF', water, 0.4));
  }
  if (q >= 3) for (const [x, y] of [[10, 10], [53, 10], [10, 53], [53, 53]]              ) {
    p.disc(x, y, 2, shade(BRASS.base, -0.3)); p.px(x, y, PAL.cream);
  }
  ao(p, 0, 0, 64, 64);
}

/** 台球桌（2×1）：绿绒台面 + 木边框 + 六个袋口 + 球 */
function billiardtable(p     , q        )       {
  const frame = mat('#5E3A24');
  planks(p, 0, 0, 64, 32, frame, 15);
  const felt = mat(q >= 3 ? '#1E7A4A' : q >= 2 ? '#1E7040' : '#256B44');
  cloth(p, 4, 4, 56, 24, felt);
  p.rect(4, 4, 56, 1, shade(felt.base, 0.22));
  p.rect(4, 27, 56, 1, shade(felt.base, -0.3));
  // 袋口：四角 + 长边中点（左右上下都对称）
  for (const [x, y] of [[6, 6], [57, 6], [6, 25], [57, 25], [32, 6], [32, 25]]              ) {
    p.disc(x, y, 3, '#1B1220');
    p.disc(x, y, 2, '#0C0913');
    p.px(x, y - 2, shade(frame.base, 0.25));
  }
  // 球：黑白红三色，沿中线对称摆
  for (const [x, c] of [[20, '#F5F1E6'], [26, '#D8404F'], [38, '#F3B84B'], [44, '#2A1A22']]                      ) {
    p.disc(x, 16, 2, shade(c, -0.45));
    p.disc(x, 16, 1, c);
    p.px(x, 15, mix(c, '#FFFFFF', 0.6));
  }
  // 球杆架痕（中线）
  p.rect(30, 12, 4, 1, shade(felt.base, -0.18));
  p.rect(30, 20, 4, 1, shade(felt.base, -0.18));
  useEdge(p, 64, 32, shade(felt.base, 0.4));
  ao(p, 0, 0, 64, 32);
  qualityTrim(p, 64, 32, q);
}

/** 星尘钢琴（2×1）：黑漆琴身 + 琴键 + 黄铜烛台 */
function piano(p     , q        )       {
  const body = mat('#2A2233');
  plate(p, 0, 0, 64, 32, body);
  p.rect(2, 2, 60, 28, shade(body.base, 0.06));
  // 上盖高光（中心亮）
  p.rect(6, 4, 52, 8, shade(body.base, 0.16));
  p.rect(10, 5, 44, 3, shade(body.base, 0.3));
  // 琴键：白键 + 黑键（严格对称排布）
  p.rect(6, 16, 52, 11, shade(PAL.cream, -0.3));
  p.rect(6, 17, 52, 9, PAL.cream);
  for (let i = 0; i < 13; i++) p.rect(6 + i * 4, 17, 1, 9, shade(PAL.cream, -0.45));
  for (let i = 0; i < 13; i++) { if (i % 7 === 2 || i % 7 === 6) continue; p.rect(8 + i * 4, 17, 2, 5, '#1B1220'); }
  p.rect(6, 26, 52, 1, shade(body.base, -0.4));
  // 星尘纹（居中）
  p.disc(32, 9, 2, shade(BRASS.base, -0.2));
  p.px(32, 9, PAL.cream);
  for (const dx of [-8, 8]) { p.px(32 + dx, 8, PAL.hi); p.px(32 + dx, 10, shade(PAL.hi, -0.4)); }
  if (q >= 2) { p.rect(4, 14, 56, 1, shade(BRASS.base, -0.1)); p.rect(4, 15, 56, 1, shade(BRASS.base, -0.45)); }
  if (q >= 3) for (const x of [12, 52]) { p.rect(x, 4, 2, 6, shade(BRASS.base, -0.15)); p.px(x, 3, PAL.hi); p.px(x + 1, 3, PAL.hi); }
  if (q >= 3) for (const cx of [10, 54]) {
    p.rect(cx - 1, 1, 3, 6, BRASS.base); p.rect(cx - 2, 1, 5, 1, shade(BRASS.base, 0.2));
    p.px(cx, 0, '#FFF3A8');
  }

  useEdge(p, 64, 32, shade(PAL.cream, -0.1));
  ao(p, 0, 0, 64, 32);
}


/** 前台柜台（2×1）：木质台面 + 黄铜压边 + 登记簿与叫客铃（左右对称，靠 useEdge 提示服务面） */
function desk(p     , q        )       {
  const wood = mat('#6B4430');
  planks(p, 0, 0, 64, 32, wood, 11);
  // 台面：中段抬亮，前后收边
  p.rect(0, 0, 64, 3, shade(wood.base, -0.34));
  p.rect(0, 29, 64, 3, shade(wood.base, -0.4));
  p.rect(4, 6, 56, 18, shade(wood.base, 0.16));
  p.rect(8, 8, 48, 12, shade(wood.base, 0.26));
  // 黄铜压边（上下对称两条）
  metal(p, 2, 4, 60, 2, BRASS, false);
  metal(p, 2, 26, 60, 2, BRASS, false);
  // 登记簿（左）＋叫客铃（右）：镜像位置，避免看起来有透视
  p.rect(12, 11, 12, 9, shade(PAL.cream, -0.2));
  p.rect(13, 12, 10, 7, PAL.cream);
  p.rect(17, 12, 1, 7, shade(PAL.cream, -0.35));
  for (let i = 0; i < 3; i++) p.rect(14, 13 + i * 2, 3, 1, 'rgba(60,40,60,0.5)');
  p.disc(46, 16, 4, shade(BRASS.base, -0.28));
  p.disc(46, 16, 3, BRASS.base);
  p.px(45, 14, PAL.hi); p.px(46, 14, PAL.hi);
  p.rect(45, 11, 2, 2, shade(BRASS.base, -0.4));
  if (q >= 2) { p.rect(4, 6, 56, 1, shade(BRASS.base, -0.1)); p.rect(30, 8, 4, 12, shade(BRASS.base, -0.3)); }
  if (q >= 3) for (const x of [6, 56]) { p.rect(x, 9, 2, 12, shade(BRASS.base, -0.2)); p.px(x, 8, PAL.hi); p.px(x + 1, 8, PAL.hi); }
  if (q >= 3) {
    p.disc(52, 7, 3, shade(BRASS.base, 0.1)); p.px(51, 5, '#F3D98A'); p.rect(51, 10, 3, 1, shade(BRASS.base, -0.3));
    p.rect(8, 4, 10, 7, '#F1EAE0'); p.rect(9, 5, 8, 1, '#9A93B4'); p.rect(9, 7, 8, 1, '#C6BBB2');
  }

  useEdge(p, 64, 32, shade(PAL.honey, -0.1));
  ao(p, 0, 0, 64, 32);
}

export const FURN_SIZE                                   = {
  stove: [2, 1], prep: [2, 1], pass: [2, 1], sink: [2, 1], shelf: [2, 1], couch: [2, 1],
  bookshelf: [2, 1], teatable: [1, 1], vanity: [1, 1],
  doublebed: [2, 2], kingbed: [3, 2],
  screen: [2, 1], fountain: [2, 2], statue: [1, 1], clock: [1, 1], banner: [1, 1],
  aquarium: [2, 1], winecabinet: [2, 1], flowerbed: [2, 1], bench: [2, 1],
  telescope: [2, 1], arcadem: [1, 1], cauldron: [2, 1], crystal: [1, 1],
  fireplace: [2, 1], bunk: [2, 1], icebox: [2, 1], lightbar: [2, 1],
  bed: [2, 1], billiardtable: [2, 1], piano: [2, 1], pool: [2, 2], desk: [2, 1],
  table: [1, 1], chair: [1, 1], keg: [1, 1], plant: [1, 1], lamp: [1, 1], lightcol: [1, 1],
};

const cache = new Map             ();
export function furnPix(kind        , quality        , accent = BRASS_DEFAULT)      {
  const key = kind + quality + '|' + accent;
  const hit = cache.get(key);
  if (hit) return hit;
  const [w, h] = FURN_SIZE[kind] || [1, 1];
  const p = new Pix(w * T, h * T);
  const fn = DRAW[kind];
  BRASS = mat(accent);            // 镶边色随房间装修风格
  if (fn) fn(p, quality);
  BRASS = mat(BRASS_DEFAULT);
  cache.set(key, p);
  return p;
}

/** 各房间的墙面主色（壁纸） */
export const ROOM_WALL                         = {
  foyer: '#4A4058', dining: '#8C6B4A', kitchen: '#6E7A82', storage: '#6B5A45',
  bar: '#5A3A4A', lounge: '#57604F',
  guestroom: '#7A6650', parlor: '#5C3C55', onsen: '#4E6B78', billiard: '#4A3A2E', corridor: '#5A5064',
  theater: '#3E3A55', garden: '#5E7A4E', observatory: '#2E2A4E', arcade: '#2A2A44', alchemy: '#3E2E4A',
};

/** 墙体贴图：外墙（8px，壁纸+踢脚线）/ 内墙（5px）。horiz=沿 x 铺 */
const wallCache = new Map             ();
export function wallPix(kind               , roomKind        , horiz         , wallColor = '', trim = '')      {
  const key = `${kind}|${roomKind}|${horiz ? 'h' : 'v'}|${wallColor}|${trim}`;
  const hit = wallCache.get(key);
  if (hit) return hit;
  const th = kind === 'ext' ? 8 : 5;
  const p = new Pix(horiz ? T : th, horiz ? th : T);
  const paper = wallColor || ROOM_WALL[roomKind] || ROOM_WALL.dining;
  const m = mat(paper);
  const put = (off        , len        , c        )       => {
    if (horiz) p.rect(0, off, T, len, c); else p.rect(off, 0, len, T, c);
  };
  const putSeg = (along        , off        , alen        , olen        , c        )       => {
    if (horiz) p.rect(along, off, alen, olen, c); else p.rect(off, along, olen, alen, c);
  };
  put(0, 1, '#0C0913');
  put(1, Math.max(1, th - 3), m.lo);
  put(2, Math.max(1, th - 5), m.base);
  if (kind === 'ext') {
    for (let i = 0; i < T; i += 8) putSeg(i, 2, 1, Math.max(1, th - 5), shade(m.base, -0.22));
    for (let i = 4; i < T; i += 8) putSeg(i, 3, 1, 1, shade(m.base, 0.2));
    put(th - 3, 1, shade(m.base, -0.4));
    put(th - 2, 1, mix(paper, '#3A2A30', 0.55));
    put(th - 1, 1, shade(m.base, 0.22));
  } else {
    for (let i = 2; i < T; i += 6) putSeg(i, 1, 2, Math.max(1, th - 3), shade(m.base, -0.16));
    put(th - 2, 1, mix(paper, '#3A2A30', 0.5));
    put(th - 1, 1, shade(m.base, 0.18));
  }
  if (trim) {
    // 风格镶边：贴着地面那侧一条辉光线（内墙也画，房间轮廓因此发光）
    put(th - 2, 1, trim);
    put(th - 1, 1, mix(trim, '#0C0913', 0.45));
    for (let i = 3; i < T; i += 7) putSeg(i, 2, 2, 1, mix(trim, paper, 0.35));
  }
  wallCache.set(key, p);
  return p;
}

/** 门框 + 地垫（沿通行方向铺） */
const doorCache = new Map             ();
export function doorPix(horiz         )      {
  const key = horiz ? 'h' : 'v';
  const hit = doorCache.get(key);
  if (hit) return hit;
  const p = new Pix(horiz ? T : 10, horiz ? 10 : T);
  const jamb = mat('#7A4B33');
  if (horiz) {
    plate(p, 0, 0, T, 10, jamb);
    p.rect(2, 3, T - 4, 4, mix('#2A1A22', PAL.honey, 0.25));
    for (let i = 3; i < T - 3; i += 4) p.px(i, 5, shade(PAL.honey, -0.15));
    p.rect(0, 0, T, 1, '#0C0913'); p.rect(0, 9, T, 1, '#0C0913');
  } else {
    plate(p, 0, 0, 10, T, jamb);
    p.rect(3, 2, 4, T - 4, mix('#2A1A22', PAL.honey, 0.25));
    for (let j = 3; j < T - 3; j += 4) p.px(5, j, shade(PAL.honey, -0.15));
    p.rect(0, 0, 1, T, '#0C0913'); p.rect(9, 0, 1, T, '#0C0913');
  }
  doorCache.set(key, p);
  return p;
}

/** 脏污（3 档扩散） */
export function dirtPix(level        )      {
  const p = new Pix(T, T);
  const n = 5 + level * 6;
  let s = 1234 + level * 77;
  const rnd = ()         => { s = (s * 1103515245 + 12345) & 0x7fffffff; return (s % 1000) / 1000; };
  for (let i = 0; i < n; i++) {
    const x = 4 + rnd() * 24, y = 4 + rnd() * 24, r = 1 + rnd() * (1 + level);
    p.disc(Math.round(x), Math.round(y), Math.round(r), 'rgba(90,74,54,0.72)');
  }
  for (let i = 0; i < 3; i++) p.px(Math.round(6 + rnd() * 20), Math.round(6 + rnd() * 20), 'rgba(141,219,74,0.5)');
  return p;
}

/** 桌上的菜 / 脏盘 */
export function platePix(color        , dirty         )      {
  const p = new Pix(16, 16);
  p.disc(8, 8, 7, dirty ? '#54535F' : shade('#E7E2D2', -0.35));
  p.disc(8, 8, 6, dirty ? '#8A8A9B' : '#E7E2D2');
  p.disc(8, 8, 5, dirty ? '#6F6E80' : PAL.white);
  if (!dirty) {
    p.disc(8, 8, 3, color);
    p.disc(8, 7, 2, shade(color, 0.2));
    p.px(7, 6, PAL.hi);
    p.px(10, 10, shade(color, -0.35));
  } else {
    p.px(6, 7, '#5A4A36'); p.px(10, 9, '#5A4A36'); p.px(8, 11, '#6B5A45');
  }
  return p;
}
