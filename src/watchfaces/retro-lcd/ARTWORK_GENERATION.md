# Approved Deep Ocean artwork

`background-source.svg` retains editable black panel separators, activity tracks and static icons. `background-source.png` is generated from the vector artwork, with two-pixel separators in `#465761`. `scripts/render-retro-lcd-vectors.mjs` renders static icons, activity symbols and the weather families directly from SVG using Sharp bundled with Zeus. The checked-in weather mapping preserves the existing condition families for indices 0–28; weather icons use 32×32 boxes, and smaller activity symbols remain centered in their transparent image boxes with increased left spacing in the layout.

`scripts/render-retro-lcd-assets.py` combines these inputs with the retained DSEG7 Classic Bold and Space Grotesk Bold fonts. Runtime coordinates come from `watchface/layout.json`; generated `layout.js` includes glyph advances for variable-length weather and sleep fields.

Normal time and seconds share a bottom at y=345. Alarm and battery icons share center x=64, with the group centered at y=315. Alarm text and battery bar begin at x=87. Color is reserved for rings and icons; text, numerical sprites and the continuous battery fill remain neutral. AOD shares the updated normal time and date geometry, using dim monochrome colors. Date and weather range separators use a dash.

Normal and AOD previews in `docs/previews/` use illustrative readings assembled from production assets. Simulator demo readings remain isolated from device builds.

Numerical glyphs and ordinary labels are rasterized at four times the final resolution and downsampled once without changing their native aspect ratio. Static icons are rendered directly into the background rather than extracted from low-resolution crops.

Glyphs are first rendered on an oversized measurement canvas, then fitted with one uniform scale per style. Their relative segment positions and baseline are preserved inside existing sprite boxes, with a one-pixel ink inset. Labels use actual ink bounds; icon SVG viewports include stroke-safe padding before rasterization. Asset tests check the borders of every active font and icon, including static background icons.

The main icon centers remain fixed when their boxes grow to 32×32. Alarm text is 22 pixels high, with a matching 76-pixel continuous battery bar. Generated `DATE_INK_BOUNDS` lets normal and AOD date separators track the visible gap between day and month rather than the advance boxes.

Alarm and battery content now begin at x=87, seven pixels after their icon boxes. The alarm widget y=288 aligns the visible numerical ink with the icon center at y=296.
