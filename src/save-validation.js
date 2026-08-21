import { migrateGameSaveData } from './save-schema.js';
import { Tavern } from './world.js';
import { verifyLegacyLayoutSeal } from './save-schema.js';

const clone = (value) => JSON.parse(JSON.stringify(value));

export function parseValidateSave(input) {
  const raw = typeof input === 'string' ? JSON.parse(input) : clone(input);
  const sourceVersion = Number(raw?.meta?.version ?? raw?.version) || 0;
  const normalizedData = migrateGameSaveData(raw);
  const trustedMode = normalizedData.sim?.campaign?.mode === 'legacy' && verifyLegacyLayoutSeal(normalizedData) ? 'legacy' : 'tutorial';
  const strictLoadedTavern = Tavern.load(normalizedData.tavern, { mode: trustedMode, strict: true });
  normalizedData.tavern = strictLoadedTavern.serialize();
  normalizedData.sim = { ...normalizedData.sim, campaign: { ...(normalizedData.sim.campaign || {}), mode: trustedMode } };
  return { normalizedData, trustedMode, strictLoadedTavern, sourceVersion };
}
