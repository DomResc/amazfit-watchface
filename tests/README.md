# Tests

Run `npm test`. The suite covers time formatting, Italian/English labels, date boundaries, invalid data, centering, unchanged-value updates and lifecycle subscription cleanup. Runtime tests execute the actual entrypoint with mocked device APIs in isolated Node VM modules.

Mocks do not establish physical-device API compatibility, exact rendering, AOD refresh or battery performance.

Run `npm run test:packaging` for RGB565 padding regression tests: preserve content/metadata, clear every padding color channel and reject truncated data.
