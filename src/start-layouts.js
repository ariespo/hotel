import { BLUEPRINTS, furnDef } from './data.js';
import { bpById } from './world.js';

const ROOM_FILL = Object.freeze({
  foyer: '#C9922F', dining: '#E2B56A', kitchen: '#B45F10', storage: '#8A6A4A',
  corridor: '#E8D5B0', guestroom: '#8A74B8', lounge: '#65A85B', bar: '#39D7D2',
});

export const START_LAYOUTS = Object.freeze([
  {
    id: 'classic', name: '经典分馆',
    note: '现用开局：门厅居中，左餐厨仓储，右客房，上员工宿舍。可直接营业。',
    refund: false,
    rooms: [
      { bp: 'foyer4', x: 0, y: 0, rot: 0 },
      { bp: 'dining6', x: -6, y: 0, rot: 0 },
      { bp: 'kitchen6', x: -6, y: 5, rot: 0 },
      { bp: 'storage4', x: -10, y: 5, rot: 0 },
      { bp: 'corridor6', x: 4, y: 1, rot: 0 },
      { bp: 'guestroom5', x: 9, y: -3, rot: 0 },
      { bp: 'guestroom5', x: 9, y: 3, rot: 0 },
      { bp: 'corridor6', x: 1, y: -6, rot: 1 },
      { bp: 'corridor6', x: 1, y: -12, rot: 1 },
      { bp: 'lounge5', x: -4, y: -12, rot: 0 },
      { bp: 'lounge5', x: 3, y: -12, rot: 0 },
    ],
    furns: [
      { kind: 'desk', x: 1, y: 2, dir: 0 },
      { kind: 'prep', x: -6, y: 6, dir: 0 },
      { kind: 'stove', x: -3, y: 6, dir: 0 },
      { kind: 'sink', x: -6, y: 8, dir: 0 },
      { kind: 'pass', x: -2, y: 8, dir: 0 },
      { kind: 'shelf', x: -10, y: 6, dir: 0 },
      { kind: 'table', x: -5, y: 1, dir: 0 }, { kind: 'chair', x: -6, y: 1, dir: 3 }, { kind: 'chair', x: -5, y: 2, dir: 2 },
      { kind: 'table', x: -2, y: 1, dir: 0 }, { kind: 'chair', x: -3, y: 1, dir: 3 }, { kind: 'chair', x: -2, y: 2, dir: 2 },
      { kind: 'table', x: -5, y: 3, dir: 0 }, { kind: 'chair', x: -6, y: 3, dir: 3 }, { kind: 'chair', x: -5, y: 4, dir: 2 },
      { kind: 'table', x: -2, y: 3, dir: 0 }, { kind: 'chair', x: -3, y: 3, dir: 3 }, { kind: 'chair', x: -2, y: 4, dir: 2 },
      { kind: 'bed', x: 10, y: -2, dir: 0 }, { kind: 'lamp', x: 13, y: 0, dir: 0 },
      { kind: 'bed', x: 10, y: 4, dir: 0 }, { kind: 'lamp', x: 13, y: 6, dir: 0 },
      { kind: 'lamp', x: 7, y: 2, dir: 0 },
      { kind: 'couch', x: -3, y: -12, dir: 0 }, { kind: 'bunk', x: -3, y: -10, dir: 0 }, { kind: 'bookshelf', x: -1, y: -12, dir: 0 },
      { kind: 'couch', x: 4, y: -12, dir: 0 }, { kind: 'bunk', x: 4, y: -10, dir: 0 }, { kind: 'teatable', x: 7, y: -12, dir: 0 }, { kind: 'vanity', x: 7, y: -10, dir: 0 },
    ],
  },
  {
    id: 'street', name: '街铺一线',
    note: '门厅、餐厅、厨房、仓储和一间客房沿街排开，占地更紧，动线更短。',
    refund: false,
    rooms: [
      { bp: 'foyer4', x: 0, y: 0, rot: 0 },
      { bp: 'dining6', x: -6, y: 0, rot: 0 },
      { bp: 'kitchen6', x: -6, y: 5, rot: 0 },
      { bp: 'storage4', x: -10, y: 5, rot: 0 },
      { bp: 'lounge5', x: 4, y: 0, rot: 0 },
      { bp: 'guestroom5', x: 4, y: 4, rot: 0 },
    ],
    furns: [
      { kind: 'desk', x: 1, y: 2, dir: 0 },
      { kind: 'prep', x: -6, y: 6, dir: 0 },
      { kind: 'stove', x: -3, y: 6, dir: 0 },
      { kind: 'sink', x: -6, y: 8, dir: 0 },
      { kind: 'pass', x: -2, y: 8, dir: 0 },
      { kind: 'shelf', x: -10, y: 6, dir: 0 },
      { kind: 'table', x: -5, y: 1, dir: 0 }, { kind: 'chair', x: -6, y: 1, dir: 3 }, { kind: 'chair', x: -5, y: 2, dir: 2 },
      { kind: 'table', x: -2, y: 1, dir: 0 }, { kind: 'chair', x: -3, y: 1, dir: 3 }, { kind: 'chair', x: -2, y: 2, dir: 2 },
      { kind: 'couch', x: 5, y: 0, dir: 0 }, { kind: 'bunk', x: 5, y: 2, dir: 0 },
      { kind: 'bed', x: 5, y: 5, dir: 0 }, { kind: 'lamp', x: 8, y: 4, dir: 0 },
    ],
  },
  {
    id: 'hearth', name: '围炉小店',
    note: '只保留门厅、餐厨仓储和一间员工休息室。客房以后再盖，开局更省事。',
    refund: false,
    rooms: [
      { bp: 'foyer4', x: 0, y: 0, rot: 0 },
      { bp: 'dining6', x: -6, y: 0, rot: 0 },
      { bp: 'kitchen6', x: -6, y: 5, rot: 0 },
      { bp: 'storage4', x: -10, y: 5, rot: 0 },
      { bp: 'lounge5', x: 4, y: 0, rot: 0 },
    ],
    furns: [
      { kind: 'desk', x: 1, y: 2, dir: 0 },
      { kind: 'prep', x: -6, y: 6, dir: 0 },
      { kind: 'stove', x: -3, y: 6, dir: 0 },
      { kind: 'sink', x: -6, y: 8, dir: 0 },
      { kind: 'pass', x: -2, y: 8, dir: 0 },
      { kind: 'shelf', x: -10, y: 6, dir: 0 },
      { kind: 'table', x: -5, y: 1, dir: 0 }, { kind: 'chair', x: -6, y: 1, dir: 3 }, { kind: 'chair', x: -5, y: 2, dir: 2 },
      { kind: 'table', x: -2, y: 3, dir: 0 }, { kind: 'chair', x: -3, y: 3, dir: 3 }, { kind: 'chair', x: -2, y: 4, dir: 2 },
      { kind: 'couch', x: 5, y: 0, dir: 0 }, { kind: 'bunk', x: 5, y: 2, dir: 0 }, { kind: 'teatable', x: 8, y: 0, dir: 0 },
    ],
  },
  {
    id: 'empty', name: '空门厅',
    note: '只留下位面门厅。经典分馆里那些房间和家具的钱会 100% 退回账面，由你自由建造。',
    refund: true,
    rooms: [{ bp: 'foyer4', x: 0, y: 0, rot: 0 }],
    furns: [],
  },
]);

function roomSize(bpId, rot = 0) {
  const bp = BLUEPRINTS.find((row) => row.id === bpId);
  if (!bp) return { w: 1, h: 1, cost: 0, kind: 'corridor', name: bpId };
  return { w: rot ? bp.h : bp.w, h: rot ? bp.w : bp.h, cost: bp.cost || 0, kind: bp.kind, name: bp.name };
}

export function startLayoutById(id) {
  return START_LAYOUTS.find((row) => row.id === id) || START_LAYOUTS[0];
}

export function startLayoutCost(layout) {
  const rooms = (layout.rooms || []).reduce((sum, room) => sum + roomSize(room.bp, room.rot).cost, 0);
  const furns = (layout.furns || []).reduce((sum, furn) => {
    const def = furnDef(furn.kind);
    const price = Array.isArray(def?.cost) ? def.cost[Math.max(0, (furn.quality || 1) - 1)] : 0;
    return sum + (price || 0);
  }, 0);
  return rooms + furns;
}

export function emptyLayoutRefund() {
  return startLayoutCost(startLayoutById('classic'));
}

export function applyStartLayout(tavern, id = 'classic') {
  const layout = startLayoutById(id);
  for (const room of layout.rooms) tavern.placeRoom(bpById(room.bp), room.x, room.y, room.rot || 0);
  for (const furn of layout.furns) tavern.placeFurn(furn.kind, furn.x, furn.y, furn.dir || 0, furn.quality || 1);
  return layout;
}

export function startLayoutPreviewSvg(layout) {
  const rooms = (layout.rooms || []).map((room) => ({ ...room, ...roomSize(room.bp, room.rot) }));
  if (!rooms.length) return '<svg viewBox="0 0 20 16"></svg>';
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const room of rooms) {
    minX = Math.min(minX, room.x);
    minY = Math.min(minY, room.y);
    maxX = Math.max(maxX, room.x + room.w);
    maxY = Math.max(maxY, room.y + room.h);
  }
  const pad = 1;
  const vb = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  const rects = rooms.map((room) => {
    const fill = ROOM_FILL[room.kind] || '#C9B896';
    const label = room.kind === 'foyer' ? '门厅' : room.kind === 'dining' ? '餐厅' : room.kind === 'kitchen' ? '厨房'
      : room.kind === 'storage' ? '仓储' : room.kind === 'corridor' ? '廊' : room.kind === 'guestroom' ? '客房'
        : room.kind === 'lounge' ? '休息' : room.name;
    const font = Math.max(0.7, Math.min(room.w, room.h) * 0.28);
    return `<rect x="${room.x}" y="${room.y}" width="${room.w}" height="${room.h}" fill="${fill}" stroke="#5A4033" stroke-width="0.12" rx="0.15"/>
      <text x="${room.x + room.w / 2}" y="${room.y + room.h / 2 + font * 0.32}" text-anchor="middle" font-size="${font}" fill="#3A2518" font-family="sans-serif">${label}</text>`;
  }).join('');
  return `<svg class="layout-preview" viewBox="${vb}" role="img" aria-label="${layout.name}平面图">${rects}</svg>`;
}
