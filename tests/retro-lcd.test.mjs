import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile, access } from 'node:fs/promises';
import { formatDisplay, progressLevel } from '../src/watchfaces/retro-lcd/watchface/format.js';
import { releaseConfig } from '../scripts/release-config.mjs';
const sample = {hour:14,minute:9,month:10,day:1,week:4};
test('Retro LCD respects 12/24-hour settings, noon, midnight and missing data',()=>{
  assert.equal(formatDisplay(sample,2,1).time,'1409');
  assert.equal(formatDisplay(sample,2,0).time,'0209');
  assert.equal(formatDisplay(sample,2,0).period,'PM');
  assert.equal(formatDisplay({...sample,hour:0},2,0).time,'1209');
  assert.equal(formatDisplay({...sample,hour:0},2,0).period,'AM');
  assert.equal(formatDisplay({...sample,hour:12},2,0).period,'PM');
  assert.equal(formatDisplay(sample,10,1).weekday,'it/4');
  assert.equal(formatDisplay({...sample,month:1,day:2},2,1).date,'0102');
  assert.equal(formatDisplay({},2,1).time,'----');
  assert.equal(formatDisplay({...sample,hour:24},2,1).period,'--');
  assert.equal(formatDisplay({...sample,week:0},2,1).weekday,'en/unknown');
});
test('progress clamps overruns and rejects missing targets and invalid readings',()=>{
  assert.equal(progressLevel(8240,10000,20),16);
  assert.equal(progressLevel(20000,10000,20),20);
  assert.equal(progressLevel(100,100,10),10);
  for(const [value,target] of [[1,0],[NaN,100],[10,NaN],[-1,100],[Infinity,100]])assert.equal(progressLevel(value,target,20),0);
});
async function harness(){
  const widgets=[];const sensors=[];let definition;let writes=0;
  const settings={language:2,timeFormat:1};
  const kinds={IMG:1,TEXT_IMG:2,FILL_RECT:3,IMG_TIME:4,IMG_STATUS:5,WIDGET_DELEGATE:6};
  const sensorValues=[sample,{current:8240,target:10000},{current:97},{current:486,target:600},{current:45,target:60},{current:17,curAirIconIndex:0,getForecastWeather:()=>({forecastData:{count:1,data:[{index:0,low:12,high:21}]}})},{updateInfo(){},getTotalTime:()=>444}];
  const ui={widget:kinds,prop:{MORE:1},align:{CENTER_H:1,LEFT:2},show_level:{ONLY_NORMAL:1,ONAL_AOD:2},data_type:{STEP:1,CAL:2,HEART:3,ALARM_CLOCK:4},system_status:{CLOCK:1,DISCONNECT:2,DISTURB:3},createWidget(id,options){const w={id,options:{...options},setProperty(prop,value){assert.equal(prop,1);Object.assign(this.options,value);writes++;}};widgets.push(w);return w;}};
  const context=vm.createContext({hmUI:ui,hmSensor:{id:{TIME:0,STEP:1,BATTERY:2,CALORIE:3,FAT_BURRING:4,WEATHER:5,SLEEP:6},event:{CHANGE:2,LAST:3},createSensor(id){const listeners=new Map();const sensor={...sensorValues[id],event:{MINUTEEND:1},listeners,addEventListener(event,fn){assert.ok(!listeners.has(fn));listeners.set(fn,event);},removeEventListener(event,fn){if(listeners.has(fn))assert.equal(listeners.get(fn),event);listeners.delete(fn);}};sensors.push(sensor);return sensor;}},hmSetting:{getLanguage:()=>settings.language,getTimeFormat:()=>settings.timeFormat},WatchFace:config=>{definition=config;}});
  const modules=new Map();
  async function load(url){
    if(modules.has(url.href))return modules.get(url.href);
    const source=await readFile(url,'utf8');
    const module=url.pathname.endsWith('.json')?new vm.SyntheticModule(['default'],function(){this.setExport('default',JSON.parse(source));},{context,identifier:url.href}):new vm.SourceTextModule(source,{context,identifier:url.href});
    modules.set(url.href,module);
    if(!url.pathname.endsWith('.json'))await module.link((specifier,parent)=>load(new URL(specifier.endsWith('.json')?specifier:`${specifier}.js`,parent.identifier)));
    return module;
  }
  const module=await load(new URL('../src/watchfaces/retro-lcd/watchface/index.js',import.meta.url));await module.evaluate();definition.build();
  const delegate=widgets.find(w=>w.id===kinds.WIDGET_DELEGATE).options;
  return {widgets,sensors,settings,kinds,definition,delegate,writes:()=>writes,tick(){for(const s of sensors)for(const fn of s.listeners.keys())fn();}};
}
test('real alarm, Bluetooth and DND are bound to native normal-only widgets; resources exist',async()=>{
  const h=await harness();
  const native=h.widgets.filter(w=>[h.kinds.TEXT_IMG,h.kinds.IMG_STATUS,h.kinds.IMG_TIME].includes(w.id));
  assert.equal(native.length,5);
  for(const w of native)assert.equal(w.options.show_level,1);
  assert.equal(h.widgets.filter(w=>w.id===h.kinds.TEXT_IMG && w.options.type===4).length,1);
  assert.deepEqual(h.widgets.filter(w=>w.id===h.kinds.IMG_STATUS).map(w=>[w.options.type,w.options.src]),[[1,'status/alm.png'],[2,'status/sig-off.png'],[3,'status/mute.png']]);
  const seconds=h.widgets.find(w=>w.id===h.kinds.IMG_TIME).options;
  assert.equal(seconds.second_zero,1);assert.equal(seconds.second_space,0);
  for(const w of h.widgets)for(const value of Object.values(w.options)){
    const paths=Array.isArray(value)?value:typeof value==='string' && value.endsWith('.png')?[value]:[];
    for(const path of paths)await access(new URL(`../src/watchfaces/retro-lcd/assets/balance-2-xt/${path}`,import.meta.url));
  }
  assert.equal(h.widgets.filter(w=>w.options.show_level===2).length,11);
});
test('lifecycle detaches every sensor, refreshes resume and suppresses unchanged writes',async()=>{
  const h=await harness();const first=h.writes();h.tick();assert.equal(h.writes(),first);
  h.delegate.resume_call();h.delegate.resume_call();assert.ok(h.sensors.slice(0,5).every(s=>s.listeners.size===1));
  h.delegate.pause_call();h.delegate.pause_call();assert.ok(h.sensors.every(s=>s.listeners.size===0));
  Object.assign(h.sensors[0],{hour:0,minute:0,month:1,day:2,week:5});h.settings.language=10;h.settings.timeFormat=0;
  h.sensors[1].current=100;
  h.delegate.resume_call();
  assert.equal(h.widgets.find(w=>w.options.src?.startsWith('period/')).options.src,'period/AM.png');
  assert.equal(h.widgets.find(w=>w.options.x===129 && w.options.y===391).options.src,'week/it/5.png');
  assert.equal(h.widgets.filter(w=>w.options.src?.startsWith('ring/')).length,3);
  assert.equal(h.sensors.length,7);
  assert.equal(h.widgets.find(w=>w.options.x===313 && w.options.y===268).options.src,'battery/10.png');
  h.definition.build();assert.ok(h.sensors.slice(0,7).every(s=>s.listeners.size===0));
  h.definition.onDestroy();h.delegate.resume_call();assert.ok(h.sensors.every(s=>s.listeners.size===0));
});
test('Retro LCD release identity and target catalog remain independent',async()=>{
  const manifest=JSON.parse(await readFile(new URL('../src/watchfaces/retro-lcd/app.json',import.meta.url),'utf8'));
  assert.equal(manifest.app.appId,1092704);
  assert.deepEqual(releaseConfig(`retro-lcd-v${manifest.app.version.name}`,manifest,'retro-lcd'),{version:manifest.app.version.name,asset:'install/*.zip'});
  assert.throws(()=>releaseConfig('matrix-v0.1.0',manifest,'retro-lcd'));
});

test('approved geometry aligns second bottoms and contains only icon activity rings',async()=>{
  const h=await harness();
  const alarm=h.widgets.find(w=>w.id===h.kinds.TEXT_IMG && w.options.type===4).options;
  assert.equal(alarm.padding,true);
  assert.ok(alarm.w >= 4 * 20 + 5);
  const seconds=h.widgets.find(w=>w.id===h.kinds.IMG_TIME).options;
  assert.equal(seconds.second_startY+26,303+70);
  assert.equal(h.widgets.filter(w=>w.options.src?.startsWith('icons/')).length,3);
  assert.equal(h.widgets.filter(w=>w.id===h.kinds.TEXT_IMG).length,1);
  assert.equal(h.widgets.find(w=>w.options.src?.startsWith('period/')).options.src,'period/blank.png');
  assert.equal(h.widgets.find(w=>w.options.src?.startsWith('ring/active/')).options.src,'ring/active/75.png');
});
test('weather and sleep refresh on resume, invalid data uses placeholders',async()=>{
  const h=await harness();
  h.delegate.pause_call();
  h.sensors[5].current=-12;
  h.sensors[5].curAirIconIndex=28;
  h.sensors[6].getTotalTime=()=>754;
  h.delegate.resume_call();
  assert.equal(h.widgets.find(w=>w.options.src?.startsWith('weather/')).options.src,'weather/28.png');
  assert.equal(h.widgets.filter(w=>w.options.y===70).map(w=>w.options.src).join(','),'digits/temperature/dash.png,digits/temperature/1.png,digits/temperature/2.png');
  assert.equal(h.widgets.filter(w=>w.options.y===181).map(w=>w.options.src).join(','),'digits/sleep/1.png,digits/sleep/2.png,digits/sleep/colon.png,digits/sleep/3.png,digits/sleep/4.png');
  h.sensors[5].current=Infinity;h.sensors[5].curAirIconIndex=999;
  h.sensors[5].getForecastWeather=()=>({forecastData:{count:0,data:[]}});
  h.sensors[6].getTotalTime=()=>NaN;h.tick();
  assert.equal(h.widgets.find(w=>w.options.src?.startsWith('weather/')).options.src,'weather/25.png');
  assert.equal(h.widgets.filter(w=>w.options.y===181).map(w=>w.options.src).join(','),'digits/sleep/dash.png,digits/sleep/dash.png,digits/sleep/colon.png,digits/sleep/dash.png,digits/sleep/dash.png');
});

test('normal date uses day/month and status captions share one baseline',async()=>{
  const h=await harness();
  const date=h.widgets.filter(w=>w.options.y===387 && w.options.show_level===1).sort((a,b)=>a.options.x-b.options.x).map(w=>w.options.src);
  assert.deepEqual(date,['digits/date/0.png','digits/date/1.png','digits/date/slash.png','digits/date/1.png','digits/date/0.png']);
  assert.ok(h.widgets.filter(w=>w.id===h.kinds.IMG_STATUS).every(w=>w.options.y===435));
});

test('AOD shares normal time/date geometry and stays free of secondary data',async()=>{
  const h=await harness();
  const normalTime=h.widgets.filter(w=>w.options.src?.startsWith('digits/time/') && w.options.show_level===1);
  const aodTime=h.widgets.filter(w=>w.options.src?.startsWith('digits/aod/') && w.options.show_level===2);
  assert.deepEqual(aodTime.map(w=>[w.options.x,w.options.y]),normalTime.map(w=>[w.options.x,w.options.y]));
  assert.ok(h.widgets.some(w=>w.options.src==='digits/aod-date/slash.png' && w.options.y===387));
  assert.ok(h.widgets.filter(w=>w.options.show_level===2).every(w=>w.options.src?.startsWith('digits/') || w.options.src?.startsWith('week/')));
});

test('Retro LCD includes the full round 480 by 480 target catalog',async()=>{
  const base=new URL('../src/watchfaces/',import.meta.url);
  const expected=JSON.parse(await readFile(new URL('essential/targets.json',base),'utf8'));
  const actual=JSON.parse(await readFile(new URL('retro-lcd/targets.json',base),'utf8'));
  const manifest=JSON.parse(await readFile(new URL('retro-lcd/app.json',base),'utf8'));
  assert.deepEqual(actual,expected);
  assert.deepEqual(manifest.targets['balance-2-xt'].platforms,expected.devices);
});
