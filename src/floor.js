// 地面材质：在生成的无缝像素底图上叠一层手写细节，得到每格变体（星露谷式的“地面不重复”）
// 另含地毯拼块与灯光池。所有细节都避开格子边缘 1px，保证相邻格仍然无缝。
import { mix, Pix, Rng, shade } from './pix.js';
import { mat, plate } from './mat.js';
import { T } from './furniture.js';

export const FLOOR_VARIANTS = 6;

function drawBase(p     , base                          , fallback        )       {
  if (base) {
    try { p.ctx.drawImage(base, 0, 0, T, T); return; } catch (e) { /* 贴图不可用时纯色兜底 */ }
  }
  p.rect(0, 0, T, T, fallback);
}

/** 木地板细节 */
function woodDetail(p     , v        , rng     )       {
  if (v === 1) {                                  // 钉头
    for (const [x, y] of [[5, 8], [26, 8], [5, 24], [26, 24]]              ) {
      p.px(x, y, 'rgba(50,38,28,0.75)'); p.px(x, y - 1, 'rgba(255,235,190,0.35)');
    }
  } else if (v === 2) {                           // 结节 + 木纹涡
    const cx = 8 + rng.int(16), cy = 8 + rng.int(16);
    p.disc(cx, cy, 2, 'rgba(58,40,28,0.55)');
    p.disc(cx, cy, 1, 'rgba(40,26,18,0.7)');
    p.ring(cx, cy, 4, 'rgba(58,40,28,0.28)');
  } else if (v === 3) {                           // 走出来的磨白
    for (let i = 0; i < 26; i++) {
      const x = 4 + rng.int(24), y = 4 + rng.int(24);
      p.px(x, y, 'rgba(255,240,205,0.16)');
    }
  } else if (v === 4) {                           // 细裂缝
    let x = 6 + rng.int(6), y = 3;
    while (y < 28) { p.px(x, y, 'rgba(30,20,14,0.5)'); y += 1; if (rng.chance(0.4)) x += rng.chance(0.5) ? 1 : -1; }
  } else if (v === 5) {                           // 酒渍
    const cx = 10 + rng.int(12), cy = 10 + rng.int(12);
    p.disc(cx, cy, 5, 'rgba(70,34,30,0.22)');
    p.ring(cx, cy, 5, 'rgba(60,28,26,0.34)');
    p.disc(cx, cy, 2, 'rgba(80,38,32,0.3)');
  }
}

/** 厨房瓷砖细节 */
function kitchenDetail(p     , v        , rng     )       {
  // 每格都压一层砖缝阴影，让瓷砖有厚度
  p.rect(0, 15, T, 1, 'rgba(30,34,40,0.3)');
  p.rect(15, 0, 1, T, 'rgba(30,34,40,0.3)');
  p.rect(0, 16, T, 1, 'rgba(255,255,255,0.08)');
  p.rect(16, 0, 1, T, 'rgba(255,255,255,0.08)');
  if (v === 1) {                                  // 磕角
    p.px(17, 17, 'rgba(40,44,52,0.6)'); p.px(18, 17, 'rgba(40,44,52,0.45)'); p.px(17, 18, 'rgba(40,44,52,0.45)');
  } else if (v === 2) {                            // 地漏
    p.disc(23, 23, 4, 'rgba(40,44,52,0.75)');
    p.disc(23, 23, 3, 'rgba(120,124,136,0.85)');
    for (let i = -2; i <= 2; i++) p.rect(21, 22 + i, 5, 1, i % 2 ? 'rgba(40,44,52,0.8)' : 'rgba(160,166,178,0.5)');
  } else if (v === 3) {                            // 油点
    for (let i = 0; i < 7; i++) p.px(4 + rng.int(24), 4 + rng.int(24), 'rgba(120,96,40,0.35)');
  } else if (v === 4) {                            // 水光
    p.rect(6, 20, 9, 2, 'rgba(210,240,255,0.22)');
    p.rect(7, 22, 6, 1, 'rgba(210,240,255,0.14)');
  } else if (v === 5) {                            // 裂纹瓷砖
    for (let i = 0; i < 5; i++) p.px(20 + i, 6 + i, 'rgba(40,44,52,0.5)');
    for (let i = 0; i < 3; i++) p.px(22 + i, 8 + i * 2, 'rgba(40,44,52,0.4)');
  }
}

/** 储藏室细节 */
function storageDetail(p     , v        , rng     )       {
  // 每格常显：水泥颗粒 + 伸缩缝（贴图太平，靠这层撑出质感），不碰外 1px
  for (let i = 0; i < 26; i++) p.px(2 + rng.int(28), 2 + rng.int(28), 'rgba(255,250,235,0.06)');
  for (let i = 0; i < 14; i++) p.px(2 + rng.int(28), 2 + rng.int(28), 'rgba(20,16,10,0.09)');
  p.rect(2, 15, T - 4, 1, 'rgba(24,20,14,0.20)');
  p.rect(2, 16, T - 4, 1, 'rgba(255,246,225,0.07)');
  if (v === 1) {                                  // 粉笔记号
    p.rect(6, 8, 8, 1, 'rgba(240,236,220,0.4)');
    for (let i = 0; i < 6; i++) p.px(6 + i, 8 + i, 'rgba(240,236,220,0.32)');
    for (let i = 0; i < 6; i++) p.px(12 - i, 8 + i, 'rgba(240,236,220,0.32)');
  } else if (v === 2) {                            // 谷物 / 草屑
    for (let i = 0; i < 9; i++) {
      const x = 4 + rng.int(24), y = 4 + rng.int(24);
      p.rect(x, y, 2, 1, 'rgba(214,186,120,0.55)');
    }
  } else if (v === 3) {                            // 灰尘团
    for (let i = 0; i < 20; i++) p.px(4 + rng.int(24), 4 + rng.int(24), 'rgba(180,170,150,0.16)');
  } else if (v === 4) {
    for (const [x, y] of [[7, 7], [24, 24]]              ) { p.px(x, y, 'rgba(50,38,28,0.7)'); p.px(x, y - 1, 'rgba(255,235,190,0.3)'); }
  } else if (v === 5) {                            // 拖箱刮痕
    p.rect(5, 18, 22, 1, 'rgba(40,30,20,0.28)');
    p.rect(5, 19, 22, 1, 'rgba(255,240,205,0.12)');
  }
}

/** 地毯细节 */
function carpetDetail(p     , v        , rng     )       {
  // 每格常显：内嵌收边 + 斜纹织感（贴图太平，靠这层撑出绒面），不碰外 1px
  for (let i = 2; i < T - 2; i++) {
    p.px(i, 2, 'rgba(14,6,10,0.30)'); p.px(i, 3, 'rgba(255,214,180,0.10)');
    p.px(i, T - 3, 'rgba(255,214,180,0.09)'); p.px(i, T - 4, 'rgba(14,6,10,0.20)');
    p.px(2, i, 'rgba(14,6,10,0.30)'); p.px(3, i, 'rgba(255,214,180,0.10)');
    p.px(T - 3, i, 'rgba(255,214,180,0.09)'); p.px(T - 4, i, 'rgba(14,6,10,0.20)');
  }
  for (let j = 5; j < T - 4; j += 3) for (let i = 5; i < T - 4; i += 3) {
    p.px(i, j, (i + j) % 2 ? 'rgba(255,220,190,0.055)' : 'rgba(16,7,11,0.065)');
  }
  if (v === 1) {                                  // 织纹菱格
    for (let j = 2; j < T - 2; j++) for (let i = 2; i < T - 2; i++) {
      if ((i + j) % 8 === 0) p.px(i, j, 'rgba(255,225,180,0.14)');
      if ((i - j + 64) % 8 === 0) p.px(i, j, 'rgba(20,10,16,0.14)');
    }
  } else if (v === 2) {                            // 磨秃
    for (let i = 0; i < 24; i++) p.px(5 + rng.int(22), 5 + rng.int(22), 'rgba(230,214,190,0.13)');
  } else if (v === 3) {                            // 污渍
    const cx = 10 + rng.int(12), cy = 10 + rng.int(12);
    p.disc(cx, cy, 4, 'rgba(20,10,16,0.2)');
  } else if (v === 4) {                            // 绣星
    const cx = 16, cy = 16;
    p.rect(cx - 4, cy, 9, 1, 'rgba(255,230,176,0.5)');
    p.rect(cx, cy - 4, 1, 9, 'rgba(255,230,176,0.5)');
    for (let i = 1; i <= 2; i++) { p.px(cx + i, cy + i, 'rgba(255,230,176,0.3)'); p.px(cx - i, cy - i, 'rgba(255,230,176,0.3)'); p.px(cx + i, cy - i, 'rgba(255,230,176,0.3)'); p.px(cx - i, cy + i, 'rgba(255,230,176,0.3)'); }
  } else if (v === 5) {                            // 绒毛结
    for (let i = 0; i < 12; i++) {
      const x = 4 + rng.int(24), y = 4 + rng.int(24);
      p.px(x, y, 'rgba(255,225,180,0.2)'); p.px(x, y + 1, 'rgba(20,10,16,0.18)');
    }
  }
}


/** 霓虹甲板：内格辉光缝线 + 指示灯（细节避开边缘 1px，仍然无缝） */
function neonDetail(p     , v        , rng     )       {
  // 每格都压亮缝线：贴图本身偏暗，靠这层做出发光感
  p.rect(0, 14, T, 1, 'rgba(20,60,80,0.55)');
  p.rect(0, 15, T, 2, 'rgba(57,215,210,0.42)');
  p.rect(0, 17, T, 1, 'rgba(120,240,255,0.22)');
  p.rect(14, 0, 1, T, 'rgba(20,60,80,0.55)');
  p.rect(15, 0, 2, T, 'rgba(57,215,210,0.42)');
  p.rect(17, 0, 1, T, 'rgba(120,240,255,0.22)');
  p.px(15, 15, 'rgba(220,255,255,0.85)');
  if (v === 1) {                                   // 品红指示灯
    p.disc(7, 7, 2, 'rgba(228,90,209,0.5)');
    p.px(7, 7, 'rgba(255,190,245,0.95)');
  } else if (v === 2) {                            // 检修面板铆钉
    for (const [x, y] of [[5, 22], [10, 22], [5, 27], [10, 27]]              ) {
      p.px(x, y, 'rgba(150,180,200,0.5)'); p.px(x, y + 1, 'rgba(10,20,30,0.5)');
    }
  } else if (v === 3) {                            // 数据流小方块
    for (let i = 0; i < 5; i++) p.rect(20 + rng.int(6), 4 + i * 4, 2, 1, 'rgba(57,215,210,0.35)');
  } else if (v === 4) {                            // 磨损划痕
    for (let i = 0; i < 10; i++) p.px(3 + rng.int(10), 3 + rng.int(10), 'rgba(200,220,240,0.12)');
  } else if (v === 5) {                            // 地面箭头标线
    for (let i = 0; i < 4; i++) { p.px(22 + i, 22 + i, 'rgba(228,90,209,0.4)'); p.px(28 - i, 22 + i, 'rgba(228,90,209,0.4)'); }
  }
}

/** 星海石板：星点与星芒 */
function astralDetail(p     , v        , rng     )       {
  const stars = 5 + (v % 3);
  for (let i = 0; i < stars; i++) {
    const x = 3 + rng.int(26), y = 3 + rng.int(26);
    p.px(x, y, 'rgba(255,255,255,0.85)');
    if (rng.chance(0.5)) {
      p.px(x - 1, y, 'rgba(200,220,255,0.35)'); p.px(x + 1, y, 'rgba(200,220,255,0.35)');
      p.px(x, y - 1, 'rgba(200,220,255,0.35)'); p.px(x, y + 1, 'rgba(200,220,255,0.35)');
    }
  }
  if (v === 1) {                                   // 石板接缝
    p.rect(0, 15, T, 1, 'rgba(20,14,40,0.45)');
    p.rect(0, 16, T, 1, 'rgba(160,140,230,0.14)');
  } else if (v === 2) {                            // 紫金脉纹
    let x = 5 + rng.int(6);
    for (let y = 3; y < 29; y++) { p.px(x, y, 'rgba(155,123,232,0.4)'); if (rng.chance(0.45)) x += rng.chance(0.5) ? 1 : -1; }
  } else if (v === 3) {                            // 星云漩
    const cx = 10 + rng.int(12), cy = 10 + rng.int(12);
    p.ring(cx, cy, 5, 'rgba(122,75,224,0.22)');
    p.ring(cx, cy, 3, 'rgba(155,123,232,0.18)');
  } else if (v === 4) {                            // 大星
    const cx = 8 + rng.int(16), cy = 8 + rng.int(16);
    p.rect(cx - 3, cy, 7, 1, 'rgba(230,235,255,0.55)');
    p.rect(cx, cy - 3, 1, 7, 'rgba(230,235,255,0.55)');
    p.px(cx, cy, '#FFFFFF');
  }
}

/** 熔岩地面：裂缝辉光与火星 */
function forgeDetail(p     , v        , rng     )       {
  if (v === 1) {                                   // 亮裂缝（竖）
    let x = 8 + rng.int(14);
    for (let y = 2; y < 30; y++) {
      p.px(x, y, 'rgba(255,150,60,0.75)');
      p.px(x + 1, y, 'rgba(120,40,20,0.5)');
      if (rng.chance(0.35)) x += rng.chance(0.5) ? 1 : -1;
    }
  } else if (v === 2) {                            // 亮裂缝（横）
    let y = 8 + rng.int(14);
    for (let x = 2; x < 30; x++) {
      p.px(x, y, 'rgba(255,170,70,0.7)');
      p.px(x, y + 1, 'rgba(120,40,20,0.5)');
      if (rng.chance(0.35)) y += rng.chance(0.5) ? 1 : -1;
    }
  } else if (v === 3) {                            // 铁条铆钉
    p.rect(3, 14, T - 6, 3, 'rgba(70,66,80,0.75)');
    p.rect(3, 14, T - 6, 1, 'rgba(150,146,165,0.4)');
    for (let i = 5; i < T - 6; i += 6) { p.px(i, 15, 'rgba(190,190,205,0.7)'); p.px(i, 16, 'rgba(20,16,24,0.6)'); }
  } else if (v === 4) {                            // 火星
    for (let i = 0; i < 8; i++) {
      const x = 4 + rng.int(24), y = 4 + rng.int(24);
      p.px(x, y, 'rgba(255,210,120,0.8)');
      p.px(x, y + 1, 'rgba(228,115,44,0.45)');
    }
  } else if (v === 5) {                            // 焦黑斑
    const cx = 10 + rng.int(12), cy = 10 + rng.int(12);
    p.disc(cx, cy, 4, 'rgba(18,12,14,0.35)');
  }
}

/** 冰晶地砖：晶面接缝、霜羽与闪点 */
function frostDetail(p     , v        , rng     )       {
  // 晶面切割线（每格都有，做出冰砖厚度）
  p.rect(0, 15, T, 1, 'rgba(90,140,170,0.4)');
  p.rect(0, 16, T, 1, 'rgba(255,255,255,0.5)');
  p.rect(15, 0, 1, T, 'rgba(90,140,170,0.4)');
  p.rect(16, 0, 1, T, 'rgba(255,255,255,0.5)');
  if (v === 1) {                                   // 霜羽
    const cx = 8 + rng.int(4), cy = 8 + rng.int(4);
    for (let i = 0; i < 7; i++) {
      p.px(cx + i, cy + i, 'rgba(255,255,255,0.7)');
      p.px(cx + i + 1, cy + i, 'rgba(200,235,250,0.45)');
      p.px(cx + i, cy + i + 1, 'rgba(200,235,250,0.45)');
    }
  } else if (v === 2) {                            // 冰裂
    let x = 20 + rng.int(6);
    for (let y = 3; y < 28; y++) { p.px(x, y, 'rgba(120,200,225,0.55)'); if (rng.chance(0.4)) x += rng.chance(0.5) ? 1 : -1; }
  } else if (v === 3) {                            // 闪点
    for (let i = 0; i < 6; i++) {
      const x = 4 + rng.int(24), y = 4 + rng.int(24);
      p.px(x, y, '#FFFFFF');
      p.px(x - 1, y, 'rgba(255,255,255,0.4)'); p.px(x + 1, y, 'rgba(255,255,255,0.4)');
    }
  } else if (v === 4) {                            // 深色冰核
    const cx = 9 + rng.int(14), cy = 9 + rng.int(14);
    p.disc(cx, cy, 3, 'rgba(70,150,185,0.28)');
    p.ring(cx, cy, 4, 'rgba(200,240,255,0.3)');
  } else if (v === 5) {                            // 雪尘
    for (let i = 0; i < 16; i++) p.px(3 + rng.int(26), 3 + rng.int(26), 'rgba(255,255,255,0.22)');
  }
}


/** 榻榻米（客房）：草编纹 + 布边缝线，细节避开边缘 1px 保持无缝 */
function tatamiDetail(p     , v        , rng     )       {
  for (let j = 2; j < T - 2; j++) for (let i = 2; i < T - 2; i++) {
    if (j % 4 === 1) p.px(i, j, 'rgba(120,110,60,0.16)');
    else if ((i + j * 2) % 7 === 0) p.px(i, j, 'rgba(255,240,190,0.12)');
  }
  if (v === 1) { p.rect(2, 15, T - 4, 1, 'rgba(60,80,50,0.35)'); p.rect(2, 16, T - 4, 1, 'rgba(200,210,150,0.18)'); }
  else if (v === 2) for (let i = 0; i < 14; i++) p.px(3 + rng.int(26), 3 + rng.int(26), 'rgba(90,80,40,0.18)');
  else if (v === 3) { p.rect(15, 2, 1, T - 4, 'rgba(60,80,50,0.3)'); p.rect(16, 2, 1, T - 4, 'rgba(200,210,150,0.16)'); }
  else if (v === 4) for (let i = 3; i < T - 3; i += 6) { p.px(i, 5, 'rgba(70,90,60,0.4)'); p.px(i + 1, 26, 'rgba(70,90,60,0.4)'); }
}

/** 温泉湿石（温泉）：水渍反光 + 接缝积水 */
function onsenDetail(p     , v        , rng     )       {
  for (let j = 2; j < T - 2; j++) for (let i = 2; i < T - 2; i++) {
    if ((i * 3 + j * 5) % 23 === 0) p.px(i, j, 'rgba(255,255,255,0.12)');
  }
  if (v === 1) { p.rect(2, 15, T - 4, 2, 'rgba(30,60,80,0.3)'); p.rect(2, 15, T - 4, 1, 'rgba(190,235,255,0.22)'); }
  else if (v === 2) { const cx = 8 + rng.int(14), cy = 8 + rng.int(14); p.disc(cx, cy, 4, 'rgba(140,200,225,0.18)'); p.ring(cx, cy, 5, 'rgba(255,255,255,0.14)'); }
  else if (v === 3) { p.rect(15, 2, 2, T - 4, 'rgba(30,60,80,0.28)'); p.rect(15, 2, 1, T - 4, 'rgba(190,235,255,0.2)'); }
  else if (v === 4) for (let i = 0; i < 10; i++) { const x = 4 + rng.int(24), y = 4 + rng.int(24); p.px(x, y, 'rgba(255,255,255,0.3)'); p.px(x + 1, y, 'rgba(255,255,255,0.14)'); }
  else if (v === 5) for (let i = 3; i < T - 3; i += 8) p.rect(i, 3, 1, T - 6, 'rgba(20,45,60,0.14)');
}

/** 拼花地板（台球室）：格缝 + 木纹 + 局部磨光 */
function parquetDetail(p     , v        , rng     )       {
  for (let i = 3; i < T - 2; i += 8) { p.rect(i, 2, 1, T - 4, 'rgba(20,10,8,0.18)'); p.rect(2, i, T - 4, 1, 'rgba(20,10,8,0.18)'); }
  for (let j = 2; j < T - 2; j++) for (let i = 2; i < T - 2; i++) if ((i + j * 3) % 11 === 0) p.px(i, j, 'rgba(255,220,170,0.08)');
  if (v === 1) for (const [x, y] of [[7, 7], [23, 7], [7, 23], [23, 23]]              ) { p.px(x, y, 'rgba(255,235,190,0.3)'); p.px(x, y + 1, 'rgba(30,16,10,0.25)'); }
  else if (v === 2) { const cx = 9 + rng.int(12), cy = 9 + rng.int(12); p.disc(cx, cy, 3, 'rgba(255,230,180,0.12)'); }
  else if (v === 3) for (let i = 0; i < 12; i++) p.px(3 + rng.int(26), 3 + rng.int(26), 'rgba(30,16,10,0.2)');
  else if (v === 4) { p.rect(12, 12, 8, 8, 'rgba(243,184,75,0.12)'); p.ring(16, 16, 5, 'rgba(243,184,75,0.18)'); }
}

const FALLBACK                         = {
  'floor-wood': '#9B5B3C', 'floor-kitchen': '#7A8288', 'floor-storage': '#7A6A4B', 'floor-carpet': '#5A2A38',
  'floor-neon': '#1B2340', 'floor-astral': '#3A3068', 'floor-forge': '#3A302C', 'floor-frost': '#A8D4E8',
  'floor-tatami': '#B5AC5E', 'floor-onsen': '#7A93AE', 'floor-parquet': '#7A3A1E',
};

/** 庭院草地：小花与三叶草点缀（不碰外 1px） */
function gardenDetail(p     , v        , rng     )       {
  for (let i = 0; i < 8; i++) p.px(2 + rng.int(28), 2 + rng.int(28), 'rgba(20,60,25,0.18)');
  if (v === 1) {  // 小雏菊
    for (let i = 0; i < 2; i++) {
      const x = 5 + rng.int(22), y = 5 + rng.int(22);
      p.px(x, y, '#FFF6E0'); p.px(x + 1, y, '#FFF6E0'); p.px(x, y + 1, '#FFF6E0'); p.px(x + 1, y + 1, '#F3D98A');
    }
  } else if (v === 2) {  // 三叶草
    const x = 6 + rng.int(20), y = 6 + rng.int(20);
    p.px(x, y, '#3E7A3A'); p.px(x + 2, y, '#3E7A3A'); p.px(x + 1, y - 1, '#3E7A3A'); p.px(x + 1, y + 1, '#2E5B2E');
  } else if (v === 3) {  // 踏出的浅径
    for (let i = 0; i < 6; i++) p.px(4 + rng.int(24), 4 + rng.int(24), 'rgba(230,220,180,0.14)');
  }
}

export function floorVariant(name        , v        , base                          )      {
  const p = new Pix(T, T);
  drawBase(p, base, FALLBACK[name] || '#9B5B3C');
  const rng = new Rng(1000 + v * 977 + name.length * 31);
  if (name === 'floor-kitchen') kitchenDetail(p, v, rng);
  else if (name === 'floor-storage') storageDetail(p, v, rng);
  else if (name === 'floor-carpet') carpetDetail(p, v, rng);
  else if (name === 'floor-garden') gardenDetail(p, v, rng);
  else if (name === 'floor-neon') neonDetail(p, v, rng);
  else if (name === 'floor-astral') astralDetail(p, v, rng);
  else if (name === 'floor-forge') forgeDetail(p, v, rng);
  else if (name === 'floor-frost') frostDetail(p, v, rng);
  else if (name === 'floor-tatami') tatamiDetail(p, v, rng);
  else if (name === 'floor-onsen') onsenDetail(p, v, rng);
  else if (name === 'floor-parquet') parquetDetail(p, v, rng);
  else woodDetail(p, v, rng);
  return p;
}

/** 地毯拼块：edge 位掩码 1上 2下 4左 8右（房间内缩一格铺一张） */
export function rugTile(edge        , accent        , body        , variantSeed        )      {
  const p = new Pix(T, T);
  const m = mat(body);
  p.rect(0, 0, T, T, m.base);
  for (let j = 0; j < T; j++) for (let i = 0; i < T; i++) {
    if ((i + j) % 6 === 0) p.px(i, j, shade(body, 0.06));
    else if ((i * 3 + j) % 13 === 0) p.px(i, j, shade(body, -0.07));
  }
  // 织物起绒（很轻，只是打散色块）
  const rng = new Rng(770 + variantSeed * 131);
  for (let k = 0; k < 22; k++) p.px(1 + rng.int(T - 2), 1 + rng.int(T - 2), rng.chance(0.5) ? shade(body, 0.1) : shade(body, -0.1));
  // 中心徽章：只画在整张地毯的“内部格”，且是低反差菱形
  if (edge === 0 && variantSeed % 3 === 0) {
    for (let k = 0; k <= 5; k++) {
      const c = k === 5 ? shade(accent, -0.3) : shade(accent, -0.45);
      p.px(16 + k, 16, c); p.px(16 - k, 16, c); p.px(16, 16 + k, c); p.px(16, 16 - k, c);
    }
    p.disc(16, 16, 2, shade(accent, -0.2));
  }
  // 边饰：暗底 + 一条细亮线，不再有跳动的流苏点
  const band = (x        , y        , w        , h        )       => {
    p.rect(x, y, w, h, mix(body, accent, 0.32));
    if (w > h) { p.rect(x, y + 1, w, 1, mix(body, accent, 0.55)); p.rect(x, y + h - 1, w, 1, shade(body, -0.35)); }
    else { p.rect(x + 1, y, 1, h, mix(body, accent, 0.55)); p.rect(x + w - 1, y, 1, h, shade(body, -0.35)); }
  };
  if (edge & 1) band(0, 0, T, 4);
  if (edge & 2) band(0, T - 4, T, 4);
  if (edge & 4) band(0, 0, 4, T);
  if (edge & 8) band(T - 4, 0, 4, T);
  return p;
}

/** 暖光池（叠加混合），墙灯与炉火脚下用 */
export function glowPix(r        , color        )      {
  const d = r * 2 + 1;
  const p = new Pix(d, d);
  for (let k = r; k >= 1; k--) {
    const a = 0.05 + 0.5 * Math.pow(1 - k / r, 2.2);
    p.disc(r, r, k, `rgba(${hex3(color)},${a.toFixed(3)})`);
  }
  return p;
}

function hex3(hex        )         {
  const h = hex.replace('#', '');
  return `${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)}`;
}

/** 墙面挂饰（画在墙带上）：sconce 壁灯 / painting 画框 / pans 挂锅 / bottles 酒瓶架 / crate 货签 */
export function wallDecoPix(kind        , horiz         )      {
  const L = 22, W = 8;                             // 沿墙长 × 墙厚方向
  const p = new Pix(horiz ? L : W, horiz ? W : L);
  const put = (along        , off        , alen        , olen        , c        )       => {
    if (horiz) p.rect(along, off, alen, olen, c); else p.rect(off, along, olen, alen, c);
  };
  const dot = (along        , off        , c        )       => put(along, off, 1, 1, c);
  if (kind === 'sconce') {
    put(9, 1, 4, 2, '#4A3A2A');                    // 托架
    put(8, 2, 6, 2, '#C9922F');
    put(9, 3, 4, 1, '#8A5F1E');
    put(10, 1, 2, 1, '#FFE6B0');                   // 火苗
    dot(10, 0, '#FFF3A8'); dot(11, 0, '#F3B84B');
    put(7, 4, 8, 1, 'rgba(243,184,75,0.45)');      // 溢光
    put(5, 5, 12, 1, 'rgba(243,184,75,0.22)');
  } else if (kind === 'painting') {
    put(4, 1, L - 8, W - 2, '#3A2018');           // 金框小画（不占满整段墙）
    put(5, 2, L - 10, W - 4, '#C9922F');
    put(6, 3, L - 12, W - 6, '#2E3348');
    put(6, 3, 4, 1, '#6E5AA8');
    put(11, 3, 3, 1, '#F3B84B');
    put(6, 4, L - 12, 1, '#4A3A63');
    dot(7, 3, '#FFE6B0');
  } else if (kind === 'pans') {
    put(1, 1, L - 2, 1, '#5C5A6B');                // 挂杆
    for (let i = 0; i < 3; i++) {
      const a = 3 + i * 7;
      put(a, 2, 1, 1, '#8A8A9B');
      put(a - 2, 3, 5, 3, '#33323F');
      put(a - 1, 4, 3, 1, '#8A8A9B');
    }
  } else if (kind === 'bottles') {
    put(0, 1, L, 2, '#6E3C27');                    // 木架
    put(0, 3, L, 1, '#3A2018');
    for (let i = 0; i < 5; i++) {
      const a = 2 + i * 4;
      const c = ['#39D7D2', '#E45AD1', '#F3B84B', '#8DDB4A', '#7FB7C9'][i];
      put(a, 3, 2, 4, c);
      dot(a, 4, '#FFE6B0');
      put(a, 2, 2, 1, '#3A2018');
    }
  } else {                                          // 钉在墙上的羊皮清单
    put(5, 2, L - 10, W - 4, '#D8C9A0');
    put(5, 2, L - 10, 1, '#EFE3C0');
    put(6, 3, L - 13, 1, '#6B5A45');
    put(6, 4, Math.max(2, L - 16), 1, '#6B5A45');
    dot(5, 2, '#8A8A9B'); dot(L - 6, 2, '#8A8A9B');
  }
  return p;
}
