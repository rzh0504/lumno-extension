const fs = require('fs');
const path = require('path');

const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const missing = [];
const injectedScriptFiles = [
  'src/background/pip-ownership.js',
  'src/shared/settings.js',
  'src/shared/url-guards.js',
  'src/overlay/input-ui.js',
  'src/overlay/shell.js',
  'src/overlay/lifecycle.js',
  'src/content/document-pip-picker.js'
];

function checkPath(value) {
  if (!value || typeof value !== 'string') {
    return;
  }
  if (/^(https?:|chrome:|__MSG_)/.test(value)) {
    return;
  }
  if (!fs.existsSync(value)) {
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
      checkPath(value.split(/[?#]/)[0]);
    }
  });
}

checkPath(manifest.background && manifest.background.service_worker);
checkPath(manifest.chrome_url_overrides && manifest.chrome_url_overrides.newtab);
checkPath(manifest.options_ui && manifest.options_ui.page);

Object.values(manifest.icons || {}).forEach(checkPath);
(manifest.content_scripts || []).forEach((script) => {
  (script.js || []).forEach(checkPath);
  (script.css || []).forEach(checkPath);
});
(manifest.web_accessible_resources || []).forEach((entry) => {
  (entry.resources || []).forEach(checkPath);
});
injectedScriptFiles.forEach(checkPath);
checkRuntimeGetUrlReferences();

if (missing.length > 0) {
  console.error('Missing manifest resources:');
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('manifest resources ok');
