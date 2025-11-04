(function(back) {
  let settings = require('Storage').readJSON('pawl-clock.json', 1) || {};

  // Default values
  if (typeof settings.offScreenUpd !== "boolean") settings.offScreenUpd = true;
  if (typeof settings.barIntervall !== "number")  settings.barIntervall = 60000;
  if (typeof settings.battIntervall !== "number") settings.battIntervall = 60000;
  if (typeof settings.memIntervall !== "number")  settings.memIntervall = 60000;
  if (typeof settings.stepIntervall !== "number") settings.stepIntervall = 60000;
  if (typeof settings.userHeight !== "number")    settings.userHeight = 175;
  if (typeof settings.userStepGoal !== "number")    settings.userStepGoal = 5000;
  if (typeof settings.weatherMinPress !== "number") settings.weatherMinPress = 1005;
  if (typeof settings.weatherMaxPress !== "number") settings.weatherMaxPress = 1020;
  if (typeof settings.debug !== "boolean")        settings.debug = false;
  if (typeof settings.theme !== "number") settings.theme = 1;

  // --- THEMES ---
  const themes = [
    {
      name: "Light",
      bgColor:     0xffff, // White
      boxColor:    0x001f, // Blue
      txtColor:    0x0000, // Black
      boxTxtColor: 0xffff  // White
    },
    {
      name: "Dark",
      bgColor:     0x0000, // Black
      boxColor:    0xffe0, // Yellow
      txtColor:    0xffff, // White
      boxTxtColor: 0x0000  // Black
    }
  ];

  function save(key, value, themeIndex) {
    if (themeIndex !== undefined) {
      let t = themes[themeIndex];
      settings.theme = themeIndex;
      settings.bgColor = t.bgColor;
      settings.boxColor = t.boxColor;
      settings.txtColor = t.txtColor;
      settings.boxTxtColor = t.boxTxtColor;
    } else {
      settings[key] = value;
    }
    require('Storage').writeJSON('pawl-clock.json', settings);
  }

  // --- INTERVALS ---
  const intervals = [
    { name: "Live", millisec: 0 },
    { name: "15 sec", millisec: 15000 },
    { name: "30 sec", millisec: 30000 },
    { name: "1 min", millisec: 60000 },
    { name: "3 min", millisec: 180000 },
    { name: "5 min", millisec: 300000 },
    { name: "10 min", millisec: 600000 }
  ];
  function getIntervalIndex(value) {
    return intervals.findIndex(c => c.millisec === value);
  }
  const intervalsLabels = intervals.map(c => c.name);
  const barIntervalIndex = getIntervalIndex(settings.barIntervall);
  const memIntervalIndex = getIntervalIndex(settings.memIntervall);
  const battIntervalIndex = getIntervalIndex(settings.battIntervall);
  const stepIntervalIndex = getIntervalIndex(settings.stepIntervall);

  // --- MENU ---
  E.showMenu({
    '': { 'title': 'PawlClock' },
    '< Back': back,
    "Theme": {
      value: settings.theme,
      min: 0, max: themes.length-1,
      format: i => themes[i].name,
      onchange: i => save(null, null, i)
    },
    'Off screen update?': {
      value: settings.offScreenUpd,
      onchange: v => save('offScreenUpd', v)
    },
    "Press upd. interval": {
      value: barIntervalIndex >= 0 ? barIntervalIndex : 0,
      min: 0, max: intervals.length - 1,
      format: v => intervalsLabels[v],
      onchange: v => save('barIntervall', intervals[v].millisec)
    },
    "Memory upd. interval": {
      value: memIntervalIndex >= 0 ? memIntervalIndex : 0,
      min: 0, max: intervals.length - 1,
      format: v => intervalsLabels[v],
      onchange: v => save('memIntervall', intervals[v].millisec)
    },
    "Battery upd. interval": {
      value: battIntervalIndex >= 0 ? battIntervalIndex : 0,
      min: 0, max: intervals.length - 1,
      format: v => intervalsLabels[v],
      onchange: v => save('battIntervall', intervals[v].millisec)
    },
    "Step upd. interval": {
      value: stepIntervalIndex >= 0 ? stepIntervalIndex : 0,
      min: 0, max: intervals.length - 1,
      format: v => intervalsLabels[v],
      onchange: v => save('stepIntervall', intervals[v].millisec)
    },
    "User Height": {
      value: settings.userHeight,
      min: 100, max: 220,
      step: 1,
      format: v => v + " cm",
      onchange: v => save('userHeight', v)
    },
    "Step Goal": {
      value: settings.userStepGoal,
      min: 10000, max: 1000,
      step: 1,
      format: v => v + " step",
      onchange: v => save('userStepGoal', v)
    },
    "Weather Min Pressure": {
      value: settings.weatherMinPress,
      min: 950, max: 1030,
      format: v => v + " hPa",
      onchange: v => save('weatherMinPress', v)
    },
    "Weather Max Pressure": {
      value: settings.weatherMaxPress,
      min: 960, max: 1050,
      format: v => v + " hPa",
      onchange: v => save('weatherMaxPress', v)
    },
    'Debug': {
      value: settings.debug,
      onchange: v => save('debug', v)
    }
  });
})