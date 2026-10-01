import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const name = process.argv[2];
if (!['essential', 'matrix'].includes(name)) throw new Error('Usage: npm run build -- essential|matrix');
if (process.version !== 'v24.19.0') throw new Error('Use Node 24.19.0 (see .nvmrc).');
const cwd = path.join(root, 'src/watchfaces', name);
const manifest = JSON.parse(readFileSync(path.join(cwd, 'app.json'), 'utf8'));
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('npm_') && key !== 'NODE_PATH' && key !== 'NODE_OPTIONS'));
// Zeus uses its own bundled tooling rather than npm's injected root binaries.
env.PATH = (env.PATH || '').split(path.delimiter).filter(p => !p.startsWith(path.join(root, 'node_modules', '.bin'))).join(path.delimiter);
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd, env, ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed with status ${result.status}`);
  return result;
}
const version = run('zeus', ['--version'], { encoding: 'utf8' }).stdout.replace(/\x1b\[[0-9;]*m/g, '');
if (!/zeus: v1\.9\.3(?:\s|$)/.test(version)) throw new Error('Install Zeus CLI 1.9.3.');
run('zeus', ['build'], { stdio: 'inherit' });
run('python3', [path.join(root, 'scripts/package-watchface.py'), path.join(cwd, 'dist'), String(manifest.app.appId), manifest.app.version.name, name], { stdio: 'inherit' });
