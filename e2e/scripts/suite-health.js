// scripts/suite-health.js
// Turns results.json into the three numbers that matter: flake rate per test, runtime and its trend,
// and coverage of the journeys you list in journeys.json.
//   node scripts/suite-health.js [folder] [--record]
// --record adds this run to health-history.json, which is how a trend (and a per-test flake count) exists.
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const record = args.includes('--record');
const dir = args.find((a) => !a.startsWith('--')) || '.';

const report = JSON.parse(fs.readFileSync(path.join(dir, 'results.json'), 'utf8'));
const tests = [];
(function walk(suite) {
  (suite.specs || []).forEach((spec) => spec.tests.forEach((t) => tests.push({
    key: `${spec.file} > ${spec.title} [${t.projectName}]`,
    file: spec.file,
    title: spec.title,
    tags: spec.tags || [],
    status: t.status,                       // expected | unexpected | flaky | skipped
    knownBug: t.expectedStatus === 'failed',
    ms: (t.results[t.results.length - 1] || {}).duration || 0,
  })));
  (suite.suites || []).forEach(walk);
})({ suites: report.suites });

// ---- history
const historyFile = path.join(dir, 'health-history.json');
const history = fs.existsSync(historyFile) ? JSON.parse(fs.readFileSync(historyFile, 'utf8')) : [];
const thisRun = {
  date: new Date().toISOString().slice(0, 16).replace('T', ' '),
  seconds: Math.round(report.stats.duration / 1000),
  tests: Object.fromEntries(tests.map((t) => [t.key, t.status])),
};
if (record) fs.writeFileSync(historyFile, JSON.stringify([...history, thisRun], null, 1));
const runs = record ? [...history, thisRun] : history.length ? history : [thisRun];

// ---- numbers
const count = (f) => tests.filter(f).length;
const passed = count((t) => t.status === 'expected' && !t.knownBug);
const flaky = count((t) => t.status === 'flaky');
const failed = count((t) => t.status === 'unexpected');
const knownBugs = count((t) => t.knownBug);

const out = [];
out.push(`# Suite health, ${thisRun.date}`, '');
out.push(`${tests.length} tests: ${passed} passed, ${failed} failed, ${flaky} flaky, ${knownBugs} known bugs still present.`, '');

// Flake rate per test: how often each test needed a retry, or failed one run and passed another
const flakeCount = {};
runs.forEach((run) => Object.entries(run.tests).forEach(([key, status]) => { if (status === 'flaky') flakeCount[key] = (flakeCount[key] || 0) + 1; }));
const statuses = {};
runs.forEach((run) => Object.entries(run.tests).forEach(([key, status]) => { (statuses[key] = statuses[key] || new Set()).add(status === 'unexpected' ? 'fail' : status === 'flaky' ? 'flaky' : 'pass'); }));
Object.entries(statuses).forEach(([key, set]) => { if (set.has('fail') && set.has('pass')) flakeCount[key] = Math.max(flakeCount[key] || 0, 1); });
const offenders = Object.entries(flakeCount).sort((a, b) => b[1] - a[1]);
out.push(`## Flake rate (over ${runs.length} run${runs.length === 1 ? '' : 's'})`, '');
if (offenders.length === 0) out.push('No test was flaky in any recorded run.', '');
else {
  out.push('| Test | Runs where it was flaky |', '|---|---|');
  offenders.forEach(([key, n]) => out.push(`| ${key} | ${n} of ${runs.length} |`));
  out.push('');
}

// Runtime and its trend
out.push('## Runtime', '');
out.push('| Run | Tests | Seconds |', '|---|---|---|');
runs.slice(-6).forEach((run) => out.push(`| ${run.date} | ${Object.keys(run.tests).length} | ${run.seconds} |`));
if (runs.length >= 2) {
  const change = runs[runs.length - 1].seconds - runs[0].seconds;
  out.push('', `Since the first recorded run: ${change >= 0 ? '+' : ''}${change} seconds.`);
}
out.push('', 'Slowest tests this run:', '');
[...tests].sort((a, b) => b.ms - a.ms).slice(0, 5).forEach((t) => out.push(`- ${(t.ms / 1000).toFixed(1)} s  ${t.title}`));
out.push('');

// Coverage by journey, from journeys.json: a journey is covered by a passing test that is not a known bug
const journeysFile = path.join(dir, 'journeys.json');
if (fs.existsSync(journeysFile)) {
  const journeys = JSON.parse(fs.readFileSync(journeysFile, 'utf8'));
  out.push('## Coverage by user journey', '', '| Journey | Passing tests | |', '|---|---|---|');
  journeys.forEach(({ journey, files }) => {
    const n = count((t) => t.status === 'expected' && !t.knownBug && files.some((f) => t.file.replace(/\\/g, '/').includes(f)));
    out.push(`| ${journey} | ${n} | ${n === 0 ? 'NOT COVERED' : ''} |`);
  });
  out.push('');
}

// Tags
const tagCounts = {};
tests.forEach((t) => t.tags.forEach((tag) => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; }));
out.push('## Tests by tag', '', Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(([tag, n]) => `${tag}: ${n}`).join(', '), '');

console.log(out.join('\n'));