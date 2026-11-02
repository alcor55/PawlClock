# Pawl Clock

A full-screen digital clock for **Bangle.js 2** with time and date, daily steps,
estimated walking distance, heart rate, pressure, battery, RAM/storage usage,
and Bluetooth, lock and GPS indicators. Widgets are hidden while the clock is
open and restored on exit.

![Dark theme](screenshots/dark.png) ![Light theme](screenshots/light.png)

## Installation and upgrades

Install through a Bangle.js App Loader containing this app. The loader uses
`metadata.json` and resolves the `widget_utils`, `Font8x16` and `Font6x8` modules.
For a manual Web IDE installation, upload those modules and every file listed in
`storage` using its exact on-watch name, including the extensionless shared module
`pawlClock`, then run `pawlClock.app.js`. Copying only `app.js` is insufficient.

Settings are available under **Settings → App/Widget Settings → Pawl Clock**.
Versions 0.02 and later keep the app ID `pawlClock` and use matching storage filenames.
On first use it migrates preferences from `pawl-clock.json` (or the older declared
`pawl.settings.json`) into `pawlClock.json`. Existing canonical settings take
precedence. Migration keeps the visible Light/Dark theme even when an old theme
index disagrees with its saved palette. Old preference files are retained as a
backup and are included in the app's data manifest for removal on uninstall.
Invalid values fall back to safe defaults. A normal startup does not write flash.

## Settings and interaction

- **Theme:** Light or Dark; default Dark.
- **Update LCD off?:** defaults to enabled. If disabled, periodic updates and
  barometer sampling stop when the LCD is powered off. Waking the LCD refreshes
  all sections and resumes sampling. On Bangle.js 2 the reflective LCD normally
  stays on after the backlight turns off; this option refers to LCD power,
  independently of the backlight and screen lock.
- **Update intervals:** Live, 15/30 seconds, 1/3/5/10 minutes; default one minute.
  Steps in Live mode update on step events. Battery and memory in Live mode
  update once per second. Pressure in Live mode keeps sampling and displays an
  average of each eight valid readings. Clock time updates on minute boundaries;
  HRM, GPS, Bluetooth and lock indicators follow their events.
- **Temporary Live mode:** hold a finger on the unlocked display for 1.5 seconds.
  Step, battery, memory and pressure updates use Live rates until release,
  screen lock or LCD power-off. This does not change saved preferences or turn
  on GPS/HRM. Movement while holding is treated as part of the same press.
- **User Height:** 100–220 cm, default 175 cm. Distance is marked `~` and estimates
  walking distance using a step length of `height × 0.415`; it is not GPS distance.
- **Step Goal:** 1,000–10,000 steps, default 5,000. The ring stops at 100%; the step
  count continues beyond the goal and resets with the daily health counter.
- **Pressure limits:** default 1005/1020 hPa; the minimum must remain below the
  maximum. The weather icons are approximate pressure indicators, not forecasts.
  Absolute pressure also depends on altitude; no sea-level correction is applied.
- **Debug:** redraws unchanged values and highlights cleared regions. It still
  respects the LCD power setting.

Pressure is sampled immediately on entry and periodically thereafter. Each
normal sample averages eight readings, then releases the clock's sensor request.
A 20-second watchdog releases the request if sampling stalls; periodic retries
also recover Live mode. `--` indicates an unavailable or timed-out reading.
Battery refresh is capped at 30 seconds while charging, with faster configured
rates preserved. Heart rate uses recent health data and HRM events with confidence
above 60%, plus health events. Missing BPM values recover from valid current or
previous health data. This clock does not independently request HRM power.

The clock supports a complete `Bangle.uiRedraw()` after temporary screens. Its
sensor power observers detach on exit without overwriting wrappers subsequently
installed by widgets; retained observers stop referencing the clock's callbacks.
Temporary Live mode requires the LCD to be on even if off-screen updates are enabled.

## Verification

Run the regression tests with Node.js 18 or newer, without dependencies:

```sh
node --test tests/clock.test.js
```

They cover settings migration/validation, sensor ownership, timeout/retry,
wrappers, long presses and lock, LCD wake/sleep, charging, redundant redraws,
daily steps, cleanup, repeated fast loading, widget wrappers, BPM recovery and
complete UI redraw.

For a firmware smoke test, download the official emulator and modules into a
temporary directory, then run the included runner from this repository:

```sh
mkdir -p /tmp/pawl-clock-emulator
for name in emulator_banglejs2 emu_banglejs2 common; do
  curl -fsSL "https://raw.githubusercontent.com/espruino/EspruinoWebIDE/master/emu/$name.js" \
    -o "/tmp/pawl-clock-emulator/$name.js"
done
for name in Font8x16 Font6x8; do
  curl -fsSL "https://www.espruino.com/modules/$name.min.js" \
    -o "/tmp/pawl-clock-emulator/$name.js"
done
curl -fsSL https://raw.githubusercontent.com/espruino/BangleApps/master/modules/widget_utils.js \
  -o /tmp/pawl-clock-emulator/widget_utils.js
ESPRUINO_EMU_DIR=/tmp/pawl-clock-emulator node tests/emulator-smoke.cjs
```

The runner uploads the real app to an isolated emulated watch, checks migration,
widget wrappers, BPM recovery, temporary Live mode, LCD wake/sleep, complete
redraw, repeated cleanup and settings. It writes `dark.png`, `light.png` and `settings.png` to that temporary directory.
Set `ESPRUINO_SCREENSHOT_DIR` to choose another output directory.
The emulator has limited sensor hardware support, so sensor power calls are
traced and readings are injected; physical sensor behavior is not measured.

Version 0.03 was checked with the official **Espruino 2v29.74** emulator, including
visual inspection of both themes. On-device checks still required:

1. Install over 0.01 and confirm preferences and Settings menu discovery.
2. Verify touch/release, automatic lock, charging and real HRM/GPS indicators.
3. Confirm real pressure sampling and app switching leave no clock sensor request.
4. Compare battery use over the same duration with default and Live settings.

Battery life and older firmware compatibility have not been measured.
