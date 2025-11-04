/*
*    Pawl Clock v0.01
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


{ // Fast Loading ( Brackets to define the app scope ).
  
  
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
  let appName = 'Pawl_Clock_v0.01';
  const w = g.getWidth(); // 176 Pixels.
  const h = g.getHeight(); // 176 Pixels.

  
  // *******************
  // Custom font Lato 70 (https://www.espruino.com/Font+Converter).
  //
  Graphics.prototype.setFontLato70 = function() {
    // Actual height 53 (56 - 4)
    // 1 BPP
    return this.setFontCustom(
      E.toString(require('heatshrink').decompress(atob('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'))),
      46,
      atob("DRomJSUlJyQmJiUmDg=="),
      67|65536
    );
  };
  
  
  // *******************
  // Load settings.
  //
  let settings = Object.assign({
    debug:           false, // Default false.
    barIntervall:    60000,  // Default 1min.
    memIntervall:    60000,  // Default 1min.
    stepIntervall:   60000,  // Default 1min.
    battIntervall:   60000,  // Default 1min.
    offScreenUpd:    true,   // Default true.
    weatherMinPress: 1005,   // Default 1005.
    weatherMaxPress: 1020,   // Default 1020.
    theme:           0,      // Default theme index.
    bgColor:         0x0000, // Default Black.
    boxColor:        0xffe0, // Default Yellow.
    txtColor:        0xffff, // Default White.
    boxTxtColor:     0x0000, // Default Black.
    userHeight:      175,    // cm.
    userStepGoal:    5000   // steps.
  }, storage.readJSON("pawl-clock.json", true) || {});
  // Various.
  let offScreenUpd    = settings.debug ? true : settings.offScreenUpd;
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
  let bgColor         = settings.bgColor;
  let boxColor        = settings.boxColor;
  let txtColor        = settings.txtColor;
  let boxTxtColor     = settings.boxTxtColor;
  let RED             = 0xf800;


  // *******************
  // Next minute mainLoop schedule.
  //
  let mainTimeoutID;
  let mainLoopTimer = function() {
    if (mainTimeoutID) clearTimeout(mainTimeoutID);
    mainTimeoutID = setTimeout(function() {
      mainTimeoutID = undefined;
      mainLoop();
    }, 60000 - (Date.now() % 60000));
  };
  

  // *******************
  // Main draw.
  //
  let mainLoop = function() {
    // Set next minute update timer.
    mainLoopTimer();
    // Draw stuffs.
    drawClock();
    drawDate();
  };


  // *******************
  // Live mode. 
  //
  let longPressTime = 1500; // ms per long press
  let pressTimer = null;
  let pressing = false;
  let longTriggered = false;
  let screenUnlocked = true;
  let liveOn = function() {
    if (!screenUnlocked || longTriggered) return;
    longTriggered = true;
    console.log("liveOn");
  };
  let liveOff = function() {
    if (!screenUnlocked) return;
    console.log("liveOff");
    longTriggered = false; // reset
  };
  let liveCtrl = function(e) {
    if (!screenUnlocked) return;
    if (e.b) {
      // dito premuto
      if (!pressing) {
        pressing = true;
        pressTimer = setTimeout(() => {
          liveOn();
          pressTimer = null;
        }, longPressTime);
      }
    } else {
      // dito rilasciato
      pressing = false;
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      // chiamalo solo se liveOn era stato attivato
      if (longTriggered) {
        liveOff();
      }
    }
  };
  Bangle.on("drag", liveCtrl);


  // *******************
  // Static graphical stuffs. 
  //
  let drawTheme = function() {
    g.reset();
    g.clear();
    // Draw background.
    g.setColor(bgColor).fillRect( 0, 0, w, h);
    g.setColor(0x0000);
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
  g.fillRoundedRect = function (x1, y1, x2, y2, r) {
    r = Math.min(r, (x2 - x1) / 2, (y2 - y1) / 2);
    // Corpo centrale
    this.fillRect(x1 + r, y1, x2 - r, y2);
    this.fillRect(x1, y1 + r, x2, y2 - r);
    // Angoli arrotondati
    this.fillCircle(x1 + r, y1 + r, r); // top-left
    this.fillCircle(x2 - r, y1 + r, r); // top-right
    this.fillCircle(x2 - r, y2 - r, r); // bottom-right
    this.fillCircle(x1 + r, y2 - r, r); // bottom-left
  };


  // *******************
  // Main clock drawing.
  //
  let drawClock = function() {
    let date = new Date();
    let timeStr = locale.time(date,1);
    // Draw time.
    let X = 3;
    let Y = 29;
    g.reset().setColor(debug ? RED : bgColor).fillRect(X, Y, X+169, Y+58); // Clear.
    g.setFontAlign(0, 0).setColor(txtColor).setFontLato70().drawString(timeStr, X+83, Y+33);
  };


  // *******************
  // Date Info drawing.
  //
  let drawDate = function() {
    if (!Bangle.isLCDOn() && !offScreenUpd) return; // Exits the function if the screen is off and offScreenUpd is false.
    let date = new Date();
    let dayStr = locale.dow(date, 1);
    let dayNum = ("0" + date.getDate()).slice(-2);
    let monthStr = locale.month(date, 1);
    let monthNum = ("0" + (date.getMonth() + 1)).slice(-2);
    let X = 108;
    let Y = 99;
    g.setColor(boxColor).fillRoundedRect(X-4, Y-4, X+62, Y+40, 8);
    g.fillRect(X-6, Y-4, X, Y+13); // RoundedRect corner.
    g.setColor(bgColor).fillRoundedRect(X-2, Y+8, X+60, Y+38, 6);
    let Xi = X-6;
    let Yi = Y-21;
    for (let i = 0; i < 9; i++) {
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
    g.setColor(debug ? 0xffff : RED).setFont("Vector", 13).drawString(dayStr, X+14, Y+15).drawString(monthStr, X+46, Y+15);
    // Date number.
    g.setColor(txtColor).setFont("Vector", 17).drawString(monthNum, X+46, Y+30).drawString(dayNum, X+14, Y+30);
  };


  // *******************
  // HR Info drawing.
  // if ( Bangle.isCharging())
  //
  let drawBpm = function() {
    if (!Bangle.isLCDOn() && !offScreenUpd) return; // Exits the function if the screen is off and offScreenUpd is false.
    let X = 112;
    let Y = 146;
    g.reset().setColor(debug ? RED : bgColor).fillRect(X, Y, X+51, Y+22); // Clear.
    g.setColor(txtColor).setFontAlign(-1, 0);
    let hr = (!bp || isNaN(bp)) ? '--' : bp;
    if (typeof hr === "number" && hr > 99) {
      g.setFont("Vector", 18).drawString(hr, X+20, Y+9);
      g.setFont("Vector", 8).drawString('HEART RATE', X+0, Y+21);
    } else {
      g.setFont("Vector", 24).drawString(hr, X+22, Y+13);
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
  var hp = Bangle.setHRMPower;
  Bangle.setHRMPower = () => {
    hp.apply(Bangle, arguments);
    drawBpm();
  };
  var bp = Math.round(Bangle.getHealthStatus().bpm||Bangle.getHealthStatus("last").bpm);
  let drawBpmOnHRM = function(e) {
    if (e && e.confidence>60) bp = Math.round(e.bpm);
    if (bp == 0) bp = Math.round(Bangle.getHealthStatus().bpm||Bangle.getHealthStatus("last").bpm);
    drawBpm();
  };
  Bangle.on('HRM', drawBpmOnHRM);


  // *******************
  // Donut Chart drawing.
  //
  let drawDonutChart = function(cx, cy, rOuter, thickness, value, maxValue, color, bgColor) {
    const rInner = rOuter - thickness;
    const start = Math.PI * 1.5;         // parte dal basso
    const totalAngle = 2 * Math.PI;      // cerchio completo
    const valueAngle = start + totalAngle * (value / maxValue);
    // --- Sfondo anello ---
    g.setColor(bgColor);
    g.fillCircle(cx, cy, rOuter);
    g.setColor(0);
    g.fillCircle(cx, cy, rInner);
    // --- Parte di progresso ---
    g.setColor(color);
    const steps = 200;
    for (let i = 0; i < steps; i++) {
      const a1 = start + (totalAngle * i / steps);
      const a2 = start + (totalAngle * (i + 1) / steps);
      if (a1 >= valueAngle) break;
      const x1i = cx + Math.cos(a1) * rInner;
      const y1i = cy + Math.sin(a1) * rInner;
      const x2i = cx + Math.cos(a2) * rInner;
      const y2i = cy + Math.sin(a2) * rInner;
      const x1o = cx + Math.cos(a1) * rOuter;
      const y1o = cy + Math.sin(a1) * rOuter;
      const x2o = cx + Math.cos(a2) * rOuter;
      const y2o = cy + Math.sin(a2) * rOuter;
      g.fillPoly([x1o, y1o, x2o, y2o, x2i, y2i, x1i, y1i]);
    }
  };


  // *******************
  // Steps Info drawing.
  //
  let stepIntervallID;
  let drawSteps = function() {
    if (!Bangle.isLCDOn() && !offScreenUpd) return; // Exits the function if the screen is off and offScreenUpd is false.
    let X = 5;
    let Y = 125;
    g.reset().setColor(debug ? RED : bgColor).fillRect(X, Y, X+98, Y+38); // Clear.
    const k = 0.415; // run 0.65 walk 0.415.
    let steps = Bangle.getHealthStatus("day").steps;
    let stepLength = userHeight * k / 100;
    let distanceKm = (steps * stepLength) / 1000;
    let fontSize = 18;
    if (steps>9999) fontSize = 16;
    g.setColor(txtColor).setFontAlign(-1, 0);
    g.setFont("Vector", fontSize).drawString(steps, X+45, Y+10);
    g.setFont("Vector", 15).drawString(distanceKm.toFixed(1)+'km', X+45, Y+32);
    g.fillRect(X+45, Y+20, X+87, Y+21); // Bar.
    drawDonutChart(X+19, Y+19, 19, 6, steps, userStepGoal, RED, 0xffff);
    g.setColor(boxColor).drawImage(atob("EhKBAAcAA8MD+cP/8L/8N/oG/4DfoBv8A30Ab8AN+AG+ADfABvAA3AAbAAOA"), X+11, Y+11); // Shoe.
  };
  let drawStepsOnLcdPower = function(on) {
    if (on) drawSteps();
  };
  if (!offScreenUpd) { // Enable the lcdPower handler only if offScreenUpd is false.
    Bangle.on('lcdPower', drawStepsOnLcdPower);
  }
  const setSteps = function() {
    drawSteps();
    if (stepIntervall > 0) {
      // Interval mode
      stepIntervallID = setInterval(drawSteps, stepIntervall);
    } else {
      // Real-time mode
      Bangle.on('step', drawSteps);
    }
  };


  // *******************
  // BLE Info drawing.
  //
  let drawBLE = function() {
    if (!Bangle.isLCDOn() && !offScreenUpd) return; // Exits the function if the screen is off and offScreenUpd is false.
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
  // BLE update events.
  NRF.on('connect', drawBLE);
  NRF.on('disconnect', drawBLE);


  // *******************
  // Lock Screen drawing.
  //
  let drawLock = function() {
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
  // Lock Screen info update events.
  Bangle.on("lock", drawLock);


  // *******************
  // GPS drawing.
  //
  let drawGPS = function() {
    if (!Bangle.isLCDOn() && !offScreenUpd) return; // Exits the function if the screen is off and offScreenUpd is false.
    let X = 46;
    let Y = 6;
    g.reset().setColor(debug ? RED : bgColor).fillRect(X, Y, X+17, Y+17); // Clear.
    g.setColor(txtColor).drawImage(atob("EhKBADgAGwANYAKswNd4G7MD+GBsGAYMAwYAw2HZ/Hvdj26x41Q4awYNgAHA"), X, Y); // 17x18.
    // check if we need to update the widget periodically
    if (Bangle.isGPSOn() && intervalGPS === undefined) {
      intervalGPS = setInterval(
          function() { drawGPS(); },
          10 * 1000); // update every 10 seconds to show gps fix/no fix.
    } else if (!Bangle.isGPSOn() && intervalGPS !== undefined) {
      clearInterval(intervalGPS);
      intervalGPS = undefined;
    }
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
  var intervalGPS;
  // GPS info update events.
  var oldSetGPSPower = Bangle.setGPSPower;
  Bangle.setGPSPower = function(on, id) {
    var isGPSon = oldSetGPSPower(on, id);
    drawGPS();
    return isGPSon;
  };


  // *******************
  // Battery drawing.
  //
  let battIntervallID;
  let drawBatt = function() {
    if (!Bangle.isLCDOn() && !offScreenUpd) return; // Exits the function if the screen is off and offScreenUpd is false.
    // If is charging...
    if ( Bangle.isCharging())
      changeInterval(battIntervallID, 30000);
    else
      changeInterval(battIntervallID, battIntervall);
    let X = 72;
    let Y = 6;
    let battPixels = 18;
    g.reset().setColor(debug ? RED : bgColor).fillRect(X, Y+1, X+53, Y+16); // Clear.
    let batteryVal = E.getBattery();
    let xl = X+1+batteryVal*(battPixels)/100;
    g.setColor(RED).fillRect(X+2, Y+3, xl, Y+14); // Fill bar.
    require("Font8x16").add(Graphics);
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
  let setBatt = function() {
    // Battery update events.
    Bangle.on('charging', drawBatt);
    if ( battIntervall == 0 ) battIntervall = 1000; // Real time mode. (1sec).
    battIntervallID = setInterval(drawBatt, battIntervall);
  };


  // *******************
  // Memory drawing.
  //
  let memIntervallID;
  let drawMemory = function() {
    if (!Bangle.isLCDOn() && !offScreenUpd) return; // Exits the function if the screen is off and offScreenUpd is false.
    let X = 127;
    let Y = 3;
    let maxBarPixels = 19;
    let m = process.memory(false); 
    let totalHDSpace = process.env.STORAGE;
    let ramUsedPercent = Math.round(m.usage*100 / m.total);
    let hdUsedPercent = Math.round(((totalHDSpace - storage.getFree()) / totalHDSpace) * 100); 
    let ramBarPixels = X+11+ramUsedPercent*(maxBarPixels)/100;
    let hdBarPixels = X+11+hdUsedPercent*(maxBarPixels)/100;
    g.reset().setColor(debug ? RED : bgColor).fillRect(X, Y, X+41, Y+19); // Clear.  
    g.setColor(boxColor).fillRoundedRect(X, Y, X+45, Y+21, 7); // Main block.
    g.setColor(boxTxtColor).drawImage(atob("BQaBAP7rX9Q="), X+3, Y+3).drawImage(atob("BwaBADjLnxZHAA=="), X+2, Y+13); // Ram/HD icons.
    // main corner.
    g.setColor(bgColor).fillRect(X, Y, X+1, Y).fillRect(X, Y, X, Y+1).fillRect(X, Y+21, X+1, Y+21).fillRect(X, Y+20, X, Y+21);
    g.fillRect(X+44, Y+21, X+45, Y+21).fillRect(X+45, Y+20, X+45, Y+21).fillRect(X+44, Y, X+45, Y).fillRect(X+45, Y, X+45, Y+1);
    // values.
    require("Font6x8").add(Graphics);
    g.setFontAlign(0,0).setFont("6x8").setColor(boxTxtColor);
    g.drawString(ramUsedPercent, X+39, Y+6).drawString(hdUsedPercent, X+39, Y+16);
    // bars.
    g.setColor(bgColor).fillRect(X+11, Y+2, X+11+maxBarPixels, Y+9).fillRect(X+11, Y+12, X+11+maxBarPixels, Y+19); // Empty bars.
    g.setColor(RED).fillRect(X+11, Y+2, ramBarPixels, Y+9).fillRect(X+11, Y+12, hdBarPixels, Y+19); // Fill bars.  
    // Borders.  
    g.setColor(boxColor).setPixel(X+11, Y+2).setPixel(X+11+maxBarPixels, Y+2).setPixel(X+11, Y+9).setPixel(X+11+maxBarPixels, Y+9);
    g.setPixel(X+11, Y+12).setPixel(X+11+maxBarPixels, Y+12).setPixel(X+11, Y+19).setPixel(X+11+maxBarPixels, Y+19);
  };
  let setMemory = function() {
    if ( memIntervall == 0 ) memIntervall = 1000; // Real time mode. (1sec).
    memIntervallID = setInterval(drawMemory, memIntervall);
  };


  // *******************
  // Draw weather.
  //
  let barPressures = [];
  let barIntervallID;
  // Get barometer temperature and pressure values.
  let drawWeather = function(pressure) {
    let X = 5;
    let Y = 96;
    g.setColor(boxColor).fillRoundedRect(X, Y-1, X+100, Y+16, 7);
    g.reset().setColor(debug ? RED : boxColor).fillRect(X+4, Y, X+95, Y+15); // Clear.
    g.setColor(boxTxtColor);
    if (pressure > weatherMaxPress) { // Sun.
      g.drawImage(atob("EhCBAADADDDDgHBzOAv0Af4Af4O/9+/9wf4Af4Av0BzODgHDDDADAA=="), X+6, Y);
    } else if (pressure < weatherMinPress) { // Stormy.
      g.drawImage(atob("Eg+BAAPgAZwAz4A37A33nf/9/57/7///n//AAADMzBmZgzMwREQ="), X+4, Y+1);
    } else { // Overcast.
      g.drawImage(atob("FxCBAAAGAAeMMB+A4GczgZ96A374B/3wN/v39+/vfz+C/38H/30H5mcH+AcAAYYAAwA="), X+4, Y);
    }
    g.setFont("Vector", 16).setFontAlign(1, 0).drawString(pressure, X+74, Y+9);
    require("Font6x8").add(Graphics);
    g.setFont("6x8").setFontAlign(-1, 0).drawString('hPa', X+77, Y+8);
  };
  let getBarometer = function(e) {
    let barReadings = 8;
    if (barPressures.length > barReadings) barPressures.splice(barReadings);
    barPressures.unshift(e.pressure);
    // Shut down the barometer at barReadings.
    if (barPressures.length >= barReadings) {
      if ( barIntervall > 0 ) {
        Bangle.removeListener('pressure', getBarometer);
        Bangle.setBarometerPower(false, appName);
      }
      // Calc avgs.
      let sumPress = barPressures.reduce((acc, value) => acc + value, 0);
      let avgPress = sumPress / barPressures.length;
      barPressures = [];
      let pressure = (avgPress> -100 && avgPress < 1000) ? avgPress.toFixed(1) : avgPress.toFixed(0); // hPa. xxxx.
      drawWeather(pressure);
    }
  };
  const initBarometer = function() {
    if (!Bangle.isLCDOn() && !offScreenUpd) return; // Exits if the screen is off and offScreenUpd is false.
    Bangle.setBarometerPower(true, appName);
    Bangle.on('pressure', getBarometer);
  };
  const setBarometer = function() {
    drawWeather(0); // First zero draw.
    if (barIntervall > 0) {
      barIntervallID = setInterval(initBarometer, barIntervall); // Schedule next runs.
    } else { // Real time mode.
      initBarometer();
    }
  };

  
  // *******************
  // Exit strategy handler.
  //
  Bangle.setUI({
    mode : "clock",
    remove : function() {
      // Clear clock main timeout.
      if (mainTimeoutID) clearTimeout(mainTimeoutID);
      mainTimeoutID = undefined;
      // Clear other intervalls.
      if (intervalGPS) clearInterval(intervalGPS);
      intervalGPS = undefined;
      if (barIntervallID) clearInterval(barIntervallID);
      barIntervallID = undefined;
      if (battIntervallID) clearInterval(battIntervallID);
      battIntervallID = undefined;
      if (memIntervallID) clearInterval(memIntervallID);
      memIntervallID = undefined;   
      if (stepIntervallID) clearInterval(stepIntervallID);
      stepIntervallID = undefined;       
      // Shutdown barometer. (only for the clock).
      Bangle.setBarometerPower(false, "drawTempPressPawlClock");
      // Remove listners.
      Bangle.removeListener('charging', drawBatt);
      if ( stepIntervall == 0 ) // Real time mode.
        Bangle.removeListener('step', drawSteps);
      if (!offScreenUpd) { Bangle.removeListener('lcdPower', drawStepsOnLcdPower); }
      Bangle.removeListener('lock', drawLock);
      Bangle.removeListener('HRM', drawBpmOnHRM);
      Bangle.removeListener('drag', liveCtrl);
      Bangle.removeListener('pressure', getBarometer);
      NRF.removeListener('connect', drawBLE);
      NRF.removeListener('disconnect', drawBLE);
      // Restore overrided functions.
      Bangle.setHRMPower = hp;
      Bangle.setGPSPower = oldSetGPSPower;
      // Delete the custom font.
      delete Graphics.prototype.setFontLato;
      //
      g.clear();
      widget_utils.show(); // Show widgets. (FastLoading way).
    }
  });

  
  // *******************
  // Run only on the first app execution.
  //
  let makeIt = function() {
    // Set widgets.
    Bangle.loadWidgets(); // Load widgets.
    widget_utils.hide(); // Hide widgets. (FastLoading way).
    setTimeout(Bangle.drawWidgets,0); // Draw widgets. (FastLoading way).
    // Draw all on the first run.
    drawTheme(); 
    drawBpm();
    setSteps();
    drawBLE();
    drawLock();
    drawGPS();
    setBatt();
    drawBatt();
    setMemory();
    drawMemory();
    setBarometer();
    // Draw time and date and init the update loop.
    mainLoop();
  };

  // *******************
  // Clock-app entery point.
  makeIt();

} // End of app scope.

// That's all folks!
