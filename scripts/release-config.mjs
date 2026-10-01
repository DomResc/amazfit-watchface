import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function releaseConfig(tag, manifest) {
  const version = manifest.app.version.name;
  if (!/^\d+\.\d+\.\d+$/.test(version) || tag !== `essential-v${version}`) {
    throw new Error('Release tag must equal essential-v<manifest version>.');
  }
  if (manifest.app.appType !== 'watchface' ||
      JSON.stringify(manifest.targets['balance-2-xt'].platforms.map(p => p.deviceSource)) !== '[10486017]') {
    throw new Error('Release requires the explicit Balance 2 XT watchface target.');
  }
  return { version, asset: `essential-${version}-10486017.zip` };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifest = JSON.parse(readFileSync(new URL('../src/watchfaces/essential/app.json', import.meta.url), 'utf8'));
  const config = releaseConfig(process.env.RELEASE_TAG, manifest);
  console.log(`version=${config.version}\nasset=${config.asset}`);
}
