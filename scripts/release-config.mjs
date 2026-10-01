import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function releaseConfig(tag, manifest, name = 'essential') {
  const version = manifest.app.version.name;
  if (!['essential', 'matrix'].includes(name) ||
      !/^\d+\.\d+\.\d+$/.test(version) || tag !== `${name}-v${version}`) {
    throw new Error('Release tag must equal <watchface>-v<manifest version>.');
  }
  const catalog = JSON.parse(readFileSync(new URL(`../src/watchfaces/${name}/targets.json`, import.meta.url), 'utf8'));
  const platforms = manifest.targets['balance-2-xt'].platforms;
  if (manifest.app.appType !== 'watchface' || catalog.shape !== 'round' ||
      JSON.stringify(catalog.resolution) !== '[480,480]' ||
      JSON.stringify(platforms) !== JSON.stringify(catalog.devices)) {
    throw new Error('Release targets must match the round 480x480 catalog.');
  }
  return { version, asset: 'install/*.zip' };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tag = process.env.RELEASE_TAG;
  const match = /^(essential|matrix)-v\d+\.\d+\.\d+$/.exec(tag || '');
  if (!match) throw new Error('Unsupported watchface release tag.');
  const name = match[1];
  const manifest = JSON.parse(readFileSync(new URL(`../src/watchfaces/${name}/app.json`, import.meta.url), 'utf8'));
  const config = releaseConfig(tag, manifest, name);
  console.log(`name=${name}\ntitle=${manifest.app.appName}\nversion=${config.version}\nasset=${config.asset}`);
}
