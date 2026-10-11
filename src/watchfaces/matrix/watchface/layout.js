// Normal and AOD share the approved square-dot time and split-date geometry.
export const NORMAL = {
  digits: [54, 141, 263, 350], y: 207, colon: { x: 235, y: 207 },
  date: { x: 54, y: 172, w: 142, h: 24, text_size: 18, color: 0xeeeeee },
  month: { x: 280, y: 172, w: 124, h: 24 },
  battery: { x: 55, y: 308, cx: 84, cy: 337 },
  seconds: { x: 366, y: 308, cx: 395, cy: 337, textX: 288, textY: 322 },
};
export const AOD = {
  digits: [...NORMAL.digits], y: NORMAL.y, colon: { ...NORMAL.colon },
  date: { ...NORMAL.date, color: 0x999999 },
  month: { ...NORMAL.month },
};
/** @param {string} style */
export function fontArray(style) {
  return Array.from({ length: 10 }, (_, digit) => `digits/${style}/${digit}.png`);
}
