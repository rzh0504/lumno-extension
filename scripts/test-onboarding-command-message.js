const assert = require('assert');
const fs = require('fs');
const path = require('path');

const script = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'onboarding', 'onboarding.js'),
  'utf8'
);

assert.match(
  script,
  /const ONBOARDING_SEARCH_OVERLAY_COMMAND_ACTION = 'triggerOnboardingSearchOverlayFromCommand';/,
  'onboarding should share the background action name for command-triggered overlay open'
);

assert.match(
  script,
  /function handleOnboardingCommandMessage\([\s\S]*?ONBOARDING_SEARCH_OVERLAY_COMMAND_ACTION[\s\S]*?triggerOnboardingSearchOverlay\(\)/,
  'onboarding should open the local overlay when background forwards the browser command shortcut'
);

assert.doesNotMatch(
  script,
  /panel\.id = '_x_extension_overlay_2024_unique_';/,
  'onboarding demo overlay should not reuse the live overlay panel id that shortcut toggling removes'
);

assert.match(
  script,
  /runtime\.onMessage\.addListener\(handleOnboardingCommandMessage\)/,
  'onboarding should register the background command message listener'
);

console.log('onboarding command message tests passed');
