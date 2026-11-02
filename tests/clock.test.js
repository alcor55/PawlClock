/* eslint-env node */
'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
const root = path.resolve(__dirname, '..');
const source = name => fs.readFileSync(path.join(root, name), 'utf8');

function harness(options = {}) {
  const files = JSON.parse(JSON.stringify(options.files || {}));
  if (options.settings) files['pawlClock.json'] = options.settings;
  const writes = [], calls = [], draw = [], timers = new Map();
  const state = Object.assign({ lcd: true, locked: false, charging: false, steps: 1200,
    battery: 80, hrm: false, gps: false, fix: 0, time: '12:34', backlight: true }, options.state);
  let now = Date.UTC(2026, 10, 2, 12, 34, 20), serial = 0, menu, ui;
  const owners = new Set(['other-app']);
  const Bangle = new EventEmitter(), NRF = new EventEmitter();
  const hrmOwners = new Set(state.hrm ? ['other-app'] : []);
  const powerOptions = Object.assign({ lockTimeout: 7000, lcdPowerTimeout: 0, backlightTimeout: 5000, wakeOnTouch: false }, options.powerOptions);
  let font = ['Vector', 10];
  const g = {};
  for (const method of ['clear', 'fillRect', 'fillCircle', 'fillPoly', 'drawImage', 'drawString', 'setPixel']) {
    g[method] = (...args) => {
      if (['fillRect', 'fillCircle', 'setPixel'].includes(method)) {
        assert.ok(args.every(Number.isFinite), `${method}: non-finite coordinates`);
      }
      if (method === 'fillPoly') assert.ok(args[0].every(Number.isFinite));
      draw.push({ method, args, font: [...font] }); return g;
    };
  }
  for (const method of ['setColor', 'setFontAlign', 'setClipRect']) g[method] = () => g;
  g.getWidth = g.getHeight = () => 176;
  g.reset = () => { font = ['Vector', 10]; return g; };
  g.setFont = (name, size) => { font = [name, size]; return g; };
  g.setFontCustom = () => { font = ['Lato', 53]; return g; };
  g.stringWidth = text => String(text).length * (font[0] === 'Lato' ? 34 : (font[1] || 8) * 0.6);
  function Graphics() {}
  const oldHRM = function(on, id) {
    assert.equal(this, Bangle); calls.push(['hrm', on, id]);
    if (on) hrmOwners.add(id || 'anonymous'); else hrmOwners.delete(id || 'anonymous');
    state.hrm = hrmOwners.size > 0; return state.hrm;
  };
  const oldGPS = function(on, id) {
    assert.equal(this, Bangle); calls.push(['gps', on, id]); state.gps = !!on; return state.gps;
  };
  Object.assign(Bangle, {
    getOptions: () => Object.assign({}, powerOptions),
    setOptions: value => { Object.assign(powerOptions, value); },
    setBacklight: value => { state.backlight = value; },
    setLocked: value => { if (state.locked !== value) { state.locked = value; Bangle.emit('lock', value); } },
    getHealthStatus: () => ({ bpm: 70, steps: state.steps }),
    isLCDOn: () => state.lcd, isLocked: () => state.locked,
    isCharging: () => state.charging, isHRMOn: () => state.hrm, isGPSOn: () => state.gps,
    getGPSFix: () => ({ fix: state.fix }), setHRMPower: oldHRM, setGPSPower: oldGPS,
    setBarometerPower: (on, id) => { calls.push(['bar', on, id]); if (on) owners.add(id); else owners.delete(id); },
    setUI: value => { if (ui) ui.remove(); ui = value; },
    loadWidgets: () => {}, drawWidgets: () => calls.push(['widgets'])
  });
  NRF.getSecurityStatus = () => ({ connected: false });
  const storage = {
    readJSON: name => files[name] === undefined ? undefined : JSON.parse(JSON.stringify(files[name])),
    writeJSON: (name, value) => { files[name] = JSON.parse(JSON.stringify(value)); writes.push(name); },
    getFree: () => 3000000
  };
  class FakeDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  let decompressCount = 0;
  const modules = {
    Storage: storage, locale: { time: () => state.time, dow: () => 'Mon', month: () => 'Nov' },
    widget_utils: { hide: () => {}, show: () => {} },
    heatshrink: { decompress: () => { decompressCount++; return 'bitmap'; } },
    Font8x16: { add: () => {} }, Font6x8: { add: () => {} }
  };
  function setTimer(fn, ms, interval) {
    assert.ok(Number.isFinite(ms) && ms >= 0, 'invalid timer period');
    const id = serial++; timers.set(id, { fn, ms, due: now + ms, interval }); return id;
  }
  const context = vm.createContext({
    g, Graphics, Bangle, NRF, console, Date: FakeDate,
    E: { getBattery: () => state.battery, toString: value => value, showMenu: value => { menu = value; } },
    process: { memory: () => ({ usage: state.ramUsage === undefined ? 100 : state.ramUsage, total: 1000 }), env: { STORAGE: 4000000 } },
    atob: s => Buffer.from(s, 'base64').toString('binary'),
    require: name => { assert.ok(name in modules, `unknown module ${name}`); return modules[name]; },
    setTimeout: (fn, ms) => setTimer(fn, ms, false),
    setInterval: (fn, ms) => setTimer(fn, ms, true),
    clearTimeout: id => timers.delete(id), clearInterval: id => timers.delete(id)
  });
  context.exports = {};
  vm.runInContext(source('lib.js'), context);
  modules['pawlClock'] = context.exports;
  delete context.exports;
  function advance(ms) {
    const end = now + ms;
    for (let count = 0; count < 10000; count++) {
      let next;
      for (const entry of timers.entries()) if (entry[1].due <= end && (!next || entry[1].due < next[1].due)) next = entry;
      if (!next) { now = end; return; }
      const [id, timer] = next; now = timer.due;
      if (timer.interval) timer.due += timer.ms; else timers.delete(id);
      timer.fn();
    }
    throw new Error('runaway timers');
  }
  function emit(event, value) {
    if (event === 'lock') state.locked = value;
    if (event === 'lcdPower') state.lcd = value;
    if (event === 'charging') state.charging = value;
    Bangle.emit(event, value);
  }
  return { files, writes, calls, draw, timers, state, owners, Bangle, NRF, g, Graphics,
    hrmOwners, config: modules['pawlClock'], oldHRM, oldGPS, context, advance, emit,
    start: () => vm.runInContext(source('app.js'), context),
    menu: () => { vm.runInContext(source('settings.js'), context)(() => {}); return menu; },
    redraw: () => ui.redraw(),
    currentMenu: () => menu, remove: () => ui.remove(), decompressCount: () => decompressCount };
}
function sample(h, pressure = 1012) { for (let i = 0; i < 8; i++) h.emit('pressure', { pressure }); }
function assertClean(h, expectedHRM = h.oldHRM, expectedGPS = h.oldGPS) {
  assert.equal(h.timers.size, 0);
  assert.ok(!h.hrmOwners.has('pawlClock'));
  assert.equal(h.Bangle.getOptions().lockTimeout, 7000);
  assert.equal(h.Bangle.getOptions().lcdPowerTimeout, 0);
  assert.equal(h.Bangle.getOptions().backlightTimeout, 5000);
  assert.deepEqual([...h.owners], ['other-app']);
  assert.equal(h.Bangle.eventNames().length, 0);
  assert.equal(h.NRF.eventNames().length, 0);
  assert.equal(h.Bangle.setHRMPower, expectedHRM);
  assert.equal(h.Bangle.setGPSPower, expectedGPS);
  assert.equal(h.g.fillRoundedRect, undefined);
  assert.equal(h.Graphics.prototype.setFontLato70, undefined);
}

test('defaults are consistent and do not write flash on normal startup', () => {
  const h = harness(); assert.equal(h.config.load().theme, 1); h.start();
  assert.deepEqual(h.writes, []); assert.equal(h.menu().Theme.value, 1); h.remove(); assertClean(h);
});
test('legacy preferences migrate once and retain the actually displayed theme', () => {
  const h = harness({ files: { 'pawl-clock.json': { theme: 0, bgColor: 0, userHeight: 183, userStepGoal: 7200, stepIntervall: 0 } } });
  const s = h.config.load(); assert.equal(s.theme, 1); assert.equal(s.userHeight, 183);
  assert.equal(s.userStepGoal, 7200); assert.equal(s.stepIntervall, 0);
  h.config.load(); assert.deepEqual(h.writes, ['pawlClock.json']);
});
test('canonical settings take precedence and the secondary legacy filename migrates', () => {
  const h = harness({ files: { 'pawlClock.json': { theme: 0 }, 'pawl-clock.json': { theme: 1 } } });
  assert.equal(h.config.load().theme, 0); assert.deepEqual(h.writes, []);
  assert.equal(harness({ files: { 'pawl.settings.json': { userHeight: 190 } } }).config.load().userHeight, 190);
});
test('invalid settings and crossed pressure limits fall back safely', () => {
  const h = harness({ settings: { theme: 99, userStepGoal: 0, userHeight: -5, debug: 'yes', memIntervall: -1,
    barIntervall: null, weatherMinPress: 1030, weatherMaxPress: 960 } });
  const s = h.config.load(); assert.equal(s.theme, 1); assert.equal(s.userStepGoal, 5000);
  assert.equal(s.userHeight, 175); assert.equal(s.debug, false); assert.equal(s.memIntervall, 60000);
  assert.ok(s.weatherMinPress < s.weatherMaxPress); h.start(); h.remove(); assertClean(h);
  for (const value of [null, [], 'bad', 7]) assert.equal(harness({ files: { 'pawlClock.json': value } }).config.load().theme, 1);
});
test('sensor wrappers preserve parameters, context, return values and original methods', () => {
  const h = harness(); h.start(); assert.equal(h.Bangle.setHRMPower(true, 'test'), true);
  assert.equal(h.Bangle.setGPSPower(true, 'test'), true);
  assert.deepEqual(h.calls.filter(c => c[0] === 'hrm' || c[0] === 'gps'), [['hrm', true, 'test'], ['gps', true, 'test']]);
  h.remove(); assertClean(h);
});
test('barometer starts immediately, averages eight valid readings and releases only this app', () => {
  const h = harness(); h.start(); assert.equal(h.Bangle.listenerCount('pressure'), 1);
  assert.ok(h.owners.has('pawlClock'));
  for (const pressure of [NaN, Infinity, null, '1012', 0, 1200]) h.emit('pressure', { pressure });
  for (let i = 0; i < 7; i++) h.emit('pressure', { pressure: 1010 });
  assert.ok(h.owners.has('pawlClock')); h.emit('pressure', { pressure: 1026 });
  assert.equal(h.Bangle.listenerCount('pressure'), 0); assert.deepEqual([...h.owners], ['other-app']);
  assert.ok(h.draw.some(d => d.method === 'drawString' && d.args[0] === '1012'));
  h.remove(); assertClean(h);
});
test('pressure icons update across a threshold even when the displayed rounded number is unchanged', () => {
  const h = harness({ settings: { barIntervall: 0 } }); h.start(); sample(h, 1019.9);
  const count = h.draw.length; sample(h, 1020.1);
  assert.ok(h.draw.length > count); h.remove(); assertClean(h);
});
test('a missing barometer times out, retries, and never duplicates listeners', () => {
  const h = harness({ settings: { barIntervall: 15000 } }); h.start();
  h.advance(15000); assert.equal(h.Bangle.listenerCount('pressure'), 1);
  h.advance(5000); assert.equal(h.Bangle.listenerCount('pressure'), 0); assert.ok(!h.owners.has('pawlClock'));
  h.advance(10000); assert.equal(h.Bangle.listenerCount('pressure'), 1);
  h.remove(); assertClean(h);
});
test('continuous pressure mode survives valid batches and recovers from a stalled sensor', () => {
  const h = harness({ settings: { barIntervall: 0 } }); h.start(); sample(h);
  assert.equal(h.Bangle.listenerCount('pressure'), 1); assert.ok(h.owners.has('pawlClock'));
  h.advance(15000); assert.equal(h.Bangle.listenerCount('pressure'), 1);
  h.advance(5000); assert.ok(!h.owners.has('pawlClock'));
  h.advance(10000); assert.ok(h.owners.has('pawlClock')); sample(h, 1000);
  h.remove(); assertClean(h);
});
test('removing during sampling or a long press cancels every resource and queued callbacks', () => {
  const h = harness(); h.start(); h.emit('drag', { b: 1 });
  const pending = [...h.timers.values()].map(t => t.fn);
  const hrmCallback = h.Bangle.listeners('HRM')[0]; h.remove(); assertClean(h);
  const drawings = h.draw.length;
  pending.forEach(fn => fn()); hrmCallback({ confidence: 100, bpm: 90 });
  assert.equal(h.draw.length, drawings); assertClean(h); h.remove(); assertClean(h);
});
test('long press enables Live and release restores configured rates without flash writes', () => {
  const h = harness(); h.start(); h.emit('drag', { b: 1 }); h.advance(1499);
  assert.equal(h.Bangle.listenerCount('step'), 0); h.advance(1);
  assert.equal(h.Bangle.listenerCount('step'), 1);
  assert.equal([...h.timers.values()].filter(t => t.interval && t.ms === 1000).length, 2);
  h.emit('drag', { b: 0 }); assert.equal(h.Bangle.listenerCount('step'), 0);
  assert.equal([...h.timers.values()].filter(t => t.interval && t.ms === 1000).length, 0);
  assert.deepEqual(h.writes, []); h.remove(); assertClean(h);
});
test('lock cancels pending and active long presses, including an initially locked watch', () => {
  const h = harness({ state: { locked: true } }); h.start(); h.emit('drag', { b: 1 }); h.advance(1500);
  assert.equal(h.Bangle.listenerCount('step'), 0);
  h.emit('lock', false); h.emit('drag', { b: 1 }); h.advance(500); h.emit('lock', true); h.advance(1500);
  assert.equal(h.Bangle.listenerCount('step'), 0);
  h.emit('lock', false); h.emit('drag', { b: 1 }); h.advance(1500);
  assert.equal(h.Bangle.listenerCount('step'), 1); h.emit('lock', true);
  assert.equal(h.Bangle.listenerCount('step'), 0); h.remove(); assertClean(h);
});
test('LCD off suspends drawing and sampling; wake refreshes every section and resumes timers', () => {
  const h = harness({ settings: { offScreenUpd: false } }); h.start(); h.advance(0); h.emit('lcdPower', false);
  assert.equal(h.timers.size, 0); assert.ok(!h.owners.has('pawlClock'));
  const count = h.draw.length; h.state.steps = 6543; h.state.battery = 42;
  h.emit('charging', true); h.emit('HRM', { confidence: 100, bpm: 123 }); h.Bangle.setGPSPower(true, 'other');
  h.advance(120000); assert.equal(h.draw.length, count);
  h.emit('lcdPower', true);
  for (const text of [6543, '42%', 123, '12:34']) assert.ok(h.draw.slice(count).some(d => d.method === 'drawString' && d.args[0] === text), String(text));
  assert.ok(h.owners.has('pawlClock')); h.remove(); assertClean(h);
});
test('off-screen updates remain enabled when requested', () => {
  const h = harness({ settings: { offScreenUpd: true } }); h.start(); h.emit('lcdPower', false);
  assert.ok(h.timers.size > 0); assert.ok(h.owners.has('pawlClock'));
  h.state.battery = 41; h.advance(60000);
  assert.ok(h.draw.some(d => d.method === 'drawString' && d.args[0] === '41%')); h.remove(); assertClean(h);
});
test('charging caps slow battery refresh at 30 seconds while Live stays at one second', () => {
  const h = harness({ settings: { battIntervall: 600000 } }); h.start(); h.emit('charging', true);
  assert.ok([...h.timers.values()].some(t => t.interval && t.ms === 30000));
  h.emit('drag', { b: 1 }); h.advance(1500);
  assert.ok(![...h.timers.values()].some(t => t.interval && t.ms === 30000));
  h.emit('drag', { b: 0 }); h.emit('charging', false);
  assert.ok([...h.timers.values()].some(t => t.interval && t.ms === 600000)); h.remove(); assertClean(h);
});
test('GPS fix changes are event-driven and repeated sensor values do not redraw', () => {
  const h = harness(); h.start(); h.Bangle.setGPSPower(true, 'other');
  let count = h.draw.length; h.emit('GPS', {}); assert.equal(h.draw.length, count);
  h.state.fix = 1; h.emit('GPS', {}); assert.ok(h.draw.length > count);
  count = h.draw.length; h.emit('GPS', {}); assert.equal(h.draw.length, count); h.remove(); assertClean(h);
});
test('step events handle over-goal counts, skip duplicates and reset at midnight', () => {
  const h = harness({ settings: { stepIntervall: 0 }, state: { steps: 100000 } }); h.start();
  assert.ok(h.draw.some(d => d.method === 'drawString' && d.args[0] === 100000));
  let count = h.draw.length; h.emit('step', 100001); assert.equal(h.draw.length, count);
  h.state.steps = 0; h.emit('midnight'); assert.ok(h.draw.length > count);
  h.remove(); assertClean(h);
});
test('the custom font decompresses once and locale suffixes use a text font', () => {
  const h = harness({ state: { time: '1:34 PM' } }); h.start(); h.state.time = '1:35 PM'; h.advance(60000);
  assert.equal(h.decompressCount(), 1);
  assert.ok(h.draw.some(d => d.method === 'drawString' && d.args[0] === 'PM' && d.font[0] === 'Vector'));
  h.remove(); assertClean(h);
});
test('the settings menu saves valid goals and rebuilds dependent bounds without reverting other values', () => {
  const h = harness(); let m = h.menu();
  assert.equal(m['Step Goal'].min, 1000); assert.equal(m['Step Goal'].max, 10000); assert.equal(m['Step Goal'].step, 100);
  m['Step upd. interval'].onchange(0); m['Step Goal'].onchange(7300);
  m['Weather Min Pressure'].onchange(1010); h.advance(0); m = h.currentMenu();
  assert.equal(m['Weather Max Pressure'].min, 1011); assert.equal(m['Step upd. interval'].value, 0);
  assert.equal(h.files['pawlClock.json'].userStepGoal, 7300);
  m['Weather Max Pressure'].onchange(1015); h.advance(0);
  assert.equal(h.currentMenu()['Weather Min Pressure'].max, 1014);
});
test('repeated fast loading does not accumulate resources', () => {
  const h = harness();
  for (let i = 0; i < 5; i++) { h.start(); h.emit('drag', { b: 1 }); h.advance(1500); h.remove(); assertClean(h); }
});
test('re-evaluating an open clock cleans the previous instance before installing new wrappers', () => {
  const h = harness(); h.start(); h.start();
  assert.equal(h.Bangle.listenerCount('HRM'), 1);
  assert.equal(h.Bangle.listenerCount('pressure'), 1);
  assert.equal(h.Bangle.setHRMPower(true, 'reload'), true);
  assert.equal(h.Bangle.setGPSPower(true, 'reload'), true);
  h.remove(); assertClean(h);
});
test('metadata installs canonical app, menu, library and tracks both migrated files', () => {
  const m = JSON.parse(source('metadata.json'));
  assert.ok(typeof m.author === 'string' && m.author.length > 0);
  assert.equal(source('ChangeLog').trim().split('\n').pop().split(':')[0], m.version);
  assert.ok(source('app.js').includes('Pawl Clock v' + m.version));
  for (const suffix of ['app.js', 'settings.js', 'img']) assert.ok(m.storage.some(f => f.name === `${m.id}.${suffix}`));
  assert.ok(m.storage.some(f => f.name === m.id && f.url === 'lib.js'), 'App Loader discovers extensionless local modules');
  for (const f of m.storage) assert.ok(fs.existsSync(path.join(root, f.url)));
  for (const name of ['pawlClock.json', 'pawl-clock.json', 'pawl.settings.json']) assert.ok(m.data.some(f => f.name === name));
});

test('widget wrappers installed while open survive removal and no longer notify the clock', () => {
  const h = harness(); h.start();
  const hrmObserver = h.Bangle.setHRMPower, gpsObserver = h.Bangle.setGPSPower;
  let hrmCalls = 0, gpsCalls = 0;
  function widgetHRM(on, id) { hrmCalls++; return hrmObserver(on, id); }
  function widgetGPS(on, id) { gpsCalls++; return gpsObserver(on, id); }
  h.Bangle.setHRMPower = widgetHRM; h.Bangle.setGPSPower = widgetGPS;
  h.remove(); assertClean(h, widgetHRM, widgetGPS);
  const count = h.draw.length;
  assert.equal(h.Bangle.setHRMPower(true, 'widget'), true);
  assert.equal(h.Bangle.setGPSPower(true, 'widget'), true);
  assert.equal(hrmCalls, 1); assert.equal(gpsCalls, 1); assert.equal(h.draw.length, count);
  h.start(); h.remove(); assertClean(h, widgetHRM, widgetGPS);
});
test('power observation detaches its callback while preserving parameters and later wrappers', () => {
  const h = harness(); let notifications = 0;
  const detach = h.config.observePower(h.Bangle, 'setHRMPower', () => notifications++);
  const observer = h.Bangle.setHRMPower;
  function laterWrapper(on, id) { return observer(on, id); }
  h.Bangle.setHRMPower = laterWrapper;
  assert.equal(laterWrapper(true, 'widget'), true); assert.equal(notifications, 1);
  detach(); detach();
  assert.equal(h.Bangle.setHRMPower, laterWrapper);
  assert.equal(laterWrapper(false, 'widget'), false); assert.equal(notifications, 1);
  assert.deepEqual(h.calls, [['hrm', true, 'widget'], ['hrm', false, 'widget']]);
});
test('missing BPM recovers from valid previous health data on a low-confidence HRM event', () => {
  const h = harness(); let current, previous;
  h.Bangle.getHealthStatus = period => ({ bpm: period === 'last' ? previous : current, steps: 1200 });
  h.start(); previous = 88.4;
  h.emit('HRM', { bpm: 140, confidence: 50 });
  assert.ok(h.draw.some(d => d.method === 'drawString' && d.args[0] === 88));
  assert.ok(!h.draw.some(d => d.method === 'drawString' && d.args[0] === 140));
  h.remove(); assertClean(h);
});
test('health events recover BPM without HRM events and reject invalid replacements', () => {
  const h = harness(); h.Bangle.getHealthStatus = () => ({ steps: 1200 }); h.start();
  h.emit('health', { bpm: 91.4 });
  assert.ok(h.draw.some(d => d.method === 'drawString' && d.args[0] === 91));
  const count = h.draw.length;
  for (const bpm of [NaN, Infinity, -1, 0, '200']) h.emit('health', { bpm });
  assert.equal(h.draw.length, count); h.remove(); assertClean(h);
});
test('LCD-off events cannot activate temporary Live even with off-screen updates enabled', () => {
  const h = harness({ settings: { offScreenUpd: true } }); h.start(); h.emit('lcdPower', false);
  h.emit('drag', { b: 1 }); h.advance(1500);
  assert.equal(h.Bangle.listenerCount('step'), 0);
  h.emit('lcdPower', true); h.emit('drag', { b: 1 });
  // Also guard the timeout itself if power changes before its callback is handled.
  h.state.lcd = false; h.advance(1500);
  assert.equal(h.Bangle.listenerCount('step'), 0);
  h.emit('drag', { b: 0 }); h.emit('lcdPower', true); h.emit('drag', { b: 1 }); h.advance(1500);
  assert.equal(h.Bangle.listenerCount('step'), 1);
  h.emit('lcdPower', false); assert.equal(h.Bangle.listenerCount('step'), 0);
  h.remove(); assertClean(h);
});
test('UI redraw restores the full face without changing timers or reacquiring sensors', () => {
  const h = harness(); h.start(); h.advance(0); sample(h);
  const timers = [...h.timers.keys()], barCalls = h.calls.length;
  h.g.clear(); const count = h.draw.length; h.redraw();
  const restored = h.draw.slice(count);
  assert.ok(restored.some(d => d.method === 'clear'));
  for (const text of ['12:34', 'Mon', 1200, 70, '80%', '1012']) {
    assert.ok(restored.some(d => d.method === 'drawString' && d.args[0] === text), String(text));
  }
  assert.deepEqual([...h.timers.keys()], timers); assert.equal(h.calls.length, barCalls);
  h.remove(); const after = h.draw.length; h.redraw(); assert.equal(h.draw.length, after); assertClean(h);
});
test('LCD wake restores the background after a redraw was requested while asleep', () => {
  const h = harness({ settings: { offScreenUpd: false } }); h.start(); h.advance(0);
  h.emit('lcdPower', false); const count = h.draw.length; h.redraw(); assert.equal(h.draw.length, count);
  h.emit('lcdPower', true);
  assert.ok(h.draw.slice(count).some(d => d.method === 'clear'));
  h.remove(); assertClean(h);
});

test('temporary Live requests HRM power and releases only the clock owner on every exit', () => {
  for (const exit of ['release', 'lock', 'lcd', 'remove']) {
    const h = harness(); h.Bangle.setHRMPower(true, 'other-app'); h.start();
    assert.ok(!h.hrmOwners.has('pawlClock'));
    h.emit('drag', { b: 1 }); h.advance(1500);
    assert.ok(h.hrmOwners.has('pawlClock'));
    h.emit('HRM', { bpm: 96.3, confidence: 90 });
    assert.ok(h.draw.some(d => d.method === 'drawString' && d.args[0] === 96));
    if (exit === 'release') h.emit('drag', { b: 0 });
    else if (exit === 'lock') h.emit('lock', true);
    else if (exit === 'lcd') h.emit('lcdPower', false);
    else h.remove();
    assert.ok(!h.hrmOwners.has('pawlClock')); assert.ok(h.hrmOwners.has('other-app'));
    assert.equal(h.state.hrm, true); h.remove(); assertClean(h);
  }
});
test('Live powers down an otherwise unused HRM and short presses never request it', () => {
  const h = harness(); h.start(); h.emit('drag', { b: 1 }); h.advance(1000); h.emit('drag', { b: 0 });
  assert.equal(h.calls.filter(c => c[0] === 'hrm').length, 0);
  h.emit('drag', { b: 1 }); h.advance(1500); assert.equal(h.state.hrm, true);
  h.emit('drag', { b: 0 }); assert.equal(h.state.hrm, false); h.remove(); assertClean(h);
});
test('Live updates changed RAM usage every second', () => {
  const h = harness(); h.start(); h.emit('drag', { b: 1 }); h.advance(1500);
  const count = h.draw.length; h.state.ramUsage = 230; h.advance(1000);
  assert.ok(h.draw.slice(count).some(d => d.method === 'drawString' && d.args[0] === 23));
  h.remove(); assertClean(h);
});
test('colon blinking aligns to seconds and stops with a steady colon after release', () => {
  const h = harness(); const clips = [];
  h.g.setClipRect = (...args) => { clips.push(args); return h.g; };
  h.start(); h.emit('drag', { b: 1 }); h.advance(1500); // 12:34:21.500, colon hidden.
  let count = h.draw.length; h.advance(500); // Even second, colon visible.
  assert.ok(h.draw.slice(count).some(d => d.method === 'drawString' && d.args[0] === '12:34'));
  assert.ok(clips.some(c => c[1] === 29 && c[3] === 87 && c[2] - c[0] < 40));
  count = h.draw.length; h.advance(1000); // Odd second, clear only the colon region.
  assert.ok(!h.draw.slice(count).some(d => d.method === 'drawString' && d.args[0] === '12:34'));
  h.emit('drag', { b: 0 });
  assert.ok(h.draw.slice(count).some(d => d.method === 'drawString' && d.args[0] === '12:34'));
  count = clips.length; h.advance(1000); assert.equal(clips.length, count);
  h.remove(); assertClean(h);
});
test('the colon blinks without losing a locale suffix or breaking the Vector fallback', () => {
  const h = harness({ state: { time: '123:34 PM' } }); h.start(); h.emit('drag', { b: 1 }); h.advance(1500);
  const count = h.draw.length; h.advance(500);
  assert.ok(h.draw.slice(count).some(d => d.method === 'drawString' && d.args[0] === '123:34' && d.font[0] === 'Vector'));
  h.state.time = '123:35 PM'; h.redraw();
  assert.ok(h.draw.some(d => d.method === 'drawString' && d.args[0] === 'PM'));
  h.remove(); assertClean(h);
});

test('Live disables all automatic screen timeouts, enables the backlight and restores on every exit', () => {
  for (const exit of ['release', 'lock', 'lcd', 'remove']) {
    const h = harness({ state: { backlight: false } }); h.start();
    const previous = h.Bangle.getOptions();
    h.emit('drag', { b: 1 }); h.advance(1500);
    const live = h.Bangle.getOptions();
    for (const key of ['lockTimeout', 'lcdPowerTimeout', 'backlightTimeout']) assert.equal(live[key], 0);
    assert.equal(live.wakeOnTouch, false); assert.equal(h.state.backlight, true);
    h.advance(10000);
    for (const key of ['lockTimeout', 'lcdPowerTimeout', 'backlightTimeout']) assert.equal(h.Bangle.getOptions()[key], 0);
    if (exit === 'release') h.emit('drag', { b: 0 });
    else if (exit === 'lock') h.emit('lock', true);
    else if (exit === 'lcd') h.emit('lcdPower', false);
    else h.remove();
    assert.deepEqual(h.Bangle.getOptions(), previous);
    if (exit === 'lock') assert.equal(h.state.locked, true);
    if (exit === 'lcd') assert.equal(h.state.lcd, false);
    h.remove(); assertClean(h);
  }
});
test('short presses never change power settings and each Live session takes a fresh snapshot', () => {
  const h = harness(); h.start(); const previous = h.Bangle.getOptions();
  h.emit('drag', { b: 1 }); h.advance(1000); h.emit('drag', { b: 0 });
  assert.deepEqual(h.Bangle.getOptions(), previous);
  for (const timeout of [0, 30000]) {
    h.Bangle.setOptions({ lockTimeout: timeout });
    h.emit('drag', { b: 1 }); h.advance(1500); h.emit('drag', { b: 0 });
    assert.equal(h.Bangle.getOptions().lockTimeout, timeout);
  }
  h.Bangle.setOptions(previous); h.remove(); assertClean(h);
});
test('Live cleanup preserves power option changes made by another component', () => {
  const h = harness(); h.start(); h.emit('drag', { b: 1 }); h.advance(1500);
  h.Bangle.setOptions({ lockTimeout: 45000, wakeOnTouch: true });
  h.emit('drag', { b: 0 });
  assert.equal(h.Bangle.getOptions().lockTimeout, 45000);
  assert.equal(h.Bangle.getOptions().backlightTimeout, 5000);
  assert.equal(h.Bangle.getOptions().wakeOnTouch, true);
  h.Bangle.setOptions({ lockTimeout: 7000 }); h.remove(); assertClean(h);
});
