import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { formatDisplay } from '../src/watchfaces/essential/watchface/format.js';
import { NORMAL, AOD } from '../src/watchfaces/essential/watchface/layout.js';

const sample = { hour: 10, minute: 8, day: 1, month: 10, week: 4 };
test('midnight, noon and evening obey the time preference', () => {
  for (const [hour, expected, period] of [[0, '12:08', 'AM'], [12, '12:08', 'PM'], [23, '11:08', 'PM']]) {
    assert.equal(formatDisplay({ ...sample, hour }, 2, 0).time, expected);
    assert.equal(formatDisplay({ ...sample, hour }, 2, 0).period, period);
  }
  assert.equal(formatDisplay({ ...sample, hour: 0, minute: 0 }, 2, 1).time, '00:00');
  assert.equal(formatDisplay(sample, 2, 1).period, '');
});
test('Italian labels and English fallback cover all weekday and month values', () => {
  assert.equal(formatDisplay(sample, 10, 1).date, 'GIO · 01 OTT');
  assert.equal(formatDisplay(sample, 99, 1).date, 'THU · 01 OCT');
  assert.equal(formatDisplay({...sample, month:12, day:31, week:7},10,1).date,'DOM · 31 DIC');
  assert.equal(formatDisplay({...sample, month:1, day:1, week:1},2,1).date,'MON · 01 JAN');
  for(let month=1;month<=12;month++) for(let week=1;week<=7;week++) {
    for(const language of [2,10]) assert.ok(!formatDisplay({...sample,month,week},language,1).date.includes('undefined'));
  }
});
test('missing or invalid sensor fields render placeholders', () => {
  assert.deepEqual(formatDisplay({}, 10, 0), {time:'--:--',period:'',date:'--- · -- ---',shortDate:'-- ---'});
  assert.equal(formatDisplay({...sample,hour:24},2,1).time,'--:--');
  assert.equal(formatDisplay({...sample,month:0},2,1).shortDate,'-- ---');
  assert.equal(formatDisplay({...sample,minute:NaN},2,1).time,'--:--');
});
test('both time rectangles are centered at the physical display center', () => {
  for(const layout of [NORMAL,AOD]) {
    assert.equal(layout.time.x+layout.time.w/2,240);
    assert.equal(layout.time.y+layout.time.h/2,240);
    for(const style of Object.values(layout)) assert.equal(style.x+style.w/2,240);
  }
});

async function harness() {
  const widgets=[];const listeners=new Set();let adds=0;let removes=0;let writes=0;
  const sensor={...sample,event:{MINUTEEND:1},addEventListener(event,fn){assert.equal(event,1);listeners.add(fn);adds++;},removeEventListener(event,fn){assert.equal(event,1);listeners.delete(fn);removes++;}};
  const settings={language:10,format:1};let definition;
  const ui={widget:{TEXT:1,FILL_RECT:2,WIDGET_DELEGATE:3},prop:{TEXT:1},align:{CENTER_H:1,CENTER_V:2},text_style:{NONE:0},show_level:{ONLY_NORMAL:1,ONAL_AOD:2},createWidget(id,options){const widget={id,options,text:options.text,setProperty(prop,value){assert.equal(prop,1);this.text=value;writes++;}};widgets.push(widget);return widget;}};
  const context=vm.createContext({hmUI:ui,hmSensor:{id:{TIME:1},createSensor:()=>sensor},hmSetting:{getLanguage:()=>settings.language,getTimeFormat:()=>settings.format},WatchFace:config=>{definition=config;}});
  const base=new URL('../src/watchfaces/essential/watchface/',import.meta.url);
  const modules=new Map();
  async function load(url) {
    if(modules.has(url.href))return modules.get(url.href);
    const module=new vm.SourceTextModule(await readFile(url,'utf8'),{context,identifier:url.href});modules.set(url.href,module);
    await module.link((specifier,parent)=>load(new URL(specifier.endsWith('.js')?specifier:specifier+'.js',parent.identifier)));
    return module;
  }
  const module=await load(new URL('index.js',base));await module.evaluate();
  definition.build();
  const delegate=widgets.find(w=>w.id===3).options;
  return {definition,delegate,widgets,listeners,sensor,settings,counts:()=>({adds,removes,writes}),tick:()=>{for(const fn of listeners)fn();}};
}
test('runtime keeps one subscription and refreshes after pause, preferences and midnight', async()=>{
 const h=await harness();
 const texts=h.widgets.filter(w=>w.id===1);
 assert.deepEqual(texts.map(w=>w.text),['10:08','GIO · 01 OTT','','10:08','01 OTT','']);
 assert.deepEqual(texts.map(w=>w.options.show_level),[1,1,1,2,2,2]);
 h.delegate.resume_call();h.delegate.resume_call();assert.equal(h.counts().adds,1);
 const before=h.counts().writes;h.tick();assert.equal(h.counts().writes,before);
 h.delegate.pause_call();h.delegate.pause_call();assert.equal(h.listeners.size,0);assert.equal(h.counts().removes,1);
 Object.assign(h.sensor,{hour:0,minute:0,day:2,week:5});h.settings.language=2;h.settings.format=0;
 h.delegate.resume_call();assert.equal(h.listeners.size,1);
 assert.deepEqual(texts.map(w=>w.text),['12:00','FRI · 02 OCT','AM','12:00','02 OCT','AM']);
 h.sensor.minute=1;h.tick();assert.equal(texts[3].text,'12:01');
 h.definition.onDestroy();assert.equal(h.listeners.size,0);
 h.delegate.resume_call();assert.equal(h.listeners.size,0);
});
test('rebuilding releases the previous listener before subscribing again', async()=>{
 const h=await harness();
 h.definition.build();
 assert.equal(h.listeners.size,1);
 assert.equal(h.counts().adds,2);
 assert.equal(h.counts().removes,1);
 h.definition.onDestroy();assert.equal(h.listeners.size,0);
});
