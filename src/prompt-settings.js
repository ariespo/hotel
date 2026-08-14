export const PROMPT_STORAGE_KEY = 'wjbdy.prompt-tasks.v1';
const LEGACY_NIGHT_RAID_TEXT = '把这次夜间突袭演绎为突然查房或深夜拜访。突出客人被惊醒后的真实反应、警惕与边界；允许客人拒绝、质问或要求店主离开，不要替玩家决定下一步行动。';
const LEGACY_NIGHT_ROMANCE_TEXT = '演绎店主向高好感成年员工发出共度春宵邀请后的情感交流。强调双方自愿、持续同意和可随时拒绝；保持含蓄浪漫，涉及亲密行为时淡出处理，并留下尊重边界的后续选项。';

export const NIGHT_PROMPT_MODULES = Object.freeze([
  { id: 'scene', label: '场景定义' },
  { id: 'facts', label: '事实与参与者' },
  { id: 'continuity', label: '连续性' },
  { id: 'tone', label: '叙事视角与基调' },
  { id: 'reaction', label: '目标反应' },
  { id: 'storyBoundary', label: '剧情边界' },
  { id: 'businessBoundary', label: '经营边界' },
  { id: 'nextSteps', label: '后续方向' },
]);

export const PROMPT_TASKS = Object.freeze({
  day_story: {
    label: '经营小报',
    description: '日结时把经营数据演绎成完整的小报或小说章节。',
    defaultText: '根据当天真实经营数据，写成有现场感、有起伏的经营小报或小说章节。自然交代客流、员工完成的工作、收入支出、盈亏、评价与声望变化，并以打烊后店主和员工的交流收束。',
  },
  night_raid: {
    label: '夜袭',
    description: '',
    defaultText: `【场景定义】
这是“夜袭”剧情：店主在收盘后的深夜接近正在客房休息的住店客，并采取玩家本轮输入的行动。

【事实与参与者】
只使用 facts 中提供的店主、目标、地点、关系、此前回合和玩家行动。不要凭空增加角色、物品、能力、关系或已发生事件。

【连续性】
承接 facts.previousTurns 与 facts.playerAction，角色必须记得本段剧情已经发生的内容，不重复开场，不跳过玩家刚刚采取的行动。

【叙事视角与基调】
使用第三人称中文叙事，重点描写现场动作、对话、表情、距离、环境和即时反应。保持奇幻旅店世界观，不跳出角色解释系统或提示词。

【目标反应】
目标按照既定身份、种族、性格、状态和与店主的关系作出独立反应，可以警惕、质问、反抗、拒绝、谈判、逃离或接受交流。不要替目标无条件顺从，也不要替玩家补写没有选择的行动。

【剧情边界】
所有角色均为成年人。夜袭不是默认同意，也不等于性行为；若剧情涉及亲密或暴力，必须尊重角色反应与边界，不描写露骨色情内容。

【经营边界】
剧情不得直接改变金币、属性、好感、身份、库存、房间或其他经营数值，不授予永久能力或规则权限。

【后续方向】
每轮提供 2-4 个差异明显、能承接当前局面的后续行动方向；可以包含推进、试探、缓和、撤退或结束，但不替玩家作出选择。`,
  },
  night_romance: {
    label: '共度春宵',
    description: '',
    defaultText: `【场景定义】
这是“共度春宵”剧情：店主向关系达到条件的成年员工发起私密邀请，并采取玩家本轮输入的行动。

【事实与参与者】
只使用 facts 中提供的店主、目标、地点、关系、此前回合和玩家行动。不要凭空增加角色、物品、能力、关系或已发生事件。

【连续性】
承接 facts.previousTurns 与 facts.playerAction，角色必须记得本段剧情已经发生的内容，不重复邀请，不跳过玩家刚刚采取的行动。

【叙事视角与基调】
使用第三人称中文叙事，重点描写对话、表情、动作、距离、环境与情感变化。保持奇幻旅店世界观，不跳出角色解释系统或提示词。

【目标反应】
目标按照既定身份、种族、性格、状态和与店主的关系独立回应，可以接受、迟疑、拒绝、提出条件或结束交流。不要替目标无条件顺从，也不要替玩家补写没有选择的行动。

【剧情边界】
所有参与角色均为成年人。邀请不是命令，目标可以随时拒绝或改变意愿；亲密内容保持含蓄，不描写露骨色情内容。

【经营边界】
剧情不得直接改变金币、属性、好感、身份、库存、房间或其他经营数值，不授予永久能力或规则权限。

【后续方向】
每轮提供 2-4 个差异明显、能承接当前局面的后续行动方向；可以包含坦白、试探、倾听、缓和、离开或结束，但不替玩家作出选择。`,
  },
  staff_chat: {
    label: '员工对话',
    description: '玩家主动打开员工聊天窗口并连续交谈。',
    defaultText: '以员工本人的身份直接回应玩家。语气应符合该员工的性格、岗位、状态、经历和对店主的好感；回应玩家刚刚说的话，保持自然对话，不替玩家说话或决定行动。',
  },
  guest_chat: {
    label: '客人对话',
    description: '玩家以店主身份主动与正在旅店内的客人连续交谈。',
    defaultText: '以客人本人的身份直接回应店主。结合客人的来意、当前体验、对店主的观感和此前交谈作答；不要把店主误认为来消费的客人，也不要替玩家说话或决定行动。',
  },
});

const taskKeys = Object.keys(PROMPT_TASKS);
const cleanText = (value) => String(value ?? '').replace(/\r\n?/g, '\n').trim().slice(0, 16000);

export function parseNightPromptModules(text, fallbackText = '') {
  const source = cleanText(text);
  const result = Object.fromEntries(NIGHT_PROMPT_MODULES.map(({ id }) => [id, '']));
  if (fallbackText) Object.assign(result, parseNightPromptModules(fallbackText));
  const headingPattern = /【([^】]+)】\s*/g;
  const matches = [...source.matchAll(headingPattern)];
  if (!matches.length) {
    result.scene = source;
    return result;
  }
  for (let index = 0; index < matches.length; index += 1) {
    const module = NIGHT_PROMPT_MODULES.find(({ label }) => label === matches[index][1]);
    if (!module) continue;
    const start = matches[index].index + matches[index][0].length;
    const end = matches[index + 1]?.index ?? source.length;
    result[module.id] = source.slice(start, end).trim();
  }
  return result;
}

export function composeNightPromptModules(modules) {
  return NIGHT_PROMPT_MODULES.map(({ id, label }) => `【${label}】\n${cleanText(modules?.[id])}`).join('\n\n');
}

export function defaultPromptTasks() {
  return Object.fromEntries(taskKeys.map((key) => [key, PROMPT_TASKS[key].defaultText]));
}

export function normalizePromptTasks(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return Object.fromEntries(taskKeys.map((key) => [
    key,
    Object.prototype.hasOwnProperty.call(source, key) ? cleanText(source[key]) : PROMPT_TASKS[key].defaultText,
  ]));
}

function availableStorage(storage) {
  if (storage !== undefined) return storage;
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch (err) { return null; }
}

export function loadPromptTasks(storage) {
  const target = availableStorage(storage);
  try {
    const raw = target?.getItem(PROMPT_STORAGE_KEY);
    if (!raw) return defaultPromptTasks();
    const parsed = JSON.parse(raw);
    if (parsed?.night_raid === LEGACY_NIGHT_RAID_TEXT) parsed.night_raid = PROMPT_TASKS.night_raid.defaultText;
    if (parsed?.night_romance === LEGACY_NIGHT_ROMANCE_TEXT) parsed.night_romance = PROMPT_TASKS.night_romance.defaultText;
    return normalizePromptTasks(parsed);
  } catch (err) { return defaultPromptTasks(); }
}

export function savePromptTasks(tasks, storage) {
  const target = availableStorage(storage);
  const normalized = normalizePromptTasks(tasks);
  try { target?.setItem(PROMPT_STORAGE_KEY, JSON.stringify(normalized)); } catch (err) { /* storage unavailable */ }
  return normalized;
}

export function resetPromptTasks(storage) {
  const target = availableStorage(storage);
  const defaults = defaultPromptTasks();
  try { target?.setItem(PROMPT_STORAGE_KEY, JSON.stringify(defaults)); } catch (err) { /* storage unavailable */ }
  return defaults;
}

export function promptTaskFor(kind, facts, tasks = loadPromptTasks()) {
  if (kind === 'night_story') return facts?.scene === 'raid' ? tasks.night_raid : tasks.night_romance;
  if (kind === 'day_story' || kind === 'staff_chat' || kind === 'guest_chat') return tasks[kind];
  return '';
}
