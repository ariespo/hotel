export const PLAYER_PROFILE_KEY_PREFIX = 'wjbdy.player-profile.v1.slot.';

const clean = (value, max) => String(value ?? '').replace(/\r\n?/g, '\n').trim().slice(0, max);

export function defaultPlayerProfile() {
  return {
    role: '多元便携旅店的店主、所有者与经营者',
    background: '',
  };
}

export function normalizePlayerProfile(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const defaults = defaultPlayerProfile();
  return {
    role: clean(source.role, 100) || defaults.role,
    background: clean(source.background, 2400),
  };
}

function availableStorage(storage) {
  if (storage !== undefined) return storage;
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch (err) { return null; }
}

function profileKey(slot) {
  return `${PLAYER_PROFILE_KEY_PREFIX}${Math.max(1, Math.min(3, Math.round(Number(slot) || 1)))}`;
}

export function loadPlayerProfile(slot = 1, storage) {
  const target = availableStorage(storage);
  try {
    const raw = target?.getItem(profileKey(slot));
    return raw ? normalizePlayerProfile(JSON.parse(raw)) : defaultPlayerProfile();
  } catch (err) { return defaultPlayerProfile(); }
}

export function savePlayerProfile(profile, slot = 1, storage) {
  const target = availableStorage(storage);
  const normalized = normalizePlayerProfile(profile);
  try { target?.setItem(profileKey(slot), JSON.stringify(normalized)); } catch (err) { /* storage unavailable */ }
  return normalized;
}

export function resetPlayerProfile(slot = 1, storage) {
  const target = availableStorage(storage);
  const defaults = defaultPlayerProfile();
  try { target?.setItem(profileKey(slot), JSON.stringify(defaults)); } catch (err) { /* storage unavailable */ }
  return defaults;
}
