// 静态数据表：房间蓝图 / 家具 / 菜谱 / 性格 / 姓名 / 事件牌
import { enrichFixedWorld, normalizeCustomWorld } from './world-system.js';
                                                                                    
                                                                                     
                                         

export const ROOM_LABEL                           = {
  foyer: '位面门厅', dining: '餐饮间', kitchen: '厨房', storage: '储藏室', bar: '酒吧', lounge: '员工休息室',
  guestroom: '客房', parlor: '酒廊', onsen: '温泉', billiard: '台球室', corridor: '走廊', theater: '放映厅', garden: '豪华庭院', observatory: '星象台', arcade: '游艺厅', alchemy: '炼金房',
};
export const ROOM_FLOOR                           = {
  foyer: 'floor-wood', dining: 'floor-wood', kitchen: 'floor-kitchen',
  storage: 'floor-storage', bar: 'floor-wood', lounge: 'floor-carpet',
  guestroom: 'floor-tatami', parlor: 'floor-carpet', onsen: 'floor-onsen', billiard: 'floor-parquet',
  corridor: 'floor-wood', theater: 'floor-carpet', garden: 'floor-garden',
  observatory: 'floor-astral', arcade: 'floor-neon', alchemy: 'floor-forge',
};

/** 装修风格：换地砖、墙纸、家具镶边色与地面辉光；自带氛围加成 */
                          
                                                       
                                           
                                   
                                      
                                          
                                      
                                                         
                                     
  

export const STYLES               = [
  { id: 'rustic', name: '原木旅舍', note: '默认风格：暖木与黄铜', cost: 0, floor: '', wall: '', trim: '', accent: '#C9922F', glow: '#F3B84B', furnTint: '#FFFFFF', charm: 0 },
  { id: 'neon', name: '霓虹赛博', note: '深蓝甲板＋青紫霓虹缝线', cost: 220, floor: 'floor-neon', wall: '#1D2740', trim: '#39D7D2', accent: '#E45AD1', glow: '#39D7D2', furnTint: '#9FC0E8', charm: 0.5 },
  { id: 'astral', name: '星海秘境', note: '靛紫星石地面，家具镶紫金', cost: 280, floor: 'floor-astral', wall: '#2A2350', trim: '#9B7BE8', accent: '#7A4BE0', glow: '#9B7BE8', furnTint: '#BFA8F0', charm: 0.6 },
  { id: 'forge', name: '熔岩锻炉', note: '玄武岩＋岩浆裂缝，铁与火', cost: 240, floor: 'floor-forge', wall: '#3A2622', trim: '#E4732C', accent: '#E4732C', glow: '#E4732C', furnTint: '#F0B48A', charm: 0.45 },
  { id: 'frost', name: '极地冰晶', note: '冰晶地砖与霜白镶边', cost: 260, floor: 'floor-frost', wall: '#2E4A5C', trim: '#9EE8F5', accent: '#7FD7E8', glow: '#9EE8F5', furnTint: '#CFE8F5', charm: 0.5 },
];

/** 房间自带氛围（酒廊/温泉这类主题房本身就好看） */
export const ROOM_CHARM                                    = {
  parlor: 0.4, onsen: 0.3, billiard: 0.2, guestroom: 0.15, corridor: 0, theater: 0.35, garden: 0.5, observatory: 0.4, arcade: 0.3, alchemy: 0.35,
};

export function styleById(id        )             {
  return STYLES.find((s) => s.id === id) || STYLES[0];
}

;                                                                                                                                                          

export const BLUEPRINTS              = [
  { id: 'foyer4', kind: 'foyer', name: '位面门厅 4×4', w: 4, h: 4, cost: 0, unlock: 0, note: '酒馆的根，客人从此进入', buildable: false },
  { id: 'dining6', kind: 'dining', name: '餐饮间 6×5', w: 6, h: 5, cost: 420, unlock: 0, note: '放桌椅接待客人', buildable: true },
  { id: 'kitchen6', kind: 'kitchen', name: '厨房 6×5', w: 6, h: 5, cost: 480, unlock: 0, note: '备餐→灶台→出餐台', buildable: true },
  { id: 'storage4', kind: 'storage', name: '储藏室 4×4', w: 4, h: 4, cost: 260, unlock: 0, note: '储物架供厨师取料', buildable: true },
  { id: 'bar6', kind: 'bar', name: '酒吧 6×4', w: 6, h: 4, cost: 620, unlock: 1, note: '酒桶出饮品，翻台快', buildable: true },
  { id: 'lounge5', kind: 'lounge', name: '休息室 5×4', w: 5, h: 4, cost: 520, unlock: 0, note: '员工在此恢复体力；每间休息室只住 1 名员工', buildable: true },
  { id: 'dining10', kind: 'dining', name: '大餐厅 10×8', w: 10, h: 8, cost: 1500, unlock: 3, note: '容量大，但动线更长', buildable: true },
  { id: 'kitchen9', kind: 'kitchen', name: '大厨房 9×7', w: 9, h: 7, cost: 1600, unlock: 3, note: '可容纳多套产线', buildable: true },
  { id: 'storage6', kind: 'storage', name: '大储藏室 6×5', w: 6, h: 5, cost: 700, unlock: 3, note: '更多储物架缓冲', buildable: true },
  { id: 'corridor3', kind: 'corridor', name: '走廊 3×8', w: 3, h: 8, cost: 160, unlock: 0, note: '只用来连通房间，把动线拉直（客人不会在这里停留）', buildable: true },
  { id: 'corridor6', kind: 'corridor', name: '走廊 6×2', w: 6, h: 2, cost: 140, unlock: 0, note: '横向连通两侧房间', buildable: true },
  { id: 'corridor2', kind: 'corridor', name: '走廊 2×3', w: 2, h: 3, cost: 60, unlock: 0, note: '短走廊，垂直连通上下房间', buildable: true },
  { id: 'guestroom5', kind: 'guestroom', name: '客房 5×4', w: 5, h: 4, cost: 720, unlock: 1, note: '摆客床，客人来过夜（住宿费按人头）', buildable: true },
  { id: 'parlor6', kind: 'parlor', name: '酒廊 6×5', w: 6, h: 5, cost: 880, unlock: 2, note: '高级餐饮区：桌椅＋酒桶＋钢琴，氛围自带加成', buildable: true },
  { id: 'onsen6', kind: 'onsen', name: '温泉 6×5', w: 6, h: 5, cost: 980, unlock: 2, note: '摆汤池，客人来泡汤（无需厨房）', buildable: true },
  { id: 'billiard6', kind: 'billiard', name: '台球室 6×5', w: 6, h: 5, cost: 860, unlock: 3, note: '摆台球桌，客人来打球消费', buildable: true },
  { id: 'theater6', kind: 'theater', name: '放映厅 6×4', w: 6, h: 4, cost: 900, unlock: 3, note: '摆大银幕，客人来看放映', buildable: true },
  { id: 'garden6', kind: 'garden', name: '豪华庭院 6×4', w: 6, h: 4, cost: 1100, unlock: 4, note: '摆喷泉与园艺，客人来散步赏景', buildable: true },
  { id: 'observatory6', kind: 'observatory', name: '星象台 6×4', w: 6, h: 4, cost: 980, unlock: 3, note: '摆望远镜，客人来观星', buildable: true },
  { id: 'arcade6', kind: 'arcade', name: '游艺厅 6×4', w: 6, h: 4, cost: 940, unlock: 3, note: '摆街机，客人来打电动', buildable: true },
  { id: 'alchemy6', kind: 'alchemy', name: '炼金房 6×4', w: 6, h: 4, cost: 1150, unlock: 4, note: '摆炼金釜，客人来看稀奇', buildable: true },
  { id: 'guestroom8', kind: 'guestroom', name: '大客房 8×5', w: 8, h: 5, cost: 1400, unlock: 3, note: '可摆多张客床，过夜收入翻倍', buildable: true },
];

                       
                                                                              
                                  
                                  
                   
  

export const FURN_DEFS            = [
  { kind: 'shelf', name: '储物架', rooms: ['storage'], cost: [90, 220, 460], note: '厨师从此取料', cap: [40, 90, 160] },
  { kind: 'prep', name: '备餐台', rooms: ['kitchen'], cost: [120, 300, 650], note: '处理食材', time: [5, 3.6, 2.6] },
  { kind: 'stove', name: '灶台', rooms: ['kitchen'], cost: [180, 420, 900], note: '制作菜品', time: [8, 5.6, 4] },
  { kind: 'pass', name: '出餐台', rooms: ['kitchen'], cost: [100, 240, 520], note: '成品暂存，服务员取餐', cap: [2, 3, 4] },
  { kind: 'sink', name: '洗涤槽', rooms: ['kitchen'], cost: [110, 260, 540], note: '洗脏盘，脏盘堆积会降卫生', time: [6, 4.4, 3.2] },
  { kind: 'table', name: '餐桌', rooms: ['dining', 'bar', 'parlor'], cost: [70, 170, 360], note: '按实际椅子接待 1–4 人；基础餐桌也支持三人同行', cap: [3, 4, 4] },
  { kind: 'chair', name: '椅子', rooms: ['dining', 'bar', 'lounge', 'parlor'], cost: [30, 80, 170], note: '靠背朝向必须对着餐桌', cap: [1, 1, 1] },
  { kind: 'keg', name: '酒桶', rooms: ['bar', 'parlor'], cost: [150, 340, 700], note: '调酒并暂存成品，服务员直接从吧台取酒', cap: [2, 3, 4], time: [4, 3, 2.2] },
  { kind: 'couch', name: '沙发', rooms: ['lounge'], cost: [140, 320, 640], note: '员工在此恢复体力/压力', time: [1, 1.4, 1.9] },
  { kind: 'fireplace', name: '壁炉', rooms: ['dining', 'bar', 'lounge', 'foyer', 'parlor', 'guestroom', 'onsen', 'billiard'], cost: [200, 460, 900], note: '暖光炉火，大幅提升同房间客人舒适度', charm: [0.5, 0.8, 1.2] },
  { kind: 'plant', name: '位面盆栽', rooms: ['dining', 'bar', 'lounge', 'foyer', 'kitchen', 'storage', 'parlor', 'guestroom', 'onsen', 'billiard', 'corridor'], cost: [40, 100, 220], note: '哪儿都能摆，小幅提升氛围', charm: [0.18, 0.3, 0.5] },
  { kind: 'lamp', name: '星灯', rooms: ['dining', 'bar', 'lounge', 'foyer', 'parlor', 'guestroom', 'onsen', 'billiard', 'corridor'], cost: [60, 150, 320], note: '照亮角落，提升氛围', charm: [0.25, 0.42, 0.7] },
  { kind: 'bunk', name: '大床', rooms: ['lounge'], cost: [180, 400, 780], note: '员工的大床：比沙发恢复更多体力、压力降更快', time: [12, 10, 8] },
  { kind: 'bookshelf', name: '书架', rooms: ['lounge'], cost: [120, 280, 560], note: '打烊后员工会来翻书，缓解压力', time: [1, 1.4, 1.9] },
  { kind: 'teatable', name: '茶桌', rooms: ['lounge'], cost: [90, 210, 430], note: '打烊后员工会来泡壶茶，回饥饿、缓士气', time: [1, 1.4, 1.9] },
  { kind: 'vanity', name: '梳妆台', rooms: ['lounge'], cost: [110, 260, 520], note: '打烊后员工会对镜整理仪容，提振士气', time: [1, 1.4, 1.9] },
  { kind: 'icebox', name: '冰柜', rooms: ['kitchen'], cost: [220, 480, 950], note: '厨房里就近取料，省掉跑储藏室的路', cap: [40, 90, 160] },
  { kind: 'lightbar', name: '灯光条', rooms: ['dining', 'bar', 'lounge', 'foyer', 'kitchen', 'storage', 'parlor', 'guestroom', 'onsen', 'billiard', 'corridor'], cost: [90, 200, 420], note: '贴地灯带，灯管颜色跟随房间装修风格', charm: [0.3, 0.5, 0.8] },
  { kind: 'desk', name: '前台柜台', rooms: ['foyer'], cost: [160, 380, 760], note: '前台伙计的岗位：等位客人在这里被安抚', charm: [0.2, 0.35, 0.55] },
  { kind: 'bed', name: '客床', rooms: ['guestroom'], cost: [200, 460, 920], note: '客人在此过夜，用完需要整理', cap: [1, 2, 2], time: [30, 27, 24], charm: [0.15, 0.25, 0.4] },
  { kind: 'doublebed', name: '双人大床', rooms: ['guestroom'], cost: [340, 720, 1450], note: '双人大床：住宿费 ×1.5，用完需要整理', cap: [2, 2, 3], time: [30, 27, 24], charm: [0.25, 0.4, 0.6] },
  { kind: 'kingbed', name: '豪华大床', rooms: ['guestroom'], cost: [720, 1600, 3200], note: 'king size：住宿费 ×2.2，用完需要整理', cap: [2, 3, 4], time: [30, 27, 24], charm: [0.5, 0.8, 1.2] },
  { kind: 'pool', name: '汤池', rooms: ['onsen'], cost: [420, 900, 1700], note: '2×2 汤池，客人泡汤，用完需要打理水面', cap: [2, 3, 4], time: [26, 24, 22], charm: [0.5, 0.8, 1.2] },
  { kind: 'billiardtable', name: '台球桌', rooms: ['billiard'], cost: [380, 820, 1600], note: '客人围着打球，用完需要摆球', cap: [2, 3, 4], time: [24, 22, 20], charm: [0.3, 0.5, 0.8] },
  { kind: 'screen', name: '大银幕', rooms: ['theater'], cost: [380, 820, 1600], note: '客人坐下看放映，用完需要收拾场地', cap: [2, 3, 4], time: [24, 22, 20], charm: [0.3, 0.5, 0.8] },
  { kind: 'fountain', name: '喷泉', rooms: ['garden'], cost: [450, 950, 1800], note: '2×2 喷泉，客人围着赏景，用完需要清理水池', cap: [2, 3, 4], time: [26, 24, 22], charm: [0.5, 0.8, 1.2] },
  { kind: 'statue', name: '雕像', rooms: ['foyer', 'garden', 'parlor', 'guestroom'], cost: [150, 320, 650], note: '摆上就提格调', charm: [0.4, 0.6, 0.9] },
  { kind: 'clock', name: '落地钟', rooms: ['foyer', 'lounge', 'parlor'], cost: [130, 290, 580], note: '滴答作响，店里更有味道', charm: [0.2, 0.35, 0.5] },
  { kind: 'banner', name: '挂旗', rooms: ['foyer', 'dining', 'bar', 'parlor', 'corridor', 'theater', 'garden'], cost: [60, 140, 300], note: '氛围小件', charm: [0.15, 0.25, 0.4] },
  { kind: 'aquarium', name: '水族箱', rooms: ['parlor', 'garden', 'lounge', 'foyer'], cost: [260, 560, 1100], note: '气泡常冒，看着就解压', charm: [0.4, 0.6, 0.9] },
  { kind: 'winecabinet', name: '酒柜', rooms: ['bar', 'parlor'], cost: [220, 480, 950], note: '各国位面的藏酒', charm: [0.3, 0.5, 0.8] },
  { kind: 'flowerbed', name: '花坛', rooms: ['garden'], cost: [140, 320, 640], note: '庭院点缀，客人爱拍照', charm: [0.35, 0.55, 0.85] },
  { kind: 'bench', name: '长椅', rooms: ['garden', 'corridor', 'foyer'], cost: [110, 250, 500], note: '等候客人可以坐下，不会截断通道', charm: [0.15, 0.3, 0.5] },
  { kind: 'telescope', name: '望远镜', rooms: ['observatory'], cost: [420, 880, 1700], note: '客人排队看星星，用完需要校准', cap: [1, 2, 2], time: [24, 22, 20], charm: [0.4, 0.6, 0.9] },
  { kind: 'arcadem', name: '街机', rooms: ['arcade'], cost: [320, 680, 1350], note: '屏幕常年闪，客人来打电动，用完需要复位', cap: [1, 2, 2], time: [22, 20, 18], charm: [0.3, 0.5, 0.8] },
  { kind: 'cauldron', name: '炼金釜', rooms: ['alchemy'], cost: [480, 980, 1900], note: '咕嘟咕嘟冒泡，客人围观炼金，用完需要清洗', cap: [2, 3, 4], time: [26, 24, 22], charm: [0.5, 0.8, 1.2] },
  { kind: 'crystal', name: '水晶簇', rooms: ['observatory', 'garden', 'alchemy', 'onsen'], cost: [160, 350, 700], note: '微微发光的位面水晶', charm: [0.3, 0.5, 0.8] },
  { kind: 'piano', name: '星尘钢琴', rooms: ['parlor', 'dining', 'bar', 'foyer'], cost: [320, 700, 1400], note: '酒廊的门面：大幅提升氛围与观感', charm: [0.55, 0.9, 1.4] },
  { kind: 'lightcol', name: '光柱', rooms: ['dining', 'bar', 'lounge', 'foyer', 'parlor', 'onsen', 'billiard', 'corridor'], cost: [110, 240, 500], note: '立式灯柱，四面同形，氛围更强', charm: [0.35, 0.6, 0.9] },
];

const FURN_SIGNATURE = new Set(['kingbed', 'pool', 'fountain', 'telescope', 'arcadem', 'cauldron', 'piano', 'aquarium']);
const FURN_DECOR = new Set(['fireplace', 'plant', 'lamp', 'lightbar', 'statue', 'clock', 'banner', 'winecabinet', 'flowerbed', 'bench', 'crystal', 'lightcol']);

/** 家具成长线：II 级从一星开始；III 级按基础、装饰、招牌家具分阶段开放。 */
export function furnQualityUnlock(kind, quality) {
  if (quality <= 1) return 0;
  if (quality === 2) return 1;
  if (FURN_SIGNATURE.has(kind)) return 5;
  if (FURN_DECOR.has(kind)) return 4;
  return 3;
}

export function furnDef(kind        )          {
  const d = FURN_DEFS.find((f) => f.kind === kind);
  if (!d) throw new Error('unknown furniture ' + kind);
  return d;
}

export const ING_KEYS = ['grain', 'veg', 'meat', 'spice', 'ether']         ;
                                             
export const ING_LABEL                         = { grain: '谷物', veg: '蔬果', meat: '肉类', spice: '香料', ether: '以太' };
export const ING_PRICE                         = { grain: 2, veg: 3, meat: 6, spice: 8, ether: 14 };

/**
 * 客人需求表：客人只会提出「当前酒馆能满足」的需求 —— 缺产出设备或缺落座区域，
 * 这条需求根本不会被抽到（例如没有酒吧就没人上门要喝酒；将来加客房才会有人要睡觉）。
 * 加一条需求＝这里加一行 + Sim.wantOk 里补一条可用性判断。
 */
                         
                                           
                                                    
                                            
                 
                                     
                    
                                      
                                        
  
/** 床类家具：睡觉需求认这三种（价格倍率不同） */
export const BED_KINDS           = ['bed', 'doublebed', 'kingbed'];
export const BED_PRICE_MULT                         = { bed: 1, doublebed: 1.5, kingbed: 2.2 };

export const GUEST_WANTS              = [
  { id: 'meal', name: '吃饭', bubble: '想吃饭', seatRooms: ['dining', 'parlor', 'bar'], drink: false, weight: 6 },
  { id: 'drink', name: '喝一杯', bubble: '想喝一杯', seatRooms: ['bar', 'parlor', 'dining'], drink: true, weight: 4 },
  { id: 'sleep', name: '过夜', bubble: '想住一晚', seatRooms: ['guestroom'], drink: false, weight: 3, facility: 'bed', price: 125, verb: '睡觉' },
  { id: 'bath', name: '泡汤', bubble: '想泡温泉', seatRooms: ['onsen'], drink: false, weight: 3, facility: 'pool', price: 42, verb: '泡汤' },
  { id: 'play', name: '打台球', bubble: '想打台球', seatRooms: ['billiard'], drink: false, weight: 3, facility: 'billiardtable', price: 34, verb: '打球' },
  { id: 'show', name: '看放映', bubble: '想看场放映', seatRooms: ['theater'], drink: false, weight: 3, facility: 'screen', price: 36, verb: '观影' },
  { id: 'stroll', name: '逛庭院', bubble: '想去庭院转转', seatRooms: ['garden'], drink: false, weight: 3, facility: 'fountain', price: 46, verb: '赏景' },
  { id: 'stargaze', name: '观星', bubble: '想看星星', seatRooms: ['observatory'], drink: false, weight: 3, facility: 'telescope', price: 40, verb: '观星' },
  { id: 'game', name: '打电动', bubble: '想打电动', seatRooms: ['arcade'], drink: false, weight: 4, facility: 'arcadem', price: 30, verb: '打电动' },
  { id: 'brew', name: '看炼金', bubble: '想看炼金', seatRooms: ['alchemy'], drink: false, weight: 3, facility: 'cauldron', price: 44, verb: '围观炼金' },
];
export function wantById(id        )            {
  return GUEST_WANTS.find((w) => w.id === id) || GUEST_WANTS[0];
}

;                                                                                                                                                               
                                      
                     
                
                   
                          
                   

export const FLAVORS = [
  { id: 'umami', name: '鲜' }, { id: 'spicy', name: '辣' }, { id: 'sweet', name: '甜' },
  { id: 'sour', name: '酸' }, { id: 'mellow', name: '醇' }, { id: 'weird', name: '猎奇' },
]         ;
export const FLAVOR_LABEL                         = { umami: '鲜', spicy: '辣', sweet: '甜', sour: '酸', mellow: '醇', weird: '猎奇' };

const WORLD_DIALOGUE_VOICE = {
  hearth_coast: {
    arrival: ['{address}，银冠驿路刚下过雨，给我们一张能摊开委托书的桌子。', '长桌公会说这里认跨界徽章，看来门口的七曜纹没有骗人。', '队里法师还在清点卷轴，先给守夜的伙伴上一锅热汤吧。', '我们刚从北境地下城撤出来，盔甲能放哪儿才不妨碍别人？', '若床铺和价目都像传闻一样可靠，{self}愿把这里写进公会航图。'],
    wait: ['委托有时限，接待也该有个准点；{address}，还要多久？', '在公会柜台，沉默这么久通常意味着任务出了岔子。', '我们的牧师已经念完两轮短祷，队伍仍没等到带位。', '北境兽潮都没让这支小队站这么久，柜台倒做到了。', '请把等待写进契约，至少让大家知道还要守几刻钟。'],
    good: ['{address}，热食、明账和同席都做到了，这才是守约的旅店。', '这锅炖肉比圣杯平原的营火餐还暖，法师都肯摘兜帽了。', '床褥干爽，武器架结实，冒险者最在意的从来不是花话。', '五塔学徒说餐盘上的香料像一枚小型法阵——这是夸奖。', '回银冠王都后，{self}会在长桌公会替你挂一枚金色好评牌。'],
    neutral: ['账目清楚，火候也稳，只是少了点让小队举杯的热气。', '可以歇脚，但还没好到让冒险者绕开下一座传送门。', '教廷巡礼站也能做到这种程度；这里本该更有异界惊喜。', '床铺没问题，饭菜没问题，故事也就停在“没问题”。', '若下次能让整队同时上菜，{self}愿把评价再抬一颗星。'],
    bad: ['{address}，拆散小队、拖延出餐还临时加价，三条契约全犯了。', '这盘冷肉若送进北境营地，连霜狼都要把它推回来。', '公会徽章不是让人挂着好看的；这份失信会如实登记。', '同伴还饿着，账单却先到，哪位王国税吏教的待客法？', '{self}跨过地下城和星门，不是为了在柜台前输给一张空椅子。'],
    journey: ['我们受长桌公会委托，追查一枚在五座地下城同时出现的王室印玺。', '白塔湖区的星门忽然映出另一片天空，院长便派我们来记录坐标。', '无旗圣女护送北境伤员南下，{self}只是先来替队伍找落脚处。', '深路商盟在古矿井里挖到异界香料，味道一路把商队引到这里。', '七冠盟约的新附页需要一个跨界见证者，旅店或许正合适。'],
  },
  verdant_court: {
    arrival: ['{address}，请让行囊远离嫩芽，我们带来的星种还在浅眠。', '门后的风没有惊动叶脉，这里应当懂得怎样接待林契旅人。', '鹿铃巡守一路护送我们到此，只求一处安静而洁净的席位。', '花粉会随情绪变色，若你看见金色，便是我们愿意留下。', '{self}来自百花议庭，想先确认厨房是否有无烟的料理。'],
    wait: ['苔藓已经记住三轮脚步，仍没有人来引座么？', '{address}，等待不是问题，让枝叶不知道要等多久才是。', '花粉从金色变成灰白了，请别让它继续黯下去。', '鹿铃声停了很久，安静若没有回应也会变成冷落。', '这段空候足够一株月芽开花，柜台却仍像冬枝。'],
    good: ['空气、器皿与声音都被照料得很好，像晨露落在新叶上。', '{address}尊重了我们的静默，也没有让热烟惊扰星种。', '花蜜的甜没有盖住菌菇鲜味，厨师懂得共生而非争夺。', '庭院没有折枝，桌边没有催促，这份分寸值得百花换冠。', '{self}会把这里写进深根记忆库，让下一季的旅人也知道。'],
    neutral: ['枝叶没有受伤，但空气里仍残留一点过重的烟气。', '服务尚算和谐，只是桌边声响比林冠规矩略急。', '味道平稳，却像还没等到季节真正转暖。', '洁净做到了，景观却少了一处能让花粉停留的角落。', '下次若把步子放轻些，林契会更愿意记住这里。'],
    bad: ['{address}，烟尘与怠慢留下的伤痕，比脚印更难从树皮上消去。', '有人折断活藤只为腾位置，这在森冠庭域不是小失误。', '污渍已经染上花粉，整桌人的情绪都被它拖进枯季。', '大声催促迁鹿旅团，只会让他们整夜保持警戒。', '{self}会把这次招待记作一次需要修复的林契破口。'],
    journey: ['我们护送一枚不会在本界发芽的星种，寻找愿意倾听它的土壤。', '深根记忆库丢失了一段焚林战争记录，线索指向异界机械藤蔓。', '灰枝会与新芽商会都派了观察员，想看旅店如何处理外来生态。', '迁鹿夜提前到来，鹿群却绕着位面门排成了从未见过的图案。', '蜜铃请{self}寻找一种不会伤害授粉者的异界甜味。'],
  },
  magma_ridge: {
    arrival: ['{address}，贫道自九洲借星门而来，可有清茶与一席热食？', '门外灵潮翻得厉害，先让同门把飞剑与行囊安置妥当。', '此地界膜稳固，想来店家的护门阵法颇有章法。', '在下奉仙朝度牒而行，劳烦安排一张能共坐论道的长桌。', '青丘使团不喜拘礼，只要别把狐火当成灶火便好。'],
    wait: ['{address}，修行人也讲究因果，这份等待总该有个说法。', '一炷香将尽，柜台仍无回音，莫非今日犯了闭口戒？', '同门可以静候，但灵茶凉透便失了待客之道。', '贫道的耐心尚在，身后小辈的辟谷功夫却不大可靠。', '若是人手不足，直言便可，含糊拖延反而结下坏因。'],
    good: ['{address}，火候、灵韵与待客之礼俱佳，此番没有白来。', '这道药膳不夺本味，丹修也挑不出相冲之处。', '同门同席、先后有序，店家深谙“和”字比排场更要紧。', '窗外星轨与茶中灵气相映，正宜把酒问道。', '{self}回宗后会把此处列入游历玉简，供后来弟子循门而至。'],
    neutral: ['{address}，尚可入口，只是离“妙”之一字仍差半分。', '礼数无错，灵韵略薄，像一炉尚未养足火候的丹。', '座次安排妥当，可惜同门的菜没能一齐上桌。', '此餐能果腹，却不足以让人停下参悟多看一眼。', '若下次少些浮华、多些本味，评价自会顺势而上。'],
    bad: ['{address}，灵石可以再赚，坏了待客因果却难补。', '妄报灵材、轻慢师门，这两桩事都不是一句赔礼能抹去。', '将同门拆席又临时毁约，店家是在拿因果当儿戏么？', '菜中灵气驳杂，器皿也未净，连散修驿站都不会如此。', '{self}不愿结怨，但今日这笔差评须写得明明白白。'],
    journey: ['贫道为寻一味修复断天门的异界灵材，沿云海追到此处。', '太虚剑宗与青丘妖庭要重订边境契约，在下先来探查中立席位。', '幽都司发现亡魂记忆里出现陌生星图，特命{self}跨界核验。', '陆百草的药方缺一味不受天劫影响的种子，百草谷指向这扇门。', '上元灯会有一盏灯逆着灵脉飞走，最后停在旅店屋檐上。'],
  },
  neon_ring: {
    arrival: ['接入完成。{address}，分配低延迟席位和一杯离线饮料。', '七码头节点认证通过；请显示排队长度、预计耗时和设备状态。', '本账号关闭了广告追踪，只接受真人服务与实体菜单。', '义体散热快到阈值了，先找有冷饮接口的位置。', '我们从镜屏区下班，今晚不谈绩效，只刷街机榜。'],
    wait: ['当前响应时间已越过服务协议上限，请返回故障码。', '{address}，队列不可见；不知道原因的等待比延迟本身更糟。', '本机已重连三次，服务端仍没有任何确认包。', '镜屏上的预计时间停在一分钟，现实已经过去了九分四十秒。', '若无人处理，请至少开放自助模式，别让整条队列继续掉帧。'],
    good: ['延迟低、反馈清楚、味觉数据漂亮，五星已写入。', '{address}把每个步骤都显示出来了，这种透明度值得订阅。', '天然食材是真的，不是高分辨率合成纹理；这趟值回带宽。', '街机无卡顿，饮料不串味，实体夜晚原来可以这么顺畅。', '{self}会把坐标发进七码头互助网，但不卖给九环董事会。'],
    neutral: ['流程能跑，但还没好到值得上传完整体验记录。', '设备在线，服务普通，整晚像默认参数没有调优。', '味觉数据合格，队列提示却晚了两个刷新周期。', '不是故障，只是缺少能让人主动续费的理由。', '把反馈速度再压低一点，下次评分或许能升到推荐区。'],
    bad: ['{address}，排队黑箱、出品掉帧，这单体验必须差评。', '设备故障还显示绿色状态，属于蓄意伪造可用率。', '天然食材标价，端来的却是最低档合成蛋白。', '本账号拒绝为三次重启和一次冷餐支付溢价。', '{self}会把完整日志镜像到街区网，别指望企业公关删掉。'],
    journey: ['我从七码头带来一块断网芯片，里面存着整条街被删除的凌晨。', '镜面协议委托我们寻找不依赖服务器存活的数据人格旅舍。', '老磁带说异界有真正的模拟音乐，便拿一盒母带换了路费。', '月轨电梯封锁后，我们借一条废弃物流隧道接上了位面门。', '这趟差旅要验证一颗苹果究竟能否比企业信用点更保值。'],
  },
  moonsea: {
    arrival: ['{address}，潮路平稳，鳍也未发干；请安排靠近清水的位置。', '沉月港的盐雾还在披肩上，先借一池温润水汽缓缓。', '幼鳍第一次离开海国，烦请不要让灯光直照他的眼睛。', '我们的潮囊余量不多，若要等待，请先给一壶净水。', '鲸歌领航会说这里听得见异界潮声，{self}想亲自验证。'],
    wait: ['这一等像退潮后搁浅，连鳍边的水汽都快散了。', '{address}，潮钟已经转过一格，可否告知还要停泊多久？', '泡语里最尴尬的声音，就是无人回应时破掉的气泡。', '水温在下降，陆栖客或许不觉，海国人却能立刻察觉。', '若队列继续不动，请让我们先回潮囊里缓一缓。'],
    good: ['鲜味像月潮一样层层回来，水温与湿度也恰到好处。', '{address}没有把鳍尾当奇观，这份自然比珍珠装饰更贵重。', '温泉换水及时，潮珠映不出半点杂质。', '盐柑的酸托住海味，像浮岛在月潮里稳稳升起。', '{self}会把这家店唱进下一段领航潮歌。'],
    neutral: ['潮面平稳，却没有留下让人记住的浪花。', '水质尚可，空气略干，鳍边一直有细小刺痛。', '鲜度过关，但盐与酸没有唱成同一段潮歌。', '服务没有冒犯，只是仍按陆栖习惯安排得太多。', '若能把湿度再抬一点，我们会愿意停泊更久。'],
    bad: ['{address}，这般干热与陈味，浅湾小店也不会端出。', '温泉水面已有旧沫，净水修会看见会当场封池。', '拿鳍尾开玩笑不是热情，是海国明确写进法典的失礼。', '食材失鲜还用重盐遮掩，连幼鳍都骗不过。', '{self}必须把这次污染风险报告给鲸歌领航会。'],
    journey: ['我们追着一枚逆流潮汐珠，从沉月港一路漂到这里。', '失踪鲸群在星门另一侧留下歌声，领航会派我们循声而来。', '洁潮修女怀疑珊瑚瘟疫来自异界炼金废水，{self}负责取样。', '浮岛议会要寻找不受月相影响的新航路，这家旅店是第一站。', '无鳍船长偷走王庭潮图后，把真正的坐标藏进一碗盐柑汤。'],
  },
  evernight: {
    arrival: ['夜还很长，{address}不必催促；先替我们留一盏柔暗的灯。', '请收起正对门口的强光，有名亡者也需要一点体面。', '这瓶百年窖酒只在无钟墓园开过一次，今晚或许有第二次。', '影幕街散场后总要找地方坐坐，最好还能听见真正的沉默。', '{self}带来一封黑蜡邀请函，收件人却写着旅店的旧名字。'],
    wait: ['我见过王朝腐朽，倒很少见柜台比王朝更慢。', '{address}，长生者不怕等待，但不代表喜欢被遗忘。', '黑蜡已经滴完一圈，仍没有人来问我们的名字。', '无钟墓园从不报时，可这里的沉默连亡者都觉得太长。', '请别用“马上”敷衍；我们对这个词的尺度与你们不同。'],
    good: ['{address}，灯影温柔，酒也懂得沉默，这一夜值得记住。', '杯沿没有照出刺眼反光，侍者显然懂夜行者的习惯。', '影戏散场后的空白被这顿饭接得很好，没有一句多余催促。', '陈酿里仍保留酿酒人的名字，这比年份更难得。', '{self}愿从记忆匣里留下一段好梦，作为额外小费。'],
    neutral: ['尚能消磨长夜，只是百年后未必还会想起。', '酒有年份，灯却太亮，气氛被切成了两段。', '服务礼貌，却像墓志最后一行那样过分工整。', '这里没有冒犯亡者，也没有真正理解他们。', '若下次少问寿数、多听名字，评价会更体面。'],
    bad: ['如此粗率的招待，连沉睡亡者都要被气醒。', '{address}直问寿数又把灯照到脸上，两项夜契一并违背。', '拿遗忘症当笑话的人，不配替客人保存任何订单。', '百年窖酒被兑成甜水，这比打碎墓碑还令人难堪。', '{self}会把这晚刻进墓志，免得后来者再犯同样错误。'],
    journey: ['我替故人寻找一段遗失记忆，沿无钟长街走入了星门。', '墓园议会发现一块写着未来死者姓名的异界石碑。', '影戏团丢了最后一幕，演员们说结局逃进了别的世界。', '守名修会委托{self}寻找一种不会随岁月褪色的墨。', '绯月昨夜短暂照出黎明，所有影子都指向这家旅店。'],
  },
  honey_sky: {
    arrival: ['愿永昼照见彼此的礼数，{address}，劳烦安排观景席位。', '星帆已经收束，请按云港礼序先安置长者与护羽侍从。', '我们带来晨钟岛的蜜酿，愿以一杯交换此界的黄昏消息。', '初次停泊贵店，{self}谨代表羽桥花园致以日轮祝词。', '请确认窗面无尘；对浮岛来客而言，景观也是席面的一部分。'],
    wait: ['迎送之礼迟了一拍，愿后续不要继续失序。', '{address}，云帆已经完成两次调向，我们仍未收到席位回应。', '祝词不能无限延长，沉默会让正式来访变成尴尬候场。', '羽桥礼法允许等待，却要求每一阶段都得到清楚致意。', '若观景席尚未整理，请直言，我们可以先在星槎台等候。'],
    good: ['礼数、甜香与景致彼此成全，足以写进云港评鉴。', '{address}准确叫出了使团席次，这份功课比金线装饰更耀眼。', '日轮甜点轻得像云，却没有牺牲蜂蜜真正的层次。', '窗面、庭院与桌边仪态都无可挑剔，羽翼终于舒展开了。', '{self}愿在晨钟议会上提名这里承办下一次云海庆典。'],
    neutral: ['仪节无错，却少了一点让羽翼舒展的用心。', '称谓准确，景窗却蒙着薄尘，完整礼序因此缺了一环。', '甜点端正得像范本，也平淡得像礼仪课的第一章。', '服务顺序没有出错，但每一步都像只为了通过检查。', '若下次能让仪式更自然，我们会留下更高评鉴。'],
    bad: ['{address}，若连基本迎送都省去，再明亮的景色也会黯淡。', '打断祝词、弄错席次、让观景窗蒙尘，三重失礼已经足够。', '星帆使团被拆成两桌，这在云港等同公开降格。', '甜点上的羽纹只是装饰，里面却用了失香蜂蜜。', '{self}必须向礼仪庭提交原文记录，无法替贵店修饰。'],
    journey: ['我们的星帆追逐一束陌生暮光；永昼之地把黄昏视作珍宝。', '一座浮岛突然失去影子，星图绘师发现它投影在异界。', '礼仪庭想评定多元旅店能否接待百岛共同使团。', '晨钟连续敲出不存在的第十三声，声音落点正是星门。', '蜜酿师托{self}寻找一种只在夜里开花的异界花蜜。'],
  },
  iron_hive: {
    arrival: ['报到。{address}，远征编队申请热食、净水与六小时休整。', '第九边疆护航队抵达，伤员优先，装备箱请放在视线内。', '舰壳外层还带着燃烬星域的灰，允许我们先做除尘处理。', '配给契约编号已核验；本舰人员不浪费食物，也不接受虚报库存。', '{self}来自余火难民环，只需要一张不会被炮火震动的床。'],
    wait: ['补给延误正在削弱整队状态，请立即报告原因。', '{address}，给出明确预计时间；军团不接受“很快”这种单位。', '伤员生命指标稳定，但队伍耐心正按分钟下降。', '后勤链一旦失声，前线就会开始猜测最坏情况。', '我们经历过静默裂隙，不想在一间旅店重演通讯中断。'],
    good: ['配给扎实，设备可靠；这份休整足以让人重返前线。', '{address}先照顾伤员再核对账目，顺序完全正确。', '热食没有偷减份量，净水检测也一次通过。', '维修台、床铺与撤离通道都标得清楚，军团会记住这种可靠。', '{self}代表护航队确认：这里可列入优先补给坐标。'],
    neutral: ['达到生存标准，但还不足以列入军团优先补给点。', '食物够热，流程偏慢，若在前线会造成不必要损耗。', '设备可以使用，却没有展示维护记录，可信度只能算中等。', '床铺安全，净水普通，整次休整没有额外恢复价值。', '把状态汇报做得更清楚，下次我们会提高评级。'],
    bad: ['{address}，浪费时间与口粮等同资敌，这份记录会原样上报。', '隐瞒设备故障导致伤员二次转移，这是严重后勤失职。', '拿战争创伤取乐的人，不应接近任何远征编队。', '配给标足量、实物却短缺，军团会把它视为蓄意侵占。', '{self}拒绝在此继续休整，并要求保留全部故障日志。'],
    journey: ['我们护送最后一船难民穿过静默裂隙，舰壳仍覆着燃烬灰。', '赫卡特铸造卫星需要不会被亚空间污染的异界合金样本。', '第九军团的航标连续指向旅店，仿佛这里是失落补给站。', '自由舰长带来一份阵亡名单，希望在没有炮声的地方念完。', '王座星域的星火正在减弱，{self}奉命寻找新的稳定航线。'],
  },
  mask_realm: {
    arrival: ['帷幕升起——{address}，请给今日的陌生人一个精彩座位。', '本演员戴的是旅行面具，不必追问台下姓名。', '巡演剧团已经在门外候场，先给领唱者一杯润喉甜酒。', '今晚的观众似乎是桌椅与星光，那我们更不能敷衍开场。', '{self}偷来一张无主面具，它坚持要坐在最显眼的位置。'],
    wait: ['空场太久，观众会用脚投票，演员也会。', '{address}，沉默不是悬念；没有铺垫的停顿只是忘词。', '后台机关都换过两轮布景了，带位人还没登场。', '倒彩巷的慢戏也不敢让客人等到第三次幕铃。', '若这是即兴考验，请至少给我们一个能接住的提示。'],
    good: ['好！火候接住了气氛，服务也没有念错一句台词。', '{address}让每位客人都有登场感，这才叫完整的一幕。', '变脸甜酒在舌尖换了三次表情，谢幕仍收得干净。', '侍者接住玩笑却没有拆穿面具，机敏与分寸都在。', '{self}愿把今晚的掌声留在这里，供下一场演出使用。'],
    neutral: ['戏能看，酒能喝，可惜谢幕时不会有人起立。', '台词都对，节奏太平，高潮像被留在了后台。', '服务没有冷场，也没有真正把观众拉进故事。', '面具被尊重了，但席面缺少一记漂亮的转场。', '下次若敢多一点即兴，我们或许会真正喝彩。'],
    bad: ['{address}，这场招待唯一精彩之处，就是它终于结束了。', '当众拆穿面具身份，是千面戏国最廉价也最恶毒的桥段。', '冷菜、冷场、冷脸，三幕悲剧却没有一幕值得看。', '把巡演剧团拆席，等同在合唱高潮时割断舞台。', '{self}会把这次倒彩写进新剧，至少让失败产生一点价值。'],
    journey: ['我偷走一张没有主人的面具，它却一路指向这家旅店。', '红幕王街失去了一整晚掌声，喝彩官怀疑声音逃进了异界。', '巡演团寻找一段能让所有种族同时发笑的新剧目。', '幕后城流传着一本会改写演员身份的空白剧本。', '全国最差的戏忽然在十二世界卖座，{self}奉命追查观众是谁。'],
  },
  inverted_dreamsea: {
    arrival: ['{address}，请把座位放在不会向上坠落的地方，影子有些晕船。', '我们从鲸梦里醒来三次，门牌每次都写着同一家旅店。', '这瓶潮声怕光，却喜欢听菜单，能让它也坐在桌边么？', '楼梯若通向昨天请提前说，{self}今天不想再见一次自己。', '倒雨还粘在鞋底，放着别擦，它可能待会儿会自己回天上。'],
    wait: ['我们等了三次明天，怎么现在仍是刚才？', '{address}，是时间睡着了，还是带位人忘了醒来？', '影子已经先去吃饭，身体却还停在柜台前。', '瓶中潮声数到第七次退潮，座位仍没有出现。', '再等一会儿也可以，只要告诉我这一会儿属于哪一天。'],
    good: ['味道先在梦里开花，醒来后才落到舌尖——很好。', '{address}没有纠正我们的物理常识，这份礼貌非常清醒。', '温泉向下流，气泡却向上唱歌，一切都恰到好处地不合理。', '甜味有蓝色回声，怪味则长出一轮柔软小月亮。', '{self}愿把这段体验装进瓶子，留给还没发生的下次来访。'],
    neutral: ['一切都太合理了，反倒让人怀疑哪里出了错。', '水是水、菜是菜、椅子也只会坐着，今晚平淡得像醒着。', '梦泡没有破，惊喜也没有来，时间在桌边打了个盹。', '服务顺利得缺少回声，离开后可能只剩一片空白。', '若下次允许菜单先做梦，我们也许会多点一道。'],
    bad: ['{address}，这份失望如此普通，连噩梦都不肯收留。', '你坚持只有一种现实，于是把整桌客人都说成了错误。', '倒雨被拖布擦掉后再也没回天空，这不是清洁，是事故。', '瓶装潮声被当成废水倒掉，沉睡灯塔会为它守丧。', '{self}想把差评退回昨天，可昨天也拒绝接收。'],
    journey: ['我从鲸的梦里捞出瓶装潮声，它说真正的海在门另一边。', '沉睡灯塔醒来后忘了自己是塔，拜托我们寻找新的身份。', '倒雨码头收到一艘从未来返航、却没有乘客记忆的船。', '软月湾每晚少一块月亮，缺口拼起来正是旅店轮廓。', '明天的{self}托今天的我来这里，取走昨天寄存的梦。'],
  },
  ash_dragoncourt: {
    arrival: ['{address}，报上最好的席位与陈酿，龙庭看得懂真正品质。', '鳞纹印玺已经验明身份，请按正式使团席次安排。', '龙焰会让普通酒杯开裂，先确认器皿配得上这瓶陈酿。', '珍矿鉴定师不需要奉承，只需要货真价实的出品。', '{self}从黑金长阶而来，愿为无可挑剔的宴席支付高价。'],
    wait: ['让贵客久候，是任何账目都无法粉饰的失礼。', '{address}，龙庭的耐心不是无限信用额度。', '印玺已经冷却，说明这段等待超过了正式礼序。', '矮炉领完成一柄长剑都比这张桌子准备得快。', '若席位尚未达到标准，直言重做胜过继续遮掩。'],
    good: ['价格配得上火候，器皿也没有辱没龙庭纹章。', '{address}没有用浮夸装饰掩盖材料，判断很成熟。', '陈酿经得住龙焰余温，杯底仍保留完整层次。', '席次、温度与出品顺序皆无错，监察官可以收起笔了。', '{self}愿用珍矿结账，因为这顿宴席确实有对应价值。'],
    neutral: ['不算怠慢，却还不值得动用珍矿支付。', '材料真实，处理普通，像一块尚未开刃的好钢。', '席次无误，但出品缺少能让龙庭记住的锋芒。', '价格勉强成立，赞美却还需要更多证据。', '下次若能把火候再逼近极限，评价会更有分量。'],
    bad: ['{address}，平庸却敢标高价，比冒犯血统更缺乏胆量。', '用镀金器皿冒充黑金，鉴定师一眼便能看穿。', '正式席位被随意调换，这不是疏忽，是公开轻慢。', '陈酿兑水又隐瞒年份，契约家族会追究到底。', '{self}会把账单留下，把龙庭的信任全部带走。'],
    journey: ['我奉命寻找能承受龙焰的新合金，也顺路评定万界宴席。', '余烬王宴缺一道从未有人完成的料理，监察院把线索交给我们。', '一枚鳞纹印玺拒绝承认新主人，却在星门前自行发亮。', '焦冠谷的龙骨山脉传出异界锻锤声，矮炉领派人循声而来。', '黑金宫城要重订跨界契约，{self}先来衡量旅店是否够格作证。'],
  },
  timeless_bazaar: {
    arrival: ['{address}，我们从三个昨日和一个明早赶来，账请记在现在。', '这张摊位券明天才生效，但昨天已经盖章，应该能换一张桌吧？', '请先确认你使用哪一纪元的礼法，免得双方都显得失礼。', '同行者来自不同年代，菜单最好别只写一种货币算法。', '{self}此刻是时间商贩，结账时可能会变成你祖父的导游。'],
    wait: ['再等下去，这顿饭的价格要按下个纪元结算了。', '{address}，队列刚从未来绕回来，说前面仍然是我们自己。', '停摆怀表走了一格，说明这里至少浪费了两种时间。', '昨日棚市已经打烊，明日廊却还没开席，现在到底归谁管？', '请给一个不会随年代改写的等待时间，哪怕它不太准确。'],
    good: ['这份体验在七条时间线上都保持了好味道。', '{address}先问年代再定礼数，避开了三场本可发生的争执。', '古法炖汤配未来餐具居然成立，悖论修补师也挑不出裂缝。', '账目同时接受铜币、信用点与尚未发行的券，十分专业。', '{self}会把好评寄往昨天，让它及时出现在你开店之前。'],
    neutral: ['此刻尚可，换个年代也许会更合适。', '服务适配了服装，却没适配客人的时代习惯。', '味道没有问题，只是在未来已经显得有些过时。', '账算对了，时机却错了半个季节，评价只能停在中间。', '若下次先确认我们来自何时，许多小尴尬都不会发生。'],
    bad: ['{address}，我要把这次消费退回发生之前。', '把未来礼法强加给古代旅人，足以制造一条新的战争时间线。', '菜单价格在结账时跳了三个年代，这不是行情，是陷阱。', '追问悖论来源导致同行者短暂消失，服务责任不能一并消失。', '{self}已把差评卖给昨日棚市，你明早就会看见它。'],
    journey: ['我们在无时集市买下一段尚未发生的旅程，终点写着这里。', '零时十字街多出一条只在饭点出现的道路，尽头正是旅店。', '悖论修补师追踪一只从未来倒走回来的怀表，委托{self}随行。', '昨日棚市正在出售贵店明天才会丢失的家具，我们来核对来源。', '一名旅人声称参加过这里的五星庆典，可那场庆典尚未举办。'],
  },
};

function worldDialogues(id) {
  const voice = WORLD_DIALOGUE_VOICE[id];
  if (!voice) return { arrival: ['……'], wait: ['……'], good: ['……'], neutral: ['……'], bad: ['……'], journey: ['……'] };
  return Object.fromEntries(Object.entries(voice).map(([kind, lines]) => [kind, [...lines]]));
}

const WORLD_DETAILS = {
  hearth_coast: {
    identity: { environment: '七国海岸、白塔湖区、北境霜原与纵横群山的古代地下城', civilization: '诸王国、冒险者公会、晨辉教廷、法师塔和深路商盟共同维系的英雄时代', technology: '精良锻造、奥术工程、神术医护、驿路网络与可复用的遗迹技术' },
    culture: { values: ['契约', '勇气', '同伴'], hospitalityIdeal: '热食及时、价格透明、冒险小队完整同席', taboos: ['拆散同行小队', '临时变价或含糊委托'], speechStyle: '直白坚毅，常用誓约、营火、道路与冒险作比', addressForms: { peer: '店主', formal: '掌柜阁下', elder: '年轻掌柜', notable: '旅店主人' }, selfReferences: ['在下', '我', '本队领路人'], socialStrata: ['自由冒险者', '王国契约民', '公会与教廷使者'] },
    visuals: { palette: ['银蓝', '羊皮金', '营火红'], clothingThemes: ['公会披肩', '轻甲与旅行斗篷', '七曜纹章'], portalEffect: '七曜符文、银蓝星火与短促号角' },
    groupPatterns: [{ type: '冒险小队', min: 2, max: 4, weight: 5 }, { type: '王国或公会使团', min: 1, max: 3, weight: 3 }],
    storyHooks: ['失落王室印玺同时出现在五座地下城', '白塔湖区的新星门连接着地图外的遗迹'],
  },
  verdant_court: {
    identity: { environment: '巨树冠层、苔光溪谷与季节变化的花园城市', civilization: '由精灵庭议、花妖聚落和林契共同治理的自然文明', technology: '生命魔法、植物建筑与精细药草学' },
    culture: { values: ['洁净', '克制', '共生'], hospitalityIdeal: '安静、清洁并尊重客人的私人空间', taboos: ['损伤活体植物', '让浓烟污染室内'], speechStyle: '委婉含蓄，偏爱季节和植物隐喻', addressForms: { peer: '枝外之友', formal: '护席人', elder: '新芽', notable: '守门之友' }, selfReferences: ['我', '此身', '林契旅人'], socialStrata: ['季节议席民', '林契客民', '迁徙授粉者'] },
    visuals: { palette: ['苔绿', '花白', '浅金'], clothingThemes: ['植物纤维', '叶片饰品', '轻薄长袍'], portalEffect: '绿金花粉与叶脉光纹' },
    groupPatterns: [{ type: '药草商队', min: 2, max: 3, weight: 4 }, { type: '巡礼学者', min: 1, max: 2, weight: 3 }],
    storyHooks: ['季节议会正在寻找失踪的种子使者', '机械藤蔓开始侵入会唱歌的树桥'],
  },
  magma_ridge: {
    identity: { environment: '九洲山河、灵脉云海、浮空仙山与幽冥边关', civilization: '仙朝治理凡俗、宗门传承道统、世家与散修争逐机缘的修行文明', technology: '丹器符阵、御剑飞行、洞天法宝与依境界运转的术法体系' },
    culture: { values: ['师承', '因果', '守诺'], hospitalityIdeal: '称谓得体、承诺分明、同门同席并以灵食清茶相待', taboos: ['妄称境界', '轻慢师门与山川正神', '无故毁约'], speechStyle: '含蓄古雅，依辈分称道友、前辈、小友或掌柜，常以因果与修行作比', addressForms: { peer: '道友', formal: '掌柜', elder: '小友', notable: '掌柜道友' }, selfReferences: ['贫道', '在下', '本座'], socialStrata: ['宗门门人', '仙朝籍民', '游方散修'] },
    visuals: { palette: ['玄青', '云白', '鎏金'], clothingThemes: ['交领法袍', '云纹佩饰', '宗门腰牌'], portalEffect: '灵气流光、符箓残影与短促剑鸣' },
    groupPatterns: [{ type: '同门游历团', min: 2, max: 4, weight: 5 }, { type: '游方散修', min: 1, max: 2, weight: 3 }],
    storyHooks: ['两宗弟子试图在旅店化解一桩秘境归属因果', '一味只在异界生长的灵材可能修复断裂天门'],
  },
  neon_ring: {
    identity: { environment: '环形巨城、悬浮轨道与永不熄灭的商业夜景', civilization: '企业城区、机械社群和虫巢公寓并存的高速都市', technology: '高度信息化、义体机械与稳定能量网络' },
    culture: { values: ['效率', '透明', '新奇'], hospitalityIdeal: '队列清楚、响应迅速、娱乐设备随时可用', taboos: ['隐藏等待进度', '设备报错却无人处理'], speechStyle: '短句、数字化表达，评价直奔效率指标', addressForms: { peer: '店主', formal: '节点管理员', elder: '新接入者', notable: '主节点管理员' }, selfReferences: ['我', '本账号', '本机'], socialStrata: ['企业公民', '街区合同工', '无证节点居民'] },
    visuals: { palette: ['电青', '霓虹紫', '深蓝'], clothingThemes: ['发光缝线', '城市夹克', '接口饰件'], portalEffect: '像素噪点与环形扫描线' },
    groupPatterns: [{ type: '下班搭子', min: 2, max: 4, weight: 5 }, { type: '高速差旅客', min: 1, max: 1, weight: 3 }],
    storyHooks: ['环城排行榜突然出现来自旅店的未知高分', '一段失控广告开始预告尚未发生的菜单'],
  },
  moonsea: {
    identity: { environment: '月光海沟、珊瑚浮岛与潮汐驱动的水下城市', civilization: '海国宫廷、鱼人港邦与史莱姆浮群组成的水域国家', technology: '潮汐工程、水下炼金与声呐魔法' },
    culture: { values: ['洁净水质', '鲜味', '流动'], hospitalityIdeal: '清水常换、温度稳定、海味新鲜', taboos: ['嘲笑鳍尾', '让水域居民久处干热环境'], speechStyle: '语气舒缓，常以潮涨潮落衡量事情', addressForms: { peer: '潮外朋友', formal: '岸上掌柜', elder: '小浪花', notable: '潮门主人' }, selfReferences: ['我', '本鳍', '潮路来客'], socialStrata: ['王庭鳍族', '航路公民', '浮岛客民'] },
    visuals: { palette: ['月白', '海蓝', '珊瑚粉'], clothingThemes: ['防水薄纱', '珍珠扣', '波纹披肩'], portalEffect: '悬浮水珠与月轮涟漪' },
    groupPatterns: [{ type: '潮路船员', min: 2, max: 4, weight: 4 }, { type: '深潜访客', min: 1, max: 2, weight: 3 }],
    storyHooks: ['沉月港的潮汐钟比现实慢了整整一天', '一枚珍珠保存着失踪航船最后的歌声'],
  },
  evernight: {
    identity: { environment: '永恒夜色、墓园街区与绯月照耀的古老城邦', civilization: '亡灵公会、吸血鬼旧族和幽影剧团共同维持的夜行都市', technology: '记忆术、影像魔法与保存完好的古代工艺' },
    culture: { values: ['时间', '记忆', '体面'], hospitalityIdeal: '柔暗灯光、陈年饮品和不被催促的长夜', taboos: ['直问寿数', '用强光照射客人'], speechStyle: '古雅从容，玩笑通常冷而克制', addressForms: { peer: '夜间同伴', formal: '店主阁下', elder: '短生的小店主', notable: '此地主人' }, selfReferences: ['我', '本人', '这位有名者'], socialStrata: ['长生贵族', '有名亡者', '夜行市民'] },
    visuals: { palette: ['绯红', '夜黑', '旧银'], clothingThemes: ['古典礼服', '黑蜡饰物', '长披风'], portalEffect: '黑蜡烟雾与绯月剪影' },
    groupPatterns: [{ type: '夜宴宾客', min: 2, max: 4, weight: 4 }, { type: '记忆收藏家', min: 1, max: 1, weight: 3 }],
    storyHooks: ['一卷影戏记录了某位客人尚未经历的葬礼', '无钟墓园第一次响起了整点钟声'],
  },
  honey_sky: {
    identity: { environment: '永昼云海、蜜色浮岛与连接群岛的羽桥', civilization: '天使礼仪庭、星灵观测站和花妖园岛构成的空岛文明', technology: '风帆航行、星光魔法与精密礼仪工程' },
    culture: { values: ['礼仪', '景观', '和谐'], hospitalityIdeal: '称谓准确、迎送完整、视野与庭院保持洁净', taboos: ['打断祝词', '让公共景观蒙尘'], speechStyle: '正式优雅，习惯先致意再表达意见', addressForms: { peer: '同航者', formal: '司席阁下', elder: '初羽', notable: '旅店司席' }, selfReferences: ['我', '在下', '本席'], socialStrata: ['圣所家族', '云帆市民', '无岛旅民'] },
    visuals: { palette: ['蜜金', '云白', '天青'], clothingThemes: ['羽纹礼服', '金线披帛', '日轮饰品'], portalEffect: '金色云絮与羽毛光点' },
    groupPatterns: [{ type: '礼仪使团', min: 3, max: 4, weight: 4 }, { type: '星图巡礼者', min: 1, max: 2, weight: 3 }],
    storyHooks: ['一座浮岛正在失去自己的影子', '礼仪庭希望评定旅店能否接待云海庆典'],
  },
  iron_hive: {
    identity: { environment: '燃烧星域、王座世界、第九边疆、铸造卫星与被亚空间风暴切断的难民环', civilization: '军团教国、铸造世界、自由舰队和边疆聚落以纪律与牺牲维持最后航线', technology: '巨舰航行、重型铸造、灵能导航、军用义体与受严格配给约束的星际工业' },
    culture: { values: ['纪律', '牺牲', '可靠'], hospitalityIdeal: '伤员优先、热食净水充足、设备状态与撤离路线清楚', taboos: ['浪费配给或隐瞒故障', '拿阵亡者和战争创伤取乐'], speechStyle: '简短克制，习惯报告状态、编号、损耗与任务目标', addressForms: { peer: '补给同袍', formal: '后勤主管', elder: '年轻店主', notable: '补给站主管' }, selfReferences: ['本员', '本舰', '我'], socialStrata: ['军团现役', '铸造籍技师', '自由舰队契约员', '难民护航队'] },
    visuals: { palette: ['熔铁黑', '燃烬红', '军团灰'], clothingThemes: ['远征军服', '铸造护具', '舰队识别牌'], portalEffect: '猩红裂隙、舰船航迹与燃烧余烬' },
    groupPatterns: [{ type: '远征编队', min: 2, max: 4, weight: 5 }, { type: '难民护航队', min: 2, max: 4, weight: 3 }],
    storyHooks: ['静默裂隙吞没了整支补给舰队的航标', '燃烬王座正在寻找不受亚空间污染的新航线'],
  },
  mask_realm: {
    identity: { environment: '巨型舞台城市、红幕街道与昼夜不散的节庆灯火', civilization: '剧团、面具家族和喝彩议会构成的表演国家', technology: '幻术、舞台机关与情绪共鸣魔法' },
    culture: { values: ['戏剧性', '机敏', '场面'], hospitalityIdeal: '接住玩笑、制造高潮、让每位来客有登场感', taboos: ['当众拆穿面具身份', '让场面冷下来'], speechStyle: '夸张机锋，常像在向观众说台词', addressForms: { peer: '对戏人', formal: '今晚的主角', elder: '初登台的小演员', notable: '今夜的东道主' }, selfReferences: ['本演员', '我', '这张面具'], socialStrata: ['持面公民', '巡演艺人', '幕后无名者'] },
    visuals: { palette: ['幕布红', '亮金', '深紫'], clothingThemes: ['舞台礼装', '半脸面具', '夸张蝴蝶结'], portalEffect: '红幕拉开与纸屑喝彩' },
    groupPatterns: [{ type: '巡演剧团', min: 3, max: 4, weight: 5 }, { type: '蒙面看客', min: 1, max: 2, weight: 2 }],
    storyHooks: ['一张无名面具开始替佩戴者说出真话', '全国最差的剧本为何在每个世界都能卖座'],
  },
  inverted_dreamsea: {
    identity: { environment: '海洋悬于天空、梦境沉入地面、潮雨反向上升', civilization: '星灵梦港、史莱姆漂群和鱼人灯塔组成的松散梦境社会', technology: '梦境航行、感官炼金与不稳定星图学' },
    culture: { values: ['想象', '体验', '开放'], hospitalityIdeal: '允许反常、提供新奇体验、不粗暴纠正梦话', taboos: ['坚持唯一现实', '用平淡流程压制即兴'], speechStyle: '跳跃诗意，时间和主语经常互换', addressForms: { peer: '清醒者', formal: '守梦人', elder: '还没做完梦的孩子', notable: '门后的守梦人' }, selfReferences: ['我', '这场梦', '明天的我'], socialStrata: ['持梦居民', '潮声旅民', '醒岸访客'] },
    visuals: { palette: ['梦紫', '泡沫蓝', '月粉'], clothingThemes: ['漂浮薄纱', '液态饰品', '倒置星纹'], portalEffect: '向上坠落的雨滴与梦泡' },
    groupPatterns: [{ type: '拾梦同行者', min: 2, max: 4, weight: 4 }, { type: '迷航梦客', min: 1, max: 1, weight: 3 }],
    storyHooks: ['一场梦拒绝醒来并要求在旅店登记入住', '倒雨码头寄来一只装着明日潮声的瓶子'],
  },
  ash_dragoncourt: {
    identity: { environment: '灰烬高原、黑金宫城与龙火锻造山脉', civilization: '龙裔宫廷、矮人锻城与恶魔契约家族组成的贵胄体系', technology: '顶级锻造、契约魔法与龙火能源' },
    culture: { values: ['品质', '位阶', '承诺'], hospitalityIdeal: '昂贵但无可挑剔，席位与出品匹配身份', taboos: ['用平庸品冒充珍品', '混淆正式席位'], speechStyle: '高傲审慎，赞美稀少但分量很重', addressForms: { peer: '契约同席', formal: '店主阁下', elder: '年轻侍宴者', notable: '旅店主事' }, selfReferences: ['本席', '吾', '我'], socialStrata: ['龙庭贵胄', '锻城公民', '契约客卿'] },
    visuals: { palette: ['黑金', '余烬红', '龙骨白'], clothingThemes: ['宫廷长衣', '鳞纹金属', '契约印章'], portalEffect: '龙焰轮廓与灰烬王冠' },
    groupPatterns: [{ type: '龙庭使团', min: 3, max: 4, weight: 4 }, { type: '珍品鉴定师', min: 1, max: 2, weight: 3 }],
    storyHooks: ['一枚龙庭印玺拒绝承认它的新主人', '灰烬王宴缺少一道从未有人做出的料理'],
  },
  timeless_bazaar: {
    identity: { environment: '不同年代重叠的棚市、停摆街区与不断改写的十字路口', civilization: '所有种族和时代共同维持的时间贸易枢纽', technology: '从古代手工艺到未来科技同时存在，缺乏统一标准' },
    culture: { values: ['适应', '交易', '时机'], hospitalityIdeal: '先确认客人时代，再快速适配规则与需求', taboos: ['把未来礼法强加给古代客人', '追问悖论来源'], speechStyle: '混合多时代词汇，同一句话可能包含古语和未来缩写', addressForms: { peer: '同刻之人', formal: '当下的掌柜', elder: '后来者', notable: '此刻东道主' }, selfReferences: ['此刻的我', '在下', '本时间段'], socialStrata: ['持证时商', '纪元旅民', '失刻者'] },
    visuals: { palette: ['钟铜', '集市彩布', '时间蓝'], clothingThemes: ['多时代拼接', '怀表饰件', '旅行商披风'], portalEffect: '倒走钟针与多层街景残影' },
    groupPatterns: [{ type: '跨时代商团', min: 2, max: 4, weight: 5 }, { type: '迷时旅人', min: 1, max: 2, weight: 3 }],
    storyHooks: ['昨日棚市正在出售旅店明天才会丢失的家具', '一名客人声称自己已经参加过旅店的五星庆典'],
  },
};

function worldProfile(profile) {
  const detail = WORLD_DETAILS[profile.id];
  const population = profile.raceWeights.map(([raceId, weight], index) => ({ raceId, weight, role: index === 0 ? '主体居民' : index === 1 ? '常住居民' : '移民与商旅' }));
  const regions = profile.regions.map((name, index) => ({
    id: `${profile.id}_region_${index + 1}`, name,
    type: detail.identity.environment.split('、')[index % detail.identity.environment.split('、').length],
    traits: detail.culture.values.slice(0, 2),
    commonOccupations: [profile.occupations[index % profile.occupations.length], profile.occupations[(index + 1) % profile.occupations.length]],
  }));
  return {
    id: profile.id, name: profile.name, icon: profile.icon, unlockStars: profile.unlockStars,
    identity: { summary: profile.lore, ...detail.identity },
    population, regions,
    culture: { ...detail.culture, etiquette: profile.etiquette },
    hospitality: {
      wantWeights: profile.wantWeights,
      flavorLikes: profile.flavors,
      flavorDislikes: FLAVORS.map((flavor) => flavor.id).filter((id) => !profile.flavors.includes(id)).slice(0, 1),
      roomStyleLikes: profile.styles,
      servicePriorities: { hygiene: profile.modifiers.hygiene, etiquette: profile.modifiers.etiquette },
      dailyTrend: profile.id === 'timeless_bazaar',
    },
    travel: {
      occupations: profile.occupations, purposes: profile.purposes, groupPatterns: detail.groupPatterns,
      budgetMultiplier: profile.modifiers.budget, patienceMultiplier: profile.modifiers.patience,
    },
    visuals: { ...detail.visuals, appearanceThemes: profile.lookThemes },
    dialogue: worldDialogues(profile.id),
    storyHooks: detail.storyHooks,
    knowledge: {
      firstArrival: ['name', 'summary', 'etiquetteHint'], firstService: ['wantWeights', 'roomStyleLikes'],
      servedThree: ['flavorLikes', 'servicePriorities'], deepDiscovery: ['taboos', 'culture', 'storyHooks'],
    },
  };
}

/**
 * 十二个固定来源世界。raceWeights 使用 chargen.js 中稳定的种族序号；世界决定文化，
 * 种族只决定外观与生理特征，两者不再互相替代。所有数值修正均限制在 0.8–1.25。
 */
export const WORLD_PROFILES = [
  worldProfile({ id: 'hearth_coast', name: '艾泽普利斯', icon: '⚔', unlockStars: 0, raceWeights: [[0, 6], [16, 4], [1, 3], [3, 2]], lookThemes: ['ancient', 'magic'], wantWeights: { meal: 1.25, sleep: 1.18, drink: 1.08 }, flavors: ['umami', 'mellow'], styles: ['rustic', 'forge'], modifiers: { patience: 1.08, budget: 1, hygiene: .94, etiquette: 1 }, lore: '剑与魔法并存的群国大陆，王国、公会、教会与法师塔共同维持脆弱秩序，地下城和古代遗迹则不断吸引新的冒险者。', etiquette: '先上热食、说清价格并尽量让冒险小队同席；含糊契约和临时加价会被视为失信。', motifs: ['银冠王庭', '冒险者公会', '古代地下城', '七曜圣徽'], regions: ['银冠王都', '长桌公会城', '白塔湖区', '深路关隘', '北境霜堡', '圣杯平原'], occupations: ['冒险者', '公会接待员', '王国骑士', '法师学徒', '地下城向导', '圣所医师'], purposes: ['接受异界委托', '寻找新冒险路线', '护送王国货契', '研究位面魔法', '品尝异界料理'] }),
  worldProfile({ id: 'verdant_court', name: '森冠庭域', icon: '❧', unlockStars: 0, raceWeights: [[1, 6], [13, 4], [3, 2], [0, 1]], lookThemes: ['magic', 'ancient'], wantWeights: { meal: 1.08, stroll: 1.25, sleep: .9 }, flavors: ['sweet', 'umami'], styles: ['rustic', 'astral'], modifiers: { patience: 1.12, budget: .92, hygiene: 1.25, etiquette: 1.18 }, lore: '林冠城市与花灵聚落共享季节议会，安静、洁净和自然景观被视为待客礼仪。', etiquette: '保持清洁与轻声交谈；破坏植物或用浓烟熏染房间是大忌。', motifs: ['露叶长阶', '花蜜茶', '会唱歌的树桥', '种子信物'], regions: ['露叶长阶', '苔光谷', '百花议庭', '鹿铃林'], occupations: ['药草商', '树冠信使', '花粉画师', '林契学者'], purposes: ['交换稀有种子', '记录异界庭院', '寻找安静住处', '参加园艺巡礼'] }),
  worldProfile({ id: 'magma_ridge', name: '玄黄大世界', icon: '☯', unlockStars: 0, raceWeights: [[0, 5], [1, 3], [3, 3], [4, 2], [12, 2]], lookThemes: ['ancient', 'magic'], wantWeights: { meal: 1.2, stargaze: 1.16, brew: 1.12 }, flavors: ['umami', 'mellow'], styles: ['astral', 'rustic'], modifiers: { patience: 1.02, budget: 1.08, hygiene: 1.02, etiquette: 1.12 }, lore: '九洲仙朝、修行宗门、古老世家和妖庭围绕灵脉与飞升道路共存的修仙世界，凡俗秩序与长生追求彼此纠缠。', etiquette: '重视师承、因果和公开承诺；同门最好同席，妄称境界、轻慢山川正神或随意毁约都是大忌。', motifs: ['太虚剑宗', '大玄仙朝', '灵脉云海', '上元灯会'], regions: ['中州皇畿', '太虚剑山', '青丘妖庭', '北冥冰海', '南荒药谷', '幽都鬼关'], occupations: ['宗门弟子', '游方散修', '仙朝官吏', '炼丹师', '符箓商', '妖庭使者'], purposes: ['参加问道大会', '采购异界炼材', '追查秘境线索', '渡劫前暂住', '寻找失传功法'] }),
  worldProfile({ id: 'neon_ring', name: '霓虹环城', icon: '◆', unlockStars: 0, raceWeights: [[9, 5], [0, 4], [10, 3], [15, 1]], lookThemes: ['cyber'], wantWeights: { drink: 1.2, game: 1.25, meal: .95 }, flavors: ['sour', 'weird'], styles: ['neon'], modifiers: { patience: .8, budget: 1.08, hygiene: 1.04, etiquette: .9 }, lore: '永不熄灯的环形都市，居民习惯即时服务、清晰队列和高速娱乐。', etiquette: '效率就是礼貌；让客人看不见排队进度比等待本身更糟。', motifs: ['第七码头', '脉冲饮料', '磁悬街', '通行芯片'], regions: ['第七码头', '镜屏区', '蜂巢公寓', '零点商圈'], occupations: ['接口技师', '夜班速递员', '街机选手', '数据掮客'], purposes: ['刷新异界纪录', '采购旧时代零件', '体验无网夜晚', '寻找新饮品配方'] }),
  worldProfile({ id: 'moonsea', name: '月沉海国', icon: '≈', unlockStars: 1, raceWeights: [[11, 6], [8, 4], [0, 1], [12, 1]], lookThemes: ['magic'], wantWeights: { bath: 1.25, meal: 1.12, sleep: .92 }, flavors: ['umami', 'sour'], styles: ['frost', 'astral'], modifiers: { patience: 1.04, budget: .98, hygiene: 1.25, etiquette: 1.08 }, lore: '建在月光海沟与浮岛礁上的水域国家，对水质、鲜味和湿润环境极为讲究。', etiquette: '清水要勤换、海味要新鲜；嘲笑鳍尾或让客人久处干热环境是禁忌。', motifs: ['沉月港', '盐柑汤', '鲸骨回廊', '潮汐珠'], regions: ['沉月港', '蓝藻宫', '泡泡街', '珊瑚边城'], occupations: ['潮路领航员', '珊瑚医师', '珍珠税吏', '深潜厨师'], purposes: ['校准异界潮汐', '寻找洁净温泉', '交换海产食谱', '追踪失落月影'] }),
  worldProfile({ id: 'evernight', name: '永夜墓都', icon: '☾', unlockStars: 1, raceWeights: [[7, 5], [18, 4], [15, 3], [5, 1]], lookThemes: ['magic', 'ancient'], wantWeights: { drink: 1.25, show: 1.18, sleep: 1.12 }, flavors: ['mellow', 'weird'], styles: ['astral', 'frost'], modifiers: { patience: 1.18, budget: 1.1, hygiene: .94, etiquette: 1.12 }, lore: '长夜中的墓园都市，夜行居民以陈年酒、影戏与漫长住宿消磨不流动的时间。', etiquette: '勿催促、勿直问寿数；灯光柔暗、酒液陈醇会被视作尊重。', motifs: ['无钟墓园', '百年窖酒', '影幕街', '黑蜡邀请函'], regions: ['无钟墓园', '绯月区', '静棺坊', '影幕街'], occupations: ['墓志抄写员', '夜宴侍从', '记忆收藏家', '影戏演员'], purposes: ['寻找失传影卷', '品尝异界陈酒', '躲避百年宴会', '拜访故人后裔'] }),
  worldProfile({ id: 'honey_sky', name: '蜜昼浮岛', icon: '☀', unlockStars: 2, raceWeights: [[6, 5], [12, 4], [13, 3], [1, 1]], lookThemes: ['magic'], wantWeights: { stroll: 1.18, stargaze: 1.25, meal: 1.05 }, flavors: ['sweet', 'umami'], styles: ['astral', 'rustic'], modifiers: { patience: 1.16, budget: 1.12, hygiene: 1.12, etiquette: 1.25 }, lore: '漂浮在永昼云海上的礼仪文明，以甜点、景观和周到服务衡量一处停泊地。', etiquette: '迎送称谓与桌边礼数不可省；打断祝词或让景观蒙尘会严重失礼。', motifs: ['金蜜云港', '日轮甜点', '羽桥花园', '风帆祷签'], regions: ['金蜜云港', '羽桥花园', '晨钟岛', '星槎台'], occupations: ['云帆领航员', '礼仪官', '星图绘师', '蜜酿师'], purposes: ['观测陌生星座', '评鉴异界礼仪', '搜集花蜜', '参加云海巡游'] }),
  worldProfile({ id: 'iron_hive', name: '铁血燃烬', icon: '✠', unlockStars: 2, raceWeights: [[0, 4], [9, 4], [10, 3], [14, 2], [4, 1]], lookThemes: ['cyber', 'ancient'], wantWeights: { meal: 1.2, drink: 1.18, brew: 1.1, sleep: 1.08 }, flavors: ['spicy', 'mellow'], styles: ['forge', 'neon'], modifiers: { patience: .92, budget: 1.18, hygiene: 1.08, etiquette: 1.12 }, lore: '被亚空间风暴和永恒战争割裂的黑暗星海，军团教国、铸造世界、自由舰队与异形前线都在为文明存续付出高昂代价。', etiquette: '军衔、阵亡者姓名与配给契约必须受到尊重；浪费食物、隐瞒设施故障或拿战争创伤取乐会招致敌意。', motifs: ['燃烬王座', '第九军团', '铸造卫星', '裂隙信标'], regions: ['王座星域', '第九边疆', '赫卡特铸造卫星', '黑帆航道', '余火难民环', '静默裂隙'], occupations: ['边疆军人', '舰队补给官', '铸造技师', '灵能导航员', '战地医师', '自由舰长'], purposes: ['进行前线休整', '采购天然食材', '维护跨界设备', '护送难民', '调查裂隙异常'] }),
  worldProfile({ id: 'mask_realm', name: '千面戏国', icon: '♭', unlockStars: 3, raceWeights: [[5, 5], [3, 4], [15, 3], [0, 1]], lookThemes: ['magic', 'ancient'], wantWeights: { show: 1.25, drink: 1.15, play: 1.12 }, flavors: ['weird', 'sweet'], styles: ['neon', 'astral'], modifiers: { patience: .94, budget: 1.15, hygiene: .92, etiquette: 1.12 }, lore: '整座国度如同永不落幕的舞台，身份随面具更换，热闹和精彩比安静更珍贵。', etiquette: '要接住玩笑、给足场面；当众拆穿面具后的身份是最大的冒犯。', motifs: ['红幕王街', '变脸甜酒', '倒彩巷', '无名面具'], regions: ['红幕王街', '倒彩巷', '猫步台', '幕后城'], occupations: ['巡演艺人', '面具商', '喝彩官', '剧本盗贼'], purposes: ['寻找新剧目', '挑战酒桌传说', '物色异界演员', '逃离一场烂戏'] }),
  worldProfile({ id: 'inverted_dreamsea', name: '倒悬梦海', icon: '∿', unlockStars: 3, raceWeights: [[12, 5], [8, 4], [11, 3], [15, 1]], lookThemes: ['magic'], wantWeights: { stargaze: 1.18, brew: 1.2, bath: 1.15 }, flavors: ['sweet', 'weird'], styles: ['astral', 'frost'], modifiers: { patience: 1.2, budget: 1.02, hygiene: 1.02, etiquette: .96 }, lore: '海洋悬在天空、梦境会沉入地面的奇异世界，居民把反常体验视为旅途必需品。', etiquette: '别急着纠正梦话或物理常识；过度平淡比偶尔失误更令人失望。', motifs: ['倒雨码头', '梦糖', '沉睡灯塔', '瓶装潮声'], regions: ['倒雨码头', '沉睡灯塔', '软月湾', '鲸梦原'], occupations: ['拾梦人', '潮声装瓶师', '星灵潜水员', '漂浮牧者'], purposes: ['寻找醒不来的梦', '采集异界怪味', '校对颠倒星图', '泡一池向下的水'] }),
  worldProfile({ id: 'ash_dragoncourt', name: '灰烬龙庭', icon: '♛', unlockStars: 4, raceWeights: [[4, 5], [16, 4], [5, 3], [17, 1]], lookThemes: ['ancient', 'magic'], wantWeights: { meal: 1.22, drink: 1.2, brew: 1.05 }, flavors: ['spicy', 'mellow'], styles: ['forge'], modifiers: { patience: .9, budget: 1.25, hygiene: 1.05, etiquette: 1.18 }, lore: '龙族宫廷与锻城贵胄控制的高消费世界，愿意豪掷界币，也会苛刻审视每一道出品。', etiquette: '品质必须配得上价格；端上平庸菜品或混淆席位尊卑会招致冷评。', motifs: ['余烬王城', '龙焰陈酿', '黑金长阶', '鳞纹印玺'], regions: ['余烬王城', '黑金长阶', '矮炉领', '焦冠谷'], occupations: ['龙庭使者', '珍矿鉴定师', '宴席监察官', '恶魔契约师'], purposes: ['评定异界宴席', '采购传奇陈酿', '寻找炼金珍品', '巡视旧日封地'] }),
  worldProfile({ id: 'timeless_bazaar', name: '无时集市', icon: '∞', unlockStars: 4, raceWeights: Array.from({ length: 19 }, (_, i) => [i, 1]), lookThemes: ['cyber', 'ancient', 'magic'], wantWeights: { meal: 1.05, drink: 1.05, game: 1.05, stroll: 1.05, sleep: 1.05 }, flavors: ['weird', 'mellow'], styles: ['neon', 'astral', 'rustic'], modifiers: { patience: .9, budget: 1.25, hygiene: 1.05, etiquette: 1.02 }, lore: '所有时代与种族在此交汇，潮流每天变化，复杂需求与高额消费同时出现。', etiquette: '先确认客人所属时段再谈规矩；把未来习俗套给古代来客会闹出麻烦。', motifs: ['零时十字街', '明日特饮', '昨日棚市', '停摆怀表'], regions: ['零时十字街', '昨日棚市', '明日廊', '失刻巷'], occupations: ['时间商贩', '纪元导游', '悖论修补师', '跨界掮客'], purposes: ['追赶今日潮流', '寻找遗失年代', '倒卖未来食谱', '等待正确的昨天'] }),
].map(enrichFixedWorld);

export function allWorlds(customWorlds = []) {
  return [...WORLD_PROFILES, ...(Array.isArray(customWorlds) ? customWorlds.map((world) => normalizeCustomWorld(world, world.id)) : [])];
}

export function worldById(id, customWorlds = []) {
  return allWorlds(customWorlds).find((world) => world.id === id) || WORLD_PROFILES[0];
}

export function worldsForStars(stars) {
  return WORLD_PROFILES.filter((world) => world.unlockStars <= Math.max(0, Number(stars) || 0));
}

export const DISH_FUN = [
  { id: 'glow', name: '位面辉光', note: '菜品微微发光：售价 +25%，味道略升' },
  { id: 'huge', name: '巨无霸份量', note: '售价 +45%，厨艺要求 +8，烹饪耗时 ×1.3' },
  { id: 'prank', name: '整蛊料理', note: '出品质量随机 ±30%，评价两极分化' },
]         ;

export const SEASON_NAMES = ['星芽季', '炎环季', '雾潮季', '霜月季'];

export const DISHES         = [
  { id: 'stew', name: '虚空炖菜', ing: { grain: 1, veg: 2 }, price: 26, skill: 10, color: '#C2762F', drink: false, taste: 1.0, flavors: ['umami', 'mellow'] },
  { id: 'noodle', name: '多元面条', ing: { grain: 2, veg: 1 }, price: 30, skill: 20, color: '#E8C25A', drink: false, taste: 1.05, flavors: ['umami'] },
  { id: 'roast', name: '异兽烤肉', ing: { meat: 2, spice: 1 }, price: 52, skill: 35, color: '#A8542E', drink: false, taste: 1.15, flavors: ['spicy'] },
  { id: 'pie', name: '重力派', ing: { grain: 2, meat: 1, veg: 1 }, price: 48, skill: 30, color: '#D9A05B', drink: false, taste: 1.1, flavors: ['sweet'] },
  { id: 'soup', name: '恒星汤', ing: { veg: 2, ether: 1 }, price: 58, skill: 45, color: '#F3B84B', drink: false, taste: 1.2, flavors: ['umami'] },
  { id: 'slime', name: '黏液冻', ing: { veg: 1, ether: 1 }, price: 40, skill: 25, color: '#8DDB4A', drink: false, taste: 1.05, flavors: ['sweet', 'weird'] },
  { id: 'curry', name: '硫火咖喱', ing: { meat: 1, spice: 2, grain: 1 }, price: 62, skill: 55, color: '#E4732C', drink: false, taste: 1.25, flavors: ['spicy'] },
  { id: 'sushi', name: '深潜刺身', ing: { meat: 2, ether: 1 }, price: 70, skill: 65, color: '#E4737F', drink: false, taste: 1.3, flavors: ['umami'] },
  { id: 'ale', name: '木桶麦酒', ing: { grain: 1 }, price: 18, skill: 5, color: '#C98A2E', drink: true, taste: 1.0, flavors: ['mellow'] },
  { id: 'nebula', name: '星云特调', ing: { ether: 1, veg: 1 }, price: 44, skill: 35, color: '#E45AD1', drink: true, taste: 1.15, flavors: ['sour', 'sweet'] },
  { id: 'tea', name: '时间红茶', ing: { veg: 1, spice: 1 }, price: 28, skill: 20, color: '#B4542E', drink: true, taste: 1.05, flavors: ['mellow'] },
  { id: 'void', name: '虚空烈酒', ing: { ether: 2, spice: 1 }, price: 86, skill: 70, color: '#7A4BE0', drink: true, taste: 1.35, flavors: ['weird', 'mellow'] },
  { id: 'hearth_set', name: '旅人暖炉套餐', ing: { grain: 3, meat: 2, veg: 2 }, price: 96, skill: 48, color: '#D48A46', drink: false, taste: 1.28, flavors: ['umami', 'mellow'], school: '炉火家常', combo: true },
  { id: 'astral_set', name: '七星巡游宴', ing: { grain: 2, meat: 2, veg: 2, spice: 2, ether: 1 }, price: 148, skill: 72, color: '#8E78D8', drink: false, taste: 1.42, flavors: ['umami', 'weird'], school: '星海宴席', combo: true },
  { id: 'sprout_salad', name: '星芽脆叶盏', ing: { veg: 3, ether: 1 }, price: 68, skill: 42, color: '#8DDB4A', drink: false, taste: 1.25, flavors: ['sour', 'sweet'], school: '时令鲜食', seasons: [0] },
  { id: 'solar_skewer', name: '炎环炙肉串', ing: { meat: 3, spice: 2 }, price: 88, skill: 58, color: '#F06A32', drink: false, taste: 1.34, flavors: ['spicy', 'umami'], school: '烈焰烧烤', seasons: [1] },
  { id: 'mist_hotpot', name: '雾潮菌锅', ing: { veg: 3, meat: 1, spice: 1 }, price: 78, skill: 52, color: '#75A9A1', drink: false, taste: 1.3, flavors: ['umami', 'mellow'], school: '雾潮汤膳', seasons: [2] },
  { id: 'frost_cake', name: '霜月晶糕', ing: { grain: 2, veg: 1, ether: 1 }, price: 72, skill: 50, color: '#A9DFF2', drink: false, taste: 1.28, flavors: ['sweet'], school: '晶霜甜品', seasons: [3] },
  { id: 'neon_fizz', name: '霓虹跃迁汽泡', ing: { veg: 1, spice: 1, ether: 1 }, price: 56, skill: 45, color: '#39D7D2', drink: true, taste: 1.22, flavors: ['sour', 'weird'], school: '赛博调饮' },
  { id: 'moon_sake', name: '双月清酿', ing: { grain: 2, ether: 1 }, price: 64, skill: 52, color: '#C8C0F3', drink: true, taste: 1.27, flavors: ['mellow'], school: '古法酿造', seasons: [2, 3] },
  { id: 'spring_tea', name: '星芽晨露茶', ing: { veg: 2, spice: 1 }, price: 42, skill: 32, color: '#A6D96A', drink: true, taste: 1.16, flavors: ['mellow', 'sweet'], school: '时令茶席', seasons: [0] },
  { id: 'sun_punch', name: '炎环日珥宾治', ing: { veg: 1, spice: 2, ether: 1 }, price: 62, skill: 50, color: '#FF9358', drink: true, taste: 1.25, flavors: ['spicy', 'sour'], school: '赛博调饮', seasons: [1] },
];

export function dishById(id        )       {
  const d = DISHES.find((x) => x.id === id);
  if (!d) throw new Error('unknown dish ' + id);
  return d;
}

/** 招募广告：档位决定应聘者数值区间与人数，附加要求按倍率加价 */
;                                                                                                     
export const AD_TIERS           = [
  { id: 'flyer', name: '街角传单', cost: 90, lo: 8, hi: 52, note: '便宜量大，来的多是新手与怪人' },
  { id: 'gazette', name: '万界日报', cost: 260, lo: 28, hi: 74, note: '中坚水平，偶尔有能手投简历' },
  { id: 'headhunt', name: '猎头引荐', cost: 640, lo: 48, hi: 94, note: '数值高、日薪也高，开局慎用' },
];
/** 附加要求的加价倍率（越挑越贵） */
export const AD_REQ_MULT = { race: 1.35, sex: 1.15, bias: 1.45 };

export const SKILL_KEYS = ['looks', 'cook', 'mix', 'serve', 'clean', 'carry', 'calm']         ;
                                                 
export const SKILL_LABEL                           = {
  looks: '颜值', cook: '厨艺', mix: '调酒', serve: '服务', clean: '清洁', carry: '搬运', calm: '冷静',
};

export const JOBS = ['front', 'greeter', 'server', 'cook', 'bartender', 'attendant', 'cleaner', 'porter', 'free']         ;
/** 《缺氧》式职责分类：岗位是自动模板，自定义模式则逐项设为 0–4。 */
export const DUTIES = ['front', 'service', 'cook', 'mix', 'facility', 'clean', 'carry']         ;
export const DUTY_LABEL                         = {
  front: '接待', service: '桌边服务', cook: '烹饪', mix: '调酒', facility: '设施服务', clean: '清洁', carry: '搬运',
};
                                      
export const JOB_LABEL                      = {
  front: '前台', greeter: '迎宾', server: '服务', cook: '厨师', bartender: '调酒', attendant: '场务', cleaner: '清洁', porter: '搬运', free: '机动',
};
export const JOB_COLOR                      = {
  front: 0xffd6e0, greeter: 0xf3b84b, server: 0x39d7d2, cook: 0xff6b5a, bartender: 0xe45ad1, attendant: 0x9b7be8, cleaner: 0x8ddb4a, porter: 0xb0b6c2, free: 0xffe6b0,
};

export const TRAITS = [
  { id: 'diligent', name: '勤恳', note: '体力消耗 -20%' },
  { id: 'lazy', name: '懒散', note: '移动速度 -12%' },
  { id: 'cheerful', name: '开朗', note: '士气恢复更快，服务评价 +' },
  { id: 'grumpy', name: '暴躁', note: '压力增长更快' },
  { id: 'perfectionist', name: '完美主义', note: '出品更好但更慢' },
  { id: 'fast', name: '手脚快', note: '操作速度 +15%' },
  { id: 'clean_freak', name: '洁癖', note: '清洁效率 +25%' },
  { id: 'gourmet', name: '老饕', note: '厨艺成长更快' },
  { id: 'stoic', name: '沉稳', note: '事件检定 +10' },
  { id: 'clumsy', name: '毛手毛脚', note: '偶尔打翻餐具' },
  { id: 'sociable', name: '热心肠', note: '迎宾评价更高，爱找同事聊天' },
  { id: 'aloof', name: '独来独往', note: '闲聊关系增长减半' },
  { id: 'chatty', name: '话痨', note: '打烊后更爱串门聊天' },
  { id: 'quiet', name: '寡言', note: '打烊后很少主动聊天' },
  { id: 'frugal', name: '精打细算', note: '日薪 -12%' },
  { id: 'stubborn', name: '固执', note: '压力下降更慢' },
  { id: 'patient', name: '耐心', note: '营业中压力增长 -15%' },
  { id: 'ambitious', name: '上进', note: '全部技能经验 +20%' },
  { id: 'careful', name: '谨慎', note: '不会因毛手毛脚打翻餐具' },
  { id: 'empathetic', name: '体贴', note: '同事闲聊关系增长 +25%' },
  { id: 'competitive', name: '好胜', note: '高抢单优先级时操作速度 +8%' },
  { id: 'creative', name: '有灵感', note: '烹饪与调酒出品质量提高' },
  { id: 'organized', name: '条理分明', note: '搬运与清洁效率 +10%' },
  { id: 'resilient', name: '坚韧', note: '收盘时额外降低 8 点压力' },
  { id: 'decisive', name: '果断', note: '自动规划抢单优先级时获得加分' },
  { id: 'easygoing', name: '随和', note: '与同事闲聊时争吵概率降低' },
];

/** 性格相性表：两人性格两两查表求和（同性格另有加减），正值合得来、负值犯冲 */
export const TRAIT_CHEM                             = [
  ['diligent', 'lazy', -2], ['perfectionist', 'clumsy', -2], ['grumpy', 'cheerful', -2],
  ['clean_freak', 'clumsy', -1.5], ['chatty', 'quiet', -1.5], ['aloof', 'sociable', -1.5],
  ['stubborn', 'fast', -1], ['frugal', 'sociable', -1],
  ['diligent', 'perfectionist', 2], ['cheerful', 'sociable', 2],
  ['chatty', 'sociable', 1.5], ['gourmet', 'cheerful', 1.5], ['clean_freak', 'perfectionist', 1.5],
  ['stoic', 'diligent', 1.5], ['quiet', 'aloof', 1.5], ['fast', 'diligent', 1], ['stubborn', 'perfectionist', 1],
  ['patient', 'grumpy', -1.5], ['ambitious', 'lazy', -2], ['careful', 'clumsy', -2],
  ['empathetic', 'aloof', -1.5], ['competitive', 'easygoing', -1], ['creative', 'perfectionist', -1],
  ['organized', 'clumsy', -2], ['decisive', 'stubborn', -1.5], ['easygoing', 'grumpy', -2], ['competitive', 'quiet', -1],
  ['patient', 'quiet', 1.5], ['patient', 'stoic', 2], ['ambitious', 'diligent', 2], ['ambitious', 'competitive', 1.5],
  ['careful', 'perfectionist', 2], ['careful', 'organized', 1.5], ['empathetic', 'sociable', 2], ['empathetic', 'cheerful', 1.5],
  ['competitive', 'fast', 1.5], ['creative', 'gourmet', 1.5], ['creative', 'cheerful', 1], ['organized', 'diligent', 1.5],
  ['resilient', 'stoic', 2], ['resilient', 'stubborn', 1], ['decisive', 'fast', 1.5], ['decisive', 'diligent', 1],
  ['easygoing', 'cheerful', 2], ['easygoing', 'empathetic', 1.5],
];
/** 同性格加减：负面性格同类相斥，其余同类相亲 */
export const TRAIT_SAME                         = { grumpy: -1, lazy: -1, stubborn: -1, aloof: -1, clumsy: -1, competitive: -1, decisive: -1 };

const NAME_A = ['泽', '缪', '卡', '瓦', '洛', '希', '塔', '努', '格', '伊', '扎', '梅', '桑', '柯', '维', '露', '奥', '巴'];
const NAME_B = ['尔', '兰', '斯', '娅', '格', '恩', '洛', '克', '莎', '姆', '瑞', '拉', '德', '菲', '塔', '希'];
const NAME_C = ['·星屑', '·长夜', '·三号', '·断链', '·薄雾', '·九环', '·锈铁', '·晨露', '', '', '', ''];

export function makeName(rng                                                                )         {
  return NAME_A[rng.int(NAME_A.length)] + NAME_B[rng.int(NAME_B.length)] + (rng.chance(0.35) ? NAME_C[rng.int(NAME_C.length)] : '');
}

export const STAR_THRESHOLDS = [0, 60, 180, 380, 660, 1000];
export const STAR_CERTIFICATIONS = Object.freeze([
  null,
  { served: 6, avgScore: 3.0, description: '单日接待 6 人，平均评价达到 3.0★' },
  { served: 10, avgScore: 3.2, requireDrinkOrStay: true, description: '单日接待 10 人、评价 3.2★，并完成饮品或住宿消费' },
  { served: 14, avgScore: 3.5, specialTypes: 1, maxLost: 2, description: '单日接待 14 人、评价 3.5★，完成一种特殊设施服务，流失不超过 2 组' },
  { served: 18, avgScore: 3.8, specialTypes: 2, minFacilityCompletion: 0.8, description: '单日接待 18 人、评价 3.8★，两种特殊设施产生消费，设施服务完成率达到 80%' },
  { served: 22, avgScore: 4.1, specialTypes: 3, maxLost: 0, requireNoOpenChallenges: true, description: '单日接待 22 人、评价 4.1★，三种特殊设施产生消费，无客人流失或未解决事故' },
]);
export function starsOf(rep        )         {
  let s = 0;
  for (let i = 1; i < STAR_THRESHOLDS.length; i++) if (rep >= STAR_THRESHOLDS[i]) s = i;
  return s;
}

// ---------- 事件牌 ----------
;                       
                             
                           
                                        
                                
                                 
                                 
                                                              
                           
                                 
                                   
                             
  

;                          
                                                                              
                                                              
  
;                                                                                                                                     

export const EVENTS              = [
  {
    id: 'dragon_inspect', title: '微型龙卫生审查', kind: 'accident',
    text: '一条巴掌大的龙叼着夹板飞进门厅：“我闻到三处违规的味道，现在开始计时。”',
    choices: [
      { label: '全员放下手头活去擦地', note: '所有房间清洁 +18，客人耐心 -8', ok: (c) => { c.cleanAll(18); c.patienceAll(-8); return '龙满意地打了个响指：勉强合格。'; } },
      { label: '让最冷静的员工陪审查', note: '冷静检定', skill: 'calm', base: 45, ok: (c) => { c.rep(28); return '员工把龙聊到忘了检查，声望 +28。'; }, fail: (c) => { c.coins(-180); c.rep(-14); return '龙开出罚单：界币 -180，声望 -14。'; } },
      { label: '直接塞钱', note: '界币 -260，声望 +4', cost: 260, ok: (c) => { c.rep(4); return '龙把纸币吞了，飞走时打了个火嗝。'; } },
    ],
  },
  {
    id: 'twin_critic', title: '分身评论家', kind: 'guest',
    text: '一位评论家同时以两个身体入场，坚持要在两张桌子上吃同一顿饭。',
    choices: [
      { label: '给他两桌，全力接待', note: '若座位充裕声望 +26，否则 -10', ok: (c) => { c.rep(26); c.stressAll(8); return '两份评价都写了好话，声望 +26。'; } },
      { label: '请他合并成一个人', note: '服务检定', skill: 'serve', base: 50, ok: (c) => { c.rep(16); return '他被说服了，还夸酒馆懂多元礼节，声望 +16。'; }, fail: (c) => { c.rep(-18); return '“歧视分身！”当场发帖，声望 -18。'; } },
    ],
  },
  {
    id: 'antigrav', title: '反重力泄漏', kind: 'accident',
    text: '厨房上方的位面接缝漏了，没固定的餐具开始向天花板漂。',
    choices: [
      { label: '关掉那片区域，手动压住餐具', note: '客人耐心 -12，脏污 +3', ok: (c) => { c.patienceAll(-12); c.spawnDirt(3); return '盘子落回来了，摔碎了几个。'; } },
      { label: '让搬运最好的员工去修接缝', note: '搬运检定', skill: 'carry', base: 48, ok: (c) => { c.rep(12); return '接缝被压回去，客人鼓掌，声望 +12。'; }, fail: (c) => { c.coins(-140); c.spawnDirt(5); return '整托盘飞上天，界币 -140，一地狼藉。'; } },
    ],
  },
  {
    id: 'slime_wedding', title: '史莱姆婚宴', kind: 'guest',
    text: '一对史莱姆新人临时决定在你家办婚礼，随行 12 位亲戚已经堵住了洗涤槽。',
    choices: [
      { label: '接单，包场', note: '界币 +520，脏污 +6，压力 +12', ok: (c) => { c.coins(520); c.spawnDirt(6); c.stressAll(12); return '婚礼办完了，地板黏得能拉丝。界币 +520。'; } },
      { label: '婉拒，只送一杯喜酒', note: '声望 +8，无收入', ok: (c) => { c.rep(8); return '新人理解地走了，还留下好评，声望 +8。'; } },
    ],
  },
  {
    id: 'future_self', title: '未来的自己', kind: 'guest',
    text: '一个和你一模一样的人坐下来点了全部菜单，然后说要赊账。',
    choices: [
      { label: '给账，相信自己', note: '50% 明日 +700，否则 -300', skill: 'calm', base: 50, ok: (c) => { c.coins(700); return '他真的从口袋里掏出了明天的钱，界币 +700。'; }, fail: (c) => { c.coins(-300); return '他消失了，账单留在桌上。界币 -300。'; } },
      { label: '要求先付款', note: '界币 +180，声望 -6', ok: (c) => { c.coins(180); c.rep(-6); return '他嘟囔着付了钱：“难怪以后生意做不大。”'; } },
    ],
  },
  {
    id: 'spice_run', title: '香料商队', kind: 'accident',
    text: '一支迷路的商队想用香料换个歇脚的位置。',
    choices: [
      { label: '换 20 份香料', note: '界币 -60，香料 +20', cost: 60, ok: (c) => { c.stock('spice', 20); return '香料入库，厨房闻起来像节日。'; } },
      { label: '换 8 份以太', note: '界币 -120，以太 +8', cost: 120, ok: (c) => { c.stock('ether', 8); return '以太瓶在架子上轻轻发亮。'; } },
      { label: '免费让他们歇脚', note: '声望 +12，员工压力 +6', ok: (c) => { c.rep(12); c.stressAll(6); return '商队把酒馆写进了星图，声望 +12。'; } },
    ],
  },
  {
    id: 'kitchen_fire', title: '灶台窜火', kind: 'accident',
    text: '一口锅里的东西开始自己往上爬，火苗贴着抽风口窜。',
    choices: [
      { label: '厨艺最好的员工强行压锅', note: '厨艺检定', skill: 'cook', base: 52, ok: (c) => { c.rep(10); return '火被压住，客人以为是表演，声望 +10。'; }, fail: (c) => { c.coins(-220); c.spawnDirt(4); c.stressAll(10); return '灶台需要修，界币 -220。'; } },
      { label: '直接盖灭，损失食材', note: '肉类 -6，香料 -4', ok: (c) => { c.stock('meat', -6); c.stock('spice', -4); return '火灭了，那锅东西被扔进虚空。'; } },
    ],
  },
  {
    id: 'landlord', title: '位面房东巡视', kind: 'milestone',
    text: '房东踩着走廊的地板缝出现：“租界维护费，我想涨一点。”',
    choices: [
      { label: '按他说的付', note: '界币 -300，声望 +6', cost: 300, ok: (c) => { c.rep(6); return '他心情不错，顺手修好了两处漏缝。'; } },
      { label: '谈判', note: '冷静检定', skill: 'calm', base: 48, ok: (c) => { c.coins(60); c.rep(6); return '谈成了减免，界币 +60。'; }, fail: (c) => { c.coins(-420); return '他加了滞纳金，界币 -420。'; } },
      { label: '拖着不给', note: '声望 -12，员工士气 -10', ok: (c) => { c.rep(-12); c.moraleAll(-10); return '房东在门口贴了封条警告。'; } },
    ],
  },
  {
    id: 'moon_market', title: '月背流动市场', kind: 'guest',
    text: '一辆挂满月尘铃铛的货车停在门厅外，只营业到下一次眨眼。',
    choices: [
      { label: '抢购基础食材箱', note: '界币 -140，谷物/蔬果各 +24', cost: 140, ok: (c) => { c.stock('grain', 24); c.stock('veg', 24); return '箱子落地时还带着月面的低重力。'; } },
      { label: '买一匣稀有以太', note: '界币 -220，以太 +16', cost: 220, ok: (c) => { c.stock('ether', 16); return '以太像一群萤火虫一样钻进储物瓶。'; } },
      { label: '替市场做本地向导', note: '服务检定', skill: 'serve', base: 46, ok: (c) => { c.coins(180); c.rep(10); return '商贩顺利开张，付了向导费，界币 +180、声望 +10。'; }, fail: (c) => { c.stressAll(8); return '市场绕了三圈才找到出口，全员压力 +8。'; } },
    ],
  },
  {
    id: 'mirror_union', title: '镜像员工来访', kind: 'milestone',
    text: '镜子里走出一支和员工们一模一样的班组，声称要检查“跨位面劳动条件”。',
    choices: [
      { label: '公开工资与休息安排', note: '员工士气 +12，声望 +8', ok: (c) => { c.moraleAll(12); c.rep(8); return '镜像班组认可了排班，员工们也安心了。'; } },
      { label: '请最冷静的人谈判', note: '冷静检定', skill: 'calm', base: 50, ok: (c) => { c.moraleAll(8); c.coins(120); return '谈判变成经验交流，还收到一笔咨询费。'; }, fail: (c) => { c.moraleAll(-10); c.rep(-8); return '谈判破裂，镜子上留下了一张公开信。'; } },
      { label: '把镜子蒙起来', note: '员工压力 +10', ok: (c) => { c.stressAll(10); return '访客消失了，但员工们一整天都避着那面镜子。'; } },
    ],
  },
  {
    id: 'time_tax', title: '时间税务员', kind: 'accident',
    text: '一名倒着走路的税务员宣布：酒馆刚才多用了七分钟，必须补缴时间税。',
    choices: [
      { label: '照单缴纳', note: '界币 -190', cost: 190, ok: () => '他盖下一个明天才会出现的印章。' },
      { label: '查他的时间执照', note: '冷静检定', skill: 'calm', base: 54, ok: (c) => { c.rep(14); return '执照早已过期，围观客人纷纷叫好，声望 +14。'; }, fail: (c) => { c.coins(-280); return '条款越查越多，最后补缴界币 -280。'; } },
      { label: '用一顿饭抵税', note: '谷物 -5、肉类 -3', ok: (c) => { c.stock('grain', -5); c.stock('meat', -3); return '税务员吃完后把那七分钟退回来了。'; } },
    ],
  },
  {
    id: 'singing_spores', title: '会唱歌的孢子', kind: 'accident',
    text: '一团发光孢子从客人的斗篷里飘出，每落到一处灰尘上就开始合唱。',
    choices: [
      { label: '趁它们唱歌彻底清扫', note: '清洁检定', skill: 'clean', base: 44, ok: (c) => { c.cleanAll(24); c.rep(8); return '歌声和灰尘一起消失，房间清洁 +24、声望 +8。'; }, fail: (c) => { c.spawnDirt(5); return '扫帚把孢子扇得到处都是，新增脏污 5 处。'; } },
      { label: '把合唱当作现场演出', note: '声望 +16，客人耐心 -6', ok: (c) => { c.rep(16); c.patienceAll(-6); return '演出很成功，只是等餐客人有点不耐烦。'; } },
    ],
  },
  {
    id: 'royal_incognito', title: '微服的无名王', kind: 'guest',
    text: '一位披旧斗篷的客人要求“像普通人一样”被接待，身后的护卫却把门厅挤得水泄不通。',
    choices: [
      { label: '完全按普通客人接待', note: '服务检定', skill: 'serve', base: 52, ok: (c) => { c.coins(360); c.rep(20); return '他终于体验到普通晚餐，留下丰厚小费和王室推荐。'; }, fail: (c) => { c.rep(-12); return '护卫认为服务怠慢，声望 -12。'; } },
      { label: '清场摆出王室规格', note: '客人耐心 -14，声望 +10', ok: (c) => { c.patienceAll(-14); c.rep(10); return '排场足够体面，但其他客人等得直敲桌子。'; } },
      { label: '坦白本店没有特殊待遇', note: '声望 +8', ok: (c) => { c.rep(8); return '无名王反而笑了：“这才叫普通。”'; } },
    ],
  },
  {
    id: 'portal_blackout', title: '传送门熄火', kind: 'accident',
    text: '门厅的位面门突然熄灭，几名客人的半截行李还留在另一个世界。',
    choices: [
      { label: '让搬运高手手摇重启', note: '搬运检定', skill: 'carry', base: 50, ok: (c) => { c.rep(12); return '传送门重新点亮，行李一件不少。'; }, fail: (c) => { c.coins(-180); c.stressAll(8); return '重启震坏了门框，维修费 -180。'; } },
      { label: '安抚所有滞留客人', note: '服务检定', skill: 'serve', base: 48, ok: (c) => { c.rep(18); return '客人把停电当成了特别活动，声望 +18。'; }, fail: (c) => { c.patienceAll(-16); return '解释越多越混乱，所有客人耐心 -16。'; } },
      { label: '紧急购买备用星核', note: '界币 -260', cost: 260, ok: () => '备用星核接上后，门厅恢复了稳定的嗡鸣。' },
    ],
  },
  {
    id: 'ingredient_revolt', title: '食材集体请愿', kind: 'accident',
    text: '储藏室里的蔬菜排成一列，要求在被下锅前至少听完一首告别曲。',
    choices: [
      { label: '让厨师设计一首短曲', note: '厨艺检定', skill: 'cook', base: 47, ok: (c) => { c.rep(12); c.stock('veg', 8); return '蔬菜满意地回到货架，还叫来了八位亲戚。'; }, fail: (c) => { c.stock('veg', -12); return '曲子太难听，十二份蔬菜连夜出逃。'; } },
      { label: '认真听完它们的诉求', note: '员工压力 +6，声望 +10', ok: (c) => { c.stressAll(6); c.rep(10); return '谈话很长，但酒馆获得了“友善厨房”称号。'; } },
      { label: '立刻关上储藏室门', note: '蔬果 -8', ok: (c) => { c.stock('veg', -8); return '请愿被压下去了，库存也少了八份。'; } },
    ],
  },
  {
    id: 'lost_constellation', title: '迷路的星座', kind: 'guest',
    text: '一小片星座从星象台方向游进酒馆，躲在灯光下不肯回到夜空。',
    choices: [
      { label: '请冷静的员工为它指路', note: '冷静检定', skill: 'calm', base: 42, ok: (c) => { c.rep(22); return '星座升空时在招牌上多停了一会，声望 +22。'; }, fail: (c) => { c.spawnDirt(3); return '星尘落得到处都是，新增脏污 3 处。'; } },
      { label: '留下当一晚装饰', note: '声望 +14，员工压力 +5', ok: (c) => { c.rep(14); c.stressAll(5); return '客人拍了一整晚照片，员工则忙着接住掉落的星星。'; } },
      { label: '用以太诱导它离开', note: '以太 -5，声望 +8', ok: (c) => { c.stock('ether', -5); c.rep(8); return '星座追着以太光点回到了天空。'; } },
    ],
  },
];
