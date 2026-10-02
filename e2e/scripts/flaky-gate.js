// Reads the run's results.json and fails if too many tests were flaky
// (a test that failed, then passed on retry). Run it after the tests.
const fs = require('fs');

const { stats } = JSON.parse(fs.readFileSync('results.json', 'utf8'));
const total = stats.expected + stats.unexpected + stats.flaky + stats.skipped;
const rate = total === 0 ? 0 : stats.flaky / total;

console.log(`Flaky tests: ${stats.flaky} of ${total} (${(rate * 100).toFixed(1)}%)`);
if (rate > 0.05) {
  console.error('The flaky rate is over 5%. Fix or quarantine the flaky tests before merging.');
  process.exit(1);
}
