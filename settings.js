(function(back) {
  const config = require('pawlClock');
  let settings = config.load();
  const themes = config.themes;

  function save(key, value) {
    settings[key] = value;
    settings = config.save(settings);
  }

  // --- INTERVALS ---
  const intervals = config.intervals;
  const intervalsLabels = ['Live', '15 sec', '30 sec', '1 min', '3 min', '5 min', '10 min'];
  function getIntervalIndex(value) {
    return intervals.indexOf(value);
  }
  // --- MENU ---
  function showMenu() {
    E.showMenu({
      '': { 'title': 'PawlClock' },
      '< Back': back,
      "Theme": {
        value: settings.theme,
        min: 0, max: themes.length-1,
        format: i => themes[i].name,
        onchange: i => save('theme', i)
      },
      'Update LCD off?': {
        value: settings.offScreenUpd,
        onchange: v => save('offScreenUpd', v)
      },
      "Press upd. interval": {
        value: getIntervalIndex(settings.barIntervall),
        min: 0, max: intervals.length - 1,
        format: v => intervalsLabels[v],
        onchange: v => save('barIntervall', intervals[v])
      },
      "Memory upd. interval": {
        value: getIntervalIndex(settings.memIntervall),
        min: 0, max: intervals.length - 1,
        format: v => intervalsLabels[v],
        onchange: v => save('memIntervall', intervals[v])
      },
      "Battery upd. interval": {
        value: getIntervalIndex(settings.battIntervall),
        min: 0, max: intervals.length - 1,
        format: v => intervalsLabels[v],
        onchange: v => save('battIntervall', intervals[v])
      },
      "Step upd. interval": {
        value: getIntervalIndex(settings.stepIntervall),
        min: 0, max: intervals.length - 1,
        format: v => intervalsLabels[v],
        onchange: v => save('stepIntervall', intervals[v])
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
        min: 1000, max: 10000,
        step: 100,
        format: v => v + " step",
        onchange: v => save('userStepGoal', v)
      },
      "Weather Min Pressure": {
        value: settings.weatherMinPress,
        min: 950, max: Math.min(1030, settings.weatherMaxPress - 1),
        format: v => v + " hPa",
        onchange: v => { save('weatherMinPress', v); setTimeout(showMenu, 0); }
      },
      "Weather Max Pressure": {
        value: settings.weatherMaxPress,
        min: Math.max(960, settings.weatherMinPress + 1), max: 1050,
        format: v => v + " hPa",
        onchange: v => { save('weatherMaxPress', v); setTimeout(showMenu, 0); }
      },
      'Debug': {
        value: settings.debug,
        onchange: v => save('debug', v)
      }
    });
  }
  showMenu();
})
