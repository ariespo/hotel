// 静态数据表：房间蓝图 / 家具 / 菜谱 / 性格 / 姓名 / 事件牌
                                                                                    
                                                                                     
                                         

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

export const JOBS = ['front', 'greeter', 'server', 'cook', 'bartender', 'cleaner', 'porter', 'free']         ;
/** 《缺氧》式职责分类：岗位是自动模板，自定义模式则逐项设为 0–4。 */
export const DUTIES = ['front', 'service', 'cook', 'mix', 'clean', 'carry']         ;
export const DUTY_LABEL                         = {
  front: '接待', service: '桌边服务', cook: '烹饪', mix: '调酒', clean: '清洁', carry: '搬运',
};
                                      
export const JOB_LABEL                      = {
  front: '前台', greeter: '迎宾', server: '服务', cook: '厨师', bartender: '调酒', cleaner: '清洁', porter: '搬运', free: '机动',
};
export const JOB_COLOR                      = {
  front: 0xffd6e0, greeter: 0xf3b84b, server: 0x39d7d2, cook: 0xff6b5a, bartender: 0xe45ad1, cleaner: 0x8ddb4a, porter: 0xb0b6c2, free: 0xffe6b0,
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
