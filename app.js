/*
*    Pawl Clock v0.04
*    Icon drawn on https://www.pixilart.com/draw (must be white for color fill + transparent background).
*    Imgs Converted with: https://www.espruino.com/Image+Converter (1 bit, transparency).
*    Font Converted with: https://www.espruino.com/Font+Converter (compression, 1bpp)
*/


/*
===== Full Colors ====
Black         - 0x0000
White         - 0xffff
Cyan          - 0x07ff
Red           - 0xf800
Yellow        - 0xffe0
Green         - 0x07e0
Magenta       - 0xf81f
Blue          - 0x001f
===== Mat Colors =====
Dark Green    - 0x0400
Lime Green    - 0x87e0
Pink          - 0xf810
Torquoise     - 0x07f0
Dark Blue     - 0x0010
Dark Grey     - 0x4208
Grey          - 0x8410
Light Grey    - 0xc618
Light Red     - 0xfc10
Light Green   - 0x87f0
Light Blue    - 0x841f
Light Yellow  - 0xfff0
Light Magenta - 0xfc1f
Light Cyan    - 0x87ff
Dark Red      - 0x8000
Dark Green    - 0x0400
Dark Blue     - 0x0010
Dark Yellow   - 0x8400
Dark Magenta  - 0x8010
Dark Cyan     - 0x0410
Lime Green    - 0x87e0
Royal Blue    - 0x041f
Orange        - 0xfc00
Indigo        - 0x801f
*/


(function() { // Keep helpers and state local across fast loads.


  // *******************
  // Includes.
  // * Load the files by ide(run), not by coping with the file manager, otherwise the required modules where not loaded on the bangle storage.
  //
  const locale = require('locale');
  const storage = require('Storage');
  const widget_utils = require("widget_utils");


  // *******************
  // Globals.
  //
  const APP_ID = 'pawlClock';
  let active = true;
  let renderCache = {};
  let widgetDrawTimer;
  require('Font8x16').add(Graphics);
  require('Font6x8').add(Graphics);
  const w = g.getWidth(); // 176 Pixels.
  const h = g.getHeight(); // 176 Pixels.


  // *******************
  // Custom font Lato 70 (https://www.espruino.com/Font+Converter).
  //
  const latoBitmap = E.toString(require('heatshrink').decompress(atob('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')));
  const latoWidths = atob("DRomJSUlJyQmJiUmDg==");
  function setLatoFont() {
    return g.setFontCustom(latoBitmap, 46, latoWidths, 67|65536);
  }

  // *******************
  // Load settings.
  //
  const config = require('pawlClock');
  const settings = config.load();
  const palette = config.themes[settings.theme];
  // Various.
  let offScreenUpd    = settings.offScreenUpd;
  let weatherMinPress = settings.weatherMinPress;
  let weatherMaxPress = settings.weatherMaxPress;
  let barIntervall    = settings.barIntervall;
  let memIntervall    = settings.memIntervall;
  let stepIntervall   = settings.stepIntervall;
  let battIntervall   = settings.battIntervall;
  let debug           = settings.debug;
  let userHeight      = settings.userHeight;
  let userStepGoal    = settings.userStepGoal;
  // Colors definitions.
  let bgColor         = palette.bgColor;
  let boxColor        = palette.boxColor;
  let txtColor        = palette.txtColor;
  let boxTxtColor     = palette.boxTxtColor;
  let RED             = 0xf800;


  function canDraw() {
    return active && (offScreenUpd || Bangle.isLCDOn());
  }
  function unchanged(key, value) {
    if (!debug && renderCache[key] === value) return true;
    renderCache[key] = value;
    return false;
  }
  function fitText(text, width, size) {
    g.setFont('Vector', size);
    while (size > 6 && g.stringWidth(text) > width) g.setFont('Vector', --size);
    return g;
  }

  // *******************
  // Next minute mainLoop schedule.
  //
  let mainTimeoutID;
  let mainLoopTimer = function() {
    if (mainTimeoutID !== undefined) clearTimeout(mainTimeoutID);
    mainTimeoutID = setTimeout(function() {
      mainTimeoutID = undefined;
      mainLoop();
    }, 60000 - (Date.now() % 60000));
  };


  // *******************
  // Main draw.
  //
  let mainLoop = function() {
    if (!canDraw()) return;
    // Set next minute update timer.
    mainLoopTimer();
    // Draw stuffs.
    drawClock();
    drawDate();
  };


  // *******************
  // Live mode.
  //
  const longPressTime = 1500;
  let pressTimer;
  let pressing = false;
  let longTriggered = false;
  let liveHRMRequested = false;
  let secondsTimeoutID;
  function liveSeconds() {
    if (!active || !longTriggered || !Bangle.isLCDOn()) return;
    drawClock();
    drawClockColon(Math.floor(Date.now() / 1000) % 2 === 0);
    secondsTimeoutID = setTimeout(function() {
      secondsTimeoutID = undefined;
      liveSeconds();
    }, 1000 - Date.now() % 1000);
  }
  function liveOn() {
    if (!active || !pressing || Bangle.isLocked() || !Bangle.isLCDOn() || longTriggered) return;
    longTriggered = true;
    liveHRMRequested = true;
    Bangle.setHRMPower(true, APP_ID);
    startDataUpdates();
    refreshAll();
    liveSeconds();
  }
  function cancelPress() {
    if (pressTimer !== undefined) clearTimeout(pressTimer);
    pressTimer = undefined;
    pressing = false;
    if (longTriggered) {
      longTriggered = false;
      if (secondsTimeoutID !== undefined) clearTimeout(secondsTimeoutID);
      secondsTimeoutID = undefined;
      if (liveHRMRequested) {
        liveHRMRequested = false;
        Bangle.setHRMPower(false, APP_ID);
      }
      drawClockColon(true);
      if (active) startDataUpdates();
    }
  }
  function liveCtrl(e) {
    if (!active) return;
    if (!e.b || Bangle.isLocked() || !Bangle.isLCDOn()) {
      cancelPress();
      return;
    }
    if (!pressing) {
      pressing = true;
      pressTimer = setTimeout(function() {
        pressTimer = undefined;
        liveOn();
      }, longPressTime);
    }
  }

  // *******************
  // Static graphical stuffs.
  //
  let drawTheme = function() {
    g.reset();
    g.clear();
    // Draw background.
    g.setColor(bgColor).fillRect( 0, 0, w, h);
    g.setColor(bgColor);
    // Draw up-left corner.
    g.fillRect(0, 0, 4, 0);
    g.fillRect(0, 1, 2, 1);
    g.fillRect(0, 2, 1, 2);
    g.fillRect(0, 3, 0, 4);
    // Draw up-right corner.
    g.fillRect(w - 1, 0, w - 5, 0);
    g.fillRect(w - 1, 1, w - 3, 1);
    g.fillRect(w - 1, 2, w - 2, 2);
    g.fillRect(w - 1, 3, w - 1, 4);
    // Draw down-left corner.
    g.fillRect(0, h - 1, 4, h - 1);
    g.fillRect(0, h - 2, 2, h - 2);
    g.fillRect(0, h - 3, 1, h - 3);
    g.fillRect(0, h - 4, 0, h - 5);
    // Draw down-right corner.
    g.fillRect(w - 5, h - 1, w - 1, h - 1);
    g.fillRect(w - 3, h - 2, w - 1, h - 2);
    g.fillRect(w - 2, h - 3, w - 1, h - 3);
    g.fillRect(w - 1, h - 4, w - 1, h - 5);
  };


  // *******************
  // Rounded Rectangles.
  //
  const fillRoundedRect = function (x1, y1, x2, y2, r) {
    r = Math.min(r, (x2 - x1) / 2, (y2 - y1) / 2);
    // Corpo centrale
    g.fillRect(x1 + r, y1, x2 - r, y2);
    g.fillRect(x1, y1 + r, x2, y2 - r);
    // Angoli arrotondati
    g.fillCircle(x1 + r, y1 + r, r); // top-left
    g.fillCircle(x2 - r, y1 + r, r); // top-right
    g.fillCircle(x2 - r, y2 - r, r); // bottom-right
    g.fillCircle(x1 + r, y2 - r, r); // bottom-left
  };


  // *******************
  // Main clock drawing.
  //
  let clockLayout;
  function drawClockColon(visible) {
    if (!canDraw() || !clockLayout) return;
    const layout = clockLayout;
    // Clip the original time string to the separator so its position and font
    // remain identical, including when the full time uses the Vector fallback.
    g.reset().setClipRect(layout.x1, 29, layout.x2, 87);
    g.setColor(bgColor).fillRect(layout.x1, 29, layout.x2, 87);
    if (visible) {
      g.setColor(txtColor).setFontAlign(0, 0);
      if (layout.fontSize) g.setFont('Vector', layout.fontSize);
      else setLatoFont();
      g.drawString(layout.text, 86, 62);
    }
    g.setClipRect(0, 0, w-1, h-1);
  }
  let drawClock = function() {
    if (!canDraw()) return;
    let date = new Date();
    const localizedTime = locale.time(date, 1);
    const timeStr = localizedTime.replace(/[^0-9:.]/g, '');
    const suffix = localizedTime.replace(/[0-9:.]/g, '').trim();
    if (unchanged('time', localizedTime)) return;
    // Draw time.
    let X = 3;
    let Y = 29;
    g.reset().setColor(debug ? RED : bgColor).fillRect(X, Y, X+169, Y+58); // Clear.
    g.setFontAlign(0, 0).setColor(txtColor);
    setLatoFont();
    let fontSize;
    if (g.stringWidth(timeStr) > 169) {
      fontSize = 53;
      while (fontSize > 6 && g.setFont('Vector', fontSize).stringWidth(timeStr) > 169) fontSize--;
      g.setFont('Vector', fontSize);
    }
    const colon = timeStr.indexOf(':');
    clockLayout = undefined;
    if (colon >= 0) {
      const left = Math.floor(X+83 - g.stringWidth(timeStr) / 2);
      const x1 = left + g.stringWidth(timeStr.slice(0, colon));
      clockLayout = { text: timeStr, x1: x1, x2: x1 + g.stringWidth(':') - 1, fontSize: fontSize };
    }
    g.drawString(timeStr, X+83, Y+33);
    g.setColor(bgColor).fillRect(125, 88, 172, 94);
    if (suffix) {
      g.setColor(txtColor).setFontAlign(1, 0);
      fitText(suffix, 47, 7).drawString(suffix, 172, 91);
    }
    if (longTriggered) drawClockColon(Math.floor(Date.now() / 1000) % 2 === 0);
  };


  // *******************
  // Date Info drawing.
  //
  let drawDate = function() {
    if (!canDraw()) return;
    let date = new Date();
    if (unchanged('date', date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate())) return;
    let dayStr = locale.dow(date, 1);
    let dayNum = ("0" + date.getDate()).slice(-2);
    let monthStr = locale.month(date, 1);
    let monthNum = ("0" + (date.getMonth() + 1)).slice(-2);
    let X = 108;
    let Y = 99;
    g.setColor(boxColor);
    fillRoundedRect(X-4, Y-4, X+62, Y+40, 8);
    g.fillRect(X-6, Y-4, X, Y+13); // RoundedRect corner.
    g.setColor(bgColor);
    fillRoundedRect(X-2, Y+8, X+60, Y+38, 6);
    let Xi = X-6;
    let Yi = Y-21;
    for (let i = 0; i < 6; i++) {
      let dx = i * 11;
      g.fillPoly([
        Xi + 9 + dx, Yi + 27,
        Xi + 15 + dx, Yi + 27,
        Xi + 8 + dx, Yi + 19,
        Xi + 2 + dx, Yi + 19
      ]);
    }
    g.setColor(boxColor).fillRect(X+61, Y+1, X+62, Y+5).fillRect(X-8, Y-4, X-3, Y+13);
    g.reset().setColor(debug ? RED : bgColor).fillRect(X+0, Y+10, X+58, Y+36); // Clear.
    g.setColor(txtColor).fillRect(X+28, Y+11, X+29, Y+35); // Bar.
    g.setFontAlign(0, 0); // Draw day/month.
    // Date str.
    g.setColor(debug ? txtColor : RED);
    fitText(dayStr, 27, 13).drawString(dayStr, X+14, Y+15);
    fitText(monthStr, 27, 13).drawString(monthStr, X+46, Y+15);
    // Date number.
    g.setColor(txtColor).setFont("Vector", 17).drawString(monthNum, X+46, Y+30).drawString(dayNum, X+14, Y+30);
  };


  // *******************
  // HR Info drawing.
  //
  function validBpm(value) {
    return typeof value === 'number' && isFinite(value) && value > 0;
  }
  function readHealthBpm() {
    const current = Bangle.getHealthStatus().bpm;
    const previous = validBpm(current) ? current : Bangle.getHealthStatus("last").bpm;
    return validBpm(previous) ? Math.round(previous) : undefined;
  }
  let drawBpm = function() {
    if (!canDraw()) return;
    if (!validBpm(bp)) bp = readHealthBpm();
    let hr = (!bp || !isFinite(bp)) ? '--' : bp;
    if (unchanged('bpm', hr + ':' + Bangle.isHRMOn())) return;
    let X = 110;
    let Y = 146;
    g.reset().setColor(debug ? RED : bgColor).fillRect(X, Y-2, X+63, Y+26); // Clear.
    g.setColor(txtColor).setFontAlign(-1, 0);
    if (typeof hr === "number" && hr > 99) {
      fitText(hr, 42, 18).drawString(hr, X+20, Y+9);
      fitText('HEART RATE', 63, 8).drawString('HEART RATE', X, Y+21);
    } else {
      fitText(hr, 40, 24).drawString(hr, X+22, Y+13);
      g.setFont("Vector", 7).drawString('BPM', X+1, Y+19);
    }
    g.setColor(debug ? 0xffff : RED);
    if (Bangle.isHRMOn()) {
      g.drawImage(atob("DxKBAAAAAAAAAePH79/////////+//n/8f/B/wH8AfABwAAAAAA="), X, Y-2);
    } else {
      g.drawImage(atob("DxKBAAAAAAAAAePH79z58OHgA+AOwBnAccHBxwHcAfABwAAAAAA="), X, Y-2);
    }
  };
  // HR update events.
  let detachHRMPower;
  let bp = readHealthBpm();
  let drawBpmOnHRM = function(e) {
    if (!active) return;
    if (e && e.confidence > 60 && validBpm(e.bpm)) bp = Math.round(e.bpm);
    drawBpm();
  };
  function onHealth(e) {
    if (!active) return;
    const latest = e && validBpm(e.bpm) ? Math.round(e.bpm) : readHealthBpm();
    if (validBpm(latest)) bp = latest;
    drawBpm();
  }

  // *******************
  // Donut Chart drawing.
  //
  let drawDonutChart = function(cx, cy, rOuter, thickness, value, maxValue, color, trackColor) {
    const rInner = rOuter - thickness;
    const progress = maxValue > 0 ? Math.max(0, Math.min(1, value / maxValue)) : 0;
    g.setColor(trackColor).fillCircle(cx, cy, rOuter);
    if (progress === 1) {
      g.setColor(color).fillCircle(cx, cy, rOuter);
    } else if (progress > 0) {
      // At this radius, 48 segments are enough for a smooth ring.
      const segments = Math.ceil(48 * progress);
      let points = [cx, cy];
      for (let i = 0; i <= segments; i++) {
        const angle = -Math.PI / 2 + 2 * Math.PI * progress * i / segments;
        points.push(cx + Math.cos(angle) * rOuter, cy + Math.sin(angle) * rOuter);
      }
      g.setColor(color).fillPoly(points);
    }
    g.setColor(bgColor).fillCircle(cx, cy, rInner);
  };

  // *******************
  // Steps Info drawing.
  //
  let stepIntervallID;
  let drawSteps = function() {
    if (!canDraw()) return;
    const steps = Math.max(0, Bangle.getHealthStatus('day').steps || 0);
    if (unchanged('steps', steps)) return;
    let X = 5;
    let Y = 125;
    g.reset().setColor(debug ? RED : bgColor).fillRect(X, Y, X+98, Y+43); // Clear.
    const k = 0.415; // run 0.65 walk 0.415.
    let stepLength = userHeight * k / 100;
    let distanceKm = (steps * stepLength) / 1000;
    let fontSize = 18;
    if (steps>9999) fontSize = 16;
    g.setColor(txtColor).setFontAlign(-1, 0);
    fitText(steps, 52, fontSize).drawString(steps, X+45, Y+10);
    fitText('~' + distanceKm.toFixed(1) + 'km', 52, 14).drawString('~' + distanceKm.toFixed(1) + 'km', X+45, Y+32);
    g.fillRect(X+45, Y+20, X+87, Y+21); // Bar.
    drawDonutChart(X+19, Y+19, 19, 6, steps, userStepGoal, RED, txtColor);
    g.setColor(boxColor).drawImage(atob("EhKBAAcAA8MD+cP/8L/8N/oG/4DfoBv8A30Ab8AN+AG+ADfABvAA3AAbAAOA"), X+11, Y+11); // Shoe.
  };
  // *******************
  // BLE Info drawing.
  //
  let drawBLE = function() {
    if (!canDraw()) return;
    if (unchanged('ble', NRF.getSecurityStatus().connected)) return;
    let X = 29;
    let Y = 6;
    g.reset().setColor(debug ? RED : bgColor).fillRect(X, Y, X+9, Y+17); // Clear.
    if (NRF.getSecurityStatus().connected) {
      g.setColor(0x001f); // Blue.
    } else {
      g.setColor(txtColor);
    }
    g.drawImage(atob("ChKBABgHAeB82753uPweD4fz7tnG4fB4HAYA"), X, Y); // 10x18.
  };
  // *******************
  // Lock Screen drawing.
  //
  let drawLock = function() {
    if (!canDraw() || unchanged('lock', Bangle.isLocked())) return;
    let X = 7;
    let Y = 6;
    g.reset().setColor(debug ? RED : bgColor).fillRect(X, Y, X+13, Y+17); // Clear.
    g.setColor(boxColor);
    if (Bangle.isLocked()) {
      g.drawImage(atob("DhKBAAAAHgH+DzwwMcDmAZgGYBv/////P/h/4f/P/h/////w"), X, Y); // Lock.
    } else {
      g.drawImage(atob("DhKBAB8B/gccODjgY4AHABwAOAP/////P/h/4f/P/h/////w"), X, Y); // Unlock.
    }
  };
  // *******************
  // GPS drawing.
  //
  let drawGPS = function() {
    if (!canDraw()) return;
    const fix = Bangle.isGPSOn() && (Bangle.getGPSFix() || {}).fix > 0;
    if (unchanged('gps', Bangle.isGPSOn() + ':' + fix)) return;
    let X = 46;
    let Y = 6;
    g.reset().setColor(debug ? RED : bgColor).fillRect(X, Y, X+17, Y+17); // Clear.
    g.setColor(txtColor).drawImage(atob("EhKBADgAGwANYAKswNd4G7MD+GBsGAYMAwYAw2HZ/Hvdj26x41Q4awYNgAHA"), X, Y); // 17x18.
    if (Bangle.isGPSOn()) {
        const gpsObject = Bangle.getGPSFix();
        if (gpsObject && gpsObject.fix > 0) {
          g.setColor(0x001f); // Blue ( ON with Fix ).
        } else {
          g.setColor(0xf800); // Red ( ON without Fix ).
        }
    } else {
      g.setColor(bgColor); // ( GPS off ).
    }
    g.fillPoly([X+10,Y+4,X+13,Y+6,X+7,Y+13,X+5,Y+10]);
  };
  // GPS info update events.
  let detachGPSPower;

  // *******************
  // Battery drawing.
  //
  let battIntervallID;
  let drawBatt = function() {
    if (!canDraw()) return;
    let batteryVal = Math.max(0, Math.min(100, Math.round(E.getBattery())));
    if (unchanged('battery', batteryVal + ':' + Bangle.isCharging())) return;
    let X = 72;
    let Y = 6;
    let battPixels = 18;
    g.reset().setColor(debug ? RED : bgColor).fillRect(X, Y+1, X+53, Y+16); // Clear.
    let xl = X+1+batteryVal*(battPixels)/100;
    if (batteryVal > 0) g.setColor(RED).fillRect(X+2, Y+3, Math.max(X+2, xl), Y+14); // Fill bar.
    g.setFont("8x16").setFontAlign(-1,0);
    if (batteryVal != 100) batteryVal += '%';
    g.setColor(txtColor).drawString(batteryVal, X+26, Y+10);
    g.setColor(boxColor);
    if (Bangle.isCharging()) {
      g.drawImage(atob("GBKBAAAAAH//+P///MAADMAADMAwDMDwD8PwD8/x794/z8A/D8A8D8AwDMAADMAADP///H//+AAAAA=="), X, Y); // 24x18 chr.
    } else {
      g.drawImage(atob("GBKBAAAAAH//+P///MAADMAADMAADMAAD8AAD8AAD8AAD8AAD8AAD8AADMAADMAADP///H//+AAAAA=="), X, Y); // 24x18 batt.
    }
  };
  // *******************
  // Memory drawing.
  //
  let memIntervallID;
  let drawMemory = function() {
    if (!canDraw()) return;
    let X = 127;
    let Y = 3;
    let maxBarPixels = 17;
    let m = process.memory(false);
    let totalHDSpace = process.env.STORAGE;
    let ramUsedPercent = Math.round(m.usage*100 / m.total);
    let hdUsedPercent = Math.round(((totalHDSpace - storage.getFree()) / totalHDSpace) * 100);
    if (unchanged('memory', ramUsedPercent + ':' + hdUsedPercent)) return;
    let ramBarPixels = X+11+ramUsedPercent*(maxBarPixels)/100;
    let hdBarPixels = X+11+hdUsedPercent*(maxBarPixels)/100;
    g.reset().setColor(debug ? RED : bgColor).fillRect(X, Y, X+45, Y+21); // Clear.
    g.setColor(boxColor);
    fillRoundedRect(X, Y, X+45, Y+21, 7); // Main block.
    g.setColor(boxTxtColor).drawImage(atob("BQaBAP7rX9Q="), X+3, Y+3).drawImage(atob("BwaBADjLnxZHAA=="), X+2, Y+13); // Ram/HD icons.
    // main corner.
    g.setColor(bgColor).fillRect(X, Y, X+1, Y).fillRect(X, Y, X, Y+1).fillRect(X, Y+21, X+1, Y+21).fillRect(X, Y+20, X, Y+21);
    g.fillRect(X+44, Y+21, X+45, Y+21).fillRect(X+45, Y+20, X+45, Y+21).fillRect(X+44, Y, X+45, Y).fillRect(X+45, Y, X+45, Y+1);
    // values.
    g.setFontAlign(0,0).setFont("6x8").setColor(boxTxtColor);
    fitText(ramUsedPercent, 13, 8).drawString(ramUsedPercent, X+39, Y+6);
    fitText(hdUsedPercent, 13, 8).drawString(hdUsedPercent, X+39, Y+16);
    // bars.
    g.setColor(bgColor).fillRect(X+11, Y+2, X+11+maxBarPixels, Y+9).fillRect(X+11, Y+12, X+11+maxBarPixels, Y+19); // Empty bars.
    g.setColor(RED).fillRect(X+11, Y+2, ramBarPixels, Y+9).fillRect(X+11, Y+12, hdBarPixels, Y+19); // Fill bars.
    // Borders.
    g.setColor(boxColor).setPixel(X+11, Y+2).setPixel(X+11+maxBarPixels, Y+2).setPixel(X+11, Y+9).setPixel(X+11+maxBarPixels, Y+9);
    g.setPixel(X+11, Y+12).setPixel(X+11+maxBarPixels, Y+12).setPixel(X+11, Y+19).setPixel(X+11+maxBarPixels, Y+19);
  };
  // *******************
  // Draw weather.
  //
  let barPressures = [];
  let barIntervallID;
  let barTimeoutID;
  let barSampling = false;
  let lastPressure;
  // Get barometer temperature and pressure values.
  let drawWeather = function(pressure) {
    if (!canDraw()) return;
    const text = pressure === undefined ? '--' : pressure.toFixed(pressure < 1000 ? 1 : 0);
    const band = pressure === undefined ? '?' : pressure > weatherMaxPress ? 'high' : pressure < weatherMinPress ? 'low' : 'normal';
    if (unchanged('pressure', text + ':' + band)) return;
    let X = 5;
    let Y = 96;
    g.setColor(boxColor);
    fillRoundedRect(X, Y-1, X+100, Y+16, 7);
    g.reset().setColor(debug ? RED : boxColor).fillRect(X+4, Y, X+95, Y+15); // Clear.
    g.setColor(boxTxtColor);
    if (pressure === undefined) {
      g.setFont("Vector", 16).setFontAlign(0, 0).drawString("?", X+14, Y+8);
    } else if (pressure > weatherMaxPress) { // Sun.
      g.drawImage(atob("EhCBAADADDDDgHBzOAv0Af4Af4O/9+/9wf4Af4Av0BzODgHDDDADAA=="), X+6, Y);
    } else if (pressure < weatherMinPress) { // Stormy.
      g.drawImage(atob("Eg+BAAPgAZwAz4A37A33nf/9/57/7///n//AAADMzBmZgzMwREQ="), X+4, Y+1);
    } else { // Overcast.
      g.drawImage(atob("FxCBAAAGAAeMMB+A4GczgZ96A374B/3wN/v39+/vfz+C/38H/30H5mcH+AcAAYYAAwA="), X+4, Y);
    }
    g.setFont("Vector", 16).setFontAlign(1, 0).drawString(text, X+74, Y+9);
    g.setFont("6x8").setFontAlign(-1, 0).drawString('hPa', X+77, Y+8);
  };
  function stopBarometer() {
    if (barTimeoutID !== undefined) clearTimeout(barTimeoutID);
    barTimeoutID = undefined;
    Bangle.removeListener('pressure', getBarometer);
    if (barSampling) Bangle.setBarometerPower(false, APP_ID);
    barSampling = false;
    barPressures = [];
  }
  function armBarometerTimeout() {
    if (barTimeoutID !== undefined) clearTimeout(barTimeoutID);
    barTimeoutID = setTimeout(function() {
      barTimeoutID = undefined;
      if (!active) return;
      stopBarometer();
      lastPressure = undefined;
      drawWeather(lastPressure);
    }, 20000);
  }
  function getBarometer(e) {
    if (!active || !barSampling || !e || typeof e.pressure !== 'number' ||
        !isFinite(e.pressure) || e.pressure < 300 || e.pressure > 1100) return;
    barPressures.push(e.pressure);
    if (barPressures.length < 8) return;
    lastPressure = barPressures.reduce((sum, value) => sum + value, 0) / barPressures.length;
    barPressures = [];
    if (longTriggered || barIntervall === 0) armBarometerTimeout();
    else stopBarometer();
    drawWeather(lastPressure);
  }
  function initBarometer() {
    if (!canDraw() || barSampling) return;
    barSampling = true;
    barPressures = [];
    Bangle.on('pressure', getBarometer);
    armBarometerTimeout();
    Bangle.setBarometerPower(true, APP_ID);
  }
  function stopDataUpdates() {
    if (stepIntervallID !== undefined) clearInterval(stepIntervallID);
    if (memIntervallID !== undefined) clearInterval(memIntervallID);
    if (battIntervallID !== undefined) clearInterval(battIntervallID);
    if (barIntervallID !== undefined) clearInterval(barIntervallID);
    stepIntervallID = memIntervallID = battIntervallID = barIntervallID = undefined;
    Bangle.removeListener('step', drawSteps);
    stopBarometer();
  }
  function setBatteryTimer() {
    if (battIntervallID !== undefined) clearInterval(battIntervallID);
    battIntervallID = undefined;
    if (!canDraw()) return;
    let period = longTriggered || battIntervall === 0 ? 1000 : battIntervall;
    if (Bangle.isCharging()) period = Math.min(period, 30000);
    battIntervallID = setInterval(drawBatt, period);
  }
  function startDataUpdates() {
    stopDataUpdates();
    if (!canDraw()) return;
    if (longTriggered || stepIntervall === 0) Bangle.on('step', drawSteps);
    else stepIntervallID = setInterval(drawSteps, stepIntervall);
    memIntervallID = setInterval(drawMemory, longTriggered || memIntervall === 0 ? 1000 : memIntervall);
    setBatteryTimer();
    // A retry interval also recovers Live mode after a missing-sensor timeout.
    barIntervallID = setInterval(initBarometer, longTriggered || barIntervall === 0 ? 15000 : barIntervall);
    initBarometer();
  }
  function refreshAll() {
    if (!canDraw()) return;
    renderCache = {};
    drawClock();
    drawDate();
    drawBpm();
    drawSteps();
    drawBLE();
    drawLock();
    drawGPS();
    drawBatt();
    drawMemory();
    drawWeather(lastPressure);
  }
  function redrawAll() {
    if (!canDraw()) return;
    drawTheme();
    refreshAll();
  }
  function onCharging() {
    if (!active) return;
    setBatteryTimer();
    drawBatt();
  }
  function onLock(locked) {
    if (!active) return;
    if (locked) cancelPress();
    drawLock();
  }
  function onLCDPower(on) {
    if (!active) return;
    if (!on) cancelPress();
    if (!offScreenUpd && !on) {
      stopDataUpdates();
      if (mainTimeoutID !== undefined) clearTimeout(mainTimeoutID);
      mainTimeoutID = undefined;
    } else if (on) {
      redrawAll();
      startDataUpdates();
      mainLoop();
    }
  }

  // *******************
  // Exit strategy handler.
  //
  Bangle.setUI({
    mode : "clock",
    redraw : redrawAll,
    remove : function() {
      if (!active) return;
      active = false;
      cancelPress();
      if (mainTimeoutID !== undefined) clearTimeout(mainTimeoutID);
      mainTimeoutID = undefined;
      if (widgetDrawTimer !== undefined) clearTimeout(widgetDrawTimer);
      widgetDrawTimer = undefined;
      stopDataUpdates();
      Bangle.removeListener('charging', onCharging);
      Bangle.removeListener('lcdPower', onLCDPower);
      Bangle.removeListener('lock', onLock);
      Bangle.removeListener('HRM', drawBpmOnHRM);
      Bangle.removeListener('health', onHealth);
      Bangle.removeListener('GPS', drawGPS);
      Bangle.removeListener('midnight', drawSteps);
      Bangle.removeListener('drag', liveCtrl);
      NRF.removeListener('connect', drawBLE);
      NRF.removeListener('disconnect', drawBLE);
      detachHRMPower();
      detachGPSPower();
      g.reset().clear();
      widget_utils.show();
    }
  });

  // Install observers after setUI has detached the previous clock's observers.
  detachHRMPower = config.observePower(Bangle, 'setHRMPower', drawBpm);
  detachGPSPower = config.observePower(Bangle, 'setGPSPower', drawGPS);

  // *******************
  // Run only on the first app execution.
  //
  let makeIt = function() {
    Bangle.on('charging', onCharging);
    Bangle.on('lcdPower', onLCDPower);
    Bangle.on('lock', onLock);
    Bangle.on('HRM', drawBpmOnHRM);
    Bangle.on('health', onHealth);
    Bangle.on('GPS', drawGPS);
    Bangle.on('midnight', drawSteps);
    Bangle.on('drag', liveCtrl);
    NRF.on('connect', drawBLE);
    NRF.on('disconnect', drawBLE);
    Bangle.loadWidgets();
    widget_utils.hide();
    widgetDrawTimer = setTimeout(function() {
      widgetDrawTimer = undefined;
      if (active) Bangle.drawWidgets();
    }, 0);
    redrawAll();
    startDataUpdates();
    mainLoop();
  };

  // *******************
  // Clock-app entery point.
  makeIt();

})(); // End of app scope.

// That's all folks!
