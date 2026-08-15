import { DEFAULT_RESTOCK_TARGETS } from './sim.js';
import { starsOf, WORLD_PROFILES, worldsForStars } from './data.js';
import { RACE_NAMES } from './chargen.js';
import { normalizeCustomWorld } from './world-system.js';

export const SAVE_SCHEMA_VERSION = 6;

function stableHash(text) {
  let hash = 2166136261;
  for (const char of String(text || '')) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

function legacyTravelIdentity(person, stars, salt = '') {
  const available = worldsForStars(stars);
  const raceIndex = RACE_NAMES.indexOf(person.race);
  const compatible = available.filter((world) => world.population.some((resident) => resident.raceId === raceIndex));
  const pool = compatible.length ? compatible : available;
  const hash = stableHash(`${person.name || person.id}:${person.race}:${salt}`);
  const world = pool[hash % pool.length] || WORLD_PROFILES[0];
  return {
    originWorldId: world.id,
    homeRegion: world.regions[Math.floor(hash / 7) % world.regions.length].name,
    travelOccupation: world.travel.occupations[Math.floor(hash / 17) % world.travel.occupations.length],
    travelPurpose: world.travel.purposes[Math.floor(hash / 29) % world.travel.purposes.length],
  };
}

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
  if (version < 5) {
    const stars = Math.max(0, Math.min(5, Math.round(Number(data.sim.econ.certifiedStars) || starsOf(data.sim.econ.rep))));
    const knowledge = {};
    for (const world of WORLD_PROFILES) knowledge[world.id] = { level: 0, arrivals: 0, served: 0, firstDay: 0, reviewed: false, journeyAsked: false };
    for (const profile of data.sim.regulars || []) {
      const identity = profile.originWorldId ? {} : legacyTravelIdentity(profile, stars, 'regular');
      Object.assign(profile, identity);
      const row = knowledge[profile.originWorldId];
      if (row) { row.level = Math.max(row.level, 1); row.arrivals++; row.firstDay ||= Math.max(1, Number(profile.lastVisitDay) || 1); }
    }
    for (const group of data.sim.lodgers || []) {
      const lead = group.members?.[0] || group;
      const identity = group.originWorldId ? {} : legacyTravelIdentity(lead, stars, `lodger:${group.id}`);
      Object.assign(group, identity);
      group.worldIds = Array.isArray(group.worldIds) && group.worldIds.length ? group.worldIds : [group.originWorldId];
      for (const member of group.members || []) Object.assign(member, member.originWorldId ? {} : { ...identity });
    }
    data.sim.econ.worldKnowledge = { ...knowledge, ...(data.sim.econ.worldKnowledge || {}) };
    data.sim.econ.worldForecast = Array.isArray(data.sim.econ.worldForecast) ? data.sim.econ.worldForecast : [];
    data.meta.version = 5;
    version = 5;
  }
  if (version < 6) {
    const econ = data.sim.econ;
    econ.customWorlds = Array.isArray(econ.customWorlds) ? econ.customWorlds.slice(0, 8).map((world) => normalizeCustomWorld(world, world.id)) : [];
    econ.archivedWorlds = Array.isArray(econ.archivedWorlds) ? econ.archivedWorlds.slice(0, 40) : [];
    const knownIds = new Set([...WORLD_PROFILES.map((world) => world.id), ...econ.customWorlds.map((world) => world.id)]);
    econ.currentWorldId = knownIds.has(econ.currentWorldId) ? econ.currentWorldId : 'hearth_coast';
    econ.pendingWorldSwitch = econ.pendingWorldSwitch && knownIds.has(econ.pendingWorldSwitch.worldId) ? econ.pendingWorldSwitch : null;
    econ.worldVisits = econ.worldVisits && typeof econ.worldVisits === 'object' ? econ.worldVisits : { [econ.currentWorldId]: 1 };
    for (const world of econ.customWorlds) econ.worldKnowledge[world.id] ||= { level: 4, arrivals: 0, served: 0, firstDay: econ.day || 1, reviewed: true, journeyAsked: true };
    data.meta.version = 6;
    version = 6;
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
