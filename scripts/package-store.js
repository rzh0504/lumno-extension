const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const version = manifest.version;
const distDir = path.join(process.cwd(), 'dist');
const zipPath = path.join(distDir, `lumno-store-v${version}.zip`);
const packageRoots = [
  'manifest.json',
  'src',
  '_locales',
  'assets'
];
const injectedScriptFiles = [
  'src/background/extension-pages.js',
  'src/background/message-router.js',
  'src/background/newtab-fallback.js',
  'src/background/shortcut-rules.js',
  'src/background/pip-ownership.js',
  'src/background/pip-main-world.js',
  'src/shared/extension-routes.js',
  'src/shared/settings.js',
  'src/shared/search-utils.js',
  'src/shared/site-search-store.js',
  'src/shared/suggestion-navigation.js',
  'src/shared/search-input-ui.js',
  'src/shared/search-input-mode.js',
  'src/shared/search-input.css',
  'src/shared/url-guards.js',
  'src/newtab/suggestions-view.js',
  'src/overlay/runtime.js',
  'src/overlay/favicon-view.js',
  'src/overlay/shell.js',
  'src/overlay/lifecycle.js',
  'src/overlay/search-panel.js',
  'src/content/document-pip-picker.js'
];
const forbiddenPattern = /(^|\/)(\.git|\.github|\.vscode|README\.md|AGENTS\.md|\.DS_Store)$/;

fs.mkdirSync(distDir, { recursive: true });
if (fs.existsSync(zipPath)) {
  fs.rmSync(zipPath);
}

const zipArgs = ['-r', zipPath, ...packageRoots, '-x', '*.DS_Store'];
const zipResult = spawnSync('zip', zipArgs, {
  cwd: process.cwd(),
  stdio: 'inherit'
});
if (zipResult.status !== 0) {
  process.exit(zipResult.status || 1);
}

const listResult = spawnSync('zipinfo', ['-1', zipPath], {
  cwd: process.cwd(),
  encoding: 'utf8'
});
if (listResult.status !== 0) {
  console.error(listResult.stderr || 'zipinfo failed');
  process.exit(listResult.status || 1);
}

const entries = listResult.stdout.split(/\r?\n/).filter(Boolean);
const forbidden = entries.filter((entry) => forbiddenPattern.test(entry));
if (forbidden.length > 0) {
  console.error('Forbidden files in package:');
  forbidden.forEach((entry) => console.error(`- ${entry}`));
  process.exit(1);
}

const entrySet = new Set(entries);
const missing = [];
function checkManifestPath(value) {
  if (!value || typeof value !== 'string') {
    return;
  }
  if (/^(https?:|chrome:|__MSG_)/.test(value)) {
    return;
  }
  if (!entrySet.has(value)) {
    missing.push(value);
  }
}

function listJsFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listJsFiles(fullPath));
      return;
    }
    if (entry.isFile() && fullPath.endsWith('.js')) {
      files.push(fullPath);
    }
  });
  return files;
}

function listHtmlFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listHtmlFiles(fullPath));
      return;
    }
    if (entry.isFile() && fullPath.endsWith('.html')) {
      files.push(fullPath);
    }
  });
  return files;
}

function checkRuntimeGetUrlReferences() {
  const files = listJsFiles('src');
  const staticGetUrlPattern = /chrome\.runtime\.getURL\(\s*(['"`])([^'"`]+)\1\s*\)/g;
  files.forEach((file) => {
    const source = fs.readFileSync(file, 'utf8');
    let match = null;
    while ((match = staticGetUrlPattern.exec(source))) {
      const value = match[2];
      if (!value || value.includes('${')) {
        continue;
      }
      checkManifestPath(value.split(/[?#]/)[0]);
    }
  });
}

function checkHtmlReferences() {
  const files = listHtmlFiles('src');
  const referencePattern = /\b(?:src|href)=["']([^"']+)["']/g;
  files.forEach((file) => {
    const source = fs.readFileSync(file, 'utf8');
    let match = null;
    while ((match = referencePattern.exec(source))) {
      const value = match[1];
      if (!value || /^(https?:|data:|mailto:|tel:|#|__MSG_)/.test(value)) {
        continue;
      }
      const cleanValue = value.split(/[?#]/)[0];
      const resolved = path.normalize(path.join(path.dirname(file), cleanValue));
      checkManifestPath(resolved);
    }
  });
}

checkManifestPath(manifest.background && manifest.background.service_worker);
checkManifestPath(manifest.chrome_url_overrides && manifest.chrome_url_overrides.newtab);
checkManifestPath(manifest.options_ui && manifest.options_ui.page);
Object.values(manifest.icons || {}).forEach(checkManifestPath);
(manifest.content_scripts || []).forEach((script) => {
  (script.js || []).forEach(checkManifestPath);
  (script.css || []).forEach(checkManifestPath);
});
(manifest.web_accessible_resources || []).forEach((entry) => {
  (entry.resources || []).forEach(checkManifestPath);
});
injectedScriptFiles.forEach(checkManifestPath);
checkRuntimeGetUrlReferences();
checkHtmlReferences();
if (missing.length > 0) {
  console.error('Manifest resources missing from package:');
  missing.forEach((entry) => console.error(`- ${entry}`));
  process.exit(1);
}

console.log(`Created ${zipPath}`);
console.log(`Entries: ${entries.length}`);
