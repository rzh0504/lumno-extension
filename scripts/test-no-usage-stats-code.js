const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');

function repoPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(repoPath(relativePath), 'utf8');
}

function assertPathMissing(relativePath) {
  assert.ok(!fs.existsSync(repoPath(relativePath)), `${relativePath} should be removed`);
}

[
  'src/background/telemetry.js',
  'src/shared/telemetry-schema.js',
  'serverless/tencent-scf-telemetry-ingest',
  'docs/telemetry-plan.md',
  'scripts/test-telemetry-runtime.js',
  'scripts/test-telemetry-schema.js',
  'scripts/test-telemetry-ingest-sanitize.js',
  'scripts/test-options-telemetry-copy.js'
].forEach(assertPathMissing);

[
  'src/background/background.js',
  'src/options/options.html',
  'src/options/options.js',
  '_locales/en/messages.json',
  '_locales/ja/messages.json',
  '_locales/zh_CN/messages.json',
  '_locales/zh_TW/messages.json',
  'package.json'
].forEach((relativePath) => {
  assert.doesNotMatch(
    read(relativePath),
    /telemetry|core_telemetry|anonymous stats|匿名统计|匿名統計|匿名利用データ|匿名使用数据|匿名使用資料/i,
    `${relativePath} should not keep usage-statistics copy or runtime hooks`
  );
});

console.log('no usage statistics code tests passed');
