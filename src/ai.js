// AI 接入层：配置只保存在当前浏览器，不进入游戏存档。
export const AI_CONFIG_KEY = 'wjbdy.ai.v1';

export const AI_PRESETS = Object.freeze([
  { id: 'gpt', name: 'GPT', baseUrl: 'https://api.openai.com/v1' },
  { id: 'claude', name: 'Claude', baseUrl: 'https://api.anthropic.com/v1' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com' },
  { id: 'glm', name: 'GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4' },
  { id: 'kimi', name: 'Kimi', baseUrl: 'https://api.moonshot.cn/v1' },
  { id: 'custom', name: '自定义', baseUrl: '' },
]);

const DEFAULT_CONFIG = Object.freeze({
  preset: 'gpt',
  baseUrl: AI_PRESETS[0].baseUrl,
  apiKey: '',
  model: '',
  models: [],
  refreshedAt: 0,
});

export function normalizeAIBaseUrl(value) {
  let url = String(value || '').trim().replace(/\/+$/, '');
  url = url.replace(/\/chat\/completions$/i, '').replace(/\/models$/i, '').replace(/\/+$/, '');
  return url;
}

export function presetById(id) {
  return AI_PRESETS.find((item) => item.id === id) || AI_PRESETS[AI_PRESETS.length - 1];
}

function cleanModels(models) {
  if (!Array.isArray(models)) return [];
  return [...new Set(models.map((item) => String(item || '').trim()).filter(Boolean))]
    .slice(0, 500)
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));
}

export function loadAIConfig(storage = globalThis.localStorage) {
  let saved = {};
  try { saved = JSON.parse(storage?.getItem(AI_CONFIG_KEY) || '{}') || {}; } catch (err) { /* 使用默认值 */ }
  const preset = AI_PRESETS.some((item) => item.id === saved.preset) ? saved.preset : DEFAULT_CONFIG.preset;
  const fallbackUrl = presetById(preset).baseUrl || DEFAULT_CONFIG.baseUrl;
  const models = cleanModels(saved.models);
  const model = typeof saved.model === 'string' ? saved.model.trim() : '';
  return {
    preset,
    baseUrl: normalizeAIBaseUrl(saved.baseUrl || fallbackUrl),
    apiKey: typeof saved.apiKey === 'string' ? saved.apiKey : '',
    model,
    models: model && !models.includes(model) ? [model, ...models] : models,
    refreshedAt: Number.isFinite(saved.refreshedAt) ? saved.refreshedAt : 0,
  };
}

export function saveAIConfig(config, storage = globalThis.localStorage) {
  const next = {
    preset: AI_PRESETS.some((item) => item.id === config.preset) ? config.preset : 'custom',
    baseUrl: normalizeAIBaseUrl(config.baseUrl),
    apiKey: String(config.apiKey || '').trim(),
    model: String(config.model || '').trim(),
    models: cleanModels(config.models),
    refreshedAt: Number.isFinite(config.refreshedAt) ? config.refreshedAt : 0,
  };
  storage?.setItem(AI_CONFIG_KEY, JSON.stringify(next));
  return next;
}

function validateConfig(config, requireModel = false) {
  const baseUrl = normalizeAIBaseUrl(config.baseUrl);
  if (!baseUrl) throw new Error('请先填写接口地址');
  let parsed;
  try { parsed = new URL(baseUrl); } catch (err) { throw new Error('接口地址格式不正确'); }
  if (parsed.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsed.hostname)) {
    throw new Error('接口地址必须使用 HTTPS');
  }
  if (!String(config.apiKey || '').trim()) throw new Error('请先填写 API Key');
  if (requireModel && !String(config.model || '').trim()) throw new Error('请先刷新并选择模型');
  return { ...config, baseUrl, apiKey: String(config.apiKey).trim() };
}

function authHeaders(config) {
  const headers = { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' };
  try {
    if (new URL(config.baseUrl).hostname === 'api.anthropic.com') {
      headers['x-api-key'] = config.apiKey;
      headers['anthropic-version'] = '2023-06-01';
    }
  } catch (err) { /* 已由 validateConfig 处理 */ }
  return headers;
}

async function readResponse(response) {
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : {}; } catch (err) { /* 保留原文用于报错 */ }
  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || text.slice(0, 240) || `HTTP ${response.status}`;
    throw new Error(`接口返回 ${response.status}：${message}`);
  }
  if (!payload) throw new Error('接口没有返回 JSON，请检查地址是否为 OpenAI 兼容 API 根地址');
  return payload;
}

function localDevelopment() {
  if (typeof location === 'undefined') return false;
  return ['localhost', '127.0.0.1'].includes(location.hostname);
}

async function requestAI(action, config, body, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw new Error('当前环境不支持网络请求');
  const timeout = Number(options.timeoutMs ?? 15000);
  // 即使调用方传入取消信号，也必须有硬性的 15 秒上限；两者合并后
  // 任一信号触发都会中止请求，避免日报/会议被悬挂的 fetch 卡住。
  const timeoutController = timeout > 0 ? new AbortController() : null;
  const combinedController = options.signal || timeoutController ? new AbortController() : null;
  const abort = () => combinedController?.abort();
  if (options.signal) {
    if (options.signal.aborted) abort();
    else options.signal.addEventListener('abort', abort, { once: true });
  }
  if (timeoutController) timeoutController.signal.addEventListener('abort', abort, { once: true });
  const signal = combinedController?.signal || options.signal;
  const timer = timeoutController ? setTimeout(() => timeoutController.abort(), timeout) : null;
  try {
  if (!localDevelopment()) {
    const response = await fetchImpl('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, baseUrl: config.baseUrl, apiKey: config.apiKey, ...body }),
      signal,
    });
    return readResponse(response);
  }

  // 本地静态服务器没有 Serverless API，开发时直连；正式部署统一走同源代理。
  const suffix = action === 'models' ? 'models' : 'chat/completions';
  const response = await fetchImpl(`${config.baseUrl}/${suffix}`, {
    method: action === 'models' ? 'GET' : 'POST',
    headers: authHeaders(config),
    body: action === 'models' ? undefined : JSON.stringify(body),
    signal,
  });
  return readResponse(response);
  } finally {
    if (timer) clearTimeout(timer);
    if (options.signal) options.signal.removeEventListener('abort', abort);
  }
}

export function parseModelList(payload) {
  const source = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.models) ? payload.models : [];
  return cleanModels(source.map((item) => typeof item === 'string' ? item : item?.id || item?.name));
}

export async function refreshAIModels(config, options = {}) {
  const valid = validateConfig(config);
  const payload = await requestAI('models', valid, {}, options);
  const models = parseModelList(payload);
  if (!models.length) throw new Error('接口连接成功，但没有返回可选模型');
  const selected = models.includes(valid.model) ? valid.model : models[0];
  return { ...valid, models, model: selected, refreshedAt: Date.now() };
}

export async function chatWithAI(messages, options = {}) {
  const config = validateConfig(options.config || loadAIConfig(), true);
  let structuredOptions = options.jsonMode ? { response_format: { type: 'json_object' } } : {};
  try {
    // DeepSeek V4 默认开启思考模式；思考 token 也计入 max_tokens，长篇日结可能
    // 在真正输出 content 前就耗尽额度。游戏任务只需要结构化成稿，因此关闭思考并
    // 启用其官方 JSON Output，既减少等待，也避免得到空 content。
    if (new URL(config.baseUrl).hostname === 'api.deepseek.com') {
      structuredOptions = {
        ...structuredOptions,
        thinking: { type: 'disabled' },
        response_format: { type: 'json_object' },
      };
    }
  } catch (err) { /* 地址已由 validateConfig 校验 */ }
  const payload = await requestAI('chat', config, {
    model: config.model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 500,
    stream: false,
    ...structuredOptions,
  }, options);
  const message = payload?.choices?.[0]?.message;
  const rawContent = message?.content ?? payload?.output_text;
  const content = typeof rawContent === 'string' ? rawContent
    : Array.isArray(rawContent) ? rawContent.map((part) => typeof part === 'string' ? part : part?.text || part?.content || '').join('')
    : rawContent && typeof rawContent === 'object' ? JSON.stringify(rawContent) : '';
  if (!content.trim()) throw new Error('模型没有返回结构化正文，请确认所选模型支持 JSON 输出');
  return { content, payload };
}
