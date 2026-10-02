// scripts/check-conventions.js
// Checks the rules in CONTRIBUTING.md that a machine can check, so a reviewer doesn't have to.
// Run it from the e2e folder (or pass the folder): node scripts/check-conventions.js [folder]
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = process.argv[2] || '.';
const problems = [];

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full);
    return entry.name.endsWith('.ts') ? [full] : [];
  });
}

// 1. Lines that are never acceptable
const banned = [
  { pattern: /waitForTimeout\(/, rule: 'waitForTimeout: wait for a real signal instead' },
  { pattern: /waitForLoadState\(\s*['"]networkidle/, rule: 'networkidle: wait for a real signal instead' },
  { pattern: /\btest(\.describe)?\.only\(/, rule: '.only left in the suite' },
  { pattern: /\btest\.fixme\(/, rule: 'test.fixme hides a test: use test.fail() with a bug id, or fix it' },
];

// 2. A CSS selector, locator('...'), needs a comment saying why nothing better worked
const cssSelector = /\.locator\(\s*['"`](?!\.\.)/;
// A comment on the line, or in the three lines above it (one comment can explain a group of selectors)
const hasComment = (lines, i) => [lines[i], lines[i - 1], lines[i - 2], lines[i - 3]].some((l) => l && /\/\//.test(l));

for (const file of [...listFiles(path.join(root, 'tests')), ...listFiles(path.join(root, 'pages'))]) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const { pattern, rule } of banned) {
      if (pattern.test(line)) problems.push(`${file}:${i + 1}  ${rule}`);
    }
    if (cssSelector.test(line) && !hasComment(lines, i)) {
      problems.push(`${file}:${i + 1}  CSS selector without a comment saying why: ${line.trim()}`);
    }
  });
}

// 3. Every test carries a tag, and no title is just "test 14". The test list comes from Playwright itself.
const listed = JSON.parse(execSync('npx playwright test --list --reporter=json', { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 }));
(function walk(suite) {
  (suite.specs || []).forEach((spec) => {
    if (!spec.tags || spec.tags.length === 0) problems.push(`${spec.file}:${spec.line}  no tag: "${spec.title}"`);
    if (/^(test|spec)\s*\d+$/i.test(spec.title.trim())) problems.push(`${spec.file}:${spec.line}  title does not describe behaviour: "${spec.title}"`);
  });
  (suite.suites || []).forEach(walk);
})({ suites: listed.suites });

if (problems.length) {
  console.log(`${problems.length} convention problem(s):\n`);
  problems.forEach((p) => console.log('  ' + p));
  process.exit(1);
}
console.log('No convention problems found.');