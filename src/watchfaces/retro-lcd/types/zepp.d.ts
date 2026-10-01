// Narrow classic watchface API declarations for Retro LCD.
interface RetroWidget { setProperty(property: number, value: string | {src: string; x?:number}): void; }
interface RetroSensor {
  hour?: number; minute?: number; day?: number; month?: number; week?: number;
  curAirIconIndex?: number;
  getForecastWeather?(): {forecastData: {count:number; data: {index:number;low:number;high:number}[]}};
  updateInfo?(): void;
  getTotalTime?(): number;
  current: number; target: number; last: number;
  event: {MINUTEEND: number};
  addEventListener(event: number, callback: () => void): void;
  removeEventListener(event: number, callback: () => void): void;
}
interface RetroOptions { [key: string]: string | number | boolean | string[] | (() => void); }
declare const hmUI: {
  widget: {IMG: number; TEXT_IMG: number; FILL_RECT: number; IMG_TIME: number; IMG_STATUS: number; WIDGET_DELEGATE: number};
  prop: {MORE: number}; align: {CENTER_H: number; LEFT: number};
  show_level: {ONLY_NORMAL: number; ONAL_AOD: number};
  data_type: {STEP: number; CAL: number; HEART: number; ALARM_CLOCK: number};
  system_status: {CLOCK: number; DISCONNECT: number; DISTURB: number};
  createWidget(id: number, options: RetroOptions): RetroWidget;
};
declare const hmSensor: {id: {TIME: number; BATTERY: number; STEP:number; CALORIE:number; FAT_BURRING:number; WEATHER:number; SLEEP:number}; event: {CHANGE: number}; createSensor(id: number): RetroSensor};
declare const hmSetting: {getLanguage(): number; getTimeFormat(): number};
declare function WatchFace(config: {build(): void; onDestroy(): void}): void;
declare function App(config: Record<string, never>): void;
