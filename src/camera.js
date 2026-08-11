export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 5.5;

export function clampZoom(value) {
  const zoom = Number(value);
  const safe = Number.isFinite(zoom) ? zoom : 2;
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(safe * 20) / 20));
}
