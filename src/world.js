// 酒馆网格：房间矩形 + 家具足迹 + 门（相邻房间共享边中点）+ A* 寻路
import { BLUEPRINTS,                                ROOM_LABEL, furnDef } from './data.js';
import { FURN_SIZE, T } from './furniture.js';

                                                                                                                                                                       
                                       
                      
                    
                                                                               
                                                                                  
  
                                                                                            
                                                           

export function bpById(id        )            {
  const b = BLUEPRINTS.find((x) => x.id === id);
  if (!b) throw new Error('unknown blueprint ' + id);
  return b;
}

export function furnFootprint(kind        , dir        )                   {
  const [w, h] = FURN_SIZE[kind] || [1, 1];
  return dir === 1 || dir === 3 ? [h, w] : [w, h];
}

/** Stable visual placement for guests using a bed, independent of path/save coordinates. */
export function bedDisplayPlacement(f, memberIndex = 0, memberCount = 1) {
  const [w, h] = furnFootprint(f.kind, f.dir);
  const count = Math.max(1, Math.round(memberCount));
  const index = Math.max(0, Math.min(count - 1, Math.round(memberIndex)));
  const sideOffset = (index - (count - 1) / 2) * 0.28;
  const vertical = Math.abs((f.dir || 0) % 2) === 1;
  return {
    x: f.x + w / 2 + (vertical ? sideOffset : 0),
    y: f.y + h / 2 + (vertical ? 0 : sideOffset),
    rotation: -Math.PI / 2 + ((f.dir || 0) % 4) * Math.PI / 2,
  };
}

export function dirDelta(dir        )                   {
  return dir === 0 ? [0, 1] : dir === 1 ? [-1, 0] : dir === 2 ? [0, -1] : [1, 0];
}

/** 将房间内的格点顺时针旋转 turns 次；坐标以格子中心为基准。 */
export function rotateRoomPoint(x        , y        , w        , h        , turns        )                                      {
  let rx = x, ry = y, rw = w, rh = h;
  for (let i = 0; i < ((turns % 4) + 4) % 4; i++) {
    const nx = rh - 1 - ry, ny = rx;
    rx = nx; ry = ny;
    const size = rw; rw = rh; rh = size;
  }
  return { x: rx, y: ry, w: rw, h: rh };
}

const K = 4096;
export function tkey(x        , y        )         { return (x + 2048) * K + (y + 2048); }

/** Production layout gate shared by import/build callers. It deliberately uses
 * the computed door graph, not mere rectangle contact. */
export function validateLayout(layout, campaignMode = 'legacy', { operation = 'validate' } = {}) {
  if (!layout || !Array.isArray(layout.rooms) || !Array.isArray(layout.furns)) return { ok: false, reason: 'rooms/furns 必须是数组' };
  const rooms = layout?.rooms || [], furns = layout?.furns || [];
  const rootKind = campaignMode === 'legacy' ? 'foyer' : 'playerroom';
  if (!rooms.length) return { ok: false, reason: '布局没有房间' };
  if (!rooms.some((r) => r.kind === rootKind)) return { ok: false, reason: `缺少${rootKind}根房间` };
  if (campaignMode !== 'legacy' && rooms.filter((r) => r.kind === 'playerroom').length !== 1) return { ok: false, reason: '新档必须恰有一个玩家休息室' };
  if (campaignMode === 'legacy' && rooms.some((r) => r.kind === 'playerroom')) return { ok: false, reason: 'legacy 布局不能包含玩家休息室' };
  if (campaignMode === 'legacy' && rooms.filter((r) => r.kind === 'foyer').length < 1) return { ok: false, reason: '旧档必须保留门厅' };
  const maxRoomId = Math.max(0, ...rooms.map((r) => Number(r.id) || 0)); const maxFurnId = Math.max(0, ...furns.map((f) => Number(f.id) || 0));
  if (!Number.isSafeInteger(layout.nr) || layout.nr <= maxRoomId || !Number.isSafeInteger(layout.nf) || layout.nf <= maxFurnId) return { ok: false, reason: '布局自增 ID 游标非法' };
  const roomIds = new Set(); const validKinds = new Set(BLUEPRINTS.map((b) => b.kind));
  for (const r of rooms) {
    const exactBp = BLUEPRINTS.find((b) => b.id === r.bp); const bp = exactBp || (campaignMode === 'legacy' ? BLUEPRINTS.find((b) => b.kind === r.kind && [b.w, b.h].includes(r.w) && [b.w, b.h].includes(r.h)) : null);
    if (roomIds.has(r.id) || !Number.isSafeInteger(r.id) || r.id < 1 || !Number.isInteger(r.x) || !Number.isInteger(r.y) || !Number.isInteger(r.w) || !Number.isInteger(r.h) || r.w <= 0 || r.h <= 0 || !validKinds.has(r.kind) || !bp || bp.kind !== r.kind || (campaignMode !== 'legacy' && (exactBp?.kind !== r.kind || !((r.w === bp.w && r.h === bp.h) || (r.w === bp.h && r.h === bp.w))))) return { ok: false, reason: '房间字段、蓝图或尺寸非法' };
    roomIds.add(r.id);
  }
  for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++) {
    const a = rooms[i], b = rooms[j];
    if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) return { ok: false, reason: '房间重叠' };
  }
  const t = new Tavern(); t.rooms = rooms.map((r) => ({ ...r })); t.furns = furns.map((f) => ({ ...f })); t.legacy = campaignMode === 'legacy'; t.reindex();
  if (!t.roomsConnectedByOpenings(t.rooms, new Set(t.furns.flatMap((f) => t.furnTiles(f).map((x) => tkey(x.x, x.y)))))) return { ok: false, reason: `${operation}后房间无法通过门洞连通` };
  if (campaignMode !== 'legacy' || ['buildRoom', 'moveRoom'].includes(operation)) for (const lounge of rooms.filter((r) => r.kind === 'lounge')) {
    const occupied = new Set(t.furns.flatMap((f) => t.furnTiles(f).map((x) => tkey(x.x, x.y))));
    if (!rooms.some((corridor) => corridor.kind === 'corridor' && t.roomsShareUsableDoor(lounge, corridor, occupied))) return { ok: false, reason: '员工休息室必须直接连接走廊' };
  }
  const furnIds = new Set(); const occupied = new Set();
  for (const f of t.furns) {
    if (furnIds.has(f.id) || !Number.isSafeInteger(f.id) || f.id < 1 || !Number.isInteger(f.x) || !Number.isInteger(f.y) || !Number.isInteger(f.dir) || f.dir < 0 || f.dir > 3 || !FURN_SIZE[f.kind] || !Number.isInteger(f.quality) || f.quality < 1 || f.quality > 3) return { ok: false, reason: '家具字段或 ID 非法' };
    furnIds.add(f.id); const room = t.roomAt(f.x, f.y); const def = furnDef(f.kind);
    if (!room || !def || !def.rooms?.includes(room.kind)) return { ok: false, reason: `家具${f.kind}落位非法` };
    if (f.builtIn && f.boundRoomId !== room.id) return { ok: false, reason: '内置家具绑定房间不一致' };
    for (const tile of t.furnTiles(f)) { if (t.roomAt(tile.x, tile.y)?.id !== room.id) return { ok: false, reason: '家具 footprint 越墙或跨房间' }; const k = tkey(tile.x, tile.y); if (occupied.has(k)) return { ok: false, reason: '家具互相重叠' }; occupied.add(k); }
    if (f.builtIn && !['bunk', 'meetingtable', 'desk', 'chair'].includes(f.kind)) return { ok: false, reason: '普通家具不能伪造内置标记' };
  }
  const contracts = { playerroom: ['bunk', 'meetingtable', 'chair'], foyer: ['desk'], lounge: ['bunk'] };
  if (campaignMode !== 'legacy') for (const f of furns.filter((x) => x.builtIn)) { const room = rooms.find((r) => r.id === f.boundRoomId); if (!room || !(contracts[room.kind] || []).includes(f.kind) || f.purchasePrice !== 0) return { ok: false, reason: '内置家具契约非法' }; }
  if (campaignMode !== 'legacy') for (const r of rooms) for (const kind of contracts[r.kind] || []) {
    const rows = furns.filter((f) => f.boundRoomId === r.id && f.builtIn && f.kind === kind);
    if (rows.length !== 1 || rows[0].purchasePrice !== 0) return { ok: false, reason: `${r.kind}缺少合法内置${kind}` };
  }
  return { ok: true, reason: '' };
}

export function validateCandidateOrError(tavern, candidate, mode = tavern?.legacy ? 'legacy' : 'tutorial', operation = 'mutation') {
  const result = validateLayout(candidate, mode, { operation });
  if (!result.ok) { const error = new Error(`${operation}：${result.reason}`); error.code = 'LAYOUT_INVALID'; throw error; }
  return true;
}

export class Tavern {
  rooms         = [];
  furns         = [];
  doors         = [];
  dirt         = [];
          nextRoomId = 1;
          nextFurnId = 1;
          roomIdx = new Map              ();
          furnIdx = new Map              ();
          roomByIdIdx = new Map();
          furnByIdIdx = new Map();
          furnKindIdx = new Map();
          roomKindIdx = new Map();
          doorSet = new Set        ();
          pathCache = new Map                                           ();
  version = 0;
  legacy = false;

  rootRoom(rooms = this.rooms, mode = this.legacy ? 'legacy' : 'tutorial') {
    return (mode === 'legacy' ? rooms.find((r) => r.kind === 'foyer') : rooms.find((r) => r.kind === 'playerroom')) || null;
  }

  validateLayout(campaignMode = this.legacy ? 'legacy' : 'tutorial', options = {}) {
    return validateLayout(this.serialize(), campaignMode, options);
  }

  reindex()       {
    this.roomIdx.clear(); this.furnIdx.clear(); this.roomByIdIdx.clear(); this.furnByIdIdx.clear(); this.furnKindIdx.clear(); this.roomKindIdx.clear();
    for (const r of this.rooms) {
      this.roomByIdIdx.set(r.id, r);
      if (!this.roomKindIdx.has(r.kind)) this.roomKindIdx.set(r.kind, []);
      this.roomKindIdx.get(r.kind).push(r);
      for (let x = r.x; x < r.x + r.w; x++) for (let y = r.y; y < r.y + r.h; y++) this.roomIdx.set(tkey(x, y), r);
    }
    for (const f of this.furns) {
      this.furnByIdIdx.set(f.id, f);
      if (!this.furnKindIdx.has(f.kind)) this.furnKindIdx.set(f.kind, []);
      this.furnKindIdx.get(f.kind).push(f);
      for (const t of this.furnTiles(f)) this.furnIdx.set(tkey(t.x, t.y), f);
    }
    this.computeDoors();
    this.pathCache.clear();
    this.version++;
  }

  furnTiles(f      )                             {
    const [w, h] = furnFootprint(f.kind, f.dir);
    const out                             = [];
    for (let x = f.x; x < f.x + w; x++) for (let y = f.y; y < f.y + h; y++) out.push({ x, y });
    return out;
  }

  /** 使用面格子（必须可达，设备才工作） */
  useTiles(f      )                             {
    const [dx, dy] = dirDelta(f.dir);
    return this.furnTiles(f).map((t) => ({ x: t.x + dx, y: t.y + dy }));
  }

  roomAt(x        , y        )              { return this.roomIdx.get(tkey(x, y)) || null; }
  furnAt(x        , y        )              { return this.furnIdx.get(tkey(x, y)) || null; }
  roomById(id        )              { return this.roomByIdIdx.get(id) || null; }
  furnById(id        )              { return this.furnByIdIdx.get(id) || null; }
  furnsIn(roomId        , kind         )         {
    return this.furns.filter((f) => {
      const r = this.roomAt(f.x, f.y);
      return r !== null && r.id === roomId && (!kind || f.kind === kind);
    });
  }
  furnsOfKind(kind        )         { return this.furnKindIdx.get(kind) || []; }
  roomsOfKind(kind        )         { return this.roomKindIdx.get(kind) || []; }
  roomOfFurn(f      )              { return this.roomAt(f.x, f.y); }

  /** 椅子/长椅/客床/汤池不挡 NPC 路：角色要能坐、躺、泡，也避免长椅截断两格宽走廊。 */
  blocks(kind        )          { return kind !== 'chair' && kind !== 'bench' && kind !== 'bed' && kind !== 'doublebed' && kind !== 'kingbed' && kind !== 'pool'; }

  /** strict=true 时连椅子/客床/汤池也算实心（玩家直控的店主用这个，别从床上走过去） */
  walkable(x        , y        , strict = false)          {
    if (!this.roomIdx.get(tkey(x, y))) return false;
    const f = this.furnIdx.get(tkey(x, y));
    if (!f) return true;
    return strict ? false : !this.blocks(f.kind);
  }

  /** 连通性：从 (fx,fy) 能否直接站到 (x,y)（同房间或正好是门的两格） */
  connected(fx        , fy        , x        , y        )          {
    if (fx === x && fy === y) return true;
    const a = this.roomAt(fx, fy), b = this.roomAt(x, y);
    if (!a || !b) return false;
    if (a.id === b.id) return true;
    return this.doorSet.has(`${fx},${fy}|${x},${y}`);
  }

  /**
   * 身体碰撞：把角色当成半径 r 的方盒（格单位，位置=格中心），
   * 覆盖到的每一格都必须可走且与出发格连通——这样才不会半个身子插进桌子或蹭过墙。
   */
  bodyFree(fromX        , fromY        , cx        , cy        , r = 0.16, strict = false)          {
    const fx = Math.round(fromX), fy = Math.round(fromY);
    const tx = Math.round(cx), ty = Math.round(cy);
    if (!this.walkable(tx, ty, strict)) return false;
    if (!this.connected(fx, fy, tx, ty)) return false;
    // 身体盒外溢的格子必须可走；若外溢到了另一个房间，还必须正好跨在门洞两格上。
    // 这样门洞仍可通行，但角色不能在相邻房间的共享墙边把半个身体探到另一侧。
    const x0 = Math.floor(cx + 0.5 - r), x1 = Math.floor(cx + 0.5 + r);
    const y0 = Math.floor(cy + 0.5 - r), y1 = Math.floor(cy + 0.5 + r);
    const targetRoom = this.roomAt(tx, ty);
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        if (x === tx && y === ty) continue;
        if (!this.walkable(x, y, strict)) return false;
        const bodyRoom = this.roomAt(x, y);
        if (!targetRoom || !bodyRoom) return false;
        if (bodyRoom.id !== targetRoom.id && !this.doorSet.has(`${tx},${ty}|${x},${y}`)) return false;
      }
    }
    return true;
  }

  /** 格 (x,y) 某侧 (dx,dy) 是否有墙带；返回厚度（外墙 8px / 内墙 5px），同房间或门口通道返回 0 */
          wallTh(x        , y        , dx        , dy        )         {
    const r = this.roomIdx.get(tkey(x, y));
    if (!r) return 0;
    const nb = this.roomIdx.get(tkey(x + dx, y + dy));
    if (nb && nb.id === r.id) return 0;
    if (nb && this.doorSet.has(`${x},${y}|${x + dx},${y + dy}`)) return 0;
    return nb ? 5 : 8;
  }

  /**
   * 脚点贴墙钳制（纯视觉，模拟位置不动）：脚画在"位置水平居中、往下 34px"处，
   * 逻辑碰撞只管到格边界，贴墙时脚会压进墙带（外 8/内 5px）甚至画出墙外。
   * 把脚点（半径 3px 小圆）推出墙带即可。不能在模拟位置里钳——
   * NPC 路径终点是格心整数点，钳了永远到不了 0.06 的到达判定，会卡死。
   */
  clampFeet(x        , y        )                           {
    const FR = 3, FOOT = 34;
    let fx = (x + 0.5) * T, fy = y * T + FOOT;
    const bx = Math.round(x), by = Math.round(y);
    const room = this.roomAt(bx, by);
    if (!room) return { x, y };
    const row = Math.max(room.y, Math.min(room.y + room.h - 1, by));
    const col = Math.max(room.x, Math.min(room.x + room.w - 1, bx));
    // 只让角色当前所在房间的四条边约束脚点。旧实现扫描周围九格的墙，
    // 相邻房间的墙会连续推挤同一个点，视觉上就像被弹到另一侧。
    const west = this.wallTh(room.x, row, -1, 0);
    if (west) fx = Math.max(fx, room.x * T + west + FR);
    const east = this.wallTh(room.x + room.w - 1, row, 1, 0);
    if (east) fx = Math.min(fx, (room.x + room.w) * T - east - FR);
    const north = this.wallTh(col, room.y, 0, -1);
    if (north) fy = Math.max(fy, room.y * T + north + FR);
    const south = this.wallTh(col, room.y + room.h - 1, 0, 1);
    if (south) fy = Math.min(fy, (room.y + room.h) * T - south - FR);
    return { x: fx / T - 0.5, y: (fy - FOOT) / T };
  }

  computeDoors()       {
    this.doors = []; this.doorSet.clear();
    // 门只根据当前房间几何与空闲格重新生成；旧门位置不参与判断。
    const occupied = new Set(this.furnIdx.keys());
    for (let i = 0; i < this.rooms.length; i++) {
      for (let j = i + 1; j < this.rooms.length; j++) {
        const a = this.rooms[i], b = this.rooms[j];
        const door = this.doorBetween(a, b, occupied);
        if (door) this.addDoor(door.ax, door.ay, door.bx, door.by, a.id, b.id);
      }
    }
  }

  /** 两房共享墙上所有可开门格中，取离共享边几何中心最近的一格。 */
  doorBetween(a      , b      , occupied = new Set        ())                                                     {
    const candidates                                                                        = [];
    let center = 0;
    if (a.x + a.w === b.x || b.x + b.w === a.x) {
      const left = a.x + a.w === b.x ? a : b, right = left === a ? b : a;
      const y0 = Math.max(a.y, b.y), y1 = Math.min(a.y + a.h, b.y + b.h) - 1;
      center = (y0 + y1) / 2;
      for (let y = y0; y <= y1; y++) {
        const ax = left.x + left.w - 1, bx = right.x;
        if (!occupied.has(tkey(ax, y)) && !occupied.has(tkey(bx, y))) candidates.push({ ax, ay: y, bx, by: y, line: y });
      }
    } else if (a.y + a.h === b.y || b.y + b.h === a.y) {
      const top = a.y + a.h === b.y ? a : b, bottom = top === a ? b : a;
      const x0 = Math.max(a.x, b.x), x1 = Math.min(a.x + a.w, b.x + b.w) - 1;
      center = (x0 + x1) / 2;
      for (let x = x0; x <= x1; x++) {
        const ay = top.y + top.h - 1, by = bottom.y;
        if (!occupied.has(tkey(x, ay)) && !occupied.has(tkey(x, by))) candidates.push({ ax: x, ay, bx: x, by, line: x });
      }
    }
    candidates.sort((x, y) => Math.abs(x.line - center) - Math.abs(y.line - center) || x.line - y.line);
    return candidates[0] || null;
  }

          addDoor(ax        , ay        , bx        , by        , a        , b        )       {
    this.doors.push({ ax, ay, bx, by, a, b });
    this.doorSet.add(`${ax},${ay}|${bx},${by}`);
    this.doorSet.add(`${bx},${by}|${ax},${ay}`);
  }

  stepOk(x1        , y1        , x2        , y2        )          {
    if (!this.walkable(x2, y2)) return false;
    const r1 = this.roomAt(x1, y1), r2 = this.roomAt(x2, y2);
    if (!r1 || !r2) return false;
    if (r1.id === r2.id) return true;
    return this.doorSet.has(`${x1},${y1}|${x2},${y2}`);
  }

  path(sx        , sy        , tx        , ty        )                                    {
    if (sx === tx && sy === ty) return [];
    const ck = `${this.version}:${sx},${sy}->${tx},${ty}`;
    const cached = this.pathCacheGet(ck);
    if (cached !== undefined) return cached ? cached.slice() : null;
    if (!this.walkable(tx, ty)) { this.pathCacheSet(ck, null); return null; }
    const open = [{ x: sx, y: sy, f: 0, g: 0 }];
    const heapPush = (item) => { open.push(item); let i = open.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (open[p].f <= item.f) break; open[i] = open[p]; i = p; } open[i] = item; };
    const heapPop = () => { const top = open[0]; const last = open.pop(); if (open.length && last) { let i = 0; while (true) { let c = i * 2 + 1; if (c >= open.length) break; if (c + 1 < open.length && open[c + 1].f < open[c].f) c++; if (open[c].f >= last.f) break; open[i] = open[c]; i = c; } open[i] = last; } return top; };
    const came = new Map                ();
    const gs = new Map                ();
    gs.set(tkey(sx, sy), 0);
    let found = false;
    let guard = 0;
    while (open.length && guard++ < 20000) {
      const cur = heapPop();
      if (cur.x === tx && cur.y === ty) { found = true; break; }
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [dx, dy] of dirs) {
        const nx = cur.x + dx, ny = cur.y + dy;
        if (!this.stepOk(cur.x, cur.y, nx, ny)) continue;
        const nk = tkey(nx, ny);
        const room = this.roomAt(nx, ny);
        const ng = cur.g + (room?.kind === 'corridor' ? 1 : 1.25);
        const prev = gs.get(nk);
        if (prev !== undefined && prev <= ng) continue;
        gs.set(nk, ng);
        came.set(nk, tkey(cur.x, cur.y));
        heapPush({ x: nx, y: ny, g: ng, f: ng + Math.abs(nx - tx) + Math.abs(ny - ty) });
      }
    }
    if (!found) { this.pathCacheSet(ck, null); return null; }
    const out                             = [];
    let k = tkey(tx, ty);
    const sk = tkey(sx, sy);
    while (k !== sk) {
      out.push({ x: Math.floor(k / K) - 2048, y: (k % K) - 2048 });
      const p = came.get(k);
      if (p === undefined) break;
      k = p;
    }
    out.reverse();
    this.pathCacheSet(ck, out);
    return out.slice();
  }

  pathCacheSet(key, value) {
    this.pathCache.delete(key);
    this.pathCache.set(key, value);
    while (this.pathCache.size > 3000) this.pathCache.delete(this.pathCache.keys().next().value);
  }

  pathCacheGet(key) {
    const value = this.pathCache.get(key);
    if (value !== undefined) { this.pathCache.delete(key); this.pathCache.set(key, value); }
    return value;
  }

  /** 房间蓝图落位校验 */
  canPlaceRoom(bp           , x        , y        , rot        )                                  {
    const w = rot ? bp.h : bp.w, h = rot ? bp.w : bp.h;
    for (let i = x; i < x + w; i++) for (let j = y; j < y + h; j++) {
      if (this.roomAt(i, j)) return { ok: false, reason: '与已有房间重叠' };
    }
    if (this.rooms.length === 0) return { ok: true, reason: '' };
    let touch = false;
    const proposed = { id: -1, kind: bp.kind, bp: bp.id, x, y, w, h, quality: 1, clean: 100, maint: 100 };
    const occupied = new Set(this.furnIdx.keys());
    let usableDoors = 0;
    for (const r of this.rooms) {
      const hOverlap = Math.min(x + w, r.x + r.w) - Math.max(x, r.x);
      const vOverlap = Math.min(y + h, r.y + r.h) - Math.max(y, r.y);
      if ((x + w === r.x || r.x + r.w === x) && vOverlap >= 1) touch = true;
      if ((y + h === r.y || r.y + r.h === y) && hOverlap >= 1) touch = true;
      if (this.doorBetween(proposed, r, occupied)) usableDoors++;
    }
    if (!touch) return { ok: false, reason: '必须与已有房间贴边（需要门连接）' };
    if (!usableDoors) return { ok: false, reason: '共享墙没有可形成门洞的空位' };
    return { ok: true, reason: '', usableDoors };
  }

  placeRoom(bp           , x        , y        , rot        )       {
    const w = rot ? bp.h : bp.w, h = rot ? bp.w : bp.h;
    const room       = { id: this.nextRoomId++, kind: bp.kind, bp: bp.id, x, y, w, h, quality: 1, clean: 100, maint: 100, style: 'rustic', purchasePrice: bp.buildCost ?? bp.cost ?? 0 };
    this.rooms.push(room);
    if (this.rooms.length === 1 && bp.kind === 'foyer') this.legacy = true;
    this.reindex();
    return room;
  }

  /** 整体移动现有房间：预检重叠、门位和移动后的全店连通性。 */
  canMoveRoom(id        , x        , y        , turns = 0)                                  {
    const room = this.roomById(id);
    if (!room) return { ok: false, reason: '房间不存在' };
    turns = ((turns % 4) + 4) % 4;
    if (room.x === x && room.y === y && turns === 0) return { ok: false, reason: '房间已经在这里' };
    const size = rotateRoomPoint(0, 0, room.w, room.h, turns);
    const moved = this.rooms.map((r) => r.id === id ? { ...r, x, y, w: size.w, h: size.h } : r);
    const target = moved.find((r) => r.id === id)          ;
    for (const other of moved) {
      if (other.id === id) continue;
      const overlap = target.x < other.x + other.w && target.x + target.w > other.x
        && target.y < other.y + other.h && target.y + target.h > other.y;
      if (overlap) return { ok: false, reason: '与已有房间重叠' };
    }
    // 预演家具的整体位移与旋转；旧门位置完全不参与新布局判断。
    const occupied = new Set        ();
    for (const f of this.furns) {
      const owner = this.roomOfFurn(f);
      for (const tile of this.furnTiles(f)) {
        if (owner?.id === id) {
          const p = rotateRoomPoint(tile.x - room.x, tile.y - room.y, room.w, room.h, turns);
          occupied.add(tkey(x + p.x, y + p.y));
        } else occupied.add(tkey(tile.x, tile.y));
      }
    }
    if (moved.length > 1 && !this.roomsConnectedByOpenings(moved, occupied)) return { ok: false, reason: '新位置没有足够的共享空墙形成门洞，全店会断开' };
    return { ok: true, reason: '' };
  }

  roomsConnectedByOpenings(rooms        , occupied        , mode = this.legacy ? 'legacy' : 'tutorial')          {
    if (!rooms.length) return true;
    const foyer = this.rootRoom(rooms, mode);
    if (!foyer) return false;
    const seen = new Set        ([foyer.id]);
    const stack = [foyer];
    while (stack.length) {
      const current = stack.pop()          ;
      for (const other of rooms) {
        if (seen.has(other.id)) continue;
        if (this.doorBetween(current, other, occupied)) { seen.add(other.id); stack.push(other); }
      }
    }
    return seen.size === rooms.length;
  }

  roomsShareUsableDoor(a, b, occupied = new Set()) { return !!(a && b && this.doorBetween(a, b, occupied)); }

  roomsConnected(rooms        , mode = this.legacy ? 'legacy' : 'tutorial')          {
    if (!rooms.length) return true;
    const foyer = this.rootRoom(rooms, mode);
    if (!foyer) return false;
    const seen = new Set        ([foyer.id]);
    const stack = [foyer];
    while (stack.length) {
      const current = stack.pop()          ;
      for (const other of rooms) {
        if (seen.has(other.id)) continue;
        const hOverlap = Math.min(current.x + current.w, other.x + other.w) - Math.max(current.x, other.x);
        const vOverlap = Math.min(current.y + current.h, other.y + other.h) - Math.max(current.y, other.y);
        const touch = ((current.x + current.w === other.x || other.x + other.w === current.x) && vOverlap >= 1)
          || ((current.y + current.h === other.y || other.y + other.h === current.y) && hOverlap >= 1);
        if (touch) { seen.add(other.id); stack.push(other); }
      }
    }
    return seen.size === rooms.length;
  }

  moveRoom(id        , x        , y        , turns = 0)                                      {
    const room = this.roomById(id);
    if (!room) return null;
    turns = ((turns % 4) + 4) % 4;
    const check = this.canMoveRoom(id, x, y, turns);
    if (!check.ok) return null;
    const old = { x: room.x, y: room.y, w: room.w, h: room.h };
    const dx = x - room.x, dy = y - room.y;
    const furns = this.furnsIn(id);
    const dirt = this.dirt.filter((d) => d.x >= room.x && d.x < room.x + room.w && d.y >= room.y && d.y < room.y + room.h);
    const size = rotateRoomPoint(0, 0, old.w, old.h, turns);
    for (const f of furns) {
      const tiles = this.furnTiles(f).map((tile) => rotateRoomPoint(tile.x - old.x, tile.y - old.y, old.w, old.h, turns));
      f.x = x + Math.min(...tiles.map((tile) => tile.x));
      f.y = y + Math.min(...tiles.map((tile) => tile.y));
      f.dir = (f.dir + turns) % 4;
      f.busyBy = undefined;
    }
    for (const d of dirt) {
      const p = rotateRoomPoint(d.x - old.x, d.y - old.y, old.w, old.h, turns);
      d.x = x + p.x; d.y = y + p.y;
    }
    room.x = x; room.y = y; room.w = size.w; room.h = size.h;
    this.reindex();
    return { room, dx, dy, turns, old };
  }

  /** 拆除：不能让任何房间与门厅断开 */
  canRemoveRoom(id        , mode = this.legacy ? 'legacy' : 'tutorial')                                  {
    const room = this.roomById(id);
    if (!room) return { ok: false, reason: '房间不存在' };
    if ((mode === 'legacy' && room.kind === 'foyer') || (mode !== 'legacy' && room.kind === 'playerroom')) return { ok: false, reason: '核心房间不能拆除' };
    const keep = this.rooms.filter((r) => r.id !== id);
    if (keep.length === 0) return { ok: true, reason: '' };
    const foyer = this.rootRoom(keep, mode);
    if (!foyer) return { ok: false, reason: '缺少核心房间' };
    // 房间图连通性
    const adj = new Map                  ();
    for (const a of keep) adj.set(a.id, []);
    for (let i = 0; i < keep.length; i++) for (let j = i + 1; j < keep.length; j++) {
      const a = keep[i], b = keep[j];
      const hO = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const vO = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      const touch = ((a.x + a.w === b.x || b.x + b.w === a.x) && vO >= 1) || ((a.y + a.h === b.y || b.y + b.h === a.y) && hO >= 1);
      if (touch) { (adj.get(a.id)            ).push(b.id); (adj.get(b.id)            ).push(a.id); }
    }
    const seen = new Set        ([foyer.id]);
    const stack = [foyer.id];
    while (stack.length) {
      const cur = stack.pop()          ;
      for (const n of adj.get(cur) || []) if (!seen.has(n)) { seen.add(n); stack.push(n); }
    }
    if (seen.size !== keep.length) return { ok: false, reason: '拆除后会有房间与门厅断开' };
    const candidate = { rooms: keep, furns: this.furns.filter((f) => this.roomOfFurn(f)?.id !== id), dirt: this.dirt, nr: this.nextRoomId, nf: this.nextFurnId, legacy: this.legacy };
    const checked = validateLayout(candidate, mode, { operation: 'remove' });
    if (!checked.ok) return checked;
    return { ok: true, reason: '' };
  }

  removeRoom(id        )         {
    const room = this.roomById(id);
    if (!room) return [];
    const removed = this.furns.filter((f) => this.roomOfFurn(f)?.id === id);
    this.furns = this.furns.filter((f) => !removed.includes(f));
    this.rooms = this.rooms.filter((r) => r.id !== id);
    this.dirt = this.dirt.filter((d) => !(d.x >= room.x && d.x < room.x + room.w && d.y >= room.y && d.y < room.y + room.h));
    this.reindex();
    return removed;
  }

  roomStyle(r             )         {
    return (r && r.style) || 'rustic';
  }

  setRoomStyle(id        , styleId        )          {
    const r = this.roomById(id);
    if (!r) return false;
    r.style = styleId;
    this.version++;
    return true;
  }

  canPlaceFurn(kind        , x        , y        , dir        , ignoreId = 0)                                  {
    const def = furnDef(kind);
    const [w, h] = furnFootprint(kind, dir);
    const room = this.roomAt(x, y);
    if (!room) return { ok: false, reason: '必须放在房间内' };
    if (!def.rooms.includes(room.kind)) return { ok: false, reason: `${def.name}只能放在${def.rooms.map((r) => ROOM_LABEL[r]).join('/')}` };
    for (let i = x; i < x + w; i++) for (let j = y; j < y + h; j++) {
      const r2 = this.roomAt(i, j);
      if (!r2 || r2.id !== room.id) return { ok: false, reason: '超出房间范围' };
      const f = this.furnAt(i, j);
      if (f && f.id !== ignoreId) return { ok: false, reason: '此处已有家具' };
      if (this.doors.some((d) => (d.ax === i && d.ay === j) || (d.bx === i && d.by === j))) return { ok: false, reason: '不能堵住门' };
    }
    // 家具槽位上限 = 房间面积按房间品质开放
    const slots = Math.floor(room.w * room.h * (0.40 + 0.10 * room.quality));
    const used = this.furnsIn(room.id).filter((f) => f.id !== ignoreId).reduce((s, f) => s + this.furnTiles(f).length, 0);
    if (used + w * h > slots) return { ok: false, reason: `家具槽位不足（${used}/${slots}），升级房间品质可增加` };
    if (kind === 'chair') {
      const [dx, dy] = dirDelta(dir);
      const t = this.furnAt(x + dx, y + dy);
      if (!t || (t.kind !== 'table' && t.kind !== 'meetingtable')) return { ok: false, reason: '椅子必须朝向一张餐桌或会议桌' };
      if (t.kind === 'meetingtable' && this.tableSeats(t).filter((chair) => chair.id !== ignoreId).length >= 12) return { ok: false, reason: '会议桌最多容纳12把椅子' };
    }
    if (this.blocks(kind)) {
      const [dx, dy] = dirDelta(dir);
      let anyUse = false;
      for (let i = x; i < x + w; i++) for (let j = y; j < y + h; j++) {
        const ux = i + dx, uy = j + dy;
        const r2 = this.roomAt(ux, uy);
        const f2 = this.furnAt(ux, uy);
        if (r2 && (!f2 || f2.id === ignoreId || !this.blocks(f2.kind))) anyUse = true;
      }
      // 纯装饰（氛围件）与餐桌不需要使用面，可以塞进角落
      if (!anyUse && kind !== 'table' && !def.charm) return { ok: false, reason: '使用面被挡住，设备无法工作（按 R 旋转）' };
    }
    return { ok: true, reason: '' };
  }

  placeFurn(kind        , x        , y        , dir        , quality        )       {
    const f       = { id: this.nextFurnId++, kind, x, y, dir, quality };
    if (kind === 'shelf') f.stock = 0;
    if (kind === 'pass') f.plates = 0;
    if (kind === 'table' || kind === 'meetingtable') f.dirty = 0;
    if (kind === 'sink') f.dirty = 0;
    if (kind === 'bed' || kind === 'doublebed' || kind === 'kingbed' || kind === 'pool' || kind === 'billiardtable') f.dirty = 0;
    this.furns.push(f);
    this.reindex();
    return f;
  }

  removeFurn(id        )       {
    const target = this.furnById(id);
    if (!target || target.builtIn) return false;
    this.furns = this.furns.filter((f) => f.id !== id);
    this.reindex();
    return true;
  }

  /** 餐桌与其朝向匹配的椅子 */
  tableSeats(t      )         {
    const out         = [];
    const tableTiles = new Set(this.furnTiles(t).map((tile) => tkey(tile.x, tile.y)));
    for (const c of this.furns) {
      if (c.kind !== 'chair') continue;
      const [dx, dy] = dirDelta(c.dir);
      if (tableTiles.has(tkey(c.x + dx, c.y + dy))) out.push(c);
    }
    return out;
  }

  allTables()         { return this.furns.filter((f) => f.kind === 'table'); }
  meetingTables()     { return this.furns.filter((f) => f.kind === 'meetingtable'); }
  meetingSeats(t)      { return this.tableSeats(t).slice(0, 12); }

  entrance()                           {
    // 客人、候选员工和跨世界来宾都从位面门厅抵达；玩家自己的出生点由
    // game.js 明确放在休息室，不能把私人房间误当公共入口。
    const f = this.rooms.find((r) => r.kind === 'foyer') || this.rooms.find((r) => r.kind === 'playerroom');
    if (!f) return { x: 0, y: 0 };
    return { x: f.x + Math.floor(f.w / 2), y: f.y };
  }

  /** 目标周边可站立格 */
  standTileNear(tiles                            )                                  {
    for (const t of tiles) if (this.walkable(t.x, t.y)) return t;
    return null;
  }

  freeTileIn(room      , seed        )                           {
    for (let i = 0; i < 40; i++) {
      const x = room.x + ((seed * 7 + i * 3) % room.w);
      const y = room.y + ((seed * 5 + i * 2) % room.h);
      if (this.walkable(x, y)) return { x, y };
    }
    return { x: room.x, y: room.y };
  }

  /** 从任意卡点寻找最近的完整可站立格；优先留在原房间。 */
  nearestFreeTile(x        , y        )                           {
    const originRoom = this.roomAt(Math.round(x), Math.round(y));
    const candidates = [];
    for (const room of this.rooms) {
      for (let tx = room.x; tx < room.x + room.w; tx++) {
        for (let ty = room.y; ty < room.y + room.h; ty++) {
          if (!this.walkable(tx, ty) || !this.bodyFree(tx, ty, tx, ty, 0.14, false)) continue;
          candidates.push({ x: tx, y: ty, sameRoom: room.id === originRoom?.id ? 0 : 1, dist: Math.abs(tx - x) + Math.abs(ty - y) });
        }
      }
    }
    candidates.sort((a, b) => a.sameRoom - b.sameRoom || a.dist - b.dist || a.y - b.y || a.x - b.x);
    return candidates[0] || null;
  }

  bounds()                                                     {
    if (!this.rooms.length) return { x0: 0, y0: 0, x1: 1, y1: 1 };
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const r of this.rooms) { x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); }
    return { x0, y0, x1, y1 };
  }

  addDirt(x        , y        )       {
    const hit = this.dirt.find((d) => d.x === x && d.y === y);
    if (hit) { hit.level = Math.min(3, hit.level + 1); return; }
    if (this.roomAt(x, y)) this.dirt.push({ x, y, level: 1 });
  }

  serialize()          {
    return JSON.parse(JSON.stringify({ rooms: this.rooms, furns: this.furns, dirt: this.dirt, doors: this.doors, nr: this.nextRoomId, nf: this.nextFurnId, legacy: !!this.legacy }));
  }

  static load(data, { mode = null, strict = false } = {}) {
    const payload = JSON.parse(JSON.stringify(data || {}));
    if (strict) { const check = validateLayout(payload, mode || (payload.legacy ? 'legacy' : 'tutorial'), { operation: 'load' }); if (!check.ok) throw new Error(`布局校验失败：${check.reason}`); }
    const t = new Tavern();
    t.rooms = payload.rooms || []; t.furns = payload.furns || []; t.dirt = payload.dirt || [];
    for (const r of t.rooms) if (!r.style) r.style = 'rustic';   // 旧存档没有风格字段
    t.nextRoomId = payload.nr; t.nextFurnId = payload.nf;
    t.legacy = mode ? mode === 'legacy' : !!payload.legacy;
    t.reindex();
    return t;
  }
}
