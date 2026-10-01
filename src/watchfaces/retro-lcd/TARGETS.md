# Retro LCD build targets

Zeus catalog snapshot: 2026-10-01. Only round screens with a 480 × 480 resolution are included. The catalog is checked in so builds do not silently gain new targets.

Retro LCD physical validation is pending; Essential device evidence does not establish Retro LCD behavior. All other variants are build-validated only; installation, firmware/API behavior and AOD require device testing.

| Model | deviceSource |
| --- | --- |
| Amazfit GTR 3 Pro | 229, 230, 6095106 |
| Amazfit GTR 3 Pro Limited Edition | 242 |
| Amazfit Cheetah Pro | 8126720, 8126721 |
| Cheetah Pro Kelvin Kiptum | 8126727 |
| Amazfit Balance | 8519936, 8519937, 8519939 |
| Amazfit T-Rex 3 | 8716544, 8716545, 8716547 |
| Amazfit GTR 4 new | 9437441 |
| Amazfit Balance 2 | 9568512, 9568513, 9568515 |
| Amazfit Cheetah 2 Ultra | 9978112, 9978113 |
| Amazfit Balance 2 XT | 10486016, 10486017, 10486019 |
| Amazfit T-Rex 3 Pro (48mm) | 10551552, 10551553, 10551555 |
| Amazfit Active Max | 10813697, 10813699 |
| Amazfit T-Rex Ultra 2 | 10879232, 10879233, 10879235 |
| Amazfit Balance Ultra | 11075840, 11075841, 11092224, 11092225 |
| Amazfit Balance 3 | 11141376, 11141377, 11141379 |
| Amazfit Balance 3 Ti | 11145472, 11145473, 11145475 |

Retro LCD uses bitmap text and digits, including date labels, so older models do not require custom TTF support. Each deviceSource has an installation ZIP named with its model and deviceSource (for example, `retro-lcd-0.1.6-amazfit-balance-2-xt-10486017.zip`); Zeus may share one binary package across devices with matching CPU and display characteristics. Original group metadata is preserved.
