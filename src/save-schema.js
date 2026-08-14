import { DEFAULT_RESTOCK_TARGETS } from './sim.js';
import { starsOf } from './data.js';

export const SAVE_SCHEMA_VERSION = 4;

function assertShape(data) {
  if (!data || typeof data !== 'object' || !data.tavern || !data.sim || !data.sim.econ || !Array.isArray(data.sim.staff)) {
    throw new Error('存档缺少旅店、经营或员工数据');
  }
}

/** 逐版本迁移旧档；任何新字段都必须在这里给出确定的默认值。 */
export function migrateGameSaveData(source) {
  const data = JSON.parse(JSON.stringify(source));
  assertShape(data);
  let version = Math.max(0, Math.round(Number(data.meta?.version) || 0));
  const originalVersion = version;
  if (version < 1) {
    data.meta = { ...(data.meta || {}), version: 1, savedAt: data.meta?.savedAt || Date.now() };
    version = 1;
  }
  if (version < 2) {
    data.meta.version = 2;
    data.meta.slot = Math.max(1, Math.min(3, Number(data.meta.slot) || 1));
    version = 2;
  }
  if (version < 3) {
    data.sim.econ.restockTargets = { ...DEFAULT_RESTOCK_TARGETS, ...(data.sim.econ.restockTargets || {}) };
    data.sim.econ.restockBudget = Math.max(0, Math.round(Number(data.sim.econ.restockBudget) || 0));
    data.sim.econ.dishMastery = data.sim.econ.dishMastery && typeof data.sim.econ.dishMastery === 'object' ? data.sim.econ.dishMastery : {};
    data.sim.regulars = Array.isArray(data.sim.regulars) ? data.sim.regulars : [];
    data.sim.eventChains = data.sim.eventChains && typeof data.sim.eventChains === 'object' ? data.sim.eventChains : {};
    data.meta.version = 3;
    version = 3;
  }
  if (version < 4) {
    data.sim.econ.certifiedStars = Math.max(0, Math.min(5, Math.round(Number(data.sim.econ.certifiedStars) || starsOf(data.sim.econ.rep))));
    data.sim.econ.certificationHistory = Array.isArray(data.sim.econ.certificationHistory) ? data.sim.econ.certificationHistory : [];
    for (const staff of data.sim.staff) staff.roomMode = staff.roomMode === 'strict' ? 'strict' : 'prefer';
    for (const staff of data.sim.pool || []) staff.roomMode = staff.roomMode === 'strict' ? 'strict' : 'prefer';
    for (const ad of data.sim.ads || []) for (const staff of ad.cands || []) staff.roomMode = staff.roomMode === 'strict' ? 'strict' : 'prefer';
    data.meta.version = 4;
    version = 4;
  }
  if (version > SAVE_SCHEMA_VERSION) throw new Error(`存档版本 ${version} 高于当前支持的 ${SAVE_SCHEMA_VERSION}`);
  data.meta = { ...data.meta, version: SAVE_SCHEMA_VERSION, migratedAt: originalVersion < SAVE_SCHEMA_VERSION ? Date.now() : data.meta.migratedAt || 0 };
  assertShape(data);
  return data;
}

export function parseAndMigrateGameSave(raw) {
  if (typeof raw !== 'string' || !raw.trim()) throw new Error('存档内容为空');
  let parsed;
  try { parsed = JSON.parse(raw); } catch (error) { throw new Error('存档不是有效 JSON'); }
  return migrateGameSaveData(parsed);
}

export function stringifyGameSave(data) {
  const migrated = migrateGameSaveData(data);
  migrated.meta.savedAt = Date.now();
  return JSON.stringify(migrated);
}
