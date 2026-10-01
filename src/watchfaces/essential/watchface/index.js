import { formatDisplay } from './format';
import { NORMAL, AOD } from './layout';

/** @type {TimeSensor | undefined} */
let sensor;
let listening = false;
let destroyed = false;
/** @type {{time: ZeppWidget, date: ZeppWidget, period: ZeppWidget, aod: boolean}[]} */
let views = [];
/** @type {Map<ZeppWidget, string>} */
const previous = new Map();

function update() {
  if (!sensor || destroyed) return;
  const display = formatDisplay(sensor, hmSetting.getLanguage(), hmSetting.getTimeFormat());
  for (const view of views) {
    for (const [widget, text] of /** @type {[ZeppWidget, string][]} */ ([
      [view.time, display.time], [view.date, view.aod ? display.shortDate : display.date], [view.period, display.period],
    ])) {
      if (previous.get(widget) !== text) {
        widget.setProperty(hmUI.prop.TEXT, text);
        previous.set(widget, text);
      }
    }
  }
}
function resume() {
  if (destroyed || !sensor) return;
  update();
  if (!listening) {
    sensor.addEventListener(sensor.event.MINUTEEND, update);
    listening = true;
  }
}
function pause() {
  if (listening && sensor) sensor.removeEventListener(sensor.event.MINUTEEND, update);
  listening = false;
}
/** @param {typeof NORMAL} layout @param {number} level @param {boolean} aod */
function createView(layout, level, aod) {
  /** @param {typeof NORMAL.time} style */
  const text = (style) => hmUI.createWidget(hmUI.widget.TEXT, {
    ...style, align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
    text_style: hmUI.text_style.NONE, show_level: level, text: '',
  });
  views.push({ time: text(layout.time), date: text(layout.date), period: text(layout.period), aod });
}
WatchFace({
  build() {
    pause();
    destroyed = false;
    previous.clear();
    views = [];
    sensor = hmSensor.createSensor(hmSensor.id.TIME);
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: 0, w: 480, h: 480, color: 0x000000,
      show_level: hmUI.show_level.ONLY_NORMAL | hmUI.show_level.ONAL_AOD });
    createView(NORMAL, hmUI.show_level.ONLY_NORMAL, false);
    createView(AOD, hmUI.show_level.ONAL_AOD, true);
    hmUI.createWidget(hmUI.widget.WIDGET_DELEGATE, { resume_call: resume, pause_call: pause });
    resume();
  },
  onDestroy() {
    pause();
    destroyed = true;
    sensor = undefined;
    views = [];
    previous.clear();
  },
});
