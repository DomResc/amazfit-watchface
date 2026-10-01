# Approved circular artwork

`background-source.svg` retains the approved Sensors-inspired circular layout with dynamic text, battery segments and progress arcs removed. `background-source.png` is its Chromium rasterization. The existing Lucide SVG icons are retained beside the source; activity and weather icon rasters are generation inputs. The background uses the approved Sage LCD palette, shared by the activity progress arcs and the weather, sleep and time panels, with a graphite background behind the activity rings and continuous circular inset edges and an interior radius of 230 pixels.

`scripts/render-retro-lcd-assets.py` combines these retained inputs with DSEG7 Classic Bold and Space Grotesk Bold. Glyphs preserve their native advance and baseline instead of resizing their axes independently. Runtime coordinates come from `watchface/layout.json`; generated `layout.js` includes glyph advances for centered variable-length weather and sleep fields.

The main time bottom is y=373 and the seconds bottom is y=373. Status caption centers follow the curved cell areas: ALM (171.5,442), SIG (240,442), MUTE (308.5,442). Activity icons are overlaid after the progress arcs and have no captions. The 24-hour mode uses a transparent period asset.

The normal and AOD previews in `docs/previews/` are assembled from production assets. Their example readings are illustrative.

The simulator command injects weather 17°C, daily range 12–21°C and alarm 07:00 only into its temporary copy. Device builds retain native sensor and alarm bindings.
