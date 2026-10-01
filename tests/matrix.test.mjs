import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile, access } from 'node:fs/promises';
import { formatDisplay } from '../src/watchfaces/matrix/watchface/format.js';
import { NORMAL } from '../src/watchfaces/matrix/watchface/layout.js';

const sample = {hour:14, minute:28, day:1, month:10, week:4};
test('Matrix always uses 24-hour time with localized date and safe placeholders', () => {
  assert.equal(formatDisplay(sample, 2).time, '14:28');
  assert.equal(formatDisplay({...sample,hour:0,minute:0},10).time,'00:00');
  assert.equal(formatDisplay(sample,10).date,'GIO  01 OTT');
  assert.equal(formatDisplay({...sample,day:2,week:5},99).date,'FRI  02 OCT');
  assert.equal(formatDisplay({},2).time,'--:--');
  assert.equal(formatDisplay({...sample,hour:24},2).time,'--:--');
});
test('dial edges align with the hour and minute outer edges', () => {
  assert.ok(Math.abs(NORMAL.battery.x - NORMAL.digits[0]) <= 1);
  assert.ok(Math.abs(NORMAL.seconds.x + 54 - (NORMAL.digits[3] + 60)) <= 1);
  assert.equal(NORMAL.battery.cy,NORMAL.seconds.cy);
});
async function harness() {
  const widgets=[];const listeners=new Set();let definition;let writes=0;let creates=0;
  const sensor={...sample,event:{MINUTEEND:1},addEventListener(event,fn){assert.equal(event,1);listeners.add(fn);},removeEventListener(event,fn){assert.equal(event,1);listeners.delete(fn);}};
  const settings={language:2,mileage:0};
  const kinds={IMG:1,TEXT:2,FILL_RECT:3,TEXT_IMG:4,IMG_POINTER:5,IMG_TIME:6,TIME_POINTER:7,WIDGET_DELEGATE:8,ARC_PROGRESS:9,CIRCLE:10};
  const ui={widget:kinds,prop:{TEXT:1,MORE:2},align:{CENTER_H:1,CENTER_V:2,LEFT:3},text_style:{NONE:0},show_level:{ONLY_NORMAL:1,ONAL_AOD:2},data_type:{CAL:1,DISTANCE:2,HEART:3,BATTERY:4,STEP:5},createWidget(id,options){const widget={id,options:{...options},setProperty(prop,value){if(prop===1)this.options.text=value;else Object.assign(this.options,value);writes++;}};widgets.push(widget);return widget;}};
  const context=vm.createContext({hmUI:ui,hmSensor:{id:{TIME:1},createSensor(){creates++;return sensor;}},hmSetting:{getLanguage:()=>settings.language,getMileageUnit:()=>settings.mileage},WatchFace:config=>{definition=config;}});
  const modules=new Map();
  async function load(url){
    if(modules.has(url.href))return modules.get(url.href);
    const module=new vm.SourceTextModule(await readFile(url,'utf8'),{context,identifier:url.href});modules.set(url.href,module);
    await module.link((specifier,parent)=>load(new URL(`${specifier}.js`,parent.identifier)));
    return module;
  }
  const module=await load(new URL('../src/watchfaces/matrix/watchface/index.js',import.meta.url));await module.evaluate();definition.build();
  const delegate=widgets.find(w=>w.id===kinds.WIDGET_DELEGATE).options;
  return {widgets,listeners,sensor,settings,kinds,definition,delegate,counts:()=>({writes,creates}),tick(){for(const fn of listeners)fn();}};
}
test('native seconds and activity widgets are normal-only and every bitmap exists',async()=>{
  const h=await harness();
  assert.equal(h.counts().creates,1); // No continuous heart measurement is started.
  const seconds=h.widgets.find(w=>w.id===h.kinds.IMG_TIME).options;
  assert.equal(seconds.second_zero,1);assert.equal(seconds.second_startX,289);
  const pointer=h.widgets.find(w=>w.id===h.kinds.TIME_POINTER).options;
  assert.equal(pointer.second_centerX,366);assert.equal(pointer.second_centerY,358);
  assert.equal(h.widgets.filter(w=>w.id===h.kinds.TEXT_IMG).length,5);
  const arcs=h.widgets.filter(w=>w.id===h.kinds.ARC_PROGRESS);
  assert.equal(arcs.length,3);
  assert.deepEqual(arcs.map(w=>[w.options.start_angle,w.options.end_angle]),[[0,360],[0,360],[0,360]]);
  assert.ok(h.widgets.some(w=>w.id===h.kinds.FILL_RECT&&w.options.x===208&&w.options.y===76&&w.options.w===64&&w.options.h===33));
  for(const w of h.widgets.filter(w=>w.id===h.kinds.TEXT))assert.equal(w.options.font,'fonts/Orbitron-Medium.ttf');
  for(const w of h.widgets){
    if([h.kinds.TEXT_IMG,h.kinds.IMG_POINTER,h.kinds.IMG_TIME,h.kinds.TIME_POINTER,h.kinds.ARC_PROGRESS,h.kinds.CIRCLE].includes(w.id))assert.equal(w.options.show_level,1);
    for(const [key,value] of Object.entries(w.options)){
      const paths=Array.isArray(value)?value: typeof value==='string' && (value.endsWith('.png') || value.endsWith('.ttf'))?[value]:[];
      for(const path of paths)await access(new URL(`../src/watchfaces/matrix/assets/balance-2-xt/${path}`,import.meta.url));
    }
  }
  assert.equal(h.widgets.filter(w=>w.options.show_level===2).length,6);
});
test('minute refresh handles rollover, resume, language and units without duplicate listeners',async()=>{
  const h=await harness();const before=h.counts().writes;h.tick();assert.equal(h.counts().writes,before);
  h.delegate.resume_call();h.delegate.resume_call();assert.equal(h.listeners.size,1);
  h.delegate.pause_call();h.delegate.pause_call();assert.equal(h.listeners.size,0);
  Object.assign(h.sensor,{hour:0,minute:0,day:2,week:5});h.settings.language=10;h.settings.mileage=1;
  h.delegate.resume_call();assert.equal(h.listeners.size,1);
  assert.equal(h.widgets.find(w=>w.id===h.kinds.TEXT && w.options.y===177).options.text,'VEN  02 OTT');
  assert.equal(h.widgets.find(w=>w.options.x===334 && w.id===h.kinds.TEXT).options.text,'MI');
  const normal=h.widgets.filter(w=>w.id===h.kinds.IMG && w.options.show_level===1 && w.options.src.startsWith('digits/time/') && !w.options.src.endsWith('colon.png'));
  assert.deepEqual(normal.map(w=>w.options.src),Array(4).fill('digits/time/0.png'));
  h.definition.build();assert.equal(h.listeners.size,1);
  h.definition.onDestroy();assert.equal(h.listeners.size,0);
  h.delegate.resume_call();assert.equal(h.listeners.size,0);
});
