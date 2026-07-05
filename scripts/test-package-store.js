const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, 'manifest.json'), 'utf8'));
const zipPath = path.join(repoRoot, 'dist', `lumno-store-v${manifest.version}.zip`);

execFileSync(process.execPath, ['scripts/package-store.js'], {
  cwd: repoRoot,
  stdio: 'pipe'
});

const entries = execFileSync('zipinfo', ['-1', zipPath], {
  cwd: repoRoot,
  encoding: 'utf8'
}).split(/\r?\n/).filter(Boolean);

assert(
  entries.every((entry) => !entry.startsWith('assets/images/readme/')),
  'store package should not include README-only images'
);

console.log('package store tests passed');
