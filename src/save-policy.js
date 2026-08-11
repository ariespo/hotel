/**
 * 只有收盘规划期的状态能够写入常规存档。
 * 营业中的订单、客人、路径与计时属于瞬时状态；刷新时统一回到开门前检查点。
 */
export function canPersistSim(sim) {
  return !sim || !sim.dayActive;
}
