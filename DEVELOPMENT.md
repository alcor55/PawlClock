# Pawl Clock: installation and development

User guide: [README](README.md).

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

Version 0.04 was checked with the official **Espruino 2v29.74** emulator, including
visual inspection of both themes. On-device checks still required:

1. Install over 0.01 and confirm preferences and Settings menu discovery.
2. Verify touch/release, automatic lock, charging and real HRM/GPS indicators.
3. Confirm real pressure sampling and app switching leave no clock sensor request.
4. Compare battery use over the same duration with default and Live settings.

Battery life and older firmware compatibility have not been measured.
