import { meetingTopicsFor, MEETING_TOPIC_CATALOG } from './sim.js';

export function beginProductionMeeting(sim, first = false) {
  return sim.beginMeeting(first);
}

export function meetingAIContext(sim) {
  const state = sim.meetingState || {};
  return { day: sim.econ.day, cards: (state.cards || []).map((card) => ({ id: card.id, category: card.category, title: card.title, context: card.context || card.text, urgent: !!card.urgent })), remainingAP: state.points };
}

export function validateMeetingLines(raw, cards = []) {
  const allowed = new Map(cards.map((card) => [card.id, card]));
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.lines)) return null;
  const lines = raw.lines.filter((row) => allowed.has(row?.id) && typeof row.line === 'string' && row.line.trim()).map((row) => ({ id: row.id, line: row.line.trim().slice(0, 180) }));
  return lines.length ? lines : null;
}

export function applyMeetingLines(sim, raw) {
  const lines = validateMeetingLines(raw, sim.meetingState?.cards || []);
  const local = (sim.meetingState?.cards || []).map((card) => ({ id: card.id, line: card.line || '大家把这件事记下了。' }));
  sim.meetingState.dialogueAI = lines || local;
  sim.meetingState.aiFallback = !lines;
  return sim.meetingState.dialogueAI;
}

export function meetingAction(sim, id) { return sim.resolveMeetingCard(id); }

export function closeMeetingWithConfirmation(sim, confirmed = false) {
  if (!sim.meetingState?.open) return { ok: false, needsConfirmation: false };
  if (sim.meetingState.points > 0 && !confirmed) return { ok: false, needsConfirmation: true, remainingAP: sim.meetingState.points };
  return { ok: sim.endMeeting(confirmed), needsConfirmation: false };
}

export function meetingCatalogSnapshot(sim, first = false) { return meetingTopicsFor(sim, first).map((card) => ({ id: card.id, category: card.category, urgent: !!card.urgent, context: card.context || '' })); }
