const effect = (stage, success = true) => {
  if (success) return stage === 2 ? { coins: 320, rep: 20, morale: 6 } : stage === 1 ? { coins: 180, rep: 13 } : { coins: 90, rep: 9 };
  return stage === 2 ? { coins: -100, rep: -10, stress: 8 } : stage === 1 ? { rep: -7, stress: 6 } : { rep: -4, stress: 4 };
};

const choice = (label, skill, difficulty, stage) => ({
  label,
  note: `${label}，进行对应能力检定`,
  skill,
  difficulty,
  successText: `${label}的安排顺利完成，对方势力将这次合作记入了正式档案。`,
  failureText: `${label}的执行出现纰漏，对方要求旅店补做说明并修复关系。`,
  successEffects: effect(stage, true),
  failureEffects: effect(stage, false),
});

const chainStep = (title, premise, stage, a, b) => ({
  title, premise, kind: stage === 2 ? 'milestone' : stage === 1 ? 'opportunity' : 'mystery',
  choices: [choice(a[0], a[1], 44 + stage * 8, stage), choice(b[0], b[1], 47 + stage * 8, stage)],
});

const accident = (title, premise, factionIndex, a, b) => ({
  title, premise, factionIndex, kind: 'accident',
  choices: [
    { ...choice(a[0], a[1], 50, 0), successEffects: { coins: 80, rep: 8 }, failureEffects: { rep: -5, dirt: 2 } },
    { ...choice(b[0], b[1], 54, 0), successEffects: { rep: 11, morale: 3 }, failureEffects: { rep: -6, stress: 5 } },
  ],
});

export const WORLD_LOCAL_SPECIALTIES = Object.freeze({
  hearth_coast: { id: 'contract_runner', name: '契约跑堂', skill: 'serve', bonus: 6, job: 'front', note: '熟悉委托、报价与冒险小队的接待规矩，服务 +6。' },
  verdant_court: { id: 'forest_steward', name: '林契侍者', skill: 'clean', bonus: 6, job: 'cleaner', note: '能读懂植物与环境的细微变化，清洁 +6。' },
  magma_ridge: { id: 'spirit_flame', name: '灵息火候', skill: 'cook', bonus: 6, job: 'cook', note: '以灵息稳定复杂火候，厨艺 +6。' },
  neon_ring: { id: 'rush_dispatch', name: '极速调度', skill: 'carry', bonus: 6, job: 'server', note: '习惯高密度即时订单与最短路线，搬运 +6。' },
  moonsea: { id: 'tide_clean', name: '潮汐洁净', skill: 'clean', bonus: 6, job: 'attendant', note: '精于水质、鲜度和湿区维护，清洁 +6。' },
  evernight: { id: 'longnight_mix', name: '长夜调饮', skill: 'mix', bonus: 6, job: 'bartender', note: '理解长生种缓慢而挑剔的饮用节奏，调酒 +6。' },
  honey_sky: { id: 'cloud_etiquette', name: '云港礼仪', skill: 'looks', bonus: 6, job: 'greeter', note: '熟悉浮岛迎送次序与正式称谓，颜值 +6。' },
  iron_hive: { id: 'field_logistics', name: '战地后勤', skill: 'carry', bonus: 6, job: 'porter', note: '能在故障和配给压力下维持物资线，搬运 +6。' },
  mask_realm: { id: 'improv_host', name: '即兴场务', skill: 'serve', bonus: 6, job: 'attendant', note: '擅长接住临场身份与观众情绪，服务 +6。' },
  inverted_dreamsea: { id: 'dream_anchor', name: '梦境锚定', skill: 'calm', bonus: 6, job: 'front', note: '面对颠倒常识仍能保持判断，冷静 +6。' },
  ash_dragoncourt: { id: 'dragon_appraisal', name: '龙庭鉴品', skill: 'cook', bonus: 6, job: 'cook', note: '能识别高价宴席最细小的品质缺陷，厨艺 +6。' },
  timeless_bazaar: { id: 'era_dispatch', name: '时序调度', skill: 'calm', bonus: 6, job: 'front', note: '先辨年代再安排礼数和流程，冷静 +6。' },
});

export const WORLD_EVENT_BLUEPRINTS = Object.freeze({
  hearth_coast: {
    accident: accident('公会委托牌爆单', '两支冒险队同时认领了同一份补给委托，长桌公会要求旅店立即核清契约和餐宿安排。', 1, ['重排两队接待顺序', 'serve'], ['核对印章与货单', 'calm']),
    chain: { name: '失落远征队归来', factionIndex: 1, steps: [
      chainStep('被雨浸透的旧账簿', '长桌公会送来一册失踪多年的远征账簿，最后一页写着旅店的坐标。', 0, ['辨认远征队的补给暗记', 'calm'], ['按旧契约准备热食', 'cook']),
      chainStep('深路关隘的伤员车队', '失落远征队真的穿过位面门归来，伤员、行李和追问同时挤满门厅。', 1, ['建立伤员优先接待线', 'serve'], ['快速搬出临时休息区', 'carry']),
      chainStep('归来者的长桌见证', '公会希望在旅店举办公开听证与归来宴，让远征队交出足以改变王国航路的证词。', 2, ['主持契约见证仪式', 'looks'], ['完成整桌归来宴', 'cook']),
    ] },
  },
  verdant_court: {
    accident: accident('歌桥花粉失控', '会唱歌的树桥把陌生花粉吹进门厅，百花议庭担心它们会附着在客人与食物上。', 0, ['分区完成无尘清理', 'clean'], ['安抚过敏的来客', 'serve']),
    chain: { name: '枯季种子盟约', factionIndex: 0, steps: [
      chainStep('不开花的种子信物', '百花议庭托付一批沉睡种子，希望旅店找出它们拒绝发芽的原因。', 0, ['检查水汽与洁净度', 'clean'], ['询问不同种族的培育记忆', 'serve']),
      chainStep('鹿铃巡守的封路通知', '种子开始萌动，却引来会吞食花香的迁徙兽群，林间道路被迫关闭。', 1, ['搬运物资绕开兽群', 'carry'], ['调配驱散花香的饮品', 'mix']),
      chainStep('新季第一次共宴', '新花终于开放，百花议庭要在旅店决定种子如何分配给各个聚落。', 2, ['布置无损花宴', 'clean'], ['主持各聚落协商', 'serve']),
    ] },
  },
  magma_ridge: {
    accident: accident('灵潮走火', '灵潮突然改变灶台与炼金釜的火性，太虚剑宗要求在扩散前稳定所有器具。', 1, ['以灵息稳住火候', 'cook'], ['关闭危险工位并疏散', 'calm']),
    chain: { name: '问道大会食契', factionIndex: 1, steps: [
      chainStep('无名弟子的席位', '太虚剑宗要求为没有师承名帖的年轻修士保留一席，这触动了旧有礼序。', 0, ['核对因果契约', 'calm'], ['以一视同仁的服务接待', 'serve']),
      chainStep('灵脉云海试宴', '大会试宴遇上灵潮倒灌，每道菜的火候都在不断变化。', 1, ['临场重定所有火候', 'cook'], ['搬离失控的灵器', 'carry']),
      chainStep('九洲公开论席', '仙朝、宗门和妖庭要在旅店决定下一届大会是否向散修开放。', 2, ['主持跨阵营礼序', 'looks'], ['以稳定出品维持谈判', 'cook']),
    ] },
  },
  neon_ring: {
    accident: accident('队列屏全城串线', '九环网络把数百家店的取号信息误投到旅店，七码头互助会请求立即恢复真实队列。', 1, ['按最短路径重排人流', 'carry'], ['逐一解释真实等待时间', 'serve']),
    chain: { name: '七码头夜班协议', factionIndex: 1, steps: [
      chainStep('没有身份码的外卖箱', '一批无人认领的餐箱带着互助会暗记出现在后门。', 0, ['追踪配送路线', 'calm'], ['核对食物与收件需求', 'serve']),
      chainStep('磁悬街停摆夜', '主交通环停摆，无证居民和夜班工人只能涌入旅店等待。', 1, ['建立高速临时动线', 'carry'], ['维持连续接待窗口', 'serve']),
      chainStep('公开服务协议投票', '董事会与互助会要在旅店直播谈判，决定无证居民能否获得基础服务。', 2, ['管理直播与现场节奏', 'calm'], ['代表旅店陈述接待原则', 'looks']),
    ] },
  },
  moonsea: {
    accident: accident('月潮倒灌', '沉月港的高湿月潮穿过位面门，客房与食材同时面临水汽污染。', 2, ['封住潮水并排湿', 'clean'], ['转移易损库存', 'carry']),
    chain: { name: '鲸歌航路补给约', factionIndex: 2, steps: [
      chainStep('失真的第一段鲸歌', '鲸歌领航会收到一段指向旅店的求援声，但其中混入了陌生回声。', 0, ['分析回声方向', 'calm'], ['向老水手询问旧航线', 'serve']),
      chainStep('浮岛议会的救援船', '救援船载着脱水旅客抵达，月潮却让所有淡水快速咸化。', 1, ['重建洁净供水区', 'clean'], ['组织连续搬运补给', 'carry']),
      chainStep('新潮路命名礼', '安全航路被重新确认，各方要决定是否让旅店成为永久补给锚点。', 2, ['完成潮路宴席', 'cook'], ['主持王庭与议会签约', 'serve']),
    ] },
  },
  evernight: {
    accident: accident('影子拒绝报上姓名', '一批客人的影子与本人分开排队，守名修会要求旅店在混乱前确认真实身份。', 2, ['逐一核对姓名与座次', 'serve'], ['观察影子的行为规律', 'calm']),
    chain: { name: '失名者夜宴', factionIndex: 2, steps: [
      chainStep('空白墓志的预约', '守名修会预订了一张没有姓名的桌子，只说客人已等待了两百年。', 0, ['查阅来访记忆', 'calm'], ['准备不冒犯身份的席位', 'serve']),
      chainStep('绯月十三家的质询', '贵族认定失名者掌握旧债证据，要求旅店交出所有接待记录。', 1, ['守住客人隐私边界', 'calm'], ['以长夜礼法周旋', 'looks']),
      chainStep('重新写下名字', '失名者愿在众人面前取回姓名，但每个阵营都声称拥有解释权。', 2, ['主持守名仪式', 'serve'], ['以陈酿安抚漫长争议', 'mix']),
    ] },
  },
  honey_sky: {
    accident: accident('风脉吹乱迎宾礼序', '浮岛风脉突然转向，席位、花饰和贵宾航帆全被打乱。', 0, ['按礼序重建席位', 'looks'], ['固定航帆与陈设', 'carry']),
    chain: { name: '浮岛迎日典礼', factionIndex: 0, steps: [
      chainStep('失去日影的请柬', '浮岛议庭送来一张不会投下影子的请柬，意味着某座小岛被历法遗漏。', 0, ['核对历法与航图', 'calm'], ['询问各岛来客', 'serve']),
      chainStep('云帆行会的逆风航队', '被遗漏的小岛派出航队，却在逆风中耗尽补给。', 1, ['快速卸载救援物资', 'carry'], ['建立正式迎宾通道', 'looks']),
      chainStep('为无名浮岛升旗', '议庭将在旅店表决是否承认这座岛，所有礼仪细节都会被记录。', 2, ['主持升旗与称谓仪式', 'looks'], ['以公开服务稳定会场', 'serve']),
    ] },
  },
  iron_hive: {
    accident: accident('配给封签错位', '一批前线配给与普通客用库存混在一起，第九边疆军团要求在交接前完成追溯。', 1, ['重建物资交接线', 'carry'], ['核验每一道封签', 'calm']),
    chain: { name: '第九边疆休整线', factionIndex: 1, steps: [
      chainStep('没有番号的伤员', '一名无法确认军团番号的伤员被送到旅店，随身只有半枚焦黑徽章。', 0, ['优先完成安置', 'serve'], ['辨认徽章与伤情', 'calm']),
      chainStep('裂隙前线临时停火', '停火只持续一个夜晚，双方伤员可能同时进入旅店。', 1, ['划分安全动线', 'carry'], ['维持中立接待规则', 'serve']),
      chainStep('后勤走廊续约', '军团要决定是否把旅店列为永久休整点，同时要求公开检验承载能力。', 2, ['完成高压后勤演练', 'carry'], ['向各方说明中立条款', 'calm']),
    ] },
  },
  mask_realm: {
    accident: accident('演员互换了身份', '一场即兴演出后，演员和观众坚持使用彼此的名字，幕后工会请求旅店维持秩序。', 2, ['顺着角色继续服务', 'serve'], ['从动作细节辨认本人', 'looks']),
    chain: { name: '红幕后罢演风波', factionIndex: 2, steps: [
      chainStep('没有署名的剧本', '一册揭露舞台事故的剧本出现在旅店，署名处只有幕后工会的旧印。', 0, ['辨认机关记录', 'calm'], ['询问剧团来客', 'serve']),
      chainStep('喝彩议会临时公演', '议会要求在旅店举行公开公演，以观众反应判断工会诉求。', 1, ['布置安全舞台动线', 'carry'], ['接住演员的临场改词', 'serve']),
      chainStep('红幕落下前的谈判', '王团与工会必须在终场前达成协议，否则整座城市将停止换景。', 2, ['主持公开谈判', 'looks'], ['稳定舞台与观众秩序', 'calm']),
    ] },
  },
  inverted_dreamsea: {
    accident: accident('梦境重力塌陷', '一阵梦潮让门厅的上下方向不断交换，沉睡灯塔会请求旅店建立现实锚点。', 0, ['标记稳定参照物', 'calm'], ['固定家具与行李', 'carry']),
    chain: { name: '沉睡灯塔清醒计划', factionIndex: 0, steps: [
      chainStep('灯塔发来的醒梦', '沉睡百年的灯塔长第一次发来清醒讯号，却声称旅店位于海底。', 0, ['校对梦境坐标', 'calm'], ['询问不同梦层的旅客', 'serve']),
      chainStep('拾梦行会的记忆瓶', '关键记忆被装在一批互相做梦的瓶子里，顺序随每次触碰改变。', 1, ['建立稳定整理顺序', 'clean'], ['凭气味调出记忆线索', 'mix']),
      chainStep('城市共同醒来的一刻', '灯塔会计划让整座城市短暂同时清醒，旅店将成为现实锚点。', 2, ['维持全场冷静', 'calm'], ['准备醒后第一餐', 'cook']),
    ] },
  },
  ash_dragoncourt: {
    accident: accident('龙焰陈酿被指为赝品', '宴席监察官当众质疑一桶高价陈酿，七座锻城要求现场给出证据。', 1, ['以风味层次重新鉴定', 'mix'], ['核对封蜡与运输痕迹', 'calm']),
    chain: { name: '龙火停炉谈判', factionIndex: 1, steps: [
      chainStep('第一座熄灭的锻炉', '七座锻城的一座主炉突然熄灭，工匠带着最后一块余温矿石来到旅店。', 0, ['鉴定余温矿石', 'cook'], ['核对锻城求援契约', 'calm']),
      chainStep('龙庭宴席的空缺席位', '龙庭拒绝为平民工匠留席，谈判代表转而要求在旅店同桌。', 1, ['重新设计平等席次', 'serve'], ['以高品质出品争取时间', 'cook']),
      chainStep('七炉共同点火', '锻城准备以新燃料重启七炉，龙庭与契约院都要见证旅店的中立承诺。', 2, ['完成点火宴', 'cook'], ['主持三方契约见证', 'looks']),
    ] },
  },
  timeless_bazaar: {
    accident: accident('订单从明天提前送达', '一批尚未下单的餐点要求现在交付，时序仲裁院要求旅店避免形成时间债。', 0, ['核对各订单所属日期', 'calm'], ['暂存并隔离提前货物', 'carry']),
    chain: { name: '昨日与明日双重合约', factionIndex: 0, steps: [
      chainStep('两份都已签字的合同', '昨日商会和明日廊财团拿出内容冲突、却都带着店主签名的合约。', 0, ['鉴别签署时序', 'calm'], ['分别询问合同来历', 'serve']),
      chainStep('尚未发生的履约宴', '合同要求旅店为一场明天已经取消、昨天却成功举办的宴会提供服务。', 1, ['按时间段划分席位', 'serve'], ['重排跨纪元供货线', 'carry']),
      chainStep('零时仲裁', '时序仲裁院将在零点同时审理两份合同，判决会影响旅店所有未来交易。', 2, ['陈述完整时间账目', 'calm'], ['以共同宴席促成和解', 'cook']),
    ] },
  },
});

function fallbackBlueprint(world) {
  const hook = world.storyHooks?.[0] || `${world.name}出现了影响旅店的异常征兆`;
  return {
    accident: accident(`${world.name}的临时风波`, `${hook}，当地势力请求旅店协助控制影响。`, 0, ['组织现场接待', 'serve'], ['冷静判断异常', 'calm']),
    chain: { name: `${world.name}长期委托`, factionIndex: 0, steps: [
      chainStep('第一封异界委托', `${world.factions?.[0]?.name || '当地势力'}带来一项需要长期协作的请求。`, 0, ['核对委托条件', 'calm'], ['接待委托代表', 'serve']),
      chainStep('委托进入关键阶段', `${world.name}的局势变化迫使旅店在经营中承担更多协调工作。`, 1, ['维持物资动线', 'carry'], ['协调各方来客', 'serve']),
      chainStep('长期合作见证', `当地代表齐聚旅店，准备确认这段跨位面合作是否继续。`, 2, ['主持合作仪式', 'looks'], ['完成最终招待', 'cook']),
    ] },
  };
}

export function worldContentFor(world) {
  return WORLD_EVENT_BLUEPRINTS[world?.id] || fallbackBlueprint(world || { name: '未知世界', factions: [], storyHooks: [] });
}

export function worldSpecialtyFor(world) {
  if (!world) return null;
  if (WORLD_LOCAL_SPECIALTIES[world.id]) return WORLD_LOCAL_SPECIALTIES[world.id];
  const best = Object.entries(world.hospitality?.wantWeights || {}).sort((a, b) => b[1] - a[1])[0]?.[0];
  const skill = ({ meal: 'cook', drink: 'mix', sleep: 'serve', bath: 'clean', play: 'carry', show: 'looks', stroll: 'clean', stargaze: 'calm', game: 'carry', brew: 'calm' })[best] || 'serve';
  return { id: `local_${world.id}`, name: `${world.name}旅历`, skill, bonus: 4, job: '', note: `熟悉${world.name}的需求与礼仪，相关能力 +4。` };
}
