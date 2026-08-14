export const TUTORIAL_KEY_PREFIX = 'wjbdy.tutorial.v1.slot.';

export const TUTORIAL_STEPS = [
  {
    id: 'welcome', chapter: '准备', title: '先别急着看完所有东西',
    body: '旅店已经准备好营业。引导期间只会一次介绍一个区域；不会替你购买、拆除或修改经营数值。',
    points: ['左右面板暂时收起，地图中央是你现有的旅店。', '随时可以最小化；顶栏会保留“继续引导”按钮。'],
  },
  {
    id: 'map', chapter: '地图', title: '先学会观察旅店', target: '#app canvas',
    body: '地图是所有建造、选中和角色互动发生的地方。',
    points: ['鼠标中键拖动或 WASD 平移；滚轮缩放。', '单击房间、家具或角色可选中；再次点详情按钮查看完整资料。', 'R 旋转正在摆放的房间/家具，Esc 取消当前操作。'],
  },
  {
    id: 'top', chapter: '顶栏', title: '读懂时间与经营状态', target: '#top',
    body: '顶栏只保留全局信息：当前天数、营业状态、速度、界币、声望与常用工具。',
    points: ['1×/2×/4× 控制时间；暂停时仍可查看和规划。', '声望升星会解锁新房间、家具品质与终局目标。', '营业中不会覆盖常规存档，收盘规划期才能主动保存稳定状态。'],
  },
  {
    id: 'rooms', chapter: '规划', title: '房间：决定旅店能做什么', target: '[data-act="ltab"][data-v="room"],[data-act="rail"][data-s="left"][data-v="room"]', afterTarget: '#left', action: { acts: ['ltab', 'rail'], value: 'room' },
    body: '请点击高亮的“房间”。房间蓝图会显示尺寸、价格、星级要求与用途。',
    points: ['选蓝图后在地图贴着已有房间放下；共享墙会自动生成门。', '绿色可放、红色不可放；R 可在落位前旋转。', '已有房间选中后可以升级、装修、移动或拆除。'],
  },
  {
    id: 'furniture', chapter: '规划', title: '家具：先选房间，再看清单', target: '[data-act="ltab"][data-v="furn"],[data-act="rail"][data-s="left"][data-v="furn"]', afterTarget: '#left', action: { acts: ['ltab', 'rail'], value: 'furn' },
    body: '请点击“家具”。家具列表会根据当前选中的房间过滤，避免一次显示所有物品。',
    points: ['先在地图点具体房间；面板只显示该房间可用家具。', '黄色箭头是设备使用面，必须留出可到达的位置；椅子要朝向餐桌。', '选中已放家具可旋转、移动、升级或拆除。'],
  },
  {
    id: 'menu', chapter: '规划', title: '菜单：决定客人能点什么', target: '[data-act="ltab"][data-v="menu"],[data-act="rail"][data-s="left"][data-v="menu"]', afterTarget: '#left', action: { acts: ['ltab', 'rail'], value: 'menu' },
    body: '请点击“菜单”。这里管理餐食与饮品的供应状态。',
    points: ['缺少厨房/酒吧设备、食材或技能时，菜品即使上架也无法制作。', '下架不合适的菜可以减少无效订单。', '收盘规划时点击灶台可研发自定义菜品，AI 接入后还能辅助命名。'],
  },
  {
    id: 'economy', chapter: '规划', title: '经营：库存、定价与热图', target: '[data-act="ltab"][data-v="econ"],[data-act="rail"][data-s="left"][data-v="econ"]', afterTarget: '#left', action: { acts: ['ltab', 'rail'], value: 'econ' },
    body: '请点击“经营”。这里调整库存、加价倍率、自动补货和诊断热图。',
    points: ['购买需要再次单击确认；双击可直接购买。', '加价越高单笔收入越多，但高于 2× 会明显影响评价与点单率。', '卫生热图找脏乱，拥堵热图找动线瓶颈；日结还会扣维护和补货。'],
  },
  {
    id: 'staff', chapter: '人员', title: '员工：岗位、能力与关系', target: '[data-act="rtab"][data-v="staff"],[data-act="rail"][data-s="right"][data-v="staff"]', afterTarget: '#right', action: { acts: ['rtab', 'rail'], value: 'staff' },
    body: '请点击“员工”。这里查看店主、伙计、招聘广告和候选人。',
    points: ['详情页可看技能、性格、关系与背景；性格标签可以点击查看相性。', '岗位决定主责与补位；迎宾会真正带客，服务生只在低优先级下救援迎宾。', '每名员工需要一间休息室；店主不占卧室，也不领取工资。'],
  },
  {
    id: 'coverage', chapter: '人员', title: '岗位覆盖与区域模式', target: '#right',
    body: '负责房间有“优先区域”和“仅限区域”两种真实规则。旧员工默认使用优先区域。',
    points: ['优先区域会优先接本房间任务，但空闲时允许跨区救火。', '仅限区域不会领取区域外工作，只有休息与紧急脱困例外。', '员工详情会直接列出主责、可补位与不会做；工作队列会说明哪个区域无人覆盖。'],
  },
  {
    id: 'facility-chain', chapter: '人员', title: '设施不是自动提款机', target: '#right',
    body: '温泉、台球、放映、庭院、观星、游艺与炼金需要场务完成整条服务链。',
    points: ['流程是：准备设施 → 迎宾带路 → 场务照看 → 客人使用 → 场务或清洁收尾。', '没有场务覆盖时客人会明确显示“等待场务”，不会默默自助赚钱。', '温泉偏清洁，台球/游艺/庭院偏搬运，放映/观星/炼金偏冷静。'],
  },
  {
    id: 'opening', chapter: '营业', title: '准备好了就开门', target: '[data-act="open"]', afterTarget: '#top', action: { acts: ['open'], value: '' },
    body: '点击高亮的“开门营业”，客人将从位面门进入，员工开始自动认领工作。',
    points: ['“营业准备”会区分阻断项与警告项，并检查岗位覆盖、设备使用面和生产线数量。', '一天持续约 5 分钟；营业中可以暂停、变速、查看面板和处理事件。', '厨房会为每份订单预留最短的空闲完整生产线，多名厨师不会挤同一工位。'],
  },
  {
    id: 'guests', chapter: '营业', title: '客人：看需求与耐心', target: '[data-act="rtab"][data-v="guest"],[data-act="rail"][data-s="right"][data-v="guest"]', afterTarget: '#right', action: { acts: ['rtab', 'rail'], value: 'guest' },
    body: '请点击“客人”。这里按客群显示来意、当前状态、耐心、订单与同行人数。',
    points: ['耐心持续下降，长时间无人迎宾、等位或等菜会导致差评和离店。', '客人可能用餐、喝酒、娱乐、泡温泉或住宿；不同设施需要对应房间和家具。', '靠近客人可互动；接入 AI 后可以连续聊天并保留历史。'],
  },
  {
    id: 'tasks', chapter: '营业', title: '工作：找到真正的瓶颈', target: '[data-act="rtab"][data-v="task"],[data-act="rail"][data-s="right"][data-v="task"]', afterTarget: '#right', action: { acts: ['rtab', 'rail'], value: 'task' },
    body: '请点击“工作”。工作队列会区分待领取、前往中与处理中。',
    points: ['“没有匹配岗位”说明排班有问题；“等待员工空闲”说明人手不足或动线太长。', '同一工作只会保留一名有效认领者，其他员工会自动换任务。', '结合拥堵热图与员工状态，可以判断该扩建还是该招人。'],
  },
  {
    id: 'log', chapter: '营业', title: '日志：追踪刚刚发生的事', target: '[data-act="rtab"][data-v="log"],[data-act="rail"][data-s="right"][data-v="log"]', afterTarget: '#right', action: { acts: ['rtab', 'rail'], value: 'log' },
    body: '请点击“日志”。这里记录收入、离店原因、事件与重要状态变化。',
    points: ['遇到“为什么没赚钱/为什么客人走了”，先查看日志，再看工作队列。', '日结会进一步汇总菜品销量、员工完成的工作、评分明细与净收益。'],
  },
  {
    id: 'interaction', chapter: '角色', title: '角色互动与店主资料', target: '#app canvas',
    body: '角色不只是一组数值。点击角色或靠近后按 E，可以打开详情或互动。',
    points: ['员工详情可修改岗位、负责区域、优先级、服装以及店主背景。', '员工聊天会参考双方好感、性格、当前状态和历史对话。', '收盘规划时，过夜客与高好感成年员工还可能出现额外夜间互动。'],
  },
  {
    id: 'tools', chapter: '工具', title: '存档、AI、提示词与设置', target: '[data-act="savemenu"]',
    body: '顶栏右侧是不会频繁使用、但很重要的工具。',
    points: ['“档位”管理 3 个独立存档；营业现场不写常规档，收盘后再保存。', '“设置”配置操作方式、音量与 OpenAI 格式接口。', '“提示词”修改经营小报、聊天、事件与夜间剧情任务，并维护店主背景。', '“帮助”可继续、重开或查阅这套引导。'],
  },
  {
    id: 'closing', chapter: '循环', title: '理解一天的完整循环', target: '#top',
    body: '营业结束后会进入日结：收入已经实时入账，结算只扣工资、维护和补货。',
    points: ['先看净收益，再看六项评分与员工工作统计，找出当天短板。', '接入 AI 后，经营记录会被写成日结章节；确认后进入下一次收盘规划。', '五星是阶段终局，不会强制结束存档；之后仍可无限经营与扩建。'],
  },
  {
    id: 'done', chapter: '完成', title: '现在按自己的节奏经营',
    body: '你已经走完旅店的主要板块。遇到问题时，用“日志 → 工作 → 热图”的顺序排查，通常能很快找到原因。',
    points: ['帮助菜单可以随时重新开始引导。', '无需记住所有细节：每个面板内部仍保留了操作提示。'],
  },
];

function storageFor(storage) {
  if (storage !== undefined) return storage;
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch (err) { return null; }
}

export function tutorialKey(slot = 1) {
  return `${TUTORIAL_KEY_PREFIX}${Math.max(1, Math.round(Number(slot) || 1))}`;
}

export function defaultTutorialState() {
  return { started: false, index: 0, satisfied: false, completed: false, skipped: false };
}

export function normalizeTutorialState(value) {
  const state = value && typeof value === 'object' ? value : {};
  return {
    started: !!state.started,
    index: Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, Math.round(Number(state.index) || 0))),
    satisfied: !!state.satisfied,
    completed: !!state.completed,
    skipped: !!state.skipped,
  };
}

export function loadTutorialState(slot = 1, storage) {
  const target = storageFor(storage);
  if (!target) return defaultTutorialState();
  try { return normalizeTutorialState(JSON.parse(target.getItem(tutorialKey(slot)) || 'null')); }
  catch (err) { return defaultTutorialState(); }
}

export function saveTutorialState(state, slot = 1, storage) {
  const normalized = normalizeTutorialState(state);
  const target = storageFor(storage);
  try { target?.setItem(tutorialKey(slot), JSON.stringify(normalized)); } catch (err) { /* storage unavailable */ }
  return normalized;
}

export function resetTutorialState(slot = 1, storage) {
  return saveTutorialState({ started: true, index: 0, satisfied: false, completed: false, skipped: false }, slot, storage);
}

export function advanceTutorialState(state) {
  const current = normalizeTutorialState(state);
  if (current.index >= TUTORIAL_STEPS.length - 1) {
    return { ...current, started: true, satisfied: true, completed: true, skipped: false };
  }
  return { ...current, started: true, index: current.index + 1, satisfied: false, completed: false, skipped: false };
}

export function retreatTutorialState(state) {
  const current = normalizeTutorialState(state);
  return {
    ...current,
    started: true,
    index: Math.max(0, current.index - 1),
    satisfied: false,
    completed: false,
    skipped: false,
  };
}

export function tutorialActionMatches(step, act, value = '') {
  if (!step?.action) return false;
  return step.action.acts.includes(String(act || '')) && String(value || '') === String(step.action.value || '');
}
