/** 教学建造/选房的共享状态控制器。Game 与行为测试共用，避免测试复制 UI 逻辑。 */
export function applyTutorialRoomPlaced(sim, kind, phaseAtEntry) {
  if (sim.campaign?.mode !== 'tutorial') return;
  sim.campaign.tutorialFlags ||= {};
  sim.campaign.tutorialFlags[`built_${kind}`] = true;
  if (kind === 'lounge' && (sim.campaign.firstDayComplete || phaseAtEntry === 'first-recruitment')) {
    sim.campaign.tutorialFlags.recruitUnlocked = true;
    sim.campaign.tutorialFlags.needsMeetingChair = true;
    sim.campaign.phase = 'first-recruitment';
  }
  const needed = ['foyer', 'dining', 'kitchen', 'storage', 'guestroom'];
  if (phaseAtEntry === 'tutorial-build' && needed.every((item) => sim.campaign.tutorialFlags[`built_${item}`])) sim.campaign.phase = 'tutorial-furnish';
}

export function applyTutorialFurniturePlaced(sim, kind, phaseAtEntry, meetingSeatCapacity = 0) {
  if (sim.campaign?.mode !== 'tutorial') return;
  sim.campaign.tutorialFlags ||= {};
  sim.campaign.tutorialFlags[`furn_${kind}`] = true;
  if (phaseAtEntry === 'first-recruitment' && kind === 'chair' && meetingSeatCapacity >= 2) {
    sim.campaign.tutorialFlags.meetingChairReady = true;
    sim.campaign.phase = 'recruit';
  }
  if (phaseAtEntry === 'tutorial-furnish') syncTutorialFurniturePhase(sim);
}

/**
 * Reconciles the furniture tutorial from the actual layout.  Older saves only
 * recorded explicit build flags, so the protected starting chair (and other
 * auto furniture) may be present without a matching flag.
 */
export function syncTutorialFurniturePhase(sim) {
  if (sim?.campaign?.mode !== 'tutorial') return false;
  sim.campaign.tutorialFlags ||= {};
  const complete = tutorialMissingFurniture(sim).length === 0;
  if (sim.campaign.phase === 'tutorial-furnish' && complete) {
    sim.campaign.phase = 'ready-open';
    return true;
  }
  // A previously self-healed save may still lack a valid dining seat. Put it
  // back into the actionable furniture step instead of failing at openDay.
  if (sim.campaign.phase === 'ready-open' && !complete) {
    sim.campaign.phase = 'tutorial-furnish';
    return true;
  }
  return false;
}

export function tutorialFurnitureRoomSelection(sim, tavern, x, y, nextKind, setSelection) {
  const room = tavern.roomAt(x, y);
  if (!room || !nextKind || !furnDefRooms(nextKind).includes(room.kind)) return false;
  if (sim?.campaign?.phase === 'tutorial-furnish' && nextKind === 'chair' && room.kind !== 'dining') return false;
  setSelection({ kind: 'room', id: room.id });
  return true;
}

const ROOM_FURNITURE = {
  desk: ['foyer'], table: ['dining', 'bar', 'parlor'], chair: ['dining', 'bar', 'lounge', 'parlor', 'playerroom'],
  prep: ['kitchen'], stove: ['kitchen'], pass: ['kitchen'], sink: ['kitchen'], shelf: ['kitchen', 'storage'], bed: ['guestroom', 'lounge'],
};
function furnDefRooms(kind) { return ROOM_FURNITURE[kind] || []; }

export const TUTORIAL_FURNITURE = ['desk', 'table', 'chair', 'prep', 'stove', 'pass', 'sink', 'shelf', 'bed'];

/** A tutorial chair is a dining seat, never a meeting-table seat in playerroom. */
export function tutorialFurnitureSatisfied(sim, kind) {
  const furns = sim?.tavern?.furns || [];
  if (kind !== 'chair') return furns.some((furn) => furn.kind === kind);
  return (sim.tavern.allTables?.() || []).some((table) => {
    if (sim.tavern.roomOfFurn(table)?.kind !== 'dining') return false;
    // 首日第三批是两位客人；教学必须准备两把真实餐厅椅，
    // 会议桌椅和单把餐椅不能让开门检查提前通过。
    return (sim.tavern.tableSeats?.(table) || []).filter((chair) => sim.tavern.roomOfFurn(chair)?.kind === 'dining').length >= 2;
  });
}

export function tutorialMissingFurniture(sim) {
  return TUTORIAL_FURNITURE.filter((kind) => !tutorialFurnitureSatisfied(sim, kind));
}
