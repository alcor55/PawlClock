// Shared settings validation and migration for the clock and its menu.
const FILE = 'pawlClock.json';
const storage = require('Storage');
const themes = [
  { name: 'Light', bgColor: 0xffff, boxColor: 0x001f, txtColor: 0x0000, boxTxtColor: 0xffff },
  { name: 'Dark', bgColor: 0x0000, boxColor: 0xffe0, txtColor: 0xffff, boxTxtColor: 0x0000 }
];
const intervals = [0, 15000, 30000, 60000, 180000, 300000, 600000];
function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function integer(value, min, max, fallback) {
  return typeof value === 'number' && isFinite(value) && value >= min && value <= max ? Math.round(value) : fallback;
}
function normalize(raw) {
  raw = isObject(raw) ? raw : {};
  let result = {
    debug: typeof raw.debug === 'boolean' ? raw.debug : false,
    offScreenUpd: typeof raw.offScreenUpd === 'boolean' ? raw.offScreenUpd : true,
    theme: raw.theme === 0 || raw.theme === 1 ? raw.theme : 1,
    userHeight: integer(raw.userHeight, 100, 220, 175),
    userStepGoal: integer(raw.userStepGoal, 1000, 10000, 5000),
    weatherMinPress: integer(raw.weatherMinPress, 950, 1030, 1005),
    weatherMaxPress: integer(raw.weatherMaxPress, 960, 1050, 1020)
  };
  ['barIntervall', 'memIntervall', 'stepIntervall', 'battIntervall'].forEach(key => {
    result[key] = intervals.indexOf(raw[key]) >= 0 ? raw[key] : 60000;
  });
  if (result.weatherMinPress >= result.weatherMaxPress) {
    result.weatherMinPress = 1005;
    result.weatherMaxPress = 1020;
  }
  return result;
}
exports.load = function() {
  let raw = storage.readJSON(FILE, true);
  if (!isObject(raw)) {
    raw = storage.readJSON('pawl-clock.json', true);
    if (!isObject(raw)) raw = storage.readJSON('pawl.settings.json', true);
    if (isObject(raw)) {
      // v0.01 sometimes stored theme=0 with the Dark palette. Keep the visible theme.
      if (raw.bgColor === 0x0000) raw.theme = 1;
      else if (raw.bgColor === 0xffff) raw.theme = 0;
      const migrated = normalize(raw);
      storage.writeJSON(FILE, migrated);
      return migrated;
    }
  }
  return normalize(raw);
};
exports.save = function(settings) {
  const normalized = normalize(settings);
  storage.writeJSON(FILE, normalized);
  return normalized;
};
exports.themes = themes;
exports.intervals = intervals;

// A widget may wrap this observer after installation. Detach the notification
// without overwriting that widget, and release the callback's clock scope.
exports.observePower = function(target, key, onChange) {
  const original = target[key];
  const wrapper = function(on, id) {
    const result = original.apply(target, arguments);
    if (onChange) onChange();
    return result;
  };
  target[key] = wrapper;
  return function() {
    onChange = undefined;
    if (target[key] === wrapper) target[key] = original;
  };
};
