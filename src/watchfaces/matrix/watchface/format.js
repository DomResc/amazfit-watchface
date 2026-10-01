const WEEKDAYS = {
  en: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
  it: ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'],
};
const MONTHS = {
  en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
  it: ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC'],
};
/** @param {number | undefined} value @param {number} min @param {number} max */
function valid(value, min, max) {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}
/** @param {number} value */
function pad(value) { return value < 10 ? `0${value}` : `${value}`; }
/**
 * @param {{hour?: number, minute?: number, day?: number, month?: number, week?: number}} time
 * @param {number} language Italian is language ID 10; other IDs use English.
 */
export function formatDisplay(time, language) {
  const locale = language === 10 ? 'it' : 'en';
  const hour = time.hour;
  const minute = time.minute;
  const hasTime = valid(hour, 0, 23) && valid(minute, 0, 59);
  const date = valid(time.day, 1, 31) && valid(time.month, 1, 12)
    ? `${pad(/** @type {number} */ (time.day))} ${MONTHS[locale][/** @type {number} */ (time.month) - 1]}` : '-- ---';
  const weekday = valid(time.week, 1, 7) ? WEEKDAYS[locale][/** @type {number} */ (time.week) - 1] : '---';
  return {
    time: hasTime ? `${pad(/** @type {number} */ (hour))}:${pad(/** @type {number} */ (minute))}` : '--:--',
    date: `${weekday}  ${date}`,
  };
}
