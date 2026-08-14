// 模拟：员工任务调度 / 客人流程 / 厨房产线 / 经济结算 / 事件
import {                  randomAppearance,           } from './chargen.js';
import { RACE_NAMES } from './chargen.js';
import { Rng } from './pix.js';
import {
  AD_REQ_MULT, AD_TIERS,              BED_KINDS, BED_PRICE_MULT, DISHES,            EVENTS,                               
  FLAVOR_LABEL, FLAVORS, FURN_DEFS, furnDef,
  DUTIES, GUEST_WANTS, ING_KEYS, ING_LABEL, ING_PRICE,                        JOBS, makeName, SEASON_NAMES,                              SKILL_KEYS, SKILL_LABEL,
  ROOM_CHARM, ROOM_LABEL, STAR_CERTIFICATIONS, STAR_THRESHOLDS, starsOf, styleById, TRAIT_CHEM, TRAIT_SAME, TRAITS, wantById,
} from './data.js';
import {            Tavern, dirDelta, furnFootprint } from './world.js';

export const LONG_EVENT_CHAINS = [
  { id: 'starwhale', name: '星鲸迁徙季', steps: [
    { title: '远空的鲸歌', premise: '整座旅店的杯盘同时轻颤，窗外传来跨越位面的低沉鲸歌。一支观测队希望把这里设为临时补给站。', kind: 'opportunity', choices: [
      { label: '由服务员接待观测队', note: '服务检定，建立合作关系', skill: 'serve', difficulty: 42, successText: '观测队对安排赞不绝口，约定迁徙当天再次到访。', failureText: '接待流程一团乱，观测队只留下了一张潦草星图。', successEffects: { coins: 120, rep: 10 }, failureEffects: { rep: -4, stress: 5 } },
      { label: '让冷静员工解析鲸歌', note: '冷静检定，收集特殊情报', skill: 'calm', difficulty: 48, successText: '鲸歌的节律被记进日志，旅店掌握了迁徙路线。', failureText: '共鸣让员工头晕目眩，只能暂时关闭观测窗。', successEffects: { rep: 14 }, failureEffects: { stress: 8 } },
    ] },
    { title: '星鲸影落屋顶', premise: '迁徙的星鲸群遮住银河，慕名而来的客人挤满门厅。观测队要求旅店在最混乱的时刻维持秩序。', kind: 'guest', choices: [
      { label: '开设限时观景席', note: '搬运检定，快速调整场地', skill: 'carry', difficulty: 55, successText: '家具与人流被迅速分开，观景席带来一笔可观收入。', failureText: '临时动线相互打结，碰坏了几件器具。', successEffects: { coins: 260, rep: 12 }, failureEffects: { coins: -120, dirt: 3 } },
      { label: '用特调安抚等待客人', note: '调酒检定，消耗以太换口碑', skill: 'mix', difficulty: 52, successText: '发光的特调与鲸影交相辉映，客人纷纷留下好评。', failureText: '饮品出得太慢，错过鲸群的人把怨气写进评论。', successEffects: { rep: 20, stock: { ether: -5 } }, failureEffects: { rep: -10, stock: { ether: -3 } } },
    ] },
    { title: '幼鲸迷航', premise: '迁徙末尾，一头幼年星鲸被位面门厅的灯光吸引，徘徊不去。观测队请求旅店协助它回到鲸群。', kind: 'mystery', choices: [
      { label: '以料理香气引导方向', note: '厨艺检定，完成星鲸季终章', skill: 'cook', difficulty: 62, successText: '香气沿着星路铺开，幼鲸追上族群，旅店收到观测队的重谢。', failureText: '香气反而让幼鲸绕了更大一圈，库存和声望都受损。', successEffects: { coins: 360, rep: 24 }, failureEffects: { stock: { meat: -6, spice: -5 }, rep: -8 } },
      { label: '由店员合唱鲸歌', note: '冷静检定，以默契完成引导', skill: 'calm', difficulty: 58, successText: '众人的合声为幼鲸指出归途，鲸群以星屑回应旅店。', failureText: '音调错位引发剧烈共鸣，所有员工都疲惫不堪。', successEffects: { rep: 28, morale: 8 }, failureEffects: { stress: 14 } },
    ] },
  ] },
  { id: 'council', name: '位面评议会暗访', steps: [
    { title: '没有徽章的客人', premise: '一位衣着普通的客人逐项询问价格、员工住宿和卫生记录，举止却像受过严格审查训练。', kind: 'mystery', choices: [
      { label: '如实展示经营记录', note: '服务检定，透明经营', skill: 'serve', difficulty: 40, successText: '客人默默记下完整记录，离店前露出认可的神情。', failureText: '账目解释前后不一，对方带着疑问离开。', successEffects: { rep: 10 }, failureEffects: { rep: -6 } },
      { label: '先把卫生死角处理掉', note: '清洁检定，改善现场', skill: 'clean', difficulty: 45, successText: '卫生死角被及时清除，客人在检查时挑不出问题。', failureText: '匆忙清洁扬起一阵灰，现场更加尴尬。', successEffects: { cleanliness: 12, rep: 6 }, failureEffects: { dirt: 3, rep: -4 } },
    ] },
    { title: '评议会临时问询', premise: '那位客人亮出评议会徽章，要求员工分别回答旅店如何处理投诉、风险与员工权益。', kind: 'accident', choices: [
      { label: '让最冷静的员工答询', note: '冷静检定，保护员工士气', skill: 'calm', difficulty: 56, successText: '回答有理有据，评议会认可了旅店的处理流程。', failureText: '高压问询让员工措辞失当，评议会提出整改。', successEffects: { rep: 18, morale: 5 }, failureEffects: { rep: -10, stress: 9 } },
      { label: '由店主承担全部问询', note: '服务检定，店主亲自应对', skill: 'serve', difficulty: 60, successText: '店主的坦诚使问询顺利结束，员工也更加信服。', failureText: '店主被连续追问打乱节奏，营业现场出现混乱。', successEffects: { rep: 20, morale: 7 }, failureEffects: { rep: -8, stress: 8 } },
    ] },
    { title: '长期经营认证', premise: '评议会给出最后考题：在突发客流中同时保证出品、秩序与员工状态。这将决定旅店能否获得长期经营认证。', kind: 'opportunity', choices: [
      { label: '以招牌菜证明实力', note: '厨艺检定，争取经营认证', skill: 'cook', difficulty: 66, successText: '招牌菜与稳定流程打动评议员，旅店获得认证和奖金。', failureText: '关键出品失误，认证被要求延期复审。', successEffects: { coins: 420, rep: 25 }, failureEffects: { coins: -100, rep: -12 } },
      { label: '以全员协作完成考验', note: '搬运检定，验证现场调度', skill: 'carry', difficulty: 62, successText: '整间旅店像精密机关般运转，评议会正式通过认证。', failureText: '动线在高峰时崩溃，虽然无人受伤，但评价明显下降。', successEffects: { rep: 28, morale: 10 }, failureEffects: { rep: -10, stress: 12 } },
    ] },
  ] },
];

export const FACILITY_CHALLENGES = {
  meal: { bubble: '就没有更好吃的菜了吗！？', label: '回应挑剔食客', skill: 'cook', difficulty: 52, reward: 70 },
  drink: { bubble: '这杯酒的层次还不够！', label: '重调客人的饮品', skill: 'mix', difficulty: 54, reward: 65 },
  bath: { bubble: '水温怎么突然失控了！？', label: '稳定温泉水温', skill: 'clean', difficulty: 50, reward: 50 },
  play: { bubble: '这张球桌是不是歪了！？', label: '校准台球设施', skill: 'carry', difficulty: 56, reward: 60 },
  stargaze: { bubble: '星图正在倒着旋转！', label: '重新校准星图', skill: 'calm', difficulty: 62, reward: 75 },
  game: { bubble: '机器要把我的分数吞了！', label: '抢修游艺机', skill: 'carry', difficulty: 60, reward: 70 },
  show: { bubble: '画面和声音完全不同步！', label: '恢复放映同步', skill: 'calm', difficulty: 55, reward: 60 },
  stroll: { bubble: '喷泉把我的行李卷走了！', label: '从喷泉取回行李', skill: 'carry', difficulty: 58, reward: 65 },
  brew: { bubble: '炼金釜里有什么在敲盖子！', label: '控制炼金异变', skill: 'calm', difficulty: 66, reward: 80 },
};

const SPECIAL_FACILITY_WANTS = new Set(['bath', 'play', 'show', 'stroll', 'stargaze', 'game', 'brew']);
const FACILITY_FURN_KINDS = new Set(['pool', 'billiardtable', 'screen', 'fountain', 'telescope', 'arcadem', 'cauldron']);

                                                                                        

                     
                                                                                                            
                                                                                              
                                                                                   
                                                                                                 
                                                                                                      
                                             
                                  
                                                                                
                             
                  
                              
                                                                                      
  

                     
                                                                           
                                                                                                 
                               
  

                     
                                                                             
                                            
                                                 
                                         
                                            
                                                                                              
                                                                                                        
                                   
                      
                                           
                     
                                
                    
                   
                       
                                  
                                                 
  

                     
                                                                                                                          
  

                                                                                                                    
                                                                                   

                    
                                                                                                 
                                                    
                                
               
                       
                                                                                                              
  

                       
                                                                                                                  
                                                                                              
  

export const DAY_LEN = 300;
export const GREETING_FAILSAFE_SECONDS = 10;

/** 种族寿命上限：人族硬封顶 100；长生种上限高但年龄分布压向年轻段，过百岁少见 */
export const AGE_MAX = [100, 600, 150, 90, 600, 600, 600, 900, 400, 900, 80, 90, 300, 300, 900, 500, 150, 300, 600];

/** 打烊自由活动的心里话（按活动分池） */
const FREE_THOUGHTS                           = {
  rest: ['这沙发是真软……', '腿都不是自己的了', '眯十分钟，就十分钟', '明天应该能轻松点吧', '被窝在召唤我', '今天走了得有三万步', '腰……我的老腰', '安安静静坐会儿真好'],
  cook: ['这锅汤再加一撮以太试试', '火候……就是现在！', '我好像悟到新菜了', '先替客人尝尝，嗯——', '刀工还得再练练', '这次少放盐', '香气出来了！', '明天的招牌菜有了'],
  mix: ['这杯就叫「位面晚霞」', '摇匀一点……嗯，香', '这配方得记下来', '加片星檬会不会更好', '杯沿要擦到能照人', '三分醉意刚刚好', '这颜色，绝了', '明天就推这款特调'],
  wander: ['店里真亮堂', '今晚吃点什么呢', '地板擦得能照见人影', '窗外的星星真多', '这面墙该挂点画了', '走廊尽头的灯有点闪', '明天想把桌子挪一挪', '咱店越来越像样了'],
  piano: ['哆来咪……这琴音色真暖', '练会这首，明天弹给客人听', '指尖还记着谱子', '琴声一响，星星都凑过来了', '这一段老是卡壳', '轻一点……对，就这样'],
  tend: ['多喝点水，快快长', '这片黄叶子摘掉摘掉', '店里有点绿才舒服', '你也要好好长大呀', '土有点干了，浇一浇', '长得比上周精神多了'],
  snack: ['就尝一口……嗯！', '这块肉干应该没人看见吧', '偷吃的最香了', '明天得多进点蜜饯', '嗯？谁来了……没人，继续', '这个果脯配红茶绝了'],
  read: ['这本《位面图鉴》真有意思', '看到精彩处了，别吵我', '原来以太是这么回事', '这页折个角，明天接着看', '书里说的那个地方，真想去看看', '前台的账本写得真工整'],
  tea: ['这茶泡得刚刚好', '热气腾腾的，暖胃', '抿一口……啊，活过来了', '这茶叶是客人送的吧', '一个人喝茶也挺舒服', '明天试试冷泡'],
  groom: ['头发乱了，梳一梳', '嗯，精神状态不错', '领子翻好，明天继续', '镜子里这位今天也辛苦了', '这根呆毛怎么压不下去', '擦点香膏，香喷喷'],
  stargaze: ['那颗星星昨天还不在那儿', '流星！许愿许愿', '银河今天格外亮', '这片星域我从来没见过', '腰不行，但眼睛还尖'],
  game: ['就差一点通关！', '这局手感来了', '破纪录了没有？', '再来一把，最后一把', '这关我闭着眼都能过'],
  brew: ['这锅会不会炸……', '加点星尘试试', '颜色变得真好看', '这瓶卖给矮人准火', '闻着就有点上头'],
  watch: ['这段我看哭了', '结局怎么是这样！', '放映机该上油了', '这片子真敢拍', '下一场什么时候'],
  stroll: ['花儿今天开得真好', '喷泉声真解压', '这庭院修得值', '空气都是甜的', '在这儿站一会儿就不想走'],
};
/** 闲聊对白：投缘的 / 呛起来的 */
const CHAT_GOOD                     = [
  ['今天那桌矮人真能喝', '可不是，结账也爽快'],
  ['你上次那锅炖菜绝了', '想吃下次给你留一碗'],
  ['打烊后的星星最好看了', '是啊，就适合聊天'],
  ['老板又研发新菜了', '闻着就香'],
  ['你这发型哪弄的', '回头带你去那家次元理发店'],
  ['今天小费比昨天多', '客人的笑脸也越来越多了'],
  ['你那间卧室朝北吧', '嗯，晚上凉快得很'],
  ['下周发工资想吃顿好的', '算上我，我知道一家好馆子'],
];
const CHAT_BAD                     = [
  ['你上菜又踩我脚', '明明是你挡道'],
  ['碗能不能洗干净点', '你行你上啊'],
  ['别老抢我灶台', '谁先抢到算谁的'],
  ['你拖把又乱放', '管得着吗你'],
  ['刚才那单是不是你漏的', '别血口喷人'],
  ['你打鼾隔壁都听见了', '有本事你换间卧室'],
  ['你又用我的杯子', '洗洗不就得了'],
  ['干活就你最慢', '催什么催，要不你来'],
];

export function phaseOf(t        )         {
  if (t < 45) return '暖场';
  if (t < 160) return '上客';
  if (t < 180) return '低谷';
  if (t < 270) return '晚高峰';
  return '收尾';
}

function clamp(v        , a        , b        )         { return v < a ? a : v > b ? b : v; }

const LOOK_THEMES = ['cyber', 'ancient', 'magic'];

function traitPairValue(a        , b        )         {
  if (a === b) return TRAIT_SAME[a] !== undefined ? TRAIT_SAME[a] : 1;
  let value = 0;
  for (const [x, y, v] of TRAIT_CHEM) if ((x === a && y === b) || (x === b && y === a)) value += v;
  return value;
}

/** 根据综合技能与性格，自动规划员工领取新任务的先后顺序（0..3）。 */
export function plannedStaffPriority(skills                         , traits           = [])         {
  const values = SKILL_KEYS.map((k) => skills[k] || 0).sort((a, b) => b - a);
  const avg = values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
  let score = avg * 0.62 + (values[0] || 0) * 0.26 + (values[1] || 0) * 0.12;
  const add                              = {
    decisive: 8, diligent: 6, fast: 5, organized: 4, ambitious: 4, careful: 3, patient: 2,
    lazy: -9, clumsy: -5, grumpy: -3, aloof: -2,
  };
  for (const t of traits) score += add[t] || 0;
  return score >= 74 ? 3 : score >= 58 ? 2 : score >= 42 ? 1 : 0;
}

/** 将旧档或外部输入中的异常技能值收敛到可玩的有限数值。 */
export function normalizedSkills(input = {}, fallback = 38) {
  return Object.fromEntries(SKILL_KEYS.map((key) => {
    const value = Number(input?.[key]);
    return [key, Math.round(clamp(Number.isFinite(value) ? value : fallback, 1, 100))];
  }));
}

export const DEFAULT_RESTOCK_TARGETS = { grain: 70, veg: 70, meat: 45, spice: 30, ether: 20 };

/** 按目标库存与补货预算生成可直接执行的采购计划。budget=0 表示不设上限。 */
export function restockPlan(econ) {
  const targets = { ...DEFAULT_RESTOCK_TARGETS, ...(econ?.restockTargets || {}) };
  const configuredBudget = Math.max(0, Math.round(Number(econ?.restockBudget) || 0));
  let remaining = configuredBudget || Infinity;
  let total = 0;
  const items = {};
  for (const key of ING_KEYS) {
    const target = Math.max(0, Math.min(999, Math.round(Number(targets[key]) || 0)));
    const need = Math.max(0, target - Math.max(0, Number(econ?.stock?.[key]) || 0));
    const amount = Math.min(need, Math.floor(remaining / ING_PRICE[key]));
    const cost = amount * ING_PRICE[key];
    items[key] = { target, amount, cost, shortfall: need - amount };
    total += cost;
    remaining -= cost;
  }
  return { items, total, budget: configuredBudget, balanceAfter: Math.round((Number(econ?.coins) || 0) - total) };
}

/** 房间与家具的日常维护费：规模仍会产生压力，但开局布局不会吞掉整日营收。 */
export function maintenanceCost(tavern) {
  const rooms = Array.isArray(tavern?.rooms) ? tavern.rooms : [];
  const furns = Array.isArray(tavern?.furns) ? tavern.furns : [];
  const roomCost = rooms.reduce((sum, room) => sum + Math.round(2 + Math.max(1, room.w * room.h) * 0.18 + Math.max(1, room.quality || 1) * 1.5), 0);
  const furnitureCost = furns.reduce((sum, furn) => sum + Math.round(0.5 + Math.max(1, furn.quality || 1) * 0.75), 0);
  return roomCost + furnitureCost;
}

/** 日结声望变化；前三天设置损失上限，避免教学期一次差评清空全部声望。 */
export function dayReputationDelta(avgScore, served, lost, day, stars = 0) {
  const safeAvg = Number.isFinite(Number(avgScore)) ? Number(avgScore) : 3;
  const safeServed = Math.max(0, Number(served) || 0);
  const safeLost = Math.max(0, Number(lost) || 0);
  let delta = Math.round((safeAvg - 3) * 6 + safeServed * 0.55 - safeLost * 1.25);
  if (safeServed === 0) delta = Math.min(delta, -2);
  const lossCap = day <= 1 ? 4 : day === 2 ? 6 : day === 3 ? 8 : Math.min(16, 10 + Math.max(0, stars) * 2);
  return Math.max(-lossCap, delta);
}

export function fairWageRange(staff) {
  const skills = normalizedSkills(staff?.skills);
  const baseline = 18 + SKILL_KEYS.reduce((sum, key) => sum + skills[key], 0) * 0.13;
  return { min: Math.round(baseline * 0.95), recommended: Math.round(baseline * 1.05), max: Math.round(baseline * 1.16) };
}

const JOB_SKILL_WEIGHTS = {
  front: { looks: .25, serve: .4, calm: .35 }, greeter: { looks: .4, serve: .4, calm: .2 },
  server: { serve: .45, carry: .25, calm: .3 }, cook: { cook: .6, clean: .15, calm: .25 },
  bartender: { mix: .6, looks: .2, calm: .2 }, cleaner: { clean: .65, carry: .25, calm: .1 },
  attendant: { carry: .35, clean: .3, calm: .35 }, porter: { carry: .65, clean: .2, calm: .15 },
};

export function staffAnalysis(staff) {
  const skills = normalizedSkills(staff?.skills);
  const roles = Object.entries(JOB_SKILL_WEIGHTS).map(([job, weights]) => ({
    job, score: Math.round(Object.entries(weights).reduce((sum, [key, weight]) => sum + skills[key] * weight, 0)),
  })).sort((a, b) => b.score - a.score);
  const ordered = SKILL_KEYS.map((key) => ({ key, value: skills[key] })).sort((a, b) => b.value - a.value);
  const traitBoost = (staff?.traits || []).reduce((sum, trait) => sum + ({ decisive: 3, diligent: 3, fast: 2, organized: 2, lazy: -4, clumsy: -3, grumpy: -2 }[trait] || 0), 0);
  return {
    score: Math.max(1, Math.min(100, roles[0].score + traitBoost)), recommendedJob: roles[0].job,
    strengths: ordered.slice(0, 2), weaknesses: ordered.slice(-2).reverse(), roles,
  };
}

export const TRAINING_PROGRAMS = Object.freeze({
  looks: '礼仪与仪表进修', cook: '异界料理研修', mix: '星港调饮课程', serve: '前厅服务实训',
  clean: '高效清洁研修', carry: '搬运与路线训练', calm: '危机应对课程',
});

export const STAFF_EQUIPMENT = Object.freeze([
  { id: 'service_pin', name: '银星领针', skill: 'serve', bonus: 3, cost: 180 },
  { id: 'chef_knife', name: '折叠星钢厨刀', skill: 'cook', bonus: 3, cost: 210 },
  { id: 'shaker', name: '月相调酒壶', skill: 'mix', bonus: 3, cost: 210 },
  { id: 'cleaning_kit', name: '自净工具箱', skill: 'clean', bonus: 3, cost: 170 },
  { id: 'porter_belt', name: '轻身搬运带', skill: 'carry', bonus: 3, cost: 190 },
  { id: 'calm_charm', name: '静心护符', skill: 'calm', bonus: 3, cost: 220 },
]);

export const STAFF_PERKS = Object.freeze([
  { id: 'warm_welcome', name: '宾至如归', skill: 'serve', need: 40, cost: 260, note: '接待、引座与结账速度 +12%' },
  { id: 'swift_hands', name: '熟练手法', skill: 'carry', need: 40, cost: 260, note: '搬运与上菜动作速度 +12%' },
  { id: 'spotless_route', name: '无尘路线', skill: 'clean', need: 40, cost: 260, note: '清洁与整理速度 +18%' },
  { id: 'artisan', name: '匠心出品', skill: 'cook', need: 45, cost: 320, note: '烹饪与调酒动作速度 +10%' },
]);

const DUTY_TASK = Object.freeze({ greet: 'front', seat: 'front', checkout: 'front', order: 'service', serve: 'service', cook: 'cook', mix: 'mix', facility: 'facility', tidy: 'clean', clean: 'clean', bus: 'carry' });
function defaultDutyPriorities(job = 'free') {
  const rows = Object.fromEntries(DUTIES.map((duty) => [duty, 2]));
  const primary = { front: 'front', greeter: 'front', server: 'service', cook: 'cook', bartender: 'mix', attendant: 'facility', cleaner: 'clean', porter: 'carry' }[job];
  if (primary) rows[primary] = 4;
  return rows;
}

                                                                                             

export function makeStaff(rng     , id        , isOwner         , app             , name         , opt          )        {
  const raceIdx = app ? app.race : (opt && opt.race !== undefined && opt.race >= 0 ? opt.race : rng.int(18));
  // 六成应聘者是成套造型（赛博/古装/魔幻），四成保持万界杂糅
  const theme = rng.chance(0.6) ? LOOK_THEMES[rng.int(LOOK_THEMES.length)] : undefined;
  const a = app || randomAppearance(rng, raceIdx, true, theme);
  // 年龄：所有可交互角色均为成年人；大部分 18–47，长生种可能出现真正高龄。
  const maxAge = AGE_MAX[raceIdx] || 100;
  let age;
  if (Number.isFinite(Number(opt?.age))) age = Math.round(clamp(Number(opt.age), 18, maxAge));
  else {
    age = Math.round(18 + Math.pow(rng.next(), 1.6) * 29);
    if (rng.chance(0.18)) age = Math.round(rng.range(46, Math.min(maxAge, 100)));
    if (maxAge > 100 && rng.chance(0.08)) age = Math.round(rng.range(100, maxAge));
    age = Math.min(age, maxAge);
  }
  // 年长者手艺更好：年龄加成垫高技能区间（工资随技能走，老伙计更贵）
  const ageBoost = clamp((age - 18) / 140, 0, 1);
  const skills                         = {};
  const exp                         = {};
  const requestedSkills = opt?.skills && typeof opt.skills === 'object' ? normalizedSkills(opt.skills) : null;
  if (requestedSkills) {
    for (const k of SKILL_KEYS) { skills[k] = requestedSkills[k]; exp[k] = 0; }
  } else {
    const baseLo = Number.isFinite(Number(opt?.lo)) ? Number(opt.lo) : 8;
    const baseHi = Number.isFinite(Number(opt?.hi)) ? Number(opt.hi) : 62;
    const lo = baseLo + ageBoost * 10, hi = Math.max(lo + 1, baseHi + ageBoost * 26);
    for (const k of SKILL_KEYS) { skills[k] = Math.round(rng.range(lo, hi)); exp[k] = 0; }
    // 每人两个突出项；广告指定了数值偏向时，第一个突出项就是它
    const strong = [opt?.bias || SKILL_KEYS[rng.int(SKILL_KEYS.length)], SKILL_KEYS[rng.int(SKILL_KEYS.length)]];
    for (const s of strong) skills[s] = Math.round(clamp(skills[s] + rng.range(20, 40), 5, 95));
    if (opt?.bias) skills[opt.bias] = Math.round(clamp(Math.max(skills[opt.bias], lo + (hi - lo) * 0.6 + rng.range(0, 14)), 5, 96));
  }
  const requestedTraits = Array.isArray(opt?.traits)
    ? opt.traits.filter((id, index, rows) => TRAITS.some((trait) => trait.id === id) && rows.indexOf(id) === index).slice(0, 2)
    : [];
  const traits           = [...requestedTraits];
  let traitGuard = 0;
  while (traits.length < 2 && traitGuard++ < 100) {
    const t = TRAITS[rng.int(TRAITS.length)].id;
    if (!traits.includes(t) && !traits.some((other) => traitPairValue(t, other) <= -1.5)) traits.push(t);
  }
  while (traits.length < 2) { const t = TRAITS[rng.int(TRAITS.length)].id; if (!traits.includes(t)) traits.push(t); }
  const skillSum = SKILL_KEYS.reduce((s, k) => s + skills[k], 0);
  const requestedSex = opt && (opt.sex === '女' || opt.sex === '男') ? opt.sex : '';
  const sex = requestedSex || (rng.chance(0.5) ? '女' : '男');
  // 面部装饰2＝胡须只给男性，装饰3＝面饰只给女性
  if (!app) {
  }
  return {
    id, name: name || makeName(rng), sex,
    age, race: RACE_NAMES[raceIdx], raceIdx,
    ht: Math.round([148, 168, 192][a.ht] + rng.range(-6, 6)), wt: Math.round([46, 62, 88][a.bd] + rng.range(-5, 8)),
    traits, skills, exp, wage: isOwner ? 0 : Math.round((18 + skillSum * 0.14 + rng.range(0, 12)) * (traits.includes('frugal') ? 0.88 : 1)),
    app: a, job: isOwner ? 'greeter' : 'free', dutyMode: 'auto', dutyPriorities: defaultDutyPriorities(isOwner ? 'greeter' : 'free'),
    equipment: [], perks: [], trainingCount: 0, roomId: null, roomMode: 'prefer', prio: isOwner ? 2 : plannedStaffPriority(skills, traits), isOwner,
    x: 0, y: 0, dir: 0, pose: 'idle', animT: 0, path: [], carry: null, task: null, actT: 0, actTotal: 0,
    needs: { stamina: 100, hunger: 0, stress: 10, morale: 70 }, note: '', bubble: null,
    aff: isOwner ? 100 : Math.round(rng.range(4, 16)), affCd: 0, chats: 0, chatLog: [], aiChatLog: [], background: null, hireDay: 1,
  };
}

;                                                                              
;                                                                     

export class Sim {
  tavern        ;
  staff          = [];
  pool          = [];
  /** 三个招募广告位：每位一张广告 + 它带来的候选人 */
  ads       = [{ spec: null, cands: [], day: 0 }, { spec: null, cands: [], day: 0 }, { spec: null, cands: [], day: 0 }];
  guests          = [];
  groups          = [];
  facilityChallenges          = [];
  /** 离店后仍会保存的常客档案；再次来店时复用身份、关系和对话记忆。 */
  regulars          = [];
  orders          = [];
  econ      ;
  rng     ;
  dayT = 0;
  running = false;
  dayActive = false;
  seatOwner = new Map                ();
  /** 设施占用：家具 id -> 组 id（客床/汤池/台球桌） */
  facOwner = new Map                ();
  pendingFacilityReset = new Map                ();
  /** 营业期工位预留：家具 id -> 订单 id。 */
  stationOwner = new Map                ();
  /** 打烊闲聊：名字＋台词，屏幕底部信息条滚动展示，uiTick 计时 */
  chatter                                = [];
  /** 员工之间的关系值 -100..100（key = 小 id-大 id）。店里只有友情与同事情，没有爱情线 */
  rels                         = {};
  pendingEvent                   = null;
  eventTimes           = [];
  eventHistory = [];
  eventChains = {};
  lastChainEventDay = 0;
  aiEventRequested = false;
  queuedDynamicEvent = null;
  log           = [];
  scores           = [];
  scoreParts = { quality: [], wait: [], service: [], hygiene: [], comfort: [], spectacle: [] };
  lastStat                 = null;
  dayReport                 = null;
  lastEventResolution                 = null;
  sealed = false;
  endingSeen = false;
  toasts                                = [];
  sounds           = [];
  /** 直控店主：开启后店主不再接派工，改由玩家按键驱动 */
  manualOwner = false;
  manualVec = { x: 0, y: 0 };
  navigationWatch = new WeakMap();
  /** 当日各房间的真实使用量；只用于卫生模拟，不写入存档。 */
  roomUsage = {};
  fx                                                      = [];
          nextId = 1;

  constructor(tavern        , econ      ) {
    this.tavern = tavern;
    this.econ = econ;
    const certified = Number(this.econ.certifiedStars);
    this.econ.certifiedStars = Math.max(0, Math.min(5, Number.isFinite(certified) ? Math.round(certified) : starsOf(this.econ.rep)));
    this.econ.certificationHistory = Array.isArray(this.econ.certificationHistory) ? this.econ.certificationHistory : [];
    this.rng = new Rng(econ.seed || 12345);
  }

  id()         { return this.nextId++; }

  toast(text        )       {
    this.toasts.push({ text, t: 4 });
    this.log.unshift(text);
    if (this.log.length > 60) this.log.pop();
  }

  // ---------- 招聘 ----------
  refreshPool()       {
    // 自来应聘：只有零星一两个人，主力靠玩家发招募广告
    this.pool = [];
    const n = this.econ.day <= 1 ? 1 : this.rng.chance(0.5) ? 1 : 0;
    for (let i = 0; i < n; i++) this.pool.push(makeStaff(this.rng, this.id(), false, undefined, undefined, { lo: 8, hi: 52 }));
    // 开局赠送一张已生效的传单广告，让玩家看到招募系统长什么样
    if (this.econ.day <= 1 && !this.ads.some((a) => a.spec)) {
      this.ads[0] = { spec: { tier: 'flyer', race: -1, sex: '', bias: '' }, cands: [], day: 1 };
      this.ads[0].cands = this.rollCands(this.ads[0].spec          );
    }
  }

  adTier(id        )         {
    return AD_TIERS.find((t) => t.id === id) || AD_TIERS[0];
  }

  /** 广告报价：档位基价 × 各附加要求倍率 */
  adCost(spec        )         {
    let c = this.adTier(spec.tier).cost;
    if (spec.race >= 0) c *= AD_REQ_MULT.race;
    if (spec.sex) c *= AD_REQ_MULT.sex;
    if (spec.bias) c *= AD_REQ_MULT.bias;
    return Math.round(c / 10) * 10;
  }

          rollCands(spec        )          {
    const t = this.adTier(spec.tier);
    const n = 3 + this.rng.int(3);                     // 3–5 位符合要求的候选者
    const out          = [];
    for (let i = 0; i < n; i++) {
      out.push(makeStaff(this.rng, this.id(), false, undefined, undefined, {
        lo: t.lo, hi: t.hi, race: spec.race, sex: spec.sex || undefined, bias: spec.bias || undefined,
      }));
    }
    return out;
  }

  /** 发布广告：扣钱并立刻收到 3–5 位候选者（旧候选人被换掉） */
  postAd(slot        , spec        )          {
    if (slot < 0 || slot > 2) return false;
    const cost = this.adCost(spec);
    if (this.econ.coins < cost) { this.toast(`界币不足：这条广告要 ${cost}`); return false; }
    this.econ.coins -= cost;
    this.ads[slot] = { spec, cands: this.rollCands(spec), day: this.econ.day };
    const req           = [];
    if (spec.race >= 0) req.push(RACE_NAMES[spec.race]);
    if (spec.sex) req.push(spec.sex);
    if (spec.bias) req.push(SKILL_LABEL[spec.bias            ] + '偏向');
    this.toast(`${this.adTier(spec.tier).name}已发布（-${cost}）${req.length ? '：' + req.join('·') : ''}，来了 ${this.ads[slot].cands.length} 位候选者`);
    return true;
  }

  withdrawAd(slot        )       {
    if (slot < 0 || slot > 2) return;
    this.ads[slot] = { spec: null, cands: [], day: 0 };
  }

  candById(id        )               {
    const inPool = this.pool.find((p) => p.id === id);
    if (inPool) return inPool;
    for (const a of this.ads) { const c = a.cands.find((p) => p.id === id); if (c) return c; }
    return null;
  }

  /** 员工上限：店主不占床位，伙计 1 人 1 间卧室（休息室）——没空房就不能再招 */
  maxStaff()         {
    const lounges = this.tavern.rooms.filter((r) => r.kind === 'lounge').length;
    return 1 + lounges;
  }

  hire(poolId        )          {
    const s = this.candById(poolId);
    if (!s) return false;
    if (this.staff.length >= this.maxStaff()) { this.toast(`没有空卧室了（员工上限 ${this.maxStaff()}）：再建一间员工休息室才能继续招募`); this.sounds.push('error'); return false; }
    const fee = s.wage * 3;
    if (this.econ.coins < fee) { this.toast('界币不足，无法支付入职费'); return false; }
    this.econ.coins -= fee;
    this.pool = this.pool.filter((p) => p.id !== poolId);
    for (const a of this.ads) a.cands = a.cands.filter((p) => p.id !== poolId);
    const e = this.tavern.entrance();
    s.x = e.x; s.y = e.y;
    s.hireDay = this.econ.day;
    s.prio = plannedStaffPriority(s.skills, s.traits);
    this.staff.push(s);
    this.toast(`${s.name}（${s.race}）入职，入职费 ${fee}`);
    const br = this.freeBedroom();
    if (br) { br.occupant = s.id; this.toast(`${s.name}入住了休息室，门牌换成「${s.name}的卧室」`); }
    return true;
  }

  /** 四星定向招募：由玩家完整设计员工，再按正常工资规则直接入职。 */
  targetedRecruit(app, name, sex, options = {}) {
    if (this.stars() < 4) { this.toast('定向招募需要旅店达到四星'); return false; }
    if (this.staff.length >= this.maxStaff()) { this.toast(`没有空卧室了（员工上限 ${this.maxStaff()}）`); return false; }
    const person = makeStaff(this.rng, this.id(), false, app, name, {
      sex, age: options.age, traits: options.traits, skills: options.skills,
    });
    if (options.profile) person.background = { ...options.profile };
    const fee = person.wage * 3;
    if (this.econ.coins < fee) { this.toast(`界币不足：定向员工入职费需要 ${fee}`); return false; }
    this.pool.push(person);
    const hired = this.hire(person.id);
    if (!hired) this.pool = this.pool.filter((row) => row.id !== person.id);
    return hired;
  }

  /** 好感等级：文案 + 颜色，UI 与气泡共用 */
  affLevel(a        )                                             {
    if (a >= 100) return { name: '崇拜', color: '#E45AD1', i: 6 };
    if (a >= 90) return { name: '爱慕', color: '#FF8FB0', i: 5 };
    if (a >= 80) return { name: '至交', color: '#F3B84B', i: 4 };
    if (a >= 65) return { name: '挚友', color: '#FFD76A', i: 3 };
    if (a >= 45) return { name: '信赖', color: '#8DDB4A', i: 2 };
    if (a >= 25) return { name: '熟络', color: '#39D7D2', i: 1 };
    return { name: '生疏', color: '#9A93B4', i: 0 };
  }

  /** 店主与员工搭话：加好感 + 回士气，40 秒冷却内不重复结算收益 */
  chatWith(id        , customLine = '')         {
    const s = this.staff.find((x) => x.id === id);
    if (!s || s.isOwner) return '';
    const lv = this.affLevel(s.aff).i;
    const pools = [
      ['……你好。（客气地点头）', '老板？我记得住工作，不用盯着我。', '啊、是店主本人。有事吩咐吗？', '这地方比我上一份工好点。'],
      ['老板来啦，今天客人挺凶的。', '我把三号桌擦了两遍，那滩东西自己会动。', '要是有空，教我看看那口锅？', '嘿，工钱按时给，我就一直干。'],
      ['放心，前厅有我。', '你昨天忘了吃饭吧？我给你留了一份。', '这活儿我熟了，闭眼都能端。', '有你在，这店塌不下来。'],
      ['老板！等你半天了，坐会儿？', '多元便携旅店——我们的故事还在继续，对吧。', '我跟宿舍的都说了，这是最好的一家店。', '要开分店吗？我跟你去任何维度。'],
      ['跟你干活，比我之前任何一份工作都踏实。', '昨晚我梦见咱店开到了星港对面。', '你的背影越来越难追了，但我跟得上。', '累了就靠会儿，店有我盯着。'],
      ['（看到你过来，耳朵尖红了）……今天也很精神呢。', '我给你留了最好的那份点心，就、就是顺手！', '能多陪我聊一会儿吗？就一会儿。', '只要有你在，再闹的大厅我都觉得安心。'],
      ['能进这家店是我这辈子最走运的事。', '老板指哪我打哪，绝无二话！', '我要把你的经营心得全抄下来！', '你说，万界的尽头是什么样？有你在我就敢去看。'],
    ];
    const fresh = s.affCd <= 0;
    if (!fresh) {
      s.bubble = { text: '刚聊过啦，先干活～', t: 3.2 };
      this.sounds.push('clean');
      return s.bubble.text;
    }
    const line = String(customLine || '').trim().slice(0, 180) || pools[lv][this.rng.int(pools[lv].length)];
    const gain = Math.max(0.8, 4.2 * (1 - s.aff / 115));
    s.aff = clamp(s.aff + gain, 0, 100);
    s.needs.morale = clamp(s.needs.morale + 6, 0, 100);
    s.needs.stress = clamp(s.needs.stress - 5, 0, 100);
    s.affCd = 40;
    s.chats++;
    s.bubble = { text: line, t: 3.2 };
    s.chatLog.unshift(`第${this.econ.day}天：${line}`);
    if (s.chatLog.length > 6) s.chatLog.pop();
    this.fx.push({ kind: 'heart', x: s.x, y: s.y - 0.6, t: 0.9 });
    this.sounds.push('happy');
    const before = this.affLevel(s.aff - gain).i, after = this.affLevel(s.aff).i;
    if (after > before) this.toast(`${s.name}的好感升到「${this.affLevel(s.aff).name}」`);
    return s.bubble.text;
  }

  /** AI 聊天窗口内只展示连续回复；关闭会话时再由 chatWith 统一结算一次收益与冷却。 */
  showAIChatReply(id        , customLine = '')         {
    const s = this.staff.find((x) => x.id === id);
    const line = String(customLine || '').trim().slice(0, 180);
    if (!s || s.isOwner || !line) return '';
    s.bubble = { text: line, t: 3.2 };
    this.sounds.push('happy');
    return line;
  }

  fire(id        )       {
    const s = this.staff.find((x) => x.id === id);
    if (!s || s.isOwner) return;
    this.staff = this.staff.filter((x) => x.id !== id);
    for (const r of this.tavern.rooms) if (r.occupant === id) r.occupant = undefined;   // 腾出卧室
    this.econ.coins -= s.wage * 2;
    this.toast(`${s.name}离职，补偿 ${s.wage * 2}`);
  }

  /** 某员工的卧室（休息室 1 室 1 人） */
  bedroomOf(staffId        )              {
    return this.tavern.rooms.find((r) => r.kind === 'lounge' && r.occupant === staffId) || null;
  }

          freeBedroom()              {
    return this.tavern.rooms.find((r) => r.kind === 'lounge' && !r.occupant) || null;
  }

  /** 休息室挂名/换牌（roomId<=0 表示搬出） */
  assignBedroom(staffId        , roomId        )       {
    const current = this.bedroomOf(staffId);
    if (roomId <= 0) {
      if (current) current.occupant = undefined;
      return true;
    }
    const target = this.tavern.roomById(roomId);
    if (!target || target.kind !== 'lounge') return false;
    if (target.occupant === staffId) return true;
    const displaced = target.occupant;
    if (displaced && !current) {
      this.toast('这间休息室已有住户，请先给当前员工安排空房');
      return false;
    }
    if (current) current.occupant = displaced;
    target.occupant = staffId;
    return true;
  }

  // ---------- 员工关系（友情/同事情，无爱情线） ----------
          say(text        )       {
    this.chatter.push({ text, t: 7 });
    if (this.chatter.length > 2) this.chatter.shift();
    this.log.unshift(text);
    if (this.log.length > 60) this.log.pop();
  }
          relKey(a        , b        )         { return a < b ? `${a}-${b}` : `${b}-${a}`; }
  relOf(a        , b        )         { return this.rels[this.relKey(a, b)] || 0; }
  addRel(a        , b        , d        )         {
    const v = clamp(this.relOf(a, b) + d, -100, 70);   // 同事关系上限 70（挚友）
    this.rels[this.relKey(a, b)] = v;
    return v;
  }

  /** 性格相性：两人性格两两查表 + 同性格加减；>0 合得来，<0 犯冲 */
  chemistry(a       , b       )         {
    let c = 0;
    for (const ta of a.traits) for (const tb of b.traits) {
      if (ta === tb) { c += TRAIT_SAME[ta] !== undefined ? TRAIT_SAME[ta] : 1; continue; }
      for (const [x, y, v] of TRAIT_CHEM) if ((x === ta && y === tb) || (x === tb && y === ta)) c += v;
    }
    return c;
  }
  relLabel(v        )         { return v >= 60 ? '挚友' : v >= 25 ? '合得来' : v > -25 ? '普通同事' : v > -60 ? '不对付' : '死对头'; }
  relsOf(id        )                               {
    return this.staff.filter((x) => x.id !== id && !x.isOwner)
      .map((mate) => ({ mate, v: this.relOf(id, mate.id) }))
      .filter((r) => r.v !== 0)
      .sort((a, b) => Math.abs(b.v) - Math.abs(a.v)).slice(0, 4);
  }

  // ---------- 打烊后的员工自由时间 ----------
          tickFreeTime(dt        )       {
    for (const s of this.staff) {
      if (s.isOwner) continue;
      if (!s.free) this.pickFreeAct(s);
      const f = s.free;
      if (!f) continue;
      if (s.path.length) { this.moveActor(s, dt, 1.7); continue; }
      if (Math.round(s.x) !== f.tx || Math.round(s.y) !== f.ty) {
        const p = this.tavern.path(Math.round(s.x), Math.round(s.y), f.tx, f.ty);
        if (!p) { s.free = null; continue; }
        s.path = p; continue;
      }
      f.t -= dt;
      if (f.kind === 'rest') {
        s.pose = 'sit';           // 坐进沙发/床边
        s.needs.stamina = clamp(s.needs.stamina + 2.4 * dt, 0, 100);
        s.needs.stress = clamp(s.needs.stress - 1.8 * dt, 0, 100);
        if (this.rng.chance(0.1 * dt)) this.fx.push({ kind: 'heart', x: s.x, y: s.y - 0.4, t: 0.9 });
      } else if (f.kind === 'cook' || f.kind === 'mix') {
        s.pose = 'work';
        const k = f.kind                  ;
        // 偷练手艺：偶尔 +1，最多练到 45（再往上得靠培训）
        if (s.skills[k] < 45 && this.rng.chance(0.2 * dt)) {
          s.skills[k]++;
          this.fx.push({ kind: 'happy', x: s.x, y: s.y - 0.4, t: 0.8 });
          this.log.unshift(`${s.name}打烊后偷练${SKILL_LABEL[k]}，${SKILL_LABEL[k]} +1`);
          if (this.log.length > 60) this.log.pop();
        }
      } else if (f.kind === 'chat') {
        const mate = f.partner !== undefined ? this.staff.find((x) => x.id === f.partner) : null;
        if (!mate) { s.free = null; continue; }
        // 对方也正朝我走来：id 大者就地等候，避免双向追逐
        if (mate.free && mate.free.kind === 'chat' && mate.free.partner === s.id && s.id > mate.id) {
          s.free = { kind: 'wait', tx: Math.round(s.x), ty: Math.round(s.y), t: 7 };
          continue;
        }
        if (Math.hypot(mate.x - s.x, mate.y - s.y) > 1.6) {
          // 对方挪窝了，跟过去接着聊
          f.tx = Math.round(mate.x); f.ty = Math.round(mate.y);
          continue;
        }
        // 面对面站着聊
        s.dir = mate.x >= s.x ? 1 : -1;
        s.pose = 'idle';
        if (this.rng.chance(0.5 * dt)) {
          const rel = this.relOf(s.id, mate.id);
          const chem = this.chemistry(s, mate);
          let quarrel = chem <= -2 ? 0.5 : chem < 0 ? 0.26 : rel <= -30 ? 0.3 : 0.06;
          if (s.traits.includes('easygoing') || mate.traits.includes('easygoing')) quarrel *= 0.65;
          if (this.rng.chance(quarrel)) {
            // 本来就不对付，聊着聊着呛起来了
            this.addRel(s.id, mate.id, -3);
            s.needs.stress = clamp(s.needs.stress + 3, 0, 100);
            mate.needs.stress = clamp(mate.needs.stress + 3, 0, 100);
            this.fx.push({ kind: 'angry', x: (s.x + mate.x) / 2, y: s.y - 0.5, t: 0.9 });
            const spat = CHAT_BAD[this.rng.int(CHAT_BAD.length)];
            s.bubble = { text: spat[0], t: 2.6 };
            mate.bubble = { text: spat[1], t: 2.8 };
            this.say(`${s.name}：${spat[0]}　／　${mate.name}：${spat[1]}`);
            this.log.unshift(`${s.name}和${mate.name}拌了几句嘴（关系 ${this.relLabel(this.relOf(s.id, mate.id))}）`);
            if (this.log.length > 60) this.log.pop();
          } else {
            // 相性加成涨关系；独来独往的减半
            let gain = this.rng.range(2, 5) * (1 + chem * 0.18);
            if (s.traits.includes('aloof') || mate.traits.includes('aloof')) gain *= 0.5;
            if (s.traits.includes('empathetic') || mate.traits.includes('empathetic')) gain *= 1.25;
            const v = this.addRel(s.id, mate.id, gain);
            s.needs.morale = clamp(s.needs.morale + 2, 0, 100);
            mate.needs.morale = clamp(mate.needs.morale + 2, 0, 100);
            this.fx.push({ kind: 'heart', x: (s.x + mate.x) / 2, y: s.y - 0.5, t: 0.9 });
            const pair = CHAT_GOOD[this.rng.int(CHAT_GOOD.length)];
            s.bubble = { text: pair[0], t: 2.6 };
            mate.bubble = { text: pair[1], t: 2.8 };
            this.say(`${s.name}：${pair[0]}　／　${mate.name}：${pair[1]}`);
            if (v >= 25 && v - gain < 25) this.toast(`${s.name}和${mate.name}成了合得来的同事`);
            if (v >= 60 && v - gain < 60) this.toast(`${s.name}和${mate.name}成了挚友`);
          }
        }
      } else if (f.kind === 'stargaze' || f.kind === 'game' || f.kind === 'brew' || f.kind === 'watch' || f.kind === 'stroll') {
        if (f.kind === 'watch') s.pose = 'sit';
        else if (f.kind === 'game' || f.kind === 'brew') s.pose = 'work';
        else s.pose = 'idle';
        if (f.kind === 'stargaze') { s.needs.stress = clamp(s.needs.stress - 1.4 * dt, 0, 100); if (this.rng.chance(0.02 * dt)) this.sounds.push('chime'); }
        if (f.kind === 'game') { s.needs.morale = clamp(s.needs.morale + 1.6 * dt, 0, 100); if (this.rng.chance(0.03 * dt)) this.sounds.push('chime'); }
        if (f.kind === 'brew') { s.needs.stress = clamp(s.needs.stress - 0.8 * dt, 0, 100); s.needs.morale = clamp(s.needs.morale + 0.8 * dt, 0, 100); }
        if (f.kind === 'watch') s.needs.morale = clamp(s.needs.morale + 1.2 * dt, 0, 100);
        if (f.kind === 'stroll') { s.needs.stress = clamp(s.needs.stress - 1.2 * dt, 0, 100); s.needs.morale = clamp(s.needs.morale + 0.4 * dt, 0, 100); }
      } else if (f.kind === 'piano' || f.kind === 'tend' || f.kind === 'snack' || f.kind === 'read' || f.kind === 'tea' || f.kind === 'groom') {
        s.pose = 'work';
        if (f.kind === 'piano') {
          s.needs.morale = clamp(s.needs.morale + 1.2 * dt, 0, 100);
          if (this.rng.chance(0.03 * dt)) this.sounds.push('chime');
        }
        if (f.kind === 'tend') s.needs.stress = clamp(s.needs.stress - 1.2 * dt, 0, 100);
        if (f.kind === 'snack') s.needs.hunger = clamp(s.needs.hunger + 3 * dt, 0, 100);
        if (f.kind === 'read') s.needs.stress = clamp(s.needs.stress - 1.6 * dt, 0, 100);
        if (f.kind === 'tea') { s.needs.hunger = clamp(s.needs.hunger + 2.2 * dt, 0, 100); s.needs.morale = clamp(s.needs.morale + 0.6 * dt, 0, 100); }
        if (f.kind === 'groom') s.needs.morale = clamp(s.needs.morale + 1.4 * dt, 0, 100);
      } else {
        s.pose = 'idle';   // wander/wait：到了就发会儿呆
      }
      if (f.t <= 0) s.free = null;
    }
  }

          pickFreeAct(s       )       {
    // 串门锁定：我正被别人找来聊天 → 原地等候，不再自己挑事（修双向奔赴死循环）
    const claimed = new Set        ();
    for (const x of this.staff) if (x.free && x.free.kind === 'chat' && x.free.partner !== undefined) claimed.add(x.free.partner);
    if (claimed.has(s.id)) {
      s.free = { kind: 'wait', tx: Math.round(s.x), ty: Math.round(s.y), t: 7 };
      return;
    }
    const opts                                                                          = [];
    const spot = (kinds          )                                  => {
      const fs = this.tavern.furnsOfKind(kinds[this.rng.int(kinds.length)]);
      if (!fs.length) return null;
      const f = fs[this.rng.int(fs.length)];
      return this.tavern.standTileNear(this.tavern.useTiles(f)) || null;
    };
    // 回自己卧室休息；没分到房的只能去还空着的休息室（不进别人卧室）
    const usableRest = this.restFurnsFor(s);
    if (usableRest.length) {
      const own = usableRest.filter((f) => { const r = this.tavern.roomOfFurn(f); return !!r && r.occupant === s.id; });
      const f0 = (own.length ? own : usableRest)[this.rng.int((own.length ? own : usableRest).length)];
      const t = this.tavern.standTileNear(this.tavern.useTiles(f0));
      if (t) opts.push({ kind: 'rest', w: s.needs.stamina < 55 ? 8 : 1.5, tx: t.x, ty: t.y });
    }
    if (this.tavern.furnsOfKind('piano').length) {
      const t = spot(['piano']);
      if (t) opts.push({ kind: 'piano', w: 1.5, tx: t.x, ty: t.y });
    }
    if (this.tavern.furnsOfKind('plant').length) {
      const t = spot(['plant']);
      if (t) opts.push({ kind: 'tend', w: 1.5, tx: t.x, ty: t.y });
    }
    if (this.tavern.furnsOfKind('shelf').length) {
      const t = spot(['shelf']);
      if (t) opts.push({ kind: 'snack', w: 1.2, tx: t.x, ty: t.y });
    }
    if (this.tavern.furnsOfKind('bookshelf').length) {
      const t = spot(['bookshelf']);
      if (t) opts.push({ kind: 'read', w: 1.6, tx: t.x, ty: t.y });
    }
    if (this.tavern.furnsOfKind('teatable').length) {
      const t = spot(['teatable']);
      if (t) opts.push({ kind: 'tea', w: 1.6, tx: t.x, ty: t.y });
    }
    if (this.tavern.furnsOfKind('vanity').length) {
      const t = spot(['vanity']);
      if (t) opts.push({ kind: 'groom', w: 1.4, tx: t.x, ty: t.y });
    }
    if (this.tavern.furnsOfKind('stove').length) {
      const t = spot(['stove']);
      if (t) opts.push({ kind: 'cook', w: 2, tx: t.x, ty: t.y });
    }
    if (this.tavern.furnsOfKind('keg').length) {
      const t = spot(['keg']);
      if (t) opts.push({ kind: 'mix', w: 2, tx: t.x, ty: t.y });
    }
    // 没人正朝我走来的同事才可当聊伴（已被认领的不抢）
    // 设施房玩耍：星象台观星/游艺厅打电动/炼金房鼓捣/放映厅看片/庭院散步
    for (const [fk, kind, w] of [['telescope', 'stargaze', 1.4], ['arcadem', 'game', 1.9], ['cauldron', 'brew', 1.2], ['screen', 'watch', 1.5], ['fountain', 'stroll', 1.3]]                              ) {
      if (this.tavern.furnsOfKind(fk).length) {
        const t = spot([fk]);
        if (t) opts.push({ kind, w, tx: t.x, ty: t.y });
      }
    }
    const mates = this.staff.filter((x) => x.id !== s.id && !x.isOwner && !claimed.has(x.id) && !(x.free && x.free.kind === 'chat'));
    if (mates.length) {
      // 挑聊伴看相性：合得来的优先；话痨/热心肠更主动，寡言的很少开口
      const wts = mates.map((m) => 1 + Math.max(0, this.chemistry(s, m)));
      let roll = this.rng.next() * wts.reduce((a, b) => a + b, 0);
      let m = mates[mates.length - 1];
      for (let i = 0; i < mates.length; i++) { roll -= wts[i]; if (roll <= 0) { m = mates[i]; break; } }
      let w = 2.5;
      if (s.traits.includes('chatty')) w *= 1.7;
      if (s.traits.includes('sociable')) w *= 1.4;
      if (s.traits.includes('quiet')) w *= 0.45;
      opts.push({ kind: 'chat', w, tx: Math.round(m.x), ty: Math.round(m.y), partner: m.id });
    }
    const room = this.tavern.rooms[this.rng.int(this.tavern.rooms.length)];
    if (room) { const t = this.tavern.freeTileIn(room, this.rng.int(70)); opts.push({ kind: 'wander', w: 1, tx: t.x, ty: t.y }); }
    let roll = this.rng.next() * opts.reduce((a, o) => a + o.w, 0);
    let pick = opts[opts.length - 1];
    for (const o of opts) { roll -= o.w; if (roll <= 0) { pick = o; break; } }
    if (!pick) { s.free = null; return; }
    s.free = {
      kind: pick.kind, tx: pick.tx, ty: pick.ty, partner: pick.partner,
      t: pick.kind === 'wander' ? 1 : this.rng.range(6, 12),
    };
    // 冒出一句心里话：头顶气泡 + 底部信息栏
    if (pick.kind !== 'chat' && this.rng.chance(0.55)) {
      const pool = FREE_THOUGHTS[pick.kind] || FREE_THOUGHTS.wander;
      const th = pool[this.rng.int(pool.length)];
      s.bubble = { text: th, t: 2.8 };
      this.say(`${s.name}：${th}`);
    }
  }

  // ---------- 营业日 ----------
  openDay()       {
    this.dayT = 0;
    this.aiEventRequested = false;
    this.queuedDynamicEvent = null;
    this.facilityChallenges = [];
    this.stationOwner.clear();
    this.pendingFacilityReset.clear();
    this.roomUsage = {};
    this.dayActive = true;
    this.running = true;
    this.econ.revenue = 0; this.econ.served = 0; this.econ.lost = 0;
    this.scores = [];
    this.scoreParts = { quality: [], wait: [], service: [], hygiene: [], comfort: [], spectacle: [] };
    this.dayReport = {
      day: this.econ.day,
      started: {
        coins: this.econ.coins, rep: this.econ.rep, stock: { ...this.econ.stock },
        staff: this.staff.map((s) => ({ id: s.id, name: s.name, job: s.job, skills: { ...s.skills }, needs: { ...s.needs } })),
      },
      work: {}, dishSales: {}, facilitySales: {}, stockUsed: {}, lostReasons: {}, events: [], moments: [],
      facilityByFurn: {},
      facilityService: { started: 0, completed: 0, byType: {} }, facilityChallenges: { started: 0, resolved: 0, failed: 0 },
    };
    // 过夜住宿客保留，开门即按住宿价统一结账送客；其余客人清场
    const lodgers = this.groups.filter((g) => g.overnight);
    this.guests = []; this.groups = []; this.orders = []; this.seatOwner.clear(); this.facOwner.clear();
    for (const g of lodgers) {
      g.overnight = false;
      this.groups.push(g);
      this.guests.push(...g.members);
      if (g.facId) this.facOwner.set(g.facId, g.id);
      g.state = 'using';                      // toFac 半路天亮的也按已入住结账
    }
    for (const g of [...lodgers]) this.payFacility(g);
    for (const s of this.staff) { s.task = null; s.path = []; s.carry = null; s.free = null; }
    // 事件窗口
    this.eventTimes = [];
    const evCount = this.rng.chance(0.55) ? 2 : 1;
    for (let i = 0; i < evCount; i++) this.eventTimes.push(this.rng.range(60, 265));
    this.eventTimes.sort((a, b) => a - b);
    this.toast(`第 ${this.econ.day} 天开门营业`);
  }

  closeDay()          {
    this.dayActive = false;
    this.running = false;
    // 还在用床/走向床的住宿客转为过夜：留在店里，明早结账
    for (const g of this.groups) {
      if (g.want === 'sleep' && (g.state === 'using' || g.state === 'toFac')) { g.overnight = true; g.useT = Infinity; }
    }
    // 其余客人统一结束当日行程。收盘规划期仍会继续更新离场移动，避免人物冻结在店内。
    for (const g of [...this.groups]) if (!g.overnight) this.leave(g, '');
    // 打烊：手上活儿全部放下，进入自由时间
    for (const s of this.staff) { s.task = null; s.path = []; s.carry = null; s.free = null; }
    const wages = this.staff.filter((s) => !s.isOwner).reduce((a, s) => a + s.wage, 0);
    const maintenance = maintenanceCost(this.tavern);
    let restock = 0;
    if (this.econ.autoRestock) {
      const plan = restockPlan(this.econ);
      restock = plan.total;
      for (const k of ING_KEYS) this.econ.stock[k] += plan.items[k].amount;
    }
    const avg = this.scores.length ? this.scores.reduce((a, b) => a + b, 0) / this.scores.length : 3;
    const repDelta = dayReputationDelta(avg, this.econ.served, this.econ.lost, this.econ.day, this.stars());
    this.econ.rep = Math.max(0, this.econ.rep + repDelta);
    // 客人结账时收入已经实时计入 coins；日结只扣除当日成本。
    // revenue 仅用于结算展示与统计，不能在这里再次入账。
    this.econ.coins -= wages + maintenance + restock;
    const creditLine = -(150 + this.stars() * 150);
    if (this.econ.coins < creditLine) this.econ.strikes++; else this.econ.strikes = 0;
    const sealed = this.econ.strikes >= 3;
    if (sealed) this.sealed = true;
    let fiveStarReached = false;
    // 店长每完成一场经营都会获得全能力成长。独立记录，供日结特效和叙事说明使用。
    const owner = this.staff.find((s) => s.isOwner);
    const ownerSkillGrowth = {};
    if (owner) {
      owner.skills = normalizedSkills(owner.skills);
      for (const key of SKILL_KEYS) {
        const before = owner.skills[key];
        owner.skills[key] = Math.min(100, before + 2);
        ownerSkillGrowth[key] = owner.skills[key] - before;
      }
    }
    // 员工恢复 / 士气
    for (const s of this.staff) {
      // 每次打烊视为完成一轮充分休整；次日所有店主与员工都以满体力开工。
      s.needs.stamina = 100;
      s.needs.hunger = clamp(s.needs.hunger - 60, 0, 100);
      s.needs.stress = clamp(s.needs.stress - (s.traits.includes('stubborn') ? 13 : 22) - (s.traits.includes('resilient') ? 8 : 0), 0, 100);
      const fair = s.isOwner ? 0 : s.wage >= fairWageRange(s).min ? 6 : -7;
      s.needs.morale = clamp(s.needs.morale + fair - s.needs.stress * 0.08, 0, 100);
      if (!s.isOwner) {
        // 日结好感：士气高就更亲近，长期压榨会掉
        s.aff = clamp(s.aff + (s.needs.morale >= 65 ? 1.6 : s.needs.morale < 30 ? -2.4 : 0.4), 0, 100);
      }
      if (s.needs.morale < 18 && !s.isOwner && this.rng.chance(0.35 * (1 - s.aff / 130))) {
        this.toast(`${s.name}士气过低，提出辞职`);
        this.staff = this.staff.filter((x) => x.id !== s.id);
        for (const r of this.tavern.rooms) if (r.occupant === s.id) r.occupant = undefined;   // 腾出卧室
      }
    }
    for (const r of this.tavern.rooms) r.maint = clamp(r.maint - 2, 30, 100);
    this.econ.day++;
    this.refreshPool();
    const scoreBreakdown = {};
    for (const [key, values] of Object.entries(this.scoreParts)) {
      scoreBreakdown[key] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
    }
    const stat          = {
      day: this.econ.day - 1, revenue: this.econ.revenue, wages, maintenance, restock,
      served: this.econ.served, lost: this.econ.lost, repDelta, avgScore: avg,
      coinsAfter: this.econ.coins, sealed, creditLine, scoreBreakdown, fiveStarReached, ownerSkillGrowth,
    };
    stat.report = this.finishDayReport(stat);
    stat.certification = this.evaluateCertification(stat);
    if (stat.certification.achieved) {
      this.econ.certifiedStars = stat.certification.level;
      fiveStarReached = !this.endingSeen && this.stars() >= 5;
      if (fiveStarReached) this.endingSeen = true;
      stat.fiveStarReached = fiveStarReached;
    }
    this.lastStat = stat;
    return stat;
  }

  recordDayWork(s       , task       )       {
    if (!this.dayReport || !this.dayActive || !s || !task) return;
    const row = this.dayReport.work[s.id] || { id: s.id, name: s.name, job: s.job, total: 0, tasks: {} };
    const label = task.label || task.kind || '工作';
    row.tasks[label] = (row.tasks[label] || 0) + 1;
    row.total++;
    this.dayReport.work[s.id] = row;
  }

  recordDaySale(bucket        , key        , label        , count        , revenue        )       {
    if (!this.dayReport) return;
    const table = this.dayReport[bucket];
    const row = table[key] || { label, count: 0, revenue: 0 };
    row.count += count;
    row.revenue += revenue;
    table[key] = row;
  }

  finishDayReport(stat       )         {
    const report = this.dayReport || {
      day: stat.day, started: { coins: stat.coinsAfter - (stat.revenue - stat.wages - stat.maintenance - stat.restock), rep: this.econ.rep - stat.repDelta, stock: {}, staff: [] },
      work: {}, dishSales: {}, facilitySales: {}, stockUsed: {}, lostReasons: {}, events: [], moments: [],
      facilityByFurn: {}, facilityService: { started: 0, completed: 0, byType: {} }, facilityChallenges: { started: 0, resolved: 0, failed: 0 },
    };
    const byId = new Map(this.staff.map((s) => [s.id, s]));
    report.finished = {
      coins: stat.coinsAfter, rep: this.econ.rep, stock: { ...this.econ.stock },
      staff: report.started.staff.map((before) => {
        const after = byId.get(before.id);
        const work = report.work[before.id] || { id: before.id, name: before.name, job: before.job, total: 0, tasks: {} };
        return {
          ...work,
          needsBefore: before.needs,
          needsAfter: after ? { ...after.needs } : null,
          skillDelta: after ? Object.fromEntries(Object.keys(before.skills).map((key) => [key, (after.skills[key] || 0) - (before.skills[key] || 0)]).filter(([, value]) => value)) : {},
          left: !after,
        };
      }),
    };
    report.finance = {
      revenue: stat.revenue, wages: stat.wages, maintenance: stat.maintenance, restock: stat.restock,
      net: stat.revenue - stat.wages - stat.maintenance - stat.restock,
      coinsBefore: report.started.coins, coinsAfter: stat.coinsAfter,
    };
    report.reputation = { before: report.started.rep, delta: stat.repDelta, after: this.econ.rep };
    report.guests = { served: stat.served, lost: stat.lost, averageScore: stat.avgScore, scoreBreakdown: stat.scoreBreakdown };
    this.dayReport = report;
    return report;
  }

  stars()         { return Math.max(0, Math.min(5, Math.round(Number(this.econ.certifiedStars) || 0))); }

  evaluateCertification(stat = this.lastStat) {
    const level = Math.min(5, this.stars() + 1);
    if (!stat || this.stars() >= 5) return { level: this.stars(), achieved: false, complete: true, requirements: [] };
    const rule = STAR_CERTIFICATIONS[level];
    const report = stat.report || this.dayReport || {};
    const add = (label, current, target, met) => ({ label, current, target, met: !!met });
    const requirements = [
      add('声望', Math.round(this.econ.rep), STAR_THRESHOLDS[level], this.econ.rep >= STAR_THRESHOLDS[level]),
      add('单日服务人数', stat.served, rule.served, stat.served >= rule.served),
      add('平均评分', Number(stat.avgScore.toFixed(2)), rule.avgScore, stat.avgScore >= rule.avgScore),
    ];
    if (rule.requireDrinkOrStay) {
      const drank = Object.keys(report.dishSales || {}).some((id) => this.dishOf(id)?.drink && (report.dishSales[id]?.count || 0) > 0);
      const stayed = (report.facilitySales?.sleep?.count || 0) > 0;
      requirements.push(add('饮品或住宿消费', drank || stayed ? 1 : 0, 1, drank || stayed));
    }
    const specialTypes = Object.entries(report.facilitySales || {}).filter(([id, row]) => SPECIAL_FACILITY_WANTS.has(id) && (row.count || 0) > 0).length;
    if (rule.specialTypes) requirements.push(add('特殊设施消费种类', specialTypes, rule.specialTypes, specialTypes >= rule.specialTypes));
    if (Number.isFinite(rule.maxLost)) requirements.push(add('客人流失', stat.lost, `≤${rule.maxLost}`, stat.lost <= rule.maxLost));
    if (rule.minFacilityCompletion) {
      const service = report.facilityService || { started: 0, completed: 0 };
      const ratio = service.started ? service.completed / service.started : 0;
      requirements.push(add('设施服务完成率', `${Math.round(ratio * 100)}%`, `${Math.round(rule.minFacilityCompletion * 100)}%`, ratio >= rule.minFacilityCompletion));
    }
    if (rule.requireNoOpenChallenges) {
      const c = report.facilityChallenges || { started: 0, resolved: 0, failed: 0 };
      const open = Math.max(0, c.started - c.resolved - c.failed);
      requirements.push(add('未解决设施事故', open, 0, open === 0));
    }
    const achieved = requirements.every((row) => row.met);
    const result = { day: stat.day, level, achieved, complete: false, requirements };
    this.econ.certificationHistory.push(result);
    if (this.econ.certificationHistory.length > 40) this.econ.certificationHistory.shift();
    return result;
  }

  // ---------- 主循环 ----------
  update(dt        )       {
    if (!this.running) {
      this.tickDepartures(dt);
      // 收盘规划期：店主归玩家驱动，伙计们自由行动（研究/休息/调酒/串门聊天）
      if (this.manualOwner) { const o = this.staff.find((x) => x.isOwner); if (o) this.driveOwner(o, dt); }
      this.tickFreeTime(dt);
      this.tickAnim(dt); return;
    }
    this.dayT += dt;
    if (!this.pendingEvent && this.queuedDynamicEvent) {
      this.pendingEvent = this.queuedDynamicEvent;
      this.queuedDynamicEvent = null;
      this.fx.push({ ...this.tavern.entrance(), t: 1.2, kind: 'event' });
      this.sounds.push('alert');
    }
    if (this.dayActive && this.eventTimes.length && this.dayT >= this.eventTimes[0] && !this.pendingEvent) {
      this.eventTimes.shift();
      this.triggerEvent();
    }
    this.spawnTick(dt);
    this.tickGroups(dt);
    this.tickStaff(dt);
    this.tickWorld(dt);
    this.tickAnim(dt);
  }

  /** 与暂停无关的表现层计时（提示、特效、气泡） */
  uiTick(dt        )       {
    for (const t of this.toasts) t.t -= dt;
    this.toasts = this.toasts.filter((t) => t.t > 0);
    for (const f of this.fx) f.t -= dt;
    this.fx = this.fx.filter((f) => f.t > 0);
    for (const s of this.staff) if (s.bubble) { s.bubble.t -= dt; if (s.bubble.t <= 0) s.bubble = null; }
    for (const g of this.guests) if (g.bubble) { g.bubble.t -= dt; if (g.bubble.t <= 0) g.bubble = null; }
    for (const g of this.groups) if (g.intCd > 0) g.intCd = Math.max(0, g.intCd - dt);
    for (const c of this.chatter) c.t -= dt;
    this.chatter = this.chatter.filter((c) => c.t > 0);
  }

          tickAnim(dt        )       {
    for (const s of this.staff) s.animT += dt;
    for (const g of this.guests) g.animT += dt;
  }

  seatsFree()         {
    let n = 0;
    for (const t of this.tavern.allTables()) for (const c of this.tavern.tableSeats(t)) if (!this.seatOwner.has(c.id)) n++;
    return n;
  }

          spawnTick(dt        )       {
    if (!this.dayActive || this.dayT > DAY_LEN - 30) return;
    const p = phaseOf(this.dayT);
    const base = p === '暖场' ? 22 : p === '上客' ? 13 : p === '低谷' ? 26 : p === '晚高峰' ? 9 : 999;
    const repBoost = 1 - Math.min(0.45, this.econ.rep / 2200);
    // 开局节奏：第一天客人稀疏，之后逐日放开（避免第一天就是中期强度）
    const ease = this.econ.day <= 1 ? 2.4 : this.econ.day === 2 ? 1.7 : this.econ.day === 3 ? 1.3 : 1;
    const waiting = this.groups.filter((g) => g.state === 'wait').length;
    if (waiting >= (this.econ.day <= 2 ? 2 : 4)) return;
    const maxGroups = 3 + this.stars() * 2 + Math.min(4, this.econ.day);
    if (this.groups.length >= maxGroups) return;
    // 厨房积压时不再涌入新客（产能自适应：扩厨房/招厨师直接提高客流）
    const cooks = this.staff.filter((s) => s.job === 'cook' || s.job === 'bartender' || s.job === 'free').length;
    const backlog = this.orders.filter((o) => o.stage === 'queued' || o.stage === 'prep' || o.stage === 'cook').length;
    if (backlog > 2 + cooks * 2) return;
    if (this.seatsFree() < 1 && this.freeFacilities() < 1 && waiting >= 1) return;
    this.spawnAcc = (this.spawnAcc || 0) + dt;
    const interval = base * repBoost * ease * (0.8 + this.rng.next() * 0.5);
    if (this.spawnAcc < interval) return;
    this.spawnAcc = 0;
    this.spawnGroup();
  }
          spawnAcc = 0;

  spawnGroup()       {
    // 只有当前酒馆能满足的需求才会有客人带着它上门
    const wants = this.availableWants();
    if (!wants.length) return;
    let roll = this.rng.next() * wants.reduce((n, w) => n + w.weight, 0);
    let want = wants[0];
    for (const w of wants) { roll -= w.weight; if (roll <= 0) { want = w; break; } }
    const activeRegulars = new Set(this.groups.map((group) => group.regularId).filter(Boolean));
    const returningPool = this.regulars.filter((profile) => !activeRegulars.has(profile.id) && profile.lastVisitDay < this.econ.day);
    const returning = returningPool.length && this.rng.chance(Math.min(.55, .22 + returningPool.length * .025))
      ? returningPool[this.rng.int(returningPool.length)] : null;
    if (returning?.want && wants.some((item) => item.id === returning.want) && this.rng.chance(.7)) want = wants.find((item) => item.id === returning.want);
    const e = this.tavern.entrance();
    const sizeCap = this.econ.day <= 1 ? 2 : this.econ.day <= 3 ? 3 : 4;
    let size = 1 + this.rng.int(this.rng.chance(0.5) ? Math.min(2, sizeCap) : sizeCap);
    if (want.facility) {                       // 设施容量决定这组最多几个人
      const caps = this.facilitiesOf(want).map((f) => this.facilityCap(f));
      const maxCap = caps.length ? Math.max(...caps) : 1;
      size = Math.min(size, maxCap);
    }
    const gid = this.id();
    const members          = [];
    for (let i = 0; i < size; i++) {
      if (i === 0 && returning) {
        members.push({
          id: this.id(), app: returning.app, name: returning.name, race: returning.race, regularId: returning.id,
          groupId: gid, x: e.x - .2, y: e.y, dir: 0, pose: 'idle', animT: this.rng.next() * 2,
          path: [], seatId: 0, mood: 1, aff: returning.aff || 0, aiChatLog: [...(returning.aiChatLog || [])],
          relationshipSummary: returning.relationshipSummary || '', background: returning.background || null,
        });
        continue;
      }
      const race = this.rng.int(18);
      members.push({
        id: this.id(), app: randomAppearance(this.rng, race, false, this.rng.chance(0.5) ? LOOK_THEMES[this.rng.int(3)] : undefined),
        name: makeName(this.rng), race: RACE_NAMES[race],
        groupId: gid, x: e.x + (i % 2) * 0.4 - 0.2, y: e.y + 0.2 * i, dir: 0, pose: 'idle', animT: this.rng.next() * 2,
        path: [], seatId: 0, mood: 1, aff: 0, aiChatLog: [],
      });
    }
    const pool = want.facility ? this.allDishes() : this.makeableDishes(want.drink);
    const taste = returning?.taste?.length ? [...returning.taste] : [pool[this.rng.int(pool.length)].id, pool[this.rng.int(pool.length)].id];
    // 口味偏好：两个不重复的口味标签
    const f1 = returning?.flavors?.[0] || FLAVORS[this.rng.int(FLAVORS.length)].id;
    const rememberedF2 = returning?.flavors?.[1];
    const alternatives = FLAVORS.map((item) => item.id).filter((id) => id !== f1);
    const f2 = rememberedF2 && rememberedF2 !== f1 ? rememberedF2 : alternatives[this.rng.int(alternatives.length)] || f1;
    const g        = {
      id: gid, members, size, tableId: 0, state: 'wait', want: want.id, greeted: false, seatCd: 0, facId: 0, useT: 0, facT: 0,
      maxPatience: Math.round(this.rng.range(78, 135)), patience: 0, budget: Math.round(this.rng.range(30, 120)),
      hygieneSens: this.rng.range(0.4, 1.5), taste, flavors: [f1, f2], orderId: 0,
      enterT: this.dayT, orderedT: 0, servedT: 0, eatT: 0, leaveReason: '',
      praised: 0, mocked: 0, intCd: 0, regularId: returning?.id || null,
    };
    if (returning) {
      returning.visits = Math.max(1, returning.visits || 1) + 1;
      returning.lastVisitDay = this.econ.day;
      g.budget = Math.round(g.budget * (returning.aff >= 60 ? 1.6 : returning.aff >= 30 ? 1.3 : 1.1));
      this.toast(`常客 ${returning.name} 第 ${returning.visits} 次来到旅店`);
    }
    g.patience = g.maxPatience;
    this.groups.push(g);
    this.guests.push(...members);
    this.fx.push({ x: e.x, y: e.y, t: 0.6, kind: 'portal' });
    this.sounds.push('chime');
    // 所有客人先到前台：由前台完成迎宾并引导入座/入房。
    this.goWaitArea(g);
  }

  /** 当前能做出来的菜（库存 + 产出设备 + 星级 都满足） */
  /** 经典菜 + 玩家研发菜（菜谱全集） */
  seasonIndex() { return Math.floor((this.econ.day - 1) / 3) % SEASON_NAMES.length; }

  dishMastery(id) {
    const sales = Math.max(0, Number(this.econ.dishMastery?.[id]) || 0);
    const level = sales >= 70 ? 3 : sales >= 30 ? 2 : sales >= 10 ? 1 : 0;
    return { sales, level, next: level === 0 ? 10 : level === 1 ? 30 : level === 2 ? 70 : null };
  }

  effectiveDish(dish) {
    const mastery = this.dishMastery(dish.id);
    return { ...dish, basePrice: dish.price, price: Math.round(dish.price * (1 + mastery.level * .08)), taste: Math.round(dish.taste * (1 + mastery.level * .04) * 100) / 100, mastery };
  }

  allDishes()         { return DISHES.concat(this.econ.customDishes).map((dish) => this.effectiveDish(dish)); }

  dishOf(id        )       { return this.allDishes().find((d) => d.id === id) || DISHES[0]; }

  makeableDishes(drink         )         {
    return this.allDishes().filter((d) => {
      if (d.drink !== drink) return false;
      const st = this.dishStatus(d);
      return st.on && st.facility && st.skillOk && st.stockOk && st.seasonOk;
    });
  }

  /** 菜品供应状态：上架 / 设施 / 厨师技能 / 库存 四道闸，菜单面板与出品过滤共用 */
  dishStatus(d      )                                                                                       {
    const hasBar = this.tavern.furnsOfKind('keg').some((f) => ['bar', 'parlor'].includes(this.tavern.roomOfFurn(f)?.kind));
    const hasKitchen = this.tavern.rooms.some((r) => r.kind === 'kitchen')
      && this.tavern.furnsOfKind('stove').length > 0 && this.tavern.furnsOfKind('pass').length > 0;
    const best = this.bestSkill(d.drink ? 'mix' : 'cook').value;
    let stockOk = true;
    for (const k of ING_KEYS) { const n = d.ing[k] || 0; if (n > 0 && this.econ.stock[k] < n) { stockOk = false; break; } }
    return {
      on: this.econ.menu[d.id] !== false,
      facility: d.drink ? hasBar : hasKitchen,
      skillOk: best >= d.skill,
      stockOk,
      seasonOk: !d.seasons || d.seasons.includes(this.seasonIndex()),
      best,
    };
  }

  /** 新菜数值推导：售价/厨艺门槛/味道全由配方决定，研发面板预览与正式研发共用 */
  dishStats(ing                                 , flavors          , fun          , drink         )                                                                                             {
    const value = ING_KEYS.reduce((a, k) => a + (ing[k] || 0) * ING_PRICE[k], 0);
    let price = 14 + value * 2.1 + flavors.length * 4;
    if (fun.includes('glow')) price *= 1.25;
    if (fun.includes('huge')) price *= 1.45;
    let skill = 10 + (ing.grain || 0) * 2 + (ing.veg || 0) * 2.5 + (ing.meat || 0) * 5 + (ing.spice || 0) * 6 + (ing.ether || 0) * 9
      + Math.max(0, flavors.length - 1) * 5 + (fun.includes('huge') ? 8 : 0) + (flavors.includes('weird') ? 4 : 0);
    let taste = 1.02 + flavors.length * 0.045 + (fun.includes('glow') ? 0.08 : 0) - (flavors.includes('weird') ? 0.05 : 0);
    const dom = (['ether', 'spice', 'meat', 'veg', 'grain']            ).reduce((best, k) => (ing[k] || 0) * ING_PRICE[k] > (ing[best] || 0) * ING_PRICE[best] ? k : best, 'grain'          );
    const color = { grain: '#E8C25A', veg: '#8DDB4A', meat: '#A8542E', spice: '#E4732C', ether: '#7A4BE0' }[dom];
    return { price: Math.round(price), skill: Math.min(88, Math.round(skill)), taste: Math.round(taste * 100) / 100, color, value, fee: Math.round(60 + value) };
  }

  /** 研发新菜：消耗配方食材 + 研发费，按厨师技能对门槛检定；成功即自动上架 */
  researchDish(input                                                                                                                 )                               {
    const total = ING_KEYS.reduce((a, k) => a + (input.ing[k] || 0), 0);
    if (total < 2) return { ok: false, msg: '配方太单薄了，至少放 2 份食材。' };
    if (total > 10) return { ok: false, msg: '最多 10 份食材，再多灶台要装不下了。' };
    if (!input.flavors.length) return { ok: false, msg: '至少选一种口味。' };
    if (this.econ.customDishes.length >= 10) return { ok: false, msg: '自创菜最多 10 道，先在菜单里删掉几道。' };
    const chef = this.staff.find((s) => s.id === input.chefId);
    if (!chef) return { ok: false, msg: '请指派一位研发厨师。' };
    for (const k of ING_KEYS) if ((input.ing[k] || 0) > this.econ.stock[k]) return { ok: false, msg: `${ING_LABEL[k]}库存不够，研发要先备料。` };
    const st = this.dishStats(input.ing, input.flavors, input.fun, input.drink);
    if (this.econ.coins < st.fee) return { ok: false, msg: `研发费要 ${st.fee} 币，手头不够。` };
    for (const k of ING_KEYS) this.econ.stock[k] -= input.ing[k] || 0;
    this.econ.coins -= st.fee;
    const chefSkill = chef.skills[input.drink ? 'mix' : 'cook'];
    const chance = clamp(55 + (chefSkill - st.skill) * 1.6, 20, 98);
    if (!this.rng.chance(chance / 100)) {
      this.sounds.push('angry');
      return { ok: false, msg: `研发失败……${chef.name}端出一锅不可名状物（成功率 ${Math.round(chance)}%）。食材和研发费打了水漂。` };
    }
    const name = input.name.trim() || '无名料理';
    const dish       = {
      id: 'cus' + this.id(), name, ing: { ...input.ing }, price: st.price, skill: st.skill,
      color: st.color, drink: input.drink, taste: st.taste,
      flavors: [...input.flavors], custom: true, fun: [...input.fun], description: String(input.description || '').slice(0, 140),
    };
    this.econ.customDishes.push(dish);
    this.sounds.push('powerup');
    return { ok: true, msg: `研发成功！《${name}》已写入菜单：售价 ${st.price} 币，${input.drink ? '调酒' : '厨艺'}门槛 ${st.skill}。` };
  }

  deleteCustomDish(id        )       {
    this.econ.customDishes = this.econ.customDishes.filter((d) => d.id !== id);
    delete this.econ.menu[id];
  }

  /** 这条需求现在能不能满足：设施/产出都要到位（被占只是要等，不算不能满足） */
  wantOk(w           )          {
    if (w.facility) return this.facilitiesOf(w).length > 0;
    if (!this.makeableDishes(w.drink).length) return false;
    return this.seatsInRooms(w.seatRooms) > 0;
  }

  /** 该需求对应的、摆在正确房间里的设施 */
  facilitiesOf(w           )         {
    if (!w.facility) return [];
    const kinds = w.facility === 'bed' ? BED_KINDS : [w.facility];
    return this.tavern.furns.filter((f) => kinds.includes(f.kind)).filter((f) => {
      const room = this.tavern.roomOfFurn(f);
      return !!room && w.seatRooms.includes(room.kind);
    });
  }

  /** 现在还空着、也不需要整理的设施数量 */
  freeFacilities()         {
    let n = 0;
    for (const w of GUEST_WANTS) {
      if (!w.facility) continue;
      for (const f of this.facilitiesOf(w)) if (!this.facOwner.has(f.id) && !(f.dirty || 0)) n++;
    }
    return n;
  }

          facilityCap(f      )         {
    const cap = furnDef(f.kind).cap                        ;
    return cap ? cap[f.quality - 1] : 2;
  }

          findFacility(w           , size        )              {
    let best              = null; let bestKey = 1e9;
    for (const f of this.facilitiesOf(w)) {
      if (this.facOwner.has(f.id) || (f.dirty || 0)) continue;
      const cap = this.facilityCap(f);
      if (size > cap) continue;
      const key = (cap - size) * 10 - f.quality;
      if (key < bestKey) { bestKey = key; best = f; }
    }
    return best;
  }

  /** 设施周围可站立的格子（不挡路的设施直接站上去） */
          facilitySpots(f      )                             {
    const tiles = this.tavern.furnTiles(f);
    if (!this.tavern.blocks(f.kind)) return tiles;
    const room = this.tavern.roomOfFurn(f);
    const out                             = [];
    const seen = new Set        ();
    for (const t of tiles) {
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]              ) {
        const x = t.x + dx, y = t.y + dy, k = x + ',' + y;
        if (seen.has(k)) continue;
        seen.add(k);
        const r2 = this.tavern.roomAt(x, y);
        if (!r2 || !room || r2.id !== room.id) continue;
        if (!this.tavern.walkable(x, y)) continue;
        out.push({ x, y });
      }
    }
    return out;
  }

  /** 设施型需求：占住设施并各自走过去 */
  tryUseFacility(g       )          {
    const w = wantById(g.want);
    const special = SPECIAL_FACILITY_WANTS.has(w.id);
    const f = g.facId ? this.tavern.furnById(g.facId) : this.findFacility(w, g.size);
    if (!f) return false;
    if (!g.facId) {
      this.facOwner.set(f.id, g.id);
      g.facId = f.id;
    }
    if (special && !g.facilityPrepared) {
      g.state = 'facility_prepare';
      g.facilityService = { prepared: false, escorted: false, attended: false };
      if (this.dayReport) {
        this.dayReport.facilityService.started++;
        const row = this.dayReport.facilityService.byType[w.id] || { started: 0, completed: 0 };
        row.started++;
        this.dayReport.facilityService.byType[w.id] = row;
      }
      return true;
    }
    return this.startFacilityTravel(g);
  }

  startFacilityTravel(g) {
    const f = this.tavern.furnById(g.facId);
    if (!f) return false;
    const spots = this.facilitySpots(f);
    if (!spots.length) return false;
    const paths                               = [];
    for (let i = 0; i < g.size; i++) {
      const m = g.members[i];
      const t = spots[i % spots.length];
      const p = this.tavern.path(Math.round(m.x), Math.round(m.y), t.x, t.y);
      if (!p) return false;
      paths.push(p);
    }
    // 站位比人少时会有人挤在同一格：走到就算到，不强求踩准（见 toFac 的到位判定）
    g.state = 'toFac';
    g.facT = 0;
    g.members.forEach((m, i) => { m.path = paths[i]; });
    return true;
  }

  facilitySkill(wantId) {
    return FACILITY_CHALLENGES[wantId]?.skill || 'calm';
  }

  beginFacilityUse(g, staff = null) {
    const f = this.tavern.furnById(g.facId);
    if (!f || g.state === 'using') return false;
    const t = furnDef(f.kind).time;
    g.state = 'using';
    g.useT = t ? t[f.quality - 1] : 22;
    g.facilityService = { ...(g.facilityService || {}), attended: true, attendant: staff?.name || '' };
    g.facilityAttendantSkill = staff ? staff.skills[this.facilitySkill(g.want)] : 0;
    for (const m of g.members) {
      m.pose = 'idle';
      m.dir = Math.abs(m.x - f.x) > Math.abs(m.y - f.y) ? (m.x > f.x ? 1 : 3) : (m.y > f.y ? 2 : 0);
    }
    this.fx.push({ x: f.x + 0.5, y: f.y + 0.5, t: 0.6, kind: 'serve' });
    this.sounds.push(f.kind === 'pool' || f.kind === 'fountain' || f.kind === 'cauldron' ? 'splash' : f.kind === 'screen' || f.kind === 'telescope' || f.kind === 'arcadem' ? 'chime' : 'cue');
    this.maybeStartFacilityChallenge(g);
    return true;
  }

  hasFacilityCoverage(want) {
    const rooms = new Set(this.facilitiesOf(want).map((f) => this.tavern.roomOfFurn(f)?.id).filter(Boolean));
    return this.staff.some((staff) => this.dutyFit('facility', staff) >= 0
      && (!staff.roomId || staff.roomMode !== 'strict' || rooms.has(staff.roomId)));
  }

          releaseFacility(g       )       {
    if (!g.facId) return;
    if (this.facOwner.get(g.facId) === g.id) this.facOwner.delete(g.facId);
    g.facId = 0;
  }

  /** 住店客续摊：消费完一个需求后，接着去下一个（通常是回房睡觉）；返回 true 表示不走了 */
          advanceWant(g       )          {
    if (!g.nextWant) return false;
    g.want = g.nextWant;
    g.nextWant = undefined;
    g.state = 'wait';
    g.patience = g.maxPatience;
    g.facT = 0; g.orderId = 0; g.tableId = 0;
    g.facilityPrepared = false; g.facilityService = null; g.facilityAttendantSkill = 0; g.challengeRolled = false;
    for (const m of g.members) { if (m.seatId) this.seatOwner.delete(m.seatId); m.seatId = 0; m.path = []; }
    this.toast('住店客消费完，回房休息去了');
    return true;
  }

  /** 需求分派入口：设施型去设施，餐饮型去座位；住店客可能先去娱乐区续一摊 */
  tryPlace(g       )          {
    if (g.want === 'sleep' && !g.detourDone) {
      g.detourDone = true;
      // 主要待客房，但店里有酒吧/温泉/台球室时，过半概率先去消费一发
      if (this.rng.chance(0.55)) {
        const opts = GUEST_WANTS.filter((w) => w.id !== 'sleep' && this.wantOk(w));
        if (opts.length) {
          const pick = opts[this.rng.int(opts.length)];
          g.nextWant = 'sleep';
          g.want = pick.id;
          this.toast(`住店客决定先去${pick.name}再回房`);
        }
      }
    }
    return wantById(g.want).facility ? this.tryUseFacility(g) : this.trySelfSeat(g);
  }

  /** 只检查当前是否确有可用座位/设施，不改变客人需求与占用状态。 */
  hasPlace(g) {
    const want = wantById(g.want);
    return want.facility ? !!this.findFacility(want, g.size) : !!this.findTable(g.size, want);
  }

  availableWants()              { return GUEST_WANTS.filter((w) => this.wantOk(w)); }

          seatsInRooms(kinds            )         {
    let n = 0;
    for (const t of this.tavern.allTables()) {
      const room = this.tavern.roomOfFurn(t);
      if (!room || !kinds.includes(room.kind)) continue;
      n += this.tavern.tableSeats(t).length;
    }
    return n;
  }

  /** 找桌：优先客人想去的房间类型（喝酒先去酒吧，吃饭先去餐饮间） */
          findTable(size        , want            )              {
    const order = want ? want.seatRooms : null;
    let best              = null; let bestKey = 1e9;
    for (const t of this.tavern.allTables()) {
      const seats = this.tavern.tableSeats(t).filter((c) => !this.seatOwner.has(c.id));
      if (seats.length < size) continue;
      const cap = (furnDef('table').cap            )[t.quality - 1];
      if (size > cap) continue;
      const room = this.tavern.roomOfFurn(t);
      let pref = 2;
      if (order && room) { const i = order.indexOf(room.kind); pref = i < 0 ? 3 : i; }
      const key = pref * 100 + (seats.length - size);
      if (key < bestKey) { bestKey = key; best = t; }
    }
    return best;
  }

  /** 客人自己走到对应区域落座；没座位返回 false（去前台等） */
          trySelfSeat(g       )          {
    const t = this.findTable(g.size, wantById(g.want));
    if (!t) return false;
    this.seatGroup(g, t);
    return g.state === 'seating' || g.state === 'seated';
  }

  /** 前台等位：站在门厅里、离入口最近的空地上，按组号错开 */
  goWaitArea(g       )       {
    g.state = 'wait';
    g.greetWaitT = 0;
    const e = this.tavern.entrance();
    const foyer = this.tavern.rooms.find((r) => r.kind === 'foyer');
    const spots                             = [];
    if (foyer) {
      for (let y = foyer.y; y < foyer.y + foyer.h; y++) for (let x = foyer.x; x < foyer.x + foyer.w; x++) {
        if (this.tavern.walkable(x, y)) spots.push({ x, y });
      }
      spots.sort((a, b) => (Math.abs(a.x - e.x) + Math.abs(a.y - e.y) * 1.4) - (Math.abs(b.x - e.x) + Math.abs(b.y - e.y) * 1.4));
    }
    const waitingBefore = this.groups.filter((x) => x.id !== g.id && x.state === 'wait')
      .reduce((n, x) => n + x.size, 0);
    g.members.forEach((m, i) => {
      // 队列比门厅空地还长时绕回来排（不要所有人挤在最后一格）
      const spot = spots.length ? spots[(1 + waitingBefore + i) % spots.length] : e;
      const p = this.tavern.path(Math.round(m.x), Math.round(m.y), spot.x, spot.y);
      if (p) m.path = p;
    });
  }

  maybeStartFacilityChallenge(g) {
    if (g.challengeRolled || g.state === 'leaving' || g.overnight) return;
    g.challengeRolled = true;
    const def = FACILITY_CHALLENGES[g.want];
    if (!def || !this.rng.chance(.2)) return;
    const guest = g.members[0];
    const challenge = { id: this.id(), groupId: g.id, guestId: guest.id, ...def, state: 'open', age: 0 };
    this.facilityChallenges.push(challenge);
    if (this.dayReport) this.dayReport.facilityChallenges.started++;
    guest.bubble = { text: def.bubble, t: 12 };
    this.toast(`⚠ ${guest.name}：${def.bubble}`);
    this.sounds.push('alert');
  }

  finishFacilityChallenge(challenge, staff, success) {
    if (!challenge || challenge.state !== 'open') return;
    const group = this.groups.find((item) => item.id === challenge.groupId);
    const guest = group?.members.find((item) => item.id === challenge.guestId) || group?.members[0];
    challenge.state = success ? 'success' : 'failed';
    challenge.staff = staff?.name || '';
    if (success) {
      this.econ.coins += challenge.reward; this.econ.revenue += challenge.reward;
      if (this.dayReport) this.dayReport.facilityChallenges.resolved++;
      if (guest) { guest.aff = clamp((guest.aff || 0) + 5, -100, 100); guest.bubble = { text: `${staff?.name || '员工'}解决得太漂亮了！`, t: 5 }; }
      if (group) { group.praised++; group.patience = Math.min(group.maxPatience, group.patience + 18); }
      this.recordScoreParts({ service: 4.8, comfort: 4.5 });
      this.toast(`挑战成功：${staff?.name || '员工'}完成“${challenge.label}” +${challenge.reward} 界币`);
      this.fx.push({ x: guest?.x || staff?.x || 0, y: guest?.y || staff?.y || 0, t: 1.1, kind: 'happy' }); this.sounds.push('powerup');
    } else {
      if (this.dayReport) this.dayReport.facilityChallenges.failed++;
      if (guest) { guest.aff = clamp((guest.aff || 0) - 5, -100, 100); guest.bubble = { text: '这可不像一家靠谱的旅店！', t: 5 }; }
      if (group) group.mocked++;
      this.recordScoreParts({ service: 1.4, comfort: 1.6 });
      this.toast(`挑战失败：“${challenge.label}”未解决，本次服务评价下降`);
      this.fx.push({ x: guest?.x || staff?.x || 0, y: guest?.y || staff?.y || 0, t: 1.1, kind: 'sad' }); this.sounds.push('angry');
    }
  }

  failOpenChallenges(group) {
    for (const challenge of this.facilityChallenges.filter((item) => item.groupId === group.id && item.state === 'open')) this.finishFacilityChallenge(challenge, null, false);
  }

  tickGroups(dt        )       {
    for (const g of [...this.groups]) {
      if (g.state === 'eating') this.maybeStartFacilityChallenge(g);
      for (const challenge of this.facilityChallenges.filter((item) => item.groupId === g.id && item.state === 'open')) challenge.age += dt;
      if (g.state === 'wait' && !g.greeted) {
        const arrived = g.members.every((member) => !member.path.length);
        g.greetWaitT = arrived ? (g.greetWaitT || 0) + dt : 0;
        if (g.greetWaitT >= GREETING_FAILSAFE_SECONDS) {
          const greeter = [...this.staff]
            .filter((staff) => this.dutyFit('greet', staff) >= 0)
            .sort((a, b) => this.dutyFit('greet', b) - this.dutyFit('greet', a) || b.skills.serve - a.skills.serve)[0] || null;
          this.completeGreeting(g, greeter);
        }
      }
      if (g.state === 'wait' || g.state === 'seated' || g.state === 'ordered' || g.state === 'facility_prepare' || g.state === 'facility_waiting_attend') {
        g.patience -= dt * (1 + (g.state === 'ordered' ? 0.15 : 0));
        if (g.patience <= 0) { this.leave(g, g.state === 'wait' ? '在前台等太久' : '等菜太久'); continue; }
      }
      if (g.state === 'wait') {
        // 客人不会再自行找桌；迎宾后仍无空位时，前台会创建新的引座任务。
        if (g.patience < g.maxPatience * 0.3) { this.leave(g, '等不到座位'); continue; }
      }
      if (g.state === 'seating') {
        const arrived = g.members.every((m) => m.path.length === 0);
        if (arrived) { g.state = 'seated'; for (const m of g.members) { const c = this.tavern.furnById(m.seatId); if (c) m.dir = c.dir; m.pose = 'idle'; } }
      }
      if (g.state === 'toFac') {
        const ff = this.tavern.furnById(g.facId);
        if (!ff) { this.leave(g, ''); continue; }
        g.facT += dt;
        const fp = furnFootprint(ff.kind, ff.dir);
        const ccx = ff.x + fp[0] / 2, ccy = ff.y + fp[1] / 2;
        const arrived = g.members.every((m) => m.path.length === 0
          || Math.hypot(m.x + 0.5 - ccx, m.y + 0.5 - ccy) < 1.9);
        if (arrived || g.facT > 25) {
          for (const m of g.members) m.path = [];
          const f = this.tavern.furnById(g.facId);
          if (!f) { this.leave(g, ''); continue; }
          if (SPECIAL_FACILITY_WANTS.has(g.want)) g.state = 'facility_waiting_attend';
          else this.beginFacilityUse(g);
        }
      }
      if (g.state === 'using') {
        if (g.overnight) continue;          // 过夜住宿客：一直睡到次日开门结账
        g.useT -= dt;
        if (g.useT <= 0) {
          // 入夜后用完床的住宿客不走，继续睡过夜
          if (g.want === 'sleep' && this.dayT > DAY_LEN * 0.72) { g.overnight = true; g.useT = Infinity; continue; }
          this.payFacility(g); continue;
        }
      }
      if (g.state === 'eating') {
        g.eatT -= dt;
        if (g.eatT <= 0) { g.eatT = 0; g.state = 'checkout'; g.checkoutT = this.dayT; }
      }
      if (g.state === 'leaving') {
        this.tickLeavingGroup(g, dt);
        continue;
      }
      for (const m of g.members) {
        this.moveActor(m, dt, 2.1);
        if (g.state === 'wait' && !m.path.length) {
          const seat = this.tavern.furnAt(Math.round(m.x), Math.round(m.y));
          if (seat?.kind === 'bench') { m.pose = 'sit'; m.dir = seat.dir; }
        }
      }
    }
  }

  tickLeavingGroup(g       , dt        )       {
    g.leaveT = (g.leaveT || 0) + dt;
    for (const m of g.members) this.moveActor(m, dt, 2.1);
    // 路径不可达时 leave() 会给空路径；超时兜底防止旧存档中的坏坐标永久残留。
    if (g.members.every((m) => m.path.length === 0) || g.leaveT > 20) {
      this.guests = this.guests.filter((x) => x.groupId !== g.id);
      this.groups = this.groups.filter((x) => x.id !== g.id);
    }
  }

  tickDepartures(dt        )       {
    for (const g of [...this.groups]) if (g.state === 'leaving') this.tickLeavingGroup(g, dt);
  }

          seatGroup(g       , table      )       {
    const seats = this.tavern.tableSeats(table).filter((c) => !this.seatOwner.has(c.id)).slice(0, g.size);
    if (seats.length < g.size) { this.goWaitArea(g); return; }
    g.tableId = table.id;
    g.state = 'seating';
    for (let i = 0; i < g.size; i++) {
      const m = g.members[i];
      const c = seats[i];
      this.seatOwner.set(c.id, m.id);
      m.seatId = c.id;
      const p = this.tavern.path(Math.round(m.x), Math.round(m.y), c.x, c.y);
      m.path = p || [];
      if (!p) { this.leave(g, '没有可通行的路线'); return; }
    }
  }

  leave(g       , reason        )       {
    g.leaveReason = reason;
    g.state = 'leaving';
    g.leaveT = 0;
    this.releaseFacility(g);
    if (reason !== '') {
      this.econ.lost++;
      if (this.dayReport) this.dayReport.lostReasons[reason] = (this.dayReport.lostReasons[reason] || 0) + 1;
      this.scores.push(1.2);
      this.recordScoreParts({ wait: 1.2, service: 1.2 });
      this.toast(`一组客人离店：${reason}`);
      this.sounds.push('angry');
    }
    this.rememberGuests(g, reason ? 1.2 : 3);
    for (const m of g.members) {
      if (m.seatId) this.seatOwner.delete(m.seatId);
      m.seatId = 0;
      const e = this.tavern.entrance();
      m.path = this.tavern.path(Math.round(m.x), Math.round(m.y), e.x, e.y) || [];
    }
  }

  /** 这桌人爱不爱这道菜：点了心头好，或菜品口味命中他们的偏好 */
  guestLikes(g       , dish      )          {
    if (g.taste.includes(dish.id)) return true;
    return (dish.flavors || []).some((f) => (g.flavors || []).includes(f));
  }

  rememberGuests(g, score = 3) {
    for (const guest of g.members || []) {
      let profile = guest.regularId ? this.regulars.find((item) => item.id === guest.regularId) : null;
      const adjustedAff = clamp((guest.aff || 0) + (score >= 4 ? 3 : score < 2 ? -3 : 1), -100, 100);
      if (!profile && adjustedAff >= 5 && this.regulars.length < 60) {
        profile = {
          id: this.id(), name: guest.name, race: guest.race, app: guest.app, aff: adjustedAff,
          visits: 1, lastVisitDay: this.econ.day, aiChatLog: [], relationshipSummary: '', background: null,
          taste: [...(g.taste || [])], flavors: [...(g.flavors || [])], want: g.want, offer: null,
        };
        guest.regularId = profile.id;
        this.regulars.push(profile);
      }
      if (!profile) continue;
      profile.aff = adjustedAff;
      profile.aiChatLog = [...(guest.aiChatLog || [])].slice(0, 20);
      profile.relationshipSummary = guest.relationshipSummary || profile.relationshipSummary || '';
      profile.want = g.want; profile.taste = [...(g.taste || [])]; profile.flavors = [...(g.flavors || [])];
      if (profile.aff >= 20 && !profile.background) profile.background = `${profile.name}来自${profile.race}聚居的远方位面，把这家旅店当作穿越世界时可以安心停靠的熟悉灯火。`;
      if (profile.aff >= 35 && !profile.offer) profile.offer = { kind: 'commission', text: `希望旅店为其准备带有${FLAVOR_LABEL[profile.flavors[0]] || '独特'}风味的特别招待`, reward: 90 };
      if (profile.aff >= 60) profile.offer = { kind: 'vip', text: '愿意为招牌体验支付更高费用，但希望店主亲自照应', reward: 160 };
    }
  }

  /** 房间氛围值（壁炉/盆栽/星灯），封顶避免堆盆栽刷分 */
  charmIn(roomId        )         {
    const room0 = this.tavern.roomById(roomId);
    let sum = styleById(this.tavern.roomStyle(room0)).charm + (room0 ? (ROOM_CHARM[room0.kind] || 0) : 0);
    for (const f of this.tavern.furnsIn(roomId)) {
      const c = furnDef(f.kind).charm;
      if (c) sum += c[f.quality - 1];
    }
    return Math.min(1.6, sum);
  }

  charmTotal()         {
    let sum = 0;
    for (const r of this.tavern.rooms) sum += this.charmIn(r.id);
    return Math.min(4, sum);
  }

  recordScoreParts(parts)       {
    for (const [key, value] of Object.entries(parts)) {
      if (Number.isFinite(value) && this.scoreParts[key]) this.scoreParts[key].push(value);
    }
  }

  pay(g       )       {
    this.failOpenChallenges(g);
    const order = this.orders.find((o) => o.id === g.orderId);
    const dish = order ? this.dishOf(order.dishId) : DISHES[0];
    const table = this.tavern.furnById(g.tableId);
    const room = table ? this.tavern.roomOfFurn(table) : null;
    const parlorPremium = room?.kind === 'parlor' ? 1.25 : 1;
    const revenue = Math.round(dish.price * this.econ.markup * g.size * parlorPremium);
    this.econ.coins += revenue;
    this.econ.revenue += revenue;
    this.econ.served += g.size;
    this.recordDaySale('dishSales', dish.id, dish.name, g.size, revenue);
    const beforeMastery = this.dishMastery(dish.id).level;
    this.econ.dishMastery[dish.id] = (this.econ.dishMastery[dish.id] || 0) + g.size;
    const afterMastery = this.dishMastery(dish.id).level;
    if (afterMastery > beforeMastery) this.toast(`★ 招牌菜成长：《${dish.name}》升至 ${afterMastery} 级，售价与风味提升`);
    // 评价 6 项
    const waitPen = clamp(3 + (g.patience / g.maxPatience) * 2.4, 1, 5);
    const taste = clamp((order ? order.quality : 2) * (this.guestLikes(g, dish) ? 1.15 : 1) * (this.econ.markup > 2 ? 0.8 : 1), 1, 5);    const serveScore = clamp(2 + this.bestSkill('serve').value / 30 + (g.greeted ? 0.5 : 0)
      + (this.staff.some((x) => x.traits.includes('sociable')) ? 0.3 : 0)
      + Math.min(1, g.praised * 0.5) - Math.min(1.5, g.mocked * 0.75), 1, 5);
    const hygiene = clamp(((room ? room.clean : 60) / 20) * (2 - g.hygieneSens * 0.5), 1, 5);
    const roomCharm = room ? this.charmIn(room.id) : 0;
    const comfort = clamp(1.6 + (table ? table.quality : 1) * 0.8 + (room ? room.quality * 0.4 : 0) + roomCharm + (room?.kind === 'parlor' ? .45 : 0), 1, 5);
    const spectacle = clamp(1.8 + this.tavern.rooms.length * 0.25 + this.tavern.furns.length * 0.03 + this.charmTotal() * 0.18 + (room?.kind === 'parlor' ? .35 : 0), 1, 5);
    const score = (taste * 1.25 + waitPen * 1.15 + serveScore + hygiene * 1.1 + comfort * 0.85 + spectacle * 0.65) / 6.0;
    this.scores.push(score);
    this.recordScoreParts({ quality: taste, wait: waitPen, service: serveScore, hygiene, comfort, spectacle });
    if (table) table.dirty = (table.dirty || 0) + g.size;
    if (room) room.clean = clamp(room.clean - g.size * 0.8, 0, 100);
    // 餐桌会留下脏盘；地面污渍按实际用餐人数低概率出现，不再每桌五成概率硬刷。
    if (this.rng.chance(Math.min(0.32, g.size * 0.09))) this.tavern.addDirt(Math.round(g.members[0].x), Math.round(g.members[0].y));
    this.fx.push({ x: table ? table.x : g.members[0].x, y: table ? table.y : g.members[0].y, t: 0.8, kind: score >= 3.6 ? 'happy' : 'sad' });
    if (score >= 3.6) this.sounds.push('happy');
    this.rememberGuests(g, score);
    if (this.advanceWant(g)) return;   // 住店客：吃完这摊去睡觉
    g.state = 'leaving';
    g.leaveT = 0;
    for (const m of g.members) {
      if (m.seatId) this.seatOwner.delete(m.seatId);
      m.seatId = 0;
      const e = this.tavern.entrance();
      m.path = this.tavern.path(Math.round(m.x), Math.round(m.y), e.x, e.y) || [];
    }
    this.toast(`结账 +${revenue}（评价 ${score.toFixed(1)}★）`);
    this.sounds.push('coin');
  }

  /** 设施型需求结算：住宿/泡汤/台球按人头收费，设施留下需要整理的状态 */
  payFacility(g       )       {
    this.failOpenChallenges(g);
    const w = wantById(g.want);
    const f = this.tavern.furnById(g.facId);
    const room = f ? this.tavern.roomOfFurn(f) : null;
    const q = f ? f.quality : 1;
    const bedMult = f ? (BED_PRICE_MULT[f.kind] || 1) : 1;
    const revenue = Math.round((w.price || 30) * bedMult * this.econ.markup * g.size * (1 + (q - 1) * 0.3));
    this.econ.coins += revenue;
    this.econ.revenue += revenue;
    this.econ.served += g.size;
    this.recordDaySale('facilitySales', g.want, w.name, g.size, revenue);
    if (this.dayReport && f) {
      const row = this.dayReport.facilityByFurn[f.id] || { count: 0, revenue: 0 };
      row.count += g.size; row.revenue += revenue;
      this.dayReport.facilityByFurn[f.id] = row;
    }
    const hygiene = clamp(((room ? room.clean : 60) / 20) * (2 - g.hygieneSens * 0.5), 1, 5);
    const charm = room ? this.charmIn(room.id) : 0;
    const comfort = clamp(1.7 + q * 0.75 + (room ? room.quality * 0.4 : 0) + charm, 1, 5);
    const facilityService = SPECIAL_FACILITY_WANTS.has(g.want);
    const serviceSkill = facilityService ? (g.facilityAttendantSkill || 0) : this.bestSkill('serve').value;
    const serveScore = clamp(2 + serviceSkill / 34 + (g.greeted ? 0.5 : 0)
      + Math.min(1, g.praised * 0.5) - Math.min(1.5, g.mocked * 0.75), 1, 5);
    if (this.dayReport && f) {
      const row = this.dayReport.facilityByFurn[f.id];
      row.qualityTotal = (row.qualityTotal || 0) + serveScore * g.size;
      row.qualitySamples = (row.qualitySamples || 0) + g.size;
    }
    const spectacle = clamp(1.8 + this.tavern.rooms.length * 0.25 + this.charmTotal() * 0.2, 1, 5);
    const waitPen = clamp(3 + (g.patience / g.maxPatience) * 2.4, 1, 5);
    const score = (comfort * 1.5 + hygiene * 1.2 + waitPen + serveScore * 0.8 + spectacle * 0.5) / 5.0;
    this.scores.push(score);
    this.recordScoreParts({ quality: comfort, wait: waitPen, service: serveScore, hygiene, comfort, spectacle });
    if (f) {
      f.dirty = (f.dirty || 0) + 1;                 // 用完要整理，整理前不再接客
      if (facilityService) this.pendingFacilityReset.set(f.id, { wantId: g.want, groupId: g.id });
    }
    if (room) room.clean = clamp(room.clean - g.size * 0.7, 0, 100);
    const m0 = g.members[0];
    const dx = Math.round(m0.x), dy = Math.round(m0.y);
    // 设施本身仍需要整理，但地面污渍只按使用人数概率产生；低频客房不会凭空变脏。
    if (this.rng.chance(Math.min(0.28, 0.05 + g.size * 0.06))) {
      if (this.tavern.walkable(dx, dy)) this.tavern.addDirt(dx, dy);
      else if (room) { const t = this.tavern.freeTileIn(room, this.rng.int(70)); this.tavern.addDirt(t.x, t.y); }
    }
    this.fx.push({ x: m0.x, y: m0.y, t: 0.8, kind: score >= 3.6 ? 'happy' : 'sad' });
    if (score >= 3.6) this.sounds.push('happy');
    this.rememberGuests(g, score);
    this.releaseFacility(g);
    if (this.advanceWant(g)) return;   // 住店客：玩完这摊去睡觉
    g.state = 'leaving';
    g.leaveT = 0;
    const e = this.tavern.entrance();
    for (const m of g.members) {
      m.path = this.tavern.path(Math.round(m.x), Math.round(m.y), e.x, e.y) || [];
    }
    this.toast(`${w.name} +${revenue}（评价 ${score.toFixed(1)}★）`);
    this.sounds.push('coin');
  }

  // ---------- 店主互动 ----------

  /** 夸员工：好感/士气大涨，短时干活更快 */
  praiseStaff(id        )         {
    const s = this.staff.find((x) => x.id === id);
    if (!s || s.isOwner) return '';
    const fresh = s.affCd <= 0;
    if (!fresh) {
      const line = '刚夸过啦，我还没干出新活儿呢。';
      s.bubble = { text: line, t: 3.2 };
      this.sounds.push('clean');
      return line;
    }
    const gain = Math.max(1.2, 5.4 * (1 - s.aff / 115));
    s.aff = clamp(s.aff + gain, 0, 100);
    s.needs.morale = clamp(s.needs.morale + 9, 0, 100);
    s.needs.stress = clamp(s.needs.stress - 8, 0, 100);
    s.boostT = Math.max(s.boostT || 0, 14);
    s.affCd = 34;
    s.chats++;
    const lines = ['嘿嘿，那我可要更卖力了。', '老板你今天嘴甜得像掺了蜜。', '记着这句啊，年底涨工钱。', '……谢、谢谢。（耳朵红了）'];
    const line = lines[this.rng.int(lines.length)];
    s.bubble = { text: line, t: 3.2 };
    s.chatLog.unshift(`第${this.econ.day}天·夸奖：${line}`);
    if (s.chatLog.length > 6) s.chatLog.pop();
    this.fx.push({ kind: 'heart', x: s.x, y: s.y - 0.6, t: 0.9 });
    this.sounds.push('happy');
    return line;
  }

  /** 贬低员工：好感掉、压力涨，但短时被吓得手脚更快 */
  scoldStaff(id        )         {
    const s = this.staff.find((x) => x.id === id);
    if (!s || s.isOwner) return '';
    s.aff = clamp(s.aff - (s.traits.includes('grumpy') ? 9 : 6), 0, 100);
    s.needs.morale = clamp(s.needs.morale - 10, 0, 100);
    s.needs.stress = clamp(s.needs.stress + 11, 0, 100);
    s.boostT = Math.max(s.boostT || 0, 16);
    const lines = ['……知道了。（手在抖）', '我哪儿做错了？我改。', '呵，这话我记住了。', '要不你自己来端？'];
    const line = lines[this.rng.int(lines.length)];
    s.bubble = { text: line, t: 3.4 };
    s.chatLog.unshift(`第${this.econ.day}天·被贬低：${line}`);
    if (s.chatLog.length > 6) s.chatLog.pop();
    this.fx.push({ kind: 'sad', x: s.x, y: s.y - 0.6, t: 0.9 });
    this.sounds.push('angry');
    return line;
  }

  /** 催一催：不伤好感，只是短时提速（压力小涨） */
  urgeStaff(id        )         {
    const s = this.staff.find((x) => x.id === id);
    if (!s || s.isOwner) return '';
    s.boostT = Math.max(s.boostT || 0, 12);
    s.needs.stress = clamp(s.needs.stress + 4, 0, 100);
    const line = ['来了来了！', '手上这单马上好。', '别催，越催越乱……不过好吧。'][this.rng.int(3)];
    s.bubble = { text: line, t: 2.6 };
    this.sounds.push('chime');
    return line;
  }

  groupOfGuest(guestId        )               {
    const gu = this.guests.find((x) => x.id === guestId);
    if (!gu) return null;
    return this.groups.find((x) => x.id === gu.groupId) || null;
  }

  /** 夸客人：耐心回一截，这单评价加分 */
  praiseGuest(groupId        )         {
    const g = this.groups.find((x) => x.id === groupId);
    if (!g) return '';
    if (g.intCd > 0) return '（刚说过话，客人正忙着回味）';
    g.intCd = 26;
    g.praised++;
    g.greeted = true;
    g.patience = clamp(g.patience + g.maxPatience * 0.22, 0, g.maxPatience);
    for (const m of g.members) { m.mood = Math.min(1.4, m.mood + 0.2); m.aff = clamp((m.aff || 0) + 3, -100, 100); }
    const line = ['「您这身行头，隔着三个位面都亮眼。」客人笑得合不上嘴。',
      '「稀客稀客，今天这桌算我招待。」客人心情大好。',
      '「您上次说的那个星域故事，我还念着呢。」客人乐了。'][this.rng.int(3)];
    this.fx.push({ kind: 'heart', x: g.members[0].x, y: g.members[0].y - 0.6, t: 0.9 });
    this.sounds.push('happy');
    return line;
  }

  /** 贬低客人：耐心掉、评价扣，但偶尔有怪客反而吃这一套 */
  mockGuest(groupId        )         {
    const g = this.groups.find((x) => x.id === groupId);
    if (!g) return '';
    if (g.intCd > 0) return '（刚说过话，先缓缓）';
    g.intCd = 26;
    if (this.rng.chance(0.25)) {                 // 抖 M 客：越贬越上头
      g.praised++;
      g.patience = clamp(g.patience + g.maxPatience * 0.15, 0, g.maxPatience);
      this.fx.push({ kind: 'heart', x: g.members[0].x, y: g.members[0].y - 0.6, t: 0.9 });
      this.sounds.push('happy');
      for (const m of g.members) m.aff = clamp((m.aff || 0) + 2, -100, 100);
      return '「……再骂一句。」这位客人似乎很受用，加点了一份。';
    }
    g.mocked++;
    g.patience = clamp(g.patience - g.maxPatience * 0.2, 0, g.maxPatience);
    for (const m of g.members) { m.mood = Math.max(0.4, m.mood - 0.25); m.aff = clamp((m.aff || 0) - 5, -100, 100); }
    this.fx.push({ kind: 'sad', x: g.members[0].x, y: g.members[0].y - 0.6, t: 0.9 });
    this.sounds.push('angry');
    return ['「您这吃相，够写进志怪了。」客人脸色发青。',
      '「排队都排不利索，怎么修的仙？」客人差点掀桌。'][this.rng.int(2)];
  }

  /** 请一杯：花钱换耐心与评价 */
  treatGuest(groupId        )         {
    const g = this.groups.find((x) => x.id === groupId);
    if (!g) return '';
    const cost = 12 + g.size * 6;
    if (this.econ.coins < cost) return '界币不够，请不起这一轮。';
    this.econ.coins -= cost;
    g.intCd = 18;
    g.praised++;
    g.greeted = true;
    g.patience = clamp(g.patience + g.maxPatience * 0.4, 0, g.maxPatience);
    for (const m of g.members) { m.mood = Math.min(1.5, m.mood + 0.3); m.aff = clamp((m.aff || 0) + 4, -100, 100); }
    this.fx.push({ kind: 'heart', x: g.members[0].x, y: g.members[0].y - 0.4, t: 0.9 });
    this.sounds.push('coin');
    return `店主请了这桌一轮（-${cost}）：客人举杯，耐心回了一大截。`;
  }

  staffBondInteraction(id, kind) {
    const s = this.staff.find((person) => person.id === id);
    if (!s || s.isOwner) return '';
    const required = { care: 25, dreams: 45, secret: 65 }[kind] || 999;
    if (s.aff < required) return `关系还没到能谈这些的程度（需要好感 ${required}）。`;
    if (s.affCd > 0) return '刚进行过深入交流，先给彼此一点时间。';
    const lines = {
      care: `${s.name}放松了肩膀，认真说起最近最累的一件事。你听完后替其调整了几处工作安排。`,
      dreams: `${s.name}谈起尚未实现的愿望：有一天想独当一面，把自己的招牌留在万界旅人的记忆里。`,
      secret: `${s.name}犹豫许久，终于告诉你一段从未写进入职档案的往事。你答应替其保守秘密。`,
    };
    const line = lines[kind];
    s.aff = clamp(s.aff + (kind === 'care' ? 2.4 : 1.6), 0, 100);
    s.needs.stress = clamp(s.needs.stress - (kind === 'care' ? 10 : 5), 0, 100);
    s.needs.morale = clamp(s.needs.morale + (kind === 'dreams' ? 9 : 5), 0, 100);
    if (kind === 'secret' && !s.background) s.background = `${s.name}曾在故乡卷入一场改变人生的事件，因此离开熟悉的世界，在多元便携旅店寻找重新开始的机会。`;
    s.affCd = 36;
    s.chatLog.unshift(`第${this.econ.day}天·深入交流：${line}`);
    if (s.chatLog.length > 8) s.chatLog.pop();
    s.bubble = { text: kind === 'care' ? '谢谢你愿意听。' : kind === 'dreams' ? '说出来轻松多了。' : '只告诉你。', t: 3.2 };
    this.fx.push({ kind: 'heart', x: s.x, y: s.y - .6, t: .9 }); this.sounds.push('happy');
    return line;
  }

  guestBondInteraction(groupId, guestId, kind) {
    const g = this.groups.find((group) => group.id === groupId);
    const guest = g?.members.find((person) => person.id === guestId);
    const profile = guest?.regularId ? this.regulars.find((row) => row.id === guest.regularId) : null;
    if (!g || !guest) return '';
    if (g.intCd > 0) return '客人正在消化刚才的话题。';
    let line = '';
    if (kind === 'journey') line = `${guest.name}说起一路经过的位面：有倒悬的海、有整夜不熄的集市，也有只卖回忆的旧货铺。`;
    else if (kind === 'revisit' && profile?.visits >= 2) line = `${guest.name}笑着提起上次来店时的服务与对话，还准确记得当时坐过的位置。`;
    else if (kind === 'commission' && profile?.offer) {
      g.offerAccepted = true;
      line = `${guest.name}把专属委托交给你：「${profile.offer.text}」。完成得好，预计额外回报 ${profile.offer.reward} 界币。`;
    } else return '还没有可以继续的话题。';
    g.intCd = 22;
    guest.aff = clamp((guest.aff || 0) + (kind === 'commission' ? 4 : 2), -100, 100);
    g.patience = clamp(g.patience + g.maxPatience * .12, 0, g.maxPatience);
    guest.bubble = { text: kind === 'commission' ? '这件事就拜托店主了。' : '你还记得，真好。', t: 3.2 };
    this.fx.push({ kind: 'heart', x: guest.x, y: guest.y - .6, t: .9 }); this.sounds.push('happy');
    return line;
  }

  // ---------- 员工 ----------
  /** 家具覆盖、路径碰撞或旧存档坐标异常时，把角色送到最近的合法站立格。 */
  rescueActor(a, announce = false) {
    const target = a.path?.length ? a.path[a.path.length - 1] : null;
    const safe = this.tavern.nearestFreeTile(a.x, a.y);
    if (!safe) return false;
    a.x = safe.x; a.y = safe.y;
    a.path = target ? (this.tavern.path(safe.x, safe.y, target.x, target.y) || []) : [];
    a.pose = a.path.length ? 'walk' : 'idle';
    this.navigationWatch.delete(a);
    if (announce) a.bubble = { text: '绕出来了', t: 1.6 };
    return true;
  }

  rescueTrappedActors(announce = false) {
    const actors = [...this.staff, ...this.groups.flatMap((group) => group.members || []), ...this.guests];
    const seen = new Set();
    let rescued = 0;
    for (const actor of actors) {
      if (!actor || seen.has(actor) || this.tavern.walkable(Math.round(actor.x), Math.round(actor.y))) continue;
      seen.add(actor);
      if (this.rescueActor(actor, announce)) rescued++;
    }
    return rescued;
  }

  moveActor(a                                                                                     , dt        , speed        )       {
    if (!this.tavern.walkable(Math.round(a.x), Math.round(a.y))) this.rescueActor(a, true);
    if (!a.path.length) { this.navigationWatch.delete(a); if (a.pose === 'walk') a.pose = 'idle'; return; }
    const beforeX = a.x, beforeY = a.y;
    const n = a.path[0];
    const dx = n.x - a.x, dy = n.y - a.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.06) { a.x = n.x; a.y = n.y; a.path.shift(); return; }
    // 搬运 40 等于原始默认移速；每高 1 点在原速度上增加 1%，低于 40 同比例降低。
    const carry = Number(a?.skills?.carry);
    const carryMultiplier = Number.isFinite(carry) ? clamp(1 + (carry - 40) * .01, .4, 1.8) : 1;
    const v = Math.min(speed * carryMultiplier * dt, d);
    const nx = a.x + (dx / d) * v;
    const ny = a.y + (dy / d) * v;
    if (this.tavern.bodyFree(a.x, a.y, nx, ny, 0.14, false)) {
      a.x = nx;
      a.y = ny;
    } else {
      // 路径格合法但角色偏离了格心时，先回到当前格心再过门，避免斜切墙角。
      const cx = Math.round(a.x), cy = Math.round(a.y);
      const cdx = cx - a.x, cdy = cy - a.y;
      const cd = Math.hypot(cdx, cdy);
      if (cd > 0.01) {
        const cv = Math.min(v, cd);
        const rx = a.x + (cdx / cd) * cv, ry = a.y + (cdy / cd) * cv;
        if (this.tavern.bodyFree(a.x, a.y, rx, ry, 0.14, false)) { a.x = rx; a.y = ry; }
      }
    }
    a.pose = 'walk';
    if (Math.abs(dx) > Math.abs(dy)) a.dir = dx > 0 ? 3 : 1; else a.dir = dy > 0 ? 0 : 2;
    const moved = Math.hypot(a.x - beforeX, a.y - beforeY);
    if (moved > 0.002) this.navigationWatch.delete(a);
    else {
      const stuckFor = (this.navigationWatch.get(a) || 0) + dt;
      if (stuckFor >= 1.5) this.rescueActor(a, true); else this.navigationWatch.set(a, stuckFor);
    }
  }

  staffSpeed(s       )         {
    let v = 2.5 + s.app.ht * 0.12;
    if (s.traits.includes('lazy')) v *= 0.88;
    if (s.needs.stamina < 30) v *= 0.75;
    return v;
  }

  actSpeed(s       , skill          )         {
    let m = (0.55 + s.skills[skill] / 130) * (1 + s.aff / 400);
    if ((s.boostT || 0) > 0) m *= 1.35;
    if (s.traits.includes('fast')) m *= 1.15;
    if (s.traits.includes('perfectionist')) m *= 0.88;
    if (skill === 'clean' && s.traits.includes('clean_freak')) m *= 1.25;
    if ((skill === 'clean' || skill === 'carry') && s.traits.includes('organized')) m *= 1.1;
    if ((s.prio || 0) >= 2 && s.traits.includes('competitive')) m *= 1.08;
    if (s.perks?.includes('warm_welcome') && skill === 'serve') m *= 1.12;
    if (s.perks?.includes('swift_hands') && skill === 'carry') m *= 1.12;
    if (s.perks?.includes('spotless_route') && skill === 'clean') m *= 1.18;
    if (s.perks?.includes('artisan') && (skill === 'cook' || skill === 'mix')) m *= 1.1;
    if (s.needs.stamina < 25) m *= 0.8;
    return m;
  }

  tickStaff(dt        )       {
    this.stationOwner.clear();
    for (const worker of this.staff) for (const id of worker.task?.stationIds || []) if (!this.stationOwner.has(id)) this.stationOwner.set(id, worker.task.key);
    const staffOrder = [...this.staff].sort((a, b) => (b.prio || 0) - (a.prio || 0) || a.id - b.id);
    const claimed = new Set        ();
    const taskProgress = (s       )         => !s.task ? -1 : (s.task.i || 0) * 10
      + (s.actTotal > 0 && s.actT > 0 ? 1 - s.actT / s.actTotal : 0) + (s.carry ? 0.2 : 0);
    const ownerOrder = [...staffOrder].sort((a, b) => taskProgress(b) - taskProgress(a));
    // 旧状态里若两人持有同一任务，只保留进度更深的认领者；进度相同才看抢单优先级。
    // 被释放的人会在同一帧从 open 中领取另一项工作。
    for (const s of ownerOrder) {
      const key = s.task && s.task.key;
      if (!key) continue;
      if (!claimed.has(key)) { claimed.add(key); continue; }
      s.task = null;
      s.path = [];
      s.carry = null;
      s.actT = 0;
      s.actTotal = 0;
      s.note = '';
      s.pose = 'idle';
      s.bubble = { text: '这活有人接了，我换一项', t: 2 };
    }
    const open = this.buildTasks(claimed);
    for (const s of staffOrder) {
      // 需求
      const work = s.task ? 1 : 0.35;
      const drain = (0.42 * work) * (s.traits.includes('diligent') ? 0.8 : 1);
      s.needs.stamina = clamp(s.needs.stamina - drain * dt, 0, 100);
      s.needs.hunger = clamp(s.needs.hunger + 0.12 * dt, 0, 100);
      const stressUp = (this.groups.filter((g) => g.state === 'wait').length * 0.05 + (s.needs.stamina < 25 ? 0.12 : 0.02))
        * (s.traits.includes('grumpy') ? 1.5 : 1) * (s.traits.includes('patient') ? 0.85 : 1) * (1 - s.aff / 300);
      if (s.affCd > 0) s.affCd = Math.max(0, s.affCd - dt);
      if ((s.boostT || 0) > 0) s.boostT = Math.max(0, (s.boostT          ) - dt);
      s.needs.stress = clamp(s.needs.stress + stressUp * dt, 0, 100);
      if (this.manualOwner && s.isOwner) { this.driveOwner(s, dt); continue; }
      // 疲惫员工先休息再抢下一项工作。前台任务近乎连续，若在 assign() 之后判断会永远轮不到休息。
      if (!s.task && s.needs.stamina < 28) {
        s.path = [];                 // 取消回岗位的待命路径，立即改道去自己的休息室
        this.tryRest(s);
      }
      if (!s.task && open.length && s.needs.stamina >= 18) this.assign(s, open);
      if (s.task) this.runTask(s, dt);
      else {
        // 回到岗位房间 / 低体力去休息室
        if (s.job === 'front' && s.needs.stamina >= 22) this.standByDesk(s);
        else if (s.needs.stamina < 22) this.tryRest(s);
        else if (!s.path.length && this.rng.chance(0.006)) {
          const room = s.roomId ? this.tavern.roomById(s.roomId) : this.tavern.rooms[this.rng.int(this.tavern.rooms.length)];
          if (room) {
            const t = this.tavern.freeTileIn(room, this.rng.int(50));
            s.path = this.tavern.path(Math.round(s.x), Math.round(s.y), t.x, t.y) || [];
          }
        }
      }
      this.moveActor(s, dt, this.staffSpeed(s));
      if (s.pose !== 'walk' && !s.task) s.pose = 'idle';
    }
  }

  /** 前台伙计空闲时回柜台站岗（没有柜台就守在门厅入口） */
          standByDesk(s       )       {
    if (s.path.length) return;
    const desk = this.tavern.furnsOfKind('desk')[0];
    let spot                                  = null;
    if (desk) {
      // 站柜台里侧（服务面的反方向），客人在外侧
      const [dx, dy] = dirDelta(desk.dir);
      const back = this.tavern.furnTiles(desk).map((t) => ({ x: t.x - dx, y: t.y - dy }));
      spot = this.tavern.standTileNear(back) || this.tavern.standTileNear(this.tavern.useTiles(desk));
    }
    if (!spot) {
      const e = this.tavern.entrance();
      spot = this.tavern.walkable(e.x, e.y + 1) ? { x: e.x, y: e.y + 1 } : null;
    }
    if (!spot) return;
    if (Math.hypot(s.x - spot.x, s.y - spot.y) < 0.8) { s.dir = 0; return; }   // 面朝客人（正面）
    if (this.rng.chance(0.05)) s.path = this.tavern.path(Math.round(s.x), Math.round(s.y), spot.x, spot.y) || [];
  }

  /** 玩家直控：逐轴推进，撞墙只挡住那一轴（斜向贴墙才不会卡住） */
          driveOwner(s       , dt        )       {
    s.task = null; s.path = [];
    const v = this.manualVec;
    const len = Math.hypot(v.x, v.y);
    if (len < 0.01) { s.pose = 'idle'; return; }
    const R = 0.16;
    const step = this.staffSpeed(s) * 1.2 * dt;
    // 站在椅子/床/汤池上时先放宽，否则玩家会被自己脚下的家具锁死
    const strict = this.tavern.bodyFree(s.x, s.y, s.x, s.y, R, true);
    // ① 先沿"前进方向的垂直轴"向格心回正：门只有一格宽，斜着挤门口时不先对准就永远进不去
    //    朝自己所在格的中心走一定还在同一格内，不需要再判碰撞
    const snap = step * 1.6;
    if (Math.abs(v.x) > 0.01) {
      const cy = Math.round(s.y), d = cy - s.y;
      if (Math.abs(d) > 0.02) s.y += Math.sign(d) * Math.min(Math.abs(d), snap);
    }
    if (Math.abs(v.y) > 0.01) {
      const cx = Math.round(s.x), d = cx - s.x;
      if (Math.abs(d) > 0.02) s.x += Math.sign(d) * Math.min(Math.abs(d), snap);
    }
    // ② 再逐轴推进：撞墙只挡住那一轴，斜向贴墙不会整个卡死
    const dx = (v.x / len) * step, dy = (v.y / len) * step;
    if (Math.abs(v.x) > 0.01 && this.tavern.bodyFree(s.x, s.y, s.x + dx, s.y, R, strict)) s.x += dx;
    if (Math.abs(v.y) > 0.01 && this.tavern.bodyFree(s.x, s.y, s.x, s.y + dy, R, strict)) s.y += dy;
    s.pose = 'walk';
    if (Math.abs(v.x) > Math.abs(v.y)) s.dir = v.x > 0 ? 3 : 1; else s.dir = v.y > 0 ? 0 : 2;
  }

  /** 该员工可以用的休息家具：自己卧室里的，或还空着的休息室里的（绝不进别人卧室） */
          restFurnsFor(s       )         {
    return this.tavern.furns.filter((f) => {
      if (f.kind !== 'bunk' && f.kind !== 'couch') return false;
      const r = this.tavern.roomOfFurn(f);
      return !!r && r.kind === 'lounge' && (!r.occupant || r.occupant === s.id);
    });
  }

          tryRest(s       )       {
    if (s.path.length) return;
    const usable = this.restFurnsFor(s);
    const bunks = usable.filter((f) => f.kind === 'bunk');
    const spots = bunks.length ? bunks : usable;
    if (!spots.length) return;
    const c = spots[this.rng.int(spots.length)];
    const onBunk = c.kind === 'bunk';
    const dur = onBunk ? (furnDef('bunk').time            )[c.quality - 1] : 14;
    const stand = this.tavern.standTileNear(this.tavern.useTiles(c));
    if (!stand) return;
    s.task = {
      kind: 'rest', key: 'rest:' + s.id, label: onBunk ? '睡一觉' : '休息', i: 0,
      steps: [
        { tx: stand.x, ty: stand.y },
        {
          dur, label: onBunk ? '睡一觉' : '休息', skill: 'calm', done: () => {
            s.needs.stamina = clamp(s.needs.stamina + (onBunk ? 85 : 55), 0, 100);
            s.needs.stress = clamp(s.needs.stress - (onBunk ? 42 : 25), 0, 100);
            if (onBunk) s.needs.morale = clamp(s.needs.morale + 4, 0, 100);
            s.bubble = { text: onBunk ? 'Zzz……' : '呼——', t: 2 };
          },
        },
      ],
    };
  }

  jobFit(kind        , job     )         {
    const table                                               = {
      greet: { front: 90, greeter: 60, free: 25, server: 15 },
      seat: { front: 92, greeter: 55, server: 25, free: 18 },
      checkout: { front: 95, server: 35, greeter: 18, free: 15 },
      facility: { attendant: 90, cleaner: 25, porter: 20, free: 15, front: 8, greeter: 8 },
      tidy: { cleaner: 60, attendant: 45, free: 25, porter: 18, server: 10, greeter: 8 },
      order: { server: 55, greeter: 25, free: 25, bartender: 10 },
      cook: { cook: 60, free: 18 },
      mix: { bartender: 60, cook: 20, free: 15 },
      serve: { server: 55, free: 22, greeter: 12, porter: 15 },
      bus: { cleaner: 40, porter: 45, server: 25, free: 20 },
      clean: { cleaner: 60, porter: 20, free: 18 },
    };
    const t = table[kind] || {};
    const v = t[job];
    return v === undefined ? -30 : v;
  }

  dutyFit(kind, staff) {
    if (!staff || staff.dutyMode !== 'manual') return this.jobFit(kind, staff?.job || 'free');
    const duty = DUTY_TASK[kind];
    if (!duty) return this.jobFit(kind, staff.job);
    const priority = clamp(Math.round(Number(staff.dutyPriorities?.[duty]) || 0), 0, 4);
    return priority <= 0 ? -30 : 15 + priority * 25;
  }

  /** 只读的工作积压快照，供 UI 展示；不会像 buildTasks 那样改变订单状态。 */
  workQueue() {
    const byKey = new Map();
    const add = (key, kind, label, age = 0, roomId = null) => {
      if (!key || byKey.has(key)) return;
      const owner = this.staff.find((s) => s.task && s.task.key === key);
      const resolvedRoomId = owner?.task?.roomId || roomId;
      const eligible = this.staff.filter((s) => this.dutyFit(kind, s) >= 0
        && (!s.roomId || s.roomMode !== 'strict' || !resolvedRoomId || s.roomId === resolvedRoomId));
      const room = resolvedRoomId ? this.tavern.roomById(resolvedRoomId) : null;
      byKey.set(key, {
        key, kind, label, age: Math.max(0, age),
        room: room ? (ROOM_LABEL[room.kind] || room.kind) : '',
        staff: owner ? owner.name : '',
        status: owner ? (owner.path && owner.path.length ? '前往中' : '处理中') : '待领取',
        reason: owner ? '' : eligible.length ? '等待员工空闲' : (room ? '没有覆盖该区域的匹配岗位' : '没有匹配岗位'),
      });
    };

    for (const s of this.staff) if (s.task) add(s.task.key, s.task.kind, s.task.label || '工作');
    for (const g of this.groups) {
      if (g.state === 'wait' && !g.greeted) add(`greet:${g.id}`, 'greet', '招呼客人', this.dayT - (g.enterT || this.dayT));
      if (g.state === 'wait' && g.greeted) add(`seat:${g.id}`, 'seat', '引导入座', this.dayT - (g.enterT || this.dayT));
      const facility = g.facId ? this.tavern.furnById(g.facId) : null;
      const facilityRoomId = facility ? this.tavern.roomOfFurn(facility)?.id || null : null;
      if (g.state === 'facility_prepare') add(`facility-prepare:${g.id}`, 'facility', '等待准备设施', this.dayT - (g.enterT || this.dayT), facilityRoomId);
      if (g.state === 'facility_escort') add(`facility-escort:${g.id}`, 'seat', '等待迎宾带位', this.dayT - (g.enterT || this.dayT));
      if (g.state === 'toFac') add(`facility-escort:${g.id}`, 'seat', '带位中', this.dayT - (g.enterT || this.dayT), facilityRoomId);
      if (g.state === 'facility_waiting_attend') add(`facility-attend:${g.id}`, 'facility', '等待场务照看', this.dayT - (g.enterT || this.dayT), facilityRoomId);
      if (g.state === 'seated' && !g.orderId) add(`order:${g.id}`, 'order', '点单', this.dayT - (g.enterT || this.dayT));
      if (g.state === 'checkout') add(`checkout:${g.id}`, 'checkout', '前台结账', this.dayT - (g.checkoutT || this.dayT));
    }
    const challengeKind = { cook: 'cook', mix: 'mix', serve: 'order', clean: 'clean', carry: 'bus', calm: 'greet' };
    for (const challenge of this.facilityChallenges) if (challenge.state === 'open') {
      add(`challenge:${challenge.id}`, challengeKind[challenge.skill] || 'greet', `⚠ ${challenge.label}`, challenge.age || 0);
    }
    for (const o of this.orders) {
      if (o.stage === 'queued') add(`cook:${o.id}`, this.dishOf(o.dishId).drink ? 'mix' : 'cook', this.dishOf(o.dishId).drink ? '调酒' : '烹饪', this.dayT - (o.t0 || this.dayT));
      if (o.stage === 'ready') add(`serve:${o.id}`, 'serve', '上菜', this.dayT - (o.t0 || this.dayT));
    }
    for (const f of this.tavern.furns) {
      if (f.kind === 'table' && (f.dirty || 0) > 0) add(`bus:${f.id}`, 'bus', '收台');
      if (['bed', 'doublebed', 'kingbed', 'pool', 'billiardtable', 'screen', 'fountain', 'telescope', 'arcadem', 'cauldron'].includes(f.kind)
        && (f.dirty || 0) > 0 && !this.facOwner.has(f.id)) {
        const roomId = this.tavern.roomOfFurn(f)?.id || null;
        add(`tidy:${f.id}`, FACILITY_FURN_KINDS.has(f.kind) ? 'facility' : 'tidy', '整理设施', 0, roomId);
      }
    }
    for (const d of this.tavern.dirt) add(`clean:${d.x},${d.y}`, 'clean', '清洁');
    return [...byKey.values()].sort((a, b) => (a.staff ? 1 : 0) - (b.staff ? 1 : 0) || b.age - a.age || a.label.localeCompare(b.label, 'zh-CN'));
  }

  facilityStatus(f) {
    if (!f || !FACILITY_FURN_KINDS.has(f.kind)) return null;
    const groupId = this.facOwner.get(f.id);
    const group = groupId ? this.groups.find((g) => g.id === groupId) : null;
    const labels = {
      facility_prepare: '等待准备', facility_escort: '等待带位', toFac: '带位中',
      facility_waiting_attend: '等待照看', using: '使用中',
    };
    const wantId = group?.want || this.pendingFacilityReset.get(f.id)?.wantId;
    const sale = wantId ? this.dayReport?.facilitySales?.[wantId] : null;
    const ownSale = this.dayReport?.facilityByFurn?.[f.id];
    return {
      state: (f.dirty || 0) > 0 ? '待整理' : group ? (labels[group.state] || group.state) : '可用',
      uses: ownSale?.count || 0,
      revenue: ownSale?.revenue || 0,
      quality: ownSale?.qualitySamples ? ownSale.qualityTotal / ownSale.qualitySamples
        : group?.facilityAttendantSkill ? clamp(2 + group.facilityAttendantSkill / 34, 1, 5) : null,
    };
  }

  /** 正常迎宾任务和超时兜底共用；重复完成不会重复增加耐心。 */
  completeGreeting(g, staff = null) {
    if (!g || g.state !== 'wait' || g.greeted) return false;
    const guest = g.members[0];
    g.greeted = true;
    g.greetWaitT = 0;
    g.patience = Math.min(g.maxPatience, g.patience + g.maxPatience * 0.3);
    for (const member of g.members) member.mood = Math.min(1.4, member.mood + 0.2);
    if (guest) this.fx.push({ x: guest.x, y: guest.y, t: 0.6, kind: 'serve' });
    if (staff) staff.bubble = { text: '欢迎光临！', t: 1.8 };
    this.tryPlace(g);
    return true;
  }

  buildTasks(claimed             )         {
    const out         = [];
    // 客人已离店的订单作废，避免厨房白忙、出餐台被废盘占死
    for (const o of this.orders) {
      const g = this.groups.find((x) => x.id === o.groupId);
      const gone = !g || g.state === 'leaving';
      if (!gone) continue;
      if (o.stage === 'queued' && !claimed.has('cook:' + o.id)) { o.stage = 'void'; this.econ.wasted = (this.econ.wasted || 0) + 1; }
      else if (o.stage === 'ready' && !claimed.has('serve:' + o.id)) {
        const pf = this.tavern.furnById(o.passId);
        if (pf) pf.plates = Math.max(0, (pf.plates || 0) - 1);
        o.stage = 'void';
        this.econ.wasted = (this.econ.wasted || 0) + 1;
      }
    }
    const challengeKind = { cook: 'cook', mix: 'mix', serve: 'order', clean: 'clean', carry: 'bus', calm: 'greet' };
    for (const challenge of this.facilityChallenges) {
      if (challenge.state !== 'open') continue;
      const key = `challenge:${challenge.id}`;
      if (claimed.has(key)) continue;
      const group = this.groups.find((item) => item.id === challenge.groupId);
      const guest = group?.members.find((item) => item.id === challenge.guestId) || group?.members[0];
      if (!group || !guest || group.state === 'leaving') { this.finishFacilityChallenge(challenge, null, false); continue; }
      const stand = this.nearStand(Math.round(guest.x), Math.round(guest.y));
      if (!stand) continue;
      out.push({
        kind: challengeKind[challenge.skill] || 'greet', key, label: `⚠ ${challenge.label}`, i: 0,
        steps: [{ tx: stand.x, ty: stand.y }, { dur: 2.8, label: challenge.label, skill: challenge.skill, done: (staff) => {
          if (challenge.state !== 'open') return;
          const chance = clamp(Math.round(55 + (staff.skills[challenge.skill] - challenge.difficulty) * 1.15), 8, 96);
          this.finishFacilityChallenge(challenge, staff, this.rng.next() * 100 <= chance);
        } }],
      });
    }
    // 迎宾并尝试立即引座；满座时先安抚，空位出现后再由前台执行引座任务。
    for (const g of this.groups) {
      if (g.state !== 'wait' || g.greeted) continue;
      const key = 'greet:' + g.id;
      if (claimed.has(key)) continue;
      const m = g.members[0];
      if (m.path.length) continue;                       // 等他们站定再上去招呼
      const stand = this.nearStand(Math.round(m.x), Math.round(m.y));
      if (!stand) continue;
      out.push({
        kind: 'greet', key, label: '招呼客人', i: 0,
        steps: [{ tx: stand.x, ty: stand.y }, {
          dur: 2.0, label: '招呼客人', skill: 'serve', done: (staff) => { this.completeGreeting(g, staff); },
        }],
      });
    }
    // 已迎宾但之前满座：有位置时由前台再次上前引导，客人不会自行瞬移找桌。
    for (const g of this.groups) {
      if (g.state !== 'wait' || !g.greeted) continue;
      const key = 'seat:' + g.id;
      if (claimed.has(key)) continue;
      if (!this.hasPlace(g)) continue;
      const m = g.members[0];
      if (m.path.length) continue;
      const stand = this.nearStand(Math.round(m.x), Math.round(m.y));
      if (!stand) continue;
      out.push({
        kind: 'seat', key, label: '引导入座', i: 0,
        steps: [{ tx: stand.x, ty: stand.y }, { dur: 1.2, label: '确认座位', skill: 'serve', done: () => {
          if (g.state === 'wait' && !this.tryPlace(g)) m.bubble = { text: '请再稍候片刻', t: 2 };
        } }],
      });
    }
    // 特殊设施必须经过准备、迎宾带路和场务照看，不能再由客人自助结算。
    for (const g of this.groups) {
      if (!SPECIAL_FACILITY_WANTS.has(g.want) || !g.facId) continue;
      const f = this.tavern.furnById(g.facId);
      const room = f ? this.tavern.roomOfFurn(f) : null;
      if (!f || !room) continue;
      if (g.state === 'facility_prepare') {
        const key = `facility-prepare:${g.id}`;
        if (claimed.has(key)) continue;
        const stand = this.facilitySpots(f)[0] || this.nearStand(f.x, f.y);
        if (!stand) continue;
        out.push({ kind: 'facility', key, label: `准备${wantById(g.want).name}设施`, roomId: room.id, i: 0, steps: [
          { tx: stand.x, ty: stand.y },
          { dur: 2.4, label: '准备设施', skill: this.facilitySkill(g.want), done: (staff) => {
            if (g.state !== 'facility_prepare') return;
            g.facilityPrepared = true;
            g.facilityService = { ...(g.facilityService || {}), prepared: true, preparedBy: staff.name };
            g.state = 'facility_escort';
          } },
        ] });
      } else if (g.state === 'facility_escort') {
        const key = `facility-escort:${g.id}`;
        if (claimed.has(key)) continue;
        const guest = g.members[0];
        const from = this.nearStand(Math.round(guest.x), Math.round(guest.y));
        const to = this.facilitySpots(f)[0] || this.nearStand(f.x, f.y);
        if (!from || !to) continue;
        const foyer = this.tavern.roomAt(Math.round(guest.x), Math.round(guest.y));
        out.push({ kind: 'seat', key, label: `带客前往${ROOM_LABEL[room.kind] || '设施区'}`, roomId: foyer?.id || null, i: 0, steps: [
          { tx: from.x, ty: from.y },
          { dur: 1.0, label: '说明路线', skill: 'serve', done: (staff) => {
            if (g.state !== 'facility_escort') return;
            g.facilityService = { ...(g.facilityService || {}), escorted: true, escortedBy: staff.name };
            this.startFacilityTravel(g);
          } },
          { tx: to.x, ty: to.y },
        ] });
      } else if (g.state === 'facility_waiting_attend') {
        const key = `facility-attend:${g.id}`;
        if (claimed.has(key)) continue;
        const stand = this.facilitySpots(f)[0] || this.nearStand(f.x, f.y);
        if (!stand) continue;
        out.push({ kind: 'facility', key, label: `照看${wantById(g.want).name}客人`, roomId: room.id, i: 0, steps: [
          { tx: stand.x, ty: stand.y },
          { dur: 1.8, label: '确认设施安全', skill: this.facilitySkill(g.want), done: (staff) => {
            if (g.state === 'facility_waiting_attend') this.beginFacilityUse(g, staff);
          } },
        ] });
      }
    }
    // 点单
    for (const g of this.groups) {
      if (g.state !== 'seated') continue;
      const key = 'order:' + g.id;
      if (claimed.has(key)) continue;
      const table = this.tavern.furnById(g.tableId);
      if (!table) continue;
      const stand = this.nearStand(table.x, table.y);
      if (!stand) continue;
      out.push({
        kind: 'order', key, label: '点单', i: 0,
        steps: [{ tx: stand.x, ty: stand.y }, {
          dur: 2.6, label: '点单', skill: 'serve', done: () => {
            if (g.state !== 'seated') return;
            const dish = this.chooseDish(g);
            if (!dish) { this.leave(g, '菜单上没有能做的菜'); return; }
            const o        = { id: this.id(), groupId: g.id, dishId: dish.id, stage: 'queued', t0: this.dayT, passId: 0, quality: 2, cookId: 0 };
            this.orders.push(o);
            g.orderId = o.id;
            g.state = 'ordered';
            g.orderedT = this.dayT;
          },
        }],
      });
    }
    // 制作
    for (const o of this.orders) {
      if (o.stage !== 'queued') continue;
      const key = 'cook:' + o.id;
      if (claimed.has(key)) continue;
      const dish = this.dishOf(o.dishId);
      const task = this.buildCookTask(o, dish, key);
      if (task) out.push(task);
    }
    // 食客用餐结束后由前台（或兼任服务员）到桌边结账，收入在任务完成时入账。
    for (const g of this.groups) {
      if (g.state !== 'checkout') continue;
      const key = 'checkout:' + g.id;
      if (claimed.has(key)) continue;
      const table = this.tavern.furnById(g.tableId);
      if (!table) continue;
      const stand = this.nearStand(table.x, table.y);
      if (!stand) continue;
      out.push({ kind: 'checkout', key, label: '前台结账', i: 0, steps: [
        { tx: stand.x, ty: stand.y },
        { dur: 1.6, label: '核对账单', skill: 'serve', done: () => { if (g.state === 'checkout') this.pay(g); } },
      ] });
    }
    // 上菜
    for (const o of this.orders) {
      if (o.stage !== 'ready') continue;
      const key = 'serve:' + o.id;
      if (claimed.has(key)) continue;
      const g = this.groups.find((x) => x.id === o.groupId);
      const table = g ? this.tavern.furnById(g.tableId) : null;
      const passF = this.tavern.furnById(o.passId);
      const servedDish = this.dishOf(o.dishId);
      if (!g || !table || !passF) continue;
      const p1 = this.tavern.standTileNear(this.tavern.useTiles(passF));
      const p2 = this.nearStand(table.x, table.y);
      if (!p1 || !p2) continue;
      out.push({
        kind: 'serve', key, label: `上菜·${servedDish.name}`, i: 0,
        steps: [
          { tx: p1.x, ty: p1.y },
          { dur: 1.0, label: '取餐', skill: 'carry', done: () => { passF.plates = Math.max(0, (passF.plates || 0) - 1); } },
          { tx: p2.x, ty: p2.y },
          {
            dur: 1.0, label: '上菜', skill: 'serve', done: () => {
              o.stage = 'served';
              if (g.state === 'ordered') {
                g.state = 'eating';
                g.servedT = this.dayT;
                const tableRoom = this.tavern.roomOfFurn(table);
                g.eatT = (10 + this.rng.range(0, 8)) * (servedDish.drink && tableRoom?.kind === 'bar' ? .85 : 1);
                this.fx.push({ x: table.x, y: table.y, t: 0.5, kind: 'serve' });
                this.sounds.push('serve');
              }
            },
          },
        ],
      });
    }
    // 收脏盘
    for (const t of this.tavern.allTables()) {
      if (!t.dirty) continue;
      const key = 'bus:' + t.id;
      if (claimed.has(key)) continue;
      const sinks = this.tavern.furnsOfKind('sink');
      if (!sinks.length) continue;
      const sink = sinks[0];
      const p1 = this.nearStand(t.x, t.y);
      const p2 = this.tavern.standTileNear(this.tavern.useTiles(sink));
      if (!p1 || !p2) continue;
      const st = (furnDef('sink').time            )[sink.quality - 1];
      out.push({
        kind: 'bus', key, label: '收台', i: 0,
        steps: [
          { tx: p1.x, ty: p1.y },
          { dur: 1.2, label: '收脏盘', skill: 'carry', done: () => { t.dirty = Math.max(0, (t.dirty || 0) - 2); } },
          { tx: p2.x, ty: p2.y },
          {
            dur: st, label: '洗涤', skill: 'clean', done: () => {
              const room = this.tavern.roomOfFurn(sink);
              if (room) room.clean = clamp(room.clean + 3, 0, 100);
            },
          },
        ],
      });
    }
    // 整理设施（换床单／打理水面／摆球）：整理完才能再接客
    for (const kind of [...BED_KINDS, 'pool', 'billiardtable', 'screen', 'fountain', 'telescope', 'arcadem', 'cauldron']) {
      for (const f of this.tavern.furnsOfKind(kind)) {
        if (!(f.dirty || 0) || this.facOwner.has(f.id)) continue;
        const key = 'tidy:' + f.id;
        if (claimed.has(key)) continue;
        const spots = this.facilitySpots(f);
        const stand = spots.length ? spots[0] : this.nearStand(f.x, f.y);
        if (!stand) continue;
        const label = BED_KINDS.includes(kind) ? '换床单' : kind === 'pool' ? '打理水面' : kind === 'screen' ? '收拾场地' : kind === 'fountain' ? '清理水池'
          : kind === 'telescope' ? '校准镜片' : kind === 'arcadem' ? '复位街机' : kind === 'cauldron' ? '清洗炼金釜' : '摆球';
        const special = FACILITY_FURN_KINDS.has(kind);
        const room = this.tavern.roomOfFurn(f);
        out.push({
          kind: special ? 'facility' : 'tidy', key, label, roomId: room?.id || null, i: 0,
          steps: [{ tx: stand.x, ty: stand.y }, {
            dur: 3.0, label, skill: 'clean', done: () => {
              f.dirty = 0;
              this.sounds.push('clean');
              const room = this.tavern.roomOfFurn(f);
              if (room) room.clean = clamp(room.clean + 4, 0, 100);
              const pending = this.pendingFacilityReset.get(f.id);
              if (pending) {
                this.pendingFacilityReset.delete(f.id);
                if (this.dayReport) {
                  this.dayReport.facilityService.completed++;
                  const row = this.dayReport.facilityService.byType[pending.wantId] || { started: 0, completed: 0 };
                  row.completed++;
                  this.dayReport.facilityService.byType[pending.wantId] = row;
                }
              }
            },
          }],
        });
      }
    }
    // 清洁脏污
    for (const d of this.tavern.dirt) {
      const key = `clean:${d.x},${d.y}`;
      if (claimed.has(key)) continue;
      if (!this.tavern.walkable(d.x, d.y)) continue;
      out.push({
        kind: 'clean', key, label: '清洁', i: 0,
        steps: [{ tx: d.x, ty: d.y }, {
          dur: 3.2, label: '清洁', skill: 'clean', done: () => {
            this.sounds.push('clean');
            d.level--;
            if (d.level <= 0) this.tavern.dirt = this.tavern.dirt.filter((x) => x !== d);
            const room = this.tavern.roomAt(d.x, d.y);
            if (room) room.clean = clamp(room.clean + 6, 0, 100);
          },
        }],
      });
    }
    return out;
  }

  buildCookTask(o       , dish      , key        )              {
    const kitchens = this.tavern.rooms.filter((r) => dish.drink ? ['bar', 'parlor'].includes(r.kind) : r.kind === 'kitchen');
    if (!kitchens.length) return null;
    const shelves = this.tavern.furnsOfKind('shelf');
    const iceboxes = this.tavern.furnsOfKind('icebox');
    const preps = this.tavern.furnsOfKind('prep');
    const stoves = this.tavern.furnsOfKind(dish.drink ? 'keg' : 'stove');
    const passes = this.tavern.furnsOfKind('pass');
    if ((!shelves.length && !iceboxes.length) || !stoves.length || (!dish.drink && !passes.length)) return null;
    if (!dish.drink && !preps.length) return null;
    const free = (f) => f && !this.stationOwner.has(f.id);
    const stand = (f) => f ? this.tavern.standTileNear(this.tavern.useTiles(f)) : null;
    const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    let line = null;
    for (const stove of stoves.filter(free)) {
      const stoveRoom = this.tavern.roomOfFurn(stove);
      if (!stoveRoom || !kitchens.some((room) => room.id === stoveRoom.id)) continue;
      const roomPreps = dish.drink ? [null] : preps.filter((f) => free(f) && this.tavern.roomOfFurn(f)?.id === stoveRoom.id);
      const roomPasses = dish.drink ? [stove] : passes.filter((f) => free(f) && this.tavern.roomOfFurn(f)?.id === stoveRoom.id);
      const roomIce = iceboxes.filter((f) => free(f) && this.tavern.roomOfFurn(f)?.id === stoveRoom.id);
      const stores = roomIce.length ? roomIce : [...shelves, ...iceboxes].filter(free);
      for (const shelf of stores) for (const prep of roomPreps) for (const passF of roomPasses) {
        const passCap = (furnDef(dish.drink ? 'keg' : 'pass').cap            )[passF.quality - 1]
          + (dish.drink && stoveRoom.kind === 'bar' ? 1 : 0);
        if ((passF.plates || 0) >= passCap) continue;
        const sShelf = stand(shelf), sStove = stand(stove), sPrep = prep ? stand(prep) : null, sPass = dish.drink ? sStove : stand(passF);
        if (!sShelf || !sStove || !sPass || (prep && !sPrep)) continue;
        const score = dist(sShelf, sPrep || sStove) + (sPrep ? dist(sPrep, sStove) : 0) + dist(sStove, sPass);
        if (!line || score < line.score) line = { shelf, prep, stove, passF, stoveRoom, sShelf, sPrep, sStove, sPass, score };
      }
    }
    if (!line) return null;
    const { shelf, prep, stove, passF, stoveRoom, sShelf, sPrep, sStove, sPass } = line;
    // 库存检查
    for (const k of ING_KEYS) {
      const need = dish.ing[k] || 0;
      if (need > 0 && this.econ.stock[k] < need) return null;
    }
    const steps         = [
      { tx: sShelf.x, ty: sShelf.y },
      {
        dur: 1.6, label: '取料', skill: 'carry', done: () => {
          for (const k of ING_KEYS) {
            const need = dish.ing[k] || 0;
            if (need) {
              this.econ.stock[k] = Math.max(0, this.econ.stock[k] - need);
              if (this.dayReport) this.dayReport.stockUsed[k] = (this.dayReport.stockUsed[k] || 0) + need;
            }
          }
          o.stage = 'carry';
        },
      },
    ];
    if (prep && sPrep) {
      steps.push({ tx: sPrep.x, ty: sPrep.y });
      steps.push({ dur: (furnDef('prep').time            )[prep.quality - 1], label: '备餐', skill: 'cook', done: () => { o.stage = 'prep'; } });
    }
    const cookSkill           = dish.drink ? 'mix' : 'cook';
    steps.push({ tx: sStove.x, ty: sStove.y });
    steps.push({
      dur: (furnDef(dish.drink ? 'keg' : 'stove').time            )[stove.quality - 1] * (0.8 + dish.skill / 160) * (dish.fun && dish.fun.includes('huge') ? 1.3 : 1) * (dish.drink && stoveRoom.kind === 'bar' ? 0.8 : 1),
      label: dish.drink ? '调酒' : '烹饪', skill: cookSkill,
      done: (s       ) => {
        o.stage = 'cook';
        o.cookId = s.id;
        this.sounds.push('sizzle');
        // 出品质量 = 技能 + 设备品质 + 菜品难度惩罚
        o.quality = clamp(0.9 + s.skills[cookSkill] / 26 + (stove.quality - 1) * 0.55 - dish.skill / 90
          + (s.traits.includes('perfectionist') ? 0.4 : 0) + (s.traits.includes('creative') ? 0.25 : 0), 1, 5) * dish.taste;
        // 整蛊料理：出品质量大幅随机，客人反应两极
        if (dish.fun && dish.fun.includes('prank')) o.quality = clamp(o.quality * this.rng.range(0.7, 1.35), 1, 5);
        if (dish.drink) {
          o.stage = 'ready'; o.passId = stove.id;
          stove.plates = (stove.plates || 0) + 1;
          this.fx.push({ x: stove.x, y: stove.y, t: 0.5, kind: 'steam' });
        }
      },
    });
    if (!dish.drink) {
      steps.push({ tx: sPass.x, ty: sPass.y });
      steps.push({
        dur: 0.8, label: '出餐', skill: 'carry', done: () => {
          o.stage = 'ready'; o.passId = passF.id;
          passF.plates = (passF.plates || 0) + 1;
          this.fx.push({ x: passF.x, y: passF.y, t: 0.5, kind: 'steam' });
        },
      });
    }
    return {
      kind: dish.drink ? 'mix' : 'cook', key, label: `${dish.drink ? '调制' : '烹饪'}·${dish.name}`, i: 0, steps,
      roomId: stoveRoom.id, stationIds: [...new Set([shelf.id, prep?.id, stove.id, passF.id].filter(Boolean))],
    };
  }

          chooseDish(g       )              {
    const w = wantById(g.want);
    let avail = this.makeableDishes(w.drink).filter((d) => d.price * this.econ.markup <= g.budget * 1.6);
    // 想喝酒但酒都超预算/断货时，退一步看看另一类，实在没有才离店
    if (!avail.length) avail = this.makeableDishes(!w.drink).filter((d) => d.price * this.econ.markup <= g.budget * 1.6);
    if (!avail.length) return null;
    const liked = avail.filter((d) => g.taste.includes(d.id));
    return liked.length ? liked[this.rng.int(liked.length)] : avail[this.rng.int(avail.length)];
  }

          nearStand(x        , y        )                                  {
    const cand = [{ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 }];
    for (const c of cand) {
      const f = this.tavern.furnAt(c.x, c.y);
      if (this.tavern.walkable(c.x, c.y) && (!f || f.kind !== 'chair')) return c;
    }
    for (const c of cand) if (this.tavern.walkable(c.x, c.y)) return c;
    return null;
  }

  assign(s       , open        )       {
    let best              = null; let bestScore = -1e9;
    for (const t of open) {
      const fit = this.dutyFit(t.kind, s);
      if (fit < 0) continue;
      if ((t.stationIds || []).some((id) => this.stationOwner.has(id))) continue;
      const first = t.steps.find((st) => st.tx !== undefined);
      const dist = first ? Math.abs((first.tx          ) - s.x) + Math.abs((first.ty          ) - s.y) : 0;
      const skill = t.steps.reduce((a, st) => a + (st.skill ? s.skills[st.skill] : 0), 0) / Math.max(1, t.steps.filter((st) => st.skill).length);
      let score = fit + skill * 0.5 - dist * 1.4 + s.needs.stamina * 0.08;
      const targetRoom = t.roomId ? this.tavern.roomById(t.roomId) : first ? this.tavern.roomAt(first.tx          , first.ty          ) : null;
      if (s.roomId && s.roomMode === 'strict' && targetRoom && targetRoom.id !== s.roomId) continue;
      if (s.roomId && targetRoom && targetRoom.id === s.roomId) score += 30;
      else if (s.roomId && targetRoom && targetRoom.id !== s.roomId) score -= 45;
      if (score > bestScore) { bestScore = score; best = t; }
    }
    if (!best) return;
    // 可达性检查
    const first = best.steps.find((st) => st.tx !== undefined);
    if (first) {
      const p = this.tavern.path(Math.round(s.x), Math.round(s.y), first.tx          , first.ty          );
      if (!p) return;
    }
    s.task = best;
    for (const id of best.stationIds || []) this.stationOwner.set(id, best.key);
    s.task.i = 0;
    open.splice(open.indexOf(best), 1);
    this.beginStep(s);
  }

          beginStep(s       )       {
    const t = s.task;
    if (!t) return;
    const step = t.steps[t.i];
    if (!step) { s.task = null; return; }
    if (step.tx !== undefined && step.ty !== undefined) {
      const p = this.tavern.path(Math.round(s.x), Math.round(s.y), step.tx, step.ty);
      if (!p) { s.task = null; s.bubble = { text: '过不去!', t: 2 }; return; }
      s.path = p;
      s.pose = s.carry ? 'carry' : 'walk';
    } else if (step.dur !== undefined) {
      s.actTotal = step.dur / this.actSpeed(s, step.skill || 'serve');
      s.actT = s.actTotal;
      s.pose = 'work';
      if (step.label) s.note = step.label;
    }
  }

          runTask(s       , dt        )       {
    const t = s.task;
    if (!t) return;
    const step = t.steps[t.i];
    if (!step) { s.task = null; return; }
    if (step.tx !== undefined) {
      if (s.path.length === 0) {
        const dx = Math.abs(s.x - (step.tx          )), dy = Math.abs(s.y - (step.ty          ));
        if (dx + dy < 0.2) { t.i++; this.beginStep(s); } else {
          const p = this.tavern.path(Math.round(s.x), Math.round(s.y), step.tx          , step.ty          );
          if (!p) { s.task = null; s.bubble = { text: '无路可走', t: 2 }; return; }
          if (!p.length) { t.i++; this.beginStep(s); return; }
          s.path = p;
        }
      }
      return;
    }
    s.actT -= dt;
    s.pose = s.carry ? 'carry' : 'work';
    if (s.actT <= 0) {
      if (step.done) step.done(s);
      if (step.skill) this.gainExp(s, step.skill, 1.4);
      // 搬运态
      if (t.kind === 'serve' && t.i === 1) s.carry = 'dish';
      if (t.kind === 'bus' && t.i === 1) s.carry = 'dirty';
      if ((t.kind === 'cook' || t.kind === 'mix') && t.i === 1) s.carry = 'ing';
      if (t.i >= t.steps.length - 1) s.carry = null;
      if (t.kind === 'serve' && t.i === 3) s.carry = null;
      if (s.traits.includes('clumsy') && !s.traits.includes('careful') && this.rng.chance(0.06)) {
        this.tavern.addDirt(Math.round(s.x), Math.round(s.y));
        s.bubble = { text: '啊！', t: 1.5 };
      }
      t.i++;
      if (t.i >= t.steps.length) { this.recordDayWork(s, t); s.task = null; s.carry = null; s.pose = 'idle'; s.note = ''; }
      else this.beginStep(s);
    }
  }

  gainExp(s       , k          , amount        )       {
    s.exp[k] += amount * (s.traits.includes('gourmet') && k === 'cook' ? 1.5 : 1) * (s.traits.includes('ambitious') ? 1.2 : 1);
    const need = 12 + s.skills[k] * 0.9;
    if (s.exp[k] >= need && s.skills[k] < 100) {
      s.exp[k] = 0;
      s.skills[k] = Math.min(100, s.skills[k] + 1);
    }
  }

  trainStaff(id, skill) {
    const s = this.staff.find((person) => person.id === id);
    if (!s || this.dayActive || !SKILL_KEYS.includes(skill) || s.skills[skill] >= 100) return false;
    const cost = Math.round(90 + s.skills[skill] * 2.2);
    if (this.econ.coins < cost) { this.toast(`进修需要 ${cost} 界币`); return false; }
    this.econ.coins -= cost;
    const before = s.skills[skill];
    s.skills[skill] = Math.min(100, before + 3);
    s.trainingCount = (s.trainingCount || 0) + 1;
    s.needs.morale = clamp(s.needs.morale + 3, 0, 100);
    this.toast(`${s.name}完成「${TRAINING_PROGRAMS[skill]}」：${SKILL_LABEL[skill]} ${before} → ${s.skills[skill]}（-${cost}）`);
    return true;
  }

  buyStaffEquipment(id, equipmentId) {
    const s = this.staff.find((person) => person.id === id);
    const item = STAFF_EQUIPMENT.find((row) => row.id === equipmentId);
    if (!s || !item || this.dayActive || s.equipment?.includes(item.id)) return false;
    if (this.econ.coins < item.cost) { this.toast(`购买「${item.name}」需要 ${item.cost} 界币`); return false; }
    this.econ.coins -= item.cost;
    s.equipment = [...(s.equipment || []), item.id];
    s.skills[item.skill] = Math.min(100, s.skills[item.skill] + item.bonus);
    this.toast(`${s.name}装备了「${item.name}」：${SKILL_LABEL[item.skill]} +${item.bonus}`);
    return true;
  }

  learnStaffPerk(id, perkId) {
    const s = this.staff.find((person) => person.id === id);
    const perk = STAFF_PERKS.find((row) => row.id === perkId);
    if (!s || !perk || this.dayActive || s.perks?.includes(perk.id)) return false;
    const related = perk.id === 'artisan' ? Math.max(s.skills.cook, s.skills.mix) : s.skills[perk.skill];
    if (related < perk.need) { this.toast(`学习「${perk.name}」需要相关能力 ${perk.need}`); return false; }
    if (this.econ.coins < perk.cost) { this.toast(`学习「${perk.name}」需要 ${perk.cost} 界币`); return false; }
    this.econ.coins -= perk.cost;
    s.perks = [...(s.perks || []), perk.id];
    this.toast(`${s.name}学会了技能「${perk.name}」：${perk.note}`);
    return true;
  }

  tickWorld(dt        )       {
    // 卫生只随“房间内真实活动”变化。无人使用的休息室、客房不会被全店人流随机抽中。
    const active = [];
    const use = (actor, amount) => {
      const room = this.tavern.roomAt(Math.round(actor.x), Math.round(actor.y));
      if (!room) return;
      active.push({ room, amount });
      this.roomUsage[room.id] = (this.roomUsage[room.id] || 0) + amount * dt;
    };
    for (const guest of this.guests) use(guest, 1);
    for (const staff of this.staff) use(staff, staff.task ? 0.45 : 0.1);
    const traffic = active.reduce((sum, row) => sum + row.amount, 0);
    if (active.length && this.rng.chance(dt * traffic * 0.0018)) {
      let roll = this.rng.next() * traffic;
      let room = active[active.length - 1].room;
      for (const row of active) { roll -= row.amount; if (roll <= 0) { room = row.room; break; } }
      const t = this.tavern.freeTileIn(room, this.rng.int(60));
      this.tavern.addDirt(t.x, t.y);
    }
    for (const r of this.tavern.rooms) {
      const dirtHere = this.tavern.dirt.filter((d) => d.x >= r.x && d.x < r.x + r.w && d.y >= r.y && d.y < r.y + r.h).length;
      r.clean = clamp(r.clean - dirtHere * 0.06 * dt, 0, 100);
    }
  }

  // ---------- 事件 ----------
  bestSkill(k          )                                  {
    let best = { name: '无人', value: 0 };
    for (const s of this.staff) if (s.skills[k] > best.value) best = { name: s.name, value: s.skills[k] };
    return best;
  }

  eventCtx()           {
    return {
      coins: (d) => { this.econ.coins += d; },
      rep: (d) => { this.econ.rep = Math.max(0, this.econ.rep + d); },
      stock: (k, d) => { this.econ.stock[k] = Math.max(0, this.econ.stock[k] + d); },
      cleanAll: (d) => { for (const r of this.tavern.rooms) r.clean = clamp(r.clean + d, 0, 100); },
      stressAll: (d) => { for (const s of this.staff) s.needs.stress = clamp(s.needs.stress + d, 0, 100); },
      moraleAll: (d) => { for (const s of this.staff) s.needs.morale = clamp(s.needs.morale + d, 0, 100); },
      bestSkill: (k) => this.bestSkill(k),
      staffCount: () => this.staff.length,
      spawnDirt: (n) => {
        for (let i = 0; i < n; i++) {
          const room = this.tavern.rooms[this.rng.int(this.tavern.rooms.length)];
          if (room) { const t = this.tavern.freeTileIn(room, this.rng.int(70)); this.tavern.addDirt(t.x, t.y); }
        }
      },
      patienceAll: (d) => { for (const g of this.groups) g.patience = Math.max(4, g.patience + d); },
      toast: (s) => this.toast(s),
    };
  }

  applyEventEffects(effects = {}) {
    const amount = (value, min, max) => clamp(Math.round(Number(value) || 0), min, max);
    const ctx = this.eventCtx();
    ctx.coins(amount(effects.coins, -400, 400));
    ctx.rep(amount(effects.rep, -25, 25));
    for (const key of ING_KEYS) ctx.stock(key, amount(effects.stock?.[key], -12, 12));
    ctx.cleanAll(amount(effects.cleanliness, -20, 20));
    ctx.stressAll(amount(effects.stress, -15, 20));
    ctx.moraleAll(amount(effects.morale, -15, 15));
    const dirt = amount(effects.dirt, -4, 6);
    if (dirt > 0) ctx.spawnDirt(dirt);
    else if (dirt < 0) this.tavern.dirt.splice(Math.max(0, this.tavern.dirt.length + dirt), -dirt);
  }

  dynamicEventFacts() {
    return {
      day: this.econ.day, timeRemainingSeconds: Math.max(0, Math.round(DAY_LEN - this.dayT)),
      tavern: { stars: this.stars(), coins: Math.round(this.econ.coins), reputation: Math.round(this.econ.rep), rooms: this.tavern.rooms.map((room) => ROOM_LABEL[room.kind] || room.kind), furnitureCount: this.tavern.furns.length },
      today: { served: this.econ.served, lost: this.econ.lost, revenue: this.econ.revenue, completedWork: Object.values(this.dayReport?.work || {}).map((row) => ({ name: row.name, tasks: row.tasks })) },
      staff: this.staff.map((person) => ({ name: person.name, job: person.job, skills: normalizedSkills(person.skills), morale: Math.round(person.needs.morale), stress: Math.round(person.needs.stress) })),
      regularGuests: this.regulars.filter((profile) => profile.lastVisitDay >= this.econ.day - 2).map((profile) => ({ name: profile.name, race: profile.race, visits: profile.visits, affinity: profile.aff, offer: profile.offer })),
      recentEvents: this.eventHistory.slice(-8),
      allowedEffectRanges: { coins: [-400, 400], rep: [-25, 25], stockEach: [-12, 12], cleanliness: [-20, 20], stress: [-15, 20], morale: [-15, 15], dirt: [-4, 6] },
    };
  }

  structuredEventCard(plan, eventId, meta = {}) {
    return {
      id: eventId, title: plan.title, text: plan.premise, kind: plan.kind || 'mystery', ...meta,
      choices: plan.choices.map((choice) => ({
        label: choice.label, note: choice.note, skill: choice.skill,
        base: clamp(95 - Number(choice.difficulty || 55), 18, 70),
        ok: () => { this.applyEventEffects(choice.successEffects); return choice.successText; },
        fail: () => { this.applyEventEffects(choice.failureEffects); return choice.failureText; },
      })),
    };
  }

  queueAIDynamicEvent(plan) {
    if (!plan || !Array.isArray(plan.choices) || plan.choices.length !== 2) return false;
    const eventId = `ai_day_${this.econ.day}_${Math.round(this.dayT)}`;
    const card = this.structuredEventCard(plan, eventId, { aiGenerated: true });
    this.eventHistory.push(eventId);
    if (this.eventHistory.length > 12) this.eventHistory.shift();
    this.queuedDynamicEvent = card;
    return true;
  }

  triggerEvent()       {
    if (this.econ.day >= 3 && this.econ.day % 3 === 0 && this.lastChainEventDay !== this.econ.day) {
      const available = LONG_EVENT_CHAINS.filter((chain) => (this.eventChains[chain.id] || 0) < chain.steps.length);
      if (available.length) {
        const chain = available[(Math.floor(this.econ.day / 3) - 1) % available.length];
        const stage = this.eventChains[chain.id] || 0;
        const step = chain.steps[stage];
        const id = `chain_${chain.id}_${stage}`;
        this.pendingEvent = this.structuredEventCard(step, id, { chainId: chain.id, chainStage: stage, chainName: chain.name });
        this.lastChainEventDay = this.econ.day;
        this.lastEventId = id;
        this.eventHistory.push(id);
        if (this.eventHistory.length > 12) this.eventHistory.shift();
        this.fx.push({ ...this.tavern.entrance(), t: 1.2, kind: 'event' });
        this.sounds.push('alert');
        return;
      }
    }
    const recent = new Set(this.eventHistory.slice(-5));
    const pool = EVENTS.filter((e) => !recent.has(e.id));
    const card = pool[this.rng.int(pool.length)];
    this.lastEventId = card.id;
    this.eventHistory.push(card.id);
    if (this.eventHistory.length > 12) this.eventHistory.shift();
    this.pendingEvent = card;
    this.fx.push({ ...this.tavern.entrance(), t: 1.2, kind: 'event' });
    this.sounds.push('alert');
  }
          lastEventId = '';

  /** 返回选项成功率（0-100），无检定则 100 */
  choiceChance(choice                                     )         {
    if (!choice.skill) return 100;
    const best = this.bestSkill(choice.skill);
    const stoic = this.staff.some((s) => s.traits.includes('stoic')) ? 10 : 0;
    return clamp(Math.round((choice.base || 50) * 0.5 + best.value * 0.6 + stoic), 5, 96);
  }

  customEventFacts(action        )           {
    const card = this.pendingEvent;
    if (!card) return null;
    const average = (rows, read) => rows.length ? Math.round(rows.reduce((sum, row) => sum + read(row), 0) / rows.length) : 0;
    return {
      event: {
        id: card.id, title: card.title, premise: card.text,
        defaultChoices: card.choices.map((choice) => ({ label: choice.label, note: choice.note, skill: choice.skill || '', cost: choice.cost || 0 })),
      },
      playerAction: String(action || '').trim().slice(0, 300),
      state: {
        coins: this.econ.coins, reputation: this.econ.rep, stock: { ...this.econ.stock }, dirt: this.tavern.dirt.length,
        roomCount: this.tavern.rooms.length, averageCleanliness: average(this.tavern.rooms, (room) => room.clean),
        averageStress: average(this.staff, (staff) => staff.needs.stress), averageMorale: average(this.staff, (staff) => staff.needs.morale),
      },
      staff: this.staff.map((staff) => ({ name: staff.name, job: staff.job, traits: [...staff.traits], skills: { ...staff.skills }, stress: Math.round(staff.needs.stress), morale: Math.round(staff.needs.morale) })),
      allowedEffectRanges: { coins: [-400, 400], rep: [-25, 25], stockEach: [-12, 12], cleanliness: [-20, 20], stress: [-15, 20], morale: [-15, 15], dirt: [-4, 6] },
    };
  }

  resolveCustomEvent(action        , plan     )       {
    const card = this.pendingEvent;
    if (!card || !plan) return null;
    const safeAction = String(action || '').trim().slice(0, 300);
    if (!safeAction) return null;
    const snapshot = () => ({
      coins: this.econ.coins, rep: this.econ.rep, stock: { ...this.econ.stock }, dirt: this.tavern.dirt.length,
      clean: this.tavern.rooms.length ? this.tavern.rooms.reduce((sum, room) => sum + room.clean, 0) / this.tavern.rooms.length : 0,
      stress: this.staff.length ? this.staff.reduce((sum, staff) => sum + staff.needs.stress, 0) / this.staff.length : 0,
      morale: this.staff.length ? this.staff.reduce((sum, staff) => sum + staff.needs.morale, 0) / this.staff.length : 0,
    });
    const before = snapshot();
    const skill = SKILL_KEYS.includes(plan.skill) ? plan.skill : 'calm';
    const difficulty = clamp(Math.round(Number(plan.difficulty) || 55), 20, 90);
    const best = this.bestSkill(skill);
    const stoic = this.staff.some((staff) => staff.traits.includes('stoic')) ? 10 : 0;
    const chance = clamp(Math.round(55 + best.value * 0.45 - difficulty * 0.55 + stoic), 5, 95);
    const roll = 1 + Math.floor(this.rng.next() * 100);
    const success = roll <= chance;
    const branch = success ? plan.successResult : plan.failureResult;
    const effects = branch?.effects || {};
    const amount = (value, min, max) => clamp(Math.round(Number(value) || 0), min, max);
    const ctx = this.eventCtx();
    ctx.coins(amount(effects.coins, -400, 400));
    ctx.rep(amount(effects.rep, -25, 25));
    for (const key of ING_KEYS) ctx.stock(key, amount(effects.stock?.[key], -12, 12));
    ctx.cleanAll(amount(effects.cleanliness, -20, 20));
    ctx.stressAll(amount(effects.stress, -15, 20));
    ctx.moraleAll(amount(effects.morale, -15, 15));
    const dirt = amount(effects.dirt, -4, 6);
    if (dirt > 0) ctx.spawnDirt(dirt);
    else if (dirt < 0) this.tavern.dirt.splice(Math.max(0, this.tavern.dirt.length + dirt), -dirt);
    this.pendingEvent = null;
    const after = snapshot();
    const stock = {};
    for (const key of Object.keys(after.stock)) {
      const delta = (after.stock[key] || 0) - (before.stock[key] || 0);
      if (delta) stock[key] = delta;
    }
    const actualEffects = {
      coins: after.coins - before.coins, rep: after.rep - before.rep, stock, dirt: after.dirt - before.dirt,
      cleanliness: Math.round((after.clean - before.clean) * 10) / 10,
      stress: Math.round((after.stress - before.stress) * 10) / 10,
      morale: Math.round((after.morale - before.morale) * 10) / 10,
    };
    this.lastEventResolution = {
      eventId: card.id, title: card.title, premise: card.text, choice: `自定义：${safeAction}`,
      choiceNote: plan.rationale || '由 AI 解释玩家的自定义处理方式', skill, success,
      originalResult: branch?.narrative || branch?.impact || '事件告一段落。', effects: actualEffects,
      aiCustom: true, difficulty, chance, roll, impact: branch?.impact || '', resultTitle: plan.title || card.title,
    };
    if (this.dayReport) this.dayReport.events.push(this.lastEventResolution);
    return { ...this.lastEventResolution, narrative: this.lastEventResolution.originalResult, best };
  }

  resolveEvent(idx        )         {
    const card = this.pendingEvent;
    if (!card) return '';
    const c = card.choices[idx];
    if (card.chainId) this.eventChains[card.chainId] = Math.max(this.eventChains[card.chainId] || 0, (card.chainStage || 0) + 1);
    const snapshot = () => ({
      coins: this.econ.coins, rep: this.econ.rep, stock: { ...this.econ.stock }, dirt: this.tavern.dirt.length,
      clean: this.tavern.rooms.length ? this.tavern.rooms.reduce((sum, room) => sum + room.clean, 0) / this.tavern.rooms.length : 0,
      stress: this.staff.length ? this.staff.reduce((sum, staff) => sum + staff.needs.stress, 0) / this.staff.length : 0,
      morale: this.staff.length ? this.staff.reduce((sum, staff) => sum + staff.needs.morale, 0) / this.staff.length : 0,
    });
    const before = snapshot();
    this.pendingEvent = null;
    let text = '';
    let success = true;
    if (c.cost && this.econ.coins < c.cost) {
      text = '界币不足，只能眼睁睁看着事情发生。';
      success = false;
    } else {
      if (c.cost) this.econ.coins -= c.cost;
      const ctx = this.eventCtx();
      if (c.skill) {
      const chance = this.choiceChance(c);
        success = this.rng.next() * 100 <= chance;
        text = success ? c.ok(ctx) : (c.fail ? c.fail(ctx) : '失败了。');
      } else text = c.ok(ctx);
    }
    const after = snapshot();
    const stock = {};
    for (const key of Object.keys(after.stock)) {
      const delta = (after.stock[key] || 0) - (before.stock[key] || 0);
      if (delta) stock[key] = delta;
    }
    const effects = {
      coins: after.coins - before.coins, rep: after.rep - before.rep, stock,
      dirt: after.dirt - before.dirt,
      cleanliness: Math.round((after.clean - before.clean) * 10) / 10,
      stress: Math.round((after.stress - before.stress) * 10) / 10,
      morale: Math.round((after.morale - before.morale) * 10) / 10,
    };
    this.lastEventResolution = {
      eventId: card.id, title: card.title, premise: card.text, choice: c.label, choiceNote: c.note,
      skill: c.skill || '', success, originalResult: text, effects,
    };
    if (this.dayReport) this.dayReport.events.push(this.lastEventResolution);
    return text;
  }

  serialize()          {
    return {
      econ: this.econ,
      staff: this.staff.map((s) => ({ ...s, task: null, path: [], carry: null })),
      pool: this.pool.map((s) => ({ ...s, task: null, path: [] })),
      ads: this.ads.map((a) => ({ spec: a.spec, day: a.day, cands: a.cands.map((s) => ({ ...s, task: null, path: [] })) })),
      // 过夜住宿客：整个规划期都睡在店里，得跟着存档走
      lodgers: this.groups.filter((g) => g.overnight).map((g) => ({ ...g, members: g.members.map((m) => ({ ...m, path: [] })) })),
      rels: this.rels,
      nextId: this.nextId,
      sealed: this.sealed,
      endingSeen: this.endingSeen,
      eventHistory: this.eventHistory,
      eventChains: this.eventChains,
      regulars: this.regulars,
    };
  }

  loadState(data                                                                                                                                              )       {
    this.econ = data.econ;
    this.econ.certifiedStars = clamp(Math.round(Number(this.econ.certifiedStars) || 0), 0, 5);
    this.econ.certificationHistory = Array.isArray(this.econ.certificationHistory) ? this.econ.certificationHistory : [];
    if (!this.econ.menu) this.econ.menu = {};   // 老存档：全部上架
    if (!this.econ.customDishes) this.econ.customDishes = [];   // 老存档：无自创菜
    if (!this.econ.aiChronicles) this.econ.aiChronicles = [];
    if (!this.econ.aiNightStories) this.econ.aiNightStories = [];
    if (!this.econ.dishMastery || typeof this.econ.dishMastery !== 'object') this.econ.dishMastery = {};
    this.econ.restockTargets = { ...DEFAULT_RESTOCK_TARGETS, ...(this.econ.restockTargets || {}) };
    this.econ.restockBudget = Math.max(0, Math.round(Number(this.econ.restockBudget) || 0));
    this.rels = data.rels || {};                // 老存档：暂无关系
    this.regulars = Array.isArray(data.regulars) ? data.regulars.slice(0, 60).map((profile) => ({
      ...profile, aff: clamp(Number(profile.aff) || 0, -100, 100), visits: Math.max(1, Number(profile.visits) || 1),
      aiChatLog: Array.isArray(profile.aiChatLog) ? profile.aiChatLog.slice(0, 20) : [], relationshipSummary: String(profile.relationshipSummary || '').slice(0, 600),
    })) : [];
    const fix = (s       , replan = false)        => ({
      ...s, task: null, path: [], carry: null, bubble: null,
      sex: s.sex === '男' || s.sex === '女' ? s.sex : ((s.id || 0) % 2 ? '女' : '男'),
      age: Math.max(18, Number(s.age) || 18),
      wage: s.isOwner ? 0 : Math.max(5, Number(s.wage) || 5),
      skills: normalizedSkills(s.skills),
      exp: Object.fromEntries(SKILL_KEYS.map((key) => [key, Number.isFinite(Number(s.exp?.[key])) ? Number(s.exp[key]) : 0])),
      aff: s.aff === undefined ? (s.isOwner ? 100 : 10) : s.aff,
      prio: replan || s.prio === undefined ? (s.isOwner ? 2 : plannedStaffPriority(s.skills, s.traits || [])) : s.prio,
      dutyMode: s.dutyMode === 'manual' ? 'manual' : 'auto',
      roomMode: s.roomMode === 'strict' ? 'strict' : 'prefer',
      dutyPriorities: { ...defaultDutyPriorities(s.job), ...(s.dutyPriorities || {}) },
      equipment: Array.isArray(s.equipment) ? [...new Set(s.equipment)] : [],
      perks: Array.isArray(s.perks) ? [...new Set(s.perks)] : [], trainingCount: Math.max(0, Number(s.trainingCount) || 0),
      affCd: 0, chats: s.chats || 0, chatLog: s.chatLog || [], aiChatLog: s.aiChatLog || [], relationshipSummary: String(s.relationshipSummary || '').slice(0, 600), background: s.background || null, hireDay: s.hireDay || 1,
    });
    this.staff = data.staff.map((s) => fix(s, false));
    this.pool = data.pool.map((s) => fix(s, true));
    this.ads = (data.ads && data.ads.length === 3 ? data.ads : [{ spec: null, cands: [], day: 0 }, { spec: null, cands: [], day: 0 }, { spec: null, cands: [], day: 0 }])
      .map((a) => ({
        spec: a.spec ? { ...a.spec, sex: a.spec.sex === '男' || a.spec.sex === '女' ? a.spec.sex : '' } : null,
        day: a.day || 0,
        cands: (a.cands || []).map((s) => fix(s, true)),
      }));
    // 恢复过夜住宿客：保持睡着的状态，下次开门统一结账
    this.groups = (data.lodgers || []).map((g) => ({ ...g, overnight: true, useT: Infinity, state: 'using' }));
    this.guests = [];
    for (const g of this.groups) {
      this.guests.push(...g.members);
      if (g.facId) this.facOwner.set(g.facId, g.id);
    }
    this.nextId = data.nextId;
    this.sealed = data.sealed;
    this.endingSeen = !!data.endingSeen;
    this.eventHistory = Array.isArray(data.eventHistory) ? data.eventHistory.slice(-12) : [];
    this.eventChains = data.eventChains && typeof data.eventChains === 'object' ? { ...data.eventChains } : {};
    this.rng = new Rng(this.econ.seed + this.econ.day * 977);
  }
}

export function newEcon(seed        )       {
  return {
    coins: 1200, rep: 12, certifiedStars: 0, certificationHistory: [], day: 1, strikes: 0, markup: 1.5, autoRestock: true,
    restockTargets: { ...DEFAULT_RESTOCK_TARGETS }, restockBudget: 600,
    stock: { grain: 70, veg: 70, meat: 45, spice: 30, ether: 20 },
    menu: {},
    customDishes: [], dishMastery: {}, aiChronicles: [], aiNightStories: [],
    revenue: 0, served: 0, lost: 0, seed,
  };
}

export const ALL_JOBS = JOBS;
export const ALL_FURN = FURN_DEFS;
export function dirOf(dx        , dy        )         {
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 1) : dy > 0 ? 0 : 2;
}
export { dirDelta };
