// 十二固定世界的种族边界与取名。种族决定外观，名字必须跟得上该界的语言习惯。
import { RACE_NAMES } from './chargen.js';

export const RACE = Object.freeze({
  human: 0, elf: 1, orc: 2, cat: 3, dragon: 4, demon: 5, angel: 6, undead: 7,
  slime: 8, mech: 9, bug: 10, fish: 11, star: 12, flower: 13, stone: 14,
  shadow: 15, dwarf: 16, giant: 17, vampire: 18,
});

/** 每界人口权重。只列该界会出现的种族；权重即客流/招聘抽签权重。 */
export const WORLD_RACE_WEIGHTS = Object.freeze({
  hearth_coast: [[RACE.human, 8], [RACE.dwarf, 5], [RACE.elf, 4], [RACE.orc, 3], [RACE.cat, 2]],
  verdant_court: [[RACE.elf, 18], [RACE.flower, 3], [RACE.cat, 2], [RACE.human, 1]],
  magma_ridge: [
    [RACE.human, 12], [RACE.cat, 3], [RACE.flower, 3], [RACE.dragon, 2], [RACE.undead, 2],
    [RACE.star, 2], [RACE.bug, 2], [RACE.fish, 2], [RACE.stone, 1],
  ],
  neon_ring: [[RACE.human, 10], [RACE.mech, 8], [RACE.human, 3], [RACE.mech, 2]],
  moonsea: [[RACE.fish, 10], [RACE.human, 3], [RACE.flower, 2], [RACE.star, 2]],
  evernight: [[RACE.undead, 7], [RACE.vampire, 5], [RACE.shadow, 4], [RACE.human, 2]],
  honey_sky: [[RACE.angel, 7], [RACE.star, 4], [RACE.flower, 3], [RACE.human, 2]],
  iron_hive: [[RACE.human, 10], [RACE.mech, 6], [RACE.stone, 2], [RACE.giant, 1]],
  mask_realm: [[RACE.demon, 5], [RACE.cat, 4], [RACE.shadow, 3], [RACE.human, 3]],
  inverted_dreamsea: [[RACE.star, 6], [RACE.slime, 4], [RACE.fish, 3], [RACE.shadow, 2]],
  ash_dragoncourt: [[RACE.dragon, 8], [RACE.dwarf, 5], [RACE.demon, 3], [RACE.giant, 2]],
  timeless_bazaar: RACE_NAMES.map((_, i) => [i, 1]),
});

/** 标志人物的种族，与百科名单顺序一一对应。 */
export const WORLD_NOTABLE_RACES = Object.freeze({
  hearth_coast: [RACE.human, RACE.dwarf, RACE.human, RACE.elf, RACE.human, RACE.shadow],
  verdant_court: [RACE.elf, RACE.elf, RACE.flower, RACE.flower, RACE.elf, RACE.elf],
  magma_ridge: [RACE.human, RACE.human, RACE.cat, RACE.human, RACE.human, RACE.undead],
  neon_ring: [RACE.human, RACE.mech, RACE.human, RACE.mech, RACE.human, RACE.human],
  moonsea: [RACE.fish, RACE.fish, RACE.human, RACE.star, RACE.fish, RACE.fish],
  evernight: [RACE.vampire, RACE.undead, RACE.shadow, RACE.undead, RACE.human, RACE.undead],
  honey_sky: [RACE.angel, RACE.human, RACE.flower, RACE.human, RACE.star, RACE.angel],
  iron_hive: [RACE.human, RACE.mech, RACE.human, RACE.human, RACE.human, RACE.mech],
  mask_realm: [RACE.demon, RACE.shadow, RACE.human, RACE.demon, RACE.cat, RACE.shadow],
  inverted_dreamsea: [RACE.star, RACE.shadow, RACE.slime, RACE.human, RACE.star, RACE.fish],
  ash_dragoncourt: [RACE.dragon, RACE.dwarf, RACE.demon, RACE.human, RACE.dwarf, RACE.dragon],
  timeless_bazaar: [RACE.human, RACE.human, RACE.mech, RACE.shadow, RACE.human, RACE.undead],
});

function pick(rng, rows) {
  return rows[rng.int(rows.length)];
}

export function worldIdOf(world) {
  return typeof world === 'string' ? world : world?.id || '';
}

export function worldRaceIds(world) {
  const id = worldIdOf(world);
  const weights = WORLD_RACE_WEIGHTS[id] || (Array.isArray(world?.population) ? world.population.map((row) => [row.raceId, row.weight || 1]) : []);
  return [...new Set(weights.map((row) => row[0] ?? row.raceId).filter((raceId) => Number.isInteger(raceId) && raceId >= 0 && raceId < RACE_NAMES.length))];
}

export function raceAllowedInWorld(world, raceId) {
  const allowed = worldRaceIds(world);
  if (!allowed.length) return Number.isInteger(raceId) && raceId >= 0 && raceId < RACE_NAMES.length;
  return allowed.includes(raceId);
}

export function pickWorldRace(rng, world, requested) {
  if (Number.isInteger(requested) && requested >= 0 && raceAllowedInWorld(world, requested)) return requested;
  const id = worldIdOf(world);
  const weights = WORLD_RACE_WEIGHTS[id] || (world?.population || []).map((row) => [row.raceId, row.weight || 1]);
  const total = weights.reduce((sum, row) => sum + (row[1] || 0), 0);
  if (!total) return rng.int(RACE_NAMES.length);
  let roll = rng.next() * total;
  for (const [raceId, weight] of weights) {
    roll -= weight || 0;
    if (roll < 0) return raceId;
  }
  return weights[0][0];
}

const XIANXIA_SUR = ['谢', '姬', '陆', '苏', '沈', '白', '柳', '顾', '萧', '叶', '楚', '慕', '温', '裴', '江', '韩', '林', '陈', '周', '吴', '赵', '云', '青', '玄', '司徒', '欧阳', '南宫', '上官', '钟离', '令狐'];
const XIANXIA_M = ['无咎', '玄策', '清远', '怀瑾', '守一', '问天', '长歌', '明远', '承渊', '知微', '鹤归', '子衿', '抱朴', '无尘', '清虚', '寒潭', '远山', '听潮'];
const XIANXIA_F = ['疏影', '清欢', '婉晚', '灵犀', '素心', '听雪', '含光', '若兰', '朝露', '九娘', '扶摇', '青萝', '晚晴', '如晦', '云舒'];
const XIANXIA_RACE = {
  [RACE.cat]: { sur: ['狐', '狸', '苏', '白'], given: ['九娘', '狸奴', '青丘', '小满', '阿狸'] },
  [RACE.flower]: { sur: ['桃', '海棠', '芙', '兰'], given: ['夭夭', '扶疏', '绛雪', '海棠', '青萝'] },
  [RACE.dragon]: { sur: ['敖', '龙', '沧'], given: ['归墟', '长生', '御风', '踏云'] },
  [RACE.undead]: { sur: ['冥', '幽', '阴'], given: ['昭', '无面', '渡客', '忘川'] },
  [RACE.star]: { sur: ['星', '辰', '流'], given: ['河', '流萤', '拾光', '织女'] },
  [RACE.bug]: { sur: ['茧', '螣', '蚕'], given: ['娘', '远', '织衣', '吐丝'] },
  [RACE.fish]: { sur: ['鲛', '沧', '潮'], given: ['人', '浪', '弄珠', '听潮'] },
  [RACE.stone]: { sur: ['磐', '岩', '石'], given: ['生', '不语', '镇山', '负岳'] },
};

const NEON_SUR = ['陈', '林', '周', '吴', '郑', '王', '李', '张', '刘', '黄', '赵', '孙', '马', '朱', '胡', '郭', '何', '高', '罗', '梁', '阮', '沈', '陆', '乔'];
const NEON_GIVEN = ['阿凯', '七月', '未眠', '小满', '阿杰', '北巷', '晚星', '可可', '阿修', '南风', '小舟', '糖糖', '安宁', '远山', '雨口', '夜跑', '小周', '阿猫', '老铁', '阿九'];
const NEON_NICK = ['老周', '阿猫', '小铁', '夜跑', '雨口', '老磁带', '码头陈', '镜屏林'];
const NEON_MECH = ['阿铁', '七号', '老K', '零七', '小齿轮', '焊疤', '夜班九'];

const FANTASY_GIVEN = ['伊蕾娜', '格罗姆', '弥赛尔', '洛莎', '埃尔文', '索林', '卡琳', '布朗特', '奥里克', '莉亚', '哈根', '塞拉'];
const FANTASY_SUR = ['白鹿', '铜砧', '霜刃', '银冠', '长桌', '深路', '七曜', '北境'];

const ELVEN_GIVEN = ['赛芙琳', '阿岚', '蜜铃', '露叶', '青枝', '月芽', '鹿铃', '苔光', '九叶', '扶风', '浅芽', '听泉'];
const ELVEN_SUR = ['九叶', '苔光', '鹿铃', '露阶', '百花', '深根'];

const TIDAL_GIVEN = ['澜歌', '索姆', '弥珊', '三贝', '潮生', '盐柑', '泡语', '鲸背', '无鳍', '听潮', '珊瑚', '月核'];
const GOTHIC_GIVEN = ['维奥拉', '欧德', '塔弥拉', '棺七', '守名', '绯月', '晨光', '无墓', '黑蜡', '影后'];
const SKY_GIVEN = ['赫萝妲', '伊安', '珀尔', '弥迦', '晨七', '羽桥', '日轮', '云帆', '哑钟', '金蜜'];
const IRON_GIVEN = ['阿德拉斯', '赫卡特', '塞拉', '洛克', '零灰', '瓦伦', '卡修斯', '玛尔卡', '奥古斯特', '铁盾'];
const MASK_GIVEN = ['阿黛尔', '铜铃', '倒彩', '猫步', '红后', '无面', '谢幕', '喝彩'];
const DREAM_GIVEN = ['小满', '杜衡', '软月', '瓶潮', '鲸梦', '倒雨', '醒者', '拾梦'];
const DRAGON_GIVEN = ['萨维娅', '铜岳', '弥菲斯', '罗坎', '阿栖', '烬冠', '黑砧', '无鳞'];
const TIME_GIVEN = ['现在', '昨日', '三七', '钟缺', '失刻', '迟到'];

function xianxiaName(rng, sex, raceId) {
  const flavor = XIANXIA_RACE[raceId];
  if (flavor && rng.chance(0.55)) return pick(rng, flavor.sur) + pick(rng, flavor.given);
  const given = sex === '女' ? XIANXIA_F : sex === '男' ? XIANXIA_M : rng.chance(0.5) ? XIANXIA_F : XIANXIA_M;
  return pick(rng, XIANXIA_SUR) + pick(rng, given);
}

function neonName(rng, sex, raceId) {
  if (raceId === RACE.mech && rng.chance(0.45)) {
    const tag = pick(rng, NEON_MECH);
    return rng.chance(0.4) ? pick(rng, NEON_SUR) + tag.replace(/^阿|^老|^小/, '') : tag;
  }
  if (rng.chance(0.18)) return pick(rng, NEON_NICK);
  const given = pick(rng, NEON_GIVEN);
  return pick(rng, NEON_SUR) + (given.startsWith('阿') || given.startsWith('小') || given.startsWith('老') ? given.slice(1) : given);
}

function dotted(rng, given, sur) {
  return `${pick(rng, given)}·${pick(rng, sur)}`;
}

function styleName(rng, sex, raceId, worldId) {
  switch (worldId) {
    case 'magma_ridge': return xianxiaName(rng, sex, raceId);
    case 'neon_ring': return neonName(rng, sex, raceId);
    case 'hearth_coast': return dotted(rng, FANTASY_GIVEN, FANTASY_SUR);
    case 'verdant_court': return dotted(rng, ELVEN_GIVEN, ELVEN_SUR);
    case 'moonsea': return pick(rng, TIDAL_GIVEN);
    case 'evernight': return pick(rng, GOTHIC_GIVEN);
    case 'honey_sky': return pick(rng, SKY_GIVEN);
    case 'iron_hive': return pick(rng, IRON_GIVEN);
    case 'mask_realm': return pick(rng, MASK_GIVEN);
    case 'inverted_dreamsea': return pick(rng, DREAM_GIVEN);
    case 'ash_dragoncourt': return pick(rng, DRAGON_GIVEN);
    case 'timeless_bazaar': {
      const eras = ['magma_ridge', 'neon_ring', 'hearth_coast', 'evernight', 'iron_hive'];
      return styleName(rng, sex, raceId, pick(rng, eras));
    }
    default: return '';
  }
}

const GENERIC_A = ['泽', '缪', '卡', '瓦', '洛', '希', '塔', '努', '格', '伊', '扎', '梅', '桑', '柯', '维', '露', '奥', '巴'];
const GENERIC_B = ['尔', '兰', '斯', '娅', '格', '恩', '洛', '克', '莎', '姆', '瑞', '拉', '德', '菲', '塔', '希'];

export function makeGenericName(rng) {
  return pick(rng, GENERIC_A) + pick(rng, GENERIC_B);
}

export function makeWorldName(rng, world, opts = {}) {
  const id = worldIdOf(world);
  const named = styleName(rng, opts.sex, opts.raceId, id);
  return named || makeGenericName(rng);
}

export function looksLikeXianxiaName(name) {
  return /^[\u4e00-\u9fff]{2,4}$/.test(String(name || ''));
}

export function looksLikeNeonName(name) {
  const text = String(name || '');
  if (NEON_NICK.includes(text) || NEON_MECH.includes(text)) return true;
  return /^[\u4e00-\u9fffA-Za-z0-9]{2,8}$/.test(text) && !text.includes('·星屑') && !text.includes('本账号');
}
