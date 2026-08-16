export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 5.5;

export function clampZoom(value) {
  const zoom = Number(value);
  const safe = Number.isFinite(zoom) ? zoom : 2;
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(safe * 20) / 20));
}

export function usableViewport(width, height, insets = {}) {
  width = Math.max(1, Number(width) || 1);
  height = Math.max(1, Number(height) || 1);
  let left = Math.max(0, Number(insets.left) || 0);
  let rightInset = Math.max(0, Number(insets.right) || 0);
  let top = Math.max(0, Number(insets.top) || 0);
  let bottomInset = Math.max(0, Number(insets.bottom) || 0);
  if (left + rightInset >= width - 80) left = rightInset = 0;
  if (top + bottomInset >= height - 80) top = bottomInset = 0;
  const right = width - rightInset;
  const bottom = height - bottomInset;
  return { left, top, right, bottom, width: right - left, height: bottom - top, centerX: (left + right) / 2, centerY: (top + bottom) / 2 };
}
