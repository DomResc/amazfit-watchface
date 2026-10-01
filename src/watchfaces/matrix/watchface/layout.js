// Coordinates preserve the approved preview, including the seconds dial's right edge.
export const NORMAL = {
  digits: [74, 152, 256, 334], y: 211, colon: { x: 230, y: 211 },
  date: { x: 70, y: 177, w: 340, h: 24, text_size: 16, color: 0xe0e3e7 },
  battery: { x: 73, y: 331, cx: 100, cy: 358 },
  seconds: { x: 339, y: 331, cx: 366, cy: 358, textX: 289, textY: 349 },
};
export const AOD = {
  digits: [74, 152, 256, 334], y: 206, colon: { x: 230, y: 206 },
  date: { x: 70, y: 161, w: 340, h: 24, text_size: 15, color: 0x888d95 },
};
/** @param {string} style */
export function fontArray(style) {
  return Array.from({ length: 10 }, (_, digit) => `digits/${style}/${digit}.png`);
}
