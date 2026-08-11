// 头部：脸型 × 眼睛 × 刘海 × 发型长度（全部手写模板，左半幅镜像 → 天然严格对称）
// 规格取自参考图 .uploads/image-25..29 的逐像素测量：
//   image-32/33/34 三度复测定稿：**脸窗 12px 宽 × 10 行**，发量比脸宽出一大圈（24px）；
//   眼睛每只 4px 宽 × 3 行、**眼距 2px**、外侧一列黑楔＋内侧白眼白；眼上 1 行额头、眼下颊红＋3 行下巴；
//   瞳孔同色渐变上暗下亮＋内侧白眼白/单像素高光；颊侧有 2~3px 淡红；无鼻无嘴。
import { mix,          } from './pix.js';

export const CANVAS_W = 64;
export const CANVAS_H = 72;
export const CX = 32;              // 对称轴落在 x=31|32 之间，镜像 x → 63-x
export const FEET_Y = 68;
export const HALF_X0 = 14;         // 左半幅局部 x=0 → 画布 x=14
export const FACE_Y0 = 16;         // 脸皮肤第一行（4..15 全是发量）
export const FACE_ROWS = 10;       // 脸到下巴 10 行（y=16..25）
export const EYE_Y = 19;           // 眼睛顶行（黑上沿）；眼块 19..22，颊红 23，下巴 24..25
export const EYE_X = 27;           // 左眼最左，4px 宽 → 27..30，眼距 2px，镜像 33..36

/** 一格模板：[画布y, 左半幅局部x, 字符串] */
                                            

                       
                                          
                                                 
  

const INK = '#120C16';
export function colorFor(ch        , p         )                {
  switch (ch) {
    case 'K': return INK;
    case 'X': return mix(p.hair, '#0B0810', 0.5);
    case 'D': return mix(p.hair, '#0B0810', 0.26);
    case 'H': return p.hair;
    case 'L': return mix(p.hair, '#FFFFFF', 0.2);
    case 'W': return mix(p.hair, '#FFFFFF', 0.46);
    case 's': return p.skin;
    case 'd': return mix(p.skin, '#7A5F58', 0.17);
    case 'x': return mix(p.skin, '#5C4440', 0.34);
    case 'h': return mix(p.skin, '#FFFFFF', 0.3);
    case 'p': return mix(p.skin, '#D9737F', 0.42);
    case 'e': return mix(p.eye, '#0B0810', 0.6);
    case 'E': return mix(p.eye, '#0B0810', 0.22);
    case 'G': return mix(p.eye, '#FFFFFF', 0.32);
    case 'S': return '#FFFFFF';
    case 'A': return p.clothA;
    case 'a': return mix(p.clothA, '#0B0810', 0.3);
    case 'q': return mix(p.clothA, '#FFFFFF', 0.18);
    case 'B': return p.clothB;
    case 'b': return mix(p.clothB, '#0B0810', 0.3);
    case 'w': return mix(p.clothB, '#FFFFFF', 0.2);
    case 'M': return p.accent;
    case 'm': return mix(p.accent, '#0B0810', 0.32);
    case 'F': return '#F1EAE0';
    case 'f': return '#C6BBB2';
    default: return null;
  }
}

/** 画左半幅并镜像到右半幅 */
export function paintSpans(p     , spans        , pal         , dy = 0)       {
  for (const [y, x, str] of spans) {
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch === '.') continue;
      const c = colorFor(ch, pal);
      if (!c) continue;
      const lx = HALF_X0 + x + i;
      p.px(lx, y + dy, c);
      p.px(63 - lx, y + dy, c);
    }
  }
}

/** 只画左半幅（不镜像）：给单片镜/眼罩这类不对称配饰用 */
export function paintSpansL(p     , spans        , pal         , dy = 0)       {
  for (const [y, x, str] of spans) {
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch === '.') continue;
      const c = colorFor(ch, pal);
      if (!c) continue;
      p.px(HALF_X0 + x + i, y + dy, c);
    }
  }
}

// ---------------- 配饰：画在脸与种族件之上 ----------------
/** sym=false → 只画一侧（不对称）；back=true → 背面也画（帽子/头巾/发带这类绕头一圈的） */
;                                                                                               
export const ACCS           = [
  { id: 'none', name: '无', spans: [] },
  { id: 'round', name: '圆框眼镜', spans: [
    [18, 12, 'MMMM'],
    [19, 11, 'M..M'],
    [19, 16, 'MM'],
    [20, 11, 'M..M'],
    [21, 12, 'MMMM'],
  ] },
  { id: 'square', name: '方框眼镜', spans: [
    [18, 11, 'MMMMM'],
    [19, 11, 'M...M'],
    [19, 16, 'MM'],
    [20, 11, 'M...M'],
    [21, 11, 'MMMMM'],
  ] },
  { id: 'shades', name: '墨镜', spans: [
    [18, 11, 'MMMMMM'],
    [19, 11, 'KKKKKM'],
    [19, 16, 'MM'],
    [20, 11, 'KKKKKM'],
    [21, 11, 'KKKKMM'],
  ] },
  { id: 'monocle', name: '单片镜', sym: false, spans: [
    [18, 12, 'MMMM'],
    [19, 12, 'M..M'],
    [20, 12, 'M..M'],
    [21, 12, 'MMMM'],
    [22, 13, 'M'],
    [23, 13, 'M'],
    [24, 14, 'M'],
  ] },
  { id: 'patch', name: '眼罩', sym: false, spans: [
    [17, 10, 'KKKKKKK'],
    [18, 11, 'KKKKK'],
    [19, 11, 'KKKKK'],
    [20, 11, 'KKKKK'],
    [21, 11, 'KKKK'],
    [22, 12, 'KKK'],
  ] },
  { id: 'goggles', name: '护目镜', back: true, spans: [
    [14, 9, 'KKKKKKKKK'],
    [15, 9, 'KMMMMMMMM'],
    [16, 9, 'KMSSMMSSM'],
    [17, 9, 'KKKKKKKKK'],
  ] },
  { id: 'band', name: '发带', back: true, spans: [
    [16, 9, 'AAAAAAAAA'],
    [17, 9, 'AMMMMMMMM'],
    [18, 9, 'AA'],
  ] },
  { id: 'scarfhead', name: '头巾', back: true, spans: [
    [12, 9, 'AAAAAAAAA'],
    [13, 8, 'AAAAAAAAAA'],
    [14, 8, 'AAMMMMMMMM'],
    [15, 8, 'AAAAAAAAAA'],
    [16, 8, 'AAAAAAAAAA'],
    [17, 8, 'AA'],
    [18, 8, 'AA'],
    [19, 9, 'A'],
  ] },
  { id: 'beret', name: '贝雷帽', back: true, spans: [
    [4, 13, 'MM'],
    [5, 10, 'AAAAAAA'],
    [6, 9, 'AAAAAAAA'],
    [7, 8, 'AAAAAAAAA'],
    [8, 8, 'AAMMMMMMM'],
    [9, 8, 'AAAAAAAAA'],
    [10, 8, 'AAAAAAAAA'],
    [11, 9, 'AAAAAAAA'],
    [12, 10, 'aaaaaaa'],
  ] },
  { id: 'earring', name: '耳环', spans: [
    [20, 11, 'M'],
    [21, 11, 'M'],
    [22, 11, 'M'],
    [23, 11, 'M'],
  ] },
  { id: 'veil', name: '面纱', spans: [
    [22, 12, 'AAAAAA'],
    [23, 12, 'AAAAAA'],
    [24, 13, 'AAAAA'],
    [25, 15, 'AAA'],
  ] },
  { id: 'mask', name: '口罩', spans: [
    [21, 12, 'fFFFFF'],
    [22, 12, 'FFFFFF'],
    [23, 12, 'FFFFFF'],
    [24, 13, 'FFFFF'],
    [25, 15, 'FFF'],
  ] },
  { id: 'flower', name: '头花', sym: false, spans: [
    [13, 8, '.BB'],
    [14, 7, 'bBBb'],
    [15, 7, 'bBMBb'],
    [16, 8, 'bBb'],
  ] },
  { id: 'horncirc', name: '额环', back: true, spans: [
    [15, 12, 'MMMM'],
    [16, 11, 'M'],
    [16, 16, 'MM'],
    [17, 11, 'M'],
  ] },
];
export const ACC_NAMES = ACCS.map((a) => a.name);

// ---------------- 脸型：每行皮肤宽度（偶数，居中） ----------------
                                                                
export const FACES            = [
  { id: 'round', name: '圆脸', w: [8, 10, 12, 12, 12, 12, 12, 12, 10, 6] },
  { id: 'oval', name: '鹅蛋脸', w: [6, 10, 12, 12, 12, 12, 12, 10, 8, 4] },
  { id: 'square', name: '方脸', w: [10, 12, 12, 12, 12, 12, 12, 12, 12, 8] },
  { id: 'sharp', name: '尖脸', w: [8, 10, 12, 12, 12, 12, 12, 10, 8, 4] },
  { id: 'chubby', name: '团子脸', w: [10, 12, 14, 14, 14, 14, 14, 14, 12, 8] },
  { id: 'cat', name: '猫脸', w: [8, 12, 12, 12, 12, 12, 12, 10, 8, 4] },
];

// ---------------- 眼睛：每只 4px 宽（左眼，第 0~1 列＝外侧黑楔），瞳色上暗下亮 ----------------
export const EYES           = [
  // 列序＝[外, ., ., 内]：**亮部在外侧、暗部朝中间**，下沿最亮、上沿最暗
  // （量自 .uploads/image-38/39/40：外侧列是最亮虹膜，内侧列是暗虹膜，原来画反了）
  { id: 'round', name: '圆瞳', rows: ['KKKK', 'GEeK', 'SGK.'] },
  { id: 'almond', name: '杏眼', rows: ['.KKK', 'GEeK', 'SGK.'] },
  { id: 'sharp', name: '细长', rows: ['KKKK', 'SGeK'] },
  { id: 'up', name: '上扬', rows: ['..KK', 'GEeK', 'SGK.'] },
  { id: 'droop', name: '垂眼', rows: ['KKKK', 'GEeK', 'SGeK', 'SG..'] },
  { id: 'big', name: '大眼', rows: ['KKKK', 'GEeK', 'SGeK', 'SGK.'] },
  { id: 'sleepy', name: '困眼', rows: ['KKKK', 'SGeK', 'KKK.'] },
  { id: 'slit', name: '兽瞳', rows: ['KKKK', 'GeEK', 'SeK.'] },
  { id: 'glow', name: '妖瞳', rows: ['KKKK', 'GSGK', 'SGK.'] },
  { id: 'dull', name: '呆眼', rows: ['KKKK', 'GeeK', 'SeK.'] },
];

/** 光头：没有头发时补上的头骨（皮肤色，比脸宽 1px） */
const SKULL         = [
  [8, 14, 'dhhh'],
  [9, 12, 'dhhhhh'],
  [10, 11, 'dhssssss'],
  [11, 11, 'dsssssss'],
  [12, 11, 'dsssssss'],
  [13, 11, 'dsssssss'],
  [14, 11, 'dsssssss'],
  [15, 11, 'dsssssss'],
  [16, 11, 'ds'],
  [17, 11, 'ds'],
];

// ---------------- 头盖：发量比脸宽出一大圈（24px），并沿脸侧包到下巴附近 ----------------
const DOME         = [
  [5, 13, 'XXLLL'],
  [6, 11, 'XLLLLLL'],
  [7, 10, 'XLLLLLLL'],
  [8, 9, 'XLLLHHHHH'],
  [9, 8, 'XLLHHHHHHH'],
  [10, 8, 'XLHHHHHHHH'],
  [11, 8, 'XHHHHHHHHH'],
  [12, 8, 'XHHHHHHHHH'],
  [13, 8, 'XHHHHHHHHH'],
  [14, 8, 'XHHHHHHHHH'],
  [15, 8, 'XHHHHHHHHH'],
  [16, 8, 'XHHHD'],
  [17, 8, 'XHHHD'],
  [18, 8, 'XHHD'],
  [19, 9, 'XHD'],
  [20, 9, 'XD'],
];

export const FRINGES              = [
  { id: 'straight', name: '齐刘海', spans: [
    [14, 8, 'HHHHHHHHHH'],
    [15, 8, 'HHHHHHHHHH'],
    [16, 8, 'HHHHHHHHHH'],
    [17, 8, 'DDDDDDDDDD'],
    [18, 10, 'XX'],
  ] },
  { id: 'part', name: '中分', spans: [
    [15, 8, 'HHHHHHHHHH'],
    [16, 8, 'HHHHHHHHHD'],
    [17, 8, 'HHHHHHHD'],
    [18, 8, 'DHHHHD'],
    [19, 8, 'XDHD'],
    [20, 9, 'XD'],
  ] },
  { id: 'short', name: '眉上短', spans: [
    [15, 8, 'HHHHHHHHHH'],
    [16, 8, 'DDDDDDDDDD'],
    [17, 10, 'XX'],
  ] },
  { id: 'spiky', name: '碎发', spans: [
    [15, 8, 'HHHHHHHHHH'],
    [16, 8, 'HDHHHHDHHH'],
    [17, 8, 'D.DDHH.DDD'],
    [18, 8, '...DXD..XD'],
    [19, 12, '.X'],
  ] },
  { id: 'swept', name: '斜分', spans: [
    [15, 8, 'HHHHHHHHHH'],
    [16, 8, 'HHHHHHHHHH'],
    [17, 8, 'HHHHHHHDDD'],
    [18, 8, 'DHHHDD'],
    [19, 9, 'XDD'],
  ] },
  { id: 'none', name: '全露额', spans: [
    [15, 8, 'HHHHHHHHHH'],
    [16, 8, 'HHHDDDDDDD'],
    [17, 8, 'DD'],
  ] },
  { id: 'upswept', name: '上梳', spans: [
    [13, 8, 'HHHHHHHHHH'],
    [14, 8, 'HLHHHLHHHH'],
    [15, 8, 'HHHHHHHHHH'],
    [16, 8, 'DDDDDDDDDD'],
    [17, 10, 'XX'],
  ] },
  { id: 'curtain', name: '中长中分', spans: [
    [15, 8, 'HHHHHHHHHH'],
    [16, 8, 'HHHHHHHHHD'],
    [17, 8, 'HHHHHHHD'],
    [18, 8, 'HHHHHD'],
    [19, 8, 'HHHDD'],
    [20, 8, 'DHHD'],
    [21, 8, 'XDD'],
  ] },
];

// ---------------- 发型长度：under＝身体之前（后发量），over＝脸之后（前侧发） ----------------
                                                                                                                     

/** 紧头盖：贴着头皮，只比脸宽 2px（寸头/背头/莫霍克这类男性短发用） */
export const TIGHT_DOME         = [
  [6, 14, 'XLLL'],
  [7, 12, 'XLLLLL'],
  [8, 11, 'XLLHHHH'],
  [9, 10, 'XLHHHHHH'],
  [10, 10, 'XHHHHHHH'],
  [11, 10, 'XHHHHHHH'],
  [12, 10, 'XHHHHHHH'],
  [13, 11, 'XHHHHHH'],
  [14, 11, 'XHHHHHH'],
  [15, 12, 'XHHHHH'],
];

/** 寸头专用：更扁更贴，只到 14px 宽，露出太阳穴 */
export const BUZZ_DOME         = [
  [8, 14, 'XLLL'],
  [9, 12, 'XLLLLL'],
  [10, 11, 'XLHHHHH'],
  [11, 11, 'XHHHHHH'],
  [12, 11, 'XHHHHHH'],
  [13, 11, 'XHHHHHH'],
  [14, 12, 'XHHHHH'],
  [15, 12, 'XHHHHH'],
];
export const LENGTHS              = [
  { id: 'bald', name: '无', under: [], over: [] },
  { id: 'short', name: '短发', under: [
    [16, 7, 'XHHHD'],
    [17, 7, 'XHHHD'],
    [18, 7, 'XHHD'],
    [19, 8, 'XHD'],
    [20, 8, 'XD'],
  ], over: [
    [16, 9, 'HHD'],
    [17, 9, 'HHD'],
    [18, 10, 'HD'],
    [19, 10, 'XD'],
  ] },
  { id: 'bob', name: '波波头', under: [
    [16, 6, 'XHHHHD'],
    [17, 6, 'XHHHHHD'],
    [18, 6, 'XHHHHHD'],
    [19, 6, 'XHHHHHD'],
    [20, 6, 'XHHHHHD'],
    [21, 6, 'XHHHHHD'],
    [22, 7, 'XHHHHD'],
    [23, 7, 'XDHHD'],
    [24, 8, 'XXDD'],
  ], over: [
    [16, 9, 'HHD'],
    [17, 9, 'HHD'],
    [18, 9, 'HHD'],
    [19, 9, 'HHD'],
    [20, 9, 'HHD'],
    [21, 9, 'HHD'],
    [22, 9, 'DHD'],
    [23, 10, 'XD'],
  ] },
  { id: 'long', name: '长直发', under: [
    [16, 6, 'XHHHHD'],
    [17, 5, 'XHHHHHD'],
    [18, 5, 'XHHHHHHD'],
    [19, 5, 'XHHHHHHD'],
    [20, 5, 'XHHHHHHD'],
    [21, 5, 'XHHHHHHD'],
    [22, 5, 'XHHHHHHD'],
    [23, 5, 'XHHHHHHD'],
    [24, 5, 'XHHHHHHD'],
    [25, 5, 'XHHHHHHD'],
    [26, 5, 'XHHHHHHHD'],
    [27, 5, 'XHHHHHHHD'],
    [28, 5, 'XHHHHHHHD'],
    [29, 5, 'XLHHHHHHD'],
    [30, 5, 'XLHHHHHHD'],
    [31, 5, 'XHHHHHHHD'],
    [32, 5, 'XHHHHHHHD'],
    [33, 5, 'XHHHHHHHD'],
    [34, 5, 'XHHHHHHD'],
    [35, 5, 'XHHHHHHD'],
    [36, 5, 'XHHHHHD'],
    [37, 6, 'XHHHHD'],
    [38, 6, 'XHHHD'],
    [39, 7, 'XHHD'],
    [40, 7, 'XDD'],
  ], over: [
    [16, 9, 'HHD'],
    [17, 9, 'HHD'],
    [18, 9, 'HHD'],
    [19, 9, 'HHD'],
    [20, 9, 'HHD'],
    [21, 9, 'HHD'],
    [22, 9, 'HHD'],
    [23, 9, 'HHD'],
    [24, 9, 'HHD'],
    [25, 9, 'HHD'],
    [26, 9, 'DHD'],
    [27, 10, 'HD'],
    [28, 10, 'HD'],
    [29, 10, 'XD'],
  ] },
  { id: 'tail', name: '高马尾', under: [
    [0, 14, 'XXXX'],
    [1, 12, 'XLLLLL'],
    [2, 11, 'XLLLLLL'],
    [3, 11, 'XLHHHHH'],
    [4, 11, 'XHHHHHH'],
    [5, 11, 'XHHHHHH'],
    [6, 12, 'XHHHHH'],
    [7, 12, 'XHHHH'],
    [16, 7, 'XHHHD'],
    [17, 7, 'XHHHD'],
    [18, 8, 'XHHD'],
    [19, 8, 'XHD'],
  ], over: [
    [16, 9, 'HHD'],
    [17, 9, 'HHD'],
    [18, 10, 'HD'],
    [19, 10, 'XD'],
    [8, 13, 'MMMMM'],
    [9, 13, 'mmmmm'],
  ] },
  { id: 'twin', name: '双马尾', under: [
    [12, 5, 'XXX'],
    [13, 4, 'XLLLX'],
    [14, 4, 'XLHHHX'],
    [15, 4, 'XHHHHX'],
    [16, 4, 'XHHHHHD'],
    [17, 4, 'XHHHHHD'],
    [18, 4, 'XHHHHD'],
    [19, 4, 'XHHHHD'],
    [20, 4, 'XHHHD'],
    [21, 4, 'XHHHD'],
    [22, 5, 'XHHD'],
    [23, 5, 'XHD'],
    [24, 5, 'XD'],
  ], over: [
    [16, 9, 'HHD'],
    [17, 9, 'HHD'],
    [18, 10, 'HD'],
    [19, 10, 'XD'],
    [13, 7, 'MM'],
    [14, 7, 'mm'],
  ] },
  { id: 'messy', name: '蓬乱', under: [
    [2, 15, 'XLX'],
    [3, 12, 'XLXXLL'],
    [4, 10, 'XLLXLLLL'],
    [5, 9, 'XLLLLLLLL'],
    [6, 8, 'XLLLLLLLLL'],
    [16, 7, 'XHHHD'],
    [17, 6, 'XHHHHD'],
    [18, 6, 'XHHHD'],
    [19, 7, 'XHXD'],
    [20, 7, 'XD'],
  ], over: [
    [16, 9, 'HHD'],
    [17, 9, 'DHD'],
    [18, 10, 'XD'],
  ] },
  { id: 'buzz', name: '寸头', dome: BUZZ_DOME, fringeMax: 14, under: [], over: [
    [16, 11, 'D'],
  ] },
  { id: 'undercut', name: '背头', dome: TIGHT_DOME, fringeMax: 14, under: [
    [5, 12, 'XLLLLL'],
    [6, 11, 'XLLLLLL'],
    [7, 11, 'XLHHHHH'],
    [8, 11, 'XHHHHHH'],
  ], over: [
    [16, 11, 'D'],
  ] },
  { id: 'topknot', name: '武士髻', dome: TIGHT_DOME, fringeMax: 15, under: [
    [2, 14, 'XXXX'],
    [3, 13, 'XHHHH'],
    [4, 13, 'XLHHH'],
    [5, 13, 'XHHHH'],
    [6, 13, 'XHHHH'],
    [7, 14, 'XDDD'],
    [16, 12, 'XHHD'],
    [17, 12, 'XHD'],
    [18, 13, 'XD'],
  ], over: [
    [16, 10, 'HD'],
    [17, 11, 'D'],
  ] },
  { id: 'wolf', name: '狼尾', under: [
    [16, 7, 'XHHHHD'],
    [17, 6, 'XHHHHHD'],
    [18, 6, 'XHHHHHD'],
    [19, 6, 'XHHHHHD'],
    [20, 6, 'XHHHHHD'],
    [21, 7, 'XHHHHD'],
    [22, 7, 'XDHHHD'],
    [23, 8, 'XHHD'],
    [24, 8, 'XDHD'],
    [25, 9, 'XDD'],
  ], over: [
    [16, 9, 'HHD'],
    [17, 9, 'HHD'],
    [18, 10, 'HD'],
    [19, 10, 'XD'],
  ] },
  { id: 'curly', name: '卷毛', under: [
    [3, 13, 'XLXL'],
    [4, 11, 'XLXLLL'],
    [5, 9, 'XLLXLLLL'],
    [6, 8, 'XLXLLLLLL'],
    [16, 6, 'XHHHHD'],
    [17, 6, 'XHXHHD'],
    [18, 6, 'XHHHHD'],
    [19, 6, 'XHXHD'],
    [20, 7, 'XHHHD'],
    [21, 7, 'XDHD'],
    [22, 8, 'XDD'],
  ], over: [
    [16, 9, 'HHD'],
    [17, 9, 'DHD'],
    [18, 10, 'HD'],
    [19, 10, 'XD'],
  ] },
  { id: 'mohawk', name: '莫霍克', dome: TIGHT_DOME, fringeMax: 12, under: [
    [0, 15, 'XMM'],
    [1, 14, 'XHHH'],
    [2, 14, 'XLHH'],
    [3, 13, 'XHHHH'],
    [4, 13, 'XHHHH'],
    [5, 13, 'XHHHH'],
    [6, 14, 'XHHH'],
  ], over: [
    [16, 11, 'DD'],
  ] },
  { id: 'braid', name: '长辫', under: [
    [16, 8, 'XHHHD'],
    [17, 8, 'XHHHD'],
    [18, 9, 'XHHD'],
    [26, 13, 'XHHHH'],
    [27, 13, 'XDHHH'],
    [28, 13, 'XHHHH'],
    [29, 13, 'XDHHH'],
    [30, 13, 'XHHHH'],
    [31, 13, 'XDHHH'],
    [32, 13, 'XHHHH'],
    [33, 14, 'XDHH'],
    [34, 14, 'XMM'],
  ], over: [
    [16, 9, 'HHD'],
    [17, 9, 'HHD'],
    [18, 10, 'HD'],
    [19, 10, 'XD'],
  ] },
  { id: 'spike', name: '刺猬头', dome: TIGHT_DOME, fringeMax: 14, under: [
    [3, 11, 'X.X.X.X'],
    [4, 10, 'XHXHXHXH'],
    [5, 10, 'XHHHHHHH'],
    [6, 10, 'XHHHHHHH'],
  ], over: [
    [16, 11, 'D'],
  ] },
  { id: 'tall', name: '冲天马尾', dome: TIGHT_DOME, fringeMax: 15, under: [
    [0, 15, 'X.X'],
    [1, 14, 'XHXH'],
    [2, 14, 'XHHH'],
    [3, 13, 'XHLHH'],
    [4, 13, 'XHHHH'],
    [5, 12, 'XHHHHH'],
    [6, 12, 'XDHHHH'],
    [7, 12, 'XMMMMM'],
    [16, 12, 'XHHD'],
    [17, 12, 'XHD'],
    [18, 13, 'XD'],
  ], over: [
    [16, 10, 'HD'],
    [17, 11, 'D'],
  ] },
  { id: 'shaggy', name: '披肩乱发', under: [
    [16, 7, 'XHHHHD'],
    [17, 6, 'XHHHHHD'],
    [18, 6, 'XHHHHHD'],
    [19, 5, 'XHHHHHHD'],
    [20, 5, 'XHHHHHHD'],
    [21, 5, 'XDHHHHHD'],
    [22, 5, 'XHHHHHHD'],
    [23, 6, 'XHHHHHD'],
    [24, 6, 'XDHHHHD'],
    [25, 6, 'XHHHHD'],
    [26, 7, 'XDHHD'],
    [27, 7, 'XHHD'],
    [28, 8, 'XDD'],
  ], over: [
    [16, 9, 'HHD'],
    [17, 9, 'HDH'],
    [18, 9, 'HHD'],
    [19, 10, 'HD'],
    [20, 10, 'XD'],
  ] },
  { id: 'halfup', name: '半马尾', under: [
    [2, 14, 'XHHH'],
    [3, 13, 'XHHHH'],
    [4, 13, 'XDHHH'],
    [5, 14, 'XDDD'],
    [16, 7, 'XHHHHD'],
    [17, 7, 'XHHHHD'],
    [18, 7, 'XHHHHD'],
    [19, 8, 'XHHHD'],
    [20, 8, 'XDHHD'],
    [21, 8, 'XHHD'],
    [22, 9, 'XDD'],
  ], over: [
    [16, 9, 'HHD'],
    [17, 9, 'HHD'],
    [18, 10, 'HD'],
  ] },
  { id: 'viking', name: '维京辫', dome: TIGHT_DOME, fringeMax: 14, under: [
    [16, 12, 'XHHD'],
    [17, 12, 'XHD'],
    [18, 13, 'XD'],
  ], over: [
    [16, 9, 'HH'],
    [17, 9, 'DH'],
    [18, 9, 'HH'],
    [19, 9, 'DH'],
    [20, 9, 'HH'],
    [21, 9, 'DH'],
    [22, 9, 'HH'],
    [23, 9, 'MM'],
  ] },
  { id: 'slick', name: '油头', dome: TIGHT_DOME, fringeMax: 13, under: [
    [6, 11, 'XLLLLL'],
    [7, 11, 'XWHHHH'],
    [8, 11, 'XHHHHH'],
  ], over: [
    [16, 11, 'D'],
  ] },
  { id: 'afro', name: '爆炸头', under: [
    [2, 11, 'XDHHHHH'],
    [3, 9, 'XDHHHHHHH'],
    [4, 7, 'XDHHHHHHHHH'],
    [5, 6, 'XDHHHLHHHHHH'],
    [6, 5, 'XDHHHLLHHHHHH'],
    [7, 5, 'XDHHHHHHHHHHH'],
    [8, 5, 'XDHHHHHHHHHHH'],
    [9, 5, 'XDHHHHHHHHHHH'],
    [10, 5, 'XDHHHHHHHHHHH'],
    [11, 5, 'XDHHHHHHHHHHH'],
    [12, 5, 'XDHHHHHHHHHHH'],
    [13, 5, 'XDHHHHHHHHHHH'],
    [14, 5, 'XDHHHHHHHHHHH'],
    [15, 5, 'XDHHHHHHHHHHH'],
    [16, 5, 'XDHHHHHHH'],
    [17, 5, 'XDHHHHHH'],
    [18, 5, 'XDHHHHH'],
    [19, 6, 'XDHHHH'],
    [20, 6, 'XDHHH'],
    [21, 7, 'XDH'],
  ], over: [
    [16, 9, 'HHD'],
    [17, 9, 'HHD'],
    [18, 10, 'HD'],
  ] },
  { id: 'hime', name: '姬发式', under: [
    [16, 7, 'XHHHHD'],
    [17, 7, 'XHHHHD'],
    [18, 7, 'XHHHHD'],
    [19, 7, 'XHHHHD'],
    [20, 7, 'XHHHHD'],
    [21, 7, 'XHHHHD'],
    [22, 7, 'XHHHHD'],
    [23, 7, 'XHHHHD'],
    [24, 7, 'XHHHHD'],
    [25, 7, 'XHHHHD'],
    [26, 7, 'XHHHHD'],
    [27, 7, 'XHHHHD'],
    [28, 7, 'XHHHHD'],
    [29, 7, 'XHHHHD'],
    [30, 7, 'XHHHHD'],
    [31, 7, 'XDDDDD'],
  ], over: [
    [16, 9, 'HHHD'],
    [17, 9, 'HHHD'],
    [18, 9, 'HHHD'],
    [19, 9, 'HHHD'],
    [20, 9, 'HHHD'],
    [21, 9, 'HHHD'],
    [22, 9, 'DDDD'],
  ] },
  { id: 'dread', name: '脏辫', under: [
    [16, 6, 'XHHHHD'],
    [17, 6, 'XHHHHD'],
    [18, 6, 'XHHHHD'],
    [19, 6, 'XH.HHD'],
    [20, 6, 'XHHHHD'],
    [21, 6, 'XH.H.D'],
    [22, 6, 'XHHHHD'],
    [23, 6, 'XH.HHD'],
    [24, 6, 'XHHH.D'],
    [25, 6, 'XH.HHD'],
    [26, 6, 'XHHH.D'],
    [27, 7, 'XH.HD'],
    [28, 7, 'XHHHD'],
    [29, 7, 'XM.MD'],
  ], over: [
    [16, 9, 'HHD'],
    [17, 9, 'H.D'],
    [18, 9, 'HHD'],
    [19, 9, 'H.D'],
    [20, 9, 'HHD'],
    [21, 9, 'M.D'],
  ] },
  { id: 'pompadour', name: '飞机头', dome: TIGHT_DOME, fringeMax: 13, under: [
    [2, 12, 'XLLLL'],
    [3, 11, 'XLLLLL'],
    [4, 10, 'XLHHHHH'],
    [5, 10, 'XHHHHHH'],
    [6, 10, 'XHHHHHH'],
    [7, 10, 'XDHHHHH'],
  ], over: [
    [16, 11, 'D'],
  ] },
  { id: 'sidelock', name: '双侧长发', dome: TIGHT_DOME, fringeMax: 15, under: [
    [16, 12, 'XHHD'],
    [17, 12, 'XHD'],
  ], over: [
    [16, 9, 'HHD'],
    [17, 9, 'HHD'],
    [18, 9, 'HHD'],
    [19, 9, 'HHD'],
    [20, 9, 'HHD'],
    [21, 9, 'HHD'],
    [22, 9, 'HHD'],
    [23, 9, 'HHD'],
    [24, 9, 'HHD'],
    [25, 9, 'DHD'],
    [26, 9, 'HHD'],
    [27, 10, 'HD'],
    [28, 10, 'MD'],
  ] },
  { id: 'crop', name: '短碎盖', under: [
    [16, 7, 'XHHHHD'],
    [17, 7, 'XHHHHD'],
    [18, 7, 'XHHHD'],
    [19, 8, 'XHHD'],
  ], over: [
    [16, 8, 'HHHHHHHHHH'],
    [17, 8, 'HDHHHHDHHH'],
    [18, 8, 'DHHDHHHDHD'],
    [19, 9, 'D.DD.DD.D'],
  ] },
];

// ---------------- 合成 ----------------
                                                                                                                   

/** 后发量：画在身体之前 */
export function isBald(o          )          { return LENGTHS[o.length % LENGTHS.length].id === 'bald'; }

/** 把左半幅模板整体向内收 n 列（紧头盖的发型要用，否则刘海比头骨还宽） */
function inset(spans        , n        )         {
  const out         = [];
  for (const [y, x0, str] of spans) {
    if (str.length <= n) continue;
    out.push([y, x0 + n, str.slice(n)]);
  }
  return out;
}

export function drawHairUnder(p     , o          , dy = 0)       {
  const L = LENGTHS[o.length % LENGTHS.length];
  paintSpans(p, isBald(o) ? SKULL : (L.dome || DOME), o.pal, dy);
  paintSpans(p, L.under, o.pal, dy);
}

/** 脸＋眼＋刘海＋前侧发 */
export function drawFace(p     , o          , dy = 0)       {
  const F = FACES[o.face % FACES.length];
  const pal = o.pal;
  const skin = colorFor('s', pal)          ;
  const dark = colorFor('d', pal)          ;
  const edge = colorFor('x', pal)          ;
  if (!o.back) {
    for (let r = 0; r < FACE_ROWS; r++) {
      const w = F.w[r], y = FACE_Y0 + r + dy;
      if (w <= 0) continue;
      const x0 = CX - w / 2;
      p.rect(x0, y, w, 1, skin);
      p.px(x0, y, edge); p.px(x0 + w - 1, y, edge);          // 侧缘压暗
      if (r === FACE_ROWS - 1) p.rect(x0, y, w, 1, edge);   // 只有最后一行压成下巴墨缘，别做成两行胡渣
    }
    if (!isBald(o)) {                                  // 刘海压出的暗带
      for (let r = 0; r < 2; r++) {
        const w = F.w[r];
        if (w > 2) p.rect(CX - w / 2 + 1, FACE_Y0 + r + dy, w - 2, 1, dark);
      }
    }
    drawEyes(p, o, dy);
    const blush = colorFor('p', pal)          ;        // 颊红：眼下外侧一小段
    const cw = F.w[FACE_ROWS - 4];
      if (cw >= 10) { p.rect(CX - cw / 2 + 1, EYE_Y + 3 + dy, 2, 1, blush); p.rect(CX + cw / 2 - 3, EYE_Y + 3 + dy, 2, 1, blush); }
  } else {
    // 背面：整块用发色填掉（后脑勺）
    const bald = isBald(o);
    const hair = bald ? skin : colorFor('H', pal)          ;
    const hd = bald ? dark : colorFor('D', pal)          ;
    for (let r = 0; r < FACE_ROWS - 2; r++) {
      const w = F.w[r], y = FACE_Y0 + r + dy;
      if (w <= 0) continue;
      p.rect(CX - w / 2, y, w, 1, r > FACE_ROWS - 6 ? hd : hair);
    }
    const w2 = F.w[FACE_ROWS - 3];
    p.rect(CX - w2 / 2 + 2, FACE_Y0 + FACE_ROWS - 2 + dy, w2 - 4, 1, colorFor('d', pal)          );
  }
  if (!isBald(o)) {
    const L = LENGTHS[o.length % LENGTHS.length];
    let fr = FRINGES[o.fringe % FRINGES.length].spans;
    if (L.dome) fr = inset(fr, 4);                       // 紧头盖的发型：刘海收窄
    if (L.fringeMax !== undefined) fr = fr.filter((sp) => sp[0] <= (L.fringeMax          ));  // 男性短发只留发际线
    paintSpans(p, fr, pal, dy);
    paintSpans(p, L.over, pal, dy);
  }
}

function drawEyes(p     , o          , dy        )       {
  const E = EYES[o.eye % EYES.length];
  for (let r = 0; r < E.rows.length; r++) {
    const row = E.rows[r];
    for (let i = 0; i < row.length; i++) {
      const c = colorFor(row[i], o.pal);
      if (!c) continue;
      const x = EYE_X + i, y = EYE_Y + r + dy;
      p.px(x, y, c);
      p.px(63 - x, y, c);
    }
  }
  if (E.lash) paintSpans(p, E.lash, o.pal, dy);
}

/** 头部外轮廓：只在实体外侧补 1px 墨线（参考图每个色块都有硬描边） */
export function outline(p     , y0        , y1        )       {
  const img = p.ctx.getImageData(0, 0, p.w, p.h);
  const d = img.data;
  const at = (x        , y        )         => (y * p.w + x) * 4 + 3;
  const add           = [];
  for (let y = Math.max(1, y0); y < Math.min(p.h - 1, y1); y++) {
    for (let x = 1; x < p.w - 1; x++) {
      if (d[at(x, y)] > 40) continue;
      if (d[at(x - 1, y)] > 150 || d[at(x + 1, y)] > 150 || d[at(x, y - 1)] > 150 || d[at(x, y + 1)] > 150) add.push(x, y);
    }
  }
  for (let i = 0; i < add.length; i += 2) p.px(add[i], add[i + 1], INK);
}
