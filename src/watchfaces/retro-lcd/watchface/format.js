/** @param {unknown} value @param {number} min @param {number} max */
function valid(value, min, max) {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}
/** @param {number} value */
function pad(value) { return value < 10 ? `0${value}` : `${value}`; }
/** @param {{hour?: number, minute?: number, day?: number, month?: number, week?: number}} time @param {number} language @param {number} timeFormat */
export function formatDisplay(time, language, timeFormat) {
  const hour = time.hour;
  const minute = time.minute;
  const hasTime = valid(hour, 0, 23) && valid(minute, 0, 59);
  const twelve = timeFormat === 0;
  const shownHour = hasTime ? (twelve ? ((/** @type {number} */ (hour) % 12) || 12) : hour) : 0;
  return {
    time: hasTime ? `${pad(/** @type {number} */ (shownHour))}${pad(/** @type {number} */ (minute))}` : '----',
    date: valid(time.month, 1, 12) && valid(time.day, 1, 31) ? `${pad(/** @type {number} */ (time.month))}${pad(/** @type {number} */ (time.day))}` : '----',
    weekday: `${language === 10 ? 'it' : 'en'}/${valid(time.week, 1, 7) ? time.week : 'unknown'}`,
    period: hasTime ? (twelve ? (/** @type {number} */ (hour) >= 12 ? 'PM' : 'AM') : 'blank') : '--',
  };
}
/** @param {number} value @param {number} target @param {number} count */
export function progressLevel(value, target, count) {
  if (!Number.isFinite(value) || !Number.isFinite(target) || target <= 0 || value < 0) return 0;
  return Math.min(count, Math.floor(value / target * count));
}
