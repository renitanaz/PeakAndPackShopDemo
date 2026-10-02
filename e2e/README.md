# PeakAndPack end-to-end tests

Playwright tests for the store, the API and the admin panel. They run in CI on every pull request
(`.github/workflows/e2e.yml`) against a copy of the app that the run starts itself.

## Run them on your computer

```bash
# 1. Install the backend and build the frontend once (the build points at the local backend)
cd backend && npm install
cd ../e2e && npm install && npx playwright install chromium
npm run app:build

# 2. Run the tests. Playwright starts the backend and serves the built frontend for you.
npm test
npm run test:smoke      # only the quick checks
npm run test:critical   # only tests tagged @critical
npm run report          # open the HTML report of the last run
```

After you change the frontend, run `npm run app:build` again: the tests use the built copy.

To test a deployed copy instead, set both addresses and nothing is started:

```bash
BASE_URL=https://your-ui.example.com API_URL=https://your-api.example.com npm run test:smoke
```

## How the run is organised

| Project | Runs | Notes |
|---|---|---|
| `smoke` | `tests/smoke/` | A few quick checks. Everything else waits for them to pass. |
| `chromium` | everything except smoke and mobile | Desktop Chrome |
| `mobile` | `tests/mobile/` | An emulated phone |

- **Every test owns its data.** A test registers its own customer (`fixtures/index.ts`), so tests run in parallel and in any order.
- **Tags** choose what runs: `@critical`, `@regression`, `@api`, `@a11y`, `@known-bug`.
- **Known bugs are tests too.** `tests/known-bugs/` and the accessibility test describe how the app *should* behave and are marked `test.fail()`, because it doesn't yet. The run stays green while a bug exists, and goes red the day it is fixed, which is the cue to delete the `test.fail()` line.
- **Flaky tests** (failed, then passed on the retry CI allows) are listed by the reporter, and `npm run gate` fails the run if more than 5% of the tests were flaky.

## Things worth knowing

- The admin routes verify tokens with `process.env.JWT_SECRET` and have no fallback, while `server.js` signs tokens with `JWT_SECRET || 'peakandpack-secret-key'`. A backend started without the variable rejects every admin token. The tests set `JWT_SECRET` for the backend they start.
- The frontend's API address is set when it is built (`REACT_APP_API_URL`). With nothing set it points at the live Render backend, as before.
