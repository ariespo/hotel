// 像素材质工具箱：家具/墙体共用。所有明暗都是「边缘暗、中心亮」的对称打光，
// 因为家具靠整数 90° 旋转得到四向 —— 方向性打光一转就错，唯一允许方向性的是使用面标记。
import { Pix, mix, shade } from './pix.js';

                                                                        

export function mat(base        , inkMix = '#140E1A')      {
  return { base, hi: shade(base, 0.26), lo: shade(base, -0.22), ink: mix(shade(base, -0.62), inkMix, 0.45) };
}

/** 带 1px 描边 + 内侧一圈 AO + 中心提亮的底板（所有家具的地基） */
export function plate(p     , x        , y        , w        , h        , m     , round = 1)       {
  p.rect(x, y, w, h, m.ink);
  p.rect(x + 1, y + 1, w - 2, h - 2, m.lo);
  p.rect(x + 2, y + 2, w - 4, h - 4, m.base);
  if (w > 8 && h > 8) p.rect(x + 4, y + 4, w - 8, h - 8, shade(m.base, 0.08));
  if (round) {
    // 抹掉四角，得到圆角剪影
    for (const [cx, cy] of [[x, y], [x + w - 1, y], [x, y + h - 1], [x + w - 1, y + h - 1]]              ) {
      p.ctx.clearRect(cx, cy, 1, 1);
    }
  }
}

/** 木板：板缝 + 木纹 + 结节，纹理方向沿长边 */
export function planks(p     , x        , y        , w        , h        , m     , seed = 7)       {
  plate(p, x, y, w, h, m);
  const horiz = w >= h;
  const span = horiz ? h : w;
  const step = span >= 24 ? 8 : span >= 14 ? 6 : 5;
  let s = seed * 2654435761 % 100000;
  const rnd = ()         => { s = (s * 1103515245 + 12345) % 2147483647; return (s % 1000) / 1000; };
  for (let o = step; o < span - 2; o += step) {
    if (horiz) {
      p.rect(x + 2, y + o, w - 4, 1, shade(m.base, -0.42));
      p.rect(x + 2, y + o + 1, w - 4, 1, shade(m.base, 0.12));
    } else {
      p.rect(x + o, y + 2, 1, h - 4, shade(m.base, -0.42));
      p.rect(x + o + 1, y + 2, 1, h - 4, shade(m.base, 0.12));
    }
  }
  // 木纹条纹
  const streaks = Math.max(3, Math.round((horiz ? w : h) / 7));
  for (let i = 0; i < streaks; i++) {
    const len = 3 + Math.round(rnd() * 5);
    if (horiz) {
      const sx = x + 3 + Math.round(rnd() * (w - 8)), sy = y + 3 + Math.round(rnd() * (h - 6));
      p.rect(sx, sy, Math.min(len, x + w - 3 - sx), 1, shade(m.base, rnd() > 0.5 ? -0.16 : 0.14));
    } else {
      const sx = x + 3 + Math.round(rnd() * (w - 6)), sy = y + 3 + Math.round(rnd() * (h - 8));
      p.rect(sx, sy, 1, Math.min(len, y + h - 3 - sy), shade(m.base, rnd() > 0.5 ? -0.16 : 0.14));
    }
  }
  // 结节
  const knots = span > 20 ? 2 : 1;
  for (let i = 0; i < knots; i++) {
    const kx = x + 4 + Math.round(rnd() * (w - 9)), ky = y + 4 + Math.round(rnd() * (h - 9));
    p.disc(kx, ky, 1, shade(m.base, -0.38));
    p.px(kx, ky, shade(m.base, -0.5));
  }
}

/** 金属：竖向三段渐变 + 高光条 + 铆钉 */
export function metal(p     , x        , y        , w        , h        , m     , rivets = true)       {
  plate(p, x, y, w, h, m);
  p.rect(x + 2, y + 2, w - 4, Math.max(1, Math.round(h * 0.22)), shade(m.base, 0.16));
  p.rect(x + 2, y + h - 2 - Math.round(h * 0.2), w - 4, Math.round(h * 0.2), shade(m.base, -0.14));
  for (let i = x + 4; i < x + w - 4; i += 3) p.px(i, y + 3, shade(m.base, 0.34));
  if (rivets) for (const [rx, ry] of [[x + 3, y + 3], [x + w - 4, y + 3], [x + 3, y + h - 4], [x + w - 4, y + h - 4]]              ) {
    p.px(rx, ry, shade(m.base, 0.42)); p.px(rx, ry + 1, shade(m.base, -0.3));
  }
}

/** 布料：底色 + 斜向织纹 + 缝线 */
export function cloth(p     , x        , y        , w        , h        , m     , stitch = true)       {
  plate(p, x, y, w, h, m);
  for (let j = y + 2; j < y + h - 2; j++) for (let i = x + 2; i < x + w - 2; i++) {
    if ((i + j) % 4 === 0) p.px(i, j, shade(m.base, 0.1));
    else if ((i + j * 3) % 7 === 0) p.px(i, j, shade(m.base, -0.1));
  }
  if (stitch) {
    for (let i = x + 3; i < x + w - 3; i += 2) { p.px(i, y + 2, shade(m.base, 0.3)); p.px(i, y + h - 3, shade(m.base, -0.26)); }
    for (let j = y + 3; j < y + h - 3; j += 2) { p.px(x + 2, j, shade(m.base, 0.22)); p.px(x + w - 3, j, shade(m.base, -0.22)); }
  }
}

/** 石材/瓷面：斑点 + 细缝 */
export function stone(p     , x        , y        , w        , h        , m     , seed = 3)       {
  plate(p, x, y, w, h, m);
  let s = seed * 977 % 99991;
  const rnd = ()         => { s = (s * 1103515245 + 12345) % 2147483647; return (s % 1000) / 1000; };
  for (let i = 0; i < w * h / 9; i++) {
    const px = x + 2 + Math.round(rnd() * (w - 5)), py = y + 2 + Math.round(rnd() * (h - 5));
    p.px(px, py, rnd() > 0.5 ? shade(m.base, 0.14) : shade(m.base, -0.12));
  }
}

/** 圆形物件（桶/圆桌）：外圈描边 + 内圈 AO + 中心亮 */
export function disc3(p     , cx        , cy        , r        , m     )       {
  p.disc(cx, cy, r, m.ink);
  p.disc(cx, cy, r - 1, m.lo);
  p.disc(cx, cy, r - 2, m.base);
  p.disc(cx, cy, Math.max(1, r - 5), shade(m.base, 0.1));
}

/** 物件脚下的柔和 AO（对称，旋转安全） */
export function ao(p     , x        , y        , w        , h        )       {
  p.rect(x, y, w, 1, 'rgba(10,7,16,0.28)');
  p.rect(x, y + h - 1, w, 1, 'rgba(10,7,16,0.34)');
  p.rect(x, y, 1, h, 'rgba(10,7,16,0.28)');
  p.rect(x + w - 1, y, 1, h, 'rgba(10,7,16,0.28)');
}

/** 使用面标记：仅这一处是方向性的（旋转时应当跟着转） */
export function useEdge(p     , w        , h        , color        )       {
  // 只在中段点三下，避免整条虚线抢戏（朝向靠家具造型读，这只是辅助提示）
  const cx = Math.round(w / 2);
  for (const dx of [-5, 0, 5]) p.rect(cx + dx - 1, h - 3, 2, 1, color);
  p.rect(3, h - 2, w - 6, 1, 'rgba(10,7,16,0.3)');
}

/** 玻璃/液体：高光点 + 反光条 */
export function liquid(p     , x        , y        , w        , h        , base        )       {
  p.rect(x, y, w, h, shade(base, -0.3));
  p.rect(x + 1, y + 1, w - 2, h - 2, base);
  p.rect(x + 1, y + 1, w - 2, 1, shade(base, 0.4));
  for (let i = 0; i < Math.max(2, w / 5); i++) p.px(x + 2 + (i * 5) % Math.max(1, w - 4), y + 2 + ((i * 3) % Math.max(1, h - 3)), shade(base, 0.55));
}
