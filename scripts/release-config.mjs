import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function releaseConfig(tag, manifest) {
  const version = manifest.app.version.name;
  if (!/^\d+\.\d+\.\d+$/.test(version) || tag !== `essential-v${version}`) {
    throw new Error('Release tag must equal essential-v<manifest version>.');
  }
  const catalog = JSON.parse(readFileSync(new URL('../src/watchfaces/essential/targets.json', import.meta.url), 'utf8'));
  const platforms = manifest.targets['balance-2-xt'].platforms;
  if (manifest.app.appType !== 'watchface' || catalog.shape !== 'round' ||
      JSON.stringify(catalog.resolution) !== '[480,480]' ||
      JSON.stringify(platforms) !== JSON.stringify(catalog.devices)) {
    throw new Error('Release targets must match the round 480x480 catalog.');
  }
  return { version, asset: 'install/*.zip' };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifest = JSON.parse(readFileSync(new URL('../src/watchfaces/essential/app.json', import.meta.url), 'utf8'));
  const config = releaseConfig(process.env.RELEASE_TAG, manifest);
  console.log(`version=${config.version}\nasset=${config.asset}`);
}
