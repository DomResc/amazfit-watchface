import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {releaseConfig} from '../scripts/release-config.mjs';
const manifest=JSON.parse(readFileSync(new URL('../src/watchfaces/essential/app.json',import.meta.url),'utf8'));
test('release selects the ZIP matching the tagged manifest version',()=>{
 const version=manifest.app.version.name;
 assert.deepEqual(releaseConfig(`essential-v${version}`,manifest),{version,asset:'install/*.zip'});
});
test('release rejects mismatched tags, malformed versions and other targets',()=>{
 for(const tag of ['v0.1.2','essential-v9.9.9','essential-v0.1.2; echo invalid'])assert.throws(()=>releaseConfig(tag,manifest));
 const modified=structuredClone(manifest);modified.app.version.name='0.1.2-beta';
 assert.throws(()=>releaseConfig('essential-v0.1.2-beta',modified));
 const wrongTarget=structuredClone(manifest);wrongTarget.targets['balance-2-xt'].platforms[0].deviceSource=1;
 assert.throws(()=>releaseConfig(`essential-v${manifest.app.version.name}`,wrongTarget));
});
