/** Sizes shared by the 3D phone and the CSS wall of screens, so they line up exactly. */
export function finaleLayout(vw: number, vh: number) {
  const pw = Math.min(320, (vh * 0.78) / 2.067); // big phone width (px)
  const phoneH = pw * 2.067;
  const tileW = Math.max(76, Math.min(118, vw / 13)); // one screen in the wall
  const tileH = tileW * 2.067;
  const gap = Math.round(tileW * 0.18);
  const shrink = tileW / pw; // big phone → one tile
  const outlook = 0.8; // extra pull-back at the end of the zoom
  const drift = 0.8; // while you look at the wall, the camera slowly pulls back a bit more
  return { pw, phoneH, tileW, tileH, gap, shrink, outlook, drift };
}

/** Same curve in JS (3D phone) and CSS (wall), so both move together. */
export const ZOOM_EASE_CSS = "cubic-bezier(0.65, 0, 0.35, 1)";