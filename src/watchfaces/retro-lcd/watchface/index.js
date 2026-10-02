import { formatDisplay, progressLevel } from './format';
import { LAYOUT, fontArray, GLYPH_WIDTHS, DATE_INK_BOUNDS } from './layout';
/** @type {RetroSensor | undefined} */
let time;
/** @type {RetroSensor | undefined} */
let battery;
/** @type {RetroSensor[]} */
let activity = [];
/** @type {RetroSensor | undefined} */
let weather;
/** @type {RetroSensor | undefined} */
let sleep;
/** @type {RetroWidget[]} */
let rings = [];
/** @type {RetroWidget | undefined} */
let weatherIcon;
/** @type {RetroWidget | undefined} */
let weatherDegree;
/** @type {{widgets: RetroWidget[], layout: {center:number,y:number,style:string,length:number}}[]} */
let fields = [];
let destroyed = false;
let listening = false;
/** @type {{digits: RetroWidget[], weekday: RetroWidget, aod: boolean}[]} */
let views = [];
/** @type {RetroWidget[]} */
let dates = [];
/** @type {RetroWidget[]} */
let aodDates = [];
/** @type {{widget:RetroWidget,layout:typeof LAYOUT.date,aod:boolean}[]} */
let dateSeparators = [];
/** @type {RetroWidget | undefined} */
let period;
/** @type {RetroWidget | undefined} */
let batteryBar;
/** @type {Map<RetroWidget, string>} */
const previous = new Map();
/** @param {RetroWidget | undefined} widget @param {string} src */
function write(widget, src) {
  if (!widget || previous.get(widget) === src) return;
  widget.setProperty(hmUI.prop.MORE, { src }); previous.set(widget, src);
}
function update() {
  if (!time || destroyed) return;
  const display = formatDisplay(time, hmSetting.getLanguage(), hmSetting.getTimeFormat());
  for (const view of views) {
    view.digits.forEach((widget, i) => write(widget, `digits/${view.aod ? 'aod' : 'time'}/${display.time[i] === '-' ? 'dash' : display.time[i]}.png`));
    const [locale, day] = display.weekday.split('/');
    write(view.weekday, `week/${view.aod ? 'aod-' : ''}${locale}/${day}.png`);
  }
  const dateGlyphs = Array.from(display.date.slice(2) + display.date.slice(0,2), char => char === '-' ? 'dash' : char);
  dates.forEach((widget,i) => write(widget, `digits/date/${dateGlyphs[i]}.png`));
  aodDates.forEach((widget,i) => write(widget, `digits/aod-date/${dateGlyphs[i]}.png`));
  for (const separator of dateSeparators) {
    const day = DATE_INK_BOUNDS[dateGlyphs[1]];
    const month = DATE_INK_BOUNDS[dateGlyphs[2]];
    const dash = DATE_INK_BOUNDS.dash;
    const x = Math.round((separator.layout.digits[1]+day.right+separator.layout.digits[2]+month.left-dash.left-dash.right)/2);
    const key = `date-separator:${x}`;
    if (previous.get(separator.widget) !== key) {
      separator.widget.setProperty(hmUI.prop.MORE, {src:`digits/${separator.aod ? 'aod-date' : 'date'}/dash.png`, x});
      previous.set(separator.widget,key);
    }
  }
  write(period, `period/${display.period}.png`);
  updateMetrics();
  updateConditions();
}
/** @param {string} char */
function glyphName(char) { return ({'-':'dash',':':'colon','°':'degree','/':'slash',' ':'blank'})[char] || char; }
/** @param {{widgets: RetroWidget[], layout: {center:number,y:number,style:string,length:number}}} field @param {string} value */
function fieldText(field, value) {
  const widths = GLYPH_WIDTHS[field.layout.style];
  let x = Math.round(field.layout.center - Array.from(value).reduce((sum, char) => sum + widths[glyphName(char)], 0) / 2);
  if (field === fields[0] && weatherDegree) {
    const degreeX = Math.round(field.layout.center + Array.from(value).reduce((sum, char) => sum + widths[glyphName(char)], 0) / 2) + 3;
    const key = `degree:${degreeX}`;
    if (previous.get(weatherDegree) !== key) {
      weatherDegree.setProperty(hmUI.prop.MORE, {src:'digits/range/degree.png', x:degreeX}); previous.set(weatherDegree,key);
    }
  }
  field.widgets.forEach((widget, i) => {
    const char = glyphName(value[i] || ' ');
    const src = `digits/${field.layout.style}/${char}.png`;
    const key = `${src}:${x}`;
    if (previous.get(widget) !== key) {widget.setProperty(hmUI.prop.MORE, {src, x}); previous.set(widget, key);}
    x += widths[char];
  });
}
/** @param {unknown} value */
function temperature(value) {return typeof value === 'number' && Number.isInteger(value) && value >= -99 && value <= 99 ? String(value) : '--';}
function updateConditions() {
  if (destroyed) return;
  const forecast = weather && weather.getForecastWeather ? weather.getForecastWeather() : undefined;
  const today = forecast && forecast.forecastData && forecast.forecastData.count > 0 ? forecast.forecastData.data[0] : undefined;
  const index = weather && Number.isInteger(weather.curAirIconIndex) ? weather.curAirIconIndex : today && today.index;
  write(weatherIcon, `weather/${typeof index === 'number' && index >= 0 && index <= 28 ? index : 25}.png`);
  if (fields.length === 3) {
    fieldText(fields[0], temperature(weather && weather.current));
    fieldText(fields[1], `${temperature(today && today.low)}° - ${temperature(today && today.high)}°C`);
    const minutes = sleep && sleep.getTotalTime ? sleep.getTotalTime() : NaN;
    fieldText(fields[2], Number.isInteger(minutes) && minutes > 0 && minutes <= 1440 ? `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2,'0')}` : '--:--');
  }
}
function updateMetrics() {
  if (destroyed) return;
  write(batteryBar, `battery/${progressLevel(battery ? battery.current : NaN, 100, 10)}.png`);
  ['steps','calories','active'].forEach((kind, i) => {
    const sensor = activity[i];
    write(rings[i], `ring/${kind}/${progressLevel(sensor ? sensor.current : NaN, sensor ? sensor.target : NaN, 100)}.png`);
  });
}
function pause() {
  if (!listening) return;
  if (time) time.removeEventListener(time.event.MINUTEEND, update);
  if (battery) battery.removeEventListener(hmSensor.event.CHANGE, updateMetrics);
  activity.forEach(sensor => sensor.removeEventListener(hmSensor.event.CHANGE, updateMetrics));
  listening = false;
}
function resume() {
  if (destroyed || !time) return;
  if (sleep && sleep.updateInfo) sleep.updateInfo();
  update();
  if (listening) return;
  time.addEventListener(time.event.MINUTEEND, update);
  if (battery) battery.addEventListener(hmSensor.event.CHANGE, updateMetrics);
  activity.forEach(sensor => sensor.addEventListener(hmSensor.event.CHANGE, updateMetrics));
  listening = true;
}
/** @param {number} x @param {number} y @param {string} src @param {number} level */
function image(x, y, src, level) {
  return hmUI.createWidget(hmUI.widget.IMG, { x, y, src, show_level: level });
}
WatchFace({
  build() {
    pause(); destroyed = false; views = []; dates = []; aodDates = []; dateSeparators = []; previous.clear(); rings = []; fields = [];
    time = hmSensor.createSensor(hmSensor.id.TIME);
    battery = hmSensor.createSensor(hmSensor.id.BATTERY);
    activity = [hmSensor.id.STEP, hmSensor.id.CALORIE, hmSensor.id.FAT_BURRING].map(id => hmSensor.createSensor(id));
    weather = hmSensor.createSensor(hmSensor.id.WEATHER);
    sleep = hmSensor.createSensor(hmSensor.id.SLEEP);
    const normal = hmUI.show_level.ONLY_NORMAL;
    const aod = hmUI.show_level.ONAL_AOD;
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: 0, w: 480, h: 480, color: 0, show_level: normal | aod });
    image(0, 0, 'background.png', normal);
    for (const [layout, level, isAod] of /** @type {[typeof LAYOUT.time | typeof LAYOUT.aod, number, boolean][]} */ ([[LAYOUT.time, normal, false], [LAYOUT.aod, aod, true]])) {
      const digits = layout.digits.map(x => image(x, layout.y, `digits/${isAod ? 'aod' : 'time'}/dash.png`, level));
      image(layout.colon, layout.y, `digits/${isAod ? 'aod' : 'time'}/colon.png`, level);
      const position = isAod ? LAYOUT.aod.weekday : LAYOUT.weekday;
      const weekday = image(position.x, position.y, `week/${isAod ? 'aod-' : ''}en/unknown.png`, level);
      views.push({ digits, weekday, aod: isAod });
    }
    dates = LAYOUT.date.digits.map(x => image(x, LAYOUT.date.y, 'digits/date/dash.png', normal));
    dateSeparators.push({widget:image(LAYOUT.date.dash, LAYOUT.date.y, 'digits/date/dash.png', normal),layout:LAYOUT.date,aod:false});
    aodDates = LAYOUT.aodDate.digits.map(x => image(x, LAYOUT.aodDate.y, 'digits/aod-date/dash.png', aod));
    dateSeparators.push({widget:image(LAYOUT.aodDate.dash, LAYOUT.aodDate.y, 'digits/aod-date/dash.png', aod),layout:LAYOUT.aodDate,aod:true});
    period = image(LAYOUT.period.x, LAYOUT.period.y, 'period/--.png', normal);
    batteryBar = image(LAYOUT.battery.x, LAYOUT.battery.y, 'battery/0.png', normal);
    rings = ['steps','calories','active'].map(kind => image(LAYOUT.rings.x, LAYOUT.rings.y, `ring/${kind}/0.png`, normal));
    LAYOUT.rings.icons.forEach(icon => image(icon.x, icon.y, `icons/${icon.name}.png`, normal));
    weatherIcon = image(LAYOUT.weather.x, LAYOUT.weather.y, 'weather/25.png', normal);
    weatherDegree = image(364, 66, 'digits/range/degree.png', normal);
    for (const layout of [LAYOUT.weather.temperature, LAYOUT.weather.range, LAYOUT.sleep]) {
      fields.push({layout, widgets: Array.from({length:layout.length}, () => image(layout.center, layout.y, `digits/${layout.style}/blank.png`, normal))});
    }
    hmUI.createWidget(hmUI.widget.TEXT_IMG, { ...LAYOUT.alarm, type: hmUI.data_type.ALARM_CLOCK,
      font_array: fontArray('alarm'), dot_image: 'digits/alarm/colon.png',
      negative_image: 'digits/alarm/dash.png', padding: true, h_space: 0,
      align_h: hmUI.align.CENTER_H, show_level: normal });
    image(LAYOUT.secondsLabel.x, LAYOUT.secondsLabel.y, 'status/sec.png', normal);
    hmUI.createWidget(hmUI.widget.IMG_TIME, { second_startX: LAYOUT.seconds.x, second_startY: LAYOUT.seconds.y,
      second_array: fontArray('seconds'), second_space: 0, second_zero: 1, second_follow: 0,
      second_align: hmUI.align.LEFT, show_level: normal });
    hmUI.createWidget(hmUI.widget.IMG_STATUS, { ...LAYOUT.alarmStatus, type: hmUI.system_status.CLOCK, src: 'status/alm.png', show_level: normal });
    // An opaque disconnect tile restores the dim idle label when disconnected.
    image(LAYOUT.signalStatus.x, LAYOUT.signalStatus.y, 'status/sig.png', normal);
    hmUI.createWidget(hmUI.widget.IMG_STATUS, { ...LAYOUT.signalStatus, type: hmUI.system_status.DISCONNECT, src: 'status/sig-off.png', show_level: normal });
    hmUI.createWidget(hmUI.widget.IMG_STATUS, { ...LAYOUT.muteStatus, type: hmUI.system_status.DISTURB, src: 'status/mute.png', show_level: normal });
    hmUI.createWidget(hmUI.widget.WIDGET_DELEGATE, { resume_call: resume, pause_call: pause });
    resume();
  },
  onDestroy() {
    pause(); destroyed = true; time = battery = weather = sleep = undefined; activity = []; rings = []; fields = []; weatherIcon = weatherDegree = undefined;
    period = batteryBar = undefined; views = []; dates = []; aodDates = []; dateSeparators = []; previous.clear();
  },
});
