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

export class Tavern {
  rooms         = [];
  furns         = [];
  doors         = [];
  dirt         = [];
          nextRoomId = 1;
          nextFurnId = 1;
          roomIdx = new Map              ();
          furnIdx = new Map              ();
          doorSet = new Set        ();
          pathCache = new Map                                           ();
  version = 0;

  reindex()       {
    this.roomIdx.clear(); this.furnIdx.clear();
    for (const r of this.rooms) for (let x = r.x; x < r.x + r.w; x++) for (let y = r.y; y < r.y + r.h; y++) this.roomIdx.set(tkey(x, y), r);
    for (const f of this.furns) for (const t of this.furnTiles(f)) this.furnIdx.set(tkey(t.x, t.y), f);
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
  roomById(id        )              { return this.rooms.find((r) => r.id === id) || null; }
  furnById(id        )              { return this.furns.find((f) => f.id === id) || null; }
  furnsIn(roomId        , kind         )         {
    return this.furns.filter((f) => {
      const r = this.roomAt(f.x, f.y);
      return r !== null && r.id === roomId && (!kind || f.kind === kind);
    });
  }
  furnsOfKind(kind        )         { return this.furns.filter((f) => f.kind === kind); }
  roomOfFurn(f      )              { return this.roomAt(f.x, f.y); }

  /** 椅子/客床/汤池不挡路：客人要能站到上面去（坐/躺/泡） */
  blocks(kind        )          { return kind !== 'chair' && kind !== 'bed' && kind !== 'doublebed' && kind !== 'kingbed' && kind !== 'pool'; }

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
    // 门 = 两个相邻房间共享边上的一格通道（走廊瓶颈由此产生）
    for (let i = 0; i < this.rooms.length; i++) {
      for (let j = i + 1; j < this.rooms.length; j++) {
        const a = this.rooms[i], b = this.rooms[j];
        // 水平相邻
        if (a.x + a.w === b.x || b.x + b.w === a.x) {
          const left = a.x + a.w === b.x ? a : b, right = left === a ? b : a;
          const y0 = Math.max(a.y, b.y), y1 = Math.min(a.y + a.h, b.y + b.h) - 1;
          if (y1 >= y0) {
            const y = this.pickDoorLine(y0, y1, (yy) => this.walkable(left.x + left.w - 1, yy) && this.walkable(right.x, yy));
            this.addDoor(left.x + left.w - 1, y, right.x, y, left.id, right.id);
          }
        }
        // 垂直相邻
        if (a.y + a.h === b.y || b.y + b.h === a.y) {
          const top = a.y + a.h === b.y ? a : b, bot = top === a ? b : a;
          const x0 = Math.max(a.x, b.x), x1 = Math.min(a.x + a.w, b.x + b.w) - 1;
          if (x1 >= x0) {
            const x = this.pickDoorLine(x0, x1, (xx) => this.walkable(xx, top.y + top.h - 1) && this.walkable(xx, bot.y));
            this.addDoor(x, top.y + top.h - 1, x, bot.y, top.id, bot.id);
          }
        }
      }
    }
  }

          pickDoorLine(a        , b        , ok                        )         {
    const mid = Math.floor((a + b) / 2);
    for (let d = 0; d <= b - a; d++) {
      if (mid - d >= a && ok(mid - d)) return mid - d;
      if (mid + d <= b && ok(mid + d)) return mid + d;
    }
    return mid;
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
    const cached = this.pathCache.get(ck);
    if (cached !== undefined) return cached ? cached.slice() : null;
    if (!this.walkable(tx, ty)) { this.pathCache.set(ck, null); return null; }
    const open                                                   = [{ x: sx, y: sy, f: 0, g: 0 }];
    const came = new Map                ();
    const gs = new Map                ();
    gs.set(tkey(sx, sy), 0);
    let found = false;
    let guard = 0;
    while (open.length && guard++ < 20000) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
      const cur = open.splice(bi, 1)[0];
      if (cur.x === tx && cur.y === ty) { found = true; break; }
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [dx, dy] of dirs) {
        const nx = cur.x + dx, ny = cur.y + dy;
        if (!this.stepOk(cur.x, cur.y, nx, ny)) continue;
        const nk = tkey(nx, ny);
        const ng = cur.g + 1;
        const prev = gs.get(nk);
        if (prev !== undefined && prev <= ng) continue;
        gs.set(nk, ng);
        came.set(nk, tkey(cur.x, cur.y));
        open.push({ x: nx, y: ny, g: ng, f: ng + Math.abs(nx - tx) + Math.abs(ny - ty) });
      }
    }
    if (!found) { this.pathCache.set(ck, null); return null; }
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
    if (this.pathCache.size > 3000) this.pathCache.clear();
    this.pathCache.set(ck, out);
    return out.slice();
  }

  /** 房间蓝图落位校验 */
  canPlaceRoom(bp           , x        , y        , rot        )                                  {
    const w = rot ? bp.h : bp.w, h = rot ? bp.w : bp.h;
    for (let i = x; i < x + w; i++) for (let j = y; j < y + h; j++) {
      if (this.roomAt(i, j)) return { ok: false, reason: '与已有房间重叠' };
    }
    if (this.rooms.length === 0) return { ok: true, reason: '' };
    let touch = false;
    for (const r of this.rooms) {
      const hOverlap = Math.min(x + w, r.x + r.w) - Math.max(x, r.x);
      const vOverlap = Math.min(y + h, r.y + r.h) - Math.max(y, r.y);
      if ((x + w === r.x || r.x + r.w === x) && vOverlap >= 1) touch = true;
      if ((y + h === r.y || r.y + r.h === y) && hOverlap >= 1) touch = true;
    }
    if (!touch) return { ok: false, reason: '必须与已有房间贴边（需要门连接）' };
    return { ok: true, reason: '' };
  }

  placeRoom(bp           , x        , y        , rot        )       {
    const w = rot ? bp.h : bp.w, h = rot ? bp.w : bp.h;
    const room       = { id: this.nextRoomId++, kind: bp.kind, bp: bp.id, x, y, w, h, quality: 1, clean: 100, maint: 100, style: 'rustic' };
    this.rooms.push(room);
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
    if (moved.length > 1 && !this.roomsConnected(moved)) {
      return { ok: false, reason: '移动后会有房间与门厅断开' };
    }

    // 预演家具的整体位移；新共享墙的每一扇门都至少要有一对空格可用。
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
    for (const other of moved) {
      if (other.id === id) continue;
      let adjacent = false, hasDoorTile = false;
      if (target.x + target.w === other.x || other.x + other.w === target.x) {
        adjacent = true;
        const left = target.x + target.w === other.x ? target : other;
        const right = left === target ? other : target;
        const y0 = Math.max(target.y, other.y), y1 = Math.min(target.y + target.h, other.y + other.h);
        for (let yy = y0; yy < y1; yy++) {
          if (!occupied.has(tkey(left.x + left.w - 1, yy)) && !occupied.has(tkey(right.x, yy))) { hasDoorTile = true; break; }
        }
      } else if (target.y + target.h === other.y || other.y + other.h === target.y) {
        adjacent = true;
        const top = target.y + target.h === other.y ? target : other;
        const bottom = top === target ? other : target;
        const x0 = Math.max(target.x, other.x), x1 = Math.min(target.x + target.w, other.x + other.w);
        for (let xx = x0; xx < x1; xx++) {
          if (!occupied.has(tkey(xx, top.y + top.h - 1)) && !occupied.has(tkey(xx, bottom.y))) { hasDoorTile = true; break; }
        }
      }
      if (adjacent && !hasDoorTile) return { ok: false, reason: '共享墙边没有可用门位，请先挪开家具' };
    }
    return { ok: true, reason: '' };
  }

  roomsConnected(rooms        )          {
    if (!rooms.length) return true;
    const foyer = rooms.find((r) => r.kind === 'foyer');
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
  canRemoveRoom(id        )                                  {
    const room = this.roomById(id);
    if (!room) return { ok: false, reason: '房间不存在' };
    if (room.kind === 'foyer') return { ok: false, reason: '门厅是酒馆的根，不能拆' };
    const keep = this.rooms.filter((r) => r.id !== id);
    if (keep.length === 0) return { ok: true, reason: '' };
    const foyer = keep.find((r) => r.kind === 'foyer');
    if (!foyer) return { ok: false, reason: '缺少门厅' };
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
    return { ok: true, reason: '' };
  }

  removeRoom(id        )         {
    const room = this.roomById(id);
    if (!room) return [];
    const removed = this.furns.filter((f) => {
      const r = this.roomAt(f.x, f.y);
      return r !== null && r.id === id;
    });
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
      if (!t || t.kind !== 'table') return { ok: false, reason: '椅子必须朝向一张餐桌' };
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
    if (kind === 'table') f.dirty = 0;
    if (kind === 'sink') f.dirty = 0;
    if (kind === 'bed' || kind === 'doublebed' || kind === 'kingbed' || kind === 'pool' || kind === 'billiardtable') f.dirty = 0;
    this.furns.push(f);
    this.reindex();
    return f;
  }

  removeFurn(id        )       {
    this.furns = this.furns.filter((f) => f.id !== id);
    this.reindex();
  }

  /** 餐桌与其朝向匹配的椅子 */
  tableSeats(t      )         {
    const out         = [];
    for (const c of this.furns) {
      if (c.kind !== 'chair') continue;
      const [dx, dy] = dirDelta(c.dir);
      if (c.x + dx === t.x && c.y + dy === t.y) out.push(c);
    }
    return out;
  }

  allTables()         { return this.furns.filter((f) => f.kind === 'table'); }

  entrance()                           {
    const f = this.rooms.find((r) => r.kind === 'foyer');
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
    return { rooms: this.rooms, furns: this.furns, dirt: this.dirt, nr: this.nextRoomId, nf: this.nextFurnId };
  }

  static load(data   
                                                                       
   )         {
    const t = new Tavern();
    t.rooms = data.rooms; t.furns = data.furns; t.dirt = data.dirt || [];
    for (const r of t.rooms) if (!r.style) r.style = 'rustic';   // 旧存档没有风格字段
    t.nextRoomId = data.nr; t.nextFurnId = data.nf;
    t.reindex();
    return t;
  }
}
