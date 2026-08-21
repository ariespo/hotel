/** 夜间管理模式店主回床的生产共享驱动（不依赖浏览器渲染）。 */
export function advancePendingNightBed(game, dt = 0) {
  if (!game?.pendingNightBed || !game.sim?.nightState?.active || game.sim.manualOwner) return false;
  const owner = game.sim.staff.find((staff) => staff.isOwner);
  const bed = game.sim.bedFor(owner?.id) || game.tavern.furns.find((furn) => furn.kind === 'bunk' && game.tavern.roomOfFurn(furn)?.kind === 'playerroom');
  const stand = bed && game.tavern.standTileNear(game.tavern.useTiles(bed));
  if (!owner || !stand) return false;
  if (owner.path?.length) {
    owner.pose = 'walk';
    game.sim.moveActor(owner, Math.max(0, Number(dt) || 0), game.sim.staffSpeed(owner));
    return true;
  }
  if (Math.hypot(owner.x - stand.x, owner.y - stand.y) < 1.8) {
    owner.pose = 'idle';
    game.pendingNightBed = false;
    game.interactNearby();
    return true;
  }
  owner.path = game.tavern.path(Math.round(owner.x), Math.round(owner.y), stand.x, stand.y) || [];
  owner.pose = owner.path.length ? 'walk' : 'idle';
  return true;
}
