// Narrow declarations for the classic watchface API used by Essential.
interface ZeppWidget { setProperty(property: number, value: string): void; }
interface TimeSensor {
  hour: number; minute: number; day: number; month: number; week: number;
  event: { MINUTEEND: number };
  addEventListener(event: number, callback: () => void): void;
  removeEventListener(event: number, callback: () => void): void;
}
interface TextOptions {
  x: number; y: number; w: number; h: number; color: number; text_size: number;
  align_h: number; align_v: number; text_style: number; show_level: number; text: string;
}
declare const hmUI: {
  widget: { TEXT: number; FILL_RECT: number; WIDGET_DELEGATE: number };
  prop: { TEXT: number };
  align: { CENTER_H: number; CENTER_V: number };
  text_style: { NONE: number };
  show_level: { ONLY_NORMAL: number; ONAL_AOD: number };
  createWidget(id: number, options: TextOptions | {x: number; y: number; w: number; h: number; color: number; show_level: number} | {resume_call: () => void; pause_call: () => void}): ZeppWidget;
};
declare const hmSensor: { id: {TIME: number}; createSensor(id: number): TimeSensor };
declare const hmSetting: {getLanguage(): number; getTimeFormat(): number};
declare function WatchFace(config: {build(): void; onDestroy(): void}): void;
declare function App(config: Record<string, never>): void;
