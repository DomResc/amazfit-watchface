import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'src/watchfaces/retro-lcd');
const manifest = JSON.parse(await readFile(path.join(source, 'app.json'), 'utf8'));
const reference = JSON.parse(await readFile(path.join(root, 'src/watchfaces/essential/app.json'), 'utf8'));
const devices = reference.targets['balance-2-xt'].platforms.filter(device => device.name === 'Amazfit Balance 2');
if (devices.length !== 3) throw new Error('Expected the existing Balance 2 device catalog.');
// Preview a temporary copy so simulator targets never enter installation ZIPs.
const preview = await mkdtemp(path.join(tmpdir(), 'retro-lcd-simulator-'));
for (const entry of ['app.js', 'watchface', 'assets']) {
  await cp(path.join(source, entry), path.join(preview, entry), { recursive: true });
}
// Inject demo readings only into the disposable simulator copy.
const runtimePath = path.join(preview, 'watchface/index.js');
let runtime = await readFile(runtimePath, 'utf8');
runtime = runtime.replace('  const forecast = weather && weather.getForecastWeather ? weather.getForecastWeather() : undefined;',
  '  const forecast = {forecastData:{count:1,data:[{index:0,low:12,high:21}]}};');
runtime = runtime.replace('temperature(weather && weather.current)', 'temperature(17)');
runtime = runtime.replace('const index = weather && Number.isInteger(weather.curAirIconIndex) ? weather.curAirIconIndex : today && today.index;', 'const index = 0;');
const alarmStart = runtime.indexOf('    hmUI.createWidget(hmUI.widget.TEXT_IMG, { ...LAYOUT.alarm');
const alarmEnd = runtime.indexOf('    image(LAYOUT.secondsLabel', alarmStart);
if (alarmStart < 0 || alarmEnd < 0) throw new Error('Native alarm binding was not found.');
runtime = runtime.slice(0, alarmStart) + `    let alarmX = LAYOUT.alarm.x;
    for (const char of '07:00') {
      const name = char === ':' ? 'colon' : char;
      image(alarmX, LAYOUT.alarm.y, 'digits/alarm/' + name + '.png', normal);
      alarmX += GLYPH_WIDTHS.alarm[name];
    }
` + runtime.slice(alarmEnd);
await writeFile(runtimePath, runtime);
console.log('Simulator demo: weather 17°C (12–21°C), alarm 07:00. Device builds use real data.');
manifest.targets['balance-2-xt'].platforms = devices;
await writeFile(path.join(preview, 'app.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Simulator project: ${preview}`);
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('npm_') && key !== 'NODE_PATH' && key !== 'NODE_OPTIONS'));
env.PATH = (env.PATH || '').split(path.delimiter).filter(entry => !entry.startsWith(path.join(root, 'node_modules', '.bin'))).join(path.delimiter);
const child = spawn('zeus', ['dev', '--target', 'Amazfit Balance 2'], { cwd: preview, env, stdio: 'inherit' });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
