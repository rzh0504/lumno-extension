const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'onboarding', 'onboarding.html'),
  'utf8'
);
const script = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'onboarding', 'onboarding.js'),
  'utf8'
);
const content = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'onboarding', 'onboarding-content.js'),
  'utf8'
);
const bodyStyle = html.match(/\n\s*body\s*\{[\s\S]*?\n\s*\}/);
const visualPanelStyle = html.match(/\.visual-panel\s*\{[\s\S]*?\n\s*\}/);
const browserWindowStyle = html.match(/\.browser-window\s*\{[\s\S]*?\n\s*\}/);

assert.match(html, /data-onboarding-shell/, 'page should expose a stable onboarding shell root');
assert.match(html, /id="onboarding-copy-panel"/, 'left copy panel should have a stable mount point');
assert.match(html, /id="onboarding-interaction-slots"/, 'left interactions should have a stable mount point');
assert.match(html, /id="onboarding-visual-stage"/, 'right UI should render into a stable visual stage');
assert.match(html, /id="onboarding-cursor-layer"/, 'right UI should reserve a cursor animation layer');
assert.match(html, /id="onboarding-shortcut-label"/, 'page should expose a stable shortcut label target');
assert.match(
  html,
  /\.\.\/shared\/tooltip\.css/,
  'onboarding should load the shared Lumno tooltip stylesheet'
);
assert.match(
  html,
  /\.shortcut-keycap\s*\{[\s\S]*?min-width:\s*24px;[\s\S]*?height:\s*24px;[\s\S]*?border:\s*2px solid #000;[\s\S]*?box-shadow:\s*0 2px 0 var\(--shortcut-keycap-shadow\);[\s\S]*?\}/,
  'shortcut label should render as lighter simulated keycaps with a square minimum size'
);
assert.match(
  html,
  /\.shortcut-label\s*\{[\s\S]*?vertical-align:\s*middle;[\s\S]*?transform:\s*translateY\(-2px\);[\s\S]*?\}/,
  'shortcut label should align the simulated keycaps with the surrounding text'
);
assert.match(
  script,
  /function renderShortcutLabel\(/,
  'onboarding should render shortcut labels as keycap tokens inside body copy'
);
assert.match(html, /data-onboarding-prev/, 'shell should expose previous-page control');
assert.match(html, /data-onboarding-next/, 'shell should expose next-page control');
assert.doesNotMatch(
  bodyStyle ? bodyStyle[0] : '',
  /settings-bg-light-monet-newtab\.webp|url\(/,
  'onboarding page body should not use a wallpaper image background'
);
assert.doesNotMatch(
  html,
  /--page-bg-image|--page-bg-tint/,
  'onboarding page body should not keep wallpaper-specific background variables'
);
assert.match(
  html,
  /--page-bg-fill-top:[^;]+;[\s\S]*?--page-bg-fill-bottom:[^;]+;/,
  'onboarding page should define neutral background fill stops'
);
assert.match(
  html,
  /linear-gradient\(180deg,\s*var\(--page-bg-fill-top\)[\s\S]*?var\(--page-bg-fill-bottom\)\s*100%\)/,
  'onboarding page should use a quiet neutral fill instead of an image'
);
assert.match(
  visualPanelStyle ? visualPanelStyle[0] : '',
  /settings-bg-light-monet-newtab\.webp/,
  'right-side visual panel should keep the Monet wallpaper background'
);
assert.match(
  html,
  /\.interaction-slot\s*\{[\s\S]*?border:\s*0;[\s\S]*?background:\s*transparent;[\s\S]*?\}/,
  'auxiliary interaction rows should not render card borders or fills'
);
assert.match(
  html,
  /\.interaction-slots\s*\{[^}]*?gap:\s*12px;[^}]*?\}/,
  'auxiliary interaction rows should have more breathing room between rows'
);
assert.match(
  html,
  /\.copy-panel\s*\{[\s\S]*?grid-template-rows:\s*auto minmax\(0,\s*1fr\) auto;[\s\S]*?align-content:\s*stretch;[\s\S]*?\}/,
  'left copy panel should reserve a centered middle row and a bottom action row'
);
assert.match(
  html,
  /\.interaction-slots\s*\{[\s\S]*?width:\s*max-content;[\s\S]*?max-width:\s*100%;[\s\S]*?align-self:\s*center;[\s\S]*?justify-self:\s*start;[\s\S]*?\}/,
  'auxiliary interaction rows should stay vertically centered while aligning with the left copy edge'
);
assert.match(
  html,
  /\.interaction-slot\s*\{[\s\S]*?grid-template-columns:\s*18px minmax\(0,\s*1fr\);[\s\S]*?\}/,
  'auxiliary interaction rows should reserve a compact icon column before the text'
);
assert.match(
  html,
  /\.interaction-row-icon\s*\{[\s\S]*?color:\s*var\(--page-muted\);[\s\S]*?font-size:\s*16px;[\s\S]*?\}/,
  'auxiliary interaction row icons should stay inline and muted'
);
assert.match(
  html,
  /\.interaction-label\s*\{[\s\S]*?color:\s*var\(--page-muted\);[\s\S]*?font-weight:\s*400;[\s\S]*?\}/,
  'auxiliary interaction row text should be muted regular copy'
);
assert.match(
  html,
  /\.interaction-copy--with-info\s*\{[\s\S]*?display:\s*inline-flex;[\s\S]*?align-items:\s*center;[\s\S]*?gap:\s*4px;[\s\S]*?\}/,
  'interaction rows with info should keep the info affordance immediately after the row text'
);
assert.match(
  html,
  /\.interaction-info-button\s*\{[\s\S]*?width:\s*20px;[\s\S]*?height:\s*20px;[\s\S]*?border-radius:\s*999px;[\s\S]*?\}/,
  'compatibility info should render as a compact circular info affordance'
);
assert.match(
  html,
  /\.interaction-info-button:hover\s*\{[\s\S]*?color:\s*var\(--page-ink\);[\s\S]*?\}/,
  'compatibility info affordance should follow Lumno hover styling'
);
assert.doesNotMatch(
  html,
  /\.interaction-info-button:hover\s*\{[^}]*transform:\s*translateY\(-1px\);[^}]*\}/,
  'info affordances should not move upward on hover'
);
assert.doesNotMatch(
  html,
  /\.interaction-info-button\s*\{[^}]*transform 140ms ease;[^}]*\}/,
  'info affordance transitions should not include hover movement'
);
assert.match(
  html,
  /\.interaction-link-button\s*\{[\s\S]*?cursor:\s*pointer;[\s\S]*?text-decoration:\s*none;[\s\S]*?\}/,
  'interaction link affordances should look like info buttons while behaving as links'
);
assert.match(
  html,
  /\.browser-avatar-group\s*\{[\s\S]*?display:\s*inline-flex;[\s\S]*?vertical-align:\s*middle;[\s\S]*?\}/,
  'browser support tooltip should render browser avatars inline inside the floating surface'
);
assert.match(
  html,
  /\.browser-avatar\s*\{[\s\S]*?width:\s*22px;[\s\S]*?height:\s*22px;[\s\S]*?flex:\s*0 0 22px;[\s\S]*?border-radius:\s*999px;[\s\S]*?\}/,
  'browser avatars should stay compact'
);
assert.match(
  html,
  /\.browser-avatar-image\s*\{[\s\S]*?width:\s*100%;[\s\S]*?height:\s*100%;[\s\S]*?object-fit:\s*cover;[\s\S]*?\}/,
  'browser avatars should render image assets inside clipped circles'
);
assert.match(
  html,
  /\.browser-avatar-ellipsis\s*\{[\s\S]*?margin-left:\s*3px;[\s\S]*?font-size:\s*16px;[\s\S]*?\}/,
  'browser support tooltip should show a compact ellipsis after the avatars'
);
assert.match(
  script,
  /function createBrowserAvatarGroup\(/,
  'onboarding should render the browser row with a dedicated inline avatar group'
);
assert.match(
  script,
  /function createBrowserAvatar\(/,
  'onboarding should render each browser as a dedicated avatar element'
);
assert.match(
  script,
  /browser-avatar-image/,
  'browser avatar renderer should use image assets rather than inline browser paths'
);
assert.match(
  script,
  /browser-avatar--comet/,
  'browser avatar renderer should include Comet'
);
assert.match(
  script,
  /function createInteractionRowIcon\(/,
  'onboarding should render requested row icons with a dedicated helper'
);
assert.match(
  script,
  /function createInteractionInfoButton\(/,
  'onboarding should render compatibility row info affordance with a dedicated helper'
);
assert.match(
  script,
  /function createInteractionLinkButton\(/,
  'onboarding should render trust row GitHub affordance with a dedicated link helper'
);
assert.match(
  content,
  /icon:\s*'ri-github-fill'[\s\S]*?tooltip:\s*'以 GPL-3\.0 许可证开源，点击访问 GitHub 仓库'/,
  'trust row should use the filled Remix GitHub icon and precise GPL tooltip copy'
);
assert.match(
  script,
  /function showOnboardingInfoTooltip\(/,
  'onboarding should show shared Lumno tooltips for info affordances'
);
assert.match(
  script,
  /LumnoTooltip\.createController/,
  'onboarding should use the shared Lumno tooltip controller'
);
assert.match(
  script,
  /className:\s*'onboarding-info-tooltip'/,
  'onboarding info tooltips should declare a component class for local styling'
);
assert.match(
  html,
  /\.onboarding-info-tooltip\s+\._x_extension_tooltip_line_2026_unique_\s*\+\s*\._x_extension_tooltip_line_2026_unique_\s*\{[\s\S]*?margin-top:\s*6px;[\s\S]*?\}/,
  'onboarding info tooltip multiline content should add component-level spacing between lines'
);
assert.match(
  script,
  /copy\.appendChild\(createInteractionInfoButton\(slot\.infoTooltip,\s*slot\.browserAvatars\)\);/,
  'browser support row should pass avatar metadata into its info tooltip affordance'
);
assert.match(
  script,
  /copy\.appendChild\(createInteractionLinkButton\(slot\.linkButton\)\);/,
  'trust row should append the GitHub link affordance immediately after the row text'
);
assert.match(
  html,
  /\.onboarding-copy-actions\[data-visible="true"\]\s*\{[\s\S]*?display:\s*inline-flex;[\s\S]*?\}/,
  'slides with configured lower-left actions should reveal the action row'
);
assert.match(
  html,
  /class="onboarding-action-button onboarding-action-button--primary"[^>]*data-action="next"[\s\S]*?<span>快速上手<\/span>[\s\S]*?ri-arrow-right-line/,
  'initial primary lower-left action should start quick onboarding with a right arrow icon'
);
assert.match(
  html,
  /class="onboarding-action-button onboarding-action-button--secondary"[^>]*data-action="prev"[^>]*hidden[\s\S]*?<span>上一步<\/span>[\s\S]*?ri-arrow-left-line/,
  'initial secondary lower-left action should stay hidden until the second page config reveals the previous-step action'
);
assert.match(
  html,
  /class="onboarding-action-button onboarding-action-button--ghost"[^>]*data-action="openShortcuts"[^>]*hidden[\s\S]*?<span>快捷键<\/span>[\s\S]*?ri-external-link-line/,
  'shortcut action should render as a hidden ghost action until the second page reveals it'
);
assert.match(
  html,
  /\.onboarding-action-button\[hidden\]\s*\{[\s\S]*?display:\s*none;[\s\S]*?\}/,
  'hidden lower-left action buttons should not be re-shown by component display styles'
);
assert.match(
  html,
  /\.onboarding-copy-actions\s*\{[\s\S]*?width:\s*100%;[\s\S]*?\}/,
  'lower-left action row should span the copy panel so ghost actions can align right'
);
assert.match(
  html,
  /\.onboarding-action-button--ghost\s*\{[\s\S]*?margin-left:\s*auto;[\s\S]*?background:\s*transparent;[\s\S]*?box-shadow:\s*none;[\s\S]*?\}/,
  'shortcut action should use a right-aligned ghost button treatment'
);
assert.match(
  script,
  /function renderCopyActions\(slide\)[\s\S]*?renderActionButton\(primaryActionButton,\s*actions\.primary\)[\s\S]*?renderActionButton\(secondaryActionButton,\s*actions\.secondary\)[\s\S]*?renderActionButton\(ghostActionButton,\s*actions\.ghost\)/,
  'lower-left actions should be rendered from the active slide content model'
);
assert.doesNotMatch(
  html,
  /\[data-visual-visible="false"\]\s+\.onboarding-frame\s*\{[\s\S]*?grid-template-columns:\s*1fr;[\s\S]*?\}/,
  'slides without right-side illustrations should keep the two-column container and background'
);
assert.doesNotMatch(
  html,
  /\[data-visual-visible="false"\]\s+\.visual-panel\s*\{[\s\S]*?display:\s*none;[\s\S]*?\}/,
  'slides without right-side illustrations should keep the right visual panel visible'
);
assert.match(
  script,
  /openShortcuts:\s*'openExtensionShortcutsPage'/,
  'shortcut action should route to the Chrome extension keyboard shortcuts page'
);
assert.match(
  script,
  /createInteractionRowIcon\(slot\.icon\)/,
  'interaction slots should render the icon declared by the content model'
);
assert.match(
  script,
  /image\.src = src;/,
  'browser avatar renderer should assign browser image sources from content metadata'
);
assert.doesNotMatch(
  script,
  /BROWSER_ICON_BY_ID/,
  'browser avatar renderer should not keep the legacy inline SVG icon map'
);
assert.match(
  script,
  /image\.decoding = 'async';/,
  'browser avatar images should be decoded asynchronously'
);
assert.match(
  script,
  /image\.addEventListener\('error'/,
  'browser avatar images should retain a text fallback if an asset fails'
);
assert.match(
  content,
  /google-chrome-2022\.svg[\s\S]*microsoft-edge-2019\.svg[\s\S]*dia\.jpg[\s\S]*comet\.jpg/,
  'browser avatar assets should be declared by content metadata'
);
assert.doesNotMatch(
  html,
  /\.browser-avatar svg/,
  'browser avatar styles should not target legacy inline SVG icons'
);
assert.doesNotMatch(
  html,
  /conic-gradient\(#ea4335/,
  'browser avatars should use the provided logo assets rather than faux Chrome gradients'
);
assert.match(
  script,
  /aria-label', names\.length > 0 \? `\$\{names\.join\('、'\)\} 等` : ''/,
  'browser avatar group should expose a compact accessible browser-name label with an etc. hint'
);
assert.match(
  script,
  /ellipsis\.textContent = '…';/,
  'browser avatar group should append a visual ellipsis after the four logos'
);
assert.match(
  script,
  /infoTooltip\.type === 'browser-avatars'/,
  'browser support info tooltip should render avatar content instead of plain text'
);
assert.match(
  html,
  /\.onboarding-browser-tooltip\s*\{[\s\S]*?padding:\s*8px 10px;[\s\S]*?\}/,
  'browser support tooltip should have compact Lumno tooltip padding'
);
assert.match(
  html,
  /\.\.\/shared\/tooltip\.js[\s\S]*onboarding\.js/,
  'shared tooltip script should load before onboarding behavior'
);
assert.match(
  html,
  /--text-swap-dur:\s*200ms;/,
  'title rotator should install text-swap timing tokens'
);
assert.match(
  html,
  /--resize-dur:\s*300ms;/,
  'title rotator should install resize timing tokens'
);
assert.match(
  html,
  /\.t-resize\s*\{[\s\S]*?width\s+var\(--resize-dur\)\s+var\(--resize-ease\)[\s\S]*?will-change:\s*width,\s*height;[\s\S]*?\}/,
  'title rotator should use the resize transition hook for badge width changes'
);
assert.match(
  html,
  /\.t-text-swap\s*\{[\s\S]*?will-change:\s*transform,\s*filter,\s*opacity;[\s\S]*?\}/,
  'title rotator should use the text-swap transition hook'
);
assert.match(
  html,
  /\.title-rotator\s*\{[\s\S]*?border-radius:\s*8px;[\s\S]*?background:\s*var\(--title-rotator-bg\);[\s\S]*?\}/,
  'rotating title labels should render inside rectangular containers'
);
assert.match(
  html,
  /\.title-rotator\s*\{[\s\S]*?justify-content:\s*flex-start;[\s\S]*?width:\s*max-content;[\s\S]*?text-align:\s*left;[\s\S]*?\}/,
  'rotating title labels should hug their content and keep their left edge anchored'
);
assert.doesNotMatch(
  html,
  /width:\s*5\.62em;/,
  'rotating title labels should not reserve the longest badge width'
);
assert.doesNotMatch(
  html,
  /min-width:\s*2\.52em;/,
  'rotating title labels should not force a short-label minimum width on mobile'
);
assert.match(
  html,
  /\.title-rotator\[data-tone="bookmark"\]\s*\{[\s\S]*?--title-rotator-bg:\s*#fef3c7;[\s\S]*?--title-rotator-ink:\s*#d97706;[\s\S]*?\}/,
  'bookmark title label should use the existing Lumno bookmark yellow'
);
assert.match(
  html,
  /\.title-rotator\[data-tone="history"\]/,
  'history title label should have its own background tone'
);
assert.match(
  html,
  /\.title-rotator\[data-tone="top-sites"\]/,
  'top-sites title label should have its own background tone'
);
assert.match(
  html,
  /\.title-rotator\[data-tone="settings"\]/,
  'settings title label should have its own background tone'
);
assert.match(
  html,
  /\.title-line--with-logo\s*\{[\s\S]*?display:\s*inline-flex;[\s\S]*?align-items:\s*center;[\s\S]*?\}/,
  'title line with the Lumno logo should keep the text and logo aligned inline'
);
assert.match(
  html,
  /\.title-logo-mark\s*\{[\s\S]*?width:\s*1\.08em;[\s\S]*?height:\s*1\.08em;[\s\S]*?filter:\s*drop-shadow\(0 7px 8px rgba\(56,\s*172,\s*248,\s*0\.38\)\);[\s\S]*?transform:\s*rotate\(7deg\);[\s\S]*?\}/,
  'title logo should render larger with a compact blue shadow and right tilt'
);
assert.match(
  html,
  /\.title\.t-copy-swap,\s*\.body-copy\.t-copy-swap\s*\{[\s\S]*?filter:\s*blur\(0\);[\s\S]*?transition:[\s\S]*?transform var\(--text-swap-dur\) var\(--text-swap-ease\)[\s\S]*?filter var\(--text-swap-dur\) var\(--text-swap-ease\)[\s\S]*?opacity var\(--text-swap-dur\) var\(--text-swap-ease\)[\s\S]*?will-change:\s*transform,\s*filter,\s*opacity;[\s\S]*?\}/,
  'page title and subtitle should opt into the shared blurred text swap transition'
);
assert.match(
  html,
  /\.title\.t-copy-swap\.is-exit,\s*\.body-copy\.t-copy-swap\.is-exit\s*\{[\s\S]*?transform:\s*translateY\(calc\(var\(--text-swap-translate-y\) \* -1\)\);[\s\S]*?filter:\s*blur\(var\(--text-swap-blur\)\);[\s\S]*?opacity:\s*0;[\s\S]*?\}/,
  'page title and subtitle should blur upward while exiting'
);
assert.match(
  html,
  /\.title\.t-copy-swap\.is-enter-start,\s*\.body-copy\.t-copy-swap\.is-enter-start\s*\{[\s\S]*?transform:\s*translateY\(var\(--text-swap-translate-y\)\);[\s\S]*?filter:\s*blur\(var\(--text-swap-blur\)\);[\s\S]*?transition:\s*none;[\s\S]*?\}/,
  'page title and subtitle should enter from below with blur before settling'
);
assert.match(
  html,
  /@media \(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.t-copy-swap\s*\{\s*transition:\s*none !important;\s*\}/,
  'copy text swap animation should respect reduced motion preferences'
);
assert.match(
  html,
  /@media \(prefers-color-scheme:\s*dark\)\s*\{[\s\S]*?\.title-logo-mark\s*\{[\s\S]*?filter:\s*drop-shadow\(0 7px 9px rgba\(72,\s*184,\s*255,\s*0\.46\)\);[\s\S]*?\}/,
  'dark mode title logo shadow should stay color-tinted instead of neutral black'
);
assert.match(
  script,
  /TITLE_CYCLE_INTERVAL_MS/,
  'onboarding should define an automatic cadence for the title rotator'
);
assert.match(
  script,
  /function startTitleCycle\(/,
  'onboarding should start automatic title label rotation when the title renders'
);
assert.match(
  script,
  /function swapTitleCycleItem\(/,
  'onboarding should animate title label swaps vertically'
);
assert.match(
  script,
  /function measureTitleCycleWidth\(/,
  'onboarding should measure each badge label before resizing'
);
assert.match(
  script,
  /function setTitleCycleWidth\(/,
  'onboarding should set measured badge widths for resize transitions'
);
assert.match(
  script,
  /setTitleCycleWidth\(rotator,\s*item\.label\)/,
  'onboarding should resize the badge to the next label before swapping text'
);
assert.match(
  script,
  /function animateCopySwap\(nextState\)[\s\S]*?classList\.add\('t-copy-swap'\)[\s\S]*?classList\.add\('is-exit'\)[\s\S]*?commitState\(nextState\)[\s\S]*?classList\.add\('t-copy-swap',\s*'is-enter-start'\)/,
  'onboarding should animate page title and subtitle through a blurred swap when changing slides'
);
assert.match(
  script,
  /const nextState = MODEL\.reduceOnboardingState\(state,\s*action\);[\s\S]*?animateCopySwap\(nextState\);/,
  'slide dispatch should use the copy blur animation for real page changes'
);
assert.match(
  script,
  /rotator\.className = 'title-rotator t-resize';/,
  'title rotator should opt into the resize transition class'
);
assert.match(
  script,
  /function createTitleLogoMark\(/,
  'onboarding should create the trailing Lumno title logo with a dedicated helper'
);
assert.match(
  script,
  /logo\.className = 'title-logo-mark';[\s\S]*logo\.src = String\(titleLogo\.src \|\| ''\);/,
  'title logo helper should render the Lumno image asset'
);
assert.match(
  script,
  /appendTitleLine\(secondLine,\s*slide\.copy\.titleLogo\)/,
  'title cycle renderer should append the Lumno logo after the second title line'
);
assert.match(
  script,
  /data-title-rotator-text/,
  'onboarding should render a stable text node for the animated title label'
);
assert.match(
  script,
  /const LUMNO_OVERLAY_FAKE_RESULTS = Object\.freeze/,
  'right-side onboarding visual should declare fake Lumno overlay result data'
);
assert.match(
  script,
  /type:\s*'topSite'[\s\S]*type:\s*'bookmark'[\s\S]*type:\s*'history'/,
  'fake overlay results should mirror actual search suggestion types'
);
assert.doesNotMatch(
  script,
  /默认搜索引擎|tone:\s*'settings'/,
  'fake overlay results should not include non-query settings filler'
);
assert.match(
  script,
  /function createLumnoOverlaySurface\(/,
  'right-side onboarding visual should build a Lumno overlay surface from DOM pieces'
);
assert.match(
  script,
  /createLumnoOverlayResult\(/,
  'right-side onboarding visual should render individual fake overlay result rows'
);
assert.match(
  script,
  /function createLumnoOverlayFavicon\(/,
  'right-side onboarding visual should use favicon-style icons like real overlay suggestions'
);
assert.match(
  script,
  /function appendHighlightedQueryText\(/,
  'right-side onboarding visual should highlight the entered query inside result titles'
);
assert.match(
  script,
  /textWrapper\.appendChild\(detailNode\);[\s\S]*textWrapper\.appendChild\(sourceTag\);/,
  'right-side onboarding visual should render URL or bookmark path before the source tag'
);
assert.match(
  script,
  /actionTags\.dataset\.visible = result\.active && result\.actionTagLabel \? 'true' : 'false';/,
  'right-side onboarding visual should show keyboard action tags only for the active row'
);
assert.match(
  script,
  /visitButton\.className = 'x-ov-suggestion-action-button x-ov-suggestion-visit-button';[\s\S]*visitButton\.dataset\.visible = result\.active && result\.actionTagLabel \? 'false' : 'true';/,
  'right-side onboarding visual should keep the real overlay visit button state for inactive rows'
);
assert.match(
  script,
  /x-ov-history-delete-slot/,
  'history-like fake rows should preserve the real overlay history delete slot'
);
assert.match(
  script,
  /visualStage\.appendChild\(createBookmarkFocusSurface\(\)\);/,
  'bookmark-focus visual should mount the composed browser and Lumno overlay demo'
);
assert.match(
  html,
  /\.\.\/shared\/search-input\.css[\s\S]*\.\.\/overlay\/suggestions-view\.css/,
  'onboarding should load the same search input and overlay suggestion styles used by the plugin overlay'
);
assert.match(
  html,
  /\.lumno-overlay-panel\s*\{[\s\S]*?background:\s*var\(--x-ov-bg,\s*rgba\(255,\s*255,\s*255,\s*0\.95\)\);[\s\S]*?backdrop-filter:\s*blur\(var\(--x-ov-blur,\s*24px\)\)\s*saturate\(var\(--x-ov-saturate,\s*165%\)\);[\s\S]*?border-radius:\s*28px;[\s\S]*?box-shadow:\s*var\(--x-ov-shadow,[\s\S]*?\);[\s\S]*?\}/,
  'right-side Lumno overlay demo should reuse the plugin overlay shell surface style'
);
assert.match(
  html,
  /\.lumno-overlay-panel[\s\S]*onboarding-overlay-enter/,
  'right-side Lumno overlay demo should include an entrance animation'
);
assert.match(
  html,
  /\.lumno-overlay-query-caret[\s\S]*onboarding-caret-blink/,
  'right-side Lumno overlay demo should include a simulated text cursor animation'
);
assert.match(
  html,
  /\.visual-stage\s*\{[\s\S]*?overflow:\s*visible;[\s\S]*?\}/,
  'right-side visual stage should not clip overlay shadows'
);
assert.match(
  browserWindowStyle ? browserWindowStyle[0] : '',
  /left:\s*1%;[\s\S]*?top:\s*3%;[\s\S]*?width:\s*176%;[\s\S]*?height:\s*162%;/,
  'browser skeleton should be oversized and show only its upper-left portion inside the visual container'
);
assert.doesNotMatch(
  browserWindowStyle ? browserWindowStyle[0] : '',
  /inset:/,
  'oversized browser skeleton should use explicit left/top/width/height rather than inset filling the panel'
);
assert.match(
  browserWindowStyle ? browserWindowStyle[0] : '',
  /border:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.9\);[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*0\.42\);/,
  'browser skeleton should use a lighter translucent fill with an emphasized white outline'
);
assert.match(
  browserWindowStyle ? browserWindowStyle[0] : '',
  /box-shadow:[\s\S]*?inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.8\)/,
  'browser skeleton should keep airy inner white edge lighting instead of a solid card treatment'
);
assert.match(
  html,
  /\.lumno-overlay-panel\s*\{[\s\S]*?--onboarding-overlay-scale:\s*0\.9;[\s\S]*?\}/,
  'Lumno overlay demo should declare a smaller visual scale'
);
assert.match(
  html,
  /\.lumno-overlay-panel\s*\{[\s\S]*?width:\s*min\(680px,\s*calc\(100% - 56px\)\);[\s\S]*?\}/,
  'Lumno overlay demo should be scaled down and contained within the right visual panel'
);
assert.match(
  html,
  /\.browser-bar\s*\{[\s\S]*?grid-template-columns:\s*auto minmax\(88px,\s*0\.34fr\) minmax\(0,\s*1fr\) auto;[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*0\.72\);[\s\S]*?\}/,
  'browser skeleton top chrome should be clearer and structured like a normal webpage window'
);
assert.match(
  html,
  /\.browser-address\s*\{[\s\S]*?background:\s*rgba\(15,\s*23,\s*42,\s*0\.08\);[\s\S]*?\}/,
  'browser address bar should use a visible neutral skeleton fill instead of blending into the wallpaper'
);
assert.match(
  html,
  /\.browser-window \.surface-rail-dot\s*\{[\s\S]*?width:\s*14px;[\s\S]*?height:\s*14px;[\s\S]*?border:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.62\);[\s\S]*?background:\s*rgba\(15,\s*23,\s*42,\s*0\.16\);[\s\S]*?\}/,
  'mock macOS window dots should be large enough to read as window controls'
);
assert.match(
  html,
  /\.browser-page-line\s*\{[\s\S]*?background:\s*rgba\(15,\s*23,\s*42,\s*0\.055\);[\s\S]*?\}/,
  'webpage content skeleton should be neutral grayscale and readable'
);
assert.match(
  html,
  /\.browser-page-skeleton\s*\{[\s\S]*?display:\s*grid;[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(120px,\s*0\.34fr\);[\s\S]*?\}/,
  'browser illustration should render a neutral webpage skeleton larger than the overlay'
);
assert.doesNotMatch(
  script,
  /bookmarkGrid|bookmark-tile|bookmark-mark/,
  'browser illustration should no longer render colored bookmark tiles'
);
assert.match(
  script,
  /className = 'browser-page-skeleton'/,
  'bookmark-focus visual should build a normal webpage skeleton behind the overlay'
);
assert.match(
  html,
  /\.demo-cursor\s*\{[\s\S]*?width:\s*40px;[\s\S]*?height:\s*48px;[\s\S]*?transform:\s*rotate\(-6deg\);[\s\S]*?drop-shadow\(0 12px 16px rgba\(15,\s*23,\s*42,\s*0\.24\)\);[\s\S]*?\}/,
  'animated cursor should use a Figma-like pointer scale without excessive rotation'
);
assert.match(
  script,
  /function createDemoCursorSvg\([\s\S]*?C7\.0 5\.0[\s\S]*?figma-cursor__fill[\s\S]*?stroke-width',\s*'3'[\s\S]*?#303030/,
  'animated cursor should render a less-offset curved black fill with a real rounded black stroke'
);
assert.match(
  html,
  /@keyframes onboarding-cursor-drift[\s\S]*?translate3d\(-16px,\s*14px,\s*0\) rotate\(-6deg\)[\s\S]*?translate3d\(10px,\s*-8px,\s*0\) rotate\(-6deg\)/,
  'animated cursor drift should be subtle enough not to make the cursor shape feel displaced'
);
assert.match(
  html,
  /@keyframes onboarding-overlay-enter[\s\S]*?scale\(var\(--onboarding-overlay-enter-scale,\s*0\.985\)\)[\s\S]*?scale\(var\(--onboarding-overlay-scale,\s*1\)\)/,
  'overlay entrance animation should preserve the smaller final scale'
);
assert.match(
  script,
  /const LUMNO_OVERLAY_QUERY = 'extension';/,
  'overlay demo should use a common keyword that can naturally show extension/browser-page results'
);
assert.match(
  script,
  /type:\s*'topSite'[\s\S]*?sourceTag:\s*'常用'[\s\S]*?type:\s*'bookmark'[\s\S]*?sourceTag:\s*'书签'[\s\S]*?type:\s*'history'[\s\S]*?sourceTag:\s*'历史'[\s\S]*?type:\s*'newtab'[\s\S]*?visitButtonLabel:\s*'搜索'[\s\S]*?type:\s*'browserPage'[\s\S]*?chrome:\/\/extensions\//,
  'fake overlay results should match the real search order: top site, bookmark, history, Google search, browser-page command'
);
assert.doesNotMatch(
  script,
  /Lumno 工作台|Lumno Roadmap|Release \| Lumno|lumno\.kubai|kubai087\/lumno-extension/,
  'fake search result data should not use Lumno-specific examples'
);
assert.match(
  script,
  /rightIcon\.appendChild\(createIcon\('ri-settings-line'\)\);/,
  'overlay input right icon should match the real settings icon'
);
assert.match(
  script,
  /closeOtherTabsButton\.className = 'x-ov-close-other-tabs';[\s\S]*?ri-brush-2-line/,
  'overlay input should include the real close-other-tabs brush action button'
);
assert.match(
  script,
  /modeBadge\.dataset\.visible = 'false';/,
  'normal keyword search state should keep the mode badge hidden'
);
assert.doesNotMatch(script, /const iconWrap = document\.createElement\('span'\);/, 'auxiliary interaction rows should not create legacy card icons');
assert.doesNotMatch(html, /class="brand"/, 'onboarding shell should not show the extension logo header');
assert.doesNotMatch(html, /lumno\.png/, 'onboarding shell should not render the extension logo image');
assert.doesNotMatch(html, /data-onboarding-release/, 'onboarding shell should stay separate from release flow');
assert.doesNotMatch(html, /id="onboarding-steps"/, 'old checklist layout should not remain');
assert.doesNotMatch(html, /id="onboarding-features"/, 'old feature-card layout should not remain');

console.log('onboarding shell tests passed');
