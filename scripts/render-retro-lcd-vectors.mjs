// Use the Sharp installation already bundled with Zeus; no project dependency is required.
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const require = createRequire(import.meta.url);
if (!process.argv[2]) throw new Error('Usage: node scripts/render-retro-lcd-vectors.mjs /path/to/zeus-cli/node_modules/sharp');
const sharp = require(path.resolve(process.argv[2]));
const project = fileURLToPath(new URL('../src/watchfaces/retro-lcd/', import.meta.url));
async function render(source, destination, size, ink) {
  let svg = await readFile(path.join(project, source), 'utf8');
  svg = svg.replaceAll('viewBox="0 0 24 24"', 'viewBox="-2 -2 28 28"');
  if (ink) svg = svg.replace(/stroke="#[0-9a-f]+"/gi, `stroke="${ink}"`);
  const pixels = await sharp(Buffer.from(svg), { density: 384 }).resize(size, size, { fit: 'contain', background: '#00000000' }).png().toBuffer();
  await writeFile(path.join(project, destination), pixels);
}
await render('background-source.svg', 'background-source.png', 480);
const mapping = JSON.parse(await readFile(path.join(project, 'weather-vectors/mapping.json'), 'utf8'));
for (const [index, family] of mapping.entries()) {
  await render(`weather-vectors/${family}.svg`, `assets/balance-2-xt/weather/${index}.png`, 32);
}
// Keep the existing 18-pixel boxes and runtime positions, with a smaller vector inside.
for (const name of ['footprints', 'flame', 'timer']) {
  const svg = (await readFile(path.join(project, `${name}.svg`), 'utf8')).replace('viewBox="0 0 24 24"', 'viewBox="-2 -2 28 28"');
  const icon = await sharp(Buffer.from(svg), { density: 384 }).resize(14, 14).png().toBuffer();
  await sharp({ create: { width: 18, height: 18, channels: 4, background: '#00000000' } })
    .composite([{ input: icon, left: 2, top: 2 }]).png().toFile(path.join(project, `assets/balance-2-xt/icons/${name}.png`));
}
