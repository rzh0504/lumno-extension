const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.join(__dirname, '..');
const testFiles = fs.readdirSync(__dirname)
  .filter((file) => /^test-.*\.js$/.test(file))
  .sort();

let failures = 0;

testFiles.forEach((file) => {
  const relativePath = path.join('scripts', file);
  process.stdout.write(`\n[TEST] ${relativePath}\n`);
  const result = spawnSync(process.execPath, [relativePath], {
    cwd: repoRoot,
    stdio: 'inherit'
  });
  if (result.status !== 0) {
    failures += 1;
    process.stderr.write(`[FAIL] ${relativePath}\n`);
  }
});

if (failures > 0) {
  process.stderr.write(`\n${failures} test file(s) failed.\n`);
  process.exit(1);
}

process.stdout.write(`\nAll ${testFiles.length} test files passed.\n`);
