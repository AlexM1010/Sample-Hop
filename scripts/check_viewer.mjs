// The desktop viewer's deferred main script must parse before it is deployed.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html = readFileSync(new URL('../demo/index.html', import.meta.url), 'utf8');
let count = 0;
for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
  if (/application\/octet-stream/.test(match[1]) || !match[2].trim()) continue;
  new vm.Script(match[2], { filename: `desktop-preview-${++count}.js` });
}
if (count < 3) throw new Error('Desktop viewer boot contract changed');
console.log(`${count} desktop viewer scripts parse successfully.`);
