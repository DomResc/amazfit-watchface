# Retro LCD

Independent 480 × 480 circular OLED watchface for the full round 480 × 480 Amazfit catalog. Application ID `1092704`, version `0.1.11`.

The approved Deep Ocean theme uses a true black background, neutral text and continuous activity rings in `#62c7d4`, `#3598aa` and `#216374`. Weather, sleep, alarm and battery icons use the matching turquoise accent. The digital typography and sensor bindings are preserved.

- Three concentric rings show steps, calories and active/fat-burning minutes relative to each device sensor's target. Each ring contains only its icon. The classic Zepp `FAT_BURRING` sensor reports fat-burning minutes; this is not standing count or total workout duration.
- Weather shows the current temperature, daily low/high and a condition icon. Sleep shows total sleep time in hours and minutes; unavailable sleep is `--:--`.
- Time respects the device's 12/24-hour preference. AM/PM appears only in 12-hour mode; there is no 24H caption. Native seconds share the main time's lower edge. The normal date row combines an Italian/English weekday abbreviation and DD-MM; AOD uses the same weekday/DD-MM row.
- Alarm time is the native `ALARM_CLOCK` widget with zero padding. Battery uses a continuous bar with eleven charge levels. Alarm and battery share the same left edge beside the main time.
- ALM reflects the system alarm, SIG phone connectivity, and MUTE Do Not Disturb. Captions are centered in the curved cells, on a shared horizontal baseline.
- AOD shows dim time, abbreviated weekday and date on black. Sensor listeners detach on pause/destruction and refresh on resume. Sleep refreshes on resume; weather and cached sleep readings refresh with each minute.

All numerical sprites use DSEG7 Classic Bold at their native aspect ratio. All ordinary labels use Space Grotesk Bold. Fonts and licenses are retained in `fonts/`. No runtime dependency is added.

## Build

```sh
node scripts/render-retro-lcd-vectors.mjs /path/to/zeus-cli/node_modules/sharp
python3 scripts/render-retro-lcd-assets.py
npm test
npm run test:packaging
npm run typecheck
npm run build -- retro-lcd
```

The vector renderer uses Sharp already bundled with Zeus to rasterize the editable SVG inputs. The Pillow renderer uses the generated background and icon rasters, native font metrics and `watchface/layout.json`. It generates 101 transparent frames per activity ring, glyphs, status masks, layout constants, and illustrative normal/AOD previews. Preview data is never hardcoded into runtime sensor values.

Installation ZIPs are in `dist/install/` for every deviceSource in the [round 480 × 480 catalog](TARGETS.md). Use the ZIP matching the watch. Local tests and builds do not establish physical watch behavior: verify weather synchronization, sleep availability, minute targets, alarms, connection/DND transitions, seconds rollover, 12-hour mode and AOD on the device.

## Local simulator

Download and launch the Balance 2 device in Zepp OS Simulator, then run from the repository root:

```sh
npm run preview:retro-lcd
```

Accept the default simulator host `127.0.0.1`. The command creates a temporary project with the existing Balance 2 device IDs and runs `zeus dev`. The production manifest retains the full round 480 × 480 catalog; the simulator-only copy uses the Balance 2 profile. Restart the command after editing source code or regenerating assets to copy the latest production files into the temporary project. The temporary copy can be deleted after stopping Zeus.

The simulator command injects weather 17°C, daily range 12–21°C and alarm 07:00 only into its temporary copy. Device builds retain native sensor and alarm bindings.

Version 0.1.10 applies the approved Deep Ocean OLED layout. The main time is 60 pixels high and shares its bottom at y=345 with the 26-pixel seconds. The alarm/battery group is centered vertically against the time. Main icons occupy 32×32 boxes; activity icons are smaller with increased left spacing. AOD shares the updated time and date positions with normal mode, using dim monochrome assets.

## Target policy

Follow the repository [device target and release policy](../../../docs/device-target-policy.md) for full round 480 × 480 catalog coverage, compatibility fallbacks and validation claims. This watchface is configured for the complete matching catalog. Text and digits use bitmap assets, so custom TTF support is not required. Sensor/status and AOD behavior on other models remain subject to physical checks.

Version 0.1.9 measures actual glyph ink before rendering and reserves a safe inset for numerical sprites, labels and vector icons. Glyph advances, digit segment positions and approved widget coordinates are preserved; zero-advance decimal points receive an explicit ink box.

Version 0.1.10 increases the main icons to 32×32, the native alarm font to 22 pixels, and the battery bar to 76×24. Alarm/battery centers and content alignment are preserved. The normal/AOD date dash is centered between visible adjacent glyph edges, including narrow month digits.

Version 0.1.11 adds a seven-pixel gap between the main alarm/battery icon boxes and the right-side content, and centers visible alarm digits against the icon rather than the font box.
