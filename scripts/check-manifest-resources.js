const fs = require('fs');
const path = require('path');

const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const missing = [];
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
  'src/newtab/recent-sites-view.js',
  'src/newtab/bookmarks-view.js',
  'src/newtab/suggestions-view.js',
  'src/overlay/runtime.js',
  'src/overlay/favicon-view.js',
  'src/overlay/suggestions-view.css',
  'src/overlay/shell.js',
  'src/overlay/lifecycle.js',
  'src/overlay/search-panel.js',
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
      checkPath(value.split(/[?#]/)[0]);
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
      checkPath(resolved);
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
checkHtmlReferences();

if (missing.length > 0) {
  console.error('Missing manifest resources:');
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('manifest resources ok');
