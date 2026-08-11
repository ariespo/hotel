import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const MAX_REQUEST_BYTES = 64 * 1024;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
export const config = { maxDuration: 60 };

function normalizeBaseUrl(value) {
  let url = String(value || '').trim().replace(/\/+$/, '');
  return url.replace(/\/chat\/completions$/i, '').replace(/\/models$/i, '').replace(/\/+$/, '');
}

function assertPublicHttpsBase(value) {
  let url;
  try { url = new URL(normalizeBaseUrl(value)); } catch (err) { throw new Error('接口地址格式不正确'); }
  if (url.protocol !== 'https:') throw new Error('正式环境仅允许 HTTPS 接口');
  if (url.username || url.password) throw new Error('接口地址不能包含账号信息');
  if (url.port && url.port !== '443') throw new Error('接口地址端口不受支持');
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  const blocked = host === 'localhost' || host.endsWith('.local') || host === '0.0.0.0' || host === '::1'
    || /^127\./.test(host) || /^10\./.test(host) || /^169\.254\./.test(host) || /^192\.168\./.test(host)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(host) || /^fc/i.test(host) || /^fd/i.test(host) || /^fe[89ab]/i.test(host);
  if (blocked) throw new Error('不允许访问本地或内网地址');
  url.hash = '';
  url.search = '';
  return url.toString().replace(/\/+$/, '');
}

function isPrivateAddress(address) {
  const ip = String(address || '').toLowerCase().replace(/^::ffff:/, '');
  if (isIP(ip) === 4) {
    return /^127\./.test(ip) || /^10\./.test(ip) || /^169\.254\./.test(ip) || /^192\.168\./.test(ip)
      || /^172\.(1[6-9]|2\d|3[01])\./.test(ip) || ip === '0.0.0.0';
  }
  return ip === '::' || ip === '::1' || /^fc/i.test(ip) || /^fd/i.test(ip) || /^fe[89ab]/i.test(ip);
}

async function assertPublicDns(baseUrl) {
  const host = new URL(baseUrl).hostname;
  if (isIP(host)) {
    if (isPrivateAddress(host)) throw new Error('不允许访问本地或内网地址');
    return;
  }
  const addresses = await lookup(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((item) => isPrivateAddress(item.address))) {
    throw new Error('接口域名解析到了本地或内网地址');
  }
}

function jsonBody(req) {
  if (typeof req.body === 'object' && req.body) return req.body;
  if (typeof req.body !== 'string') return {};
  if (Buffer.byteLength(req.body, 'utf8') > MAX_REQUEST_BYTES) throw new Error('请求内容过大');
  return JSON.parse(req.body || '{}');
}

function sendError(res, status, message) {
  res.status(status).json({ error: { message } });
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { sendError(res, 405, '仅支持 POST'); return; }

  let body;
  let baseUrl;
  try {
    body = jsonBody(req);
    if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_REQUEST_BYTES) throw new Error('请求内容过大');
    baseUrl = assertPublicHttpsBase(body.baseUrl);
    await assertPublicDns(baseUrl);
    if (!String(body.apiKey || '').trim()) throw new Error('缺少 API Key');
    if (!['models', 'chat'].includes(body.action)) throw new Error('未知操作');
  } catch (err) { sendError(res, 400, err.message || '请求无效'); return; }

  const suffix = body.action === 'models' ? 'models' : 'chat/completions';
  const headers = {
    Authorization: `Bearer ${String(body.apiKey).trim()}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (new URL(baseUrl).hostname === 'api.anthropic.com') {
    headers['x-api-key'] = String(body.apiKey).trim();
    headers['anthropic-version'] = '2023-06-01';
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const upstream = await fetch(`${baseUrl}/${suffix}`, {
      method: body.action === 'models' ? 'GET' : 'POST',
      headers,
      body: body.action === 'models' ? undefined : JSON.stringify({
        model: body.model,
        messages: body.messages,
        temperature: body.temperature,
        max_tokens: body.max_tokens,
        stream: false,
        ...(['enabled', 'disabled'].includes(body.thinking?.type)
          ? { thinking: { type: body.thinking.type } }
          : {}),
        ...(body.response_format?.type === 'json_object'
          ? { response_format: { type: 'json_object' } }
          : {}),
      }),
      redirect: 'error',
      signal: controller.signal,
    });
    const text = await upstream.text();
    if (Buffer.byteLength(text, 'utf8') > MAX_RESPONSE_BYTES) { sendError(res, 502, '上游响应过大'); return; }
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(text || '{}');
  } catch (err) {
    sendError(res, err?.name === 'AbortError' ? 504 : 502, err?.name === 'AbortError' ? '上游接口响应超时' : '无法连接上游接口');
  } finally {
    clearTimeout(timer);
  }
}
