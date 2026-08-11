export const PROMPT_STORAGE_KEY = 'wjbdy.prompt-tasks.v1';

export const PROMPT_TASKS = Object.freeze({
  day_story: {
    label: '经营小报',
    description: '日结时把经营数据演绎成完整的小报或小说章节。',
    defaultText: '根据当天真实经营数据，写成有现场感、有起伏的经营小报或小说章节。自然交代客流、员工完成的工作、收入支出、盈亏、评价与声望变化，并以打烊后店主和员工的交流收束。',
  },
  night_raid: {
    label: '触发夜袭',
    description: '店主靠近正在客房睡觉的住店客并发起夜间拜访。',
    defaultText: '把这次夜间突袭演绎为突然查房或深夜拜访。突出客人被惊醒后的真实反应、警惕与边界；允许客人拒绝、质问或要求店主离开，不要替玩家决定下一步行动。',
  },
  night_romance: {
    label: '共度春宵',
    description: '与高好感成年员工发起私密邀请。',
    defaultText: '演绎店主向高好感成年员工发出共度春宵邀请后的情感交流。强调双方自愿、持续同意和可随时拒绝；保持含蓄浪漫，涉及亲密行为时淡出处理，并留下尊重边界的后续选项。',
  },
  staff_chat: {
    label: '员工对话',
    description: '玩家主动打开员工聊天窗口并连续交谈。',
    defaultText: '以员工本人的身份直接回应玩家。语气应符合该员工的性格、岗位、状态、经历和对店主的好感；回应玩家刚刚说的话，保持自然对话，不替玩家说话或决定行动。',
  },
});

const taskKeys = Object.keys(PROMPT_TASKS);
const cleanText = (value) => String(value ?? '').replace(/\r\n?/g, '\n').trim().slice(0, 2000);

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
    return raw ? normalizePromptTasks(JSON.parse(raw)) : defaultPromptTasks();
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
  if (kind === 'day_story' || kind === 'staff_chat') return tasks[kind];
  return '';
}
