const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const overlayJs = fs.readFileSync(path.join(repoRoot, 'src/overlay/search-panel.js'), 'utf8');

assert.match(
  overlayJs,
  /OVERLAY_CONTEXT_TOKEN_KEY/,
  'overlay should keep a per-extension-context token for stale overlay detection'
);

assert.match(
  overlayJs,
  /data-lumno-overlay-context-token/,
  'overlay should persist the context token on the overlay DOM'
);

assert.match(
  overlayJs,
  /function getOverlayMountHost\(overlayElement\)[\s\S]*?getRootNode\(\)[\s\S]*?root\.host/,
  'overlay removal should find the shadow host even when old isolated-world expandos are gone'
);

assert.match(
  overlayJs,
  /function isStaleOverlay\(overlayElement\)[\s\S]*?getOverlayStoredContextToken\(overlayElement\)[\s\S]*?overlayContextToken/,
  'overlay should compare the stored token with the current extension context'
);

assert.match(
  overlayJs,
  /const shouldReplaceStaleOverlay = isStaleOverlay\(overlay\);[\s\S]*?removeOverlay\(overlay\);[\s\S]*?if \(!shouldReplaceStaleOverlay\) \{[\s\S]*?return;[\s\S]*?\}/,
  'stale overlay should be removed and recreated, while same-context overlay still toggles off'
);

console.log('overlay stale context tests passed');
