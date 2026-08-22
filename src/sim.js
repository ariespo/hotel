// 模拟：员工任务调度 / 客人流程 / 厨房产线 / 经济结算 / 事件
import {                  randomAppearance,           } from './chargen.js';
import { RACE_NAMES } from './chargen.js';
import { pickWorldRace } from './world-identities.js';
import { Rng } from './pix.js';
import {
  AD_REQ_MULT, AD_TIERS,              BED_KINDS, BED_PRICE_MULT, DISHES,            EVENTS,                               
  FLAVOR_LABEL, FLAVORS, FURN_DEFS, furnDef,
  DUTIES, GUEST_WANTS, ING_KEYS, ING_LABEL, ING_PRICE,                        JOBS, makeName, SEASON_NAMES,                              SKILL_KEYS, SKILL_LABEL,
  ROOM_CHARM, ROOM_LABEL, STAR_CERTIFICATIONS, STAR_THRESHOLDS, starsOf, styleById, TRAIT_CHEM, TRAIT_SAME, TRAITS, wantById,
  WORLD_PROFILES, allWorlds, worldById, worldsForStars, worldsForDay, worldUnlockDay,
} from './data.js';
import {            Tavern, dirDelta, furnFootprint, validateLayout } from './world.js';
import { normalizeCustomWorld, worldFestivalForDay, worldRuleForDay, worldSwitchCost } from './world-system.js';
import { worldContentFor, worldSpecialtyFor } from './world-content.js';
import { tutorialMissingFurniture } from './tutorial-actions.js';

/** 客房床位规则：普通床决定人数房型，特殊床决定商务/豪华客房。 */
export function guestroomBedProfile(tavern, room) {
  const beds = (tavern?.furnsIn?.(room?.id) || []).filter((f) => BED_KINDS.includes(f.kind));
  const special = beds.find((f) => f.kind === 'kingbed') || beds.find((f) => f.kind === 'doublebed');
  const ordinary = beds.filter((f) => f.kind === 'bed').length;
  const type = special?.kind === 'kingbed' ? '豪华客房' : special?.kind === 'doublebed' ? '商务客房' : ordinary >= 3 ? '多人间' : ordinary === 2 ? '双床房' : '大床房';
  const extraOrdinaryPenalty = special ? 1 : Math.pow(0.85, Math.max(0, ordinary - 1));
  return { type, beds: beds.length, ordinaryBeds: ordinary, priceMultiplier: extraOrdinaryPenalty, comfortMultiplier: special ? 1 : Math.pow(0.9, Math.max(0, ordinary - 1)) };
}
import {
  blankContestState, CONTEST_STAGES, contestKey, contestNameOf, equippedTitleOf, makeOpponent,
  nextContestInvite, normalizeContestState, resolveContestMatch, stageById, titleNameFor, titleTierForPlace,
} from './contest.js';

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

const CHALLENGE_APPROACHES = {
  meal: [
    { label: '请客人逐项描述口味', skill: 'serve', delta: -4, successText: '{staff}耐心拆解客人的要求，重新安排了更合口味的一份招待。', failureText: '解释越说越乱，客人认定店里只会找借口。' },
    { label: '用饮品重新组织味觉', skill: 'mix', delta: 2, successText: '{staff}以一杯特调衔接菜肴风味，挑剔的客人终于点头。', failureText: '饮品与料理互相冲突，客人的表情更加微妙。' },
    { label: '冷静分析失败的火候', skill: 'calm', delta: 0, successText: '{staff}找出味道失衡的原因，现场补救得恰到好处。', failureText: '分析耗时太久，菜已经彻底冷了。' },
  ],
  drink: [
    { label: '询问客人熟悉的酒谱', skill: 'serve', delta: -3, successText: '{staff}从客人的描述中抓住关键比例，重调顺利。', failureText: '双方对“浓一点”的理解完全不同。' },
    { label: '用料理香气衬托酒体', skill: 'cook', delta: 3, successText: '{staff}临时配了一小碟佐食，酒液的层次立刻清晰起来。', failureText: '佐食反而盖住了酒香。' },
    { label: '稳住客人并重新校准', skill: 'calm', delta: 0, successText: '{staff}不慌不忙地重做流程，终于找回正确层次。', failureText: '客人的耐心先于调酒完成而耗尽。' },
  ],
  bath: [
    { label: '安抚客人后缓慢调温', skill: 'serve', delta: -3, successText: '{staff}一边说明一边细调水温，池面很快恢复平稳。', failureText: '客人只听见解释，没有感到水温改善。' },
    { label: '搬开堵塞的导流石', skill: 'carry', delta: 1, successText: '{staff}移开导流石，冷热水重新循环起来。', failureText: '导流石纹丝不动，水花却溅得到处都是。' },
    { label: '观察水纹寻找异常源', skill: 'calm', delta: 2, successText: '{staff}从水纹中判断出异常阀门并及时关闭。', failureText: '复杂的水纹误导了判断。' },
  ],
  play: [
    { label: '重新搬动并校平球桌', skill: 'carry', delta: -2, successText: '{staff}重新找平桌脚，下一杆笔直进袋。', failureText: '球桌挪动后歪向了另一个方向。' },
    { label: '陪客人试打确认偏差', skill: 'serve', delta: 1, successText: '{staff}在试打中确认偏差，客人也消了气。', failureText: '试打连续失误，客人更加确信设备有问题。' },
    { label: '冷静测算球路误差', skill: 'calm', delta: 3, successText: '{staff}用数次球路反推桌面倾斜，校准成功。', failureText: '测算看似漂亮，实战却完全不对。' },
  ],
  show: [
    { label: '安抚观众并争取时间', skill: 'serve', delta: -4, successText: '{staff}用现场讲解稳住观众，设备也及时恢复。', failureText: '观众不接受把故障说成特别节目。' },
    { label: '搬动设备重接线路', skill: 'carry', delta: 1, successText: '{staff}快速重接线路，画面与声音重新同步。', failureText: '线路越理越乱，银幕彻底黑了。' },
    { label: '凭节奏手动校准同步', skill: 'calm', delta: 0, successText: '{staff}抓准节奏逐帧校正，放映平稳继续。', failureText: '校准点不断漂移，观众开始倒数离场。' },
  ],
  stroll: [
    { label: '立刻下水捞取行李', skill: 'carry', delta: -2, successText: '{staff}赶在行李沉底前把它完整捞了回来。', failureText: '行李从指尖滑过，又被水流卷远。' },
    { label: '指挥客人关闭支流', skill: 'serve', delta: 0, successText: '{staff}组织众人截断水流，行李顺利靠岸。', failureText: '指令彼此冲突，庭院里一片忙乱。' },
    { label: '判断喷泉循环的出口', skill: 'calm', delta: 2, successText: '{staff}算准行李再次出现的位置，稳稳接住。', failureText: '行李从完全相反的出口飞了出来。' },
  ],
  stargaze: [
    { label: '用机械方式固定镜筒', skill: 'carry', delta: 2, successText: '{staff}固定住偏转的镜筒，星图终于停止倒转。', failureText: '镜筒稳定了，视野却偏离了整片天空。' },
    { label: '向客人解释异常星象', skill: 'serve', delta: 0, successText: '{staff}把故障转化成一堂罕见星象课，客人听得入迷。', failureText: '客人很快发现解释和星图对不上。' },
    { label: '凭星位重新推算方向', skill: 'calm', delta: -2, successText: '{staff}以三颗基准星重建坐标，星图恢复正常。', failureText: '错误的基准星让整张图越转越快。' },
  ],
  game: [
    { label: '搬开机壳抢修接口', skill: 'carry', delta: -2, successText: '{staff}重新压紧接口，客人的分数完整恢复。', failureText: '机壳打开后，更多警示灯同时亮起。' },
    { label: '核对客人的得分经过', skill: 'serve', delta: 0, successText: '{staff}复盘得分并补录记录，客人接受了处理。', failureText: '双方连第几关出错都没能说清。' },
    { label: '冷静寻找程序复位节奏', skill: 'calm', delta: 2, successText: '{staff}抓住复位窗口，机器吐回了被吞掉的分数。', failureText: '一次错误复位把临时记录全部清空。' },
  ],
  brew: [
    { label: '搬开炼金釜隔离现场', skill: 'carry', delta: 2, successText: '{staff}把炼金釜移入隔离圈，异变逐渐平息。', failureText: '炼金釜比预想中更活跃，拖出一路彩烟。' },
    { label: '用料理知识中和反应', skill: 'cook', delta: 4, successText: '{staff}加入恰当的中和材料，敲击声终于停止。', failureText: '材料让锅盖敲出了更欢快的节奏。' },
    { label: '向客人说明安全步骤', skill: 'serve', delta: 0, successText: '{staff}有条不紊地疏散并演示处理过程，反而赢得掌声。', failureText: '说明尚未结束，锅盖先飞了起来。' },
  ],
};

const SPECIAL_FACILITY_WANTS = new Set(['bath', 'play', 'show', 'stroll', 'stargaze', 'game', 'brew']);
const FACILITY_FURN_KINDS = new Set(['pool', 'billiardtable', 'screen', 'fountain', 'telescope', 'arcadem', 'cauldron']);

                                                                                        

                     
                                                                                                            
                                                                                              
                                                                                   
                                                                                                 
                                                                                                      
                                             
                                  
                                                                                
                             
                  
                              
                                                                                      
  

                     
                                                                           
                                                                                                 
                               
  

                     
                                                                             
                                            
                                                 
                                         
                                            
                                                                                              
                                                                                                        
                                   
                      
                                           
                     
                                
                    
                   
                       
                                  
                                                 
  

                     
                                                                                                                          
  

                                                                                                                    
                                                                                   

                    
                                                                                                 
                                                    
                                
               
                       
                                                                                                              
  

                       
                                                                                                                  
                                                                                              
  

export const DAY_LEN = 300;
export const GREETING_FAILSAFE_SECONDS = 10;

export const MEETING_TOPIC_CATALOG = Object.freeze([
  { id: 'first-loss', category: '经营', title: '客人为什么离开？', text: '复盘等待时间与店主疲劳。', effect: { rep: 1 }, urgent: true, line: '我们先把客人的耐心接住。' },
  { id: 'first-staff', category: '团队', title: '一个人真的够吗？', text: '为下一天安排招聘和员工房。', effect: { morale: 2 }, urgent: true, line: '人手不是数字，是每一双能接住客人的手。' },
  { id: 'first-world', category: '世界', title: '门外的世界', text: '记下艾泽普利斯客人的待客习惯。', effect: { knowledge: 1 }, urgent: false, line: '把今天听见的口音记下来，下一桌会用得上。' },
  { id: 'ops-review', category: '经营', title: '修补今天的短板', text: '针对日报里最弱的一项安排改进。', effect: { rep: 1 }, line: '明天先补最短的那块木板。' },
  { id: 'team-check', category: '团队', title: '让大家喘口气', text: '听听员工对排班与设施的意见。', effect: { morale: 2 }, line: '能把话说完的团队，才有力气把活做完。' },
  { id: 'world-opportunity', category: '世界', title: '下一扇门', text: '讨论当前世界的文化机会。', effect: { knowledge: 1 }, line: '每个世界都有一把不一样的钥匙。' },
]);

export function meetingTopicsFor(sim, first = false) {
  if (first) return ['first-loss', 'first-staff', 'first-world'].map((id) => MEETING_TOPIC_CATALOG.find((row) => row.id === id));
  const stat = sim.lastStat || {};
  const staff = sim.staff.filter((s) => !s.isOwner);
  const ops = MEETING_TOPIC_CATALOG.find((row) => row.id === 'ops-review');
  const team = MEETING_TOPIC_CATALOG.find((row) => row.id === 'team-check');
  const world = MEETING_TOPIC_CATALOG.find((row) => row.id === 'world-opportunity');
  return [
    { ...ops, urgent: Number(stat.lost || 0) > 0 || Number(stat.avgScore || 3) < 3, context: `流失 ${stat.lost || 0} 组，平均评分 ${Number(stat.avgScore || 3).toFixed(2)}。` },
    { ...team, urgent: staff.some((s) => s.needs.stamina < 35 || s.needs.stress > 65), context: `员工最低体力 ${Math.round(Math.min(...staff.map((s) => s.needs.stamina), 100))}。` },
    { ...world, urgent: Number(sim.econ.worldStayState?.days || 1) >= 4, context: `当前驻留 ${sim.currentWorld().name} 第 ${sim.econ.worldStayState?.days || 1} 天。` },
  ];
}

export function resolveMeetingAIDialogue(raw, cards = []) {
  const allowed = new Map(cards.map((card) => [card.id, card]));
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.lines)) return cards.map((card) => ({ topicId: card.id, text: card.line || '大家点头记下了。' }));
  const valid = raw.lines.filter((line) => allowed.has(line?.topicId) && typeof line.text === 'string').map((line) => ({ topicId: line.topicId, text: line.text.slice(0, 180) }));
  return valid.length ? valid : cards.map((card) => ({ topicId: card.id, text: card.line || '大家点头记下了。' }));
}

/** 种族寿命上限：人族硬封顶 100；长生种上限高但年龄分布压向年轻段，过百岁少见 */
export const AGE_MAX = [100, 600, 150, 90, 600, 600, 600, 900, 400, 900, 80, 90, 300, 300, 900, 500, 150, 300, 600];

/** 打烊自由活动的心里话（按活动分池） */
export const FREE_THOUGHTS                           = {
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
  fire: ['炉火一响，整个人都松下来了', '靴子烤暖了再走', '今天的疲惫都烧掉吧', '这火光很像故乡的夜', '再添一块柴就刚好', '围炉的时候最适合讲故事'],
  aquarium: ['那条蓝色的小鱼又躲起来了', '它们游得慢悠悠，真羡慕', '这个气泡像一颗小星球', '嘘，别吓到它们', '看久了连呼吸都慢下来了', '明天给水族箱擦擦玻璃'],
  billiards: ['这一杆角度漂亮', '轻一点，别把球打飞了', '我就不信进不了这个袋', '再练一局就收杆', '台呢平，输赢得认', '下次拉个人来对局'],
  soak: ['水温正好，肩膀终于松了', '泡完这一轮能再干一天', '别问，问就是不想起来', '热气把烦心事都蒸走了', '这池子果然得自己试过才懂', '再数十下就出去'],
  flowers: ['这朵花今天开得最精神', '香气比餐厅的甜点还轻', '把歪掉的枝叶扶正', '花坛边很适合发呆', '明天记得来看看新芽', '不同位面的花居然能开在一起'],
  crystal: ['水晶里的光在跟着呼吸', '安静听，好像有很远的回声', '掌心都被照暖了', '杂念慢慢沉下去了', '这块晶簇记得很多故事吧', '光纹和昨天不一样'],
  wine: ['只闻香，不算偷喝', '这瓶年份比我工龄还长', '酒柜最里面那瓶是什么味道', '标签得重新排整齐', '一小杯，敬今天顺利收工', '这香气适合配烤肉'],
  cards: ['这一手可不能让你们看见', '今晚手气肯定不错', '少一张牌，是谁藏袖子里了', '再来一局就散场', '输了的人明天洗杯子', '别催，我正在算牌'],
  sketch: ['这个角度画下来一定好看', '先把轮廓记住', '灯影落在墙上像另一扇门', '画歪了也算异世界风格', '给今天留一张小速写', '明天再把颜色补上'],
};
/** 闲聊对白：投缘的 / 呛起来的 */
export const CHAT_GOOD                     = [
  ['今天那桌矮人真能喝', '可不是，结账也爽快'],
  ['你上次那锅炖菜绝了', '想吃下次给你留一碗'],
  ['打烊后的星星最好看了', '是啊，就适合聊天'],
  ['老板又研发新菜了', '闻着就香'],
  ['你这发型哪弄的', '回头带你去那家次元理发店'],
  ['今天小费比昨天多', '客人的笑脸也越来越多了'],
  ['你那间卧室朝北吧', '嗯，晚上凉快得很'],
  ['下周发工资想吃顿好的', '算上我，我知道一家好馆子'],
  ['你今天跑了多少趟', '没数，腿已经替我记住了'],
  ['刚才那个客人夸你了', '真的？那我明天再认真点'],
  ['厨房剩的夜宵还有吗', '给你藏了一份，别声张'],
  ['你觉得老板今天心情怎样', '看结账数字，应该还不错'],
  ['这家店以后会变成什么样', '至少会比今天更热闹'],
  ['你的家乡也看得到星星吗', '看得到，只是颜色不一样'],
  ['明天我帮你收一轮台', '那我替你留杯热茶'],
  ['今天差点忙昏头', '我看见了，所以顺手补了位'],
  ['你最近没那么累了吧', '有人问这句，就已经轻松些了'],
  ['休息室那本书你看完了吗', '差最后一章，结局不许剧透'],
  ['要不要下班后打一局', '先说好，输了不许赖账'],
  ['你身上怎么有花香', '刚去庭院替花坛修了枝'],
  ['刚才那杯特调叫什么', '还没名字，等你帮我想'],
  ['今天配合得挺顺', '嗯，连转身都没撞上你'],
  ['等发薪日一起逛集市吧', '行，我正想换双耐走的鞋'],
  ['谢谢你刚才来救场', '同事嘛，别客气'],
  ['门口那盏灯是不是换亮了', '是我擦的，积了好厚一层灰'],
  ['今天谁最忙', '反正不是在这里聊天的我们'],
  ['你听见客人唱的那首歌了吗', '听见了，现在还在我脑子里转'],
  ['明天早点起一起吃早餐？', '可以，但你负责叫醒我'],
  ['最近新来的同事怎么样', '挺可靠，就是还不认路'],
  ['我发现一条更短的送餐路线', '明天走给我看，我替你计时'],
  ['今天的晚霞像果酒', '你是不是下班还惦记着喝的'],
  ['你会做家乡菜吗', '会一道，下次休息日做给你尝'],
  ['刚才那桌孩子一直看着你', '因为我给他们变了个小戏法'],
  ['老板把账算完了吗', '算完了，刚才终于笑了一下'],
  ['你的鞋底都磨薄了', '发薪就换，已经看好一双了'],
  ['今天的客人都挺有趣', '嗯，那个会发光的行李箱尤其有趣'],
  ['要不要把休息室布置一下', '先添个靠垫，再放盏暖灯'],
  ['你刚才是不是哼歌了', '嘘，我只会那一句'],
  ['明天会更忙吧', '忙就忙，咱们配合好就行'],
  ['晚安，明天见', '明天见，别又踩点来'],
];
export const CHAT_BAD                     = [
  ['你上菜又踩我脚', '明明是你挡道'],
  ['碗能不能洗干净点', '你行你上啊'],
  ['别老抢我灶台', '谁先抢到算谁的'],
  ['你拖把又乱放', '管得着吗你'],
  ['刚才那单是不是你漏的', '别血口喷人'],
  ['你打鼾隔壁都听见了', '有本事你换间卧室'],
  ['你又用我的杯子', '洗洗不就得了'],
  ['干活就你最慢', '催什么催，要不你来'],
  ['别把脏盘堆我这边', '那边明明离水槽更近'],
  ['你又擅自改了我的摆法', '不改的话客人根本过不去'],
  ['说好来补位，人呢', '我也被三桌人同时叫住了'],
  ['夜宵是不是你吃完的', '证据呢，别看着我说'],
  ['你能不能小声一点', '这店又不是图书馆'],
  ['别碰我的调酒壶', '我只是帮你擦干净'],
  ['你把排班表看反了', '字写成这样谁看得懂'],
  ['每次都把活留到最后', '每次都有人急着当监工'],
  ['你把我的夜宵放哪了', '贴了名字就能占一整层吗'],
  ['刚拖完的地你又踩', '不踩地难道踩墙走'],
  ['那桌明明归你负责', '临时换区你没看见吗'],
  ['你能别拿勺子敲锅吗', '你能别对每件事都有意见吗'],
  ['我的毛巾又被你用了', '长得都一样，谁分得出来'],
  ['你把客人的名字叫错了', '至少我没把房号也记错'],
  ['谁把空酒瓶塞回柜子了', '反正不是刚整理酒柜的人'],
  ['你今天已经迟到两次了', '第二次是回来取忘掉的东西'],
  ['别学我说话', '别学我说话'],
  ['你又偷偷调高暖炉了', '冷的人又不是你'],
  ['收工了还指挥什么', '因为有人收工了也不收拾'],
  ['能不能别一直叹气', '能不能别一直问'],
];

const CHAT_CLOSE = [
  ['如果哪天我离开这家店', '那我就先替你把行李扣下'],
  ['有你在，忙起来也没那么慌', '彼此彼此，别突然说得这么认真'],
  ['我给你留了家乡寄来的点心', '那我可要慢慢吃'],
  ['下次休假一起去看位面潮汐吧', '说定了，谁反悔谁请客'],
  ['刚来时我还觉得待不久', '现在呢？'],
  ['你最近笑得比以前多', '大概是这里终于像个家了'],
];

const CHAT_JOB = {
  cook: [['明天的备料够吗', '我刚核过，还差两筐蔬菜'], ['你觉得今天火候怎么样', '第三锅最好，香气全出来了']],
  bartender: [['酒桶还撑得住明天吗', '撑得住，人可能撑不住'], ['那杯客人点了两次', '我已经写进招牌候选了']],
  front: [['门口那队客人等急了吗', '还好，我提前解释过了'], ['今天带位路线顺多了', '桌子没堵门，当然顺']],
  server: [['三号桌叫了你几遍', '四遍，最后一遍只是想道谢'], ['出餐台一满我就头疼', '明天我会把节奏错开']],
  attendant: [['温泉那边收尾了吗', '水面和毛巾都整理好了'], ['台球室今天挺热闹', '是啊，摆球都摆了三轮']],
  cleaner: [['你怎么总能找到灰', '灰也总能找到客人看得见的地方'], ['今天地板挺亮', '因为我追着脚印擦了一圈']],
  porter: [['那只酒桶到底多重', '重到我现在还不想抬手'], ['今天通道没堵住', '因为我提前挪开了三只箱子']],
};

/** 客人结算评价：每种消费的好评、中评、恶评各有独立台词池。 */
export const GUEST_REVIEW_DIALOGUE = {
  meal: {
    good: ['这道{item}火候真漂亮，下次还点它！', '香气、口感和摆盘都很到位，厨师有本事。', '服务跟得上，菜也没让人失望，这顿吃得舒坦。', '房间气氛这么好，连最后一口都舍不得吃完。', '这味道值得专程穿一次传送门。'],
    neutral: ['{item}还算稳当，不过离惊喜差了一点。', '能吃饱，味道也过关，下次想试试别的。', '服务不坏，就是菜上得再利落些会更好。', '环境挺舒服，料理表现就比较普通了。', '没有踩雷，也没有让我记住的一口。'],
    bad: ['{item}的火候完全乱了，厨师今天不在状态吧？', '等了这么久，端上来的味道却配不上。', '服务和料理都乱糟糟的，这顿饭吃得累。', '房间看着不错，可救不了盘子里的东西。', '这味道让我开始怀念传送门另一头的干粮。'],
  },
  drink: {
    good: ['这杯{item}层次分明，调酒师很懂分寸。', '香气刚好，入口又顺，再来一杯也不过分。', '酒出得快，服务也漂亮，今晚选对地方了。', '在这种气氛里喝到这杯酒，值了。', '把配方记好，我下次就为这杯酒回来。'],
    neutral: ['{item}还算顺口，就是个性淡了些。', '能喝，但调酒师似乎还留着一手。', '服务挺规矩，这杯酒就比较普通。', '环境比酒更让人印象深刻。', '不难喝，也没有让我想立刻续杯。'],
    bad: ['这杯{item}比例失衡，第一口就不对。', '等半天只等来一杯寡淡的酒？', '调酒和服务都显得手忙脚乱。', '这么好的酒廊气氛，偏偏酒没跟上。', '我宁愿去喝传送门旁边的雨水。'],
  },
  sleep: {
    good: ['床铺干净又舒服，这一觉把旅途的累都睡没了。', '房间很安静，服务也周到，我会再来住。', '被褥有太阳的味道，真难得。', '氛围让人安心，像在熟悉的家里醒来。', '从床到房间细节都照顾得很好。'],
    neutral: ['睡得还行，床铺再软一点就好了。', '房间够安静，布置就比较朴素。', '服务没有问题，但住宿体验很普通。', '能恢复精神，不过不会特意推荐。', '卫生过关，舒适度还有提升空间。'],
    bad: ['这床让我比赶路时还累。', '房间的卫生和安静程度都不合格。', '住一晚却没得到该有的照顾。', '布置再漂亮，睡不舒服也没有用。', '下次我宁愿在传送门边搭帐篷。'],
  },
  bath: {
    good: ['水温正好，场务照看得也很细心。', '泡完浑身都轻了，这温泉真有水平。', '池水干净，环境也让人彻底放松。', '从带位到收尾都很稳，我愿意再泡一轮。', '热气和灯光配得太舒服了。'],
    neutral: ['水温还行，就是少了点特色。', '能放松下来，场务反应再快些更好。', '池子够干净，周围气氛比较普通。', '整体合格，但没有想象中舒服。', '泡过了，体验算是平稳。'],
    bad: ['水温忽冷忽热，根本没法放松。', '池边没人照看，服务太敷衍了。', '卫生状况让我一刻都不想多待。', '环境挺漂亮，池子本身却一团糟。', '这不是泡汤，是在考验耐心。'],
  },
  play: {
    good: ['球桌又平又顺，这一杆打得太痛快了！', '场务摆球很利落，整局一点没被打断。', '灯光和空间都很适合来一场。', '设备维护得好，输球都输得心服口服。', '下次我要带更厉害的对手来。'],
    neutral: ['球桌能打，就是手感普通。', '服务跟得上，设备还可以再调一调。', '气氛不错，这局本身没什么亮点。', '玩得还算顺，偶尔有点小别扭。', '可以消磨时间，暂时谈不上精彩。'],
    bad: ['这球桌的角度绝对有问题！', '等场务等得比打球还久。', '设备和环境都让人没法专心。', '球滚成这样，还怎么讲技术？', '我不是输给对手，是输给这张桌子。'],
  },
  show: {
    good: ['画面、声音和座位都很舒服，这场看值了。', '场务把放映照看得很稳，一点没出戏。', '氛围太好了，散场都不想起身。', '这部片子在这里看，比原来的位面还精彩。', '下次换片单记得通知我。'],
    neutral: ['片子看完了，设备表现中规中矩。', '声音还行，画面可以再清楚些。', '服务没出错，就是少了一点沉浸感。', '座位挺舒服，放映本身比较普通。', '适合休息一下，但称不上难忘。'],
    bad: ['画面和声音各走各的，这怎么看？', '放映出问题时根本没人及时处理。', '环境再暗也藏不住设备的毛病。', '坐到散场只记住了卡顿。', '这体验还不如听别人讲剧情。'],
  },
  stroll: {
    good: ['庭院收拾得真雅致，每一步都有景色。', '场务照看周到，连小路都干干净净。', '花香、喷泉和灯光配得恰到好处。', '走一圈心情全好了。', '我想把这里推荐给每个疲惫的旅人。'],
    neutral: ['庭院挺清静，景致还可以更丰富。', '路很好走，服务也算及时。', '环境舒服，但没有特别抓人的地方。', '散散步不错，专程来就未必了。', '整体整洁，是一次平稳的游览。'],
    bad: ['庭院路线又乱又难走。', '需要帮忙时根本找不到场务。', '花草和设施都像很久没人照看。', '喷泉的声音只让我更烦躁。', '这趟散步比赶路还费神。'],
  },
  stargaze: {
    good: ['星图清楚得像伸手就能碰到。', '场务讲解得好，今晚终于认全了那片星座。', '环境安静，观星设备也调得很准。', '这一眼星海就值回票价。', '下次有流星雨，我一定再来。'],
    neutral: ['看到了星星，设备表现还算稳定。', '讲解听懂了大半，细节可以再多些。', '氛围不错，可惜星图没有特别惊艳。', '适合第一次体验，老观星客会觉得普通。', '这一晚平平静静，也算没有白来。'],
    bad: ['星图偏成这样，看的到底是哪片天？', '设备出问题却一直没人来处理。', '灯光太乱，星星全被盖住了。', '我仰头看屋顶都比这个清楚。', '今晚唯一准确的判断就是不该来。'],
  },
  game: {
    good: ['机器反应真快，这局打得过瘾！', '场务一直盯着设备，连卡顿都没有。', '灯光和声音太有气氛了。', '破纪录了！我得把同伴都叫来。', '设备状态这么好，输赢都开心。'],
    neutral: ['机器能玩，手感就一般。', '偶尔有点延迟，好在场务处理得快。', '游艺厅挺热闹，设备还可以升级。', '打发时间足够，追求高分就差一点。', '玩了一轮，感觉中规中矩。'],
    bad: ['按键都不听使唤，还吞了我的分数！', '机器坏着却没人及时来看。', '又吵又卡，这根本不是娱乐。', '我花钱不是来看报错画面的。', '再玩一局，我怕自己先把机器拆了。'],
  },
  brew: {
    good: ['炼金反应太漂亮了，场务控制得稳稳的。', '每一步都看得清楚，讲解也很有意思。', '水晶和药雾的气氛简直像一场演出。', '安全又精彩，这钱花得值。', '下次有新配方一定叫我来看。'],
    neutral: ['反应成功了，过程比较平淡。', '讲解还行，就是等待时间长了些。', '环境很有炼金味，展示内容一般。', '看懂了一部分，整体算是合格。', '没有爆炸，也没有什么惊喜。'],
    bad: ['锅盖都快飞了，没人管吗？', '等半天只看到一团颜色不对的烟。', '场务和设备一样慌乱。', '气氛是有了，安全感一点没有。', '这不是炼金展示，这是事故预告。'],
  },
};

export function phaseOf(t        )         {
  if (t < 45) return '暖场';
  if (t < 160) return '上客';
  if (t < 180) return '低谷';
  if (t < 270) return '晚高峰';
  return '收尾';
}

export function guestReviewTier(score) {
  return score >= 3.75 ? 'good' : score < 2.75 ? 'bad' : 'neutral';
}

function clamp(v        , a        , b        )         { return v < a ? a : v > b ? b : v; }

/** 同时在场客组硬上限；建议区间由员工人数与服务技能估算。 */
export const GUEST_CAP_MAX = 16;
/** 同一瞬间从门厅入场的客组上限。一组仍可有多人。 */
export const ARRIVAL_WAVE_MAX = 2;
export const GUEST_CAP_SKILLS = ['serve', 'cook', 'mix', 'clean', 'carry', 'calm'];

export function guestCapacityRange(staffList) {
  const people = Array.isArray(staffList) ? staffList.filter(Boolean) : [];
  const n = Math.max(1, people.length);
  const skillAvg = people.length
    ? people.reduce((sum, person) => {
        const vals = GUEST_CAP_SKILLS.map((key) => Math.max(0, effectiveSkill(person, key)));
        return sum + vals.reduce((a, b) => a + b, 0) / vals.length;
      }, 0) / people.length
    : 30;
  const mid = clamp(Math.round(n * (1.1 + skillAvg / 100 * 1.3)), 1, GUEST_CAP_MAX);
  return {
    lo: Math.max(1, mid - 2),
    mid,
    hi: Math.min(GUEST_CAP_MAX, mid + 2),
    staffCount: people.length,
    skillAvg: Math.round(skillAvg),
  };
}

export const DIFFICULTY = {
  easy: { id: 'easy', label: '轻松', demand: 0.8, wait: 1.2, note: '客人要求 −20%，等待时间 +20%' },
  normal: { id: 'normal', label: '默认', demand: 1, wait: 1, note: '保持现有节奏' },
  hard: { id: 'hard', label: '苛刻', demand: 1.2, wait: 0.8, note: '客人要求 +20%，等待时间 −20%' },
};

export function difficultyMods(econ) {
  return DIFFICULTY[econ?.difficulty] || DIFFICULTY.normal;
}

/** 1星 500，2星 800，3星 1200，之后每次递增再多 100。 */
export function certificationBonus(level) {
  const n = Math.max(0, Math.round(Number(level) || 0));
  if (n < 1) return 0;
  return 50 * (n * n + 3 * n + 6);
}

export function normalizeGuestSettings(econ) {
  if (!econ || typeof econ !== 'object') return econ;
  const cap = Number(econ.guestCap);
  econ.guestCap = Number.isFinite(cap) && cap > 0 ? clamp(Math.round(cap), 1, GUEST_CAP_MAX) : 0;
  econ.difficulty = DIFFICULTY[econ.difficulty] ? econ.difficulty : 'normal';
  return econ;
}

const LOOK_THEMES = ['cyber', 'ancient', 'magic'];

function stableHash(text) {
  let hash = 2166136261;
  for (const char of String(text || '')) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

function weightedPick(rng, rows, weightOf) {
  if (!rows.length) return null;
  let roll = rng.next() * rows.reduce((sum, row) => sum + Math.max(0, weightOf(row)), 0);
  for (const row of rows) { roll -= Math.max(0, weightOf(row)); if (roll <= 0) return row; }
  return rows[rows.length - 1];
}

export function worldForecastForDay(seed, day, stars) {
  const available = worldsForStars(stars);
  const count = Math.min(available.length, 2 + (stableHash(`${seed}:${day}:count`) % 2));
  return [...available]
    .sort((a, b) => stableHash(`${seed}:${day}:${a.id}`) - stableHash(`${seed}:${day}:${b.id}`))
    .slice(0, count)
    .map((world) => world.id);
}

export function worldModifier(world, key) {
  const value = key === 'budget' ? world?.travel?.budgetMultiplier
    : key === 'patience' ? world?.travel?.patienceMultiplier
      : world?.hospitality?.servicePriorities?.[key];
  return clamp(Number(value) || 1, .8, 1.25);
}

function blankWorldKnowledge() {
  return Object.fromEntries(WORLD_PROFILES.map((world) => [world.id, { level: 0, arrivals: 0, served: 0, firstDay: 0, reviewed: false, journeyAsked: false }]));
}

const FORMAL_IDENTITY_RE = /王庭|王国|贵族|使者|官吏|军人|军团|舰队|教廷|议会|议庭|公会|宗门|仙朝|董事|监察|领航|修会|税吏|骑士|医师|院长|舰长|指挥|队长|圣女|国师|领袖|礼仪官|补给官/;

/**
 * 用客人的真实身份决定称呼档位。旧存档只有 socialRegister 时仍可兼容，
 * 新客人则由标志人物、阶层/职业与年龄依次判定。
 */
export function socialRegisterForGuest(identity = {}) {
  if (identity.isNotable || identity.travelOccupation === '世界标志人物' || identity.notableRole) return 'notable';
  const formalSource = `${identity.culturalStratum || ''} ${identity.culturalIdentity || ''} ${identity.travelOccupation || ''}`;
  if (FORMAL_IDENTITY_RE.test(formalSource)) return 'formal';
  if (Number(identity.age) >= 55) return 'elder';
  if (!identity.age && !formalSource.trim() && ['peer', 'formal', 'elder', 'notable'].includes(identity.socialRegister)) return identity.socialRegister;
  return 'peer';
}

function travelIdentity(world, seed) {
  const n = stableHash(seed);
  const homeRegion = world.regions[n % world.regions.length].name;
  const travelOccupation = world.travel.occupations[Math.floor(n / 7) % world.travel.occupations.length];
  const strata = world.culture?.socialStrata || ['跨界旅人'];
  const selfReferences = world.culture?.selfReferences || ['我'];
  const identity = {
    homeRegion,
    travelOccupation,
    travelPurpose: world.travel.purposes[Math.floor(n / 17) % world.travel.purposes.length],
    age: 18 + Math.floor(n / 53) % 63,
    culturalStratum: strata[Math.floor(n / 37) % strata.length],
    culturalIdentity: `${homeRegion}的${travelOccupation}`,
    selfReference: selfReferences[Math.floor(n / 43) % selfReferences.length],
  };
  return { ...identity, socialRegister: socialRegisterForGuest(identity) };
}

export function worldWantWeight(world, wantId, day = 1, seed = 0) {
  let weight = Number(world?.hospitality?.wantWeights?.[wantId]) || 1;
  if (world?.hospitality?.dailyTrend) {
    const ranked = GUEST_WANTS.map((want) => want.id)
      .sort((a, b) => stableHash(`${seed}:${day}:${world.id}:${a}`) - stableHash(`${seed}:${day}:${world.id}:${b}`));
    if (ranked.slice(0, 3).includes(wantId)) weight *= 1.2;
  }
  return clamp(weight, .8, 1.25);
}

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

export function normalizeSimDt(dt, fallback = 1 / 60) {
  const n = Number(dt);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 0.05);
}

/** 将旧档或外部输入中的异常技能值收敛到可玩的有限数值。 */
export function normalizedSkills(input = {}, fallback = 38) {
  return Object.fromEntries(SKILL_KEYS.map((key) => {
    const value = Number(input?.[key]);
    return [key, Math.round(clamp(Number.isFinite(value) ? value : fallback, 1, 100))];
  }));
}

export const DEFAULT_RESTOCK_TARGETS = { grain: 70, veg: 70, meat: 45, spice: 30, ether: 20 };

export function worldIngredientPrice(econ, key) {
  const world = worldById(econ?.currentWorldId, econ?.customWorlds);
  const multiplier = clamp(Number(world?.economy?.prices?.[key]) || 1, .85, 1.2);
  return Math.max(1, Math.round((ING_PRICE[key] || 1) * multiplier));
}

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
    const unitPrice = worldIngredientPrice(econ, key);
    const amount = Math.min(need, Math.floor(remaining / unitPrice));
    const cost = amount * unitPrice;
    items[key] = { target, amount, cost, shortfall: need - amount, unitPrice, multiplier: unitPrice / ING_PRICE[key] };
    total += cost;
    remaining -= cost;
  }
  return { items, total, budget: configuredBudget, balanceAfter: Math.round((Number(econ?.coins) || 0) - total) };
}

/** 房间与家具的日常维护费：规模仍会产生压力，但开局布局不会吞掉整日营收。 */
export function maintenanceCost(tavern) {
  return maintenanceBreakdown(tavern).total;
}

export function maintenanceBreakdown(tavern) {
  const rooms = Array.isArray(tavern?.rooms) ? tavern.rooms : [];
  const furns = Array.isArray(tavern?.furns) ? tavern.furns : [];
  const roomRows = rooms.map((room) => {
    const base = 2 + Math.max(1, room.w * room.h) * 0.18 + Math.max(1, room.quality || 1) * 1.5;
    return { id: room.id, kind: room.kind, base: Math.round(base * 100) / 100, cost: Math.round(base * (room.kind === 'corridor' ? 0.4 : 1)) };
  });
  const roomCost = roomRows.reduce((sum, row) => sum + row.cost, 0);
  const furnitureCost = furns.reduce((sum, furn) => sum + Math.round(0.5 + Math.max(1, furn.quality || 1) * 0.75), 0);
  return { total: roomCost + furnitureCost, rooms: roomRows, furniture: furnitureCost };
}

export function roomNoise(tavern, room) {
  if (!room) return 100;
  const adjacent = (tavern?.rooms || []).filter((other) => other.id !== room.id && (((room.x + room.w === other.x || other.x + other.w === room.x) && Math.min(room.y + room.h, other.y + other.h) > Math.max(room.y, other.y)) || ((room.y + room.h === other.y || other.y + other.h === room.y) && Math.min(room.x + room.w, other.x + other.w) > Math.max(room.x, other.x))));
  const publicNoise = adjacent.reduce((sum, other) => sum + (['dining', 'bar', 'kitchen', 'corridor'].includes(other.kind) ? 18 : 5), 0);
  const furnitureNoise = (tavern?.furns || []).filter((f) => tavern.roomOfFurn(f)?.id === room.id).reduce((sum, f) => sum + (['stove', 'prep', 'table', 'billiardtable'].includes(f.kind) ? 7 : 1), 0);
  const dirtNoise = (tavern?.dirt || []).filter((d) => d.x >= room.x && d.x < room.x + room.w && d.y >= room.y && d.y < room.y + room.h).reduce((sum, d) => sum + (d.level || 1) * 2, 0);
  return Math.max(0, Math.min(100, publicNoise + furnitureNoise + dirtNoise));
}

export function roomQuietness(tavern, room) { return 100 - roomNoise(tavern, room); }
export function dirtChanceForRoom(room, baseChance) { return Math.max(0, Number(baseChance) || 0) * (room?.kind === 'corridor' ? 0.25 : 1); }

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
  const skills = effectiveSkills(staff);
  const baseline = 18 + SKILL_KEYS.reduce((sum, key) => sum + skills[key], 0) * 0.13;
  return { min: Math.round(baseline * 0.95), recommended: Math.round(baseline * 1.05), max: Math.round(baseline * 1.16) };
}

const JOB_SKILL_WEIGHTS = {
  front: { looks: .25, serve: .4, calm: .35 }, greeter: { looks: .4, serve: .4, calm: .2 },
  server: { serve: .45, carry: .25, calm: .3 }, cook: { cook: .6, clean: .15, calm: .25 },
  bartender: { mix: .6, looks: .2, calm: .2 }, cleaner: { clean: .65, carry: .25, calm: .1 },
  attendant: { carry: .35, clean: .3, calm: .35 }, porter: { carry: .65, clean: .2, calm: .15 },
};

const JOB_FOCUS_SKILLS = Object.freeze({
  front: 'serve', greeter: 'looks', server: 'serve', cook: 'cook', bartender: 'mix',
  cleaner: 'clean', attendant: 'calm', porter: 'carry',
});

/** UI 与经营提示共用的岗位主能力；只读查询，不参与或改变现有招聘评分。 */
export function jobFocusSkill(job) {
  return JOB_FOCUS_SKILLS[job] || 'serve';
}

export function staffAnalysis(staff) {
  const skills = effectiveSkills(staff);
  const roles = Object.entries(JOB_SKILL_WEIGHTS).map(([job, weights]) => ({
    job, score: Math.round(Object.entries(weights).reduce((sum, [key, weight]) => sum + skills[key] * weight, 0)),
  })).sort((a, b) => b.score - a.score);
  const ordered = SKILL_KEYS.map((key) => ({ key, value: skills[key] })).sort((a, b) => b.value - a.value);
  const traitBoost = (staff?.traits || []).reduce((sum, trait) => sum + ({ decisive: 3, diligent: 3, fast: 2, organized: 2, lazy: -4, clumsy: -3, grumpy: -2 }[trait] || 0), 0);
  return {
    score: Math.max(1, Math.min(SKILL_EFFECT_CAP, roles[0].score + traitBoost)), recommendedJob: roles[0].job,
    strengths: ordered.slice(0, 2), weaknesses: ordered.slice(-2).reverse(), roles,
  };
}

export const TRAINING_PROGRAMS = Object.freeze({
  looks: '礼仪与仪表进修', cook: '异界料理研修', mix: '星港调饮课程', serve: '前厅服务实训',
  clean: '高效清洁研修', carry: '搬运与路线训练', calm: '危机应对课程',
});

export const TRAINING_WORLD_SCENES = Object.freeze({
  hearth_coast: { venue: '长桌公会城的联合实训厅', method: '以委托契约、冒险小队协作和地下城补给清单反复校验手艺', trial: '公会钟一响，学员就要为临时归来的救援队完成热食、床位与伤员交接' },
  verdant_court: { venue: '露叶长阶的季节学舍', method: '跟随花妖导师观察气味、声音与客人的细微反应', trial: '会唱歌的树桥会把每一次急躁和疏漏直接唱给所有学员听' },
  magma_ridge: { venue: '太虚剑山的外门讲堂', method: '依照师承、礼序与因果契约拆解步骤，再借灵息变化反复演练', trial: '灵潮会突然改写火候与符阵，学员必须守住承诺并在香尽前完成招待' },
  neon_ring: { venue: '第七码头的夜班实训站', method: '依靠计时屏、模拟队列和即时反馈压缩每一个多余动作', trial: '磁悬街的客流模型会突然加速，任何迟疑都会在整面镜屏上标红' },
  moonsea: { venue: '沉月港的潮汐研修馆', method: '在水质、鲜度和动作洁净都被严格记录的环境中练习', trial: '潮汐珠会映出看不见的杂质，也会放大每一次破坏节奏的动作' },
  evernight: { venue: '影幕街的长夜私塾', method: '在柔暗灯光下学习耐心、分寸与跨越漫长岁月的待客经验', trial: '无钟墓园没有报时声，学员只能靠观察客人的神情判断节奏' },
  honey_sky: { venue: '金蜜云港的礼仪学院', method: '把称谓、仪态、景观与服务顺序编成一套严谨的迎送仪式', trial: '羽桥花园的风会吹乱准备好的陈设，考验临场修正和礼数' },
  iron_hive: { venue: '第九边疆的后勤学院', method: '按伤员优先级、配给契约与设备故障等级组织服务，并对每次疏漏留下可追责记录', trial: '模拟炮击会同时切断照明和一台设备，学员必须启用备用流程并保障难民餐线' },
  mask_realm: { venue: '红幕王街的巡演学堂', method: '借面具、即兴演出和观众喝彩训练表现力与现场应变', trial: '导师会在最热闹处突然换上陌生面具，要求学员接住新的身份和台词' },
  inverted_dreamsea: { venue: '沉睡灯塔的倒向课堂', method: '在颠倒的空间与梦境暗示中寻找不依赖常识的解决方法', trial: '瓶装潮声会让步骤的先后次序短暂倒转，迫使学员重新理解流程' },
  ash_dragoncourt: { venue: '余烬王城的宴席监察院', method: '以龙庭标准检验品质、席位和每一处足以影响高价体验的细节', trial: '宴席监察官会故意混入一件平庸成品，要求学员当场识别并补救' },
  timeless_bazaar: { venue: '零时十字街的跨纪元工坊', method: '同时面对来自过去与未来的规矩，练习先辨认时段再调整方法', trial: '停摆怀表每次重新走动都会更换一套客人习俗和工作条件' },
});

const TRAINING_SKILL_SCENES = Object.freeze({
  looks: { practice: '仪态、服饰细节与第一印象', a: 'serve', b: 'calm', focus: '反复打磨标准仪态', balanced: '把礼仪融入接待', transfer: '用沉着支撑个人气场' },
  cook: { practice: '火候、食材判断与异界口味', a: 'clean', b: 'calm', focus: '专攻一道高难出品', balanced: '兼顾料理与操作洁净', transfer: '在突发条件下稳定火候' },
  mix: { practice: '风味配比、出杯节奏与酒客观察', a: 'serve', b: 'calm', focus: '专攻复杂风味结构', balanced: '边调制边照顾饮用体验', transfer: '处理失控配方与现场压力' },
  serve: { practice: '迎送、点单与桌边判断', a: 'looks', b: 'carry', focus: '精炼完整服务话术', balanced: '强化仪态与沟通', transfer: '优化端送和桌边动线' },
  clean: { practice: '卫生判断、整理次序与设施复位', a: 'carry', b: 'calm', focus: '追求无可挑剔的清洁', balanced: '同步优化整理动作', transfer: '在混乱现场保持判断' },
  carry: { practice: '负重、路线规划与安全交接', a: 'serve', b: 'clean', focus: '突破稳定搬运效率', balanced: '让搬运配合前厅节奏', transfer: '把路线训练用于快速收整' },
  calm: { practice: '风险识别、投诉应对与临场决断', a: 'serve', b: 'clean', focus: '专练高压下的判断', balanced: '以沟通化解冲突', transfer: '从现场秩序中消除风险' },
});

const TRAINING_WORLD_AFFINITY = Object.freeze({
  looks: ['honey_sky', 'mask_realm', 'evernight', 'verdant_court'],
  cook: ['hearth_coast', 'magma_ridge', 'moonsea', 'ash_dragoncourt'],
  mix: ['neon_ring', 'evernight', 'honey_sky', 'ash_dragoncourt'],
  serve: ['honey_sky', 'neon_ring', 'hearth_coast', 'iron_hive'],
  clean: ['verdant_court', 'moonsea', 'iron_hive', 'hearth_coast'],
  carry: ['magma_ridge', 'neon_ring', 'iron_hive', 'timeless_bazaar'],
  calm: ['inverted_dreamsea', 'evernight', 'iron_hive', 'moonsea'],
});

export const STAFF_EQUIPMENT = Object.freeze([
  { id: 'service_pin', name: '银星领针', skill: 'serve', bonus: 3, cost: 180 },
  { id: 'chef_knife', name: '折叠星钢厨刀', skill: 'cook', bonus: 3, cost: 210 },
  { id: 'shaker', name: '月相调酒壶', skill: 'mix', bonus: 3, cost: 210 },
  { id: 'cleaning_kit', name: '自净工具箱', skill: 'clean', bonus: 3, cost: 170 },
  { id: 'porter_belt', name: '轻身搬运带', skill: 'carry', bonus: 3, cost: 190 },
  { id: 'calm_charm', name: '静心护符', skill: 'calm', bonus: 3, cost: 220 },
]);

export const SKILL_POINT_CAP = 100;
export const SKILL_EFFECT_CAP = 160;
export const PERK_MAX_LEVEL = 3;
export const PERK_TIERS = Object.freeze({
  common: { id: 'common', label: '凡阶', rank: 1 },
  uncommon: { id: 'uncommon', label: '良阶', rank: 2 },
  rare: { id: 'rare', label: '精阶', rank: 3 },
  epic: { id: 'epic', label: '绝阶', rank: 4 },
});

export const STAFF_PERKS = Object.freeze([
  { id: 'warm_welcome', name: '宾至如归', skill: 'serve', need: 40, cost: 260, tier: 'common', kind: 'passive_speed',
    speeds: { serve: [0.12, 0.18, 0.24] },
    notes: ['接待、引座与结账速度 +12%', '接待、引座与结账速度 +18%', '接待、引座与结账速度 +24%'] },
  { id: 'swift_hands', name: '熟练手法', skill: 'carry', need: 40, cost: 260, tier: 'common', kind: 'passive_speed',
    speeds: { carry: [0.12, 0.18, 0.24] },
    notes: ['搬运与上菜动作速度 +12%', '搬运与上菜动作速度 +18%', '搬运与上菜动作速度 +24%'] },
  { id: 'spotless_route', name: '无尘路线', skill: 'clean', need: 40, cost: 260, tier: 'common', kind: 'passive_speed',
    speeds: { clean: [0.18, 0.26, 0.34] },
    notes: ['清洁与整理速度 +18%', '清洁与整理速度 +26%', '清洁与整理速度 +34%'] },
  { id: 'artisan', name: '匠心出品', skill: 'cook', need: 45, cost: 320, tier: 'common', kind: 'passive_speed',
    speeds: { cook: [0.1, 0.16, 0.22], mix: [0.1, 0.16, 0.22] },
    notes: ['烹饪与调酒动作速度 +10%', '烹饪与调酒动作速度 +16%', '烹饪与调酒动作速度 +22%'] },
  { id: 'second_wind', name: '回气诀', skill: 'calm', need: 36, cost: 240, tier: 'common', kind: 'daily_restore',
    restore: { need: 'stamina', below: 30, to: [60, 70, 80] },
    notes: ['每次营业 1 次：体力降至 30 时回复到 60', '每次营业 2 次：体力降至 30 时回复到 70', '每次营业 3 次：体力降至 30 时回复到 80'] },
  { id: 'cool_head', name: '压火', skill: 'calm', need: 42, cost: 280, tier: 'uncommon', kind: 'daily_restore',
    restore: { need: 'stress', above: 70, to: [40, 30, 20] },
    notes: ['每次营业 1 次：压力升至 70 时降到 40', '每次营业 2 次：压力升至 70 时降到 30', '每次营业 3 次：压力升至 70 时降到 20'] },
  { id: 'late_snack', name: '垫一口', skill: 'cook', need: 34, cost: 220, tier: 'common', kind: 'daily_restore',
    restore: { need: 'hunger', above: 70, to: [35, 25, 15] },
    notes: ['每次营业 1 次：饥饿升至 70 时降到 35', '每次营业 2 次：饥饿升至 70 时降到 25', '每次营业 3 次：饥饿升至 70 时降到 15'] },
  { id: 'pep_talk', name: '打起精神', skill: 'looks', need: 40, cost: 270, tier: 'uncommon', kind: 'daily_restore',
    restore: { need: 'morale', below: 30, to: [55, 65, 75] },
    notes: ['每次营业 1 次：士气降至 30 时回复到 55', '每次营业 2 次：士气降至 30 时回复到 65', '每次营业 3 次：士气降至 30 时回复到 75'] },
  { id: 'hold_line', name: '压住场面', skill: 'serve', need: 48, cost: 360, tier: 'rare', kind: 'daily_proc',
    notes: ['每次营业 1 次：等待客组耐心跌到 25% 时回复 20', '每次营业 2 次：等待客组耐心跌到 25% 时回复 30', '每次营业 3 次：等待客组耐心跌到 25% 时回复 40'] },
  { id: 'clutch', name: '绝处补救', skill: 'calm', need: 50, cost: 380, tier: 'rare', kind: 'daily_proc',
    notes: ['每次营业 1 次：设施挑战初检失败时改判成功', '每次营业 2 次：设施挑战初检失败时改判成功', '每次营业 3 次：设施挑战初检失败时改判成功'] },
  { id: 'signature', name: '会心出品', skill: 'cook', need: 48, cost: 360, tier: 'rare', kind: 'daily_proc',
    notes: ['每次营业 1 次：下一份料理/饮品品质 +0.5', '每次营业 2 次：下一份料理/饮品品质 +0.8', '每次营业 3 次：下一份料理/饮品品质 +1.1'] },
  { id: 'tidy_after', name: '顺手清', skill: 'clean', need: 36, cost: 230, tier: 'common', kind: 'daily_proc',
    notes: ['每次营业 1 次：做完一项工作后顺手清掉身边一处污渍', '每次营业 2 次：做完一项工作后顺手清掉身边一处污渍', '每次营业 3 次：做完一项工作后顺手清掉身边一处污渍'] },
  { id: 'iron_legs', name: '铁脚', skill: 'carry', need: 55, cost: 420, tier: 'epic', kind: 'daily_proc',
    notes: ['每次营业 1 次：本该回房休息时改为体力回到 50', '每次营业 2 次：本该回房休息时改为体力回到 60', '每次营业 3 次：本该回房休息时改为体力回到 70'] },
  { id: 'front_aura', name: '门厅气场', skill: 'looks', need: 42, cost: 300, tier: 'uncommon', kind: 'passive_skill',
    bonuses: { looks: [3, 5, 8], serve: [3, 5, 8] },
    notes: ['颜值、服务各 +3，可突破加点上限', '颜值、服务各 +5，可突破加点上限', '颜值、服务各 +8，可突破加点上限'] },
  { id: 'kitchen_soul', name: '灶台魂', skill: 'cook', need: 42, cost: 300, tier: 'uncommon', kind: 'passive_skill',
    bonuses: { cook: [3, 5, 8], mix: [3, 5, 8] },
    notes: ['厨艺、调酒各 +3，可突破加点上限', '厨艺、调酒各 +5，可突破加点上限', '厨艺、调酒各 +8，可突破加点上限'] },
  { id: 'house_keep', name: '内务通', skill: 'clean', need: 42, cost: 300, tier: 'uncommon', kind: 'passive_skill',
    bonuses: { clean: [3, 5, 8], carry: [3, 5, 8] },
    notes: ['清洁、搬运各 +3，可突破加点上限', '清洁、搬运各 +5，可突破加点上限', '清洁、搬运各 +8，可突破加点上限'] },
  { id: 'iron_mind', name: '定神', skill: 'calm', need: 48, cost: 340, tier: 'rare', kind: 'passive_skill',
    bonuses: { calm: [6, 10, 15] },
    notes: ['冷静 +6，可突破加点上限', '冷静 +10，可突破加点上限', '冷静 +15，可突破加点上限'] },
  { id: 'star_host', name: '镇店之宝', skill: 'looks', need: 58, cost: 480, tier: 'epic', kind: 'passive_skill',
    bonuses: { looks: [2, 4, 6], cook: [2, 4, 6], mix: [2, 4, 6], serve: [2, 4, 6], clean: [2, 4, 6], carry: [2, 4, 6], calm: [2, 4, 6] },
    notes: ['全部能力 +2，可突破加点上限', '全部能力 +4，可突破加点上限', '全部能力 +6，可突破加点上限'] },
]);

export function perkDef(id) {
  return STAFF_PERKS.find((perk) => perk.id === id) || null;
}

export function perkTierOf(perk) {
  return PERK_TIERS[perk?.tier] || PERK_TIERS.common;
}

export function normalizePerkList(perks) {
  const map = new Map();
  if (!Array.isArray(perks)) return [];
  for (const row of perks) {
    const id = typeof row === 'string' ? row : row?.id;
    if (!perkDef(id)) continue;
    const level = typeof row === 'string' ? 1 : clamp(Math.round(Number(row.level) || 1), 1, PERK_MAX_LEVEL);
    const prev = map.get(id);
    map.set(id, { id, level: Math.max(prev?.level || 0, level) });
  }
  return [...map.values()];
}

export function perkLevel(staff, id) {
  return normalizePerkList(staff?.perks).find((row) => row.id === id)?.level || 0;
}

export function perkNeedAt(perk, level) {
  const step = perk?.tier === 'epic' ? 16 : perk?.tier === 'rare' ? 14 : 12;
  return Math.round(Number(perk?.need) || 0) + (Math.max(1, level) - 1) * step;
}

export function perkCostAt(perk, level) {
  const base = Math.round(Number(perk?.cost) || 0);
  return Math.round(base * (level <= 1 ? 1 : level === 2 ? 1.65 : 2.5));
}

export function perkNoteAt(perk, level) {
  const notes = perk?.notes || [perk?.note || ''];
  return notes[clamp(Math.round(Number(level) || 1), 1, PERK_MAX_LEVEL) - 1] || notes[0] || '';
}

export function relatedPerkSkill(staff, perk) {
  if (!perk) return 0;
  if (perk.id === 'artisan' || perk.id === 'kitchen_soul' || perk.id === 'signature') {
    return Math.max(effectiveSkill(staff, 'cook'), effectiveSkill(staff, 'mix'));
  }
  return effectiveSkill(staff, perk.skill);
}

export function baseSkill(staff, key) {
  return clamp(Math.round(Number(staff?.skills?.[key]) || 0), 1, SKILL_POINT_CAP);
}

export function skillBonusOf(staff, key) {
  let bonus = 0;
  for (const id of staff?.equipment || []) {
    const item = STAFF_EQUIPMENT.find((row) => row.id === id);
    if (item?.skill === key) bonus += item.bonus;
  }
  for (const row of normalizePerkList(staff?.perks)) {
    const add = perkDef(row.id)?.bonuses?.[key];
    if (add) bonus += add[row.level - 1] || 0;
  }
  return bonus;
}

export function effectiveSkill(staff, key) {
  return Math.min(SKILL_EFFECT_CAP, baseSkill(staff, key) + skillBonusOf(staff, key));
}

export function effectiveSkills(staff) {
  return Object.fromEntries(SKILL_KEYS.map((key) => [key, effectiveSkill(staff, key)]));
}

export function stripEquipmentFromBaseSkills(person) {
  if (!person?.skills || !Array.isArray(person.equipment)) return person;
  const next = { ...person.skills };
  for (const id of person.equipment) {
    const item = STAFF_EQUIPMENT.find((row) => row.id === id);
    if (!item) continue;
    next[item.skill] = Math.max(1, Math.round((Number(next[item.skill]) || 1) - item.bonus));
  }
  person.skills = next;
  return person;
}

const DUTY_TASK = Object.freeze({ greet: 'front', seat: 'front', checkout: 'front', order: 'service', serve: 'service', cook: 'cook', mix: 'mix', facility: 'facility', tidy: 'clean', clean: 'clean', bus: 'carry' });
function defaultDutyPriorities(job = 'free') {
  const rows = Object.fromEntries(DUTIES.map((duty) => [duty, 2]));
  const primary = { front: 'front', greeter: 'front', server: 'service', cook: 'cook', bartender: 'mix', attendant: 'facility', cleaner: 'clean', porter: 'carry' }[job];
  if (primary) rows[primary] = 4;
  return rows;
}

                                                                                             

export function makeStaff(rng     , id        , isOwner         , app             , name         , opt          )        {
  const world = opt?.world;
  const requestedRace = app ? app.race : (opt && Number.isInteger(opt.race) ? opt.race : undefined);
  const raceIdx = world ? pickWorldRace(rng, world, requestedRace) : (Number.isInteger(requestedRace) && requestedRace >= 0 ? requestedRace : rng.int(RACE_NAMES.length));
  const worldThemes = world?.visuals?.appearanceThemes;
  const theme = worldThemes?.length
    ? worldThemes[rng.int(worldThemes.length)]
    : (rng.chance(0.6) ? LOOK_THEMES[rng.int(LOOK_THEMES.length)] : undefined);
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
    id, name: name || makeName(rng, world, { sex, raceId: raceIdx }), sex,
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

/** 把机械生成的应聘者锚定到一个正式世界，并补齐可直接用于互动的本地出身。 */
export function applyRecruitmentWorld(person, world, rng) {
  if (!person || !world) return person;
  const regions = Array.isArray(world.regions) && world.regions.length ? world.regions : [{ name: world.name, commonOccupations: [] }];
  const region = regions[rng.int(regions.length)] || regions[0];
  const occupations = [...(region.commonOccupations || []), ...(world.travel?.occupations || [])].filter(Boolean);
  const occupation = occupations.length ? occupations[rng.int(occupations.length)] : '旅店求职者';
  const values = (world.culture?.values || []).slice(0, 2).join('与') || '勤勉与互助';
  person.originWorldId = world.id;
  person.originWorldName = world.name;
  person.homeRegion = region.name || world.name;
  person.background = {
    role: `${world.name}${person.homeRegion ? `·${person.homeRegion}` : ''}出身的${occupation}`,
    background: `${person.name}出生并成长于${world.name}的${person.homeRegion || '当地聚落'}，过去以${occupation}为生。当地${world.identity?.civilization || world.genre || '文明'}重视${values}，这也塑造了其待人和做事方式。为了见识跨位面旅客、获得一份稳定工资并把故乡经验带进新的工作环境，${person.name}循着招募广告来到多元便携旅店应聘。`,
    aspiration: `在旅店站稳脚跟，并让来自${world.name}的经验成为自己的长处。`,
    quirk: `谈到故乡时会自然提起${person.homeRegion || world.name}的生活习惯。`,
  };
  applyWorldSpecialty(person, world);
  return person;
}

/** 当地员工拥有一项真实生效的世界专长；已写入存档的专长不会重复加成。 */
export function applyWorldSpecialty(person, world) {
  if (!person || !world) return person;
  const specialty = worldSpecialtyFor(world);
  if (!specialty) return person;
  if (person.worldSpecialty?.id === specialty.id) return person;
  person.worldSpecialty = { ...specialty };
  person.skills = normalizedSkills(person.skills);
  if (SKILL_KEYS.includes(specialty.skill)) person.skills[specialty.skill] = Math.round(clamp(person.skills[specialty.skill] + specialty.bonus, 1, 100));
  return person;
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
  challengeEventQueue          = [];
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
  lastWorldChainEventDay = 0;
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
  /** 派工不需要按 60 FPS 全量扫描订单、客组和家具。 */
  taskPlanCooldown = 0;
  taskDirty = true;
  taskDirtyReasons = new Set(['initial']);
  taskGeneration = 0;
  taskSafetyT = 0;
  taskInstrumentation = { rebuilds: 0, rebuildMs: 0, reasons: {}, lastReason: 'initial' };
  /** 当日各房间的真实使用量；只用于卫生模拟，不写入存档。 */
  roomUsage = {};
  fx                                                      = [];
  campaign = { mode: 'legacy', phase: 'prepare', chapter: 0, firstDayComplete: false, quickStartUnlocked: false, tutorialFlags: {}, postReportEvents: [], firstGrantClaimed: false };
  meetingState = { points: 0, cards: [], selected: [], resolved: [], open: false };
  nightState = { active: false, employeeUses: {}, playerTalks: {}, proactive: [], proactiveQueue: [], proactiveReadyQueue: [], proactiveReadyStaff: null, proactiveInFlight: null, ownerAtBed: false, ownerAtBedConfirmed: false, dawn: null };
  tutorialWaveIndex = 0;

  invalidateTasks(reason = 'state') {
    this.taskDirty = true;
    this.taskDirtyReasons.add(String(reason));
    this.taskGeneration++;
    return this.taskGeneration;
  }

  taskPerfSnapshot() {
    return { ...this.taskInstrumentation, reasons: { ...this.taskInstrumentation.reasons }, generation: this.taskGeneration, dirty: this.taskDirty };
  }
          nextId = 1;

  constructor(tavern        , econ      ) {
    this.tavern = tavern;
    this.econ = econ;
    this.econ.worldStayState = this.econ.worldStayState && typeof this.econ.worldStayState === 'object' ? this.econ.worldStayState : { worldId: this.econ.currentWorldId || 'hearth_coast', days: 1 };
    const certified = Number(this.econ.certifiedStars);
    this.econ.certifiedStars = Math.max(0, Math.min(5, Number.isFinite(certified) ? Math.round(certified) : starsOf(this.econ.rep)));
    this.econ.certificationHistory = Array.isArray(this.econ.certificationHistory) ? this.econ.certificationHistory : [];
    this.econ.customWorlds = Array.isArray(this.econ.customWorlds) ? this.econ.customWorlds.slice(0, 8).map((world) => normalizeCustomWorld(world, world.id)) : [];
    this.econ.archivedWorlds = Array.isArray(this.econ.archivedWorlds) ? this.econ.archivedWorlds.slice(0, 40) : [];
    this.econ.currentWorldId = this.worldById(this.econ.currentWorldId).id;
    this.econ.pendingWorldSwitch = this.econ.pendingWorldSwitch && typeof this.econ.pendingWorldSwitch === 'object' ? this.econ.pendingWorldSwitch : null;
    this.econ.worldVisits = this.econ.worldVisits && typeof this.econ.worldVisits === 'object' ? this.econ.worldVisits : { [this.econ.currentWorldId]: 1 };
    this.econ.worldKnowledge = { ...blankWorldKnowledge(), ...Object.fromEntries(this.econ.customWorlds.map((world) => [world.id, { level: 4, arrivals: 0, served: 0, firstDay: this.econ.day, reviewed: true, journeyAsked: true }])), ...(this.econ.worldKnowledge || {}) };
    this.econ.factionRelations = this.econ.factionRelations && typeof this.econ.factionRelations === 'object' ? this.econ.factionRelations : {};
    this.econ.worldSeenLevels = this.econ.worldSeenLevels && typeof this.econ.worldSeenLevels === 'object' ? this.econ.worldSeenLevels : {};
    this.econ.recruitmentSeen = this.econ.recruitmentSeen && typeof this.econ.recruitmentSeen === 'object' ? this.econ.recruitmentSeen : {};
    this.econ.worldForecast = worldForecastForDay(this.econ.seed, this.econ.day, this.econ.certifiedStars);
    normalizeGuestSettings(this.econ);
    normalizeContestState(this.econ);
    this.rng = new Rng(econ.seed || 12345);
  }

  worlds() { return allWorlds(this.econ.customWorlds); }
  worldById(id) { return worldById(id, this.econ.customWorlds); }
  currentWorld() { return this.worldById(this.econ.currentWorldId); }
  currentWorldRule() { return worldRuleForDay(this.currentWorld(), this.econ.day); }
  currentWorldFestival() { return worldFestivalForDay(this.currentWorld(), this.econ.day); }

  beginMeeting(first = false) {
    if (this.meetingState.open) return this.meetingState;
    const cards = meetingTopicsFor(this, first).map((topic) => ({ ...topic, attitudes: this.staff.filter((s) => !s.isOwner).map((s) => ({ staffId: s.id, name: s.name, attitude: s.needs.morale >= 70 ? '赞成' : s.needs.stress >= 70 ? '担心' : '观望', preview: topic.effect.morale ? `士气 +${topic.effect.morale}` : topic.effect.rep ? `声望 +${topic.effect.rep}` : '记录世界知识' })) }));
    this.meetingState = { points: 2, cards, selected: [], resolved: [], effectApplied: {}, dialogue: [], open: true, catalogVersion: 1 };
    this.campaign.phase = 'meeting';
    return this.meetingState;
  }

  queuePostReportEvent(event) {
    if (!event?.id) return false;
    this.campaign.postReportEvents ||= [];
    if (this.campaign.postReportEvents.some((row) => row.id === event.id)) return false;
    this.campaign.postReportEvents.push({ ...event, status: 'pending', reportToken: this.campaign.reportState?.token || `day-${this.econ.day}` });
    return true;
  }

  currentPostReportEvent() {
    return (this.campaign.postReportEvents || []).find((event) => event.status !== 'done') || null;
  }

  consumePostReportEvent(id = '') {
    const queue = this.campaign.postReportEvents || [];
    const index = id ? queue.findIndex((row) => row.id === id && row.status !== 'done') : queue.findIndex((row) => row.status !== 'done');
    if (index < 0 || !queue[index]) return null;
    queue[index].status = 'done';
    this.campaign.postReportCursor = index + 1;
    return queue[index];
  }

  drainPostReportEvents() {
    const events = (this.campaign.postReportEvents || []).filter((event) => event.status !== 'done');
    events.forEach((event) => { event.status = 'done'; });
    return events;
  }

  resolveMeetingCard(id) {
    if (!this.meetingState.open || this.meetingState.points <= 0) return false;
    const card = this.meetingState.cards.find((row) => row.id === id);
    if (!card || this.meetingState.resolved.includes(id) || this.meetingState.effectApplied?.[id]) return false;
    this.meetingState.points--;
    this.meetingState.selected.push(id); this.meetingState.resolved.push(id);
    if (card.effect.rep) this.econ.rep = Math.max(0, this.econ.rep + card.effect.rep);
    for (const s of this.staff) if (!s.isOwner && card.effect.morale) s.needs.morale = clamp(s.needs.morale + card.effect.morale, 0, 100);
    if (card.effect.knowledge) {
      const worldId = this.econ.currentWorldId;
      const known = this.econ.worldKnowledge?.[worldId] || { level: 1, arrivals: 0, served: 0 };
      this.econ.worldKnowledge ||= {};
      this.econ.worldKnowledge[worldId] = { ...known, level: Math.min(5, Math.max(0, Number(known.level) || 0) + card.effect.knowledge), meetingNotes: (known.meetingNotes || 0) + card.effect.knowledge };
    }
    this.meetingState.effectApplied ||= {};
    this.meetingState.effectApplied[id] = { ...card.effect };
    this.meetingState.dialogue.push({ topicId: card.id, lines: this.staff.filter((s) => !s.isOwner).map((s) => ({ staffId: s.id, text: `${s.name}：${card.line || '我记下了。'}` })) });
    this.toast(`会议议题「${card.title}」已记录`);
    return true;
  }

  endMeeting(confirm = false) {
    if (!this.meetingState.open) return false;
    // 三选二：有剩余行动点时必须明确确认提前散会，避免误点跳过议题。
    if (this.meetingState.points > 0 && !confirm) return false;
    this.meetingState.open = false; this.campaign.phase = 'night'; return true;
  }

  beginNight() {
    const firstNightTutorial = this.campaign?.mode === 'tutorial' && this.econ.day === 1 && this.campaign.tutorialFlags?.firstEmployeeHired && !this.campaign.tutorialFlags?.nightInteractionIntroduced;
    const proactiveCandidates = firstNightTutorial ? [] : this.staff.filter((s) => !s.isOwner).slice(0, 3).map((s) => s.id);
    this.nightState = { active: true, employeeUses: Object.fromEntries(this.staff.filter((s) => !s.isOwner).map((s) => [s.id, 2])), playerTalks: {}, proactive: [], proactiveQueue: [], proactiveCandidates, proactiveReadyQueue: [], proactiveReadyStaff: null, proactiveInFlight: null, ownerAtBed: false, ownerAtBedConfirmed: false, dawn: null };
    this.campaign.phase = 'night';
    for (const id of proactiveCandidates) { const staff = this.staff.find((s) => s.id === id); const owner = this.staff.find((s) => s.isOwner); if (staff && owner) staff.nightProactiveApproach = true; }
    if (firstNightTutorial) {
      const first = this.staff.find((s) => !s.isOwner);
      if (first) first.nightTutorialApproach = true;
    }
    return this.nightState;
  }

  useNightInteraction(staffId, kind = 'scene', targetId = '') {
    if (!this.nightState.active) this.beginNight();
    const staff = this.staff.find((s) => s.id === staffId && !s.isOwner);
    if (!staff || (this.nightState.employeeUses[staffId] || 0) <= 0) return false;
    if (kind === 'chat') {
      const target = this.staff.find((s) => s.id === targetId && s.id !== staffId);
      if (!target || (this.nightState.employeeUses[target.id] || 0) <= 0) return false;
      this.nightState.employeeUses[staffId]--; this.nightState.employeeUses[target.id]--;
      this.addRel(staff.id, target.id, 2);
    } else {
      this.nightState.employeeUses[staffId]--;
      staff.needs.stress = clamp(staff.needs.stress - 5, 0, 100);
      staff.needs.morale = clamp(staff.needs.morale + 2, 0, 100);
    }
    return true;
  }

  nightMateCandidates(staffId) {
    if (!this.nightState.active || (this.nightState.employeeUses[staffId] || 0) <= 0) return [];
    return this.staff.filter((s) => !s.isOwner && s.id !== staffId && !s.task && (!s.free || s.free.kind === 'wait') && (this.nightState.employeeUses[s.id] || 0) > 0);
  }

  talkToOwnerAtNight(staffId) {
    if (!this.nightState.active || this.nightState.proactive.length >= 3 || this.nightState.proactive.some((row) => (row.id || row) === staffId)) return false;
    const staff = this.staff.find((s) => s.id === staffId && !s.isOwner);
    if (!staff) return false;
    this.nightState.proactive.push({ id: staffId, status: 'done' }); staff.nightProactiveFrozen = false; if (this.nightState.proactiveInFlight?.id === staffId) this.nightState.proactiveInFlight = null; staff.needs.stress = clamp(staff.needs.stress - 8, 0, 100); staff.needs.morale = clamp(staff.needs.morale + 3, 0, 100);
    return true;
  }

  queueProactiveInteraction(staffId, decision = 'later') {
    if (!this.nightState.active || this.nightState.proactive.length >= 3 || this.nightState.proactive.some((row) => (row.id || row) === staffId)) return false;
    const staff = this.staff.find((s) => s.id === staffId && !s.isOwner);
    if (!staff) return false;
    if (decision === 'decline') { this.nightState.proactive.push({ id: staffId, status: 'declined' }); staff.nightProactiveFrozen = false; if (this.nightState.proactiveInFlight?.id === staffId) this.nightState.proactiveInFlight = null; return true; }
    if (decision === 'later') { this.nightState.proactive.push({ id: staffId, status: 'queued' }); this.nightState.proactiveQueue.push(staffId); staff.nightProactiveFrozen = false; if (this.nightState.proactiveInFlight?.id === staffId) this.nightState.proactiveInFlight = null; return true; }
    return this.talkToOwnerAtNight(staffId);
  }

  consumeNightProactiveReady() {
    if (this.nightState?.proactiveInFlight) return this.nightState.proactiveInFlight.id;
    const id = this.nightState?.proactiveReadyQueue?.shift() || this.nightState?.proactiveReadyStaff;
    if (!this.nightState?.active || !id) return null;
    const staff = this.staff.find((s) => s.id === id);
    if (staff) { staff.nightProactiveFrozen = true; staff.free = null; staff.path = []; }
    this.nightState.proactiveInFlight = { id, status: 'opened', openedAt: Date.now() };
    this.nightState.proactiveReadyStaff = this.nightState.proactiveReadyQueue?.[0] || null;
    return id;
  }

  ownerTalkAtNight(staffId) {
    if (!this.nightState.active || this.nightState.playerTalks[staffId]) return false;
    if (!this.staff.some((s) => s.id === staffId && !s.isOwner)) return false;
    this.nightState.playerTalks[staffId] = true;
    const staff = this.staff.find((s) => s.id === staffId);
    staff.needs.stress = clamp(staff.needs.stress - 6, 0, 100); staff.needs.morale = clamp(staff.needs.morale + 2, 0, 100);
    return true;
  }

  confirmNightBed() {
    if (!this.nightState.active || !this.nightState.ownerAtBed) return false;
    this.nightState.ownerAtBedConfirmed = true;
    return true;
  }

  processNextProactiveInteraction() {
    if (!this.nightState.active) return false;
    const staffId = this.nightState.proactiveQueue.shift();
    if (!staffId) return false;
    const row = this.nightState.proactive.find((item) => item.id === staffId && item.status === 'queued');
    if (!row) return false;
    row.status = 'done';
    const staff = this.staff.find((s) => s.id === staffId);
    if (staff) { staff.needs.stress = clamp(staff.needs.stress - 8, 0, 100); staff.needs.morale = clamp(staff.needs.morale + 3, 0, 100); }
    return true;
  }

  processProactiveInteraction(staffId) {
    if (!this.nightState.active) return false;
    const idx = this.nightState.proactiveQueue.indexOf(staffId);
    if (idx < 0) return false;
    this.nightState.proactiveQueue.splice(idx, 1);
    const row = this.nightState.proactive.find((item) => item.id === staffId && item.status === 'queued');
    if (!row) return false;
    row.status = 'done'; const staff = this.staff.find((s) => s.id === staffId); if (staff) staff.nightProactiveFrozen = false; if (this.nightState.proactiveInFlight?.id === staffId) this.nightState.proactiveInFlight = null;
    if (staff) { staff.needs.stress = clamp(staff.needs.stress - 8, 0, 100); staff.needs.morale = clamp(staff.needs.morale + 3, 0, 100); }
    return true;
  }

  finishNight({ force = true } = {}) {
    if (!this.nightState.active || this.nightState.finished) return false;
    if (!force && !this.nightState.ownerAtBedConfirmed) return false;
    for (const s of this.staff) { s.needs.stamina = 100; s.needs.morale = 100; s.needs.stress = 0; s.needs.hunger = 0; s.task = null; s.path = []; s.free = null; }
    this.nightState.active = false; this.nightState.ownerAtBed = true;
    this.nightState.finished = true;
    this.econ.worldStayState = this.econ.worldStayState?.worldId === this.econ.currentWorldId
      ? { worldId: this.econ.currentWorldId, days: Math.max(1, Number(this.econ.worldStayState.days) || 1) + 1 }
      : { worldId: this.econ.currentWorldId, days: 1 };
    this.econ.day++;
    this.campaign.phase = 'prepare';
    this.campaign.firstDayComplete = this.econ.day > 1 || this.campaign.firstDayComplete;
    this.campaign.tutorialFlags = { ...(this.campaign.tutorialFlags || {}), [`day${this.econ.day - 1}Complete`]: true };
    this.refreshPool();
    return true;
  }

  difficultyMods() { return difficultyMods(this.econ); }

  guestCapacityHint() { return guestCapacityRange(this.staff); }

  effectiveGuestCap() {
    const hint = this.guestCapacityHint();
    return this.econ.guestCap > 0 ? this.econ.guestCap : hint.mid;
  }

  setGuestCap(n) {
    const value = Math.round(Number(n));
    this.econ.guestCap = Number.isFinite(value) && value > 0 ? clamp(value, 1, GUEST_CAP_MAX) : 0;
    return this.effectiveGuestCap();
  }

  setDifficulty(id) {
    this.econ.difficulty = DIFFICULTY[id] ? id : 'normal';
    return this.econ.difficulty;
  }

  canOpenBusinessNow() {
    if (this.dayActive || this.sealed) return false;
    if (this.campaign?.mode === 'tutorial' && this.econ.day === 1 && ['prepare', 'ready-open', 'day1-open'].includes(this.campaign.phase) && tutorialMissingFurniture(this).length) return false;
    return ['prepare', 'ready-open', 'day1-open'].includes(this.campaign?.phase) && !['closing-title', 'closing-assemble', 'report', 'post-report-events', 'meeting', 'night', 'world-transition', 'first-recruitment', 'recruit', 'employee-intro'].includes(this.campaign?.phase);
  }

  arrivingGroupCount() {
    return this.groups.filter((group) => group.state === 'wait').length;
  }

  skillOf(s, key) { return effectiveSkill(s, key); }

  resetPerkCharges(staff = this.staff) {
    for (const person of staff) {
      const charges = {};
      for (const row of normalizePerkList(person.perks)) {
        const perk = perkDef(row.id);
        if (perk?.kind === 'daily_restore' || perk?.kind === 'daily_proc') charges[row.id] = row.level;
      }
      person.perkCharges = charges;
    }
  }

  perkChargesLeft(s, perkId) {
    return Math.max(0, Math.round(Number(s?.perkCharges?.[perkId]) || 0));
  }

  consumePerkCharge(s, perkId) {
    if (!s || this.perkChargesLeft(s, perkId) <= 0) return false;
    s.perkCharges[perkId] -= 1;
    return true;
  }

  worldFactionRelations(worldId) {
    const world = this.worldById(worldId);
    const saved = this.econ.factionRelations[world.id] && typeof this.econ.factionRelations[world.id] === 'object' ? this.econ.factionRelations[world.id] : {};
    this.econ.factionRelations[world.id] = saved;
    for (const faction of world.factions || []) if (!Number.isFinite(Number(saved[faction.id]))) saved[faction.id] = 0;
    return saved;
  }

  factionRelation(worldId, factionId) {
    return clamp(Math.round(Number(this.worldFactionRelations(worldId)[factionId]) || 0), -100, 100);
  }

  adjustFactionRelation(worldId, factionId, delta) {
    if (!worldId || !factionId) return 0;
    const rows = this.worldFactionRelations(worldId);
    rows[factionId] = clamp(Math.round((Number(rows[factionId]) || 0) + Number(delta || 0)), -100, 100);
    return rows[factionId];
  }

  worldCommission(worldId = this.econ.currentWorldId) {
    const world = this.worldById(worldId);
    const content = worldContentFor(world);
    const key = `world_${world.id}`;
    const stage = Math.max(0, Math.min(content.chain.steps.length, Number(this.eventChains[key]) || 0));
    const faction = world.factions?.[content.chain.factionIndex] || world.factions?.[0] || { id: 'local', name: '当地势力' };
    return { key, world, faction, chain: content.chain, stage, complete: stage >= content.chain.steps.length, next: content.chain.steps[stage] || null };
  }

  unlockedWorlds() {
    return this.worlds().filter((world) => world.custom || (this.campaign.mode === 'legacy' ? world.unlockStars <= this.stars() : worldUnlockDay(world.id) <= this.econ.day));
  }

  requestWorldSwitch(id) {
    if (this.dayActive) { this.toast('营业中无法迁移旅店，请在打烊规划期操作'); return false; }
    if (this.econ.pendingWorldSwitch) { this.toast('本次打烊期已经确认航行目的地'); return false; }
    const world = this.unlockedWorlds().find((row) => row.id === id);
    if (!world) { this.toast('这个世界尚未与旅店建立稳定航路'); return false; }
    if (world.id === this.econ.currentWorldId) { this.toast('旅店已经位于这个世界'); return false; }
    const cost = worldSwitchCost(world);
    if (this.econ.coins < cost) { this.toast(`界币不足：迁移至${world.name}需要 ${cost} 界币`); return false; }
    this.econ.coins -= cost;
    this.econ.pendingWorldSwitch = { worldId: world.id, cost, confirmedDay: this.econ.day };
    this.toast(`已支付航行费用：${world.icon} ${world.name}（-${cost} 界币）`);
    return true;
  }

  activatePendingWorldSwitch() {
    const pending = this.econ.pendingWorldSwitch;
    if (!pending) return null;
    const world = this.unlockedWorlds().find((row) => row.id === pending.worldId);
    this.econ.pendingWorldSwitch = null;
    if (!world) { this.toast('航路失效，旅店保持在当前世界'); return null; }
    this.econ.currentWorldId = world.id;
    this.econ.worldVisits[world.id] = (this.econ.worldVisits[world.id] || 0) + 1;
    this.econ.worldStayState = { worldId: world.id, days: 1 };
    this.toast(`${world.icon} 旅店已抵达${world.name}：${world.tagline || world.identity.summary}`);
    return world;
  }

  worldKnowledge(id) {
    if (!this.econ.worldKnowledge[id]) this.econ.worldKnowledge[id] = blankWorldKnowledge()[id];
    return this.econ.worldKnowledge[id];
  }

  discoverWorld(id, kind = 'arrival') {
    const entry = this.worldKnowledge(id);
    if (kind === 'arrival') { entry.arrivals++; entry.level = Math.max(entry.level, 1); entry.firstDay ||= this.econ.day; }
    if (kind === 'served') { entry.served++; entry.level = Math.max(entry.level, entry.served >= 3 ? 3 : 2); }
    if (kind === 'review') { entry.reviewed = true; entry.level = 4; }
    if (kind === 'journey') { entry.journeyAsked = true; entry.level = 4; }
    return entry;
  }

  worldDialogueLine(guest, kind, fallbackWorldId = '') {
    const world = this.worldById(guest?.originWorldId || fallbackWorldId || this.econ.currentWorldId);
    const pool = world.dialogue?.[kind] || world.dialogue?.neutral || ['……'];
    const template = pool[this.rng.int(pool.length)] || '……';
    const register = socialRegisterForGuest(guest || {});
    const addresses = world.culture?.addressForms || { peer: '店主', formal: '掌柜', elder: '年轻掌柜', notable: '东道主' };
    const address = addresses[register] || addresses.formal || '掌柜';
    const selfReferences = world.culture?.selfReferences || ['我'];
    const selfReference = guest?.selfReference || selfReferences[stableHash(`${guest?.name || ''}:self`) % selfReferences.length] || '我';
    return String(template).replaceAll('{address}', address).replaceAll('{self}', selfReference);
  }

  recordWorldOutcome(g, score, revenue, reviewed = true, servedMembers = null) {
    const counts = {};
    if (this.dayReport) this.dayReport.worldGuests ||= {};
    for (const member of servedMembers || g.members || []) {
      const id = member.originWorldId || g.originWorldId || WORLD_PROFILES[0].id;
      counts[id] = (counts[id] || 0) + 1;
    }
    for (const [id, count] of Object.entries(counts)) {
      this.discoverWorld(id, 'served');
      if (reviewed) this.discoverWorld(id, 'review');
      if (!this.dayReport) continue;
      const world = this.worldById(id);
      const row = this.dayReport.worldGuests[id] || { name: world.name, arrivals: 0, served: 0, lost: 0, revenue: 0, scoreTotal: 0, scoreSamples: 0, complaints: {} };
      row.served += count; row.revenue += Math.round(revenue * count / Math.max(1, g.size)); row.scoreTotal += score * count; row.scoreSamples += count;
      if (score < 2.75) {
        const weakest = Object.entries(g.lastReview?.parts || {}).sort((a, b) => a[1] - b[1])[0]?.[0] || 'service';
        row.complaints[weakest] = (row.complaints[weakest] || 0) + count;
      }
      this.dayReport.worldGuests[id] = row;
    }
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
    for (let i = 0; i < n; i++) {
      const host = this.currentWorld();
      const local = this.rng.chance(.6) ? weightedPick(this.rng, host.population || [], (row) => row.weight || 1) : null;
      const person = makeStaff(this.rng, this.id(), false, undefined, undefined, { lo: 8, hi: 52, race: local?.raceId, world: host });
      this.pool.push(applyRecruitmentWorld(person, host, this.rng));
    }
    // 开局赠送一张已生效的传单广告，让玩家看到招募系统长什么样
    if (this.econ.day <= 1 && !this.ads.some((a) => a.spec)) {
      const initialWorld = WORLD_PROFILES.some((world) => world.id === this.econ.currentWorldId) ? this.econ.currentWorldId : WORLD_PROFILES[0].id;
      this.ads[0] = { spec: { tier: 'flyer', race: -1, sex: '', bias: '', birthWorldId: initialWorld, customWorldName: '' }, cands: [], day: 1 };
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
    const customWorldName = String(spec.customWorldName || '').trim().slice(0, 80);
    const birthWorld = customWorldName ? null : WORLD_PROFILES.find((world) => world.id === spec.birthWorldId) || this.currentWorld();
    for (let i = 0; i < n; i++) {
      const origin = birthWorld || this.currentWorld();
      const local = spec.race < 0 ? weightedPick(this.rng, origin.population || [], (row) => row.weight || 1) : null;
      const person = makeStaff(this.rng, this.id(), false, undefined, undefined, {
        lo: t.lo, hi: t.hi, race: spec.race >= 0 ? spec.race : local?.raceId, sex: spec.sex || undefined, bias: spec.bias || undefined, world: origin,
      });
      if (birthWorld) applyRecruitmentWorld(person, birthWorld, this.rng);
      else { person.originWorldId = ''; person.originWorldName = customWorldName; person.homeRegion = ''; }
      out.push(person);
    }
    return out;
  }

  /** 发布广告：扣钱并立刻收到 3–5 位候选者（旧候选人被换掉） */
  postAd(slot        , spec        , preparedCandidates = null)          {
    if (slot < 0 || slot > 2) return false;
    const customWorldName = String(spec.customWorldName || '').trim().slice(0, 80);
    const fixedWorld = WORLD_PROFILES.find((world) => world.id === spec.birthWorldId);
    if (!customWorldName && !fixedWorld) { this.toast('请选择应聘者的出生世界'); return false; }
    if (customWorldName && (!Array.isArray(preparedCandidates) || !preparedCandidates.length)) { this.toast('自定义出生世界需要先由 AI 生成人物设定'); return false; }
    spec = { ...spec, birthWorldId: customWorldName ? 'ai_custom' : fixedWorld.id, customWorldName };
    const cost = this.adCost(spec);
    if (this.econ.coins < cost) { this.toast(`界币不足：这条广告要 ${cost}`); return false; }
    this.econ.coins -= cost;
    this.ads[slot] = { spec, cands: Array.isArray(preparedCandidates) ? preparedCandidates : this.rollCands(spec), day: this.econ.day };
    const req           = [];
    req.push(`出生世界：${customWorldName || fixedWorld.name}`);
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
    return Math.min(12, 1 + lounges);
  }

  meetingSeatCapacity() {
    return this.tavern.meetingTables().reduce((sum, table) => sum + this.tavern.meetingSeats(table).length, 0);
  }

  assembleMeetingSeats() {
    const seats = this.tavern.meetingTables().flatMap((table) => this.tavern.meetingSeats(table).map((seat) => ({ ...seat, tableId: table.id })));
    const people = this.staff.slice(0, seats.length);
    this.campaign.closingSeatAssignments = Object.fromEntries(people.map((person, index) => [person.id, seats[index]]));
    this.campaign.closingAssembled = false;
    people.forEach((person, index) => { const seat = seats[index]; person.meetingSeatId = `${seat.tableId}:${seat.x}:${seat.y}`; person.meetingSeat = seat; person.meetingAssemblyPath = this.tavern.path(Math.round(person.x), Math.round(person.y), seat.x, seat.y) || []; person.path = [...person.meetingAssemblyPath]; person.pose = 'walk'; });
    if (this.campaign.mode === 'legacy') this.campaign.closingAssembled = true;
    return this.campaign.closingAssembled;
  }

  hire(poolId        )          {
    const s = this.candById(poolId);
    if (!s) return false;
    if (this.campaign.mode === 'tutorial' && this.econ.day === 1 && !this.campaign.tutorialFlags?.recruitUnlocked) { this.toast('先看完经营小报并建好员工休息室，招聘才会开放'); return false; }
    if (this.campaign.mode !== 'legacy' && this.staff.length + 1 > this.meetingSeatCapacity()) { this.toast('会议桌座位不足：请先为新员工准备一把椅子'); return false; }
    if (this.staff.length >= this.maxStaff()) { this.toast(`没有空卧室了（员工上限 ${this.maxStaff()}）：再建一间员工休息室才能继续招募`); this.sounds.push('error'); return false; }
    const fee = s.wage * 3;
    if (this.econ.coins < fee) { this.toast('界币不足，无法支付入职费'); return false; }
    this.econ.coins -= fee;
    this.pool = this.pool.filter((p) => p.id !== poolId);
    for (const a of this.ads) a.cands = a.cands.filter((p) => p.id !== poolId);
    const e = this.tavern.entrance();
    const owner = this.staff.find((staff) => staff.isOwner);
    const arrival = owner ? this.nearestWalkableTile(Math.round(owner.x) + 1, Math.round(owner.y), { x: 1, y: 0 }) : null;
    s.x = arrival?.x ?? e.x; s.y = arrival?.y ?? e.y;
    s.arrivalFx = 1.35;
    this.fx.push({ x: s.x, y: s.y, t: 1.2, kind: 'portal' });
    s.hireDay = this.econ.day;
    s.prio = plannedStaffPriority(s.skills, s.traits);
    this.staff.push(s);
    if (this.campaign.mode === 'tutorial') {
      this.campaign.tutorialFlags.firstEmployeeHired = true;
      this.campaign.phase = 'employee-intro';
      this.campaign.employeeIntroSequence = { staffId: s.id, stage: 'arrival', t: 0 };
    }
    this.toast(`${s.name}（${s.race}）入职，入职费 ${fee}`);
    const br = this.freeBedroom();
    if (br) { br.occupant = s.id; this.toast(`${s.name}入住了休息室，门牌换成「${s.name}的卧室」`); }
    return true;
  }

  confirmEmployeeIntro() {
    if (this.campaign.mode !== 'tutorial' || this.campaign.phase !== 'employee-intro' || !this.campaign.tutorialFlags?.firstEmployeeHired) return false;
    this.campaign.tutorialFlags.employeeIntroConfirmed = true;
    this.campaign.phase = 'meeting';
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
    if (this.nightState?.active) { this.toast('夜间交谈请使用「主动交谈」额度'); return ''; }
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
    s.aff = clamp(s.aff + gain, 0, this.ownerAffCap(s));
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

  /** 生产级释放员工工作：解雇/取消时保留已发生的业务副作用，但把订单恢复到可续接阶段。 */
  releaseStaffWork(staffId, reason = 'fire') {
    const staff = this.staff.find((person) => person.id === staffId);
    if (!staff) return false;
    this.invalidateTasks(`staff-${reason}`);
    const task = staff.task;
    if (task) {
      for (const [stationId, owner] of this.stationOwner) if (owner === task.key) this.stationOwner.delete(stationId);
      const match = /^cook:(\d+)$/.exec(String(task.key || ''));
      const order = match ? this.orders.find((row) => row.id === Number(match[1])) : null;
      if (order) {
        // 取料后不退原料；重新生成烹饪任务时跳过再次扣料，避免解雇造成库存/收费双扣。
        order.stage = 'queued'; order.releasedBy = reason; order.cookId = 0; order.passId = 0;
      }
      const served = /^serve:(\d+)$/.exec(String(task.key || ''));
      const servedOrder = served ? this.orders.find((row) => row.id === Number(served[1])) : null;
      if (servedOrder) {
        const pass = servedOrder.passId ? this.tavern.furnById(servedOrder.passId) : null;
        const picked = !!(servedOrder.servicePicked || task.servicePicked);
        if (picked && pass) pass.plates = (pass.plates || 0) + 1;
        servedOrder.servicePicked = false;
        servedOrder.stage = 'ready'; servedOrder.releasedBy = reason;
      }
    }
    staff.task = null; staff.path = []; staff.carry = null; staff.actT = 0; staff.actTotal = 0; staff.note = ''; staff.pose = 'idle';
    staff.free = null; staff.nightProactiveFrozen = false; staff.nightProactiveApproach = false;
    return !!task;
  }

  fire(id        )       {
    const s = this.staff.find((x) => x.id === id);
    if (!s || s.isOwner) return;
    this.releaseStaffWork(id, 'fire');
    // 立即释放所有夜间交互、路径冻结和任务占用，避免离职员工把任务卡死。
    this.nightState.proactive = (this.nightState.proactive || []).filter((row) => (row.id || row) !== id);
    this.nightState.proactiveQueue = (this.nightState.proactiveQueue || []).filter((row) => (row.id || row) !== id);
    this.nightState.proactiveReadyQueue = (this.nightState.proactiveReadyQueue || []).filter((row) => row !== id);
    if (this.nightState.proactiveReadyStaff === id || this.nightState.proactiveInFlight?.id === id) this.nightState.proactiveReadyStaff = null, this.nightState.proactiveInFlight = null;
    delete this.nightState.playerTalks?.[id];
    s.dismissFx = 1.2;
    s.dismissPending = true;
    s.bubble = { text: ['老板，有缘再见！', '我会想念这里的。', '谢谢这些日子的照顾！'][Math.abs(s.id) % 3], t: 1.2 };
    this.fx.push({ x: s.x, y: s.y, t: 1.2, kind: 'portal' });
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

  /** 相性不合（性格犯冲）时，对店长或同事的好感上限为 40。 */
  ownerAffCap(staff) {
    const owner = this.staff.find((person) => person.isOwner);
    if (!staff || staff.isOwner || !owner) return 100;
    return this.chemistry(staff, owner) < 0 ? 40 : 100;
  }

  pairRelCap(a, b) {
    if (!a || !b) return 70;
    return this.chemistry(a, b) < 0 ? 40 : 70;
  }

  adjustOwnerAff(staff, delta) {
    if (!staff || staff.isOwner) return staff?.aff || 0;
    staff.aff = clamp((Number(staff.aff) || 0) + Number(delta || 0), 0, this.ownerAffCap(staff));
    return staff.aff;
  }

  addRel(a        , b        , d        )         {
    const left = this.staff.find((person) => person.id === a);
    const right = this.staff.find((person) => person.id === b);
    const cap = this.pairRelCap(left, right);
    const v = clamp(this.relOf(a, b) + d, -100, cap);
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
  freeChatPair(s, mate, quarrel = false) {
    if (quarrel) return CHAT_BAD[this.rng.int(CHAT_BAD.length)];
    const rel = this.relOf(s.id, mate.id);
    if (rel >= 25 && this.rng.chance(rel >= 60 ? 0.7 : 0.45)) return CHAT_CLOSE[this.rng.int(CHAT_CLOSE.length)];
    const sharedJob = s.job === mate.job ? s.job : null;
    const job = sharedJob && CHAT_JOB[sharedJob] ? sharedJob
      : CHAT_JOB[s.job] ? s.job
        : CHAT_JOB[mate.job] ? mate.job : null;
    if (job && this.rng.chance(sharedJob ? 0.72 : 0.42)) {
      const pool = CHAT_JOB[job];
      return pool[this.rng.int(pool.length)];
    }
    return CHAT_GOOD[this.rng.int(CHAT_GOOD.length)];
  }

  recordFreeChat(s, mate, pair, quarrel = false) {
    const mark = quarrel ? '拌嘴' : '闲聊';
    s.chatLog.unshift(`第${this.econ.day}天·和${mate.name}${mark}：${pair[0]}`);
    mate.chatLog.unshift(`第${this.econ.day}天·和${s.name}${mark}：${pair[1]}`);
    if (s.chatLog.length > 8) s.chatLog.pop();
    if (mate.chatLog.length > 8) mate.chatLog.pop();
  }

  speakFreeThought(s, f) {
    const pool = FREE_THOUGHTS[f.kind] || FREE_THOUGHTS.wander;
    const alternatives = pool.filter((line) => line !== f.lastThought);
    const th = (alternatives.length ? alternatives : pool)[this.rng.int((alternatives.length ? alternatives : pool).length)];
    f.lastThought = th;
    s.bubble = { text: th, t: 2.8 };
    this.say(`${s.name}：${th}`);
  }

  tickFreeTime(dt        )       {
    for (const s of this.staff) {
      if (s.isOwner) continue;
      if (this.nightState.active && s.nightTutorialApproach) {
        const owner = this.staff.find((x) => x.isOwner);
        if (owner && Math.hypot(owner.x - s.x, owner.y - s.y) > 1.8) {
          s.path = this.tavern.path(Math.round(s.x), Math.round(s.y), Math.round(owner.x), Math.round(owner.y)) || [];
          if (s.path.length) { this.moveActor(s, dt, 1.7); continue; }
        }
        s.nightTutorialApproach = false;
        s.bubble = { text: '今天辛苦了，老板。打烊以后原来还可以自由聊聊天！', t: 4.5 };
        if (owner) owner.bubble = { text: '嗯，今晚可以自由活动。想休息时回我的房间就好。', t: 4.5 };
        if (owner) this.addRel(owner.id, s.id, 2);
        this.campaign.tutorialFlags.nightInteractionIntroduced = true;
      }
      if (this.nightState.active && s.nightProactiveFrozen) { s.free = null; s.path = []; s.pose = 'idle'; continue; }
      if (this.nightState.active && s.nightProactiveApproach && !this.nightState.proactive.some((row) => row.id === s.id)) {
        const owner = this.staff.find((x) => x.isOwner);
        if (owner && Math.hypot(owner.x - s.x, owner.y - s.y) > 1.8) {
          s.path = this.tavern.path(Math.round(s.x), Math.round(s.y), Math.round(owner.x), Math.round(owner.y)) || [];
          if (s.path.length) { this.moveActor(s, dt, 1.7); continue; }
        }
        s.nightProactiveApproach = false;
        if (!this.nightState.proactiveReadyQueue.includes(s.id)) this.nightState.proactiveReadyQueue.push(s.id);
        this.nightState.proactiveReadyStaff = this.nightState.proactiveReadyQueue[0] || null;
      }
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
        f.chatCd = Math.max(0, (f.chatCd || 0) - dt);
        if ((f.spoken || 0) < 2 && f.chatCd <= 0 && this.rng.chance(0.5 * dt)) {
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
            const spat = this.freeChatPair(s, mate, true);
            s.bubble = { text: spat[0], t: 2.6 };
            mate.bubble = { text: spat[1], t: 2.8 };
            this.say(`${s.name}：${spat[0]}　／　${mate.name}：${spat[1]}`);
            this.recordFreeChat(s, mate, spat, true);
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
            const pair = this.freeChatPair(s, mate);
            s.bubble = { text: pair[0], t: 2.6 };
            mate.bubble = { text: pair[1], t: 2.8 };
            this.say(`${s.name}：${pair[0]}　／　${mate.name}：${pair[1]}`);
            this.recordFreeChat(s, mate, pair);
            if (v >= 25 && v - gain < 25) this.toast(`${s.name}和${mate.name}成了合得来的同事`);
            if (v >= 60 && v - gain < 60) this.toast(`${s.name}和${mate.name}成了挚友`);
          }
          f.spoken = (f.spoken || 0) + 1;
          f.chatCd = 2.4;
        }
      } else if (['stargaze', 'game', 'brew', 'watch', 'stroll', 'fire', 'aquarium', 'billiards', 'soak', 'flowers', 'crystal', 'wine', 'cards', 'sketch'].includes(f.kind)) {
        if (f.kind === 'watch') s.pose = 'sit';
        else if (f.kind === 'fire' || f.kind === 'soak' || f.kind === 'cards') s.pose = 'sit';
        else if (f.kind === 'game' || f.kind === 'brew' || f.kind === 'billiards' || f.kind === 'flowers' || f.kind === 'wine' || f.kind === 'sketch') s.pose = 'work';
        else s.pose = 'idle';
        if (f.kind === 'stargaze') { s.needs.stress = clamp(s.needs.stress - 1.4 * dt, 0, 100); if (this.rng.chance(0.02 * dt)) this.sounds.push('chime'); }
        if (f.kind === 'game') { s.needs.morale = clamp(s.needs.morale + 1.6 * dt, 0, 100); if (this.rng.chance(0.03 * dt)) this.sounds.push('chime'); }
        if (f.kind === 'brew') { s.needs.stress = clamp(s.needs.stress - 0.8 * dt, 0, 100); s.needs.morale = clamp(s.needs.morale + 0.8 * dt, 0, 100); }
        if (f.kind === 'watch') s.needs.morale = clamp(s.needs.morale + 1.2 * dt, 0, 100);
        if (f.kind === 'stroll') { s.needs.stress = clamp(s.needs.stress - 1.2 * dt, 0, 100); s.needs.morale = clamp(s.needs.morale + 0.4 * dt, 0, 100); }
        if (f.kind === 'fire') { s.needs.stress = clamp(s.needs.stress - 1.4 * dt, 0, 100); s.needs.stamina = clamp(s.needs.stamina + 0.6 * dt, 0, 100); }
        if (f.kind === 'aquarium') s.needs.stress = clamp(s.needs.stress - 1.5 * dt, 0, 100);
        if (f.kind === 'billiards') s.needs.morale = clamp(s.needs.morale + 1.3 * dt, 0, 100);
        if (f.kind === 'soak') { s.needs.stress = clamp(s.needs.stress - 1.8 * dt, 0, 100); s.needs.stamina = clamp(s.needs.stamina + 1 * dt, 0, 100); }
        if (f.kind === 'flowers') { s.needs.stress = clamp(s.needs.stress - 1.2 * dt, 0, 100); s.needs.morale = clamp(s.needs.morale + 0.6 * dt, 0, 100); }
        if (f.kind === 'crystal') s.needs.stress = clamp(s.needs.stress - 1.4 * dt, 0, 100);
        if (f.kind === 'wine') s.needs.morale = clamp(s.needs.morale + 0.8 * dt, 0, 100);
        if (f.kind === 'cards') s.needs.morale = clamp(s.needs.morale + 1.2 * dt, 0, 100);
        if (f.kind === 'sketch') { s.needs.stress = clamp(s.needs.stress - 0.8 * dt, 0, 100); s.needs.morale = clamp(s.needs.morale + 0.7 * dt, 0, 100); }
      } else if (f.kind === 'piano' || f.kind === 'tend' || f.kind === 'snack' || f.kind === 'read' || f.kind === 'tea' || f.kind === 'groom') {
        s.pose = 'work';
        if (f.kind === 'piano') {
          s.needs.morale = clamp(s.needs.morale + 1.2 * dt, 0, 100);
          if (this.rng.chance(0.03 * dt)) this.sounds.push('chime');
        }
        if (f.kind === 'tend') s.needs.stress = clamp(s.needs.stress - 1.2 * dt, 0, 100);
        if (f.kind === 'snack') s.needs.hunger = clamp(s.needs.hunger - 3 * dt, 0, 100);
        if (f.kind === 'read') s.needs.stress = clamp(s.needs.stress - 1.6 * dt, 0, 100);
        if (f.kind === 'tea') { s.needs.hunger = clamp(s.needs.hunger - 2.2 * dt, 0, 100); s.needs.morale = clamp(s.needs.morale + 0.6 * dt, 0, 100); }
        if (f.kind === 'groom') s.needs.morale = clamp(s.needs.morale + 1.4 * dt, 0, 100);
      } else {
        s.pose = 'idle';   // wander/wait：到了就发会儿呆
      }
      if (f.kind !== 'chat' && !f.midSpoken && f.total > 1 && f.t <= f.total * 0.55) {
        f.midSpoken = true;
        if (this.rng.chance(0.58)) this.speakFreeThought(s, f);
      }
      if (f.t <= 0) {
        if (this.nightState.active && f.nightCost && !f.completed) {
          this.nightState.employeeUses[s.id] = Math.max(0, (this.nightState.employeeUses[s.id] || 0) - f.nightCost);
          if (f.kind === 'chat' && f.partner !== undefined) this.nightState.employeeUses[f.partner] = Math.max(0, (this.nightState.employeeUses[f.partner] || 0) - 1);
          f.completed = true;
        }
        s.free = null;
      }
    }
  }

  pickFreeAct(s       )       {
    // 营业中出现持续积压的紧急工作时，空闲员工先保持待命，避免所有人
    // 同时进入休息动画；下一次任务扫描会把其中至少一人分配给积压项。
    if (this.dayActive && !s.isOwner && this.workQueue().some((row) => !row.staff && row.age >= 2)) {
      s.free = { kind: 'wait', tx: Math.round(s.x), ty: Math.round(s.y), t: 0.5, total: 0.5, urgentHold: true };
      return;
    }
    if (this.nightState.active && !s.isOwner) {
      const uses = Number(this.nightState.employeeUses[s.id] || 0);
      if (uses <= 0) {
        const rest = this.restFurnsFor(s).find((f) => this.tavern.roomOfFurn(f)?.occupant === s.id) || this.restFurnsFor(s)[0];
        const tile = rest ? this.tavern.standTileNear(this.tavern.useTiles(rest)) : null;
        s.free = tile ? { kind: 'rest', tx: tile.x, ty: tile.y, t: 999, total: 999, nightSleep: true } : { kind: 'wait', tx: Math.round(s.x), ty: Math.round(s.y), t: 999, total: 999, nightSleep: true };
        return;
      }
    }
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
    // 设施房和公共区域都会成为打烊后的去处。
    for (const [fk, kind, w] of [
      ['telescope', 'stargaze', 1.4], ['arcadem', 'game', 1.9], ['cauldron', 'brew', 1.2],
      ['screen', 'watch', 1.5], ['fountain', 'stroll', 1.3], ['fireplace', 'fire', 1.6],
      ['aquarium', 'aquarium', 1.5], ['billiardtable', 'billiards', 1.8], ['pool', 'soak', 1.5],
      ['flowerbed', 'flowers', 1.3], ['crystal', 'crystal', 1.2], ['winecabinet', 'wine', 1.1],
      ['table', 'cards', 1.2], ['statue', 'sketch', 0.9],
    ]                              ) {
      if (this.tavern.furnsOfKind(fk).length) {
        const t = spot([fk]);
        if (t) opts.push({ kind, w, tx: t.x, ty: t.y });
      }
    }
    const mates = this.nightMateCandidates(s.id).filter((x) => !claimed.has(x.id) && !(x.free && x.free.kind === 'chat'));
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
    const nightCost = this.nightState.active && !s.isOwner ? 1 : 0;
    const duration = pick.kind === 'wander' ? 1 : this.rng.range(6, 12);
    s.free = {
      kind: pick.kind, tx: pick.tx, ty: pick.ty, partner: pick.partner,
      t: duration, total: duration, spoken: 0, chatCd: 0, midSpoken: false, nightCost,
    };
    // 冒出一句心里话：头顶气泡 + 底部信息栏
    if (pick.kind !== 'chat' && this.rng.chance(0.72)) this.speakFreeThought(s, s.free);
  }

  // ---------- 营业日 ----------
  openDay()       {
    if (this.tavern.rooms.length) {
      const layoutMode = this.campaign?.mode || (this.tavern.legacy ? 'legacy' : 'tutorial');
      const layoutCheck = validateLayout(this.tavern.serialize(), layoutMode, { operation: 'openDay' });
      if (!layoutCheck.ok) { this.toast(`无法开业：${layoutCheck.reason}`); return false; }
    }
    this.lastStat = null;
    if (this.campaign.mode === 'tutorial' && this.econ.day === 3 && !this.campaign.tutorialFlags?.worldTravelComplete) {
      this.econ.pendingWorldSwitch = { worldId: 'magma_ridge', cost: 0, confirmedDay: this.econ.day, tutorial: true };
      this.campaign.phase = 'world-transition';
      this.toast('晨间准备：今天第一次免费迁往玄黄大世界');
      return false;
    }
    if (this.campaign.mode === 'tutorial' && this.econ.day === 3 && this.econ.currentWorldId !== 'magma_ridge') {
      this.econ.currentWorldId = 'magma_ridge';
      this.econ.worldStayState = { worldId: 'magma_ridge', days: 1 };
      this.toast('教学航行：首次前往玄黄大世界，本次航行费用由旅店承担');
    }
    this.econ.worldForecast = worldForecastForDay(this.econ.seed, this.econ.day, this.stars());
    this.dayT = 0;
    this.tutorialWaveIndex = 0;
    this.aiEventRequested = false;
    this.queuedDynamicEvent = null;
    this.facilityChallenges = [];
    this.challengeEventQueue = [];
    this.stationOwner.clear();
    this.pendingFacilityReset.clear();
    this.roomUsage = {};
    this.dayActive = true;
    this.running = true;
    if (this.campaign?.mode === 'legacy' || this.campaign?.phase === 'prepare' || this.campaign?.phase === 'ready-open') this.campaign.phase = 'business';
    this.resetPerkCharges();
    this.econ.revenue = 0; this.econ.served = 0; this.econ.lost = 0;
    this.scores = [];
    this.scoreParts = { quality: [], wait: [], service: [], hygiene: [], comfort: [], spectacle: [] };
    this.dayReport = {
      day: this.econ.day,
      started: {
        coins: this.econ.coins, rep: this.econ.rep, stock: { ...this.econ.stock },
        staff: this.staff.map((s) => ({ id: s.id, name: s.name, job: s.job, skills: { ...s.skills }, needs: { ...s.needs } })),
      },
      work: {}, dishSales: {}, facilitySales: {}, stockUsed: {}, lostReasons: {}, events: [], moments: [], worldGuests: {},
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
    // 教学前三日只演示固定客流链；随机世界事件留到正式经营日开放。
    if (!(this.campaign.mode === 'tutorial' && this.econ.day <= 3)) {
      const evCount = this.rng.chance(0.55) ? 2 : 1;
      for (let i = 0; i < evCount; i++) this.eventTimes.push(this.rng.range(60, 265));
    }
    this.eventTimes.sort((a, b) => a - b);
    this.toast(`第 ${this.econ.day} 天开门营业`);
  }

  resetClosingHousekeeping() {
    this.tavern.dirt = [];
    const occupied = new Set();
    for (const g of this.groups) if (g.overnight && g.facId) occupied.add(g.facId);
    for (const [furnId] of this.facOwner) occupied.add(furnId);
    for (const f of this.tavern.furns) {
      if (occupied.has(f.id)) continue;
      if (f.dirty) f.dirty = 0;
      if (f.plates) f.plates = 0;
    }
    this.orders = [];
    this.facilityChallenges = [];
    this.challengeEventQueue = [];
    this.queuedDynamicEvent = null;
    this.pendingEvent = null;
    this.stationOwner.clear();
    this.pendingFacilityReset.clear();
    for (const r of this.tavern.rooms) r.clean = 100;
  }

  closeBusiness()          {
    if (this.lastStat && ['closing-title', 'closing-assemble', 'report', 'post-report-events', 'settlement', 'meeting'].includes(this.campaign.phase)) return this.lastStat;
    const reportToken = `day-${this.econ.day}`;
    this.campaign.reportState = { token: reportToken, stat: null };
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
    this.resetClosingHousekeeping();
    const wages = this.staff.filter((s) => !s.isOwner).reduce((a, s) => a + s.wage, 0);
    const maintenanceDetail = maintenanceBreakdown(this.tavern);
    const maintenance = maintenanceDetail.total;
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
    // closeBusiness 只封存营业并生成日报：不在这里恢复需求、改变亲密度或
    // 随机辞退员工。所有跨夜恢复和社交副作用必须在夜间玩法/finishNight发生。
    for (const r of this.tavern.rooms) r.maint = clamp(r.maint - 2, 30, 100);
    // v10 legacy 存档仍使用原先的自动关系结算；v11 教学档把这类副作用
    // 留给真实夜间互动，避免日报阶段凭空改变关系或触发离职。
    if (this.campaign.mode === 'legacy') {
      for (const s of this.staff) if (!s.isOwner) this.adjustOwnerAff(s, 5);
      const coworkers = this.staff.filter((person) => !person.isOwner);
      for (let i = 0; i < coworkers.length; i++) for (let j = i + 1; j < coworkers.length; j++) {
        const cap = this.pairRelCap(coworkers[i], coworkers[j]);
        const key = this.relKey(coworkers[i].id, coworkers[j].id);
        if ((this.rels[key] || 0) > cap) this.rels[key] = cap;
      }
    }
    const scoreBreakdown = {};
    for (const [key, values] of Object.entries(this.scoreParts)) {
      scoreBreakdown[key] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
    }
    const stat          = {
      day: this.econ.day, revenue: this.econ.revenue, wages, maintenance, maintenanceRooms: maintenanceDetail.rooms, restock,
      served: this.econ.served, lost: this.econ.lost, repDelta, avgScore: avg,
      coinsAfter: this.econ.coins, sealed, creditLine, scoreBreakdown, fiveStarReached, ownerSkillGrowth,
    };
    stat.report = this.finishDayReport(stat);
    if (this.campaign.mode === 'tutorial' && stat.day === 1 && !this.campaign.firstGrantClaimed) {
      this.econ.coins += 1000;
      this.campaign.firstGrantClaimed = true;
      stat.firstDayGrant = 1000;
      stat.coinsAfter = this.econ.coins;
      if (stat.report?.finance) { stat.report.finance.grant = 1000; stat.report.finance.coinsAfter = this.econ.coins; }
      this.queuePostReportEvent({ id: 'silver-crown-grant', kind: 'grant', text: '银冠王国为旅店重新开业赠予1000界币。' });
    }
    const starsBeforeCertification = this.stars();
    stat.certification = this.evaluateCertification(stat);
    if (this.campaign.mode === 'tutorial' && stat.day === 4 && this.stars() < 1) {
      const goals = [stat.served >= 6, stat.avgScore >= 3, stat.lost <= 1];
      const tier = goals.filter(Boolean).length;
      const repBeforeAdjustment = this.econ.rep;
      if (this.econ.rep < 60) this.econ.rep = 60;
      stat.certificationAdjustment = { before: repBeforeAdjustment, after: this.econ.rep, delta: this.econ.rep - repBeforeAdjustment, reason: '四日教学保底认证' };
      if (stat.report?.reputation) {
        stat.report.reputation.after = this.econ.rep;
        stat.report.reputation.delta += stat.certificationAdjustment.delta;
      }
      stat.certification.achieved = true;
      stat.certification.level = 1;
      stat.certification.tutorialGuaranteed = true;
      stat.certificationBonus = tier >= 3 ? 500 : tier === 2 ? 350 : 200;
      stat.certification.requirements = stat.certification.requirements.map((row) => {
        if (row.label === '声望') return { ...row, current: Math.round(this.econ.rep), met: this.econ.rep >= 60 };
        if (row.label === '单日服务人数') return { ...row, current: stat.served, met: goals[0] };
        if (row.label === '平均评分') return { ...row, current: Number(stat.avgScore.toFixed(2)), met: goals[1] };
        if (row.label === '客人流失') return { ...row, current: stat.lost, met: goals[2] };
        return row;
      });
    } else if (this.campaign.mode === 'tutorial' && stat.day === 4) {
      stat.certificationAdjustment = { before: this.econ.rep, after: this.econ.rep, delta: 0, reason: '四日教学认证已完成' };
    }
    if (stat.certification.achieved) {
      this.econ.certifiedStars = stat.certification.level;
      const bonus = stat.certificationBonus || certificationBonus(stat.certification.level);
      this.econ.coins += bonus;
      stat.certificationBonus = bonus;
      stat.coinsAfter = this.econ.coins;
      if (stat.report?.finance) {
        stat.report.finance.certificationBonus = bonus;
        stat.report.finance.coinsAfter = this.econ.coins;
      }
      this.toast(`★${stat.certification.level} 星经营认证通过！评议会奖金 +${bonus}`);
      this.queuePostReportEvent({ id: `certification-${stat.day}-${stat.certification.level}`, kind: 'certification', text: `评议会宣布：本日经营达到${stat.certification.level}星认证。` });
      fiveStarReached = !this.endingSeen && this.stars() >= 5;
      if (fiveStarReached) this.endingSeen = true;
      stat.fiveStarReached = fiveStarReached;
      const connected = WORLD_PROFILES.filter((world) => world.unlockStars > starsBeforeCertification && world.unlockStars <= this.stars());
      if (connected.length) {
        stat.newWorldConnections = connected.map((world) => world.id);
        this.toast(`位面航路接通：${connected.map((world) => world.name).join('、')}`);
      }
    }
    if (this.econ.contest?.active && this.econ.contest.active.lastMatchDay !== this.econ.day) {
      this.queuePostReportEvent({ id: `active-contest-${this.econ.day}`, kind: 'active-contest', text: '本日赛事已准备，可以开始比赛。' });
    }
    if (stat.fiveStarReached) this.queuePostReportEvent({ id: `five-star-finale-${stat.day}`, kind: 'five-star-finale', text: '五星庆典准备就绪。' });
    this.econ.worldForecast = worldForecastForDay(this.econ.seed, this.econ.day, this.stars());
    this.campaign.reportState = { stat, token: reportToken };
    this.campaign.phase = 'closing-title';
    this.lastStat = stat;
    this.maybeQueueContestInvite();
    this.lastStat = stat;
    return stat;
  }

  /** 兼容旧调用方：旧 API 仍表示“结算并进入次日”，新流程请使用 closeBusiness + finishNight。 */
  closeDay() {
    const legacyNeeds = new Map(this.staff.map((s) => [s.id, { ...s.needs }]));
    const stat = this.closeBusiness();
    this.beginNight();
    this.finishNight();
    // 旧调用方保留旧的士气/压力结算，只将体力恢复到满值。
    for (const s of this.staff) {
      const before = legacyNeeds.get(s.id);
      if (before) { s.needs.morale = before.morale; s.needs.hunger = before.hunger; s.needs.stress = before.stress; s.needs.stamina = 100; }
    }
    return stat;
  }

  tavernTitle() {
    return equippedTitleOf(this.econ);
  }

  maybeQueueContestInvite() {
    normalizeContestState(this.econ);
    const contest = this.econ.contest;
    if (contest.pendingInvite || contest.active) return null;
    const invite = nextContestInvite(this.stars(), this.econ.currentWorldId, contest);
    if (!invite) return null;
    contest.pendingInvite = invite;
    this.queuePostReportEvent({ id: `contest-invite-${invite.tier}-${invite.worldId}-${this.econ.day}`, kind: 'contest-invite', text: `来自${this.worldById(invite.worldId).name}的大赛邀请已送达。` });
    return invite;
  }

  acceptContestInvite() {
    normalizeContestState(this.econ);
    const invite = this.econ.contest.pendingInvite;
    if (!invite) return null;
    const world = invite.tier === 'myriad' ? { id: 'myriad', name: '诸天万界' } : this.worldById(invite.worldId);
    const stage = CONTEST_STAGES[0];
    this.econ.contest.active = {
      tier: invite.tier, worldId: invite.worldId || '', stage: stage.id,
      lastMatchDay: 0, seed: this.econ.seed + this.econ.day * 17,
      opponent: makeOpponent(this.rng, world, stage.id),
    };
    this.econ.contest.pendingInvite = null;
    this.toast(`已报名「${contestNameOf(invite.tier, world)}」`);
    return this.econ.contest.active;
  }

  declineContestInvite() {
    normalizeContestState(this.econ);
    const invite = this.econ.contest.pendingInvite;
    if (!invite) return false;
    this.econ.contest.records[contestKey(invite.tier, invite.worldId)] = 'declined';
    this.econ.contest.pendingInvite = null;
    this.toast('已拒绝邀请。该世界本轮大赛链路取消。');
    return true;
  }

  grantContestTitle(place) {
    const active = this.econ.contest?.active;
    if (!active || place > 16) return null;
    const world = active.tier === 'myriad' ? { id: 'myriad', name: '诸天万界' } : this.worldById(active.worldId);
    const title = {
      id: `title_${contestKey(active.tier, active.worldId)}_${place}`,
      name: titleNameFor(active.tier, world, place),
      tier: titleTierForPlace(active.tier, place),
      contest: contestNameOf(active.tier, world),
      place,
    };
    this.econ.titles = (this.econ.titles || []).filter((row) => row.id !== title.id);
    this.econ.titles.push(title);
    if (!this.econ.equippedTitle) this.econ.equippedTitle = title.id;
    return title;
  }

  finishContestMatch(tactics) {
    const active = this.econ.contest?.active;
    if (!active) return null;
    const result = resolveContestMatch(this, tactics);
    if (!result) return null;
    active.lastMatchDay = this.econ.day;
    const world = active.tier === 'myriad' ? { id: 'myriad', name: '诸天万界' } : this.worldById(active.worldId);
    if (result.passed && result.stage.next) {
      active.stage = result.stage.next;
      active.opponent = makeOpponent(this.rng, world, active.stage);
      result.advanced = true;
      result.nextStage = stageById(active.stage);
      this.toast(`${result.stage.name}过关，下一场：${result.nextStage.name}`);
    } else {
      const place = result.passed ? 1 : (result.stage.id === 'final' ? 2 : result.stage.place);
      const title = this.grantContestTitle(place);
      this.econ.contest.records[contestKey(active.tier, active.worldId)] = result.passed ? 'champion' : `place_${place}`;
      this.econ.contest.active = null;
      result.finished = true;
      result.place = place;
      result.title = title;
      this.toast(result.passed ? `夺冠！获得称号「${title.name}」` : `${result.stage.name}止步，获得称号「${title?.name || '参赛纪念'}」`);
    }
    result.contestName = contestNameOf(active.tier, world);
    return result;
  }

  equipTitle(id) {
    normalizeContestState(this.econ);
    if (!id) { this.econ.equippedTitle = ''; return true; }
    if (!(this.econ.titles || []).some((row) => row.id === id)) return false;
    this.econ.equippedTitle = id;
    return true;
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
      work: {}, dishSales: {}, facilitySales: {}, stockUsed: {}, lostReasons: {}, events: [], moments: [], worldGuests: {},
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

  buildCertification(stat = this.lastStat) {
    const level = Math.min(5, this.stars() + 1);
    if (!stat || this.stars() >= 5) return { level: this.stars(), achieved: false, complete: true, requirements: [], description: '' };
    const rule = STAR_CERTIFICATIONS[level];
    const report = stat.report || this.dayReport || {};
    const add = (label, current, target, met) => ({ label, current, target, met: !!met });
    const avgScore = Number(stat.avgScore) || 0;
    const requirements = [
      add('声望', Math.round(this.econ.rep), STAR_THRESHOLDS[level], this.econ.rep >= STAR_THRESHOLDS[level]),
      add('单日服务人数', stat.served, rule.served, stat.served >= rule.served),
      add('平均评分', Number(avgScore.toFixed(2)), rule.avgScore, avgScore >= rule.avgScore),
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
    return {
      day: stat.day, level, achieved: requirements.every((row) => row.met), complete: false,
      requirements, description: rule.description || '',
    };
  }

  evaluateCertification(stat = this.lastStat) {
    const result = this.buildCertification(stat);
    if (result.requirements.length) {
      this.econ.certificationHistory.push(result);
      if (this.econ.certificationHistory.length > 40) this.econ.certificationHistory.shift();
    }
    return result;
  }

  previewCertification() {
    const scores = this.scores || [];
    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return this.buildCertification({
      day: this.econ.day,
      served: this.econ.served,
      lost: this.econ.lost,
      avgScore,
      report: this.dayReport || {},
    });
  }

  // ---------- 主循环 ----------
  update(dt        )       {
    if (!this.running) {
      if (this.campaign.phase === 'closing-assemble' && !this.campaign.closingAssembled) {
        let seated = 0;
        for (const s of this.staff) {
          if (s.path?.length) this.moveActor(s, dt, 1.7);
          const seat = s.meetingSeat;
          if (seat && !s.path.length && Math.hypot(s.x - seat.x, s.y - seat.y) < .35) { s.x = seat.x; s.y = seat.y; s.pose = 'sit'; s.dir = seat.dir; seated++; }
        }
        this.campaign.closingAssembled = seated === this.staff.length;
        this.tickAnim(dt); return;
      }
      this.tickDepartures(dt);
      // 收盘规划期：店主归玩家驱动，伙计们自由行动（研究/休息/调酒/串门聊天）
      if (this.manualOwner) { const o = this.staff.find((x) => x.isOwner); if (o) this.driveOwner(o, dt); }
      if (this.nightState?.active || this.campaign?.mode === 'legacy') this.tickFreeTime(dt);
      this.tickAnim(dt); return;
    }
    this.dayT += dt;
    if (!this.pendingEvent && this.challengeEventQueue.length) this.pendingEvent = this.challengeEventQueue.shift();
    if (!this.pendingEvent && this.queuedDynamicEvent && !(this.campaign.mode === 'tutorial' && this.econ.day <= 3)) {
      this.pendingEvent = this.queuedDynamicEvent;
      this.queuedDynamicEvent = null;
      this.fx.push({ ...this.tavern.entrance(), t: 1.2, kind: 'event' });
      this.sounds.push('alert');
    }
    if (this.dayActive && this.eventTimes.length && this.dayT >= this.eventTimes[0] && !this.pendingEvent && !(this.campaign.mode === 'tutorial' && this.econ.day <= 3)) {
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
    for (const s of this.staff) {
      if (s.arrivalFx > 0) s.arrivalFx = Math.max(0, s.arrivalFx - dt);
      if (s.dismissFx > 0) s.dismissFx = Math.max(0, s.dismissFx - dt);
      if (s.bubble) { s.bubble.t -= dt; if (s.bubble.t <= 0) s.bubble = null; }
    }
    this.staff = this.staff.filter((s) => !s.dismissPending || s.dismissFx > 0);
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
    if (this.campaign.mode === 'tutorial' && this.econ.day <= 3) {
      const dayPlans = {
        1: [{ at: 5, want: 'meal', size: 1, scriptId: 'd1-meal-1' }, { at: 32, want: 'sleep', size: 1, scriptId: 'd1-lodging' }, { at: 62, want: 'meal', size: 2, scriptId: 'd1-taste' }, { at: 94, want: 'meal', size: 1, scriptId: 'd1-loss' }],
        2: [{ at: 8, want: 'meal', size: 2, scriptId: 'd2-eze-meal' }, { at: 42, want: 'meal', nextWant: 'sleep', size: 1, scriptId: 'd2-local-lodging' }, { at: 76, want: 'meal', size: 2, scriptId: 'd2-local-meal' }],
        3: [{ at: 8, want: 'meal', size: 1, scriptId: 'd3-wanderer' }, { at: 42, want: 'meal', size: 2, scriptId: 'd3-sect' }, { at: 76, want: 'meal', size: 1, scriptId: 'd3-eze' }],
      }[this.econ.day] || [];
      const wave = dayPlans[this.tutorialWaveIndex];
      const unfinishedTutorialWave = this.groups.some((group) => {
        if (!group.tutorialScriptId || group.state === 'leaving') return false;
        // A scripted lodging wave is complete once the guest has reached the
        // bed; it may remain overnight without blocking the next lesson.
        if (group.tutorialScriptId.includes('lodging') && group.want === 'sleep' && group.state === 'using') return false;
        return true;
      });
      const bedLossReady = wave?.scriptId !== 'd1-loss' || (this.campaign.tutorialFlags?.bedLessonStarted && !this.campaign.tutorialFlags?.d1LossSpawned && this.dayT >= (this.campaign.tutorialFlags.bedStartT || this.dayT) + 1);
      const waveTimeReady = wave?.scriptId === 'd1-loss' ? bedLossReady : this.dayT >= wave?.at;
      if (wave && !unfinishedTutorialWave && this.groups.length < 8 && waveTimeReady) {
        this.spawnGroup(wave.want, wave.size, wave);
        if (wave.scriptId === 'd1-loss') this.campaign.tutorialFlags.d1LossSpawned = true;
        this.tutorialWaveIndex++;
      }
      return;
    }
    const p = phaseOf(this.dayT);
    const base = p === '暖场' ? 22 : p === '上客' ? 13 : p === '低谷' ? 26 : p === '晚高峰' ? 9 : 999;
    const repBoost = 1 - Math.min(0.45, this.econ.rep / 2200);
    // 开局节奏：第一天客人稀疏，之后逐日放开（避免第一天就是中期强度）
    const ease = this.econ.day <= 1 ? 2.4 : this.econ.day === 2 ? 1.7 : this.econ.day === 3 ? 1.3 : 1;
    const guestCap = this.effectiveGuestCap();
    if (this.groups.length >= guestCap) return;
    if (this.arrivingGroupCount() >= ARRIVAL_WAVE_MAX) return;
    // 厨房积压时不再涌入新客（产能自适应：扩厨房/招厨师直接提高客流）
    const cooks = this.staff.filter((s) => s.job === 'cook' || s.job === 'bartender' || s.job === 'free').length;
    const backlog = this.orders.filter((o) => o.stage === 'queued' || o.stage === 'prep' || o.stage === 'cook').length;
    if (backlog > 2 + cooks * 2) return;
    if (this.seatsFree() < 1 && this.freeFacilities() < 1 && this.arrivingGroupCount() >= 1) return;
    this.spawnAcc = (this.spawnAcc || 0) + dt;
    const interval = base * repBoost * ease * (0.8 + this.rng.next() * 0.5);
    if (this.spawnAcc < interval) return;
    this.spawnAcc = 0;
    this.spawnGroup();
  }
          spawnAcc = 0;

  spawnGroup(tutorialWant = '', tutorialSize = 0, tutorialScript = null)       {
    const wants = this.availableWants();
    const isTutorialWave = this.campaign.mode === 'tutorial' && !!tutorialWant;
    // 教学剧本的目标消费不受当前技能/设施菜单降级影响；厨房尚未熟练时
    // 也必须生成 meal，让教学真正走到“点餐→出餐”而不是静默少一批客。
    if (!wants.length && !isTutorialWave) return;
    const activeRegulars = new Set(this.groups.map((group) => group.regularId).filter(Boolean));
    const returningPool = this.regulars.filter((profile) => !activeRegulars.has(profile.id) && profile.lastVisitDay < this.econ.day);
    const returning = returningPool.length && this.rng.chance(Math.min(.55, .22 + returningPool.length * .025))
      ? returningPool[this.rng.int(returningPool.length)] : null;
    const availableWorlds = this.unlockedWorlds();
    const forecast = new Set(this.econ.worldForecast || []);
    let origin;
    if (returning?.originWorldId) origin = this.worldById(returning.originWorldId);
    else {
      // 新档日常客源固定来自当前驻留世界；legacy 旧档保留旧的多世界
      // 客流算法，保证旧存档的经营生态不被迁移悄悄改写。
      const host = this.currentWorld();
      if (this.campaign.mode === 'tutorial') origin = host;
      else {
        const others = availableWorlds.filter((world) => world.id !== host.id);
        const roll = this.rng.next();
        if (roll < .6 || !others.length) origin = host;
        else if (roll < .9) origin = weightedPick(this.rng, others, (world) => forecast.has(world.id) ? 1.85 : 1);
        else {
          const tide = others.filter((world) => forecast.has(world.id));
          origin = weightedPick(this.rng, tide.length ? tide : others, () => 1) || host;
        }
      }
    }
    const crossWorld = !returning && this.stars() >= 5 && availableWorlds.length > 1 && this.rng.chance(.24);
    let secondary = crossWorld ? weightedPick(this.rng, availableWorlds.filter((world) => world.id !== origin.id), (world) => forecast.has(world.id) ? 1.5 : 1) : null;
    const want = isTutorialWave && tutorialWant ? (GUEST_WANTS.find((item) => item.id === tutorialWant) || wants[0])
      : returning?.want && wants.some((item) => item.id === returning.want) && this.rng.chance(.7)
      ? wants.find((item) => item.id === returning.want)
      : weightedPick(this.rng, wants, (item) => {
        const first = worldWantWeight(origin, item.id, this.econ.day, this.econ.seed);
        const second = secondary ? worldWantWeight(secondary, item.id, this.econ.day, this.econ.seed) : first;
        return item.weight * ((first + second) / 2);
      });
    const e = this.tavern.entrance();
    const sizeCap = this.econ.day <= 1 ? 2 : this.econ.day <= 3 ? 3 : 4;
    const groupPattern = weightedPick(this.rng, origin.travel.groupPatterns, (pattern) => pattern.weight);
    let size = tutorialSize ? tutorialSize : Math.min(sizeCap, groupPattern.min + this.rng.int(groupPattern.max - groupPattern.min + 1));
    if (want.facility) {                       // 设施容量决定这组最多几个人
      const caps = this.facilitiesOf(want).map((f) => this.facilityCap(f));
      const maxCap = caps.length ? Math.max(...caps) : 1;
      size = Math.min(size, maxCap);
      if (secondary && maxCap < 2) secondary = null;
    }
    if (secondary) size = Math.max(2, size);
    // 教学剧本的同行人数是固定事实；即使当前布局容量不足，也要让玩家
    // 看到并学习这批完整客群，服务阶段会按真实座位等待。
    if (this.campaign.mode === 'tutorial' && tutorialScript?.size) size = tutorialScript.size;
    const gid = this.id();
    const members          = [];
    for (let i = 0; i < size; i++) {
      const memberWorld = secondary && i % 2 ? secondary : origin;
      if (i === 0 && returning) {
        members.push({
          id: this.id(), app: returning.app, name: returning.name, race: returning.race, regularId: returning.id,
          originWorldId: origin.id, homeRegion: returning.homeRegion, travelOccupation: returning.travelOccupation, travelPurpose: returning.travelPurpose, age: returning.age, socialRegister: returning.socialRegister,
          culturalStratum: returning.culturalStratum, culturalIdentity: returning.culturalIdentity, selfReference: returning.selfReference,
          isNotable: returning.isNotable, notableRole: returning.notableRole,
          groupId: gid, x: e.x - .2, y: e.y, dir: 0, pose: 'idle', animT: this.rng.next() * 2,
          path: [], seatId: 0, mood: 1, aff: returning.aff || 0, aiChatLog: [...(returning.aiChatLog || [])],
          relationshipSummary: returning.relationshipSummary || '', background: returning.background || null,
        });
        continue;
      }
      const race = pickWorldRace(this.rng, memberWorld);
      const identity = travelIdentity(memberWorld, `${this.econ.seed}:${this.econ.day}:${gid}:${i}`);
      const theme = memberWorld.visuals.appearanceThemes[this.rng.int(memberWorld.visuals.appearanceThemes.length)];
      const sex = this.rng.chance(0.5) ? '女' : '男';
      members.push({
        id: this.id(), app: randomAppearance(this.rng, race, false, theme),
        name: makeName(this.rng, memberWorld, { sex, raceId: race }), race: RACE_NAMES[race],
        originWorldId: memberWorld.id, ...identity,
        groupId: gid, x: e.x + (i % 2) * 0.4 - 0.2, y: e.y + 0.2 * i, dir: 0, pose: 'idle', animT: this.rng.next() * 2,
        path: [], seatId: 0, mood: 1, aff: 0, aiChatLog: [],
      });
    }
    const visitorPool = !isTutorialWave && !returning && origin.id === this.econ.currentWorldId
      ? (origin.notableCharacters || []).filter((character) => character.visitor && !(this.econ.notableVisits || {})[`${origin.id}:${character.name}`]) : [];
    if (visitorPool.length && this.rng.chance(.08)) {
      const visitor = visitorPool[this.rng.int(visitorPool.length)]; const lead = members[0];
      lead.name = visitor.name; lead.travelOccupation = '世界标志人物'; lead.travelPurpose = visitor.detail;
      if (Number.isInteger(Number(visitor.raceId)) && Number(visitor.raceId) >= 0 && Number(visitor.raceId) < RACE_NAMES.length) {
        const visitorRace = Number(visitor.raceId);
        const visitorTheme = origin.visuals.appearanceThemes[this.rng.int(origin.visuals.appearanceThemes.length)];
        lead.race = RACE_NAMES[visitorRace]; lead.app = randomAppearance(this.rng, visitorRace, false, visitorTheme);
      }
      lead.isNotable = true; lead.notableRole = visitor.name; lead.culturalStratum = '世界标志人物'; lead.socialRegister = socialRegisterForGuest(lead);
      lead.background = { role: visitor.canonical ? `${origin.source?.workName || origin.name}的著名原作角色` : `${origin.name}的标志人物`, background: visitor.detail, aspiration: '亲自观察多元旅店如何接待自己的世界。', quirk: '言谈中会自然提及故乡的局势。' };
      this.econ.notableVisits ||= {}; this.econ.notableVisits[`${origin.id}:${visitor.name}`] = this.econ.day;
      this.toast(`✦ 稀有访客抵达：${origin.name}的${visitor.name}`);
    }
    const pool = want.facility ? this.allDishes() : (this.makeableDishes(want.drink).length ? this.makeableDishes(want.drink) : (isTutorialWave ? this.allDishes().filter((dish) => dish.drink === !!want.drink) : []));
    if (!pool.length) return;
    const taste = returning?.taste?.length ? [...returning.taste] : [pool[this.rng.int(pool.length)].id, pool[this.rng.int(pool.length)].id];
    const preferredFlavors = [...new Set([...(origin.hospitality.flavorLikes || []), ...(secondary?.hospitality.flavorLikes || [])])];
    const f1 = returning?.flavors?.[0] || (this.rng.chance(.75) ? preferredFlavors[this.rng.int(preferredFlavors.length)] : FLAVORS[this.rng.int(FLAVORS.length)].id);
    const rememberedF2 = returning?.flavors?.[1];
    const alternatives = FLAVORS.map((item) => item.id).filter((id) => id !== f1);
    const f2 = rememberedF2 && rememberedF2 !== f1 ? rememberedF2 : alternatives[this.rng.int(alternatives.length)] || f1;
    const hostEnvironment = this.currentWorld().environmentRule?.effects || {};
    const hostDailyRule = this.currentWorldRule()?.effects || {};
    const hostFestival = this.currentWorldFestival()?.effects || {};
    const hostFactor = (key) => clamp(Number(hostEnvironment[key]) || 1, .85, 1.2) * clamp(Number(hostDailyRule[key]) || 1, .85, 1.2) * clamp(Number(hostFestival[key]) || 1, .85, 1.2);
    const mods = this.difficultyMods();
    const stayDays = Number(this.econ.worldStayState?.worldId === this.econ.currentWorldId ? this.econ.worldStayState.days : 1);
    const localPatience = origin.id === this.econ.currentWorldId ? ([1, 1, 1, .85, .70, .55, .40][Math.min(7, Math.max(1, stayDays)) - 1] || .40) : 1;
    const g        = {
      id: gid, members, size, tableId: 0, state: 'wait', want: want.id, greeted: false, seatCd: 0, facId: 0, useT: 0, facT: 0,
      originWorldId: origin.id, worldIds: secondary ? [origin.id, secondary.id] : [origin.id], crossWorld: !!secondary,
      homeRegion: members[0].homeRegion, travelOccupation: members[0].travelOccupation, travelPurpose: members[0].travelPurpose,
      culturalStratum: members[0].culturalStratum, culturalIdentity: members[0].culturalIdentity,
      maxPatience: Math.round(this.rng.range(78, 135) * worldModifier(origin, 'patience') * hostFactor('patience') * mods.wait * localPatience), patience: 0,
      budget: Math.round(this.rng.range(30, 120) * worldModifier(origin, 'budget') * hostFactor('budget')),
      hygieneSens: this.rng.range(0.4, 1.5) * worldModifier(origin, 'hygiene') * hostFactor('hygiene') * mods.demand, taste, flavors: [f1, f2], orderId: 0,
      enterT: this.dayT, orderedT: 0, servedT: 0, eatT: 0, leaveReason: '',
      praised: 0, mocked: 0, intCd: 0, regularId: returning?.id || null,
    };
    if (tutorialScript?.nextWant) g.nextWant = tutorialScript.nextWant;
    if (tutorialScript?.scriptId) g.tutorialScriptId = tutorialScript.scriptId;
    if (this.campaign.mode === 'tutorial' && tutorialWant) {
      // 教学波次是可复现的剧本：身份、职业、预算、口味和耐心都不再
      // 受随机池影响，玩家每次重开都能学习同一条完整工作链。
      const tutorialProfiles = {
        1: ['旅店访客', '旅人', '散客', '耐心的客人'],
        2: ['艾泽冒险者', '艾泽冒险者', '当地住客'],
        3: ['散修', '同门', '艾泽异界客'],
      };
      const roles = tutorialProfiles[this.econ.day] || [];
      members.forEach((member, index) => {
        // visitorPool 的 notable 替换发生在上方；教学客的叙事字段也必须
        // 完全确定，避免不同 seed 意外混入标志人物背景或关系记录。
        member.isNotable = false; member.notableRole = ''; member.background = null;
        member.regularId = null; member.relationshipSummary = ''; member.aiChatLog = [];
        member.travelOccupation = roles[Math.min(index, roles.length - 1)] || '教学客人';
        member.culturalIdentity = `教学身份-${this.econ.day}-${this.tutorialWaveIndex}`;
        member.homeRegion = this.econ.day === 3 ? '玄黄界' : this.currentWorld().name;
        member.sex = index % 2 ? '女' : '男';
        member.age = 24 + index * 3;
        member.race = '人类';
        member.travelPurpose = tutorialScript?.scriptId?.includes('lodging') ? '寻找一处可靠住处' : '体验多元旅店的第一顿饭';
        member.socialRegister = '礼貌而直接';
        member.culturalStratum = tutorialScript?.scriptId?.includes('eze') ? '艾泽冒险者' : '当地普通居民';
        member.selfReference = '我';
      });
      if (tutorialScript?.scriptId === 'd2-local-lodging' || tutorialScript?.scriptId === 'd2-local-meal') {
        members.forEach((member) => { member.travelOccupation = '当地住客'; member.culturalIdentity = '当地居民'; });
        g.travelOccupation = '当地住客'; g.culturalIdentity = '当地居民';
      }
      if (this.econ.day === 2 && tutorialScript?.scriptId === 'd2-eze-meal') {
        const eze = this.worldById('hearth_coast');
        members.forEach((member) => { member.originWorldId = eze.id; member.homeRegion = eze.name; member.travelOccupation = '艾泽冒险者'; });
        g.originWorldId = eze.id; g.worldIds = [eze.id]; g.homeRegion = eze.name; g.travelOccupation = '艾泽冒险者';
      }
      if (this.econ.day === 3 && tutorialScript?.scriptId === 'd3-sect') {
        members.forEach((member) => { member.travelOccupation = '同门'; member.culturalIdentity = '教学身份-3-2'; });
        g.travelOccupation = '同门'; g.culturalIdentity = '教学身份-3-2';
      }
      // 第三天第三批是明确的艾泽异界客，不走普通当前世界随机客源。
      if (this.econ.day === 3 && this.tutorialWaveIndex >= 2 && members[0]) {
        const foreign = this.worldById('hearth_coast');
        members[0].originWorldId = foreign.id;
        members[0].homeRegion = foreign.name;
        members[0].travelOccupation = '艾泽异界客';
        g.originWorldId = foreign.id;
        g.worldIds = [foreign.id];
        g.homeRegion = foreign.name;
        g.travelOccupation = '艾泽异界客';
      }
      g.budget = tutorialScript?.scriptId === 'd1-loss' ? 24 : tutorialScript?.scriptId === 'd2-eze-meal' ? 120 : this.econ.day === 1 ? 72 : this.econ.day === 2 ? 96 : 110;
      g.maxPatience = this.econ.day === 1 && this.tutorialWaveIndex >= 3 ? 6 : tutorialScript?.scriptId === 'd2-local-lodging' ? 88 : 90;
      g.patience = g.maxPatience;
      const fixedTaste = pool.slice(0, 2).map((dish) => dish.id);
      if (fixedTaste.length) g.taste = [fixedTaste[0], fixedTaste[1] || fixedTaste[0]];
      g.flavors = this.econ.day === 1 ? ['sweet', 'savory'] : this.econ.day === 2 ? ['spicy', 'fresh'] : ['fresh', 'savory'];
      g.hygieneSens = 0.8;
      g.travelPurpose = tutorialScript?.scriptId?.includes('lodging') ? '寻找一处可靠住处' : '体验多元旅店的第一顿饭';
      g.culturalStratum = tutorialScript?.scriptId?.includes('eze') ? '艾泽冒险者' : '当地普通居民';
      g.socialRegister = '礼貌而直接';
    }
    if (this.campaign.mode === 'tutorial' && this.econ.day === 1 && tutorialScript?.scriptId === 'd1-taste') {
      g.tutorialTasteChallenge = true;
      this.toast('口味挑战：这桌客人的偏好已经写在订单上，试着做出更合口味的菜吧');
    }
    if (this.campaign.mode === 'tutorial' && this.econ.day === 1 && this.tutorialWaveIndex >= 3) {
      g.tutorialForcedLoss = true; g.maxPatience = 6; g.patience = 6;
      this.toast('意外客人到了：先照顾自己，客人的耐心也有尽头');
    }
    if (returning) {
      returning.visits = Math.max(1, returning.visits || 1) + 1;
      returning.lastVisitDay = this.econ.day;
      g.budget = Math.round(g.budget * (returning.aff >= 60 ? 1.6 : returning.aff >= 30 ? 1.3 : 1.1));
      this.toast(`常客 ${returning.name} 第 ${returning.visits} 次来到旅店`);
    }
    g.patience = g.maxPatience;
    this.groups.push(g);
    this.invalidateTasks('group-arrival');
    this.guests.push(...members);
    for (const id of g.worldIds) this.discoverWorld(id, 'arrival');
    if (this.dayReport) {
      for (const member of members) {
        const id = member.originWorldId; const world = this.worldById(id);
        const row = this.dayReport.worldGuests[id] || { name: world.name, arrivals: 0, served: 0, lost: 0, revenue: 0, scoreTotal: 0, scoreSamples: 0, complaints: {} };
        row.arrivals++; this.dayReport.worldGuests[id] = row;
      }
    }
    this.fx.push({ x: e.x, y: e.y, t: 0.6, kind: 'portal' });
    this.sounds.push('chime');
    const arrival = members[0].travelOccupation === '世界标志人物' ? `稀有访客 ${members[0].name} 来自${origin.name}` : secondary
      ? `跨界使团抵达：${origin.name} × ${secondary.name}`
      : `来自${origin.name}的${g.travelOccupation}旅行团抵达`;
    members[0].bubble = { text: this.worldDialogueLine(members[0], 'arrival', origin.id), t: 6.5, tone: 'neutral' };
    this.toast(arrival);
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
    const chefSkill = this.skillOf(chef, input.drink ? 'mix' : 'cook');
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
      this.invalidateTasks('facility-prepare');
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
    this.invalidateTasks('facility-escort');
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
    this.invalidateTasks('facility-using');
    g.useT = t ? t[f.quality - 1] : 22;
    g.facilityService = { ...(g.facilityService || {}), attended: true, attendant: staff?.name || '' };
    g.facilityAttendantSkill = staff ? this.skillOf(staff, this.facilitySkill(g.want)) : 0;
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
    this.invalidateTasks('want-advanced');
    return true;
  }

  /** 需求分派入口：设施型去设施，餐饮型去座位；住店客可能先去娱乐区续一摊 */
  tryPlace(g       )          {
    if (g.want === 'sleep' && !g.detourDone) {
      g.detourDone = true;
      // 主要待客房，但店里有酒吧/温泉/台球室时，过半概率先去消费一发
      if (!(this.campaign.mode === 'tutorial' && this.econ.day <= 3 && g.tutorialScriptId)) if (this.rng.chance(0.55)) {
        const opts = GUEST_WANTS.filter((w) => w.id !== 'sleep' && this.wantOk(w));
        if (opts.length) {
          const pick = opts[this.rng.int(opts.length)];
          g.nextWant = 'sleep';
          g.want = pick.id;
          this.toast(`住店客决定先去${pick.name}再回房`);
        }
      }
    }
    const placed = wantById(g.want).facility ? this.tryUseFacility(g) : this.trySelfSeat(g);
    this.invalidateTasks('seating');
    return placed;
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
    // 四日教学只在 Day1 第三批两人餐饮客上演固定口味挑战；
    // 常规客人挑战不能污染首批餐饮或住宿教学节奏。
    if (this.campaign.mode === 'tutorial' && this.econ.day <= 3) return;
    g.challengeRolled = true;
    const def = FACILITY_CHALLENGES[g.want];
    if (!def || !this.rng.chance(.2)) return;
    const guest = g.members[0];
    const challenge = { id: this.id(), groupId: g.id, guestId: guest.id, ...def, difficulty: Math.round(def.difficulty * this.difficultyMods().demand), state: 'open', age: 0 };
    this.facilityChallenges.push(challenge);
    if (this.dayReport) this.dayReport.facilityChallenges.started++;
    guest.bubble = { text: def.bubble, t: 12 };
    this.toast(`⚠ ${guest.name}：${def.bubble}`);
    this.sounds.push('alert');
  }

  challengeTraitBonus(staff, skill) {
    if (!staff) return 0;
    let bonus = 0;
    if (staff.traits.includes('clumsy')) bonus -= 6;
    if (staff.traits.includes('careful') && ['clean', 'calm'].includes(skill)) bonus += 6;
    if (staff.traits.includes('sociable') && skill === 'serve') bonus += 6;
    if (staff.traits.includes('gourmet') && ['cook', 'mix'].includes(skill)) bonus += 6;
    if (staff.traits.includes('decisive') && ['carry', 'calm'].includes(skill)) bonus += 5;
    return bonus;
  }

  escalateFacilityChallenge(challenge) {
    if (!challenge || challenge.state !== 'open' || challenge.escalated) return false;
    const group = this.groups.find((item) => item.id === challenge.groupId);
    const guest = group?.members.find((item) => item.id === challenge.guestId) || group?.members[0];
    const primary = this.bestSkill(challenge.skill);
    const staff = this.staff.find((person) => person.id === primary.id) || this.staff[0];
    if (!group || !guest || !staff) { this.finishFacilityChallenge(challenge, null, false); return false; }
    const approaches = CHALLENGE_APPROACHES[group.want] || CHALLENGE_APPROACHES.meal;
    const card = {
      id: `guest_challenge_${challenge.id}`, title: `客人挑战：${challenge.label}`, challengeFallback: true,
      challengeId: challenge.id, actorId: staff.id, guestId: guest.id,
      text: `${guest.name}${challenge.bubble.replace(/[！？!?]+$/, '')}，抱怨店里就没有更好的处理了吗？店内${SKILL_LABEL[challenge.skill]}最精湛的${staff.name}刚才没能直接解决，决定尝试另一种办法回应挑战。`,
      choices: approaches.map((approach) => ({
        ...approach, actorId: staff.id, difficulty: clamp(challenge.difficulty + approach.delta, 30, 90),
        note: `${staff.name}使用${SKILL_LABEL[approach.skill]}尝试；性格也会影响掷骰修正。`,
      })),
    };
    challenge.escalated = true;
    challenge.actorId = staff.id;
    if (this.pendingEvent) this.challengeEventQueue.push(card); else this.pendingEvent = card;
    this.toast(`⚡ ${staff.name}的首次检定未通过，触发客人挑战事件`);
    this.sounds.push('alert');
    return true;
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
      if (g.state === 'eating' && g.tutorialTasteChallenge && !g.tutorialTasteConsumed) {
        g.tutorialTasteConsumed = true;
        const card = { id: `tutorial-taste-${g.id}`, title: '固定教学：口味挑战', text: '这桌客人已经说出了自己的口味偏好。选择一道更合口味的菜，看看评价会怎样。', choices: [
          { label: '按偏好出菜', note: '认真记住客人的口味', skill: 'cook', difficulty: 35, ok: () => '客人满意地点头：这就是我想要的味道。', fail: () => '味道有些偏差，但客人愿意给你一次机会。' },
          { label: '按自己的招牌菜', note: '相信店里的招牌', skill: 'cook', difficulty: 65, ok: () => '招牌菜意外地赢得了掌声。', fail: () => '客人礼貌地放下了餐具。' },
        ], tutorialTaste: true, groupId: g.id };
        if (!this.pendingEvent) this.pendingEvent = card; else this.challengeEventQueue.push(card);
        this.campaign.tutorialFlags.tasteChallengePresented = true;
      }
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
        this.tryHoldLine(g);
        if (!g.worldWaitSpoken && g.patience < g.maxPatience * .55) {
          const guest = g.members[0];
          if (guest) { const text = this.worldDialogueLine(guest, 'wait', g.originWorldId); guest.bubble = { text, t: 6, tone: 'neutral' }; this.say(`${guest.name}：${text}`); }
          g.worldWaitSpoken = true;
        }
        if (g.patience <= 0) { this.leave(g, g.state === 'wait' ? '在前台等太久' : '等菜太久'); continue; }
      }
      if (g.state === 'wait') {
        this.tryHoldLine(g);
        // 客人不会再自行找桌；迎宾后仍无空位时，前台会创建新的引座任务。
        if (g.patience < g.maxPatience * 0.3) { this.leave(g, '等不到座位'); continue; }
      }
      if (g.state === 'seating') {
        const arrived = g.members.every((m) => m.path.length === 0);
        if (arrived) { g.state = 'seated'; for (const m of g.members) { const c = this.tavern.furnById(m.seatId); if (c) m.dir = c.dir; m.pose = 'idle'; } this.invalidateTasks('seated'); }
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
          if (SPECIAL_FACILITY_WANTS.has(g.want)) { g.state = 'facility_waiting_attend'; this.invalidateTasks('facility-waiting'); }
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
        if (g.eatT <= 0) { g.eatT = 0; g.state = 'checkout'; g.checkoutT = this.dayT; this.invalidateTasks('checkout'); }
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
      if (g.tutorialScriptId === 'd1-loss' && this.campaign?.mode === 'tutorial' && this.econ.day === 1) this.campaign.tutorialFlags.day1ForcedLossComplete = true;
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
    this.invalidateTasks('seating-start');
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
    this.invalidateTasks(reason ? 'guest-failed' : 'guest-leaving');
    this.releaseFacility(g);
    if (reason !== '') {
      this.econ.lost++;
      if (this.dayReport) this.dayReport.lostReasons[reason] = (this.dayReport.lostReasons[reason] || 0) + 1;
      this.scores.push(1.2);
      this.recordScoreParts({ wait: 1.2, service: 1.2 });
      this.toast(`一组客人离店：${reason}`);
      this.sounds.push('angry');
      const guest = g.members[0];
      if (guest) guest.bubble = { text: this.worldDialogueLine(guest, 'bad', g.originWorldId), t: 6, tone: 'bad' };
      if (this.dayReport) for (const member of g.members || []) {
        const id = member.originWorldId || g.originWorldId; const w = this.worldById(id);
        const row = this.dayReport.worldGuests[id] || { name: w.name, arrivals: 0, served: 0, lost: 0, revenue: 0, scoreTotal: 0, scoreSamples: 0, complaints: {} };
        row.lost++; row.complaints.wait = (row.complaints.wait || 0) + 1; this.dayReport.worldGuests[id] = row;
      }
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

  worldServiceMultipliers(g, room = null, dish = null) {
    const worlds = (g.worldIds || [g.originWorldId]).filter(Boolean).map((id) => this.worldById(id));
    const average = (fn) => worlds.reduce((sum, world) => sum + fn(world), 0) / Math.max(1, worlds.length);
    const flavorHit = dish ? average((world) => (dish.flavors || []).some((flavor) => world.hospitality.flavorLikes.includes(flavor)) ? 1.08 : .96) : 1;
    const styleId = room ? this.tavern.roomStyle(room) : '';
    const styleFit = room ? average((world) => world.hospitality.roomStyleLikes.includes(styleId) ? 1.08 : .98) : 1;
    const etiquette = average((world) => worldModifier(world, 'etiquette')) * clamp(Number(this.currentWorld().environmentRule?.effects?.etiquette) || Number(this.currentWorldRule()?.effects?.etiquette) || 1, .85, 1.2);
    return {
      quality: clamp(flavorHit, .8, 1.25),
      comfort: clamp(styleFit, .8, 1.25),
      service: clamp(g.greeted ? 1 + Math.max(0, etiquette - 1) * .22 : 1 - etiquette * .12, .8, 1.25),
    };
  }

  rememberGuests(g, score = 3) {
    for (const guest of g.members || []) {
      let profile = guest.regularId ? this.regulars.find((item) => item.id === guest.regularId) : null;
      const adjustedAff = clamp((guest.aff || 0) + (score >= 4 ? 3 : score < 2 ? -3 : 1), -100, 100);
      if (!profile && adjustedAff >= 5 && this.regulars.length < 60) {
        profile = {
          id: this.id(), name: guest.name, race: guest.race, app: guest.app, aff: adjustedAff,
          originWorldId: guest.originWorldId || g.originWorldId, homeRegion: guest.homeRegion || g.homeRegion,
          travelOccupation: guest.travelOccupation || g.travelOccupation, travelPurpose: guest.travelPurpose || g.travelPurpose, age: guest.age, socialRegister: socialRegisterForGuest(guest),
          culturalStratum: guest.culturalStratum || g.culturalStratum, culturalIdentity: guest.culturalIdentity || g.culturalIdentity, selfReference: guest.selfReference,
          isNotable: guest.isNotable, notableRole: guest.notableRole,
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
      if (profile.aff >= 20 && !profile.background) profile.background = `${profile.name}是来自${this.worldById(profile.originWorldId).name}${profile.homeRegion || ''}的${profile.travelOccupation || '旅人'}，因${profile.travelPurpose || '跨界旅行'}来到多元旅店。`;
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
      if (key === 'quiet' && !this.scoreParts.quiet) this.scoreParts.quiet = [];
      if (Number.isFinite(value) && this.scoreParts[key]) this.scoreParts[key].push(value);
    }
  }

  showGuestReview(g, score, parts, itemName = '') {
    const pools = GUEST_REVIEW_DIALOGUE[g.want] || GUEST_REVIEW_DIALOGUE.meal;
    const tier = guestReviewTier(score);
    const pool = pools[tier];
    const guest = g.members[this.rng.int(g.members.length)] || g.members[0];
    if (!guest || !pool?.length) return null;
    const item = itemName || wantById(g.want).name;
    const serviceText = pool[this.rng.int(pool.length)].replaceAll('{item}', item);
    const text = `${serviceText} ${this.worldDialogueLine(guest, tier, g.originWorldId)}`;
    guest.bubble = { text, t: 6.5, tone: tier };
    g.lastReview = { tier, score, text, speaker: guest.name, parts: { ...parts } };
    const label = tier === 'good' ? '好评' : tier === 'bad' ? '恶评' : '中评';
    this.say(`${guest.name}（${label} ${score.toFixed(1)}★）：${text}`);
    return g.lastReview;
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
    const servedMembers = (g.members || []).filter((member) => member.servedDay !== this.econ.day);
    for (const member of servedMembers) member.servedDay = this.econ.day;
    this.econ.served += servedMembers.length;
    this.recordDaySale('dishSales', dish.id, dish.name, g.size, revenue);
    const beforeMastery = this.dishMastery(dish.id).level;
    this.econ.dishMastery[dish.id] = (this.econ.dishMastery[dish.id] || 0) + g.size;
    const afterMastery = this.dishMastery(dish.id).level;
    if (afterMastery > beforeMastery) this.toast(`★ 招牌菜成长：《${dish.name}》升至 ${afterMastery} 级，售价与风味提升`);
    // 评价 6 项
    const waitPen = clamp(3 + (g.patience / g.maxPatience) * 2.4, 1, 5);
    const worldFit = this.worldServiceMultipliers(g, room, dish);
    const taste = clamp((order ? order.quality : 2) * (this.guestLikes(g, dish) ? 1.15 : 1) * (this.econ.markup > 2 ? 0.8 : 1) * worldFit.quality, 1, 5);    const serveScore = clamp((2 + this.bestSkill('serve').value / 30 + (g.greeted ? 0.5 : 0)
      + (this.staff.some((x) => x.traits.includes('sociable')) ? 0.3 : 0)
      + Math.min(1, g.praised * 0.5) - Math.min(1.5, g.mocked * 0.75)) * worldFit.service, 1, 5);
    const hygiene = clamp(((room ? room.clean : 60) / 20) * (2 - g.hygieneSens * 0.5), 1, 5);
    const roomCharm = room ? this.charmIn(room.id) : 0;
    const quiet = room?.kind === 'guestroom' ? roomQuietness(this.tavern, room) / 100 : 0;
    const comfort = clamp((1.6 + (table ? table.quality : 1) * 0.8 + (room ? room.quality * 0.4 : 0) + roomCharm + quiet * 0.8 + (room?.kind === 'parlor' ? .45 : 0)) * worldFit.comfort, 1, 5);
    const spectacle = clamp(1.8 + this.tavern.rooms.length * 0.25 + this.tavern.furns.length * 0.03 + this.charmTotal() * 0.18 + (room?.kind === 'parlor' ? .35 : 0), 1, 5);
    const score = (taste * 1.25 + waitPen * 1.15 + serveScore + hygiene * 1.1 + comfort * 0.85 + spectacle * 0.65) / 6.0;
    this.scores.push(score);
    this.recordScoreParts({ quality: taste, wait: waitPen, service: serveScore, hygiene, comfort, ...(room?.kind === 'guestroom' ? { quiet: quiet * 5 } : {}), spectacle });
    if (table) table.dirty = (table.dirty || 0) + g.size;
    if (room) room.clean = clamp(room.clean - g.size * 0.8, 0, 100);
    // 餐桌会留下脏盘；地面污渍按实际用餐人数低概率出现，不再每桌五成概率硬刷。
    if (this.rng.chance(dirtChanceForRoom(room, Math.min(0.32, g.size * 0.09)))) this.tavern.addDirt(Math.round(g.members[0].x), Math.round(g.members[0].y));
    this.fx.push({ x: table ? table.x : g.members[0].x, y: table ? table.y : g.members[0].y, t: 0.8, kind: score >= 3.6 ? 'happy' : 'sad' });
    if (score >= 3.6) this.sounds.push('happy');
    this.showGuestReview(g, score, { quality: taste, wait: waitPen, service: serveScore, hygiene, comfort, quiet: quiet * 5, spectacle }, dish.name);
    this.recordWorldOutcome(g, score, revenue, true, servedMembers);
    this.rememberGuests(g, score);
    if (this.advanceWant(g)) return;   // 住店客：吃完这摊去睡觉
    g.state = 'leaving';
    g.leaveT = 0;
    this.invalidateTasks('checkout-complete');
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
    const bedProfile = room?.kind === 'guestroom' ? guestroomBedProfile(this.tavern, room) : null;
    const bedMult = f ? (BED_PRICE_MULT[f.kind] || 1) : 1;
    const revenue = Math.round((w.price || 30) * bedMult * (bedProfile?.priceMultiplier || 1) * this.econ.markup * g.size * (1 + (q - 1) * 0.3));
    this.econ.coins += revenue;
    this.econ.revenue += revenue;
    const servedMembers = (g.members || []).filter((member) => member.servedDay !== this.econ.day);
    for (const member of servedMembers) member.servedDay = this.econ.day;
    this.econ.served += servedMembers.length;
    this.recordDaySale('facilitySales', g.want, w.name, g.size, revenue);
    if (this.dayReport && f) {
      const row = this.dayReport.facilityByFurn[f.id] || { count: 0, revenue: 0 };
      row.count += g.size; row.revenue += revenue;
      this.dayReport.facilityByFurn[f.id] = row;
    }
    const hygiene = clamp(((room ? room.clean : 60) / 20) * (2 - g.hygieneSens * 0.5), 1, 5);
    const charm = room ? this.charmIn(room.id) : 0;
    const worldFit = this.worldServiceMultipliers(g, room, null);
    const quiet = room?.kind === 'guestroom' ? roomQuietness(this.tavern, room) / 100 : 0;
    const comfort = clamp((1.7 + q * 0.75 + (room ? room.quality * 0.4 : 0) + charm + quiet * 0.8) * (bedProfile?.comfortMultiplier || 1) * worldFit.comfort, 1, 5);
    const facilityService = SPECIAL_FACILITY_WANTS.has(g.want);
    const serviceSkill = facilityService ? (g.facilityAttendantSkill || 0) : this.bestSkill('serve').value;
    const serveScore = clamp((2 + serviceSkill / 34 + (g.greeted ? 0.5 : 0)
      + Math.min(1, g.praised * 0.5) - Math.min(1.5, g.mocked * 0.75)) * worldFit.service, 1, 5);
    if (this.dayReport && f) {
      const row = this.dayReport.facilityByFurn[f.id];
      row.qualityTotal = (row.qualityTotal || 0) + serveScore * g.size;
      row.qualitySamples = (row.qualitySamples || 0) + g.size;
    }
    const spectacle = clamp(1.8 + this.tavern.rooms.length * 0.25 + this.charmTotal() * 0.2, 1, 5);
    const waitPen = clamp(3 + (g.patience / g.maxPatience) * 2.4, 1, 5);
    const score = (comfort * 1.5 + hygiene * 1.2 + waitPen + serveScore * 0.8 + spectacle * 0.5) / 5.0;
    this.scores.push(score);
    this.recordScoreParts({ quality: comfort, wait: waitPen, service: serveScore, hygiene, comfort, ...(room?.kind === 'guestroom' ? { quiet: quiet * 5, roomType: bedProfile?.type || '未配床' } : {}), spectacle });
    if (room?.kind === 'guestroom') room.guestroomProfile = bedProfile;
    if (f) {
      f.dirty = (f.dirty || 0) + 1;                 // 用完要整理，整理前不再接客
      if (facilityService) this.pendingFacilityReset.set(f.id, { wantId: g.want, groupId: g.id });
    }
    if (room) room.clean = clamp(room.clean - g.size * 0.7, 0, 100);
    this.invalidateTasks('facility-complete');
    const m0 = g.members[0];
    const dx = Math.round(m0.x), dy = Math.round(m0.y);
    // 设施本身仍需要整理，但地面污渍只按使用人数概率产生；低频客房不会凭空变脏。
    if (this.rng.chance(dirtChanceForRoom(room, Math.min(0.28, 0.05 + g.size * 0.06)))) {
      if (this.tavern.walkable(dx, dy)) this.tavern.addDirt(dx, dy);
      else if (room) { const t = this.tavern.freeTileIn(room, this.rng.int(70)); this.tavern.addDirt(t.x, t.y); }
    }
    this.fx.push({ x: m0.x, y: m0.y, t: 0.8, kind: score >= 3.6 ? 'happy' : 'sad' });
    if (score >= 3.6) this.sounds.push('happy');
    this.showGuestReview(g, score, { quality: comfort, wait: waitPen, service: serveScore, hygiene, comfort, quiet: quiet * 5, spectacle }, w.name);
    this.recordWorldOutcome(g, score, revenue, true, servedMembers);
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
    s.aff = clamp(s.aff + gain, 0, this.ownerAffCap(s));
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
    s.aff = clamp(s.aff + (kind === 'care' ? 2.4 : 1.6), 0, this.ownerAffCap(s));
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
    if (kind === 'journey') {
      const world = this.worldById(guest.originWorldId || g.originWorldId);
      const story = this.worldDialogueLine(guest, 'journey', g.originWorldId);
      line = `${guest.name}来自${world.name}的${guest.homeRegion || g.homeRegion}，是一名${guest.travelOccupation || g.travelOccupation}。${story} 此行是为了${guest.travelPurpose || g.travelPurpose}。`;
      this.discoverWorld(world.id, 'journey');
    }
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
    const roomBoost = this.tavern.roomAt(Math.round(a.x), Math.round(a.y))?.kind === 'corridor' ? 1.25 : 1;
    const v = Math.min(speed * carryMultiplier * roomBoost * dt, d);
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
    const height = Number(s?.app?.ht);
    let v = 2.5 + (Number.isFinite(height) ? height * 0.12 : 0);
    if (s.traits.includes('lazy')) v *= 0.88;
    if (s.needs.stamina < 30) v *= 0.75;
    return v;
  }

  actSpeed(s       , skill          )         {
    let m = (0.55 + this.skillOf(s, skill) / 130) * (1 + s.aff / 400);
    if ((s.boostT || 0) > 0) m *= 1.35;
    if (s.traits.includes('fast')) m *= 1.15;
    if (s.traits.includes('perfectionist')) m *= 0.88;
    if (skill === 'clean' && s.traits.includes('clean_freak')) m *= 1.25;
    if ((skill === 'clean' || skill === 'carry') && s.traits.includes('organized')) m *= 1.1;
    if ((s.prio || 0) >= 2 && s.traits.includes('competitive')) m *= 1.08;
    for (const row of normalizePerkList(s.perks)) {
      const add = perkDef(row.id)?.speeds?.[skill];
      if (add) m *= 1 + (add[row.level - 1] || 0);
    }
    if (s.needs.stamina < 25) m *= 0.8;
    return m;
  }

  tickStaff(dt        )       {
    this.stationOwner.clear();
    for (const worker of this.staff) for (const id of worker.task?.stationIds || []) if (!this.stationOwner.has(id)) this.stationOwner.set(id, worker.task.key);
    const staffOrder = this.staff.filter((s) => !s.dismissPending).sort((a, b) => (b.prio || 0) - (a.prio || 0) || a.id - b.id);
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
    this.taskPlanCooldown = Math.max(0, this.taskPlanCooldown - Math.max(0, dt));
    this.taskSafetyT += Math.max(0, dt);
    const hasAssignableStaff = staffOrder.some((s) => !s.task && s.needs.stamina >= 18 && !(this.manualOwner && s.isOwner));
    const shouldPlanTasks = hasAssignableStaff && this.taskPlanCooldown <= 0 && (this.taskDirty || this.taskSafetyT >= 0.5);
    let open = [];
    if (shouldPlanTasks) {
      const started = globalThis.performance?.now?.() ?? Date.now();
      const reasons = [...this.taskDirtyReasons];
      open = this.buildTasks(claimed);
      const elapsed = (globalThis.performance?.now?.() ?? Date.now()) - started;
      this.taskDirty = false; this.taskSafetyT = 0; this.taskDirtyReasons.clear();
      this.taskInstrumentation.rebuilds++;
      this.taskInstrumentation.rebuildMs += elapsed;
      this.taskInstrumentation.lastReason = reasons.join(',') || 'safety';
      for (const reason of reasons.length ? reasons : ['safety']) this.taskInstrumentation.reasons[reason] = (this.taskInstrumentation.reasons[reason] || 0) + 1;
      this.taskPlanCooldown = 0.02;
    }
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
      this.tickPerkRestores(s);
      // 疲惫员工先休息再抢下一项工作。前台任务近乎连续，若在 assign() 之后判断会永远轮不到休息。
      if (!s.task && s.needs.stamina < 28 && !open.length) {
        if (this.tryIronLegs(s)) { /* 铁脚：本该回房，改为当场回气 */ }
        else {
          s.path = [];                 // 取消回岗位的待命路径，立即改道去自己的休息室
          this.tryRest(s);
        }
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

  /** 玩家直控：逐轴推进，撞墙只挡住那一轴。dt<=0 只改姿态，绝不补步，避免暂停帧把人弹到另一侧。 */
  driveOwner(s, dt) {
    const v = this.manualVec;
    const len = Math.hypot(v.x, v.y);
    if (len < 0.08) {
      s.pose = 'idle'; return;
    }
    s.task = null; s.path = [];
    if (!(dt > 0) || !Number.isFinite(dt)) { s.pose = 'walk'; return; }
    const safeDt = Math.min(dt, 0.05);
    const R = 0.16;
    const step = this.staffSpeed(s) * 1.15 * Math.min(1, len) * safeDt;
    const hereX = Math.round(s.x), hereY = Math.round(s.y);
    if (!this.tavern.walkable(hereX, hereY, false)) {
      const out = this.nearestWalkableTile(hereX, hereY, v);
      if (out) {
        const ax = out.x - s.x, ay = out.y - s.y;
        const ad = Math.hypot(ax, ay) || 1;
        const slide = Math.min(Math.max(step, 0.04), ad);
        s.x += (ax / ad) * slide;
        s.y += (ay / ad) * slide;
      }
    }
    const snap = Math.min(step * 1.2, 0.08);
    if (Math.abs(v.x) > 0.08) {
      const cy = Math.round(s.y), d = cy - s.y;
      if (Math.abs(d) > 0.02) s.y += Math.sign(d) * Math.min(Math.abs(d), snap);
    }
    if (Math.abs(v.y) > 0.08) {
      const cx = Math.round(s.x), d = cx - s.x;
      if (Math.abs(d) > 0.02) s.x += Math.sign(d) * Math.min(Math.abs(d), snap);
    }
    const dx = (v.x / len) * step, dy = (v.y / len) * step;
    if (Math.abs(v.x) > 0.08 && this.tavern.bodyFree(s.x, s.y, s.x + dx, s.y, R, false)) s.x += dx;
    if (Math.abs(v.y) > 0.08 && this.tavern.bodyFree(s.x, s.y, s.x, s.y + dy, R, false)) s.y += dy;
    s.pose = 'walk';
    if (Math.abs(v.x) > Math.abs(v.y)) s.dir = v.x > 0 ? 3 : 1; else s.dir = v.y > 0 ? 0 : 2;
  }

  nearestWalkableTile(x, y, prefer = { x: 0, y: 0 }) {
    if (this.tavern.walkable(x, y)) return { x, y };
    const dirs = [
      [Math.sign(prefer.x) || 0, Math.sign(prefer.y) || 0],
      [0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1],
    ];
    const seen = new Set(['0,0']);
    for (const [dx, dy] of dirs) {
      const key = `${dx},${dy}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (this.tavern.walkable(x + dx, y + dy)) return { x: x + dx, y: y + dy };
    }
    const e = this.tavern.entrance();
    if (this.tavern.walkable(e.x, e.y + 1)) return { x: e.x, y: e.y + 1 };
    return this.tavern.walkable(e.x, e.y) ? e : null;
  }

  /** 该员工可以用的休息家具：自己卧室里的，或还空着的休息室里的（绝不进别人卧室） */
          restFurnsFor(s       )         {
    return this.tavern.furns.filter((f) => {
      if (f.kind !== 'bunk' && f.kind !== 'couch') return false;
      const r = this.tavern.roomOfFurn(f);
      return !!r && (r.kind === 'lounge' || (r.kind === 'playerroom' && s.isOwner)) && (!r.occupant || r.occupant === s.id);
    });
  }

  tryRest(s       , requestedBedId = null)       {
    if (s.path.length) return;
    const usable = this.restFurnsFor(s);
    const bunks = usable.filter((f) => f.kind === 'bunk');
    const spots = bunks.length ? bunks : usable;
    if (!spots.length) return;
    const c = requestedBedId ? spots.find((f) => f.id === requestedBedId) : spots[this.rng.int(spots.length)];
    if (!c) return;
    const onBunk = c.kind === 'bunk';
    const dur = onBunk ? (furnDef('bunk').time            )[c.quality - 1] : 14;
    const stand = this.tavern.standTileNear(this.tavern.useTiles(c));
    if (!stand) return;
    if (onBunk && this.campaign.mode === 'tutorial' && this.econ.day === 1 && s.isOwner) {
      this.campaign.tutorialFlags.bedLessonStarted = true;
      this.campaign.tutorialFlags.bedStartT = this.dayT;
    }
    s.task = {
      kind: 'rest', bedId: c.id, key: 'rest:' + s.id, label: onBunk ? '睡一觉' : '休息', i: 0,
      steps: [
        { tx: stand.x, ty: stand.y },
        {
          dur, label: onBunk ? '睡一觉' : '休息', skill: 'calm', done: () => {
            if (onBunk) {
              if (this.campaign.mode === 'tutorial' && this.econ.day === 1 && s.isOwner) {
                this.campaign.tutorialFlags.bedLessonStarted = true;
                this.campaign.tutorialFlags.bedStartT = this.dayT;
                this.campaign.tutorialFlags.bedLessonComplete = true;
              }
              s.needs.stamina = 100;
              s.needs.stress = clamp(s.needs.stress - 20, 0, 100);
            } else {
              s.needs.stamina = clamp(s.needs.stamina + 55, 0, 100);
              s.needs.stress = clamp(s.needs.stress - 25, 0, 100);
            }
            s.bubble = { text: onBunk ? 'Zzz……' : '呼——', t: 2 };
          },
        },
      ],
    };
  }

  bedFor(staffId) {
    const staff = this.staff.find((s) => s.id === staffId);
    if (!staff) return null;
    return this.restFurnsFor(staff).find((f) => {
      if (f.kind !== 'bunk') return false;
      const room = this.tavern.roomOfFurn(f);
      if (staff.isOwner && this.campaign.mode === 'legacy' && !this.tavern.rooms.some((row) => row.kind === 'playerroom')) return room?.kind === 'lounge';
      return room?.kind === (staff.isOwner ? 'playerroom' : 'lounge');
    }) || null;
  }

  requestBedRest(staffId, bedIdOrOptions = {}, maybeOptions = {}) {
    const options = typeof bedIdOrOptions === 'number' ? { ...maybeOptions, bedId: bedIdOrOptions } : bedIdOrOptions;
    const { night = false, bedId = null } = options;
    const staff = this.staff.find((s) => s.id === staffId);
    const bed = bedId ? this.restFurnsFor(staff).find((f) => f.id === bedId && f.kind === 'bunk') : this.bedFor(staffId);
    if (!staff || !bed || (night ? !this.nightState.active : !this.dayActive)) return { ok: false, reason: '床位当前不可用' };
    if (staff.task || staff.path?.length) return { ok: false, reason: '角色正在执行其他动作' };
    this.tryRest(staff, bed.id);
    return staff.task?.kind === 'rest' ? { ok: true, bedId: bed.id, duration: staff.task.steps?.[1]?.dur || 0 } : { ok: false, reason: '床边不可达' };
  }

  cancelRest(staffId, bedId = null) {
    const staff = this.staff.find((s) => s.id === staffId);
    if (!staff || staff.task?.kind !== 'rest' || (bedId && staff.task.bedId !== bedId)) return false;
    staff.task = null; staff.path = []; staff.actT = 0; staff.actTotal = 0; staff.pose = 'idle';
    return true;
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
    // 新档首日店主是唯一工作人员，不能被创建时的 greeter 岗位
    // 限制在前台；非直控营业时店主必须能够接手备餐、烹饪、上菜和清洁。
    // 直控模式仍由 manualOwner 路径完全接管，不会自动抢单。
    if (staff?.isOwner && !this.manualOwner) return 50;
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
      if (challenge.state !== 'open' || challenge.escalated) continue;
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
          const chance = clamp(Math.round(55 + (this.skillOf(staff, challenge.skill) - challenge.difficulty) * 1.15), 8, 96);
          if (this.rng.next() * 100 <= chance) this.finishFacilityChallenge(challenge, staff, true);
          else if (this.consumePerkCharge(staff, 'clutch')) {
            staff.bubble = { text: '还能救！', t: 2 };
            this.toast(`${staff.name}发动「绝处补救」`);
            this.finishFacilityChallenge(challenge, staff, true);
          }
          else this.escalateFacilityChallenge(challenge);
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
            this.invalidateTasks('order-created');
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
          { dur: 1.0, label: '取餐', skill: 'carry', done: () => { passF.plates = Math.max(0, (passF.plates || 0) - 1); o.servicePicked = true; this.invalidateTasks('service-pick'); } },
          { tx: p2.x, ty: p2.y },
          {
            dur: 1.0, label: '上菜', skill: 'serve', done: () => {
              o.stage = 'served'; this.invalidateTasks('order-served');
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
          { dur: 1.2, label: '收脏盘', skill: 'carry', done: () => { t.dirty = Math.max(0, (t.dirty || 0) - 2); this.invalidateTasks('dirty-cleared'); } },
          { tx: p2.x, ty: p2.y },
          {
            dur: st, label: '洗涤', skill: 'clean', done: () => {
              const room = this.tavern.roomOfFurn(sink);
              if (room) room.clean = clamp(room.clean + 3, 0, 100);
              this.invalidateTasks('clean-complete');
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
    if (!o.ingredientsConsumed) for (const k of ING_KEYS) {
      const need = dish.ing[k] || 0;
      if (need > 0 && this.econ.stock[k] < need) return null;
    }
    const steps         = [
      { tx: sShelf.x, ty: sShelf.y },
      {
        dur: 1.6, label: '取料', skill: 'carry', done: () => {
          if (!o.ingredientsConsumed) for (const k of ING_KEYS) {
            const need = dish.ing[k] || 0;
            if (need) {
              this.econ.stock[k] = Math.max(0, this.econ.stock[k] - need);
              if (this.dayReport) this.dayReport.stockUsed[k] = (this.dayReport.stockUsed[k] || 0) + need;
            }
          }
          o.ingredientsConsumed = true;
          o.stage = 'carry';
        },
      },
    ];
    if (prep && sPrep) {
      steps.push({ tx: sPrep.x, ty: sPrep.y });
          steps.push({ dur: (furnDef('prep').time            )[prep.quality - 1], label: '备餐', skill: 'cook', done: () => { o.stage = 'prep'; this.invalidateTasks('order-prep'); } });
    }
    const cookSkill           = dish.drink ? 'mix' : 'cook';
    steps.push({ tx: sStove.x, ty: sStove.y });
    steps.push({
      dur: (furnDef(dish.drink ? 'keg' : 'stove').time            )[stove.quality - 1] * (0.8 + dish.skill / 160) * (dish.fun && dish.fun.includes('huge') ? 1.3 : 1) * (dish.drink && stoveRoom.kind === 'bar' ? 0.8 : 1),
      label: dish.drink ? '调酒' : '烹饪', skill: cookSkill,
      done: (s       ) => {
        o.stage = 'cook'; this.invalidateTasks('order-cook');
        o.cookId = s.id;
        this.sounds.push('sizzle');
        // 出品质量 = 技能 + 设备品质 + 菜品难度惩罚
        const signature = this.consumePerkCharge(s, 'signature');
        const signatureBoost = signature ? [0.5, 0.8, 1.1][perkLevel(s, 'signature') - 1] || 0.5 : 0;
        if (signature) { s.bubble = { text: '会心！', t: 2 }; this.toast(`${s.name}发动「会心出品」`); }
        o.quality = clamp(0.9 + this.skillOf(s, cookSkill) / 26 + (stove.quality - 1) * 0.55 - dish.skill / 90
          + (s.traits.includes('perfectionist') ? 0.4 : 0) + (s.traits.includes('creative') ? 0.25 : 0) + signatureBoost, 1, 5) * dish.taste;
        // 整蛊料理：出品质量大幅随机，客人反应两极
        if (dish.fun && dish.fun.includes('prank')) o.quality = clamp(o.quality * this.rng.range(0.7, 1.35), 1, 5);
        if (dish.drink) {
          o.stage = 'ready'; o.passId = stove.id; this.invalidateTasks('order-ready');
          stove.plates = (stove.plates || 0) + 1;
          this.fx.push({ x: stove.x, y: stove.y, t: 0.5, kind: 'steam' });
        }
      },
    });
    if (!dish.drink) {
      steps.push({ tx: sPass.x, ty: sPass.y });
      steps.push({
        dur: 0.8, label: '出餐', skill: 'carry', done: () => {
          o.stage = 'ready'; o.passId = passF.id; this.invalidateTasks('order-ready');
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
    // 教学餐是固定剧本：即使店主厨艺只有 1，也提供一份基础菜让
    // 点单→烹饪→上菜→结账可以真实完成，而不是因菜单为空离场。
    if (!avail.length && this.campaign.mode === 'tutorial' && g.tutorialScriptId?.startsWith('d2-')) {
      avail = this.allDishes().filter((d) => d.drink === !!w.drink).slice(0, 1);
    }
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
      const skill = t.steps.reduce((a, st) => a + (st.skill ? this.skillOf(s, st.skill) : 0), 0) / Math.max(1, t.steps.filter((st) => st.skill).length);
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
    if (!step) { s.task = null; this.invalidateTasks('task-failed'); return; }
    if (step.tx !== undefined && step.ty !== undefined) {
      const p = this.tavern.path(Math.round(s.x), Math.round(s.y), step.tx, step.ty);
          if (!p) { s.task = null; this.invalidateTasks('path-failed'); s.bubble = { text: '过不去!', t: 2 }; return; }
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
    if (!step) { s.task = null; this.invalidateTasks('task-failed'); return; }
    if (step.tx !== undefined) {
      if (s.path.length === 0) {
        const dx = Math.abs(s.x - (step.tx          )), dy = Math.abs(s.y - (step.ty          ));
        if (dx + dy < 0.2) { t.i++; this.beginStep(s); } else {
          const p = this.tavern.path(Math.round(s.x), Math.round(s.y), step.tx          , step.ty          );
          if (!p) { s.task = null; this.invalidateTasks('path-failed'); s.bubble = { text: '无路可走', t: 2 }; return; }
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
      if (t.i >= t.steps.length) { this.recordDayWork(s, t); this.tryTidyAfter(s); s.task = null; s.carry = null; s.pose = 'idle'; s.note = ''; this.invalidateTasks('task-complete'); }
      else this.beginStep(s);
    }
  }

  gainExp(s       , k          , amount        )       {
    s.exp[k] += amount * (s.traits.includes('gourmet') && k === 'cook' ? 1.5 : 1) * (s.traits.includes('ambitious') ? 1.2 : 1);
    const need = 12 + s.skills[k] * 0.9;
    if (s.exp[k] >= need && s.skills[k] < SKILL_POINT_CAP) {
      s.exp[k] = 0;
      s.skills[k] = Math.min(SKILL_POINT_CAP, s.skills[k] + 1);
    }
  }

  trainingWorldFor(_staff, _skill) {
    // 进修发生在旅店当前驻留世界；开局 newEcon 已固定为艾泽普利斯（hearth_coast）。
    return this.currentWorld() || WORLD_PROFILES[0];
  }

  trainingGains(staff, priorities, budget) {
    const gains = {};
    let remaining = budget;
    const add = (key) => {
      const room = SKILL_POINT_CAP - staff.skills[key] - (gains[key] || 0);
      if (remaining > 0 && room > 0) { gains[key] = (gains[key] || 0) + 1; remaining--; }
    };
    for (const key of priorities) add(key);
    const fallback = [...SKILL_KEYS].sort((a, b) => staff.skills[a] - staff.skills[b] || a.localeCompare(b));
    while (remaining > 0) {
      const before = remaining;
      for (const key of fallback) add(key);
      if (before === remaining) break;
    }
    return gains;
  }

  trainingPlan(id, skill) {
    const staff = this.staff.find((person) => person.id === id);
    if (!staff || !SKILL_KEYS.includes(skill)) return null;
    const world = this.trainingWorldFor(staff, skill);
    const scene = TRAINING_WORLD_SCENES[world.id] || TRAINING_WORLD_SCENES.hearth_coast;
    const course = TRAINING_SKILL_SCENES[skill];
    const seed = stableHash(`${this.econ.seed}:${this.econ.day}:${staff.id}:${skill}:training`);
    const regionProfile = world.regions[seed % world.regions.length];
    const region = regionProfile?.name || String(regionProfile || world.name);
    const mentor = world.travel.occupations[(seed >>> 3) % world.travel.occupations.length];
    const traitNames = (staff.traits || []).map((id) => TRAITS.find((trait) => trait.id === id)?.name || id).slice(0, 2);
    const budget = Math.min(3, SKILL_KEYS.reduce((sum, key) => sum + Math.max(0, SKILL_POINT_CAP - staff.skills[key]), 0));
    const rawChoices = [
      { id: 'focus', label: course.focus, priorities: [skill, skill, skill], approach: `接受${mentor}的严格安排，把整段时间都投入${course.practice}` },
      { id: 'balanced', label: course.balanced, priorities: [skill, skill, course.a], approach: `先练核心课程，再把${SKILL_LABEL[course.a]}纳入同一套现场流程` },
      { id: 'transfer', label: course.transfer, priorities: [skill, course.b, course.b], approach: `从${SKILL_LABEL[course.b]}的角度重新理解${course.practice}` },
    ];
    const choices = rawChoices.map((choice) => {
      const gains = this.trainingGains(staff, choice.priorities, budget);
      const gainText = Object.entries(gains).map(([key, value]) => `${SKILL_LABEL[key]} +${value}`).join('、');
      return {
        ...choice, gains, total: Object.values(gains).reduce((sum, value) => sum + value, 0), gainText,
        resultText: `${staff.name}选择“${choice.label}”。在${world.name}，${scene.trial}的考验里，${choice.approach}。起初属于${traitNames.join('、') || '谨慎'}的个人习惯让节奏显得格外鲜明，最终也被调整成了适合旅店日常的做法。`,
        reflection: `这里的规矩和旅店完全不同，不过我已经知道该怎样把这些练习带回店里了。`,
      };
    });
    return {
      staffId: staff.id, skill, course: TRAINING_PROGRAMS[skill], cost: Math.round(90 + staff.skills[skill] * 2.2),
      world: { id: world.id, name: world.name, icon: world.icon, lore: world.identity.summary, etiquette: world.culture.etiquette },
      region, mentor, venue: scene.venue,
      intro: `${staff.name}在当前驻留的${world.name}，前往${region}的${scene.venue}参加“${TRAINING_PROGRAMS[skill]}”。${world.identity.summary}${scene.method}。当地尤其讲究：${world.culture.etiquette}`,
      characterNote: `${mentor}注意到${staff.name}具有${traitNames.join('、') || '独特'}的性格，因此给出了三条不同的练习路线。每条路线总成长均为 ${budget} 点。`,
      choices,
    };
  }

  trainStaff(id, skill, choiceId = 'focus') {
    const s = this.staff.find((person) => person.id === id);
    if (!s || this.dayActive || !SKILL_KEYS.includes(skill) || s.skills[skill] >= SKILL_POINT_CAP) return false;
    if (s.lastTrainingDay === this.econ.day) { this.toast(`${s.name}本次打烊期间已经外出进修过了`); return false; }
    const cost = Math.round(90 + s.skills[skill] * 2.2);
    if (this.econ.coins < cost) { this.toast(`进修需要 ${cost} 界币`); return false; }
    const plan = this.trainingPlan(id, skill);
    const choice = plan?.choices.find((item) => item.id === choiceId);
    if (!plan || !choice) return false;
    this.econ.coins -= cost;
    const before = { ...s.skills };
    for (const [key, value] of Object.entries(choice.gains)) s.skills[key] = Math.min(SKILL_POINT_CAP, s.skills[key] + value);
    s.trainingCount = (s.trainingCount || 0) + 1;
    s.lastTrainingDay = this.econ.day;
    s.needs.morale = clamp(s.needs.morale + 3, 0, 100);
    this.lastTrainingResult = { ...plan, choice, before, after: { ...s.skills }, staffName: s.name };
    this.toast(`${s.name}完成「${TRAINING_PROGRAMS[skill]}」：${choice.gainText}（-${cost}）`);
    return true;
  }

  buyStaffEquipment(id, equipmentId) {
    const s = this.staff.find((person) => person.id === id);
    const item = STAFF_EQUIPMENT.find((row) => row.id === equipmentId);
    if (!s || !item || this.dayActive || s.equipment?.includes(item.id)) return false;
    if (this.econ.coins < item.cost) { this.toast(`购买「${item.name}」需要 ${item.cost} 界币`); return false; }
    this.econ.coins -= item.cost;
    s.equipment = [...(s.equipment || []), item.id];
    this.toast(`${s.name}装备了「${item.name}」：${SKILL_LABEL[item.skill]} +${item.bonus}（突破加点上限）`);
    return true;
  }

  learnStaffPerk(id, perkId) {
    const s = this.staff.find((person) => person.id === id);
    const perk = perkDef(perkId);
    if (!s || !perk || this.dayActive) return false;
    const current = perkLevel(s, perkId);
    if (current >= PERK_MAX_LEVEL) { this.toast(`「${perk.name}」已经升到最高 ${PERK_MAX_LEVEL} 级`); return false; }
    const next = current + 1;
    const related = relatedPerkSkill(s, perk);
    const need = perkNeedAt(perk, next);
    if (related < need) { this.toast(`${current ? '升级' : '学习'}「${perk.name}」需要相关能力 ${need}`); return false; }
    const cost = perkCostAt(perk, next);
    if (this.econ.coins < cost) { this.toast(`${current ? '升级' : '学习'}「${perk.name}」需要 ${cost} 界币`); return false; }
    this.econ.coins -= cost;
    const rows = normalizePerkList(s.perks).filter((row) => row.id !== perk.id);
    rows.push({ id: perk.id, level: next });
    s.perks = rows;
    this.toast(`${s.name}${current ? '将' : '学会了'}技能「${perk.name}」${current ? `升到 ${next} 级` : ''}：${perkNoteAt(perk, next)}`);
    return true;
  }

  tickPerkRestores(s) {
    if (!s?.needs) return;
    for (const row of normalizePerkList(s.perks)) {
      const perk = perkDef(row.id);
      const spec = perk?.restore;
      if (!spec || this.perkChargesLeft(s, row.id) <= 0) continue;
      const value = Number(s.needs[spec.need]);
      const should = Number.isFinite(spec.below) ? value <= spec.below : value >= spec.above;
      if (!should) continue;
      if (!this.consumePerkCharge(s, row.id)) continue;
      const next = spec.to[row.level - 1] ?? spec.to[0];
      s.needs[spec.need] = next;
      s.bubble = { text: perk.name, t: 2 };
      this.toast(`${s.name}发动「${perk.name}」`);
    }
  }

  tryIronLegs(s) {
    if (!this.consumePerkCharge(s, 'iron_legs')) return false;
    const lv = perkLevel(s, 'iron_legs');
    s.needs.stamina = 40 + lv * 10;
    s.path = [];
    s.bubble = { text: '还能撑', t: 2 };
    this.toast(`${s.name}发动「铁脚」`);
    return true;
  }

  tryTidyAfter(s) {
    if (!this.dayActive || !this.consumePerkCharge(s, 'tidy_after')) return false;
    const dirt = (this.tavern.dirt || []).find((spot) => Math.abs(spot.x - Math.round(s.x)) + Math.abs(spot.y - Math.round(s.y)) <= 2);
    if (!dirt) {
      s.perkCharges.tidy_after = (s.perkCharges.tidy_after || 0) + 1;
      return false;
    }
    this.tavern.dirt = this.tavern.dirt.filter((spot) => spot !== dirt);
    s.bubble = { text: '顺手清一下', t: 1.6 };
    return true;
  }

  tryHoldLine(group) {
    if (!group || group.state !== 'wait' || group.patience > group.maxPatience * 0.25) return false;
    const helper = [...this.staff]
      .filter((person) => this.perkChargesLeft(person, 'hold_line') > 0)
      .sort((a, b) => this.skillOf(b, 'serve') - this.skillOf(a, 'serve'))[0];
    if (!helper || !this.consumePerkCharge(helper, 'hold_line')) return false;
    const restore = [20, 30, 40][perkLevel(helper, 'hold_line') - 1] || 20;
    group.patience = Math.min(group.maxPatience, group.patience + restore);
    helper.bubble = { text: '先稳住！', t: 2 };
    this.toast(`${helper.name}发动「压住场面」`);
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
    // 先按真实活动量选出房间，再应用该房间的污渍系数。这样走廊不会
    // 先按普通房概率抽中、再在落点阶段才“补救”概率，保证生产路径
    // 与房间类型绑定（走廊 25%，普通房 100%）。
    if (active.length) {
      let roll = this.rng.next() * traffic;
      let selected = active[active.length - 1];
      for (const row of active) { roll -= row.amount; if (roll <= 0) { selected = row; break; } }
      const chance = dirtChanceForRoom(selected.room, dt * traffic * 0.0018);
      if (this.rng.chance(chance)) {
        const t = this.tavern.freeTileIn(selected.room, this.rng.int(60));
        this.tavern.addDirt(t.x, t.y);
      }
    }
    for (const r of this.tavern.rooms) {
      const dirtHere = this.tavern.dirt.filter((d) => d.x >= r.x && d.x < r.x + r.w && d.y >= r.y && d.y < r.y + r.h).length;
      r.clean = clamp(r.clean - dirtHere * 0.06 * dt, 0, 100);
    }
  }

  // ---------- 事件 ----------
  bestSkill(k          )                                  {
    let best = { id: 0, name: '无人', value: 0 };
    for (const s of this.staff) {
      const value = this.skillOf(s, k);
      if (value > best.value) best = { id: s.id, name: s.name, value };
    }
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
    const host = this.currentWorld();
    return {
      day: this.econ.day, timeRemainingSeconds: Math.max(0, Math.round(DAY_LEN - this.dayT)),
      world: { currentHost: host.name, genre: host.genre, summary: host.identity.summary, environmentRule: host.environmentRule, todayRule: this.currentWorldRule(), festival: this.currentWorldFestival(), conflicts: host.conflicts, storyHooks: host.storyHooks },
      tavern: { stars: this.stars(), coins: Math.round(this.econ.coins), reputation: Math.round(this.econ.rep), rooms: this.tavern.rooms.map((room) => ROOM_LABEL[room.kind] || room.kind), furnitureCount: this.tavern.furns.length },
      today: { served: this.econ.served, lost: this.econ.lost, revenue: this.econ.revenue, completedWork: Object.values(this.dayReport?.work || {}).map((row) => ({ name: row.name, tasks: row.tasks })) },
      staff: this.staff.map((person) => ({ name: person.name, job: person.job, skills: normalizedSkills(person.skills), morale: Math.round(person.needs.morale), stress: Math.round(person.needs.stress) })),
      regularGuests: this.regulars.filter((profile) => profile.lastVisitDay >= this.econ.day - 2).map((profile) => ({ name: profile.name, race: profile.race, visits: profile.visits, affinity: profile.aff, offer: profile.offer })),
      recentEvents: this.eventHistory.slice(-8),
      allowedEffectRanges: { coins: [-400, 400], rep: [-25, 25], stockEach: [-12, 12], cleanliness: [-20, 20], stress: [-15, 20], morale: [-15, 15], dirt: [-4, 6] },
    };
  }

  structuredEventCard(plan, eventId, meta = {}) {
    const demand = this.difficultyMods().demand;
    return {
      id: eventId, title: plan.title, text: plan.premise, kind: plan.kind || 'mystery', ...meta,
      choices: plan.choices.map((choice) => ({
        label: choice.label, note: choice.note, skill: choice.skill,
        base: clamp(95 - Number(choice.difficulty || 55) * demand, 18, 70),
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
    // 教学前三日的事件只允许脚本明确排入的口味挑战；随机世界/经营事件
    // 会打断固定工作链，因此即使被旧存档或外部调用触发也直接忽略。
    if (this.campaign.mode === 'tutorial' && this.econ.day <= 3) return false;
    const commission = this.worldCommission();
    if (this.econ.day >= 2 && this.econ.day % 2 === 0 && !commission.complete && this.lastWorldChainEventDay !== this.econ.day) {
      const stage = commission.stage;
      const step = commission.next;
      const id = `world_chain_${commission.world.id}_${stage}`;
      this.pendingEvent = this.structuredEventCard(step, id, {
        chainId: commission.key, chainStage: stage, chainName: commission.chain.name,
        worldEvent: true, worldId: commission.world.id, factionId: commission.faction.id, factionName: commission.faction.name,
      });
      this.lastWorldChainEventDay = this.econ.day;
      this.lastEventId = id;
      this.eventHistory.push(id);
      if (this.eventHistory.length > 12) this.eventHistory.shift();
      this.fx.push({ ...this.tavern.entrance(), t: 1.2, kind: 'event' });
      this.sounds.push('alert');
      return;
    }
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
    const world = this.currentWorld();
    const worldAccident = worldContentFor(world).accident;
    const worldAccidentId = `world_accident_${world.id}`;
    if (!recent.has(worldAccidentId) && this.rng.chance(0.55)) {
      const faction = world.factions?.[worldAccident.factionIndex] || world.factions?.[0] || { id: 'local', name: '当地势力' };
      this.lastEventId = worldAccidentId;
      this.eventHistory.push(worldAccidentId);
      if (this.eventHistory.length > 12) this.eventHistory.shift();
      this.pendingEvent = this.structuredEventCard(worldAccident, worldAccidentId, {
        worldEvent: true, worldId: world.id, factionId: faction.id, factionName: faction.name,
      });
      this.fx.push({ ...this.tavern.entrance(), t: 1.2, kind: 'event' });
      this.sounds.push('alert');
      return;
    }
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
  choiceChance(choice, card = this.pendingEvent)         {
    if (!choice.skill) return 100;
    if (card?.challengeFallback) {
      const staff = this.staff.find((person) => person.id === (choice.actorId || card.actorId));
      if (!staff) return 5;
      return clamp(Math.round(55 + (this.skillOf(staff, choice.skill) - choice.difficulty) * 1.15 + this.challengeTraitBonus(staff, choice.skill)), 5, 96);
    }
    const best = this.bestSkill(choice.skill);
    const stoic = this.staff.some((s) => s.traits.includes('stoic')) ? 10 : 0;
    const demand = this.difficultyMods().demand;
    return clamp(Math.round((choice.base || 50) * 0.5 / demand + best.value * 0.6 + stoic), 5, 96);
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
    if (card.worldId && card.factionId) this.adjustFactionRelation(card.worldId, card.factionId, success ? 8 : -5);
    if (card.chainId) this.eventChains[card.chainId] = Math.max(this.eventChains[card.chainId] || 0, (card.chainStage || 0) + 1);
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
      worldId: card.worldId || '', factionId: card.factionId || '', factionName: card.factionName || '',
    };
    if (this.dayReport) this.dayReport.events.push(this.lastEventResolution);
    return { ...this.lastEventResolution, narrative: this.lastEventResolution.originalResult, best };
  }

  resolveEvent(idx        )         {
    const card = this.pendingEvent;
    if (!card) return '';
    const c = card.choices[idx];
    if (!c) return '';
    if (card.challengeFallback) return this.resolveChallengeFallback(card, c);
    if (card.chainId) this.eventChains[card.chainId] = Math.max(this.eventChains[card.chainId] || 0, (card.chainStage || 0) + 1);
    const snapshot = () => ({
      coins: this.econ.coins, rep: this.econ.rep, stock: { ...this.econ.stock }, dirt: this.tavern.dirt.length,
      clean: this.tavern.rooms.length ? this.tavern.rooms.reduce((sum, room) => sum + room.clean, 0) / this.tavern.rooms.length : 0,
      stress: this.staff.length ? this.staff.reduce((sum, staff) => sum + staff.needs.stress, 0) / this.staff.length : 0,
      morale: this.staff.length ? this.staff.reduce((sum, staff) => sum + staff.needs.morale, 0) / this.staff.length : 0,
    });
    const before = snapshot();
    this.pendingEvent = null;
    if (card.tutorialTaste) {
      this.campaign.tutorialFlags.tasteChallengeConsumed = true;
      // 只有第三批固定口味挑战完成后，才把“回床休息”作为下一段教学目标。
      this.campaign.tutorialFlags.bedPrompt = true;
      if (this.econ.day === 1) {
        const owner = this.staff.find((staff) => staff.isOwner);
        const bed = owner && this.bedFor(owner.id);
        if (owner && bed) {
          owner.needs.stamina = 0;
          owner.bubble = { text: '好累啊……该回我的房间躺一会儿了。', t: 6 };
          const stand = this.tavern.standTileNear(this.tavern.useTiles(bed));
          owner.pendingBedRest = bed.id;
          owner.path = stand ? (this.tavern.path(Math.round(owner.x), Math.round(owner.y), stand.x, stand.y) || []) : [];
          this.toast('体力、压力、士气和饥饿会影响工作；现在请回床边休息。');
        }
      }
    }
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
    if (card.worldId && card.factionId) this.adjustFactionRelation(card.worldId, card.factionId, success ? 8 : -5);
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
      worldId: card.worldId || '', factionId: card.factionId || '', factionName: card.factionName || '',
    };
    if (this.dayReport) this.dayReport.events.push(this.lastEventResolution);
    return text;
  }

  resolveChallengeFallback(card, choice) {
    const challenge = this.facilityChallenges.find((item) => item.id === card.challengeId);
    const staff = this.staff.find((person) => person.id === card.actorId);
    if (!challenge || !staff) { this.pendingEvent = null; return '挑战对象已经离开，事件结束。'; }
    const group = this.groups.find((item) => item.id === challenge.groupId);
    const guest = group?.members.find((item) => item.id === challenge.guestId) || group?.members[0];
    const beforeCoins = this.econ.coins;
    const beforeAff = guest?.aff || 0;
    const chance = this.choiceChance(choice, card);
    const roll = 1 + Math.floor(this.rng.next() * 100);
    const success = roll <= chance;
    this.pendingEvent = null;
    this.finishFacilityChallenge(challenge, staff, success);
    const narrative = String(success ? choice.successText : choice.failureText).replaceAll('{staff}', staff.name);
    const effects = {
      coins: this.econ.coins - beforeCoins,
      rep: 0,
      stock: {},
      guestAffinity: (guest?.aff || 0) - beforeAff,
      service: success ? '本次客群服务评价上升' : '本次客群服务评价下降',
    };
    this.lastEventResolution = {
      eventId: card.id, title: card.title, premise: card.text, choice: choice.label,
      choiceNote: choice.note, skill: choice.skill, success, originalResult: narrative, effects,
      challengeFallback: true, difficulty: choice.difficulty, chance, roll, actor: staff.name,
    };
    if (this.dayReport) this.dayReport.events.push(this.lastEventResolution);
    return narrative;
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
      campaign: this.campaign,
      lastStat: this.lastStat,
      meetingState: this.meetingState,
      nightState: this.nightState,
    };
  }

  loadState(data                                                                                                                                              )       {
    this.econ = data.econ;
    this.campaign = data.campaign && typeof data.campaign === 'object' ? { ...this.campaign, ...data.campaign } : { ...this.campaign, firstDayComplete: true, quickStartUnlocked: true };
    this.lastStat = data.lastStat || this.campaign.reportState?.stat || null;
    this.meetingState = data.meetingState && typeof data.meetingState === 'object' ? { ...this.meetingState, ...data.meetingState } : { ...this.meetingState };
    this.nightState = data.nightState && typeof data.nightState === 'object' ? { ...this.nightState, ...data.nightState } : { ...this.nightState };
    this.nightState.proactiveQueue ||= [];
    this.nightState.proactiveReadyQueue ||= [];
    if (this.nightState.proactiveReadyStaff && !this.nightState.proactiveReadyQueue.includes(this.nightState.proactiveReadyStaff)) this.nightState.proactiveReadyQueue.unshift(this.nightState.proactiveReadyStaff);
    this.nightState.proactiveReadyStaff = this.nightState.proactiveReadyQueue[0] || null;
    this.nightState.proactiveInFlight ||= null;
    this.nightState.proactive ||= [];
    this.econ.certifiedStars = clamp(Math.round(Number(this.econ.certifiedStars) || 0), 0, 5);
    this.econ.certificationHistory = Array.isArray(this.econ.certificationHistory) ? this.econ.certificationHistory : [];
    this.econ.customWorlds = Array.isArray(this.econ.customWorlds) ? this.econ.customWorlds.slice(0, 8).map((world) => normalizeCustomWorld(world, world.id)) : [];
    this.econ.archivedWorlds = Array.isArray(this.econ.archivedWorlds) ? this.econ.archivedWorlds.slice(0, 40) : [];
    this.econ.currentWorldId = this.worldById(this.econ.currentWorldId).id;
    this.econ.pendingWorldSwitch = this.econ.pendingWorldSwitch && typeof this.econ.pendingWorldSwitch === 'object' ? this.econ.pendingWorldSwitch : null;
    this.econ.worldVisits = this.econ.worldVisits && typeof this.econ.worldVisits === 'object' ? this.econ.worldVisits : { [this.econ.currentWorldId]: 1 };
    this.econ.worldKnowledge = { ...blankWorldKnowledge(), ...Object.fromEntries(this.econ.customWorlds.map((world) => [world.id, { level: 4, arrivals: 0, served: 0, firstDay: this.econ.day, reviewed: true, journeyAsked: true }])), ...(this.econ.worldKnowledge || {}) };
    this.econ.worldForecast = worldForecastForDay(this.econ.seed, this.econ.day, this.econ.certifiedStars);
    // 兼容旧版本在“次日开门”前保存的航行：载入时直接抵达，避免目的地永久卡住。
    if (this.econ.pendingWorldSwitch) this.activatePendingWorldSwitch();
    if (!this.econ.menu) this.econ.menu = {};   // 老存档：全部上架
    if (!this.econ.customDishes) this.econ.customDishes = [];   // 老存档：无自创菜
    if (!this.econ.aiChronicles) this.econ.aiChronicles = [];
    if (!this.econ.aiNightStories) this.econ.aiNightStories = [];
    if (!this.econ.notableVisits || typeof this.econ.notableVisits !== 'object') this.econ.notableVisits = {};
    if (!this.econ.factionRelations || typeof this.econ.factionRelations !== 'object') this.econ.factionRelations = {};
    if (!this.econ.worldSeenLevels || typeof this.econ.worldSeenLevels !== 'object') this.econ.worldSeenLevels = {};
    if (!this.econ.recruitmentSeen || typeof this.econ.recruitmentSeen !== 'object') this.econ.recruitmentSeen = {};
    normalizeGuestSettings(this.econ);
    normalizeContestState(this.econ);
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
      perks: normalizePerkList(s.perks), perkCharges: s.perkCharges && typeof s.perkCharges === 'object' ? { ...s.perkCharges } : {},
      trainingCount: Math.max(0, Number(s.trainingCount) || 0),
      affCd: 0, chats: s.chats || 0, chatLog: s.chatLog || [], aiChatLog: s.aiChatLog || [], relationshipSummary: String(s.relationshipSummary || '').slice(0, 600), background: s.background || null, hireDay: s.hireDay || 1,
      originWorldId: String(s.originWorldId || ''),
      originWorldName: String(s.originWorldName || (s.originWorldId ? this.worldById(s.originWorldId).name : '')).slice(0, 80),
      homeRegion: String(s.homeRegion || '').slice(0, 80),
    });
    const restoreSpecialty = (person) => {
      if (person.isOwner || person.worldSpecialty?.id || !person.originWorldId) return person;
      return applyWorldSpecialty(person, this.worldById(person.originWorldId));
    };
    this.staff = data.staff.map((s) => restoreSpecialty(fix(s, false)));
    this.pool = data.pool.map((s) => restoreSpecialty(fix(s, true))).map((person) => person.originWorldName ? person : applyRecruitmentWorld(person, this.currentWorld(), this.rng));
    this.ads = (data.ads && data.ads.length === 3 ? data.ads : [{ spec: null, cands: [], day: 0 }, { spec: null, cands: [], day: 0 }, { spec: null, cands: [], day: 0 }])
      .map((a) => {
        const spec = a.spec ? {
          ...a.spec,
          sex: a.spec.sex === '男' || a.spec.sex === '女' ? a.spec.sex : '',
          birthWorldId: WORLD_PROFILES.some((world) => world.id === a.spec.birthWorldId) || a.spec.birthWorldId === 'ai_custom' ? a.spec.birthWorldId : WORLD_PROFILES[0].id,
          customWorldName: String(a.spec.customWorldName || '').trim().slice(0, 80),
        } : null;
        const fixedWorld = spec ? WORLD_PROFILES.find((world) => world.id === spec.birthWorldId) : null;
        const cands = (a.cands || []).map((s) => restoreSpecialty(fix(s, true))).map((person) => {
          if (person.originWorldName) return person;
          if (fixedWorld) return applyRecruitmentWorld(person, fixedWorld, this.rng);
          if (spec?.customWorldName) { person.originWorldId = ''; person.originWorldName = spec.customWorldName; }
          return person;
        });
        return { spec, day: a.day || 0, cands };
      });
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
    currentWorldId: 'hearth_coast', pendingWorldSwitch: null, customWorlds: [], archivedWorlds: [], worldVisits: { hearth_coast: 1 }, notableVisits: {},
    factionRelations: {}, worldSeenLevels: {}, recruitmentSeen: {}, worldStayState: { worldId: 'hearth_coast', days: 1 },
    worldKnowledge: blankWorldKnowledge(), worldForecast: worldForecastForDay(seed, 1, 0),
    guestCap: 0, difficulty: 'normal',
    tavernName: '多元便携旅店', tavernBlurb: '一间能开到任何世界门口的便携旅店。',
    titles: [], equippedTitle: '', contest: blankContestState(),
    revenue: 0, served: 0, lost: 0, seed,
  };
}

export const ALL_JOBS = JOBS;
export const ALL_FURN = FURN_DEFS;
export function dirOf(dx        , dy        )         {
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 1) : dy > 0 ? 0 : 2;
}
export { dirDelta };
