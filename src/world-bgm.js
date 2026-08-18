export const FALLBACK_WORLD_IDS = ['verdant_court', 'hearth_coast', 'neon_ring', 'moonsea'];

const HEARTH_OPEN = [
  { id: 'hearth-open-dance', file: 'assets/bgm/hearth-open-dance.mp3', name: '炉边小舞', note: '艾泽/蜜昼日常堂食', role: 'default' },
  { id: 'hearth-open-cheer', file: 'assets/bgm/hearth-open-cheer.mp3', name: '庆祝', note: '归旗、使团与宴会', role: 'gather', festivals: ['冒险者归旗日', '停泊礼'] },
  { id: 'hearth-open-harvest', file: 'assets/bgm/hearth-open-harvest.mp3', name: '丰收日', note: '七曜巡礼、羽桥巡游', role: 'festive', festivals: ['七曜巡礼', '羽桥巡游'] },
];
const HEARTH_CLOSE = [
  { id: 'hearth-close-warmth', file: 'assets/bgm/hearth-close-warmth.mp3', name: '余温', note: '盘账、改房间', role: 'default' },
  { id: 'hearth-close-summer', file: 'assets/bgm/hearth-close-summer.mp3', name: '夏夜', note: '日结与更晚点的打烊', role: 'late' },
];
const GRIM_OPEN = [
  { id: 'grim-open-prayer', file: 'assets/bgm/grim-open-prayer.mp3', name: '用餐祷告', note: '铁血/永夜/龙庭日常堂食', role: 'default' },
  { id: 'grim-open-vigil', file: 'assets/bgm/grim-open-vigil.mp3', name: '守线日', note: '纪念日与王宴', role: 'gather', festivals: ['守线纪念日', '铸造初火节', '百年夜宴', '守名节', '黑金王宴', '七炉竞锻'] },
];
const GRIM_CLOSE = [
  { id: 'grim-close-watch', file: 'assets/bgm/grim-close-watch.mp3', name: '守望者', note: '盘账、改房间', role: 'default' },
  { id: 'grim-close-sleep', file: 'assets/bgm/grim-close-sleep.mp3', name: '安眠之前', note: '日结与更晚点的打烊', role: 'late' },
];
const DREAM_OPEN = [
  { id: 'dream-open-dock', file: 'assets/bgm/dream-open-dock.mp3', name: '幻觉码头', note: '梦海/无时日常堂食', role: 'default' },
  { id: 'dream-open-feast', file: 'assets/bgm/dream-open-feast.mp3', name: '失谐灯宴', note: '倒雨嘉年华、零时开市', role: 'festive', festivals: ['倒雨嘉年华', '鲸梦渡日', '零时开市', '失刻纪念日'] },
];
const DREAM_CLOSE = [
  { id: 'dream-close-bottle', file: 'assets/bgm/dream-close-bottle.mp3', name: '漂流瓶', note: '盘账、改房间', role: 'default' },
  { id: 'dream-close-lighthouse', file: 'assets/bgm/dream-close-lighthouse.mp3', name: '倒置灯塔', note: '日结与更晚点的打烊', role: 'late' },
];
const MASK_OPEN = [
  { id: 'mask-open-banquet', file: 'assets/bgm/mask-open-banquet.mp3', name: '假面宴会', note: '千面日常堂食', role: 'default' },
  { id: 'mask-open-premiere', file: 'assets/bgm/mask-open-premiere.mp3', name: '盛大的首演夜', note: '全国首演、无名面具节', role: 'festive', festivals: ['全国首演夜', '无名面具节'] },
];
const MASK_CLOSE = [
  { id: 'mask-close-scheme', file: 'assets/bgm/mask-close-scheme.mp3', name: '阴谋与窃笑', note: '盘账、改房间', role: 'default' },
  { id: 'mask-close-mask', file: 'assets/bgm/mask-close-mask.mp3', name: '无名面具', note: '日结与更晚点的打烊', role: 'late' },
];

export const WORLD_BGM = {
  hearth_coast: { name: '艾泽普利斯', open: HEARTH_OPEN, close: HEARTH_CLOSE },
  honey_sky: { name: '蜜昼浮岛', open: HEARTH_OPEN, close: HEARTH_CLOSE },
  iron_hive: { name: '铁血燃烬', open: GRIM_OPEN, close: GRIM_CLOSE },
  evernight: { name: '永夜墓都', open: GRIM_OPEN, close: GRIM_CLOSE },
  ash_dragoncourt: { name: '灰烬龙庭', open: GRIM_OPEN, close: GRIM_CLOSE },
  inverted_dreamsea: { name: '倒悬梦海', open: DREAM_OPEN, close: DREAM_CLOSE },
  timeless_bazaar: { name: '无时集市', open: DREAM_OPEN, close: DREAM_CLOSE },
  mask_realm: { name: '千面戏国', open: MASK_OPEN, close: MASK_CLOSE },
  magma_ridge: {
    name: '玄黄大世界',
    open: [
      { id: 'xuan-open-cook', file: 'assets/bgm/xuan-open-cook.mp3', name: '山店清炊', note: '玄黄日常堂食', role: 'default' },
      { id: 'xuan-open-gather', file: 'assets/bgm/xuan-open-gather.mp3', name: '山客同席', note: '同门雅集、问道大会', role: 'gather', festivals: ['问道大会'] },
      { id: 'xuan-open-lantern', file: 'assets/bgm/xuan-open-lantern.mp3', name: '灯酒星庭', note: '上元灯会、观星花酒', role: 'festive', festivals: ['上元灯会'] },
    ],
    close: [
      { id: 'xuan-close-ledger', file: 'assets/bgm/xuan-close-ledger.mp3', name: '客尽理账', note: '盘账、改房间', role: 'default' },
      { id: 'xuan-close-tea', file: 'assets/bgm/xuan-close-tea.mp3', name: '更尽一灯茶', note: '日结与更晚点的打烊', role: 'late' },
    ],
  },
  verdant_court: {
    name: '森冠庭域',
    open: [
      { id: 'verdant-open-breakfast', file: 'assets/bgm/verdant-open-breakfast.mp3', name: '露叶早市', note: '森冠日常堂食', role: 'default' },
      { id: 'verdant-open-blossom', file: 'assets/bgm/verdant-open-blossom.mp3', name: '百花庭院', note: '百花换冠、迁鹿夜', role: 'gather', festivals: ['百花换冠', '迁鹿夜'] },
    ],
    close: [
      { id: 'verdant-close-dew', file: 'assets/bgm/verdant-close-dew.mp3', name: '收露', note: '盘账、改房间', role: 'default' },
      { id: 'verdant-close-moss', file: 'assets/bgm/verdant-close-moss.mp3', name: '苔灯', note: '日结与更晚点的打烊', role: 'late' },
    ],
  },
  neon_ring: {
    name: '霓虹环城',
    open: [
      { id: 'neon-open-street', file: 'assets/bgm/neon-open-street.mp3', name: '磁悬街', note: '霓虹日常与重启夜', role: 'default', festivals: ['霓虹重启夜'] },
      { id: 'neon-open-tape', file: 'assets/bgm/neon-open-tape.mp3', name: '复古浪潮', note: '实体怀旧周', role: 'festive', festivals: ['实体怀旧周'] },
    ],
    close: [
      { id: 'neon-close-home', file: 'assets/bgm/neon-close-home.mp3', name: '夜归人', note: '盘账、改房间', role: 'default' },
      { id: 'neon-close-rain', file: 'assets/bgm/neon-close-rain.mp3', name: '酸雨夜', note: '日结与更晚点的打烊', role: 'late' },
    ],
  },
  moonsea: {
    name: '月沉海国',
    open: [
      { id: 'moon-open-harbor', file: 'assets/bgm/moon-open-harbor.mp3', name: '泡泡街早潮', note: '海国日常堂食', role: 'default' },
      { id: 'moon-open-sail', file: 'assets/bgm/moon-open-sail.mp3', name: '浮岛开帆', note: '浮岛开帆日、沉月祭', role: 'gather', festivals: ['浮岛开帆日', '沉月祭'] },
    ],
    close: [
      { id: 'moon-close-ledger', file: 'assets/bgm/moon-close-ledger.mp3', name: '退潮', note: '盘账、改房间', role: 'default' },
      { id: 'moon-close-whale', file: 'assets/bgm/moon-close-whale.mp3', name: '鲸歌', note: '日结与更晚点的打烊', role: 'late' },
    ],
  },
};

const worldTracks = (worldId, phase) => WORLD_BGM[worldId]?.[phase] || [];

export function allBgmTracks() {
  const seen = new Set();
  const out = [];
  const push = (track) => {
    if (!track || seen.has(track.id)) return;
    seen.add(track.id);
    out.push(track);
  };
  for (const world of Object.values(WORLD_BGM)) {
    for (const track of [...(world.open || []), ...(world.close || [])]) push(track);
  }
  return out;
}

export function bgmManifest() {
  return allBgmTracks().map((track) => [track.id, track.file]);
}

export function bgmTrackById(id) {
  return allBgmTracks().find((track) => track.id === id) || null;
}

export function bgmSettingsGroups() {
  return Object.entries(WORLD_BGM).map(([worldId, world]) => ({
    worldId,
    name: world.name,
    tracks: [...(world.open || []), ...(world.close || [])],
  }));
}

function festivalHit(track, festivalName) {
  const name = String(festivalName || '');
  if (!name) return false;
  return (track.festivals || []).some((tag) => name.includes(tag) || tag.includes(name));
}

function pickFromPool(pool, phase, festivalName) {
  if (!pool.length) return null;
  if (phase === 'open') {
    return pool.find((track) => festivalHit(track, festivalName))
      || pool.find((track) => track.role === 'default')
      || pool[0];
  }
  if (phase === 'settle') {
    return pool.find((track) => track.role === 'late') || pool[1] || pool[0];
  }
  return pool.find((track) => track.role === 'default') || pool[0];
}

function fallbackPool(phase) {
  const key = phase === 'open' ? 'open' : 'close';
  const rows = FALLBACK_WORLD_IDS.flatMap((id) => worldTracks(id, key));
  if (phase === 'settle') {
    const late = rows.filter((track) => track.role === 'late');
    return late.length ? late : rows;
  }
  if (phase === 'close') {
    const def = rows.filter((track) => track.role === 'default');
    return def.length ? def : rows;
  }
  return rows;
}

function pickRandom(list, random) {
  if (!list.length) return null;
  const n = Number(random());
  const index = Math.min(list.length - 1, Math.max(0, Math.floor((Number.isFinite(n) ? n : 0) * list.length)));
  return list[index];
}

/** phase: open | close | settle */
export function resolveWorldBgm({ worldId, phase, festivalName, random = Math.random } = {}) {
  const own = pickFromPool(worldTracks(worldId, phase === 'open' ? 'open' : 'close'), phase, festivalName);
  if (own) return own.id;
  return pickRandom(fallbackPool(phase), random)?.id || '';
}
