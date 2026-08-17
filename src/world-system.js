import { WORLD_NOTABLE_RACES } from './world-identities.js';

const clamp = (value, min = .85, max = 1.2) => Math.max(min, Math.min(max, Number(value) || 1));
const named = (rows = []) => rows.map((row, index) => {
  if (typeof row === 'object') return { id: row.id || `entry_${index + 1}`, ...row };
  const [name, detail = ''] = String(row).split('｜');
  return { id: `entry_${index + 1}`, name, detail };
});

const COMMON = {
  cosmology: '世界由稳定物质层、精神映照层与可供位面门锚定的界膜共同构成。',
  naturalLaws: '当地超自然力量必须支付资源、时间、记忆或身体负荷之一，无法无代价地改写现实。',
  powerSystem: '力量存在清晰层级和社会约束，个体强者不能绕过组织、供给与环境长期行动。',
  deathRule: '死亡会留下可识别的社会与精神后果，复生即使可行也不是廉价的日常服务。',
};

const make = (data) => ({
  genre: data.genre,
  tagline: data.tagline,
  cosmology: { ...COMMON, ...data.cosmology },
  society: data.society,
  history: named(data.history),
  factions: named(data.factions),
  economy: {
    currency: data.economy.currency,
    industries: data.economy.industries,
    exports: data.economy.exports,
    imports: data.economy.imports,
    labor: data.economy.labor,
    prices: Object.fromEntries(Object.entries(data.economy.prices || {}).map(([key, value]) => [key, clamp(value)])),
  },
  notableCharacters: named(data.notableCharacters).map((character, index) => ({ ...character, visitor: index < 3 })),
  environmentRule: data.environmentRule,
  localRules: named(data.localRules).map((rule, index) => ({ ...rule, effects: index === 0 ? { etiquette: 1.06 } : index === 1 ? { patience: 1.06 } : { budget: 1.06 } })),
  festivals: named(data.festivals).map((festival, index) => ({ ...festival, effects: index ? { patience: 1.05 } : { budget: 1.08 } })),
  recommendedFacilities: data.recommendedFacilities,
  conflicts: data.conflicts,
  atmosphere: data.atmosphere,
});

export const WORLD_ENCYCLOPEDIA = Object.freeze({
  hearth_coast: make({
    genre: '英雄奇幻', tagline: '剑与契约维系诸王国，冒险者用脚步丈量未知。',
    cosmology: { cosmology: '主大陆环抱破碎星海，神祇、元素界与幽暗地域通过古代门扉相连。', powerSystem: '奥术、神术、血脉与武技并存；高阶施法需要学派、圣所或昂贵媒介支持。' },
    society: { government: '王国、自由城与冒险者公会形成相互制衡的封建联盟', languages: ['通用语', '精灵语', '矮人铭文'], classes: ['贵族与教士', '行会市民', '自由冒险者', '领民'], faith: '七曜诸神与地方守护灵并存', family: '家族、师徒与冒险小队都可成为法律承认的共同体', education: '教会学校、公会学徒制与法师塔教育', clothing: '羊毛斗篷、皮甲、公会徽章和礼仪长袍', cuisine: '炖肉、黑麦面包、香草奶酪与麦酒' },
    history: ['龙陨纪｜古龙战争塑造大陆山脉，也留下第一批地下城。','七冠盟约｜七个王国签订共同道路与商旅保护法。','白塔分裂｜奥术学派因禁术争议分裂为五座法师塔。','北境兽潮｜冒险者公会从雇佣组织成长为跨国力量。','圣杯饥荒｜教会开放粮仓，获得独立于王权的司法权。','星门复燃｜沉寂千年的异界门重新运转，多元旅店由此落脚。'],
    factions: ['银冠王庭｜维护王国秩序并试图控制星门税。','长桌公会｜管理委托、冒险者评级和跨国救援。','五塔议会｜争夺奥术解释权，表面合作而内部竞争。','晨辉教廷｜提供治疗与教育，也严查危险异界信仰。','深路商盟｜矮人、地精与人类共同经营地下贸易。'],
    economy: { currency: '王冠金币与公会信用券', industries: ['农业', '锻造', '魔法卷轴', '冒险服务'], exports: ['钢铁器具', '治疗药剂', '地下城遗物'], imports: ['异界香料', '以太晶体'], labor: '领地租佃、城市行会和自由佣兵并行', prices: { grain: .88, veg: .95, meat: 1, spice: 1.1, ether: 1.12 } },
    notableCharacters: ['伊蕾娜·白鹿｜游历五国的银冠骑士，正在追查失踪的王室印玺。','格罗姆·铜砧｜深路商盟的矮人谈判家，以绝不欠账闻名。','弥赛尔七指｜长桌公会传奇向导，声称每座地下城都有后门。','阿斯特拉院长｜五塔议会最年轻的席位持有者。','无旗圣女洛莎｜拒绝任何国家册封的巡回治疗者。','“鸦账本”｜从未露面的情报贩子，其账册能动摇王位。'],
    environmentRule: { name: '公会信誉', detail: '服务稳定会提升当地客耐心；严重失误更容易形成公开评价。', effects: { patience: 1.06, budget: 1 } },
    localRules: ['明码契约｜菜单价格与等待状态越清楚，服务评价越稳定。','小队同席｜同行客人不愿被拆散，完整接待团队可提高小费。','圣日节制｜当日饮品需求略降，热食与住宿需求上升。'],
    festivals: ['冒险者归旗日｜冒险小队集中到访，餐食和住宿需求上升。','七曜巡礼｜教士和朝圣者来访，更重视卫生与礼仪。'],
    recommendedFacilities: ['dining', 'guestroom', 'bar'], conflicts: ['王权试图垄断星门税', '旧地下城正在出现不属于本世界的生态'],
    atmosphere: { sky: ['#182845', '#6b5b72'], tint: '#f0c878', particle: '金色符文尘', weather: '远山云层与偶尔掠过的飞龙剪影', horizon: '城堡、法师塔与高架石桥', sound: '远钟、风旗和低沉号角' },
  }),
  verdant_court: make({
    genre: '生态神话', tagline: '城市生长在树冠上，法律由季节与万物共同表决。',
    cosmology: { cosmology: '世界树根系贯穿物质与灵界，梦、记忆和季节沿树液循环。', naturalLaws: '生命魔法只能引导已有生机；强迫生长会在别处形成等量枯萎。' },
    society: { government: '季节议会与古树仲裁庭共同治理', languages: ['叶语', '花粉手语', '通用语'], classes: ['守林家族', '授粉行会', '迁徙居民', '林契客民'], faith: '敬奉生命循环而非人格神', family: '血缘家庭与共同养育林地并重', education: '导师带领幼者记录一整轮季节', clothing: '活藤编织、花瓣披肩和无染布料', cuisine: '果蜜、菌菇、嫩叶、坚果与低火慢炖' },
    history: ['初芽纪｜第一棵会说话的古树唤醒林海。','焚林战争｜外来矿业城邦烧毁西部林冠。','根盟誓约｜精灵、花妖与人类共同签下林契。','无声之冬｜世界树休眠三十年，文明转入地下根城。','百花议庭｜不同物种首次获得独立席位。','星种降临｜异界种子带来新生态，也引发检疫争论。'],
    factions: ['百花议庭｜代表开花种族与园艺聚落。','鹿铃巡守｜维护林间道路和生态边界。','深根记忆库｜古树保管历史与契约。','新芽商会｜主张积极引进异界物种。','灰枝会｜认为文明扩张已经超过森林承载力。'],
    economy: { currency: '叶契与可验证的劳动时', industries: ['药草', '园艺', '活体建筑', '香料'], exports: ['药草', '种子', '天然织物'], imports: ['金属工具', '盐', '耐火材料'], labor: '社区轮值与专业行会并行', prices: { grain: .95, veg: .85, meat: 1.18, spice: .96, ether: 1.05 } },
    notableCharacters: ['赛芙琳·九叶｜百花议庭最年轻的季节发言人。','老鹿角阿岚｜走过所有树桥的巡守队长。','苔书先生｜将记忆写进苔藓的无性古树学者。','蜜铃｜以甜点调停政治争端的花妖厨师。','灰枝母｜生态保守派的精神领袖。','乌木客｜来自被焚林地的沉默复仇者。'],
    environmentRule: { name: '林冠呼吸', detail: '洁净和安静能稳定客人情绪，脏污积累会更快影响评分。', effects: { hygiene: 1.16, patience: 1.04 } },
    localRules: ['护芽礼｜植物与庭院保持完好时，设施评价提高。','轻声时段｜高噪声设施收益略降，住宿与庭院收益提高。','无烟日｜清洁完成率影响所有当地客评价。'],
    festivals: ['百花换冠｜庭院与甜味料理需求大增。','迁鹿夜｜成群旅客需要住宿并偏好安静服务。'],
    recommendedFacilities: ['garden', 'guestroom', 'onsen'], conflicts: ['是否开放异界物种贸易', '世界树根部出现未知枯萎'],
    atmosphere: { sky: ['#173a36', '#8bbf77'], tint: '#bde6a0', particle: '花粉与萤光孢子', weather: '叶影、薄雾和远处树冠摆动', horizon: '巨树、藤桥和悬挂村落', sound: '叶涛、木铃和远鸟' },
  }),
  magma_ridge: make({
    genre: '东方修仙', tagline: '仙朝定人间秩序，宗门争灵脉与飞升之路。',
    cosmology: { cosmology: '玄黄天地分九洲、三十三天与幽冥轮回，灵气循地脉潮汐运行。', naturalLaws: '术法必须遵守灵根、境界、因果与天劫；越阶行事会积累真实代价。', powerSystem: '炼体、练气、筑基、金丹、元婴至渡劫层层递进，功法与资源决定上限。', deathRule: '元神可暂存或转世，但夺舍、招魂和复生都受天道因果与仙朝律令约束。' },
    society: { government: '大玄仙朝治理凡俗，宗门联盟掌握高阶修行资源', languages: ['玄黄官话', '古篆', '神识传音'], classes: ['仙朝宗室', '宗门修士', '世家与散修', '凡民'], faith: '敬天道、祖师、山川正神与城隍', family: '宗族血脉和师门传承同样重要', education: '私塾启蒙、道院测灵根、宗门分峰授业', clothing: '交领长衫、法袍、云纹护臂和储物佩饰', cuisine: '灵米、药膳、山珍、剑炉烤肉与花露酒' },
    history: ['开天遗纪｜上古大能划分九洲并镇压混沌海。','百宗立道｜修行法门公开传播，第一批宗门建立。','仙朝一统｜凡俗王朝取得城隍与地脉的管理权。','断天门之乱｜飞升通道被毁，高阶修士滞留人间。','妖庭和议｜人族宗门与妖族诸山签订边境契约。','灵潮复苏｜星门带来陌生灵气，旧功法开始产生变异。'],
    factions: ['大玄仙朝｜管理人口、税赋、城隍与跨洲商路。','太虚剑宗｜以斩因果剑法闻名的正道大宗。','万宝楼｜跨宗门经营丹药、法器和情报。','青丘妖庭｜维护妖族山川领地与古老盟约。','散修盟｜争取灵脉、秘境和教育不被大宗垄断。','幽都司｜监管魂魄、邪术和非法复生。'],
    economy: { currency: '凡俗铜银、灵石与宗门功勋', industries: ['灵植', '炼丹', '炼器', '符箓', '秘境探索'], exports: ['灵米', '丹药', '符纸', '法器'], imports: ['异界金属', '奇异生物样本'], labor: '凡俗租佃、宗门任务与契约散修并存', prices: { grain: .9, veg: .92, meat: 1.04, spice: .88, ether: 1.14 } },
    notableCharacters: ['谢无咎｜断天门后第一位公开挑战飞升旧制的剑修。','姬玄策｜大玄仙朝年轻国师，试图把灵脉纳入公共管理。','狐九娘｜青丘妖庭使者，擅长把外交谈成酒局。','陆百草｜拒绝为权贵独占丹方的游方医修。','钟离铁衣｜万宝楼首席炼器师，认为异界机械也是法器。','无名渡客｜每次天劫前都会出现，却无人记得其面容。'],
    environmentRule: { name: '灵潮', detail: '以太采购较贵，但炼金、观星和高品质出品更容易获得额外关注。', effects: { spectacle: 1.12, budget: 1.04 } },
    localRules: ['因果有价｜清楚兑现服务承诺可提高评价，临时毁约惩罚更重。','同门雅集｜团体完整入座与上菜可获得额外小费。','斋戒令｜当日素食需求提高，肉类需求温和下降。'],
    festivals: ['问道大会｜宗门弟子集中到访，餐食、住宿和挑战事件增加。','上元灯会｜庭院、观星和甜味饮品需求上升。'],
    recommendedFacilities: ['dining', 'observatory', 'alchemy'], conflicts: ['飞升资源被大宗门垄断', '异界灵气正在改写本土修行体系'],
    atmosphere: { sky: ['#142d47', '#7f75aa'], tint: '#d6c69a', particle: '灵气流光与符箓残影', weather: '云海、远峰和御剑者剪影', horizon: '仙山、浮峰与仙朝城阙', sound: '风铃、古琴与远处剑鸣' },
  }),
  neon_ring: make({
    genre: '赛博朋克', tagline: '城市永不熄灯，身份、记忆与时间都标有价格。',
    cosmology: { cosmology: '环形都市箍住行星赤道，上层公司城与下层雨巷叠在同一夜色里。', naturalLaws: '义体要电、要保养、要零件；权限卡打不开的门，黑客也只能绕，不能空手改现实。', powerSystem: '公司编制、街头义体、黑市渠道和舆论爆料构成四种硬实力。' },
    society: { government: '企业董事会控制上层城区，码头互助会和街区自治撑着下层', languages: ['环城通语', '码头黑话', '企业公文'], classes: ['企业编制', '合同工', '无证街民', '义体浪人'], faith: '有人信公司能把人升级，有人只信热食和没被收回的义体', family: '合同家庭、合租室友与巷口互助比对血缘更常见', education: '企业定向学院、夜校和地下师徒店', clothing: '挡雨外套、发光接口、义体遮罩和旧皮靴', cuisine: '合成蛋白、巷口热面、酸味饮料和贵到离谱的真菜' },
    history: ['第一次断网｜全球网络崩溃促成环城独立。','九企合并｜巨型企业瓜分城市基础设施。','人格法案｜部分数据人格取得有限公民权。','红雨暴动｜下层街区反抗氧气与水价垄断。','月轨战争｜企业安保争夺轨道电梯控制权。','星门上市｜跨界旅行被包装成最高端消费产品。'],
    factions: ['九环董事会｜控制能源、交通与主网络。','七码头互助会｜为无证居民提供医疗和庇护。','镜面协议｜主张数据人格完整权利。','零点骇客群｜公开企业隐秘但动机复杂。','实体珍藏局｜垄断天然食物与旧时代物件。'],
    economy: { currency: '企业信用点与离线实体券', industries: ['义体', '数据服务', '娱乐', '物流'], exports: ['芯片', '娱乐程序', '义体零件'], imports: ['天然食材', '木材', '未联网工艺品'], labor: '长期企业合同、即时零工和匿名数据劳动', prices: { grain: 1.12, veg: 1.18, meat: 1.2, spice: 1.02, ether: .88 } },
    notableCharacters: ['绫·七码头｜能让整条街断网三分钟的地下技师。','董事零一｜唯一公开承认自己是复制人格的企业领袖。','老磁带｜经营实体音乐店的情报中间人。','珂赛特-9｜拒绝执行公司清场命令的安保义体人。','“白噪声”｜从未被追踪到真实节点的黑客。','米洛天然｜靠一颗真正苹果成为上层名厨。'],
    environmentRule: { name: '即时社会', detail: '等待反馈比等待本身更重要；任务状态清楚时客人更有耐心。', effects: { patience: .9, budget: 1.08 } },
    localRules: ['队列透明｜及时带位与显示等待状态可抵消耐心惩罚。','离线夜｜游艺需求降低，餐饮和面对面服务评价提高。','企业巡检｜设施完好度会影响所有当地客的第一印象。'],
    festivals: ['霓虹重启夜｜饮品与游艺消费激增。','实体怀旧周｜天然食材菜品和古典装修获得溢价。'],
    recommendedFacilities: ['bar', 'arcade', 'theater'], conflicts: ['数据人格是否属于人', '企业正将位面门变成封闭订阅服务'],
    atmosphere: { sky: ['#07152b', '#3d1f64'], tint: '#5be4e6', particle: '像素雨与广告残影', weather: '酸雨、无人机航道和远处巨幅屏幕', horizon: '环城高楼、轨道电梯与密集天线', sound: '低频交通、电子雨声和远处广告播报' },
  }),
  moonsea: make({
    genre: '海洋幻想', tagline: '城市随潮汐升降，月光决定航路与王权。',
    cosmology: { cosmology: '月亮沉入海中成为发光内核，海沟、浮岛与气泡城市围绕月潮运转。', naturalLaws: '水、盐度和月相影响魔法；离水种族需要维持湿度或携带潮囊。' },
    society: { government: '深海王庭、浮岛议会与潮路公会共治', languages: ['潮歌', '泡语', '通用语'], classes: ['王庭鳍族', '航路公民', '礁民', '陆栖客民'], faith: '月母与迁徙鲸群被视为航路守护者', family: '育幼礁群共同养育后代', education: '通过潮歌记忆历史与航线', clothing: '防水薄纱、贝甲、潮珠与呼吸饰件', cuisine: '鲜鱼、海藻、盐柑、发酵贝酱与冷汤' },
    history: ['沉月纪｜月核坠海，旧大陆被潮水吞没。','三鳍王朝｜第一套跨种族潮歌法典建立。','珊瑚瘟疫｜污染迫使城市迁往深海。','浮岛独立｜陆栖移民建立议会。','鲸路失踪｜传统迁徙航线突然中断。','星门入潮｜位面门成为不受月相影响的新航路。'],
    factions: ['蓝藻王庭｜维护深海秩序与月核祭仪。','浮岛议会｜代表陆栖与两栖城市。','鲸歌领航会｜垄断安全潮路知识。','净水修会｜追查污染和非法炼金。','黑礁采珠团｜在危险海沟开采潮汐珠。'],
    economy: { currency: '潮珠与浮岛银票', industries: ['渔业', '珍珠', '航运', '净水'], exports: ['海产', '潮汐珠', '珊瑚药材'], imports: ['谷物', '木材', '火源器具'], labor: '礁群协作、航路分成和王庭特许经营', prices: { grain: 1.12, veg: 1.04, meat: .9, spice: 1.05, ether: .94 } },
    notableCharacters: ['澜歌女王｜能用一段潮歌让整座城市改变深度。','泡泡街长索姆｜最懂陆栖旅客需求的鱼人商人。','洁潮修女弥珊｜追踪珊瑚瘟疫源头的净水师。','鲸背童子｜与失踪鲸群一同归来的神秘少年。','珍珠税吏三贝｜从不收错一枚潮珠。','无鳍船长｜拒绝王庭航路垄断的传奇领航员。'],
    environmentRule: { name: '月潮湿度', detail: '温泉与清洁收益提高，干燥和脏污对当地客影响更明显。', effects: { hygiene: 1.16, comfort: 1.08 } },
    localRules: ['换水礼｜温泉和洗涤设施及时整理可获得额外评价。','禁火潮｜辣味需求下降，鲜味与酸味需求提高。','鲸歌静默｜背景噪声越低，住宿和观星收益越高。'],
    festivals: ['沉月祭｜海鲜、温泉和住宿需求上升。','浮岛开帆日｜大型旅行团集中抵达。'],
    recommendedFacilities: ['onsen', 'dining', 'guestroom'], conflicts: ['王庭与浮岛争夺潮路税', '珊瑚瘟疫可能来自异界污染'],
    atmosphere: { sky: ['#092d44', '#3a7093'], tint: '#83d8e4', particle: '水珠与浮游微光', weather: '潮雾、漂浮水团和鲸影', horizon: '珊瑚塔、浮岛礁与月光海面', sound: '潮声、鲸歌和贝壳风铃' },
  }),
  evernight: make({
    genre: '哥特永夜', tagline: '死者保留名字，活人以记忆支付漫长夜晚。',
    cosmology: { cosmology: '太阳被黑月遮蔽，影界与墓土重叠，记忆能凝结为可交易物。', deathRule: '亡者可能以亡灵、幽影或血裔继续存在，但会逐年遗失感情和名字。' },
    society: { government: '墓园议会与吸血贵族按古老夜契共治', languages: ['墓志文', '夜庭语', '通用语'], classes: ['长生贵族', '有名亡者', '夜行市民', '短生访客'], faith: '守名人、黑月和安眠圣徒', family: '血族家系、墓园邻里和记忆继承关系并存', education: '抄写墓志、影戏和漫长私人导师制', clothing: '深色礼服、银链、黑蜡封签与遮光披肩', cuisine: '陈酒、菌菇、深色果酱、温血替代饮品与慢炖料理' },
    history: ['黑月升起｜太阳消失，第一批亡者重新开口。','夜契签订｜活人与亡者确立共居规则。','百名失窃｜整片墓园的姓名被盗。','绯月内战｜血族贵族为食源与继承权开战。','安眠改革｜自愿长眠成为受法律保护的权利。','星门点灯｜异界来客带来久违的昼光样本。'],
    factions: ['墓园议会｜保护有名亡者的法律身份。','绯月十三家｜控制酒窖、地产和血液替代品。','守名修会｜保管墓志与失落记忆。','影幕剧社｜通过戏剧保存逝者经历。','晨光走私团｜秘密交易异界日光器具。'],
    economy: { currency: '黑蜡券、银币与记忆契据', industries: ['陈酿', '墓志', '记忆保存', '夜间艺术'], exports: ['陈酒', '影戏', '记忆晶体'], imports: ['新鲜果蔬', '日光器具'], labor: '长期家臣契约与按夜计酬并存', prices: { grain: 1.02, veg: 1.16, meat: .94, spice: 1.02, ether: .9 } },
    notableCharacters: ['维奥拉·绯月｜主张血族应公开接受现代监管的年轻女公爵。','守名人欧德｜记得全城死者姓名却忘了自己。','影后塔弥拉｜每次演出都会短暂变成剧中亡者。','酒窖主棺七｜用三百年时间等待一桶酒成熟。','晨光客｜身披白布、兜售瓶装黎明的走私者。','无墓骑士｜为找回被盗墓志而永不停步。'],
    environmentRule: { name: '漫长夜色', detail: '饮品、放映和住宿更受欢迎，客人耐心较高但重视尊重与安静。', effects: { patience: 1.12, budget: 1.06 } },
    localRules: ['不问寿数｜礼仪服务不足会造成额外差评。','柔光令｜放映、酒廊和住宿氛围提高。','守名夜｜与客人交谈或询问旅途更容易解锁图鉴。'],
    festivals: ['百年夜宴｜高预算客群集中饮酒与住宿。','守名节｜影戏与安静服务需求上升。'],
    recommendedFacilities: ['bar', 'theater', 'guestroom'], conflicts: ['长生贵族垄断记忆资源', '越来越多亡者主动选择遗忘'],
    atmosphere: { sky: ['#090d1f', '#352747'], tint: '#a99bc7', particle: '黑蜡灰与幽蓝鬼火', weather: '薄雾、蝙蝠群和黑月光环', horizon: '尖塔、墓园和长桥', sound: '低风、管风琴和遥远钟声' },
  }),
  honey_sky: make({
    genre: '空岛礼制', tagline: '云海托起城市，礼仪维持比重力更脆弱的和平。',
    cosmology: { cosmology: '无尽云海中漂浮着受日轮和星槎牵引的岛屿群。', naturalLaws: '浮力来自可耗尽的风脉；飞行、天气和农业都受风脉配额约束。' },
    society: { government: '浮岛议庭、日轮圣所与云帆行会共同治理', languages: ['羽音语', '礼仪通语', '星图符号'], classes: ['圣所家族', '岛主与礼仪官', '云帆市民', '无岛旅民'], faith: '日轮、风脉和守望星辰', family: '家族与同一艘云帆上的船契家庭并存', education: '礼仪学院、星图学校和云帆实习', clothing: '浅色礼装、羽饰、轻纱与防风束带', cuisine: '蜂蜜、云麦、轻乳酪、果干与花茶' },
    history: ['升岛纪｜地表灾变迫使先民升入云海。','日轮加冕｜圣所建立统一历法。','断帆战争｜浮岛为风脉航线开战。','羽桥和议｜建立中立公共航道。','星槎远征｜首次驶离本世界天穹。','异界停泊｜多元旅店获得临时空港资格。'],
    factions: ['浮岛议庭｜代表大小岛屿分配风脉。','日轮圣所｜维护历法、教育与礼仪法。','云帆行会｜控制航运和星图。','无岛者联盟｜争取迁徙居民的停泊权。','晨钟学院｜培训礼仪官与观星师。'],
    economy: { currency: '日轮铢与风帆信用', industries: ['蜂蜜', '轻纺', '航运', '星图'], exports: ['甜味食材', '轻质织物', '导航仪'], imports: ['金属', '肉类', '大型木材'], labor: '岛民轮值、礼仪官俸禄与船员分成', prices: { grain: .94, veg: .96, meat: 1.18, spice: 1.04, ether: .92 } },
    notableCharacters: ['赫萝妲礼仪长｜能在一顿饭里化解三国争端。','云帆王子伊安｜放弃继承权去寻找失踪浮岛。','甜匠珀尔｜发明了不会掉落云海的悬浮蛋糕。','无岛者弥迦｜要求议庭承认移动家庭。','星图师晨七｜发现天空外还有另一层天空。','哑钟守望者｜从不说话，却总能提前敲响灾难警钟。'],
    environmentRule: { name: '永昼礼序', detail: '景观、礼仪和洁净带来更高客单，失礼会放大负面评价。', effects: { etiquette: 1.16, budget: 1.1 } },
    localRules: ['完整迎送｜迎宾与结账都完成时评价提高。','风脉节约｜设施空转会轻微增加维护成本。','祝词时段｜甜味餐饮和庭院消费提高。'],
    festivals: ['羽桥巡游｜庭院、观星和甜点需求激增。','停泊礼｜大型礼仪使团集中到访。'],
    recommendedFacilities: ['garden', 'observatory', 'parlor'], conflicts: ['无岛者缺乏政治权利', '风脉正在不可逆衰减'],
    atmosphere: { sky: ['#4b86b4', '#f1d18a'], tint: '#f6e2aa', particle: '金色羽屑与云雾', weather: '云瀑、风帆和日轮光晕', horizon: '浮岛、羽桥与星槎码头', sound: '高空风、晨钟和帆索轻响' },
  }),
  iron_hive: make({
    genre: '黑暗星际战争', tagline: '恒星在燃烧，帝国以亿万人的纪律维持最后航线。',
    cosmology: { cosmology: '人类诸域散布于被风暴割裂的星海，亚空间回声会扭曲航行、通讯与心智。', naturalLaws: '超光速航行必须穿越危险回声层；灵能越强，暴露于异界存在的风险越高。', powerSystem: '舰队、工业产能、基因强化、灵能与信仰动员共同决定力量。', deathRule: '死亡通常不可逆；克隆与人格复制受严格法律限制且不能完整继承原人格。' },
    society: { government: '燃烬帝国、铸造议会与边疆军团构成高度军事化联盟', languages: ['帝国标准语', '机械祷文', '军团手势'], classes: ['星域贵胄', '军团与教士', '工坊公民', '契约劳工'], faith: '人类存续、神圣机械与阵亡者名录', family: '血缘家庭常被军团、舰组和工坊共同体取代', education: '岗位灌输、军团学院与机械学徒制', clothing: '厚重制服、呼吸面罩、识别章和耐火披风', cuisine: '高热量军粮、发酵蛋白、烈酒和极少量真正香料' },
    history: ['远征纪｜第一批殖民舰驶离母星。','静默风暴｜星际通讯中断三百年。','铸造盟约｜机械教团恢复关键工业世界。','百旗叛乱｜边疆军团反抗中央征税。','燃烬圣战｜异形舰群突破三道防线。','裂隙再开｜位面门被认定为新的战略航道。'],
    factions: ['燃烬王座｜以存续名义维持星域中央权力。','第九边疆军团｜守卫最危险的裂隙前线。','铸造议会｜掌握舰船、武器与维护知识。','余火慈悲会｜救助难民并反对无限征兵。','黑帆自由舰队｜游走于走私、私掠与救援之间。','灰烬审议庭｜调查灵能污染和政治异端。'],
    economy: { currency: '帝国配给券、铸造额度与舰队信用', industries: ['军工', '舰船', '合成食品', '能源'], exports: ['合金', '机械部件', '耐久设备'], imports: ['天然食材', '药品', '稳定以太'], labor: '军团服役、工坊世职和高压配给劳动', prices: { grain: 1.08, veg: 1.2, meat: 1.1, spice: 1.18, ether: .9 } },
    notableCharacters: ['阿德拉斯元帅｜守住三次裂隙却拒绝返回首都受封。','铸母赫卡特｜把整颗废弃卫星改造成移动工坊。','余火修女塞拉｜从战区带回十万名无籍儿童。','黑帆船长洛克｜既被帝国通缉也被边疆立碑。','审议官零灰｜从不处决未经自己亲眼调查的人。','无名信标｜持续从失陷星域发送求救讯号的人或机器。'],
    environmentRule: { name: '战时配给', detail: '天然食材昂贵，高品质菜肴和可靠设施能获得更高预算评价。', effects: { budget: 1.12, patience: .94 } },
    localRules: ['军团优先｜大型团队要求快速整组服务。','熄灯警戒｜偶发警戒时放映与游艺需求下降，住宿需求提高。','阵亡名录｜尊重身份和称谓会显著改善礼仪评价。'],
    festivals: ['守线纪念日｜军团使团集中到访，烈酒和大份餐食需求提高。','铸造初火节｜炼金、机械设施与高品质设备获得关注。'],
    recommendedFacilities: ['dining', 'bar', 'alchemy'], conflicts: ['帝国存续是否能为永久军管辩护', '亚空间风暴正在逼近核心星域'],
    atmosphere: { sky: ['#090d16', '#5b2b25'], tint: '#c07858', particle: '余烬与微弱舰船航迹', weather: '灰尘风暴、轨道残骸和远方炮火闪光', horizon: '巨型舰影、工业尖塔与防御阵列', sound: '低沉警报、机械轰鸣和远雷般炮声' },
  }),
  mask_realm: make({
    genre: '戏剧奇幻', tagline: '面具是身份，喝彩是选票，每座城市都在上演自己。',
    cosmology: { cosmology: '情绪会凝成舞台魔力，城市在观众共同相信时改变布景。', naturalLaws: '幻术不能长期违背集体认知；真相被揭露后，舞台现实会迅速崩解。' },
    society: { government: '喝彩议会按演出支持率执政', languages: ['舞台通语', '面具暗号', '后台手势'], classes: ['名角家族', '剧团公民', '幕后工匠', '无面者'], faith: '缪斯、无名观众与谢幕仪式', family: '剧团收养与面具继承常高于血缘', education: '所有儿童学习即兴、辩论和舞台劳动', clothing: '面具、夸张礼装、机关袖与鲜明色块', cuisine: '变色甜点、烈酒、共享拼盘与带表演的菜肴' },
    history: ['第一幕｜无名王以一场戏统一七城。','面具法典｜身份可通过合法换面重新登记。','倒彩革命｜观众推翻永不谢幕的独裁剧团。','幕后罢演｜工匠让全国舞台停摆。','无面宣言｜拒绝固定身份者获得公民权。','万界首演｜异界故事成为最昂贵的新剧目。'],
    factions: ['喝彩议会｜通过民众反应决定政策。','红幕王团｜传统名角和政治家族联盟。','幕后工会｜控制舞台机关与城市维护。','无面者社｜反对以表演价值衡量人格。','盗本者｜偷取被禁剧本并跨界传播。'],
    economy: { currency: '喝彩票与金面币', industries: ['演出', '服装', '幻术', '旅游'], exports: ['剧本', '面具', '舞台机关'], imports: ['新故事', '异界酒类'], labor: '剧团分成、工会合同和按场计酬', prices: { grain: 1.04, veg: 1.02, meat: 1.06, spice: .94, ether: .9 } },
    notableCharacters: ['红后阿黛尔｜连任七季的演员执政官。','无面诗人｜作品传遍全国却拒绝公开任何身份。','机关师铜铃｜能让整条街在一分钟内换景。','倒彩伯爵｜专门用恶评揭露腐败剧团。','猫步王子｜从王团叛逃加入街头巡演。','最后观众｜据说只要得到其掌声，作品就永不被遗忘。'],
    environmentRule: { name: '观众效应', detail: '热闹、表演与高观赏性提高消费，过度平淡会降低评价。', effects: { spectacle: 1.16, budget: 1.06 } },
    localRules: ['登场礼｜迎宾完成得越及时，客人初始耐心越高。','即兴夜｜特殊设施挑战奖励提高，失败影响也略明显。','谢幕时刻｜完整结账离店可获得额外小费。'],
    festivals: ['无名面具节｜酒吧、台球与放映需求提高。','全国首演夜｜标志人物和剧团旅行团出现率上升。'],
    recommendedFacilities: ['theater', 'bar', 'billiard'], conflicts: ['公共政策被娱乐化操纵', '无面者要求取消表演身份评分'],
    atmosphere: { sky: ['#2c1738', '#9b354f'], tint: '#ef9a69', particle: '纸屑、聚光尘和面具残影', weather: '红幕云、烟花和浮动舞台灯', horizon: '剧院尖顶、悬挂布景与露天看台', sound: '掌声、弦乐和后台机关声' },
  }),
  inverted_dreamsea: make({
    genre: '梦境超现实', tagline: '海在天上，梦在地下，清醒只是暂时的地方习俗。',
    cosmology: { cosmology: '现实由共享梦层托起，天空海洋保存未被做完的梦。', naturalLaws: '个人想象只能短暂改变局部；被多人记住的变化才会沉淀为稳定现实。', deathRule: '死亡者可能成为共享梦中的回声，但回声不是完整原人。' },
    society: { government: '梦港自治体通过共识仪式决定规则', languages: ['梦像', '潮声语', '醒者通语'], classes: ['造梦师', '拾梦人', '稳定者', '迷梦客'], faith: '敬畏沉睡灯塔和第一位做梦者', family: '共享长期梦境的人可登记为梦亲', education: '儿童学习区分私人梦、公共梦和物质事实', clothing: '漂浮薄纱、倒置纽扣和液态饰物', cuisine: '梦糖、气泡汤、反重力果实与怪味炼金饮品' },
    history: ['第一次入睡｜世界从某个无名者的梦中醒来。','倒雨发现｜向上降落的雨成为主要交通。','醒梦战争｜稳定者试图禁止公共改写现实。','灯塔沉眠｜导航核心进入无法唤醒的梦。','鲸梦迁徙｜城市随巨鲸梦境移动。','异界锚定｜位面门首次提供完全稳定的坐标。'],
    factions: ['沉睡灯塔会｜维护公共现实稳定。','拾梦行会｜收集、加工和出售梦境。','软月公社｜主张现实应持续开放改写。','醒者联盟｜保护不愿接入共享梦的人。','瓶潮商团｜运输声音、情绪与天气。'],
    economy: { currency: '梦砂与醒时券', industries: ['梦境', '感官炼金', '星图', '奇异旅游'], exports: ['梦糖', '瓶装体验', '不稳定材料'], imports: ['稳定金属', '计时器具'], labor: '按清醒时数计酬，也接受创意与记忆交换', prices: { grain: 1.08, veg: 1.04, meat: 1.12, spice: .92, ether: .86 } },
    notableCharacters: ['拾梦人小满｜能从陌生人梦里捡到遗失物。','灯塔长睡者｜沉睡百年仍在发布准确航报。','软月议长｜每次会议都用不同形态出现。','醒者杜衡｜坚持只相信可触摸证据的调查员。','瓶潮姐妹｜出售从未发生过的夏日下午。','鲸梦牧者｜唯一能说服城市改变迁徙方向的人。'],
    environmentRule: { name: '梦潮', detail: '猎奇体验与特殊设施更受欢迎，流程过于单调会降低观赏评分。', effects: { spectacle: 1.14, patience: 1.08 } },
    localRules: ['反常许可｜炼金、温泉和观星服务获得加成。','清醒钟｜当日准时服务更重要，延误惩罚提高。','共享梦｜客人交谈和世界故事解锁速度提高。'],
    festivals: ['鲸梦渡日｜观星与住宿需求上升。','倒雨嘉年华｜温泉、炼金和怪味饮品需求提高。'],
    recommendedFacilities: ['observatory', 'alchemy', 'onsen'], conflicts: ['公共梦是否侵犯私人意识', '沉睡灯塔可能已经被另一种存在占据'],
    atmosphere: { sky: ['#34275d', '#7bb4c7'], tint: '#c5a7eb', particle: '向上雨滴与透明梦泡', weather: '倒雨、漂浮鲸影和反向瀑布', horizon: '倒置灯塔、软月和天空海岸', sound: '瓶中潮声、轻语和倒放钟声' },
  }),
  ash_dragoncourt: make({
    genre: '龙族工业魔法', tagline: '龙火驱动锻城，血统决定席位，契约决定代价。',
    cosmology: { cosmology: '龙脉如熔炉管道贯穿大陆，古龙尸骨构成山脉与能源节点。', naturalLaws: '龙火能放大锻造与契约，却会永久消耗龙脉热量。' },
    society: { government: '龙庭、锻城联盟与契约家族分权', languages: ['龙庭语', '锻文', '契约真名'], classes: ['古血龙族', '锻城贵胄', '契约公民', '炉役'], faith: '祖龙、炉心与不可违背的誓言', family: '血统家族与锻造师门双重继承', education: '宫廷礼法、锻炉学徒和契约法学院', clothing: '黑金礼服、鳞甲、耐火披肩与印玺', cuisine: '龙炉烤肉、辛香浓汤、陈酿与矿盐甜点' },
    history: ['祖龙陨落｜龙骨山脉与第一座炉心诞生。','黑金加冕｜龙庭统一高原。','矮炉盟约｜锻城获得自治与议价权。','契约战争｜恶魔家族以文字击败军队。','余烬衰退｜龙脉热量开始下降。','异火输入｜来自万界的新燃料打破旧有垄断。'],
    factions: ['余烬龙庭｜维护血统等级和王室炉心。','七座锻城｜控制武器、机械与工程师。','黑印契约院｜解释和执行跨族契约。','无鳞同盟｜要求取消血统席位。','余温学派｜研究可持续替代能源。'],
    economy: { currency: '黑金币与炉心配额', industries: ['锻造', '矿业', '契约金融', '陈酿'], exports: ['合金', '武具', '工业魔法设备'], imports: ['粮食', '木材', '替代能源'], labor: '家族工坊、炉役契约与高薪技术师并存', prices: { grain: 1.14, veg: 1.12, meat: .92, spice: .9, ether: 1.05 } },
    notableCharacters: ['烬冠女王萨维娅｜试图在龙脉枯竭前结束血统政治。','黑砧王铜岳｜代表七座锻城与龙庭谈判。','契约师弥菲斯｜从不说谎，却总让真话产生两种解释。','无鳞骑士罗坎｜第一位获得宫廷席位的平民。','余温学者阿栖｜证明龙火并非唯一能源。','最后祖鳞｜被多方争夺、可能仍有意识的古龙遗物。'],
    environmentRule: { name: '品质审视', detail: '高品质出品溢价明显，低品质服务更容易遭到苛刻评价。', effects: { budget: 1.18, patience: .9 } },
    localRules: ['席位礼｜团队带位和桌边服务质量权重提高。','真材令｜高品质菜品与饮品获得额外小费。','炉休日｜炼金需求下降，温泉和住宿需求提高。'],
    festivals: ['黑金王宴｜高预算使团集中用餐饮酒。','七炉竞锻｜炼金设施与搬运挑战事件增加。'],
    recommendedFacilities: ['parlor', 'bar', 'alchemy'], conflicts: ['龙脉能源正在枯竭', '无鳞公民要求结束血统等级'],
    atmosphere: { sky: ['#241619', '#783c2d'], tint: '#df875e', particle: '灰烬与金属火星', weather: '热浪、黑云和远处龙影', horizon: '黑金宫城、巨炉与龙骨山脉', sound: '锻锤、炉火和低沉龙吟' },
  }),
  timeless_bazaar: make({
    genre: '时间集市', tagline: '昨日与明日同桌交易，准时反而成了最稀缺的商品。',
    cosmology: { cosmology: '多个时代在零时十字街重叠，时间以可测量的支流形式流动。', naturalLaws: '改变过去会生成时间债而非直接覆盖现实；债务最终由相关者的未来偿还。', deathRule: '从别的时间带回同一人不会取消死亡，只会产生两个独立身份与悖论责任。' },
    society: { government: '时序仲裁院、市场公会和纪元街区自治', languages: ['集市通语', '纪年码', '古今混合语'], classes: ['持钟公民', '纪元商户', '临时旅人', '失刻者'], faith: '敬畏零时、守钟人和未发生的可能性', family: '同一血缘的不同时间版本需分别登记', education: '学习纪元辨识、悖论卫生和多时代礼仪', clothing: '跨时代拼接、怀表饰件和日期铭牌', cuisine: '古代炖食、未来合成餐与从未流行过的混合料理' },
    history: ['零时相撞｜第一批时代在十字街重叠。','持钟法案｜确立个人所属纪元和法律责任。','明日挤兑｜未来货币大规模冲击市场。','昨日封锁｜古代街区拒绝现代技术进入。','悖论瘟疫｜大量居民失去出生因果。','万界挂牌｜位面门成为时间之外的中立出口。'],
    factions: ['时序仲裁院｜处理时间债与身份冲突。','昨日商会｜保护古代行业和礼法。','明日廊财团｜交易预测、专利和未来商品。','失刻者互助会｜帮助没有合法年代的人。','悖论修补局｜封锁可能导致现实崩坏的交易。'],
    economy: { currency: '纪元券、时砂与各时代折算货币', industries: ['时间贸易', '古董', '预测', '跨时代服务'], exports: ['绝版物品', '未来方案', '历史见证'], imports: ['稳定坐标', '跨时代通用物资'], labor: '按时间段、风险与时间债共同计价', prices: { grain: 1, veg: 1, meat: 1, spice: 1, ether: 1 } },
    notableCharacters: ['仲裁官现在｜同时审理昨天和明天的同一案件。','昨日婆婆｜卖出的旧物总会在买家童年出现。','明日商人三七｜从不出售超过七天后的消息。','失刻少年｜没有过去，却被许多人记得。','修补师钟缺｜用自己的寿命填补大型悖论。','迟到的王｜等待一个尚未建立的国家来接他回去。'],
    environmentRule: { name: '潮流漂移', detail: '每日随机三类需求与两类食材价格发生温和变化，并提前显示。', effects: { budget: 1.12, patience: .94 } },
    localRules: ['先问纪元｜完整迎宾可避免礼仪误判。','昨日行情｜传统餐食和原木风格获得加成。','明日热榜｜游艺、炼金和饮品需求提高。'],
    festivals: ['零时开市｜所有世界客群都可能出现，消费与复杂度提高。','失刻纪念日｜住宿和询问旅途互动增加。'],
    recommendedFacilities: ['dining', 'arcade', 'guestroom'], conflicts: ['未来财团利用预测垄断市场', '时间债总量正在接近无法偿还的临界点'],
    atmosphere: { sky: ['#17263c', '#8a6345'], tint: '#d2aa70', particle: '倒转钟针与年代残影', weather: '局部季节错位和重复经过的行人剪影', horizon: '多时代街区、钟塔与重叠道路', sound: '多层钟声、集市叫卖和磁带倒转声' },
  }),
});

export function enrichFixedWorld(profile) {
  const lore = WORLD_ENCYCLOPEDIA[profile.id];
  if (!lore) return profile;
  const regions = [...(profile.regions || [])];
  while (regions.length < 6) {
    const source = lore.factions[regions.length % lore.factions.length];
    regions.push({ id: `${profile.id}_region_${regions.length + 1}`, name: `${source.name}辖区`, type: lore.society.government, traits: [lore.genre, lore.society.faith], commonOccupations: profile.travel.occupations.slice(0, 2) });
  }
  const notableRaces = WORLD_NOTABLE_RACES[profile.id] || [];
  const notableCharacters = (lore.notableCharacters || []).map((character, index) => (
    Number.isInteger(character.raceId) ? character : { ...character, raceId: notableRaces[index] }
  ));
  return { ...profile, ...lore, regions, notableCharacters, identity: { ...profile.identity, genre: lore.genre, tagline: lore.tagline }, visuals: { ...profile.visuals, atmosphere: lore.atmosphere } };
}

export const CUSTOM_WORLD_LIMIT = 8;
export const customWorldCreationCost = (activeCount) => 800 + Math.max(0, Number(activeCount) || 0) * 100;
export const worldSwitchCost = (world) => world?.custom ? 480 : 120 + Math.max(0, Number(world?.unlockStars) || 0) * 80;

export function worldRuleForDay(world, day = 1) {
  const rules = world?.localRules || [];
  return rules.length ? rules[(Math.max(1, Number(day) || 1) - 1) % rules.length] : null;
}

export function worldFestivalForDay(world, day = 1) {
  const festivals = world?.festivals || [];
  if (!festivals.length || Math.max(1, Number(day) || 1) % 5 !== 0) return null;
  return festivals[Math.floor((Math.max(1, Number(day) || 1) - 1) / 5) % festivals.length];
}

export function normalizeCustomWorld(raw, fallbackId = `custom_${Date.now().toString(36)}`) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const text = (value, fallback = '') => String(value ?? fallback).trim();
  const list = (value, fallback = []) => (Array.isArray(value) ? value : fallback).map((item) => typeof item === 'string' ? item.trim() : item).filter(Boolean);
  const color = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : fallback;
  const id = /^custom_[a-z0-9_-]{4,48}$/i.test(source.id || '') ? source.id : fallbackId;
  const regions = list(source.regions).slice(0, 10).map((region, index) => typeof region === 'object' ? { id: region.id || `${id}_region_${index + 1}`, name: text(region.name, `地区${index + 1}`), type: text(region.type, '异界区域'), traits: list(region.traits).slice(0, 4), commonOccupations: list(region.commonOccupations).slice(0, 4) } : { id: `${id}_region_${index + 1}`, name: text(region), type: '异界区域', traits: [], commonOccupations: [] });
  while (regions.length < 4) regions.push({ id: `${id}_region_${regions.length + 1}`, name: `未命名地区${regions.length + 1}`, type: '异界区域', traits: [], commonOccupations: [] });
  const economy = source.economy || {};
  const prices = Object.fromEntries(['grain', 'veg', 'meat', 'spice', 'ether'].map((key) => [key, clamp(economy.prices?.[key])]));
  const normalizeEffects = (effects = {}) => Object.fromEntries(Object.entries(effects).filter(([key]) => ['budget', 'patience', 'hygiene', 'etiquette', 'comfort', 'spectacle'].includes(key)).map(([key, value]) => [key, clamp(value)]));
  const localRules = named(list(source.localRules).slice(0, 4)).map((rule) => ({ ...rule, effects: normalizeEffects(rule.effects) }));
  while (localRules.length < 3) localRules.push({ id: `entry_${localRules.length + 1}`, name: `当地惯例${localRules.length + 1}`, detail: '对服务效率与礼仪产生温和影响。' });
  const population = list(source.population).slice(0, 8).map((row, index) => ({ raceId: Math.max(0, Math.min(18, Number(row?.raceId ?? row) || 0)), weight: Math.max(1, Math.min(10, Number(row?.weight) || 1)), role: text(row?.role, index ? '常住居民' : '主体居民') }));
  if (!population.length) population.push({ raceId: 0, weight: 5, role: '主体居民' }, { raceId: 1, weight: 3, role: '常住居民' });
  const groupPatterns = list(source.travel?.groupPatterns).slice(0, 4).map((row) => typeof row === 'object' ? { type: text(row.type, '当地旅行团'), min: Math.max(1, Math.min(4, Number(row.min) || 1)), max: Math.max(1, Math.min(4, Number(row.max) || 4)), weight: Math.max(1, Math.min(10, Number(row.weight) || 4)) } : { type: text(row, '当地旅行团'), min: 1, max: 4, weight: 4 });
  if (!groupPatterns.length) groupPatterns.push({ type: '当地旅行团', min: 1, max: 4, weight: 4 });
  const appearanceThemes = list(source.visuals?.appearanceThemes).filter((theme) => ['cyber', 'ancient', 'magic'].includes(theme)).slice(0, 3);
  if (!appearanceThemes.length) appearanceThemes.push('magic');
  const defaultDialogue = {
    arrival: [`终于抵达${text(source.name, '这个世界')}之外的旅店了。`, '位面门比传闻中稳定。', '这里会怎样接待我们？', '先看看当地菜单吧。', '异界的礼数或许不同，先向掌柜问清楚。'],
    wait: ['还需要等多久？', '队列至少还看得明白。', '希望没有走错航路。', '稍等片刻也无妨。', '若能说明进度，我们也好安排后面的行程。'],
    good: ['这趟跨界旅行值得。', '我要把这里记进旅途日志。', '服务比传闻还可靠。', '下次会带同伴再来。', '这里确实理解我们的习惯。'],
    neutral: ['整体还算稳妥。', '有些地方与家乡不太一样。', '这次体验可以接受。', '也许下次会更顺利。', '没有失礼，但也还没留下深刻印象。'],
    bad: ['这不是我期待的跨界服务。', '等待和出品都需要改进。', '我会如实记录这次体验。', '还是先回故乡吧。', '若不了解来客的规矩，至少应该先询问。'],
    journey: ['故乡最近正在发生巨大的变化。', '我为一件只有异界才有的事物而来。', '位面门改变了我们的日常。', '总有一天你该亲自去看看。', '我们的职业、口音和旅途目的都与故乡密不可分。'],
  };
  const dialogue = Object.fromEntries(Object.entries(defaultDialogue).map(([kind, fallback]) => {
    const rows = list(source.dialogue?.[kind]).map(String).slice(0, 8);
    for (const line of fallback) if (rows.length < 5 && !rows.includes(line)) rows.push(line);
    return [kind, rows];
  }));
  const rawSource = source.source && typeof source.source === 'object' && !Array.isArray(source.source) ? source.source : {};
  const sourceMode = rawSource.mode === 'existing_work' ? 'existing_work' : 'original';
  const worldSource = {
    mode: sourceMode,
    workName: sourceMode === 'existing_work' ? text(rawSource.workName, source.name).slice(0, 120) : '',
    medium: text(rawSource.medium, sourceMode === 'existing_work' ? '既有作品' : '原创').slice(0, 40),
    note: text(rawSource.note, sourceMode === 'existing_work' ? '基于玩家指定的既有作品世界。' : '玩家创建的原创世界。').slice(0, 240),
  };
  const notableCharacters = named(list(source.notableCharacters).slice(0, 8)).map((row, index) => {
    const raceId = Number(row.raceId);
    return {
      ...row,
      canonical: sourceMode === 'existing_work' && row.canonical === true,
      ...(Number.isInteger(raceId) ? { raceId: Math.max(0, Math.min(18, raceId)) } : {}),
      visitor: index < 3,
    };
  });
  return {
    id, custom: true, name: text(source.name, '未命名世界').slice(0, 24), icon: text(source.icon, '◈').slice(0, 2), unlockStars: 3,
    source: worldSource,
    genre: text(source.genre, '原创异世界').slice(0, 40), tagline: text(source.tagline, '一处等待被旅店理解的新世界。').slice(0, 100),
    identity: { summary: text(source.summary || source.identity?.summary, '这个世界与多元旅店建立了新的航路。').slice(0, 500), environment: text(source.identity?.environment, '多样异界环境'), civilization: text(source.identity?.civilization, '多元文明'), technology: text(source.identity?.technology, '独特力量体系'), genre: text(source.genre, '原创异世界'), tagline: text(source.tagline) },
    cosmology: { ...COMMON, ...(source.cosmology || {}) }, society: source.society && typeof source.society === 'object' ? source.society : {},
    population,
    regions, culture: { ...(source.culture || {}), values: list(source.culture?.values).slice(0, 6), taboos: list(source.culture?.taboos).slice(0, 6), etiquette: text(source.culture?.etiquette, '尊重当地身份与公开规则。') },
    hospitality: { wantWeights: Object.fromEntries(Object.entries(source.hospitality?.wantWeights || {}).map(([key, value]) => [key, clamp(value)])), flavorLikes: list(source.hospitality?.flavorLikes).slice(0, 3), flavorDislikes: list(source.hospitality?.flavorDislikes).slice(0, 2), roomStyleLikes: list(source.hospitality?.roomStyleLikes).slice(0, 3), servicePriorities: Object.fromEntries(Object.entries(source.hospitality?.servicePriorities || {}).map(([key, value]) => [key, clamp(value)])) },
    travel: { occupations: list(source.travel?.occupations, ['异界旅人', '当地商人', '文化使者', '自由探索者']).slice(0, 8), purposes: list(source.travel?.purposes, ['体验异界旅店', '进行跨界贸易', '寻找传闻人物', '记录不同文明']).slice(0, 8), groupPatterns, budgetMultiplier: clamp(source.travel?.budgetMultiplier), patienceMultiplier: clamp(source.travel?.patienceMultiplier) },
    visuals: { ...(source.visuals || {}), atmosphere: (() => { const rawAtmosphere = source.atmosphere || source.visuals?.atmosphere || {}; return { sky: [color(rawAtmosphere.sky?.[0], '#17263c'), color(rawAtmosphere.sky?.[1], '#634f70')], tint: color(rawAtmosphere.tint, '#d2b4e8'), particle: text(rawAtmosphere.particle, '位面微光').slice(0, 80), weather: text(rawAtmosphere.weather, '异界天象').slice(0, 160), horizon: text(rawAtmosphere.horizon, '陌生城市轮廓').slice(0, 160), sound: text(rawAtmosphere.sound, '遥远的异界环境声').slice(0, 160) }; })(), appearanceThemes },
    history: named(list(source.history).slice(0, 8)), factions: named(list(source.factions).slice(0, 6)),
    economy: { currency: text(economy.currency, '当地通货与界币'), industries: list(economy.industries).slice(0, 8), exports: list(economy.exports).slice(0, 8), imports: list(economy.imports).slice(0, 8), labor: text(economy.labor, '多种劳动制度并存'), prices },
    notableCharacters,
    environmentRule: { name: text(source.environmentRule?.name, '异界环境').slice(0, 60), detail: text(source.environmentRule?.detail, '当地环境对经营产生温和、公开的影响。').slice(0, 240), effects: normalizeEffects(source.environmentRule?.effects) }, localRules,
    festivals: named(list(source.festivals).slice(0, 4)).map((festival) => ({ ...festival, effects: normalizeEffects(festival.effects) })), recommendedFacilities: list(source.recommendedFacilities).filter((kind) => ['dining', 'bar', 'parlor', 'guestroom', 'onsen', 'billiard', 'theater', 'garden', 'observatory', 'arcade', 'alchemy'].includes(kind)).slice(0, 4), conflicts: list(source.conflicts).slice(0, 6), storyHooks: list(source.storyHooks).slice(0, 8),
    dialogue, knowledge: source.knowledge || { firstArrival: ['name', 'summary'], firstService: ['hospitality'], servedThree: ['economy'], deepDiscovery: ['history', 'factions', 'notableCharacters'] },
    generatedAt: Math.max(0, Number(source.generatedAt) || Date.now()), generationBrief: text(source.generationBrief).slice(0, 1200),
  };
}
