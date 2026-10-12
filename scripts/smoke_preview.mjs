// Run in CI after installing Playwright into the isolated .qa directory.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const require = createRequire(new URL('../.qa/package.json', import.meta.url));
const { chromium } = require('playwright');
const server = spawn('python', ['-m','http.server','8973','--bind','127.0.0.1'], {stdio:'ignore'});
let browser;
try {
  for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:8973/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch();
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror', e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8973/');
  await page.locator('#preview-loading').waitFor({state:'hidden'});
  await page.locator('.hero-art').click();
  await page.waitForFunction(()=>{
    const top=document.getElementById('live-app').getBoundingClientRect().top;
    const bottom=document.getElementById('preview-shell').getBoundingClientRect().bottom;
    return top>=0 && top<25 && bottom<=innerHeight;
  });
  const frame=page.frameLocator('#app-preview');
  await page.locator('button[data-demo="search"][data-value="snare"]').click();
  await frame.locator('#hits').filter({hasText:/matches/}).waitFor();
  assert.equal(await frame.locator('#q').inputValue(),'snare');
  await page.locator('button[data-demo="search"][data-value=""]').click();
  await page.locator('button[data-demo="layout"]').click();
  await frame.locator('#phys').waitFor({state:'visible'});
  await page.locator('button[data-demo="layout"]').click();
  await page.locator('#feature-open').click();
  await frame.locator('#kit').waitFor({state:'visible'});
  await page.locator('.pad-grid button').first().click();
  await page.waitForFunction(()=>{const audio=document.getElementById('showcase-audio');return audio && !audio.paused && audio.currentTime>0;});
  assert.ok(!(await page.locator('#pad-status').innerText()).includes('could not'));
  await page.locator('button[data-demo="project"]').click();
  await frame.locator('#projpop').waitFor({state:'visible'});
  assert.ok(await frame.locator('#tkeep').isEnabled(),'Desktop pitch engine must be available');
  await frame.locator('#pbpm').fill('128');
  await frame.locator('#pbpm').dispatchEvent('change');
  assert.equal(await frame.locator('#pbpm').inputValue(),'128');
  for (const width of [1440,768,390]) {
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow at ${width}`);
  }
  assert.deepEqual(errors,[]);
  console.log('Browser smoke passed: boot, search, layouts, kit, audio pads and responsive layout.');
} finally {await browser?.close();server.kill();}
