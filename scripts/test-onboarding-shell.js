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
const lumnoWebWordmarkAsset = fs.readFileSync(
  path.join(__dirname, '..', 'assets', 'images', 'lumno-web-textlogo.svg'),
  'utf8'
);
const bodyStyle = html.match(/\n\s*body\s*\{[\s\S]*?\n\s*\}/);
const copyPanelStyle = html.match(/\.copy-panel\s*\{[\s\S]*?\n\s*\}/);
const newtabWatermarkStyle = html.match(/\.onboarding-newtab-watermark\s*\{[\s\S]*?\n\s*\}/);
const newtabWatermarkSolidStyle = html.match(/\.onboarding-newtab-watermark__solid\s*\{[\s\S]*?\n\s*\}/);
const visualPanelSlotStyle = html.match(/\.visual-panel-slot\s*\{[\s\S]*?\n\s*\}/);
const visualPanelStyle = html.match(/\.visual-panel\s*\{[\s\S]*?\n\s*\}/);
const newtabPreviewBrowserBackdropStyle = html.match(/\.browser-window\.newtab-preview-browser-backdrop\s*\{[\s\S]*?\n\s*\}/);
const newtabPreviewBrowserForegroundStyle = html.match(/\.newtab-preview-browser-foreground\s*\{[\s\S]*?\n\s*\}/);
const newtabPreviewBrowserPageBeforeStyle = html.match(/\.newtab-preview-browser-page::before\s*\{[\s\S]*?\n\s*\}/);
const visualCanvasStyle = html.match(/\.visual-canvas\s*\{[\s\S]*?\n\s*\}/);
const browserWindowStyle = html.match(/\.browser-window\s*\{[\s\S]*?\n\s*\}/);

assert.match(html, /data-onboarding-shell/, 'page should expose a stable onboarding shell root');
assert.match(html, /id="onboarding-copy-panel"/, 'left copy panel should have a stable mount point');
assert.match(html, /id="onboarding-page-strip"/, 'left copy panel should expose an in-panel page strip from the second slide onward');
assert.match(html, /id="onboarding-interaction-slots"/, 'left interactions should have a stable mount point');
assert.match(html, /id="onboarding-visual-slot"/, 'right UI should expose a stable visual grid-slot wrapper');
assert.match(html, /id="onboarding-visual-panel"/, 'right UI should expose a stable fixed-ratio visual panel');
assert.match(html, /id="onboarding-visual-stage"/, 'right UI should render into a stable visual stage');
assert.match(html, /id="onboarding-visual-canvas"/, 'right UI should wrap illustration and cursor layers in a fixed-ratio canvas');
assert.match(html, /id="onboarding-cursor-layer"/, 'right UI should reserve a cursor animation layer');
assert.match(html, /data-cursor-mode="intro"/, 'right UI cursor layer should boot in the cover-page logo wander mode');
assert.match(html, /id="onboarding-shortcut-label"/, 'page should expose a stable shortcut label target');
assert.match(html, /id="onboarding-body-note"/, 'page should expose a stable body note target below the shortcut subtitle');
assert.match(
  html,
  /class="onboarding-newtab-watermark" aria-hidden="true"[\s\S]*?class="onboarding-newtab-watermark__solid"[\s\S]*?src="\.\.\/\.\.\/assets\/images\/lumno-wordmark\.svg"/,
  'intro copy panel should render the newtab wordmark watermark in the top-left blank area'
);
assert.match(
  copyPanelStyle ? copyPanelStyle[0] : '',
  /--onboarding-copy-padding-x:\s*56px;[\s\S]*?--onboarding-copy-padding-y:\s*56px;[\s\S]*?position:\s*relative;[\s\S]*?padding:\s*var\(--onboarding-copy-padding-y\) var\(--onboarding-copy-padding-x\);/,
  'copy panel should expose padding variables so the absolute watermark aligns with the copy inset'
);
assert.match(
  newtabWatermarkStyle ? newtabWatermarkStyle[0] : '',
  /position:\s*absolute;[\s\S]*?left:\s*var\(--onboarding-copy-padding-x\);[\s\S]*?top:\s*var\(--onboarding-copy-padding-y\);[\s\S]*?width:\s*118px;[\s\S]*?height:\s*27px;[\s\S]*?pointer-events:\s*none;[\s\S]*?transform:\s*translateY\(12px\);/,
  'newtab watermark should sit smaller and closer to the title without adding layout height or stealing input'
);
assert.match(
  newtabWatermarkSolidStyle ? newtabWatermarkSolidStyle[0] : '',
  /-webkit-mask:\s*url\("\.\.\/\.\.\/assets\/images\/lumno-wordmark-mask\.svg"\) center \/ contain no-repeat;[\s\S]*?mask:\s*url\("\.\.\/\.\.\/assets\/images\/lumno-wordmark-mask\.svg"\) center \/ contain no-repeat;/,
  'newtab watermark should reuse the newtab solid-mask wordmark treatment for adaptive ink'
);
assert.match(
  html,
  /\.onboarding-shell:not\(\[data-active-slide="intro"\]\)\s+\.onboarding-newtab-watermark\s*\{[\s\S]*?display:\s*none;[\s\S]*?\}/,
  'newtab watermark should only appear on the intro slide and leave later page-strip slides clean'
);
assert.match(
  html,
  /\.onboarding-shell\s*\{[\s\S]*?--onboarding-shell-padding-x:\s*clamp\(16px,\s*3\.4vw,\s*42px\);[\s\S]*?--onboarding-visual-max-width:\s*704px;[\s\S]*?--onboarding-visual-ratio:\s*704 \/ 680;[\s\S]*?width:\s*100vw;[\s\S]*?height:\s*100vh;[\s\S]*?height:\s*100dvh;[\s\S]*?place-items:\s*center;[\s\S]*?overflow:\s*auto;[\s\S]*?\}/,
  'onboarding shell should center a responsive frame while constraining the right visual ratio'
);
assert.match(
  html,
  /\.onboarding-shell\s*\{[\s\S]*?--onboarding-shell-lift-y:\s*clamp\(14px,\s*2\.4vh,\s*24px\);[\s\S]*?padding:\s*max\(16px,\s*calc\(var\(--onboarding-shell-padding-y\) - var\(--onboarding-shell-lift-y\)\)\)\s+var\(--onboarding-shell-padding-x\)\s+calc\(var\(--onboarding-shell-padding-y\) \+ var\(--onboarding-shell-lift-y\)\);[\s\S]*?\}/,
  'onboarding shell should bias desktop content slightly upward with balanced responsive padding'
);
assert.match(
  html,
  /@media \(max-height:\s*620px\) and \(min-width:\s*901px\)[\s\S]*?\.onboarding-shell\s*\{[\s\S]*?--onboarding-shell-lift-y:\s*0px;[\s\S]*?\}/,
  'short desktop onboarding layouts should disable the upward lift to avoid clipping'
);
assert.match(
  html,
  /@media \(max-width:\s*900px\)[\s\S]*?\.onboarding-shell\s*\{[\s\S]*?--onboarding-shell-lift-y:\s*0px;[\s\S]*?place-items:\s*start center;[\s\S]*?\}/,
  'stacked onboarding layouts should start at the top without an extra upward lift'
);
assert.match(
  html,
  /\.onboarding-shell\s*\{[\s\S]*?--onboarding-visual-canvas-width:\s*704px;[\s\S]*?--onboarding-visual-canvas-height:\s*680px;[\s\S]*?--onboarding-visual-scale:\s*1;[\s\S]*?--onboarding-visual-rendered-width:\s*var\(--onboarding-visual-canvas-width\);[\s\S]*?\}/,
  'right-side visuals should define a fixed design panel whose rendered size and scale can be updated independently'
);
assert.match(
  html,
  /\.onboarding-frame\s*\{[\s\S]*?position:\s*relative;[\s\S]*?width:\s*min\(1240px,\s*100%\);[\s\S]*?height:\s*min\(680px,\s*100%\);[\s\S]*?max-height:\s*680px;[\s\S]*?border:\s*0;[\s\S]*?overflow:\s*clip;[\s\S]*?grid-template-columns:\s*minmax\(340px,\s*1fr\) minmax\(var\(--onboarding-visual-min-width\),\s*var\(--onboarding-visual-max-width\)\);[\s\S]*?grid-template-rows:\s*minmax\(0,\s*1fr\);[\s\S]*?\}/,
  'onboarding frame should avoid hard edge borders while giving the fixed-ratio visual panel a bounded row'
);
assert.match(
  html,
  /@media \(max-width:\s*900px\)[\s\S]*?\.onboarding-frame\s*\{[\s\S]*?grid-template-columns:\s*1fr;[\s\S]*?grid-template-rows:\s*auto auto;[\s\S]*?\}[\s\S]*?\.visual-panel-slot\s*\{[\s\S]*?height:\s*auto;[\s\S]*?\}/,
  'narrow onboarding layouts should stack copy and the fixed-ratio visual panel vertically'
);
assert.match(
  html,
  /@media \(max-width:\s*900px\)[\s\S]*?\.onboarding-shell\s*\{[\s\S]*?--onboarding-stacked-copy-min-height:\s*588px;[\s\S]*?\}[\s\S]*?\.copy-panel\s*\{[\s\S]*?min-height:\s*var\(--onboarding-stacked-copy-min-height\);[\s\S]*?\}/,
  'stacked onboarding layouts should reserve a consistent left copy height based on the tallest normal stacked slide'
);
assert.match(
  html,
  /@media \(max-width:\s*380px\)[\s\S]*?\.onboarding-shell\s*\{[\s\S]*?--onboarding-stacked-copy-min-height:\s*638px;[\s\S]*?\}/,
  'small phone stacked layouts should reserve enough left copy height for wrapped actions'
);
assert.match(
  html,
  /@media \(max-width:\s*340px\)[\s\S]*?\.onboarding-shell\s*\{[\s\S]*?--onboarding-stacked-copy-min-height:\s*660px;[\s\S]*?\}/,
  'extra narrow stacked layouts should keep the left copy height consistent after longer labels wrap'
);
assert.match(
  html,
  /\.\.\/shared\/tooltip\.css/,
  'onboarding should load the shared Lumno tooltip stylesheet'
);
[
  '../shared/settings.js',
  '../shared/search-utils.js',
  '../shared/site-search-store.js',
  '../shared/suggestion-action-model.js',
  '../shared/suggestion-navigation.js',
  '../shared/search-input-ui.js',
  '../shared/search-input-mode.js',
  '../overlay/runtime.js',
  '../overlay/search-panel.js'
].forEach((dependencyPath) => {
  assert.match(
    html,
    new RegExp(`<script src="${dependencyPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`),
    `onboarding should load ${dependencyPath} so the real search overlay can mount locally`
  );
});
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
assert.match(
  script,
  /function triggerOnboardingSearchOverlay\(/,
  'onboarding should expose a local handler that opens the real search overlay from the configured shortcut'
);
assert.match(
  script,
  /shortcutHotkeyMatchesEvent\(currentShortcutValue,\s*event\)/,
  'onboarding should match keydown events against the browser-configured command shortcut'
);
assert.match(
  script,
  /function showActionButtonTooltip\(button\)/,
  'onboarding should show shared hover tooltips for configured action buttons'
);
assert.match(
  script,
  /const maxWidth = getActionButtonTooltipMaxWidth\(button\);[\s\S]*?actionTooltipController\.show\(button,\s*text,\s*\{[\s\S]*?placement:\s*'top'[\s\S]*?maxWidth,[\s\S]*?\}\)/,
  'action button tooltip should read max width from button attributes before showing the shared tooltip'
);
assert.match(
  script,
  /button\.dataset\.tooltip = tooltip;/,
  'rendered action buttons should receive data-tooltip text for the shared tooltip'
);
assert.match(
  script,
  /button\.dataset\.tooltipMaxWidth = String\(tooltipMaxWidth\);/,
  'rendered action buttons should receive data-tooltip-max-width when configured'
);
assert.match(
  script,
  /button\.removeAttribute\('data-tooltip'\);/,
  'action buttons without tooltip copy should not keep stale tooltip attributes'
);
assert.match(
  script,
  /button\.removeAttribute\('data-tooltip-max-width'\);/,
  'action buttons without configured tooltip width should not keep stale max-width attributes'
);
assert.match(
  script,
  /let expandedInteractionAccordionId = '';/,
  'onboarding should track which shared accordion row is expanded'
);
assert.match(
  script,
  /function createInteractionAccordionPanel\(slot,\s*isExpanded\)/,
  'onboarding should render expandable accordion panels for interaction rows'
);
assert.match(
  script,
  /function createInteractionAccordionChevron\(accordion\)/,
  'accordion rows should render their chevron as a shared trailing affordance'
);
assert.match(
  script,
  /function createInteractionAccordionTrigger\(slot\)[\s\S]*?trigger\.appendChild\(createInteractionLabel\(slot\)\);[\s\S]*?trigger\.appendChild\(createInteractionAccordionChevron\(slot\.accordion\)\);/,
  'accordion rows should keep the text and chevron in the same clickable trigger area'
);
assert.match(
  script,
  /trigger\.type = 'button';[\s\S]*?trigger\.dataset\.action = slot\.actionId;[\s\S]*?trigger\.dataset\.accordionId = getInteractionAccordionId\(slot\);[\s\S]*?trigger\.setAttribute\('aria-expanded', isExpanded \? 'true' : 'false'\);/,
  'accordion rows should put action and aria-expanded on the title trigger rather than the text panel'
);
assert.match(
  script,
  /if \(id === 'toggleInteractionAccordion'\)[\s\S]*?toggleInteractionAccordion\(target && target\.dataset && target\.dataset\.accordionId\);/,
  'clicking an accordion row should toggle by accordion id so only one content block opens at a time'
);
assert.match(
  script,
  /function appendLinkedText\(target,\s*text,\s*links\)[\s\S]*?const actionId = String\(link && link\.actionId \|\| ''\)\.trim\(\);[\s\S]*?anchor\.className = 'interaction-accordion-link';[\s\S]*?anchor\.href = href;[\s\S]*?anchor\.dataset\.action = actionId;/,
  'accordion text should render configured phrases as action-backed links'
);
assert.match(
  script,
  /const accordionLinkTarget = event\.target && event\.target\.closest[\s\S]*?event\.target\.closest\('\.interaction-accordion-link\[data-action\]'\)[\s\S]*?if \(accordionLinkTarget\)[\s\S]*?event\.preventDefault\(\);[\s\S]*?runExtensionAction\(accordionLinkTarget\);[\s\S]*?return;/,
  'accordion chrome links should use background actions instead of blocked direct chrome:// navigation'
);
assert.match(
  script,
  /if \(event\.target && event\.target\.closest && event\.target\.closest\('\.interaction-accordion-panel'\)\)\s*\{\s*return;\s*\}/,
  'clicking expanded accordion text should not toggle the accordion row'
);
assert.match(
  script,
  /\[primaryActionButton,\s*secondaryActionButton,\s*ghostActionButton\]\.forEach\(bindActionButtonTooltip\);/,
  'onboarding should bind hover tooltip handlers to every lower-left action button'
);
assert.match(
  script,
  /const bodyNote = document\.getElementById\('onboarding-body-note'\);/,
  'onboarding should cache the body note element for the focus-search shortcut hint'
);
assert.match(
  script,
  /bodyNote\.textContent = String\(slide\.copy\.note \|\| ''\);/,
  'onboarding should render optional copy notes below the subtitle'
);
assert.match(
  script,
  /function renderPageStrip\(/,
  'onboarding should render the in-panel page strip from state'
);
assert.match(
  script,
  /pageStrip\.hidden\s*=\s*state\.index\s*<=\s*0;/,
  'in-panel page strip should stay hidden on the intro slide'
);
assert.doesNotMatch(html, /class="onboarding-footer"/, 'onboarding shell should not render bottom footer controls');
assert.doesNotMatch(html, /id="onboarding-progress-dots"/, 'onboarding shell should not render bottom progress dots');
assert.doesNotMatch(html, /data-onboarding-prev/, 'onboarding shell should not render bottom previous-page control');
assert.doesNotMatch(html, /data-onboarding-next/, 'onboarding shell should not render bottom next-page control');
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
  'right-side fixed-ratio visual panel should keep the unblurred Monet wallpaper background'
);
assert.match(
  visualPanelSlotStyle ? visualPanelSlotStyle[0] : '',
  /width:\s*100%;[\s\S]*?height:\s*100%;[\s\S]*?max-height:\s*100%;[\s\S]*?align-self:\s*stretch;[\s\S]*?display:\s*grid;[\s\S]*?align-items:\s*center;[\s\S]*?justify-items:\s*start;[\s\S]*?settings-bg-light-monet-newtab\.webp[\s\S]*?overflow:\s*visible;/,
  'right-side visual slot should left-align the fixed-ratio panel over the Monet background without clipping overlay shadows'
);
assert.match(
  visualPanelStyle ? visualPanelStyle[0] : '',
  /width:\s*100%;[\s\S]*?height:\s*100%;[\s\S]*?aspect-ratio:\s*var\(--onboarding-visual-ratio\);[\s\S]*?overflow:\s*visible;/,
  'right-side visual panel should fill the visual slot so scaled canvas margins do not reveal the frame background'
);
assert.doesNotMatch(
  newtabPreviewBrowserBackdropStyle ? newtabPreviewBrowserBackdropStyle[0] : '',
  /--onboarding-browser-final-filter:\s*blur\(/,
  'newtab browser preview should not blur the browser illustration itself'
);
assert.match(
  newtabPreviewBrowserPageBeforeStyle ? newtabPreviewBrowserPageBeforeStyle[0] : '',
  /content:\s*"";[\s\S]*?position:\s*absolute;[\s\S]*?inset:\s*0;[\s\S]*?z-index:\s*1;[\s\S]*?backdrop-filter:\s*blur\([^)]*\)\s+saturate\([^)]*\);[\s\S]*?-webkit-backdrop-filter:\s*blur\([^)]*\)\s+saturate\([^)]*\);/,
  'newtab browser preview should place a backdrop-blur layer over the browser illustration'
);
assert.match(
  html,
  /\.newtab-preview-viewport\s*\{[\s\S]*?z-index:\s*2;/,
  'newtab browser preview content should render above the backdrop-blur layer'
);
assert.match(
  visualCanvasStyle ? visualCanvasStyle[0] : '',
  /position:\s*absolute;[\s\S]*?left:\s*0;[\s\S]*?top:\s*0;[\s\S]*?width:\s*var\(--onboarding-visual-canvas-width\);[\s\S]*?height:\s*var\(--onboarding-visual-canvas-height\);[\s\S]*?transform:\s*scale\(var\(--onboarding-visual-scale,\s*1\)\);[\s\S]*?transform-origin:\s*top left;/,
  'right-side canvas contents should scale from the top-left inside the already scaled fixed-ratio panel'
);
assert.doesNotMatch(
  html,
  /class="visual-background"|--onboarding-visual-bg-blur|\.visual-background::before/,
  'generic right-side visual background should not be blurred across all onboarding pages'
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
  /\.body-note\s*\{[\s\S]*?display:\s*block;[\s\S]*?margin-top:\s*10px;[\s\S]*?font-size:\s*14px;[\s\S]*?line-height:\s*1\.55;[\s\S]*?\}/,
  'shortcut change hint should render as a smaller second line below the subtitle'
);
assert.match(
  html,
  /\.body-note:empty\s*\{[\s\S]*?display:\s*none;[\s\S]*?\}/,
  'empty body notes should not reserve space on slides without the shortcut hint'
);
assert.match(
  html,
  /\.page-strip\s*\{[\s\S]*?--page-strip-track:\s*rgba\(17,\s*24,\s*39,\s*0\.045\);[\s\S]*?--page-strip-active:\s*rgba\(17,\s*24,\s*39,\s*0\.14\);[\s\S]*?width:\s*min\(280px,\s*100%\);[\s\S]*?display:\s*grid;[\s\S]*?grid-template-columns:\s*repeat\(var\(--page-strip-count,\s*4\),\s*minmax\(0,\s*1fr\)\);[\s\S]*?\}/,
  'second-and-later slides should render a shorter, lighter segmented page strip above the copy'
);
assert.match(
  html,
  /\.page-strip-segment\s*\{[\s\S]*?all:\s*unset;[\s\S]*?box-sizing:\s*border-box;[\s\S]*?height:\s*5px;[\s\S]*?cursor:\s*pointer;[\s\S]*?background:\s*var\(--page-strip-track\);[\s\S]*?\}/,
  'page strip segments should be thin clickable buttons with a soft gray track'
);
assert.match(
  html,
  /\.page-strip-segment\[data-active="true"\]\s*\{[\s\S]*?background:\s*var\(--page-strip-active\);[\s\S]*?\}/,
  'page strip should highlight only the active slide segment'
);
assert.match(
  html,
  /\.page-strip-segment:hover\s*\{[\s\S]*?background:\s*var\(--page-strip-hover\);[\s\S]*?\}/,
  'page strip segments should show a subtle hover state'
);
assert.match(
  html,
  /\.page-strip-segment\[data-active="true"\]:hover\s*\{[\s\S]*?background:\s*var\(--page-strip-active-hover\);[\s\S]*?\}/,
  'active page strip segment should keep a subtly stronger hover state'
);
assert.match(
  html,
  /\.page-strip-segment:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--page-strip-focus\);[\s\S]*?outline-offset:\s*3px;[\s\S]*?\}/,
  'page strip segments should expose a keyboard focus ring'
);
assert.match(
  html,
  /\.page-strip\[data-entering="true"\]\s*\{[\s\S]*?animation:\s*onboarding-page-strip-enter 360ms cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\) both;[\s\S]*?\}/,
  'page strip should animate in when it appears after the intro page'
);
assert.match(
  html,
  /\.page-strip\[data-entering="true"\]\s+\.page-strip-segment\s*\{[\s\S]*?animation:\s*onboarding-page-strip-segment-enter 520ms cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\) both;[\s\S]*?animation-delay:\s*calc\(80ms \+ var\(--page-strip-segment-index,\s*0\) \* 55ms\);[\s\S]*?\}/,
  'page strip segments should stagger their entrance instead of appearing all at once'
);
assert.match(
  html,
  /@keyframes onboarding-page-strip-enter[\s\S]*?@keyframes onboarding-page-strip-segment-enter/,
  'page strip entrance should define dedicated keyframes for the track and segments'
);
assert.match(
  script,
  /const wasPageStripHidden = pageStrip\.hidden;[\s\S]*?pageStrip\.dataset\.entering = wasPageStripHidden && !pageStrip\.hidden \? 'true' : 'false';/,
  'page strip should only mark itself entering when it changes from hidden to visible'
);
assert.match(
  script,
  /segment\.style\.setProperty\('--page-strip-segment-index', String\(pageIndex\)\);/,
  'page strip segments should expose an index for staggered animation delays'
);
assert.match(
  script,
  /const pageCount = Math\.max\(1,\s*blueprint\.slides\.length - 1\);[\s\S]*?const currentPageIndex = Math\.max\(0,\s*state\.index - 1\);/,
  'page strip should count the native focus search page as page one by excluding the intro slide'
);
assert.match(
  script,
  /for \(let pageIndex = 0; pageIndex < pageCount; pageIndex \+= 1\)[\s\S]*?const slideIndex = pageIndex \+ 1;[\s\S]*?const segment = document\.createElement\('button'\);[\s\S]*?segment\.type = 'button';[\s\S]*?segment\.dataset\.active = pageIndex === currentPageIndex \? 'true' : 'false';[\s\S]*?segment\.dataset\.slideTarget = String\(slideIndex\);[\s\S]*?segment\.setAttribute\('aria-label', `第 \$\{pageIndex \+ 1\} 页`\);/,
  'page strip should render labelled buttons whose page index maps to real slide indexes after the intro'
);
assert.match(
  script,
  /segment\.setAttribute\('aria-current', 'step'\);/,
  'active page strip segment should expose aria-current step'
);
assert.match(
  html,
  /\.interaction-slots\s*\{[\s\S]*?width:\s*max-content;[\s\S]*?max-width:\s*100%;[\s\S]*?align-self:\s*end;[\s\S]*?justify-self:\s*start;[\s\S]*?\}/,
  'auxiliary interaction rows should sit above the lower-left actions while aligning with the left copy edge'
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
const secondaryActionHtml = html.match(/<button class="onboarding-action-button onboarding-action-button--secondary"[^>]*data-action="prev"[^>]*hidden[\s\S]*?<\/button>/);
assert.ok(secondaryActionHtml, 'initial secondary lower-left action should stay hidden until content config reveals it');
assert.match(
  secondaryActionHtml[0],
  /<span>返回<\/span>/,
  'initial secondary lower-left action should use the return label'
);
assert.doesNotMatch(
  secondaryActionHtml[0],
  /<i\b|ri-arrow-left-line/,
  'secondary lower-left actions should not render a template icon'
);
assert.match(
  html,
  /class="onboarding-action-button onboarding-action-button--ghost"[^>]*data-action="openShortcuts"[^>]*hidden[\s\S]*?<span>更换快捷键<\/span>[\s\S]*?ri-external-link-line/,
  'shortcut action should render as a hidden ghost action until the second page reveals it'
);
assert.match(
  content,
  /actionId:\s*'openShortcuts'[\s\S]*?label:\s*'更换快捷键'[\s\S]*?tooltip:\s*'由于浏览器的限制，请在 扩展程序\/键盘快捷键 页面修改插件的所有快捷键，点击前往'[\s\S]*?tooltipMaxWidth:\s*260/,
  'shortcut action should expose the requested label, tooltip copy, and narrower tooltip width'
);
assert.doesNotMatch(
  content,
  /如需更换快捷键，可前往「浏览器快捷键」设置，在该页找到 Lumno。/,
  'focus search page should no longer include the old inline shortcut-change note'
);
assert.match(
  content,
  /id:\s*'setup'[\s\S]*?interactionRows:\s*Object\.freeze\(\[[\s\S]*?accordionId:\s*'dia-browser'[\s\S]*?text:\s*DIA_BROWSER_DISCLOSURE_TEXT[\s\S]*?label:\s*'快捷键设置页面'[\s\S]*?href:\s*SHORTCUTS_PAGE_URL[\s\S]*?actionId:\s*'openShortcuts'[\s\S]*?accordionId:\s*'local-file-search'[\s\S]*?text:\s*LOCAL_FILE_ACCORDION_TEXT[\s\S]*?label:\s*'扩展程序详情页'[\s\S]*?href:\s*EXTENSION_DETAILS_URL[\s\S]*?actionId:\s*'openExtensionDetails'/,
  'focus search page should expose two shared accordion rows with linked accordion phrases'
);
assert.match(
  html,
  /\.interaction-slots\[data-accordion="true"\]\s*\{[\s\S]*?min-height:\s*220px;[\s\S]*?align-content:\s*end;[\s\S]*?\}/,
  'shared accordion rows should reserve room and grow upward from above the action row'
);
assert.match(
  html,
  /\.interaction-accordion-trigger\s*\{[\s\S]*?cursor:\s*pointer;[\s\S]*?\}/,
  'accordion title triggers should expose the pointer affordance'
);
assert.match(
  html,
  /\.interaction-accordion-trigger\s*\{[\s\S]*?display:\s*inline-flex;[\s\S]*?align-items:\s*center;[\s\S]*?gap:\s*4px;[\s\S]*?\}/,
  'accordion rows should keep the label and chevron beside each other'
);
assert.match(
  html,
  /\.interaction-accordion-chevron\s*\{[\s\S]*?transition:\s*transform 180ms ease;[\s\S]*?\}/,
  'accordion chevrons should rotate smoothly when expanded'
);
assert.match(
  html,
  /\.interaction-slot--accordion\[data-expanded="true"\]\s+\.interaction-accordion-chevron\s*\{[\s\S]*?transform:\s*rotate\(-90deg\);[\s\S]*?\}/,
  'accordion chevrons should rotate to indicate the expanded state'
);
assert.match(
  html,
  /\.interaction-accordion-panel\s*\{[\s\S]*?grid-column:\s*2;[\s\S]*?display:\s*grid;[\s\S]*?grid-template-rows:\s*0fr;[\s\S]*?transition:\s*grid-template-rows 220ms ease;[\s\S]*?\}/,
  'accordion panels should collapse and expand in the normal row flow'
);
assert.match(
  html,
  /\.interaction-accordion-panel\s*\{[\s\S]*?cursor:\s*default;[\s\S]*?\}/,
  'expanded accordion text should not present itself as a clickable target'
);
assert.match(
  html,
  /\.interaction-slot--accordion\[data-expanded="true"\]\s+\.interaction-accordion-panel\s*\{[\s\S]*?grid-template-rows:\s*1fr;[\s\S]*?\}/,
  'expanded accordion rows should open their panel inside the shared component'
);
assert.match(
  html,
  /\.interaction-accordion-text\s*\{[\s\S]*?white-space:\s*pre-line;[\s\S]*?\}/,
  'accordion text should preserve line breaks'
);
assert.match(
  html,
  /\.interaction-accordion-link\s*\{[\s\S]*?color:\s*var\(--page-ink\);[\s\S]*?text-decoration:\s*underline;[\s\S]*?\}/,
  'accordion inline links should be visually distinguishable inside the expanded text'
);
assert.match(
  html,
  /\.t-panel-slide\s*\{[\s\S]*?transition:[\s\S]*?transform var\(--panel-close-dur\) var\(--panel-ease\)[\s\S]*?opacity\s+var\(--panel-close-dur\) var\(--panel-ease\)[\s\S]*?filter\s+var\(--panel-close-dur\) var\(--panel-ease\)[\s\S]*?\}/,
  'accordion text should use the shared panel reveal transition'
);
assert.doesNotMatch(
  html,
  /interaction-disclosure/,
  'accordion styles should not keep Dia-specific disclosure selectors'
);
assert.match(
  script,
  /panel\.className = 'interaction-accordion-panel';[\s\S]*?textNode\.className = 'interaction-accordion-text t-panel-slide';[\s\S]*?textNode\.dataset\.open = isExpanded \? 'true' : 'false';/,
  'accordion text should stay mounted and reveal via a data-open transition state'
);
assert.match(
  content,
  /id:\s*'search'[\s\S]*?primary:\s*Object\.freeze\(\{[\s\S]*?actionId:\s*'next'[\s\S]*?label:\s*'下一步'[\s\S]*?icon:\s*'ri-arrow-right-line'[\s\S]*?\}\)/,
  'newtab preview page should expose the lower-left next action'
);
assert.doesNotMatch(
  content,
  /id:\s*'search'[\s\S]*?secondary:\s*Object\.freeze\(\{[\s\S]*?label:\s*'返回'[\s\S]*?\}\)/,
  'newtab preview page should not expose the return action'
);
assert.doesNotMatch(
  content,
  /secondary:\s*Object\.freeze\(\{[\s\S]*?icon:\s*'ri-arrow-left-line'[\s\S]*?\}\)/,
  'secondary onboarding actions should not declare the old arrow-left icon'
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
  /openExtensionDetails:\s*'openExtensionDetailsPage'/,
  'accordion details link should route through the extension details background action'
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
  /\.title\s*\{[\s\S]*?--title-base-size:\s*36px;[\s\S]*?--title-fit-scale:\s*1;[\s\S]*?font-size:\s*calc\(var\(--title-base-size\) \* var\(--title-fit-scale\)\);[\s\S]*?\}/,
  'page title should expose a measured fit scale rather than wrapping into extra lines'
);
assert.match(
  html,
  /\.title-line\s*\{[\s\S]*?white-space:\s*nowrap;[\s\S]*?\}/,
  'configured title lines should stay on their intended line count'
);
assert.match(
  html,
  /\.body-copy\s*\{[\s\S]*?white-space:\s*normal;[\s\S]*?overflow-wrap:\s*break-word;[\s\S]*?\}/,
  'subtitle copy should be allowed to wrap naturally'
);
assert.match(
  script,
  /function updateTitleFitScale\(\)[\s\S]*?title\.style\.setProperty\('--title-fit-scale', '1'\);[\s\S]*?availableWidth \/ widestLine[\s\S]*?--title-fit-scale/,
  'onboarding should shrink the title only when a title line would overflow'
);
assert.match(
  script,
  /const VISUAL_CANVAS_WIDTH = 704;[\s\S]*?const VISUAL_CANVAS_HEIGHT = 680;/,
  'onboarding should keep the right-side illustration canvas at its designed dimensions in script'
);
assert.match(
  script,
  /function updateVisualCanvasScale\(\)[\s\S]*?visualSlot\.getBoundingClientRect\(\)[\s\S]*?availableWidth \/ VISUAL_CANVAS_WIDTH[\s\S]*?availableHeight \/ VISUAL_CANVAS_HEIGHT[\s\S]*?--onboarding-visual-scale[\s\S]*?--onboarding-visual-rendered-width/,
  'onboarding should scale the whole right-side fixed panel from the available visual slot size'
);
assert.match(
  script,
  /renderVisualSurface\(slide\);[\s\S]*?scheduleVisualCanvasScaleUpdate\(\);/,
  'rendering a slide should refresh the right visual canvas scale without scaling the whole onboarding frame'
);
assert.match(
  script,
  /ResizeObserver\(scheduleVisualCanvasScaleUpdate\)[\s\S]*?visualResizeObserver\.observe\(visualSlot\);/,
  'right-side visual scale should follow visual slot resize events, not only window resizes'
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
  /const TITLE_CYCLE_FIRST_DELAY_MS = 520;/,
  'title cycle should use a shorter first delay so the intro quickly reveals the history label'
);
assert.match(
  script,
  /if \(titleCycleFirstTimeout\) \{[\s\S]*?window\.clearTimeout\(titleCycleFirstTimeout\);[\s\S]*?titleCycleFirstTimeout = 0;[\s\S]*?\}/,
  'stopping the title cycle should clear the first short delay timeout'
);
assert.match(
  script,
  /function startTitleCycle\(/,
  'onboarding should start automatic title label rotation when the title renders'
);
assert.match(
  script,
  /function advanceTitleCycle\(rotator,\s*items\)[\s\S]*?titleCycleIndex = \(titleCycleIndex \+ 1\) % items\.length;[\s\S]*?swapTitleCycleItem\(rotator,\s*items\[titleCycleIndex\]\);/,
  'title cycle should advance through labels with one shared helper'
);
assert.match(
  script,
  /titleCycleFirstTimeout = window\.setTimeout\(\(\) => \{[\s\S]*?advanceTitleCycle\(rotator,\s*safeItems\);[\s\S]*?titleCycleInterval = window\.setInterval\(\(\) => \{[\s\S]*?advanceTitleCycle\(rotator,\s*safeItems\);[\s\S]*?\}, TITLE_CYCLE_INTERVAL_MS\);[\s\S]*?\}, TITLE_CYCLE_FIRST_DELAY_MS\);/,
  'title cycle should only shorten the first bookmark-to-history wait before using the normal cadence'
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
  /function isStackedOnboardingLayout\(\)[\s\S]*?matchMedia\('\(max-width:\s*900px\)'\)\.matches/,
  'onboarding should detect the stacked responsive layout before applying scroll corrections'
);
assert.match(
  script,
  /function resetStackedLayoutScroll\(\)[\s\S]*?root\.scrollTop\s*=\s*0;[\s\S]*?requestAnimationFrame[\s\S]*?root\.scrollTop\s*=\s*0;/,
  'stacked onboarding layouts should reset the shell scroll position after slide changes'
);
assert.match(
  script,
  /function commitState\(nextState\)[\s\S]*?render\(\);[\s\S]*?resetStackedLayoutScroll\(\);/,
  'committing a slide change should keep the stacked copy panel anchored at the top'
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
  content,
  /id:\s*'intro'[\s\S]*?visualKind:\s*'lumno-web-wordmark-surface'[\s\S]*?visualVisible:\s*true/,
  'first page should keep the right-side container and show the Lumno web wordmark'
);
assert.match(
  content,
  /id:\s*'search'[\s\S]*?visualKind:\s*'newtab-preview-surface'[\s\S]*?visualVisible:\s*true/,
  'third page should keep the right-side container and show the complete newtab preview'
);
assert.match(
  script,
  /const LUMNO_WEB_WORDMARK_SRC = '\.\.\/\.\.\/assets\/images\/lumno-web-textlogo\.svg';/,
  'home wordmark demo should use the Lumno web textlogo asset'
);
assert.match(
  lumnoWebWordmarkAsset,
  /<svg width="165" height="43"[\s\S]*?fill="#79C3F2"/,
  'copied wordmark asset should match the Lumno web homepage textlogo'
);
assert.match(
  script,
  /function createLumnoWebWordmarkSurface\([\s\S]*?logo-wordmark-wrap[\s\S]*?logo-butterfly-stage[\s\S]*?seo-wordmark-text/,
  'first-page visual should render the Lumno web homepage wordmark structure'
);
assert.match(
  script,
  /const LUMNO_WEB_BUTTERFLY_FLUTTER_PATH = 'M4\.32468 17\.7823[\s\S]*?function createLumnoWebButterflyWing\([\s\S]*?animateTransform[\s\S]*?-1\.5 5\.5 15\.5;0 5\.5 15\.5;-1\.5 5\.5 15\.5/,
  'first-page visual should reuse the animated butterfly path from Lumno web'
);
assert.match(
  html,
  /\.visual-stage\[data-visual-kind="lumno-web-wordmark-surface"\]\s*\{[\s\S]*?display:\s*grid;[\s\S]*?place-items:\s*center;[\s\S]*?\}/,
  'Lumno web wordmark should be centered in the existing right-side visual stage'
);
assert.match(
  html,
  /\.lumno-web-wordmark-surface \.logo-butterfly-stage\s*\{[\s\S]*?left:\s*calc\(var\(--wordmark-width\) \* 152 \/ 165\);[\s\S]*?transform:\s*rotate\(-4deg\);[\s\S]*?\}/,
  'wordmark butterfly placement should follow the Lumno web homepage CSS'
);
assert.doesNotMatch(
  script,
  /createLumnowebMarkSurface|lumnoweb-word-dark|lumnoweb-butterfly-wing--left/,
  'first-page wordmark should not use the previous hand-built fake logo'
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
  /historyDeleteSlot\.dataset\.visible = 'false';[\s\S]*historyDeleteButton\.dataset\.visible = 'false';/,
  'history-like fake rows should keep the delete slot collapsed so the visit button stays right-aligned'
);
assert.match(
  html,
  /#_x_extension_overlay_2024_unique_ \.lumno-overlay-result \.x-ov-history-delete-slot\[data-visible="false"\]\s*\{[\s\S]*?display:\s*none;[\s\S]*?\}/,
  'collapsed fake history delete slots should not contribute a flex gap after the visit button'
);
assert.match(
  script,
  /visualStage\.appendChild\(createBookmarkFocusSurface\(\)\);/,
  'bookmark-focus visual should mount the composed browser and Lumno overlay demo'
);
assert.match(
  script,
  /function createNewtabPreviewSurface\(/,
  'right-side newtab onboarding visual should have a dedicated renderer'
);
assert.match(
  script,
  /const surface = createNewtabPreviewSurface\(\);[\s\S]*?visualStage\.appendChild\(surface\);[\s\S]*?startNewtabPreviewHoverLoop\(surface\);/,
  'newtab visual should mount the composed newtab preview and start its hover demo loop'
);
assert.match(
  script,
  /surface\.className = 'newtab-preview-surface'/,
  'newtab visual renderer should expose a stable surface class'
);
assert.match(
  script,
  /createNewtabPreviewSearchPanel\([\s\S]*?_x_extension_newtab_search_layer_2024_unique_/,
  'newtab preview should recreate the real newtab search layer structure'
);
assert.match(
  script,
  /NEWTAB_PREVIEW_RECENT_SITES[\s\S]*Lumno - Chrome Web Store[\s\S]*kubai087\/lumno-extension[\s\S]*Tailwind CSS Docs[\s\S]*NEWTAB_PREVIEW_BOOKMARKS[\s\S]*title:\s*'工作台'[\s\S]*type:\s*'folder'[\s\S]*title:\s*'设计素材'[\s\S]*type:\s*'folder'[\s\S]*title:\s*'开发文档'[\s\S]*type:\s*'folder'/,
  'newtab preview should prefill real-looking recent-site rows and three folder bookmarks'
);
assert.match(
  script,
  /const NEWTAB_PREVIEW_QUERY = '';[\s\S]*field\.value = NEWTAB_PREVIEW_QUERY;[\s\S]*field\.placeholder = '搜索或输入网址\.\.\.';[\s\S]*viewport\.dataset\.ntSuggestionsOpen = 'false';/,
  'newtab preview should render the real empty-input newtab state instead of prefilled query text'
);
assert.match(
  script,
  /createNewtabPreviewSuggestionsStack\([\s\S]*?_x_extension_newtab_suggestions_surface_2026_unique_[\s\S]*?surface\.dataset\.visible = 'false';[\s\S]*?_x_extension_newtab_suggestions_container_2024_unique_[\s\S]*?container\.dataset\.visible = 'false';/,
  'newtab preview should keep the real newtab suggestions surface mounted but closed for the empty input state'
);
assert.match(
  script,
  /bottomDockScroller\.appendChild\(createNewtabPreviewSection\('bookmarks', '书签', NEWTAB_PREVIEW_BOOKMARKS\)\);[\s\S]*bottomDockScroller\.appendChild\(sectionSafeCorridor\);[\s\S]*bottomDockScroller\.appendChild\(createNewtabPreviewSection\('recent', '最近访问', NEWTAB_PREVIEW_RECENT_SITES\)\);/,
  'newtab preview should include the real bottom-dock bookmarks and recent sections with fake data'
);
assert.match(
  script,
  /browserBackdrop\.className = 'browser-window newtab-preview-browser-backdrop';[\s\S]*browserBackdrop\.appendChild\(createBrowserBar\(\)\);[\s\S]*browserForeground\.className = 'newtab-preview-browser-foreground';[\s\S]*page\.className = 'newtab-preview-browser-page';[\s\S]*page\.appendChild\(createNewtabPreviewViewport\(\)\);/,
  'newtab preview should keep the browser chrome backdrop and render the newtab page in a clear foreground layer'
);
assert.doesNotMatch(
  script,
  /browserBackdrop\.appendChild\(createBrowserPageSkeleton\(\)\);/,
  'newtab preview should not show generic webpage skeleton lines above the newtab content'
);
assert.match(
  script,
  /function createBrowserWindowClip\(browserWindow\)[\s\S]*?clip\.className = 'browser-window-clip';[\s\S]*?clip\.appendChild\(browserWindow\);/,
  'browser illustrations should be wrapped in a reusable clipping layer inside the fixed right-side canvas'
);
assert.match(
  script,
  /rootNode\.appendChild\(createBrowserWindowClip\(browserWindow\)\);[\s\S]*rootNode\.appendChild\(createLumnoOverlaySurface\(\)\);/,
  'focus-search visual should clip the background browser while keeping the overlay outside that clipping layer'
);
assert.match(
  script,
  /const backdropClip = createBrowserWindowClip\(browserBackdrop\);[\s\S]*backdropClip\.classList\.add\('newtab-preview-browser-backdrop-clip'\);[\s\S]*const foregroundClip = createBrowserWindowClip\(browserForeground\);[\s\S]*foregroundClip\.classList\.add\('newtab-preview-browser-foreground-clip'\);[\s\S]*surface\.appendChild\(backdropClip\);[\s\S]*surface\.appendChild\(foregroundClip\);/,
  'newtab visual should clip separate browser backdrop and clear-foreground layers inside the fixed right-side canvas'
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
  html,
  /\.visual-stage\[data-visual-kind="newtab-preview-surface"\]\s*\{[\s\S]*?width:\s*100%;[\s\S]*?height:\s*100%;[\s\S]*?overflow:\s*visible;[\s\S]*?\}/,
  'newtab preview visual should reuse the full browser illustration stage'
);
assert.match(
  html,
  /\.browser-window-clip\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?inset:\s*0;[\s\S]*?overflow:\s*hidden;[\s\S]*?pointer-events:\s*none;[\s\S]*?isolation:\s*isolate;[\s\S]*?\}/,
  'right-side browser illustrations should keep their oversized contents clipped even when the outer responsive layout stacks vertically'
);
assert.doesNotMatch(
  html,
  /\.onboarding-shell\[data-active-slide="search"\]\s+\.visual-panel\s*\{[\s\S]*?background:\s*linear-gradient/,
  'newtab preview slide should reuse the same Monet wallpaper panel background as the browser illustration'
);
assert.match(
  html,
  /\.newtab-preview-surface\s*\{[\s\S]*?--newtab-preview-page-scale:\s*0\.84;[\s\S]*?animation:\s*onboarding-newtab-preview-enter/,
  'newtab preview should keep the browser illustration full-size and scale the embedded newtab page into the marked browser content area'
);
assert.match(
  newtabPreviewBrowserBackdropStyle ? newtabPreviewBrowserBackdropStyle[0] : '',
  /animation-delay:\s*80ms;/,
  'the reused newtab browser backdrop should keep the delayed browser entrance without blurring the illustration itself'
);
assert.match(
  newtabPreviewBrowserForegroundStyle ? newtabPreviewBrowserForegroundStyle[0] : '',
  /left:\s*var\(--onboarding-browser-window-inset\);[\s\S]*?top:\s*var\(--onboarding-browser-window-inset\);[\s\S]*?width:\s*176%;[\s\S]*?height:\s*162%;[\s\S]*?overflow:\s*hidden;/,
  'newtab foreground should align with the reused browser backdrop without inheriting its blur'
);
assert.match(
  html,
  /\.newtab-preview-browser-foreground\s+\.newtab-preview-browser-page\s*\{[\s\S]*?margin-top:\s*50px;[\s\S]*?\}/,
  'newtab foreground page should start below the reused browser chrome'
);
assert.match(
  html,
  /\.newtab-preview-browser-page\s*\{[\s\S]*?height:\s*calc\(100% - 50px\);[\s\S]*?overflow:\s*hidden;[\s\S]*?\}/,
  'newtab preview should reserve the red-frame browser content region below the chrome'
);
assert.match(
  html,
  /\.newtab-preview-viewport\s*\{[\s\S]*?left:\s*0;[\s\S]*?top:\s*0;[\s\S]*?transform:\s*scale\(var\(--newtab-preview-page-scale\)\);[\s\S]*?background:\s*transparent;[\s\S]*?overflow:\s*hidden;[\s\S]*?\}/,
  'embedded newtab viewport should be drawn from the browser-page origin so the container crops its upper-left content'
);
assert.match(
  html,
  /\.newtab-preview-viewport\s*\{[\s\S]*?--x-nt-bottom-dock-y-offset:\s*48px;[\s\S]*?--x-nt-bottom-dock-bottom-padding:\s*60px;/,
  'newtab preview bottom dock should define a vertical lift so recent cards do not sit on the browser bottom edge'
);
assert.match(
  html,
  /\.newtab-preview-bottom-dock,\s*[\s\S]*?#_x_extension_newtab_bottom_dock_2024_unique_\s*\{[\s\S]*?bottom:\s*var\(--x-nt-bottom-dock-y-offset\);/,
  'newtab preview bottom dock should use the lift variable instead of pinning to bottom zero'
);
assert.match(
  html,
  /\.newtab-preview-wordmark[\s\S]*margin:\s*100px auto 14px;[\s\S]*#_x_extension_newtab_root_2024_unique_[\s\S]*#_x_extension_newtab_suggestions_container_2024_unique_[\s\S]*\.x-nt-recent-card[\s\S]*\.x-nt-bookmark-card/,
  'newtab preview CSS should cover real wordmark, search, suggestions, recent, and bookmarks'
);
assert.match(
  html,
  /--x-nt-content-max-width:\s*1040px;[\s\S]*--x-nt-bookmark-columns:\s*4;/,
  'newtab preview should leave the same content gutter and default bookmark columns as Lumno newtab'
);
assert.match(
  html,
  /\.newtab-preview-wordmark img\s*\{[\s\S]*?width:\s*108px;[\s\S]*?opacity:\s*0\.52;/,
  'newtab preview wordmark should be smaller and lighter inside the cropped browser area'
);
assert.match(
  script,
  /function getNewtabPreviewFolderSvg\(idSuffix\)[\s\S]*data-folder-layer="lower"[\s\S]*data-folder-layer="upper"[\s\S]*linearGradient/,
  'newtab preview folder bookmark should use the layered gradient folder SVG instead of the old flat placeholder'
);
assert.match(
  html,
  /--x-nt-bookmark-card-hover-underlay:\s*rgba\(0,\s*0,\s*0,\s*0\)/,
  'newtab bookmark cards should not inherit the dark hover underlay in their resting state'
);
assert.match(
  html,
  /@keyframes onboarding-newtab-preview-enter[\s\S]*?@keyframes onboarding-newtab-section-rise/,
  'newtab preview should include staged entrance animation keyframes'
);
assert.match(
  browserWindowStyle ? browserWindowStyle[0] : '',
  /--onboarding-browser-window-inset:\s*5%;[\s\S]*?left:\s*var\(--onboarding-browser-window-inset\);[\s\S]*?top:\s*var\(--onboarding-browser-window-inset\);[\s\S]*?width:\s*176%;[\s\S]*?height:\s*162%;/,
  'browser skeleton should keep balanced visible top and left inset while showing only its upper-left portion inside the visual container'
);
assert.doesNotMatch(
  browserWindowStyle ? browserWindowStyle[0] : '',
  /(?:^|\n)\s*inset\s*:/,
  'oversized browser skeleton should use explicit left/top/width/height rather than inset filling the panel'
);
assert.match(
  browserWindowStyle ? browserWindowStyle[0] : '',
  /border:\s*1px solid transparent;[\s\S]*?border-top-color:\s*rgba\(255,\s*255,\s*255,\s*0\.62\);[\s\S]*?border-left-color:\s*transparent;[\s\S]*?border-right-color:\s*transparent;[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*0\.42\);/,
  'browser skeleton should keep a soft top edge without vertical outline seams'
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
  /\.browser-window\s*\{[\s\S]*?--onboarding-browser-window-inset:\s*5%;[\s\S]*?left:\s*var\(--onboarding-browser-window-inset\);[\s\S]*?top:\s*var\(--onboarding-browser-window-inset\);[\s\S]*?border-left-color:\s*transparent;[\s\S]*?\}/,
  'browser illustration should use matching top and left inset while hiding the cropped left edge'
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
  /\.demo-cursor\s*\{[\s\S]*?width:\s*34px;[\s\S]*?height:\s*36px;[\s\S]*?opacity:\s*0;[\s\S]*?transform:\s*rotate\(-6deg\);[\s\S]*?drop-shadow\(0 12px 16px rgba\(15,\s*23,\s*42,\s*0\.24\)\);[\s\S]*?\}/,
  'animated cursor should use a flatter Figma-like pointer scale without excessive rotation'
);
assert.match(
  script,
  /function createDemoCursorSvg\([\s\S]*?M8\.5 6\.5 L43\.5 28\.7 L29\.3 33 L20\.8 50 Z[\s\S]*?figma-cursor__outline[\s\S]*?figma-cursor__fill[\s\S]*?stroke-width',\s*'2'[\s\S]*?#303030/,
  'animated cursor should render a more symmetrical black pointer fill'
);
assert.match(
  html,
  /\.figma-cursor__outline\s*\{[\s\S]*?stroke-width:\s*10;[\s\S]*?\}/,
  'animated cursor should use a thicker white outline'
);
assert.match(
  html,
  /data-cursor-mode="intro"[\s\S]*?onboarding-cursor-logo-wander 8600ms[\s\S]*?data-cursor-mode="setup"[\s\S]*?onboarding-cursor-type 2600ms[\s\S]*?onboarding-cursor-hover-loop 9600ms linear[\s\S]*?data-direction="forward"[\s\S]*?onboarding-cursor-setup-from-logo 4240ms[\s\S]*?onboarding-cursor-hover-loop 9600ms linear[\s\S]*?@keyframes onboarding-cursor-logo-wander[\s\S]*?left:\s*58%;[\s\S]*?top:\s*43%;[\s\S]*?left:\s*47%;[\s\S]*?top:\s*58%;[\s\S]*?@keyframes onboarding-cursor-setup-from-logo[\s\S]*?left:\s*16%;[\s\S]*?top:\s*33%;[\s\S]*?left:\s*61%;[\s\S]*?top:\s*40\.6%;[\s\S]*?@keyframes onboarding-cursor-hover-loop[\s\S]*?0%,[\s\S]*?16\.67%[\s\S]*?left:\s*61%;[\s\S]*?top:\s*40\.6%;[\s\S]*?21\.67%,[\s\S]*?33\.33%[\s\S]*?top:\s*48%;[\s\S]*?38\.33%,[\s\S]*?50%[\s\S]*?top:\s*55\.4%;[\s\S]*?55%,[\s\S]*?66\.67%[\s\S]*?top:\s*62\.8%;[\s\S]*?71\.67%,[\s\S]*?83\.33%[\s\S]*?top:\s*70\.2%;[\s\S]*?88%[\s\S]*?left:\s*68%;[\s\S]*?top:\s*74\.6%;[\s\S]*?94%[\s\S]*?left:\s*68%;[\s\S]*?top:\s*36\.8%;[\s\S]*?100%[\s\S]*?left:\s*61%;[\s\S]*?top:\s*40\.6%;/,
  'animated cursor should wander around the cover logo, move into the focus-search input start, then arc from the last result back to the first without a loop jump'
);
assert.match(
  html,
  /@keyframes onboarding-cursor-idle-drift[\s\S]*?left:\s*70%;[\s\S]*?top:\s*72%;/,
  'animated cursor should keep a quiet idle motion on later onboarding pages'
);
assert.match(
  html,
  /data-cursor-mode="search"[\s\S]*?onboarding-cursor-newtab-hover-loop 4060ms linear 1500ms[\s\S]*?data-active-slide="search"\]\[data-direction="forward"\][\s\S]*?onboarding-cursor-newtab-from-setup 5040ms[\s\S]*?onboarding-cursor-newtab-hover-loop 4060ms linear 5040ms[\s\S]*?@keyframes onboarding-cursor-newtab-from-setup[\s\S]*?--onboarding-cursor-transition-left[\s\S]*?left:\s*38%;[\s\S]*?top:\s*82%;[\s\S]*?left:\s*36\.6%;[\s\S]*?top:\s*56\.4%;[\s\S]*?left:\s*70%;[\s\S]*?top:\s*72%;[\s\S]*?@keyframes onboarding-cursor-newtab-hover-loop[\s\S]*?0%[\s\S]*?left:\s*70%;[\s\S]*?top:\s*72%;[\s\S]*?12\.81%,[\s\S]*?42\.36%[\s\S]*?left:\s*38%;[\s\S]*?top:\s*82%;[\s\S]*?55\.17%,[\s\S]*?84\.73%[\s\S]*?left:\s*36\.6%;[\s\S]*?top:\s*56\.4%;[\s\S]*?96%,[\s\S]*?100%[\s\S]*?left:\s*70%;[\s\S]*?top:\s*72%;/,
  'newtab preview cursor should quickly align to lifted recent and bookmark hover targets before looping'
);
assert.match(
  script,
  /const NEWTAB_PREVIEW_HOVER_START_MS = 1500;[\s\S]*?const NEWTAB_PREVIEW_HOVER_HOLD_MS = 1200;[\s\S]*?const NEWTAB_PREVIEW_HOVER_MOVE_MS = 520;[\s\S]*?const NEWTAB_PREVIEW_HOVER_RESET_MS = 620;[\s\S]*?const NEWTAB_PREVIEW_HOVER_RETURN_MS = 520;/,
  'newtab preview hover state loop should match the faster cursor timing'
);
assert.match(
  html,
  /\.x-nt-recent-card\.x-nt-recent-card--hover[\s\S]*?box-shadow:\s*var\(--x-nt-recent-card-shadow-hover\)[\s\S]*?\.x-nt-bookmark-card\.x-nt-bookmark-card--hover[\s\S]*?transform:\s*translateY\(-2\.5px\)[\s\S]*?\.x-nt-bookmark-card--folder\.x-nt-bookmark-card--hover \.x-nt-folder-preview/,
  'newtab preview hover classes should mirror plugin recent-card and bookmark-folder hover styling'
);
assert.match(
  script,
  /cursorLayer\.dataset\.cursorMode = slide\.cursor\.enabled \? slide\.id : '';/,
  'cursor renderer should expose the active slide as a cursor animation mode'
);
assert.match(
  script,
  /function captureCursorTransitionStart\(nextState\)[\s\S]*?currentSlide\.id === 'intro' && nextSlide\.id === 'setup'[\s\S]*?currentSlide\.id === 'setup' && nextSlide\.id === 'search'[\s\S]*?getComputedStyle\(cursor\)[\s\S]*?--onboarding-cursor-transition-left[\s\S]*?--onboarding-cursor-transition-top[\s\S]*?--onboarding-cursor-transition-transform/,
  'cursor transition should capture the current animated cursor frame before moving from the cover logo or focus-search page'
);
assert.match(
  script,
  /function setNewtabPreviewHoverState\(container,\s*targetKind\)[\s\S]*?classList\.toggle\('x-nt-recent-card--hover'[\s\S]*?classList\.toggle\('x-nt-bookmark-card--hover'[\s\S]*?function startNewtabPreviewHoverLoop\(container\)[\s\S]*?stopNewtabPreviewHoverLoop\(container\)[\s\S]*?scheduleNewtabPreviewHoverStep\(container\)/,
  'newtab preview hover loop should toggle real plugin hover classes on recent cards and folder bookmarks'
);
assert.match(
  html,
  /@keyframes onboarding-cursor-setup-from-logo[\s\S]*?transform:\s*var\(--onboarding-cursor-transition-transform,\s*translate3d\(0,\s*0,\s*0\) rotate\(-7deg\)\);/,
  'cursor transition should start from the captured transform rather than resetting before it moves'
);
assert.match(
  html,
  /@keyframes onboarding-overlay-enter[\s\S]*?scale\(var\(--onboarding-overlay-enter-scale,\s*0\.985\)\)[\s\S]*?scale\(var\(--onboarding-overlay-scale,\s*1\)\)/,
  'overlay entrance animation should preserve the smaller final scale'
);
assert.match(
  html,
  /\.browser-window\s*\{[\s\S]*?--onboarding-browser-final-filter:\s*blur\(0\);[\s\S]*?animation:\s*onboarding-browser-enter 680ms cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\) 80ms both;[\s\S]*?\}/,
  'browser illustration should have its own blurred entrance transition and default to a sharp final state'
);
assert.match(
  html,
  /@keyframes onboarding-browser-enter[\s\S]*?100%\s*\{[\s\S]*?filter:\s*var\(--onboarding-browser-final-filter,\s*blur\(0\)\);/,
  'browser illustration entrance should allow the newtab page to keep a small final blur without affecting other slides'
);
assert.match(
  html,
  /\.lumno-overlay-query-text\s*\{[\s\S]*?max-width:\s*0;[\s\S]*?animation:\s*onboarding-query-reveal 1040ms steps\(9,\s*end\) 1640ms both;[\s\S]*?\}/,
  'overlay query should reveal extension as the cursor moves across the input'
);
assert.match(
  html,
  /\.lumno-overlay-panel \.x-lumno-search-input__container\s*\{[\s\S]*?border-radius:\s*28px;[\s\S]*?animation:\s*onboarding-overlay-input-shell-expand 980ms cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\) 1900ms both;[\s\S]*?\}/,
  'overlay input should start as a compact standalone search box before results open'
);
assert.match(
  html,
  /\.lumno-overlay-results\s*\{[\s\S]*?max-height:\s*0;[\s\S]*?padding-top:\s*0;[\s\S]*?padding-bottom:\s*0;[\s\S]*?opacity:\s*0;[\s\S]*?overflow:\s*hidden;[\s\S]*?animation:\s*onboarding-overlay-results-reveal 980ms cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\) 1900ms both;[\s\S]*?\}/,
  'overlay results should occupy no visible space before the typed query starts producing matches'
);
assert.match(
  html,
  /\.lumno-overlay-result\s*\{[\s\S]*?visibility:\s*hidden;[\s\S]*?animation:\s*onboarding-overlay-row-enter 500ms cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\) both;[\s\S]*?animation-delay:\s*calc\(1940ms \+ \(var\(--result-index,\s*0\) \* 170ms\)\);[\s\S]*?\}/,
  'overlay result rows should reveal one by one while extension is being typed'
);
assert.match(
  html,
  /\.lumno-overlay-result\s*\{[\s\S]*?--onboarding-overlay-result-hover-ease:\s*cubic-bezier\(0\.16,\s*1,\s*0\.3,\s*1\);[\s\S]*?background-color 380ms var\(--onboarding-overlay-result-hover-ease\)[\s\S]*?border-color 380ms var\(--onboarding-overlay-result-hover-ease\)[\s\S]*?box-shadow 420ms var\(--onboarding-overlay-result-hover-ease\)[\s\S]*?\}[\s\S]*?#_x_extension_overlay_2024_unique_ \.lumno-overlay-result\[data-active="true"\]\s*\{[\s\S]*?box-shadow:[\s\S]*?rgba\(86,\s*139,\s*220,\s*0\.12\)[\s\S]*?\}[\s\S]*?\.lumno-overlay-result \.x-ov-suggestion-source-tag,[\s\S]*?\.lumno-overlay-result \.x-ov-suggestion-action-button\s*\{[\s\S]*?background-color 320ms cubic-bezier\(0\.16,\s*1,\s*0\.3,\s*1\)[\s\S]*?color 260ms ease-out/,
  'overlay hover rows should use a softer transition for highlight, border, shadow, tags, and action buttons'
);
assert.match(
  html,
  /@keyframes onboarding-overlay-results-reveal[\s\S]*?max-height:\s*0;[\s\S]*?padding-top:\s*0;[\s\S]*?padding-bottom:\s*0;[\s\S]*?max-height:\s*var\(--x-ov-suggestions-max-height,\s*330px\);[\s\S]*?padding-top:\s*12px;[\s\S]*?padding-bottom:\s*12px;/,
  'overlay results reveal should expand the panel from an empty-input state into the full result stack'
);
assert.match(
  script,
  /function startLumnoOverlayHoverLoop\(container\)[\s\S]*?overlayHoverIndex = 0;[\s\S]*?setLumnoOverlayDemoActiveIndex\(panel,\s*overlayHoverIndex\);[\s\S]*?scheduleLumnoOverlayHoverStep\(panel,\s*results\.length,\s*LUMNO_OVERLAY_HOVER_STEP_MS \+ LUMNO_OVERLAY_HOVER_LEAD_MS\);/,
  'overlay demo should pre-warm the first active row before cycling through all results'
);
assert.match(
  script,
  /const LUMNO_OVERLAY_HOVER_LEAD_MS = 1040;[\s\S]*?const LUMNO_OVERLAY_HOVER_START_MS = 4240 - LUMNO_OVERLAY_HOVER_LEAD_MS;/,
  'overlay demo should lead the first hover highlight so it is visible when the cursor reaches the first result'
);
assert.match(
  script,
  /const LUMNO_OVERLAY_HOVER_WRAP_STEP_MS = 1600;/,
  'overlay demo should reserve a dedicated timing step for the last-result to first-result cursor return'
);
assert.match(
  script,
  /function scheduleLumnoOverlayHoverStep\(panel,\s*resultCount,\s*firstStepDelay\)[\s\S]*?const isWrapping = overlayHoverIndex >= resultCount - 1;[\s\S]*?const hasFirstStepDelay = Number\.isFinite\(firstStepDelay\) && firstStepDelay > 0;[\s\S]*?const stepDelay = hasFirstStepDelay[\s\S]*?\? firstStepDelay[\s\S]*?: isWrapping[\s\S]*?\? LUMNO_OVERLAY_HOVER_STEP_MS \+ LUMNO_OVERLAY_HOVER_WRAP_STEP_MS[\s\S]*?: LUMNO_OVERLAY_HOVER_STEP_MS;[\s\S]*?overlayHoverStepTimeout = window\.setTimeout\(\(\) => \{[\s\S]*?overlayHoverIndex = isWrapping \? 0 : overlayHoverIndex \+ 1;[\s\S]*?setLumnoOverlayDemoActiveIndex\(panel,\s*overlayHoverIndex\);[\s\S]*?scheduleLumnoOverlayHoverStep\(panel,\s*resultCount\);[\s\S]*?\},\s*stepDelay\);/,
  'overlay hover loop should hold the last active row while the cursor takes a distinct return path'
);
assert.match(
  script,
  /function prepareVisualExit\(nextState\)[\s\S]*?currentSlide\.visual\.kind === 'bookmark-focus-surface'[\s\S]*?nextSlide\.visual\.kind === 'lumno-web-wordmark-surface'[\s\S]*?classList\.add\('is-visual-exit'\)/,
  'returning from the second slide to the first should blur out the right-side illustration'
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
const overlayResultsSource = script.match(/const LUMNO_OVERLAY_FAKE_RESULTS = Object\.freeze\(\[[\s\S]*?\n  \]\);/);
assert.ok(overlayResultsSource, 'overlay fake result data should be declared as a frozen array');
assert.doesNotMatch(
  overlayResultsSource[0],
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
  /searchIcon\.appendChild\(createIcon\('ri-search-line'\)\);/,
  'overlay input left icon should match the real shared search input icon'
);
assert.match(
  html,
  /\.lumno-overlay-panel \.x-lumno-search-input__field\s*\{[\s\S]*?padding-right:\s*64px;[\s\S]*?\}[\s\S]*?\.lumno-overlay-panel \.x-lumno-search-input__right-icon\s*\{[\s\S]*?right:\s*14px;[\s\S]*?\}/,
  'overlay input should right-align the settings button without reserving a trailing action slot'
);
assert.doesNotMatch(
  script,
  /closeOtherTabsButton|x-ov-close-other-tabs|ri-brush-2-line/,
  'onboarding overlay input should not reserve the close-other-tabs slot beside settings'
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
