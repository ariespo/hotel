export const FALLBACK_WORLD_IDS = ['verdant_court', 'hearth_coast', 'neon_ring', 'moonsea'];

export const WORLD_BGM = {
  hearth_coast: {
    name: '艾泽普利斯',
    open: [
      { id: 'hearth-open-jig', file: 'assets/bgm/hearth-open-jig.mp3', name: '炉边 Jig', note: '艾泽日常堂食', role: 'default' },
      { id: 'hearth-open-table', file: 'assets/bgm/hearth-open-table.mp3', name: '公会长桌', note: '小队到店、委托热闹', role: 'gather', festivals: ['冒险者归旗日'] },
    ],
    close: [
      { id: 'hearth-close-flag', file: 'assets/bgm/hearth-close-flag.mp3', name: '收旗余温', note: '盘账、改房间', role: 'default' },
      { id: 'hearth-close-ember', file: 'assets/bgm/hearth-close-ember.mp3', name: '客栈余烬', note: '日结与更晚点的打烊', role: 'late' },
    ],
  },
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
