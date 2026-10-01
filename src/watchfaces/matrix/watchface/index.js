import { formatDisplay } from './format';
import { NORMAL, AOD, fontArray } from './layout';

/** @type {MatrixTimeSensor | undefined} */
let sensor;
let listening = false;
let destroyed = false;
/** @type {{digits: MatrixWidget[], date: MatrixWidget, aod: boolean}[]} */
let views = [];
/** @type {MatrixWidget | undefined} */
let distanceLabel;
/** @type {Map<MatrixWidget, string>} */
const previous = new Map();
/** @param {MatrixWidget} widget @param {string} value @param {boolean} image */
function write(widget, value, image) {
  if (previous.get(widget) === value) return;
  widget.setProperty(image ? hmUI.prop.MORE : hmUI.prop.TEXT, image ? { src: value } : value);
  previous.set(widget, value);
}
function update() {
  if (!sensor || destroyed) return;
  const display = formatDisplay(sensor, hmSetting.getLanguage());
  const digits = display.time.replace(':', '');
  for (const view of views) {
    view.digits.forEach((widget, i) => write(widget, `digits/${view.aod ? 'aod' : 'time'}/${digits[i] === '-' ? 'dash' : digits[i]}.png`, true));
    write(view.date, display.date, false);
  }
  if (distanceLabel) write(distanceLabel, hmSetting.getMileageUnit() === 1 ? 'MI' : 'KM', false);
}
function pause() {
  if (listening && sensor) sensor.removeEventListener(sensor.event.MINUTEEND, update);
  listening = false;
}
function resume() {
  if (destroyed || !sensor) return;
  update();
  if (!listening) {
    sensor.addEventListener(sensor.event.MINUTEEND, update);
    listening = true;
  }
}
/** @param {number} x @param {number} y @param {string} src @param {number} level */
function image(x, y, src, level) {
  return hmUI.createWidget(hmUI.widget.IMG, { x, y, src, show_level: level });
}
/** @param {number} x @param {number} y @param {number} w @param {number} h @param {number} type @param {string} style */
function metric(x, y, w, h, type, style) {
  hmUI.createWidget(hmUI.widget.TEXT_IMG, { x, y, w, h, type, font_array: fontArray(style),
    h_space: 3, dot_image: `digits/${style}/dot.png`, negative_image: `digits/${style}/dash.png`,
    align_h: hmUI.align.CENTER_H, show_level: hmUI.show_level.ONLY_NORMAL });
}
WatchFace({
  build() {
    pause(); destroyed = false; views = []; previous.clear();
    sensor = hmSensor.createSensor(hmSensor.id.TIME);
    const normal = hmUI.show_level.ONLY_NORMAL;
    const aod = hmUI.show_level.ONAL_AOD;
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: 0, w: 480, h: 480, color: 0, show_level: normal | aod });
    /** @type {(x: number, y: number, w: number, h: number, size: number, value: string, level: number, color?: number) => MatrixWidget} */
    const text = (x, y, w, h, size, value, level, color = 0xffffff) => hmUI.createWidget(hmUI.widget.TEXT, {
      x, y, w, h, text_size: size, text: value, color, font: 'fonts/Orbitron-Medium.ttf',
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE, show_level: level,
    });
    /** @type {(cx: number, cy: number, radius: number, start: number, end: number) => MatrixWidget} */
    const arc = (cx, cy, radius, start, end) => hmUI.createWidget(hmUI.widget.ARC_PROGRESS, {
      center_x: cx, center_y: cy, radius, start_angle: start, end_angle: end,
      line_width: 2, level: 100, color: 0xffffff, show_level: normal,
    });
    // Mask the lower half of a full native ring; partial-arc orientation differs in this simulator.
    arc(240, 76, 30, 0, 360);
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 208, y: 76, w: 64, h: 33, color: 0, show_level: normal });
    for (const cx of [NORMAL.battery.cx, NORMAL.seconds.cx]) {
      arc(cx, 358, 26, 0, 360);
      hmUI.createWidget(hmUI.widget.CIRCLE, { center_x: cx, center_y: 358, radius: 2, color: 0xffffff, show_level: normal });
      hmUI.createWidget(hmUI.widget.FILL_RECT, { x: cx, y: 380, w: 1, h: 4, color: 0xaaaaaa, show_level: normal });
    }
    text(76, 104, 70, 20, 13, 'KCAL', normal);
    text(210, 119, 60, 18, 12, 'BPM', normal);
    text(190, 64, 20, 15, 10, 'L', normal);
    text(270, 64, 20, 15, 10, 'H', normal);
    text(140, 325, 60, 23, 13, 'BAT', normal);
    text(280, 325, 60, 23, 13, 'SEC', normal);
    text(200, 359, 24, 21, 16, '%', normal);
    text(190, 403, 100, 22, 13, 'STEPS', normal);
    for (const [layout, level, isAod] of /** @type {[typeof NORMAL | typeof AOD, number, boolean][]} */ ([[NORMAL, normal, false], [AOD, aod, true]])) {
      const digits = layout.digits.map(x => image(x, layout.y, `digits/${isAod ? 'aod' : 'time'}/dash.png`, level));
      image(layout.colon.x, layout.colon.y, `digits/${isAod ? 'aod' : 'time'}/colon.png`, level);
      const date = text(70, layout.date.y, 340, 24, isAod ? 15 : 16, '', level, isAod ? 0x888d95 : 0xe0e3e7);
      views.push({ digits, date, aod: isAod });
    }
    distanceLabel = text(334, 104, 70, 20, 13, 'KM', normal);
    metric(65, 129, 93, 27, hmUI.data_type.CAL, 'small');
    metric(322, 129, 94, 27, hmUI.data_type.DISTANCE, 'small');
    metric(205, 87, 70, 29, hmUI.data_type.HEART, 'heart');
    metric(141, 349, 62, 26, hmUI.data_type.BATTERY, 'small');
    metric(171, 431, 138, 27, hmUI.data_type.STEP, 'small');
    hmUI.createWidget(hmUI.widget.IMG_POINTER, { src: 'battery-hand.png', x: 2, y: 23,
      center_x: NORMAL.battery.cx, center_y: NORMAL.battery.cy, start_angle: 225, end_angle: 495,
      type: hmUI.data_type.BATTERY, invalid_visible: false, show_level: normal });
    hmUI.createWidget(hmUI.widget.IMG_POINTER, { src: 'heart-hand.png', x: 2, y: 25,
      center_x: 240, center_y: 76, start_angle: 270, end_angle: 450,
      type: hmUI.data_type.HEART, invalid_visible: false, show_level: normal });
    hmUI.createWidget(hmUI.widget.IMG_TIME, { second_startX: NORMAL.seconds.textX, second_startY: NORMAL.seconds.textY,
      second_array: fontArray('small'), second_space: 3, second_zero: 1, second_follow: 0,
      second_align: hmUI.align.LEFT, show_level: normal });
    hmUI.createWidget(hmUI.widget.TIME_POINTER, { second_centerX: NORMAL.seconds.cx, second_centerY: NORMAL.seconds.cy,
      second_posX: 2, second_posY: 23, second_path: 'battery-hand.png', show_level: normal });
    hmUI.createWidget(hmUI.widget.WIDGET_DELEGATE, { resume_call: resume, pause_call: pause });
    resume();
  },
  onDestroy() {
    pause(); destroyed = true; sensor = undefined; distanceLabel = undefined; views = []; previous.clear();
  },
});
