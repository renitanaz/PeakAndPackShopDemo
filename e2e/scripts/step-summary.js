// Prints a Markdown summary of the run from results.json.
// CI appends it to the job's summary page: node scripts/step-summary.js >> $GITHUB_STEP_SUMMARY
const fs = require('fs');

const report = JSON.parse(fs.readFileSync('results.json', 'utf8'));
const tests = [];
(function walk(suite, file) {
  (suite.specs || []).forEach((spec) => {
    spec.tests.forEach((t) => tests.push({
      title: spec.title,
      file: spec.file,
      line: spec.line,
      tags: spec.tags || [],
      project: t.projectName,
      status: t.status,                       // expected | unexpected | flaky | skipped
      expectedStatus: t.expectedStatus,       // 'failed' for a test.fail() test
      error: ((t.results.at(-1) || {}).error || {}).message || '',
    }));
  });
  (suite.suites || []).forEach((s) => walk(s));
})({ suites: report.suites });

const strip = (s) => s.replace(/\u001b\[[0-9;]*m/g, '');
const knownBugs = tests.filter((t) => t.expectedStatus === 'failed');
const failures = tests.filter((t) => t.status === 'unexpected');
const flaky = tests.filter((t) => t.status === 'flaky');
const passed = tests.filter((t) => t.status === 'expected' && t.expectedStatus !== 'failed');
const skipped = tests.filter((t) => t.status === 'skipped');
const seconds = (report.stats.duration / 1000).toFixed(0);

const out = [];
out.push('## PeakAndPack end-to-end tests');
out.push('');
out.push('| Passed | Failed | Flaky | Known bugs still present | Skipped | Time |');
out.push('|---|---|---|---|---|---|');
out.push(`| ${passed.length} | ${failures.length} | ${flaky.length} | ${knownBugs.length} | ${skipped.length} | ${seconds}s |`);

if (failures.length) {
  out.push('', '### Failures');
  failures.forEach((t) => out.push(`- **${t.title}** (\`${t.file}:${t.line}\`)  \n  ${strip(t.error).split('\n')[0]}`));
}
if (flaky.length) {
  out.push('', '### Flaky: passed only on retry');
  flaky.forEach((t) => out.push(`- ${t.title} (\`${t.file}\`)`));
}
if (knownBugs.length) {
  out.push('', '### Known bugs the suite is tracking', '', 'These tests describe correct behaviour and are expected to fail. When one starts passing, the run fails so its `test.fail()` line can be removed.', '');
  knownBugs.forEach((t) => out.push(`- ${t.title}`));
}
console.log(out.join('\n'));
