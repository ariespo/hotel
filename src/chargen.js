// 外观模型：捏脸＝脸型 × 眼睛 × 刘海 × 发型长度（＋衣装与配色）
// 脸上只有皮肤和眼睛，没有鼻子、嘴巴、眉毛（用户指定）；画法规格来自 .uploads/image-25..29 的逐像素测量。
import { BASE, BODIES, HANDS, PANTS, SOCKS } from './body.js';
import {
  CANVAS_H, CANVAS_W, CX, colorFor, drawFace, drawHairUnder, EYES, FACES, FEET_Y, FRINGES,
                 LENGTHS, outline,               paintSpans,            ACCS, ACC_NAMES as FACE_ACC_NAMES, paintSpansL } from './face.js';
import { mix, Pix, Rng } from './pix.js';

export { CANVAS_H, CANVAS_W, FEET_Y };

                                                                                  
                          
                                                             
                                                     
                                                                                          
                                                                  
                 
                                                                                                                
  

export const SKINS = ['#F6E2D2', '#F2C9A8', '#E0A878', '#C4835A', '#8E5A3B', '#5E3A28',
  '#FBF3EA', '#E8DCE4', '#CFE0D2', '#D8CBE8', '#A8B4C8', '#E8D2A8'];
export const HAIR_COLORS = ['#241A20', '#3A2A30', '#5A3A24', '#8E5A2B', '#C8873B', '#F0C060',
  '#F3EDE2', '#CBB3AD', '#B0B6C2', '#6B7C8C', '#3A5A8C', '#7B3A8C', '#B02A3A', '#F0A8C0', '#8CD8E8', '#A8D8B0'];
export const EYE_COLORS = ['#8E3A3A', '#C0392B', '#B0208C', '#7B3AD8', '#3A6AD8', '#2AA0C8',
  '#2AB88A', '#8DC63F', '#E0A020', '#E86A20', '#8A8A9B', '#3A2A2A'];
export const CLOTH_COLORS = ['#2A2434', '#151320', '#4A3038', '#6E3C27', '#9B5B3C', '#C9922F', '#F3B84B',
  '#FFE6B0', '#E7E2D2', '#8A8A9B', '#3A5A8C', '#39D7D2', '#7B3A8C', '#E45AD1', '#8DDB4A', '#2E5B3A', '#B02A3A', '#722B2C'];
export const ACCENT_COLORS = ['#C9922F', '#E7E2D2', '#8A8A9B', '#9B8B6B', '#5C5A6B', '#39D7D2', '#F3B84B', '#B02A3A'];

export const ACC_NAMES = FACE_ACC_NAMES;
export const FACE_NAMES = FACES.map((f) => f.name);
export const EYE_NAMES = EYES.map((e) => e.name);
export const FRINGE_NAMES = FRINGES.map((f) => f.name);
export const HAIRLEN_NAMES = LENGTHS.map((l) => l.name);
export const BODY_NAMES = BODIES.map((b) => b.name);
export const PANTS_NAMES = PANTS.map((b) => b.name);
export const SOCK_NAMES = SOCKS.map((b) => b.name);
export const RACE_NAMES = ['人类', '精灵', '兽人', '猫族', '龙裔', '恶魔', '天使', '亡灵', '史莱姆',
  '机械体', '虫族', '鱼人', '星灵', '花妖', '石魔', '幽影', '矮人', '巨人', '吸血鬼'];
export const HT_NAMES = ['矮', '中', '高'];
export const BD_NAMES = ['瘦', '标准', '胖'];
// 旧存档仍使用 wear.hand 字段；界面语义已从“手持物”扩展为可分层绘制的“配饰”。
// 只在末尾追加，确保既有存档中的 1~4 仍对应原来的服务道具。
export const HAND_NAMES = ['无', '服务托盘', '玻璃酒杯', '旅店扫帚', '星火提灯',
  '背负武士刀', '星辉法杖', '冒险者背包', '浮空魔导书', '月影纸伞', '炼金腰瓶', '机械羽翼'];
export const BACK_ACCESSORY_IDS = new Set([5, 7, 11]);

                                                                                                                                                           
export const THEMES             = [
  { id: 'cyber', name: '赛博', hairC: [14, 13, 8, 11], eyeC: [5, 2, 6], clothA: [1, 0, 10], clothB: [11, 13, 9], accC: [5, 4, 2], outfit: [0, 2, 4] },
  { id: 'ancient', name: '古风', hairC: [0, 1, 2], eyeC: [0, 8, 11], clothA: [16, 17, 3], clothB: [7, 8, 5], accC: [0, 6, 3], outfit: [1, 5, 0] },
  { id: 'magic', name: '魔幻', hairC: [6, 7, 15, 9], eyeC: [3, 4, 6], clothA: [12, 0, 15], clothB: [6, 8, 11], accC: [6, 1, 0], outfit: [2, 4, 1] },
];
export function themeById(id        )                  { return THEMES.find((t) => t.id === id) || null; }

;                                                                               

function palOf(a            )          {
  return {
    skin: SKINS[a.skin % SKINS.length],
    hair: HAIR_COLORS[a.hairC % HAIR_COLORS.length],
    eye: EYE_COLORS[a.eyeC % EYE_COLORS.length],
    clothA: CLOTH_COLORS[a.clothA % CLOTH_COLORS.length],
    clothB: CLOTH_COLORS[a.clothB % CLOTH_COLORS.length],
    accent: ACCENT_COLORS[a.accC % ACCENT_COLORS.length],
  };
}

// ---------------- 种族附加件（对称，画在头发之下） ----------------
// 种族外观：**画在头发/脸之后**（发量放大后压在下面会整条看不见——这就是"种族影响消失"的原因）
// 头部件（正背两面都画）
const RACE_PARTS                         = {
  1: [[15, 3, 'xdd'], [16, 2, 'xdss'], [17, 1, 'xdsss'], [18, 2, 'xdss'], [19, 3, 'xds']],            // 精灵：长尖耳外伸
  2: [[15, 4, 'xdd'], [16, 3, 'xdss'], [17, 4, 'xds'], [18, 5, 'xd']],                               // 兽人：厚耳
  3: [[1, 12, 'XK'], [2, 11, 'XKKK'], [3, 11, 'XHpp'], [4, 10, 'XHHpp'], [5, 10, 'XHHHH'], [6, 10, 'XDHHH']], // 猫族：猫耳（内耳粉）
  4: [[2, 8, 'XM'], [3, 8, 'XMm'], [4, 7, 'XMmm'], [5, 7, 'XMm'], [6, 7, 'XM'], [7, 8, 'Xm']],       // 龙裔：短角
  5: [[0, 6, 'Xff'], [1, 5, 'XfKK'], [2, 5, 'XKKK'], [3, 4, 'XKKKK'], [4, 4, 'XKKKK'], [5, 4, 'XKKK'],
      [6, 5, 'XKKK'], [7, 5, 'XKKK'], [8, 6, 'XKK'], [9, 6, 'XKK'], [10, 7, 'XKK'], [11, 8, 'XK']],  // 恶魔：粗黑巨角（骨白尖）
  6: [[0, 12, 'MMMMMM'], [1, 12, 'mmmmmm'], [15, 6, 'XF'], [16, 6, 'XF']],                            // 天使：光环＋鬓羽
  8: [[3, 12, 'XGG'], [4, 11, 'XGGGG'], [5, 11, 'XSGGG'], [6, 12, 'XGGG']],                          // 史莱姆：头顶胶质
  9: [[0, 15, 'XM'], [1, 15, 'XM'], [2, 15, 'Xm'], [14, 2, 'XMM'], [15, 2, 'XMm'], [16, 2, 'Xmm'], [17, 3, 'Xm']], // 机械体：天线＋侧板
  10: [[0, 10, 'XM'], [1, 10, 'XM'], [2, 11, 'XM'], [3, 11, 'XM'], [4, 12, 'Xm']],                    // 虫族：触角
  11: [[13, 1, 'XM'], [14, 0, 'XMm'], [15, 0, 'XmM'], [16, 1, 'Xm'], [17, 2, 'Xm']],                  // 鱼人：头鳍
  12: [[0, 13, 'XM'], [1, 12, 'XMSM'], [2, 13, 'XM'], [3, 9, 'XM'], [4, 16, 'XM']],                   // 星灵：星芒
  13: [[3, 8, 'XpM'], [4, 7, 'XppM'], [5, 7, 'XpM'], [6, 8, 'Xp']],                                   // 花妖：侧花
  14: [[13, 7, 'Xff'], [14, 6, 'Xfff'], [15, 6, 'Xff'], [16, 7, 'Xf']],                               // 石魔：岩块
  15: [[0, 12, 'XKX'], [1, 12, 'XKK'], [2, 13, 'XK'], [3, 13, 'XK']],                                 // 幽影：影焰
  18: [[15, 3, 'xdd'], [16, 2, 'xdss'], [17, 1, 'xdsss'], [18, 2, 'xdss'], [19, 3, 'xds']],           // 吸血鬼：长尖耳
};

// 脸部件（只画正面）
const RACE_FACE                         = {
  2: [[23, 11, '.S'], [24, 11, 'SS'], [25, 12, 'S']],                                                  // 兽人：獠牙
  7: [[22, 12, 'x'], [23, 12, 'xx'], [24, 13, 'x'], [25, 12, 'xK']],                                   // 亡灵：凹颊＋裂痕
  16: [[23, 11, 'XHHHHHH'], [24, 11, 'XHHHHHH'], [25, 11, 'XHHHHHH'], [26, 11, 'XDHHHHH'],
       [27, 12, 'XHHHHH'], [28, 12, 'XDHHHH'], [29, 13, 'XHHHH'], [30, 13, 'XDHH'], [31, 14, 'XHH'], [32, 15, 'XD']], // 矮人：大胡子
  17: [[22, 11, '.S'], [23, 11, 'SS'], [24, 12, 'S'], [16, 10, 'XxD'], [17, 11, 'Xx']],                // 巨人：上獠牙＋重眉骨
  18: [[25, 12, 'S..S']],                                                                               // 吸血鬼：小獠牙
};

// ---------------- 配饰：背负层 / 手持层 ----------------
function selectedAccessory(a            )        { return a.wear.hand || 0; }

function drawBackAccessory(p     , a            , dy        )       {
  const id = selectedAccessory(a);
  if (!BACK_ACCESSORY_IDS.has(id)) return;
  const ink = '#120C16';
  const pal = palOf(a);
  if (id === 5) { // 背负武士刀：刀鞘从肩后斜落到腰侧
    for (let i = 0; i < 34; i++) {
      const x = 45 - Math.floor(i / 2), y = 15 + i + dy;
      p.px(x, y, ink); p.px(x + 1, y, i < 5 ? pal.accent : '#4A3038');
    }
    p.rect(43, 12 + dy, 5, 2, ink); p.rect(44, 11 + dy, 3, 2, pal.accent);
    p.rect(26, 48 + dy, 6, 2, ink); p.rect(27, 49 + dy, 4, 2, '#8A8A9B');
  } else if (id === 7) { // 冒险者背包
    p.rect(23, 29 + dy, 18, 23, ink); p.rect(24, 30 + dy, 16, 21, '#6E3C27');
    p.rect(26, 27 + dy, 12, 5, ink); p.rect(27, 28 + dy, 10, 4, '#9B5B3C');
    p.rect(25, 35 + dy, 14, 2, pal.accent); p.rect(26, 43 + dy, 12, 6, '#4A3038');
    p.rect(31, 42 + dy, 2, 8, pal.accent);
  } else if (id === 11) { // 机械羽翼
    const metal = '#8A8A9B', glow = pal.accent;
    p.rect(19, 30 + dy, 7, 3, ink); p.rect(14, 27 + dy, 8, 3, metal); p.rect(9, 23 + dy, 8, 3, glow);
    p.rect(18, 34 + dy, 8, 3, ink); p.rect(12, 36 + dy, 9, 3, metal); p.rect(7, 41 + dy, 8, 3, glow);
    p.rect(38, 30 + dy, 7, 3, ink); p.rect(42, 27 + dy, 8, 3, metal); p.rect(47, 23 + dy, 8, 3, glow);
    p.rect(38, 34 + dy, 8, 3, ink); p.rect(43, 36 + dy, 9, 3, metal); p.rect(49, 41 + dy, 8, 3, glow);
    p.rect(30, 29 + dy, 4, 15, ink); p.rect(31, 30 + dy, 2, 13, glow);
  }
}

function drawFrontAccessory(p     , a            , carry               , dy        )       {
  const equipped = selectedAccessory(a);
  const id = carry ? (carry === 'mug' ? 2 : 1) : (BACK_ACCESSORY_IDS.has(equipped) ? 0 : equipped);
  if (!id) return;
  const x = 18, y = 44 + dy;
  const ink = '#120C16';
  const pal = palOf(a);
  if (id === 1) { p.rect(x - 4, y, 11, 1, ink); p.rect(x - 3, y + 1, 9, 2, '#C9AE8A'); p.rect(x - 3, y + 1, 9, 1, '#F0DCB8'); p.rect(x - 1, y - 2, 5, 2, '#E7E2D2'); }
  else if (id === 2) { p.rect(x, y - 3, 6, 6, ink); p.rect(x + 1, y - 2, 4, 4, '#C9922F'); p.rect(x + 1, y - 2, 4, 1, '#F3E0A0'); }
  else if (id === 3) { p.rect(x + 2, y - 8, 2, 12, '#8E5A2B'); p.rect(x, y + 3, 6, 4, '#C9A87A'); p.rect(x, y + 3, 6, 1, ink); }
  else if (id === 4) { p.rect(x, y - 5, 6, 6, ink); p.rect(x + 1, y - 4, 4, 4, '#FFF3A8'); p.rect(x + 2, y - 7, 2, 2, '#8A8A9B'); }
  else if (id === 6) { // 星辉法杖
    p.rect(20, 23 + dy, 3, 39, ink); p.rect(21, 24 + dy, 1, 37, '#8E5A2B');
    p.rect(18, 18 + dy, 7, 7, ink); p.rect(19, 19 + dy, 5, 5, pal.accent);
    p.rect(20, 17 + dy, 3, 9, '#F3E0A0'); p.px(17, 20 + dy, pal.accent); p.px(25, 20 + dy, pal.accent);
  } else if (id === 8) { // 浮空魔导书
    p.rect(13, 38 + dy, 11, 10, ink); p.rect(14, 39 + dy, 4, 8, pal.clothB); p.rect(19, 39 + dy, 4, 8, pal.clothB);
    p.rect(18, 39 + dy, 1, 8, pal.accent); p.px(12, 36 + dy, pal.accent); p.px(22, 35 + dy, pal.accent); p.px(24, 40 + dy, pal.accent);
  } else if (id === 9) { // 月影纸伞
    p.rect(21, 22 + dy, 2, 41, ink); p.rect(22, 23 + dy, 1, 39, '#8E5A2B');
    p.rect(3, 17 + dy, 23, 2, ink); p.rect(5, 14 + dy, 19, 3, pal.clothB);
    p.rect(9, 12 + dy, 11, 2, pal.accent); p.rect(13, 10 + dy, 4, 2, ink);
    p.rect(10, 16 + dy, 1, 3, ink); p.rect(18, 16 + dy, 1, 3, ink);
  } else if (id === 10) { // 炼金腰瓶
    p.rect(18, 42 + dy, 8, 10, ink); p.rect(20, 40 + dy, 4, 3, ink);
    p.rect(19, 43 + dy, 6, 8, '#3A5A8C'); p.rect(20, 46 + dy, 4, 4, pal.accent); p.rect(21, 43 + dy, 2, 2, '#E7E2D2');
  }
}

/** 在既有衣装轮廓上增加材质高光、缝线和五金；不改旧衣装编号，也不侵入头脸区域。 */
function drawOutfitDetails(p     , id        , pal         , dy        )       {
  const ink = '#120C16';
  const hi = mix(pal.clothA, '#FFFFFF', 0.38);
  const shade = mix(pal.clothA, '#0B0810', 0.34);
  const metal = mix(pal.accent, '#FFFFFF', 0.28);
  const y = (n        ) => n + dy;
  const metalwear = ['armor', 'spacer'];
  const knitwear = ['hoodie', 'sweater', 'cardigan', 'pajama'];
  const silk = ['kimono', 'dress', 'noble', 'maid', 'pinafore'];
  const leather = ['coat', 'fur', 'trench', 'ranger', 'ninja'];
  const uniform = ['apron', 'suit', 'sailor', 'chef', 'vest', 'overalls'];
  const arcane = ['robe', 'wizard', 'cape', 'monk'];

  if (metalwear.includes(id)) {
    p.rect(11, y(31), 10, 1, hi); p.rect(12, y(39), 8, 1, shade);
    for (const [x, yy] of [[10, 33], [21, 33], [11, 43], [20, 43]]) { p.px(x, y(yy), ink); p.px(x, y(yy - 1), metal); }
    p.rect(15, y(30), 2, 17, metal); p.px(16, y(34), '#F3E0A0');
  } else if (knitwear.includes(id)) {
    for (let yy = 32; yy <= 44; yy += 3) {
      p.px(11, y(yy), hi); p.px(13, y(yy + 1), shade); p.px(18, y(yy + 1), hi); p.px(20, y(yy), shade);
    }
    p.rect(12, y(46), 8, 1, shade);
  } else if (silk.includes(id)) {
    p.px(11, y(31), hi); p.px(12, y(32), hi); p.px(13, y(33), hi); p.px(18, y(38), hi); p.px(19, y(39), hi);
    p.rect(10, y(41), 12, 1, pal.accent); p.px(15, y(42), metal); p.px(16, y(42), metal);
  } else if (leather.includes(id)) {
    p.rect(12, y(30), 1, 16, shade); p.rect(19, y(30), 1, 16, hi);
    for (let yy = 32; yy <= 44; yy += 4) { p.px(13, y(yy), metal); p.px(18, y(yy), metal); }
    p.rect(14, y(39), 4, 2, ink); p.rect(15, y(39), 2, 1, pal.accent);
  } else if (uniform.includes(id)) {
    p.rect(15, y(29), 2, 17, shade);
    for (const yy of [32, 36, 40]) { p.px(15, y(yy), ink); p.px(16, y(yy), metal); }
    p.rect(11, y(30), 4, 1, hi); p.rect(17, y(30), 4, 1, hi);
  } else if (arcane.includes(id)) {
    p.px(16, y(33), metal); p.px(15, y(34), metal); p.px(16, y(34), '#F3E0A0'); p.px(17, y(34), metal); p.px(16, y(35), metal);
    p.px(11, y(39), pal.accent); p.px(20, y(41), pal.accent); p.px(13, y(47), hi); p.px(18, y(50), hi);
    p.rect(10, y(43), 12, 1, shade);
  } else {
    p.rect(12, y(31), 1, 12, hi); p.rect(19, y(31), 1, 12, shade);
    p.px(15, y(34), metal); p.px(16, y(38), metal); p.px(15, y(42), metal);
  }
}

/** 身高抬高躯干后把腿顶补上，避免断层 */
function bridgeLegs(p     , fromY        , rows        )       {
  const img = p.ctx.getImageData(0, fromY, p.w, 1).data;
  for (let r = 1; r <= rows; r++) {
    for (let x = 0; x < p.w; x++) {
      if (img[x * 4 + 3] < 80) continue;
      p.px(x, fromY - r, `rgb(${img[x * 4]},${img[x * 4 + 1]},${img[x * 4 + 2]})`);
    }
  }
}

/** 走路时下摆/脚整体左右摆 1px */
function sway(p     , y0        , y1        , dx        )       {
  if (!dx) return;
  const h = y1 - y0 + 1;
  const img = p.ctx.getImageData(0, y0, p.w, h);
  p.ctx.clearRect(0, y0, p.w, h);
  p.ctx.putImageData(img, dx, y0);
}

export function drawSprite(a            , dir        , pose      , frame        , carry               )      {
  const p = new Pix(CANVAS_W, CANVAS_H);
  const pal = palOf(a);
  const back = dir === 2;
  const bob = pose === 'idle' || pose === 'walk' || pose === 'work' || pose === 'eat' || pose === 'greet' ? (frame % 2 === 1 ? -1 : 0) : 0;
  const up = [2, 0, -2][a.ht % 3];            // 身高：躯干与头整体上移/下移，脚底不动
  const dy = bob + up;
  const head           = { face: a.face, eye: a.eye, fringe: a.fringe, length: a.hairLen, pal, back };

  for (let y = -2; y <= 2; y++) {             // 地面投影
    const w = 19 - Math.abs(y) * 5;
    p.rect(CX - Math.floor(w / 2), FEET_Y + 2 + y, w, 1, 'rgba(18,12,22,0.26)');
  }
  drawBackAccessory(p, a, dy);
  drawHairUnder(p, head, dy);
  paintSpans(p, BASE, pal, 0);
  paintSpans(p, SOCKS[(a.wear.sock || 0) % SOCKS.length].spans, pal, 0);
  paintSpans(p, PANTS[(a.wear.leg || 0) % PANTS.length].spans, pal, 0);
  const outfit = BODIES[a.wear.top % BODIES.length];
  paintSpans(p, outfit.spans, pal, dy);
  drawOutfitDetails(p, outfit.id, pal, dy);
  if (outfit.hands) paintSpans(p, HANDS, pal, dy);
  // 手持配饰先画，随后头发与脸会覆盖相交部分，保证伞、法杖等永远不会挡住角色面部。
  drawFrontAccessory(p, a, carry, dy);
  if (up < 0) bridgeLegs(p, 50, 2);
  drawFace(p, head, dy);
  const race = RACE_PARTS[a.race];
  if (race) paintSpans(p, race, pal, dy);
  const rf = RACE_FACE[a.race];
  if (rf && !back) paintSpans(p, rf, pal, dy);
  const acc = ACCS[(a.acc || 0) % ACCS.length];
  if (acc.spans.length && (!back || acc.back)) {
    if (acc.sym === false) paintSpansL(p, acc.spans, pal, dy);
    else paintSpans(p, acc.spans, pal, dy);
  }
  clothSheen(p, pal);
  hairSheen(p, pal, back);
  if (pose === 'walk') stepLegs(p, frame);   // 交替抬脚要在描边前，不然边缘留残渣
  if (pose === 'sit' || pose === 'eat') sitSquash(p);   // 坐姿同理：先压腿再描边
  outline(p, 0, FEET_Y + 1);
  if (pose === 'walk') sway(p, 60, FEET_Y + 1, frame % 4 < 2 ? 1 : -1);
  if (pose === 'work') sway(p, 26, 50, frame % 4 < 2 ? 1 : -1);   // 干活：上身来回（搅拌/切配/擦拭）
  if (pose === 'eat') sway(p, 18, 48, frame % 4 < 2 ? 1 : -1);    // 进餐：上身小摆动 + bob 点头
  if (pose === 'greet') sway(p, 16, 44, frame % 4 < 2 ? 1 : -1);  // 迎宾：上身前倾招呼
  return p;
}

/** 坐姿：上半身下移 6px、藏起大腿（只留小腿和鞋），读作「坐在椅子上」 */
function sitSquash(p     )       {
  const tmp = document.createElement('canvas');
  tmp.width = p.w; tmp.height = 48;
  const tc = tmp.getContext('2d');
  if (!tc) return;
  tc.drawImage(p.canvas, 0, 0, p.w, 48, 0, 0, p.w, 48);
  p.ctx.clearRect(0, 0, p.w, 56);
  p.ctx.drawImage(tmp, 0, 9);
}

/**
 * 布料质感后处理：布色系（A/a/q、B/b/w）加横向织纹（每 3 行一道暗丝），
 * 下摆/袖口等悬空缘压暗、上缘提亮。模板不用改。
 */
function clothSheen(p     , pal         )       {
  const Y0 = 24, H = 44, W = p.w;
  const img = p.ctx.getImageData(0, Y0, W, H);
  const d = img.data;
  const tones = new Set(['A', 'a', 'q', 'B', 'b', 'w'].map((ch) => (colorFor(ch, pal) || '').slice(1).toUpperCase()));
  const al = (x        , y        )         => (x < 0 || x >= W || y < Y0 || y >= Y0 + H) ? 0 : d[((y - Y0) * W + x) * 4 + 3];
  const hexAt = (i        )         => ((1 << 24) | (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]).toString(16).slice(1);
  const put = (x        , y        , c        )       => {
    const i = ((y - Y0) * W + x) * 4;
    d[i] = parseInt(c.slice(1, 3), 16); d[i + 1] = parseInt(c.slice(3, 5), 16); d[i + 2] = parseInt(c.slice(5, 7), 16); d[i + 3] = 255;
  };
  for (let y = Y0; y < Y0 + H; y++) for (let x = 0; x < W; x++) {
    const i = ((y - Y0) * W + x) * 4;
    if (d[i + 3] < 60) continue;
    const h = hexAt(i).toUpperCase();
    if (!tones.has(h)) continue;
    const cur = '#' + hexAt(i);
    if (!al(x, y + 1)) put(x, y, mix(cur, '#0B0810', 0.2));        // 下摆缘压暗
    else if (!al(x, y - 1)) put(x, y, mix(cur, '#FFFFFF', 0.14));  // 上缘提亮
    else if (y % 3 === 0) put(x, y, mix(cur, '#0B0810', 0.07));    // 织纹横丝
  }
  p.ctx.putImageData(img, 0, Y0);
}

/** 走路抬脚：左右腿按帧交替抬起 2px（旧版只有下半身整体摇摆，读不出“走”） */
function stepLegs(p     , frame        )       {
  const f = frame % 4;
  if (f !== 1 && f !== 3) return;
  const x0 = f === 1 ? 21 : 32;   // 左/右腿柱区（画布 x）
  const y0 = 46, w = 11, h = FEET_Y + 1 - y0;
  const tmp = document.createElement('canvas');
  tmp.width = w; tmp.height = h;
  const tc = tmp.getContext('2d');
  if (!tc) return;
  tc.drawImage(p.canvas, x0, y0, w, h, 0, 0, w, h);
  p.ctx.clearRect(x0, y0, w, h);
  p.ctx.drawImage(tmp, x0, y0 - 3);
}

/**
 * 头发轮廓光（后处理，26 个发型模板不用改）：发色系的轮廓缘提亮、发梢底缘压暗。
 * 参考图的头发层次感全靠这一道；只扫头部 30 行。
 */
function hairSheen(p     , pal         , back         )       {
  const H = 30;
  const img = p.ctx.getImageData(0, 0, p.w, H);
  const d = img.data;
  const hex = (i        )         => ((1 << 24) | (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]).toString(16).slice(1).toUpperCase();
  const hairTones = new Set([pal.hair, mix(pal.hair, '#0B0810', 0.5), mix(pal.hair, '#0B0810', 0.26), mix(pal.hair, '#FFFFFF', 0.2), mix(pal.hair, '#FFFFFF', 0.46)]
    .map((c) => c.slice(1).toUpperCase()));
  const hi = mix(pal.hair, '#FFFFFF', 0.36);
  const lo = mix(pal.hair, '#0B0810', 0.42);
  const al = (x        , y        )         => (x < 0 || x >= p.w || y < 0 || y >= H) ? 0 : d[(y * p.w + x) * 4 + 3];
  const hiP           = [], loP           = [];
  for (let y = 4; y < H; y++) for (let x = 0; x < p.w; x++) {
    const i = (y * p.w + x) * 4;
    if (d[i + 3] < 60 || !hairTones.has(hex(i))) continue;
    if (!al(x, y - 1)) hiP.push(x, y);                       // 顶缘 → 高光
    else if ((!al(x - 1, y) || !al(x + 1, y)) && y < 16) hiP.push(x, y);   // 两侧外缘（头顶区）
    else if (!al(x, y + 1) && y >= 13) loP.push(x, y);       // 发梢底缘 → 压暗
  }
  for (let i = 0; i < hiP.length; i += 2) p.px(hiP[i], hiP[i + 1], hi);
  for (let i = 0; i < loP.length; i += 2) p.px(loP[i], loP[i + 1], lo);
}

export function drawAvatar(a            )      {
  const src = drawSprite(a, 0, 'idle', 0, null);
  const size = 40;
  const p = new Pix(size, size);
  p.rect(0, 0, size, size, '#1E1B34');
  for (let i = 0; i < 12; i++) p.px((i * 7 + 3) % size, (i * 11 + 5) % 18, '#3B3B6B');
  p.ctx.imageSmoothingEnabled = false;
  p.ctx.drawImage(src.canvas, CX - size / 2, 0, size, size, 0, 0, size, size);
  return p;
}

const avatarCache = new Map                ();
export function appKey(a            )         {
  return [a.face, a.eye, a.fringe, a.hairLen, a.acc || 0, a.wear.top, a.race, a.ht, a.bd,
    a.skin, a.hairC, a.eyeC, a.clothA, a.clothB, a.accC, a.wear.hand, a.wear.leg || 0, a.wear.sock || 0,
    a.specialPortrait || ''].join('_');
}
export function avatarURL(a            )         {
  const k = appKey(a);
  const hit = avatarCache.get(k);
  if (hit) return hit;
  const url = drawAvatar(a).dataURL();
  avatarCache.set(k, url);
  if (avatarCache.size > 400) avatarCache.clear();
  return url;
}

// ---------------- 预设：照参考图配出来的样板 ----------------
;                                                                                         
export const PRESETS              = [
  { id: 'samurai', name: '和风武士', sex: '女', make: () => ({
    face: 3, eye: 0, fringe: 1, hairLen: 4, race: 0, ht: 1, bd: 1, acc: 7,
    skin: 0, hairC: 0, eyeC: 1, clothA: 17, clothB: 1, accC: 7, wear: { top: 1, hand: 0 } }) },
  { id: 'queen', name: '魔角女王', sex: '女', make: () => ({
    face: 1, eye: 5, fringe: 4, hairLen: 3, race: 5, ht: 2, bd: 0, acc: 0,
    skin: 6, hairC: 6, eyeC: 3, clothA: 0, clothB: 1, accC: 1, wear: { top: 2, hand: 0 } }) },
  { id: 'furlord', name: '毛领浪客', sex: '男', make: () => ({
    face: 2, eye: 2, fringe: 3, hairLen: 6, race: 0, ht: 1, bd: 2, acc: 5,
    skin: 1, hairC: 0, eyeC: 8, clothA: 1, clothB: 0, accC: 3, wear: { top: 3, hand: 0 } }) },
  { id: 'loli', name: '哥特洋装', sex: '女', make: () => ({
    face: 0, eye: 5, fringe: 0, hairLen: 3, race: 0, ht: 0, bd: 0, acc: 13,
    skin: 0, hairC: 7, eyeC: 1, clothA: 16, clothB: 1, accC: 1, wear: { top: 4, hand: 0 },
    specialPortrait: 'gothic-dress' }) },
  { id: 'druid', name: '兽角德鲁伊', sex: '男', make: () => ({
    face: 2, eye: 8, fringe: 3, hairLen: 1, race: 4, ht: 2, bd: 2, acc: 8,
    skin: 3, hairC: 0, eyeC: 6, clothA: 3, clothB: 15, accC: 3, wear: { top: 5, hand: 0 } }) },
];
export function portraitById(id         )                   { return id ? PRESETS.find((q) => q.id === id) || null : null; }

// ---------------- 随机 ----------------
const RACE_SKIN             = [
  [0, 1, 2, 3, 4, 5], [0, 6, 7], [2, 3, 4], [0, 1, 6], [7, 8, 11], [6, 9, 5], [6, 0, 11],
  [7, 10], [8, 9], [10, 7], [8, 11], [8, 10], [9, 10], [8, 11], [10], [9, 10], [1, 2], [3, 4],
];
export function randomAppearance(rng     , race         , forWork = true, theme         )             {
  const r = race === undefined ? rng.int(18) : race;
  const skins = RACE_SKIN[r] || [0];
  const th = theme ? themeById(theme) : null;
  const pick = (arr          )         => arr[rng.int(arr.length)];
  const a             = {
    face: rng.int(FACES.length), eye: rng.int(EYES.length),
    fringe: rng.int(FRINGES.length), hairLen: rng.chance(0.06) ? 0 : 1 + rng.int(LENGTHS.length - 1),
    race: r, ht: rng.int(3), bd: rng.int(3),
    acc: rng.chance(0.34) ? 1 + rng.int(ACCS.length - 1) : 0,
    skin: skins[rng.int(skins.length)],
    hairC: rng.int(HAIR_COLORS.length), eyeC: rng.int(EYE_COLORS.length),
    clothA: rng.int(CLOTH_COLORS.length), clothB: rng.int(CLOTH_COLORS.length),
    accC: rng.int(ACCENT_COLORS.length),
    wear: { top: rng.int(BODIES.length), hand: !forWork && rng.chance(0.28) ? 5 + rng.int(HAND_NAMES.length - 5) : 0,
      leg: rng.int(PANTS.length), sock: rng.int(SOCKS.length) },
  };
  if (th) {
    a.hairC = pick(th.hairC); a.eyeC = pick(th.eyeC);
    a.clothA = pick(th.clothA); a.clothB = pick(th.clothB); a.accC = pick(th.accC);
    a.wear.top = pick(th.outfit);
  }
  if (forWork && rng.chance(0.6)) a.wear.top = 0;
  return a;
}
export function defaultAppearance()             { return PRESETS[0].make(); }
export function cloneApp(a            )             { return JSON.parse(JSON.stringify(a))              ; }

/** 读旧存档：退役字段忽略，缺的补默认，索引夹到当前范围 */
export function normalizeApp(a            )             {
  const o = { ...a }              ;
  o.wear = o.wear || { top: 0, hand: 0 };
  const clamp = (v         , n        )         => (typeof v === 'number' && isFinite(v) ? (((v | 0) % n) + n) % n : 0);
  o.face = clamp(o.face, FACES.length);
  o.eye = clamp(o.eye, EYES.length);
  o.fringe = clamp(o.fringe, FRINGES.length);
  o.hairLen = clamp(o.hairLen, LENGTHS.length);
  o.acc = clamp(o.acc, ACCS.length);
  o.wear.top = clamp(o.wear.top, BODIES.length);
  o.wear.hand = clamp(o.wear.hand, HAND_NAMES.length);
  o.ht = clamp(o.ht, 3); o.bd = clamp(o.bd, 3);
  o.skin = clamp(o.skin, SKINS.length);
  o.hairC = clamp(o.hairC, HAIR_COLORS.length);
  o.eyeC = clamp(o.eyeC, EYE_COLORS.length);
  o.clothA = clamp(o.clothA, CLOTH_COLORS.length);
  o.clothB = clamp(o.clothB, CLOTH_COLORS.length);
  o.accC = clamp(o.accC, ACCENT_COLORS.length);
  o.race = clamp(o.race, RACE_NAMES.length);
  if (o.specialPortrait !== 'gothic-dress') delete o.specialPortrait;
  return o;
}

export { mix };
