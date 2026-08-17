import { WORLD_PROFILES } from './data.js';

export const TITLE_TIERS = Object.freeze({
  common: { id: 'common', label: '普通', color: '#F4EFE3' },
  fine: { id: 'fine', label: '优秀', color: '#5BA4E6' },
  rare: { id: 'rare', label: '精良', color: '#B07AE0' },
  epic: { id: 'epic', label: '史诗', color: '#E2B13A' },
  legend: { id: 'legend', label: '传说', color: '#FF7A3A' },
});

export const CONTEST_STAGES = Object.freeze([
  { id: 'qualifiers', name: '入围赛', next: 'advance', place: 32 },
  { id: 'advance', name: '进阶赛', next: 'round8', place: 16 },
  { id: 'round8', name: '八强赛', next: 'round4', place: 8 },
  { id: 'round4', name: '四强赛', next: 'semi', place: 4 },
  { id: 'semi', name: '半决赛', next: 'final', place: 2 },
  { id: 'final', name: '决赛', next: '', place: 1 },
]);

export const CONTEST_HEATS = Object.freeze([
  {
    id: 'kitchen', name: '出品对决',
    tactics: [
      { id: 'cook', label: '压轴招牌菜', skill: 'cook', note: '用火候和层次硬刚评委' },
      { id: 'mix', label: '收口特调', skill: 'mix', note: '一杯酒改写全场味觉记忆' },
    ],
  },
  {
    id: 'floor', name: '堂面调度',
    tactics: [
      { id: 'serve', label: '无声走位', skill: 'serve', note: '让客人感觉一切早就安排好了' },
      { id: 'carry', label: '闪电翻台', skill: 'carry', note: '以速度压住高峰期的混乱' },
    ],
  },
  {
    id: 'review', name: '风评气场',
    tactics: [
      { id: 'looks', label: '招牌门面', skill: 'looks', note: '仪态和第一印象先拿下一半分数' },
      { id: 'calm', label: '临场压场', skill: 'calm', note: '评委发难时也不乱阵脚' },
    ],
  },
]);

const WORLD_CONTEST_NAMES = Object.freeze({
  hearth_coast: { world: '主位面王牌酒馆争夺赛', cosmos: '艾泽普利斯全位面最强酒馆争霸赛' },
  verdant_court: { world: '森冠庭域花宴评店会', cosmos: '林冠宙域仙庭酒榜' },
  magma_ridge: { world: '玄黄界酒楼风云榜', cosmos: '玄黄宙域酒楼天榜' },
  neon_ring: { world: '霓虹环城夜店脉冲杯', cosmos: '磁悬宙域头号灯牌争霸' },
  moonsea: { world: '月沉海国潮宴金勺榜', cosmos: '沉月宙域潮殿酒榜' },
  evernight: { world: '永夜墓都百年窖藏赛', cosmos: '长夜宙域影宴天榜' },
  honey_sky: { world: '蜜昼浮岛金蜜礼宴赛', cosmos: '永昼宙域羽桥天榜' },
  iron_hive: { world: '铁血燃烬前线补给赛', cosmos: '燃烬宙域军需酒榜' },
  mask_realm: { world: '千面戏国红幕酒楼赛', cosmos: '戏国宙域假面天榜' },
  inverted_dreamsea: { world: '倒悬梦海怪味评店会', cosmos: '梦海宙域倒雨天榜' },
  ash_dragoncourt: { world: '灰烬龙庭黑金宴席赛', cosmos: '龙庭宙域鳞纹天榜' },
  timeless_bazaar: { world: '无时集市跨纪元摊王赛', cosmos: '零时宙域万代酒榜' },
});

export const MYRIAD_CONTEST_NAME = '诸天万界究极酒馆评选！！！';

export const TAVERN_PRESETS = Object.freeze([
  { id: 'portable', name: '多元便携旅店', blurb: '一间能开到任何世界门口的便携旅店。炉火、床铺和账本都跟着传送门走，专为过路旅人准备热食和一晚安稳。' },
  { id: 'hearth', name: '炉边停靠站', blurb: '招牌不大，炉火很稳。过路的冒险者、散修和夜班工人都能在这里把靴子烤干，再决定明天去哪。' },
  { id: 'ledger', name: '星门账房酒铺', blurb: '店主把旧账本改成菜单，把星门观察笔记改成待客规矩。来客可以点菜，也可以把自己的世界写进扉页。' },
  { id: 'lantern', name: '万界灯下居', blurb: '门廊只挂一盏不怕穿堂风的灯。灯还亮着，就说明今晚还有空位、热汤和愿意听人说话的人。' },
]);

export function contestKey(tier, worldId = '') {
  return tier === 'myriad' ? 'myriad' : `${tier}:${worldId || 'unknown'}`;
}

export function contestNameOf(tier, world) {
  if (tier === 'myriad') return MYRIAD_CONTEST_NAME;
  const id = world?.id || world;
  const row = WORLD_CONTEST_NAMES[id] || { world: `${world?.name || '本界'}酒馆大赛`, cosmos: `${world?.name || '本界'}宙域天榜` };
  return tier === 'cosmos' ? row.cosmos : row.world;
}

export function contestHostOf(tier, world) {
  if (tier === 'myriad') return { name: '诸天评委会巡察使', title: '万界究极评选' };
  if (tier === 'cosmos') return { name: `${world?.name || '本界'}宙域观察员`, title: contestNameOf(tier, world) };
  return { name: `${world?.name || '本界'}评榜司事`, title: contestNameOf(tier, world) };
}

export function stageById(id) {
  return CONTEST_STAGES.find((stage) => stage.id === id) || CONTEST_STAGES[0];
}

export function titleTierForPlace(tier, place) {
  if (tier === 'myriad') return place <= 1 ? 'legend' : place <= 2 ? 'epic' : place <= 4 ? 'rare' : 'fine';
  if (tier === 'cosmos') return place <= 1 ? 'epic' : place <= 2 ? 'rare' : place <= 4 ? 'fine' : 'common';
  return place <= 2 ? 'fine' : 'common';
}

export function titleNameFor(tier, world, place) {
  const contest = contestNameOf(tier, world);
  if (place <= 1) return `${contest}·冠军`;
  if (place <= 2) return `${contest}·亚军`;
  if (place <= 4) return `${contest}·四强`;
  if (place <= 8) return `${contest}·八强`;
  return `${contest}·入围店`;
}

export function blankContestState() {
  return { active: null, records: {}, pendingInvite: null };
}

export function normalizeContestState(econ) {
  if (!econ || typeof econ !== 'object') return econ;
  econ.tavernName = String(econ.tavernName || '多元便携旅店').trim().slice(0, 24) || '多元便携旅店';
  econ.tavernBlurb = String(econ.tavernBlurb || '').trim().slice(0, 240);
  econ.titles = Array.isArray(econ.titles) ? econ.titles.filter((row) => row && row.id && row.name).slice(0, 40) : [];
  econ.equippedTitle = econ.titles.some((row) => row.id === econ.equippedTitle) ? econ.equippedTitle : '';
  const source = econ.contest && typeof econ.contest === 'object' ? econ.contest : {};
  econ.contest = {
    active: source.active && typeof source.active === 'object' ? source.active : null,
    records: source.records && typeof source.records === 'object' ? source.records : {},
    pendingInvite: source.pendingInvite && typeof source.pendingInvite === 'object' ? source.pendingInvite : null,
  };
  return econ;
}

export function nextContestInvite(stars, worldId, contest) {
  const records = contest?.records || {};
  if (stars >= 5 && !records.myriad) return { tier: 'myriad', worldId: worldId || '', star: 5 };
  if (stars >= 4 && worldId && !records[contestKey('cosmos', worldId)]) return { tier: 'cosmos', worldId, star: 4 };
  if (stars >= 2 && worldId && !records[contestKey('world', worldId)]) return { tier: 'world', worldId, star: 2 };
  return null;
}

export function opponentPower(stageId, tier) {
  const base = { qualifiers: 48, advance: 54, round8: 58, round4: 63, semi: 68, final: 74 }[stageId] || 50;
  return base + (tier === 'cosmos' ? 6 : tier === 'myriad' ? 12 : 0);
}

export function makeOpponent(rng, world, stageId) {
  const prefixes = world?.motifs?.length ? world.motifs : ['路边', '星门', '旧港', '灯下'];
  const kinds = ['酒楼', '客栈', '炉铺', '夜馆', '茶寮', '停靠站'];
  const prefix = prefixes[rng.int(prefixes.length)] || '路边';
  const kind = kinds[rng.int(kinds.length)];
  const stage = stageById(stageId);
  return {
    name: `${prefix}${kind}`,
    note: stage.place <= 4 ? '已经杀进后半区，不好对付。' : '同样刚拿到入场券的同行。',
  };
}

export function heatScore(sim, tactic, opponent, heatIndex) {
  const skill = sim.bestSkill(tactic.skill).value;
  const day = Number(sim.lastStat?.avgScore);
  const served = Math.min(24, Number(sim.lastStat?.served) || 0);
  const roll = sim.rng.range(-5, 7);
  const player = 18 + skill * 0.42 + (Number.isFinite(day) ? day * 7 : 21) + served * 0.35 + roll;
  const opp = opponent + sim.rng.range(-4, 6) + heatIndex;
  return { player: Math.round(player), opponent: Math.round(opp), won: player >= opp };
}

export function resolveContestMatch(sim, tactics = {}) {
  const active = sim.econ.contest?.active;
  if (!active) return null;
  const stage = stageById(active.stage);
  const power = opponentPower(stage.id, active.tier);
  const heats = CONTEST_HEATS.map((heat, index) => {
    const tactic = heat.tactics.find((row) => row.id === tactics[heat.id]) || heat.tactics[0];
    return { heat, tactic, ...heatScore(sim, tactic, power, index) };
  });
  const wins = heats.filter((row) => row.won).length;
  const passed = wins >= 2;
  return { stage, heats, wins, passed, opponent: active.opponent };
}

export function equippedTitleOf(econ) {
  return (econ?.titles || []).find((row) => row.id === econ.equippedTitle) || null;
}
