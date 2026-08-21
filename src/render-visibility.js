// Shared, renderer-independent visibility predicates used by Game and tests.
export function worldPointVisible(x, y, view, zoom, tile = 32, margin = 3) {
  if (!view || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  const halfW = view.width / Math.max(1, tile * zoom) / 2 + margin;
  const halfH = view.height / Math.max(1, tile * zoom) / 2 + margin;
  return Math.abs(x - view.centerX) <= halfW && Math.abs(y - view.centerY) <= halfH;
}

export function pixelWorldVisible(px, py, view, zoom, tile = 32, margin = 3) {
  return worldPointVisible(px / tile, py / tile, view, zoom, tile, margin);
}
