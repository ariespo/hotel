/**
 * Closing phase runner shared by Game.frame and headless behavior tests.
 * It deliberately owns only closing transitions; input/modal blocking is a
 * presentation concern and never pauses assembly movement.
 */
export function advanceClosingPhase(sim, state, dt, onReport = () => {}) {
  if (!['closing-title', 'closing-assemble'].includes(sim.campaign?.phase)) return false;
  state.t = (state.t || 0) + Math.max(0, Number(dt) || 0);
  if (sim.campaign.phase === 'closing-title' && state.t >= .55) {
    sim.campaign.phase = 'closing-assemble';
    sim.assembleMeetingSeats();
  }
  if (sim.campaign.phase === 'closing-assemble') {
    sim.update(dt);
    if (sim.campaign.closingAssembled) {
      sim.campaign.phase = 'report';
      onReport(sim.lastStat || sim.campaign.reportState?.stat || null);
    }
  }
  return true;
}

export function resumeClosingPhase(sim) {
  if (!['closing-title', 'closing-assemble'].includes(sim.campaign?.phase)) return false;
  const assignments = sim.campaign.closingSeatAssignments || {};
  for (const staff of sim.staff) {
    const seat = assignments[staff.id];
    if (!seat) continue;
    staff.meetingSeat = seat; staff.meetingSeatId = `${seat.tableId}:${seat.x}:${seat.y}`;
    staff.path = sim.tavern.path(Math.round(staff.x), Math.round(staff.y), seat.x, seat.y) || [];
    staff.pose = 'walk';
  }
  sim.campaign.closingAssembled = false;
  return true;
}
