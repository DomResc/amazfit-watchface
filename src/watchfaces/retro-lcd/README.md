# Retro LCD

Independent 480 × 480 circular LCD watchface for the full round 480 × 480 Amazfit catalog. Application ID `1092704`, version `0.1.6`.

The approved Sensors-inspired layout uses a graphite activity background, LCD-gray activity arcs, and gray LCD weather, sleep and time panels following the circular display. The approved Sage LCD palette is: main `#8b9984`, lower edge `#65715d`, shadow `#4a5647`, ink `#080a0a`. No Casio branding is included.

- Three concentric rings show steps, calories and active/fat-burning minutes relative to each device sensor's target. Each ring contains only its icon. The classic Zepp `FAT_BURRING` sensor reports fat-burning minutes; this is not standing count or total workout duration.
- Weather shows the current temperature, daily low/high and a condition icon. Sleep shows total sleep time in hours and minutes; unavailable sleep is `--:--`.
- Time respects the device's 12/24-hour preference. AM/PM appears only in 12-hour mode; there is no 24H caption. Native seconds share the main time's lower edge. The normal date row combines an Italian/English weekday abbreviation and DD/MM; AOD uses the same weekday/DD/MM row.
- Alarm time is the native `ALARM_CLOCK` widget with zero padding. Battery uses ten segments.
- ALM reflects the system alarm, SIG phone connectivity, and MUTE Do Not Disturb. Captions are centered in the curved cells, on a shared horizontal baseline.
- AOD shows dim time, abbreviated weekday and date on black. Sensor listeners detach on pause/destruction and refresh on resume. Sleep refreshes on resume; weather and cached sleep readings refresh with each minute.

All numerical sprites use DSEG7 Classic Bold at their native aspect ratio. All ordinary labels use Space Grotesk Bold. Fonts and licenses are retained in `fonts/`. No runtime dependency is added.

## Build

```sh
python3 scripts/render-retro-lcd-assets.py
npm test
npm run test:packaging
npm run typecheck
npm run build -- retro-lcd
```

The Pillow renderer uses the retained background and icon rasters, native font metrics and `watchface/layout.json`. It generates 101 transparent frames per activity ring, glyphs, status masks, layout constants, and illustrative normal/AOD previews. Preview data is never hardcoded into runtime sensor values.

Installation ZIPs are in `dist/install/` for every deviceSource in the [round 480 × 480 catalog](TARGETS.md). Use the ZIP matching the watch. Local tests and builds do not establish physical watch behavior: verify weather synchronization, sleep availability, minute targets, alarms, connection/DND transitions, seconds rollover, 12-hour mode and AOD on the device.

## Local simulator

Download and launch the Balance 2 device in Zepp OS Simulator, then run from the repository root:

```sh
npm run preview:retro-lcd
```

Accept the default simulator host `127.0.0.1`. The command creates a temporary project with the existing Balance 2 device IDs and runs `zeus dev`. The production manifest retains the full round 480 × 480 catalog; the simulator-only copy uses the Balance 2 profile. Restart the command after editing source code or regenerating assets to copy the latest production files into the temporary project. The temporary copy can be deleted after stopping Zeus.

The simulator command injects weather 17°C, daily range 12–21°C and alarm 07:00 only into its temporary copy. Device builds retain native sensor and alarm bindings.

Version 0.1.5 applies the approved Sage LCD palette: panel/ring `#8b9984`, shadow `#4a5647`, bottom edge `#65715d`. Activity rings have a four-pixel gap. The main time is 70 pixels high; seconds are 26 pixels high and share its baseline. Alarm and a 68×20 battery bar sit above the main time. Status captions share y=435 in the reduced strip beginning at y=426.

## Target policy

Follow the repository [device target and release policy](../../../docs/device-target-policy.md) for full round 480 × 480 catalog coverage, compatibility fallbacks and validation claims. This watchface is configured for the complete matching catalog. Text and digits use bitmap assets, so custom TTF support is not required. Sensor/status and AOD behavior on other models remain subject to physical checks.
