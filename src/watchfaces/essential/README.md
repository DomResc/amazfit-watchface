# Essential

A minimal digital watchface for round 480 × 480 Zepp OS devices, designed for local installation through Gadgetbridge. See [build targets](TARGETS.md); Balance 2 XT (`10486017`) is the physically tested device.

## Behavior

- Time centered at `(240, 240)` on the 480 × 480 display.
- Italian weekday/month labels when the device language ID is `10`; English otherwise.
- Device 12/24-hour preference; AM/PM appears only in 12-hour mode.
- Dedicated AOD with smaller time and date, black background and no seconds.
- Minute-change updates, refresh on resume, and listener cleanup on pause/destroy.
- Invalid time/date fields display placeholders.

The implementation uses the classic documented watchface globals (`hmUI`, `hmSensor`, `hmSetting`). It does not use the newer device-app module API. Narrow local declarations cover only the API surface used here. The user confirmed correct normal/AOD updates on the physical watch; detailed lifecycle stress checks remain pending.

## Build

From the repository root:

```sh
nvm use
npm ci
npm test
npm run test:packaging
npm run typecheck
npm run build -- essential
```

Node is pinned to 24.19.0, TypeScript to 5.9.3 and the build wrapper requires globally available Zeus CLI 1.9.3. To set up Zeus on a development machine:

```sh
npm install --global @zeppos/zeus-cli@1.9.3
```

The build does not upload or publish. It extracts the device ZIP from Zeus's bundle and checks app identity, version, explicit target and required resources.

Output: `dist/install/essential-0.1.3-<model>-<deviceSource>.zip`, one ZIP per catalog target. All expected targets must compile and pass package validation before release.

## Local installation

App ID `1092702` is a local development identity, not a portal-issued publication ID. Keep it stable across updates and do not reuse it for another installed personal watchface.

1. Copy the generated ZIP matching your deviceSource to your Android phone.
2. Connect the Balance 2 XT in Gadgetbridge.
3. Open the ZIP with Gadgetbridge's FW/App installer and verify it identifies Essential as a watchface.
4. Install, then select Essential on the watch.
5. Test Italian/English, 12/24-hour preference, midnight, normal/AOD/wake and switching away/back.

Gadgetbridge documents Balance 2 XT support and watchface installation. The user confirmed installation of version 0.1.0 and correct watchface/AOD updates on Balance 2 XT. The user confirmed the corrected watch selection preview in 0.1.1. Version 0.1.2 clears RGB565 padding to fix the remaining red stripe in the Gadgetbridge installer; the user accepted that installer correction. Exact system font metrics, the AOD illuminated area and battery impact remain unverified; browser preview typography is indicative.

## Assets and license

Source code is original project work under MIT. `assets/balance-2-xt/icon.png` depicts the normal time/date layout at 324 × 324. The optional `scripts/render-essential-preview.py` regenerates it using Pillow and a supplied local font file. The current preview uses Liberation Sans as a system-font substitute; exact device glyph metrics may differ. Runtime text uses the device's system font; no third-party fonts or artwork are bundled.

## Official references

- [Time sensor](https://docs.zepp.com/docs/watchface/api/hmSensor/sensorId/TIME/)
- [Text widgets](https://docs.zepp.com/docs/watchface/api/hmUI/widget/TEXT/)
- [Lifecycle delegate](https://docs.zepp.com/docs/watchface/api/hmUI/widget/DELEGATE/)
- [Language mapping](https://docs.zepp.com/docs/reference/related-resources/language-list/)
- [Time preference](https://docs.zepp.com/docs/watchface/api/hmSetting/getTimeFormat/)
- [Gadgetbridge Zepp OS support](https://gadgetbridge.org/basics/topics/zeppos/)
- [Gadgetbridge installer](https://gadgetbridge.org/internals/features/installer/)
