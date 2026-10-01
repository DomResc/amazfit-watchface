// Narrow classic watchface declarations used by Matrix, checked separately from Essential.
interface MatrixWidget { setProperty(property: number, value: string | {src: string}): void; }
interface MatrixTimeSensor {
  hour: number; minute: number; day: number; month: number; week: number;
  event: {MINUTEEND: number};
  addEventListener(event: number, callback: () => void): void;
  removeEventListener(event: number, callback: () => void): void;
}
interface MatrixOptions {
  [key: string]: string | number | boolean | string[] | (() => void);
}
declare const hmUI: {
  widget: {IMG: number; TEXT: number; FILL_RECT: number; TEXT_IMG: number; IMG_POINTER: number; IMG_TIME: number; TIME_POINTER: number; WIDGET_DELEGATE: number; ARC_PROGRESS: number; CIRCLE: number};
  prop: {TEXT: number; MORE: number};
  align: {CENTER_H: number; CENTER_V: number; LEFT: number};
  text_style: {NONE: number};
  show_level: {ONLY_NORMAL: number; ONAL_AOD: number};
  data_type: {CAL: number; DISTANCE: number; HEART: number; BATTERY: number; STEP: number};
  createWidget(id: number, options: MatrixOptions): MatrixWidget;
};
declare const hmSensor: {id: {TIME: number}; createSensor(id: number): MatrixTimeSensor};
declare const hmSetting: {getLanguage(): number; getMileageUnit(): number};
declare function WatchFace(config: {build(): void; onDestroy(): void}): void;
declare function App(config: Record<string, never>): void;
