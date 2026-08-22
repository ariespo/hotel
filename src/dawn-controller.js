/** Visible night→day transition shared by Game and deterministic tests. */
export function runDawnTransition(sim, { animate = (done) => done(), onText = () => {}, onStage = () => {}, onComplete = () => {} } = {}) {
  if (sim.nightState?.dawn?.done) return false;
  sim.nightState ||= {};
  sim.nightState.dawn = { active: true, token: `dawn:${sim.econ?.day || 0}`, stage: 'start', text: '休息结束 经营时段', done: false };
  onStage('start');
  onText(sim.nightState.dawn.text);
  animate(() => {
    if (sim.nightState.dawn.done) return;
    sim.nightState.dawn.active = false; sim.nightState.dawn.stage = 'end';
    sim.nightState.dawn.done = true;
    onStage('end');
    onComplete();
  }, (stage) => {
    if (!sim.nightState?.dawn?.active || sim.nightState.dawn.done) return;
    sim.nightState.dawn.stage = stage;
    onStage(stage);
  });
  return true;
}
