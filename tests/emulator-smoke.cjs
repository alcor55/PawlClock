/* eslint-env node */
// Run against the official EspruinoWebIDE emulator files supplied in ESPRUINO_EMU_DIR.
// See README.md for setup. No hardware or account access is used.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const zlib = require('node:zlib');
const dir = process.env.ESPRUINO_EMU_DIR;
if (!dir) throw new Error('Set ESPRUINO_EMU_DIR to the downloaded emulator directory');
const root = path.resolve(__dirname, '..');
let received = '';
const context = vm.createContext({ require, process, Buffer, console, __dirname: dir, __filename,
  module: { exports: {} }, setTimeout, clearTimeout, setInterval, clearInterval,
  onConsoleOutput: () => {}, jsUpdateGfx: () => {} });
for (const file of ['emulator_banglejs2.js', 'emu_banglejs2.js', 'common.js']) {
  vm.runInContext(fs.readFileSync(path.join(dir, file), 'utf8'), context, { filename: file });
}
context.jsRXCallback = ch => { received += String.fromCharCode(ch); };
function send(js) {
  received = '';
  context.jsTransmitString('\x10' + js + '\n');
  context.jsIdle();
  if (/Uncaught|ERROR|Execution Interrupted/.test(received)) throw new Error(received);
  return received;
}
function value(expression) {
  const output = send(`print('RESULT:'+JSON.stringify(${expression}))`);
  const match = output.match(/RESULT:(.*)\r?\n/);
  assert.ok(match, output);
  return JSON.parse(match[1]);
}
function upload(name, contents) {
  for (let offset = 0; offset < contents.length; offset += 512) {
    send(`require('Storage').write(${JSON.stringify(name)},${JSON.stringify(contents.slice(offset, offset + 512))},${offset},${contents.length})`);
  }
}
function advance(ms) {
  send(`for(let timer of global['\\xff'].timers) if(timer) timer.time-=${ms * 1000}`);
  context.jsIdle();
}
function check(expression) { assert.equal(value(`!!(${expression})`), true, expression); }
function framebuffer() {
  const pixels = new Uint8Array(176 * 176 * 4);
  context.jsGetGfxContents(pixels);
  return Buffer.from(pixels);
}
function screenshot(filename) {
  const pixels = framebuffer();
  const scanlines = Buffer.alloc(176 * (176 * 4 + 1));
  for (let y = 0; y < 176; y++) Buffer.from(pixels.buffer, y * 176 * 4, 176 * 4).copy(scanlines, y * (176 * 4 + 1) + 1);
  function crc32(buffer) {
    let crc = -1;
    for (const byte of buffer) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
    return (crc ^ -1) >>> 0;
  }
  function chunk(type, data) {
    const payload = Buffer.concat([Buffer.from(type), data]);
    const length = Buffer.alloc(4), crc = Buffer.alloc(4);
    length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(payload));
    return Buffer.concat([length, payload, crc]);
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(176); header.writeUInt32BE(176, 4); header[8] = 8; header[9] = 6;
  fs.writeFileSync(filename, Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(scanlines)), chunk('IEND', Buffer.alloc(0))]));
}
setTimeout(() => {
  try {
    context.jsInit(); context.jsIdle();
    console.log('Firmware:', value('process.version'));
    for (const name of ['Font8x16', 'Font6x8', 'widget_utils']) upload(name, fs.readFileSync(path.join(dir, name + '.js'), 'utf8'));
    const metadata = JSON.parse(fs.readFileSync(path.join(root, 'metadata.json'), 'utf8'));
    for (const file of metadata.storage.filter(f => !f.evaluate)) upload(file.name, fs.readFileSync(path.join(root, file.url), 'utf8'));
    send("global.nativeHRMPower=Bangle.setHRMPower; global.hrmPowerCalls=[]; Bangle.setHRMPower=function(on,id){hrmPowerCalls.push([on,id]); return nativeHRMPower.call(Bangle,on,id)}; global.originalHRM=Bangle.setHRMPower; global.normalPowerOptions=Bangle.getOptions(); global.originalGPS=Bangle.setGPSPower; global.baselineTimers=global['\\xff'].timers.filter(t=>t).length; global.barCalls=[]; global.originalBar=Bangle.setBarometerPower; Bangle.setBarometerPower=function(on,id){barCalls.push([on,id]); return originalBar.call(Bangle,on,id)}");
    send("require('Storage').writeJSON('pawl-clock.json',{theme:0,bgColor:0,userHeight:183,userStepGoal:7300})");
    check("require('pawlClock').load().theme===1 && require('Storage').readJSON('pawlClock.json').userStepGoal===7300");
    send("global.healthBpm; Bangle.getHealthStatus=function(){return {bpm:global.healthBpm,steps:12345}}; E.getBattery=function(){return 100}; Bangle.setLocked(false); global.nativeDrawString=g.drawString; global.drawnText=[]; g.drawString=function(text){drawnText.push(text); return nativeDrawString.apply(g,arguments)}");
    send("eval(require('Storage').read('pawlClock.app.js'))");
    send("healthBpm=88; Bangle.emit('HRM',{bpm:140,confidence:50})");
    check("drawnText.indexOf(88)>=0 && drawnText.indexOf(140)<0");
    send("healthBpm=123; Bangle.emit('health',{bpm:123})");
    check("drawnText.indexOf(123)>=0");
    send("g.drawString=nativeDrawString; for(let i=0;i<8;i++) Bangle.emit('pressure',{pressure:1012})");
    check("typeof Bangle.uiRedraw==='function'");
    const beforeRedraw = framebuffer();
    send("g.clear(); Bangle.uiRedraw()");
    assert.deepEqual(framebuffer().subarray(95 * 176 * 4), beforeRedraw.subarray(95 * 176 * 4));
    check("barCalls[barCalls.length-1][0]===false");
    const out = process.env.ESPRUINO_SCREENSHOT_DIR || dir;
    fs.mkdirSync(out, { recursive: true }); screenshot(path.join(out, 'dark.png'));
    send("global.expectedHRM=originalHRM.call(Bangle,true,'smoke'); global.expectedGPS=originalGPS.call(Bangle,true,'smoke'); global.hrmResult=Bangle.setHRMPower(true,'smoke'); global.gpsResult=Bangle.setGPSPower(true,'smoke')");
    check('hrmResult===expectedHRM && gpsResult===expectedGPS');
    send("Bangle.setHRMPower(false,'smoke'); Bangle.setGPSPower(false,'smoke'); Bangle.emit('drag',{b:1})");
    advance(1600);
    check("barCalls[barCalls.length-1][0]===true");
    check("Bangle.getOptions().lockTimeout===0 && Bangle.getOptions().lcdPowerTimeout===0 && Bangle.getOptions().backlightTimeout===0 && Bangle.isBacklightOn()");
    // Trace requests: this emulator cannot model the physical HRM sensor.
    check("hrmPowerCalls.some(c=>c[0]===true && c[1]==='pawlClock')");
    send("global.nativeDateNow=Date.now; global.liveTestTime=Math.floor(Date.now()/60000)*60000+20000; Date.now=function(){return liveTestTime}; Bangle.uiRedraw()");
    const steadyClock = framebuffer().subarray(29 * 176 * 4, 88 * 176 * 4);
    send("liveTestTime+=1000"); advance(1100);
    const hiddenClock = framebuffer().subarray(29 * 176 * 4, 88 * 176 * 4);
    assert.notDeepEqual(hiddenClock, steadyClock, 'colon must disappear on odd seconds');
    let changedPixels = 0;
    for (let i = 0; i < steadyClock.length; i += 4) {
      if (!steadyClock.subarray(i,i+4).equals(hiddenClock.subarray(i,i+4))) {
        changedPixels++;
        const x = i / 4 % 176;
        assert.ok(x > 65 && x < 105, 'blink must not erase the hour or minute digits');
      }
    }
    assert.ok(changedPixels > 0 && changedPixels < 600);
    send("liveTestTime+=1000"); advance(1100);
    assert.ok(framebuffer().subarray(29 * 176 * 4, 88 * 176 * 4).equals(steadyClock), 'colon must reappear without changing neighboring digits');
    send("Date.now=nativeDateNow; Bangle.emit('drag',{b:0})");
    check("['lockTimeout','lcdPowerTimeout','backlightTimeout'].every(k=>Bangle.getOptions()[k]===normalPowerOptions[k])");
    check("hrmPowerCalls[hrmPowerCalls.length-1][0]===false && hrmPowerCalls[hrmPowerCalls.length-1][1]==='pawlClock'");
    send("Bangle.setUI()");
    check('Bangle.setHRMPower===originalHRM && Bangle.setGPSPower===originalGPS && barCalls[barCalls.length-1][0]===false');
    check("global['\\xff'].timers.filter(t=>t).length===baselineTimers");
    check('!g.fillRoundedRect && !Graphics.prototype.setFontLato70');
    send("require('Storage').writeJSON('pawlClock.json',{theme:0,offScreenUpd:false,stepIntervall:0}); eval(require('Storage').read('pawlClock.app.js'))");
    send("for(let i=0;i<8;i++) Bangle.emit('pressure',{pressure:999})");
    screenshot(path.join(out, 'light.png'));
    send("Bangle.setLCDPower(false)");
    check("barCalls[barCalls.length-1][0]===false && global['\\xff'].timers.filter(t=>t).length===baselineTimers");
    send("Bangle.setLCDPower(true)"); check('barCalls[barCalls.length-1][0]===true');
    send("Bangle.setUI(); require('Storage').writeJSON('pawlClock.json',{offScreenUpd:true}); eval(require('Storage').read('pawlClock.app.js')); Bangle.setLocked(false); Bangle.setLCDPower(false); Bangle.emit('drag',{b:1})");
    advance(1600);
    check("!global['\\xff'].timers.some(t=>t && t.interval===1000000)");
    send("Bangle.setLCDPower(true); Bangle.setUI()");
    send("eval(require('Storage').read('pawlClock.app.js')); global.observedHRM=Bangle.setHRMPower; global.observedGPS=Bangle.setGPSPower; global.widgetHRM=function(on,id){return observedHRM(on,id)}; global.widgetGPS=function(on,id){return observedGPS(on,id)}; Bangle.setHRMPower=widgetHRM; Bangle.setGPSPower=widgetGPS; Bangle.setUI()");
    check("Bangle.setHRMPower===widgetHRM && Bangle.setGPSPower===widgetGPS");
    send("Bangle.setHRMPower(true,'widget'); Bangle.setGPSPower(true,'widget')");
    check("global['\\xff'].timers.filter(t=>t).length===baselineTimers");
    send("Bangle.setHRMPower(false,'widget'); Bangle.setGPSPower(false,'widget'); Bangle.setHRMPower=originalHRM; Bangle.setGPSPower=originalGPS");
    for (let cycle = 0; cycle < 3; cycle++) {
      send("eval(require('Storage').read('pawlClock.app.js')); Bangle.setUI()");
      check("global['\\xff'].timers.filter(t=>t).length===baselineTimers && Bangle.setHRMPower===originalHRM && Bangle.setGPSPower===originalGPS");
    }
    send("eval(require('Storage').read('pawlClock.app.js')); eval(require('Storage').read('pawlClock.app.js')); Bangle.setUI()");
    check("global['\\xff'].timers.filter(t=>t).length===baselineTimers && Bangle.setHRMPower===originalHRM && Bangle.setGPSPower===originalGPS");
    check("typeof canDraw==='undefined' && typeof startDataUpdates==='undefined'");
    // Check native option round-tripping; this emulator does not advance the
    // hardware inactivity counter while waiting in Node.js.
    send("Bangle.setOptions({lockTimeout:800,lcdPowerTimeout:900,backlightTimeout:700}); Bangle.setLCDPower(true); Bangle.setLocked(false); eval(require('Storage').read('pawlClock.app.js')); Bangle.emit('drag',{b:1})");
    advance(1600);
    check("Bangle.isLCDOn() && Bangle.isBacklightOn() && !Bangle.isLocked()");
    send("Bangle.emit('drag',{b:0})");
    check("Bangle.getOptions().lockTimeout===800 && Bangle.getOptions().lcdPowerTimeout===900 && Bangle.getOptions().backlightTimeout===700");
    send("Bangle.setUI(); Bangle.setOptions(normalPowerOptions); Bangle.setLCDPower(true); Bangle.setLocked(false)");
    send("global.savedMenu; global.realShowMenu=E.showMenu; E.showMenu=function(menu){global.savedMenu=menu; return realShowMenu(menu)}; eval(require('Storage').read('pawlClock.settings.js'))(function(){})");
    screenshot(path.join(out, 'settings.png'));
    check("savedMenu['Step Goal'].min===1000 && savedMenu['Step Goal'].max===10000");
    send("savedMenu['Weather Min Pressure'].onchange(1010)"); advance(1);
    check("savedMenu['Weather Max Pressure'].min===1011");
    console.log('Emulator smoke checks passed; screenshots:', out);
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { context.jsStopIdle(); }
}, 0);
