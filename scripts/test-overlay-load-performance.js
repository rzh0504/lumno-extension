const assert = require('assert');
const fs = require('fs');

const searchPanelSource = fs.readFileSync('src/overlay/search-panel.js', 'utf8');

assert.doesNotMatch(
  searchPanelSource,
  /void\s+\w+\.offsetHeight\s*;/,
  'overlay load path should avoid forced synchronous layout reads'
);

assert.doesNotMatch(
  searchPanelSource,
  /document\.querySelector\(/,
  'overlay theme detection should avoid document-wide selector scans on large pages'
);

assert.match(
  searchPanelSource,
  /overlayFrameTracker\.runEnterAnimation\(overlay,/,
  'overlay reveal should keep the existing double-RAF transition gate'
);

assert.match(
  searchPanelSource,
  /function setOverlayMountVisibility\([\s\S]*?style\.setProperty\('visibility', 'hidden', 'important'\)/,
  'overlay mount should hide the host before first paint so unstyled descendants cannot flash'
);

const hideBeforeAppendIndex = searchPanelSource.indexOf('setOverlayMountVisibility(overlayHost, true);');
const appendHostIndex = searchPanelSource.indexOf('document.body.appendChild(overlayHost);');
assert.ok(
  hideBeforeAppendIndex >= 0 && appendHostIndex >= 0 && hideBeforeAppendIndex < appendHostIndex,
  'overlay host should be hidden before it is appended to the page'
);

const revealStartIndex = searchPanelSource.indexOf('const revealOverlay = () => {');
const unhideInRevealIndex = searchPanelSource.indexOf('setOverlayMountVisibility(overlayHost, false);', revealStartIndex);
const animateInRevealIndex = searchPanelSource.indexOf('overlayFrameTracker.runEnterAnimation(overlay,', revealStartIndex);
assert.ok(
  revealStartIndex >= 0 &&
    unhideInRevealIndex > revealStartIndex &&
    animateInRevealIndex > unhideInRevealIndex,
  'overlay host should be unhidden only when the reveal animation is about to begin'
);

console.log('overlay load performance tests passed');
