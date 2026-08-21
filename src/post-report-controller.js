export function currentPostReport(sim) { return sim.currentPostReportEvent(); }
/**
 * Production and tests share the same dispatch point.  A known event is
 * opened by its dedicated presenter; no generic acknowledgement may consume
 * it before that presenter has handled the event.
 */
export function drivePostReportEvents(sim, handlers = {}) {
  const event = currentPostReport(sim);
  if (!event) {
    sim.campaign.phase = 'meeting';
    handlers.meeting?.(null);
    return null;
  }
  sim.campaign.phase = 'post-report-events';
  (handlers[event.kind] || handlers.generic)?.(event);
  return event;
}
/** Keep the certification stat alive through the visual celebration. */
export function continueStarCelebration(stat, continueReport) {
  if (!stat || typeof continueReport !== 'function') return false;
  continueReport(stat);
  return true;
}
export function advancePostReport(sim, id) { return id ? sim.consumePostReportEvent(id) : null; }
export function completeCurrentAndAdvance(sim, expectedKind, onNext = () => {}) {
  const event = currentPostReport(sim);
  if (!event || (expectedKind && event.kind !== expectedKind)) return false;
  advancePostReport(sim, event.id);
  const next = currentPostReport(sim);
  if (next) onNext(next); else { sim.campaign.phase = 'meeting'; onNext(null); }
  return true;
}
export function ackCertification(sim, onNext) { return completeCurrentAndAdvance(sim, 'certification', onNext); }
export function acceptInvite(sim) {
  const event = currentPostReport(sim); if (!event || event.kind !== 'contest-invite') return null;
  const active = sim.acceptContestInvite();
  if (!active) return null;
  if (event) advancePostReport(sim, event.id);
  sim.queuePostReportEvent({ id: `active-contest-${sim.econ.day}`, kind: 'active-contest', text: '大赛进行中。' });
  return active;
}
export function declineInvite(sim) { const event = currentPostReport(sim); if (!event || event.kind !== 'contest-invite') return false; const result = sim.declineContestInvite(); if (result) advancePostReport(sim, event.id); return result; }
export function finishActiveMatch(sim, tactics) {
  const current = currentPostReport(sim); if (!current || current.kind !== 'active-contest') return null;
  const result = sim.finishContestMatch(tactics); if (!result) return null;
  const event = currentPostReport(sim); if (event?.kind === 'active-contest') advancePostReport(sim, event.id);
  return result;
}
export function ackFinale(sim, onNext) { return completeCurrentAndAdvance(sim, 'five-star-finale', onNext); }
export function acknowledgeCurrent(sim) { return advancePostReport(sim, currentPostReport(sim)?.id); }
