const assert = require('assert');

const onboarding = require('../src/onboarding/onboarding-content.js');
const GITHUB_HOMEPAGE_URL = 'https://github.com/kubai087/lumno-extension';
const COMPATIBILITY_TOOLTIP =
  '受 Chrome 限制，Lumno 无法提供单独关闭新标签页的入口，但它可以与其他新标签页插件同时使用。\n具体而言，安装 Lumno 后，再覆盖安装或重新启用你正在使用的新标签页插件，让它继续接管新标签页即可。';
const SHORTCUT_ACTION_TOOLTIP =
  '由于浏览器的限制，请在 扩展程序/键盘快捷键 页面修改插件的所有快捷键，点击前往';
const DIA_BROWSER_DISCLOSURE_TEXT =
  '在 Dia 中，若聚焦搜索浮窗的快捷键不可用，请进入浏览器的快捷键设置页面，将“Open command bar”从“In Dia”改为“Global”。';
const SHORTCUTS_PAGE_URL = 'chrome://extensions/shortcuts';
const LOCAL_FILE_ACCORDION_TEXT =
  '请前往扩展程序详情页，为 Lumno 开启“允许访问文件网址”，开启后刷新对应标签页。';
const EXTENSION_DETAILS_URL = 'chrome://extensions/?id=nkbkcafoocmnnconoijmhloecgamfcai';

assert.strictEqual(typeof onboarding.getOnboardingBlueprint, 'function');
assert.strictEqual(typeof onboarding.getSupportedLocales, 'function');
assert.strictEqual(typeof onboarding.createOnboardingState, 'function');
assert.strictEqual(typeof onboarding.reduceOnboardingState, 'function');
assert.strictEqual(typeof onboarding.getShortcutDisplayTokens, 'function');
assert.strictEqual(typeof onboarding.formatShortcutForDisplay, 'function');
assert.strictEqual(typeof onboarding.parseShortcutHotkey, 'function');
assert.strictEqual(typeof onboarding.shortcutHotkeyMatchesEvent, 'function');

const locales = onboarding.getSupportedLocales();
assert.deepStrictEqual(locales, ['zh_CN', 'zh_TW', 'ja', 'en']);

const blueprint = onboarding.getOnboardingBlueprint('en');
assert.strictEqual(blueprint.brand, 'Lumno');
assert.strictEqual(blueprint.mode, 'paginated');
assert.ok(Array.isArray(blueprint.slides), 'blueprint should expose slides');
assert.ok(blueprint.slides.length >= 3, 'framework should support a multi-page onboarding flow');
assert.ok(blueprint.slides.length <= 5, 'initial framework should stay focused');

blueprint.slides.forEach((slide, index) => {
  assert.strictEqual(slide.sequence, index + 1, 'slides should have stable presentation order');
  assert.ok(slide.id, 'slides should have stable ids for analytics and deep linking');
  assert.ok(Array.isArray(slide.left.interactionSlots), 'left side should reserve interaction component slots');
  assert.strictEqual(slide.visual.mountId, 'onboarding-visual-stage', 'right side should render into the shared visual stage');
  assert.ok(slide.visual.kind.endsWith('-surface'), 'right side should declare a replaceable UI surface kind');
  assert.strictEqual(typeof slide.visual.visible, 'boolean', 'slides should declare whether the right illustration is visible');
  assert.strictEqual(typeof slide.cursor.enabled, 'boolean', 'slides should declare cursor animation readiness');
  assert.ok(slide.actions && typeof slide.actions === 'object', 'slides should expose lower-left action slots');
});

const firstSlide = blueprint.slides[0];
assert.strictEqual(firstSlide.id, 'intro');
assert.strictEqual(firstSlide.copy.title, '让浏览器的书签一搜即达');
assert.deepStrictEqual(firstSlide.copy.titleLines, ['让浏览器的书签', '一搜即达']);
assert.deepStrictEqual(
  firstSlide.copy.titleLogo,
  {
    label: 'Lumno',
    src: '../../assets/images/lumno.png'
  },
  'first slide title should expose the trailing Lumno logo mark'
);
assert.deepStrictEqual(
  firstSlide.copy.titleCycle,
  {
    prefix: '让浏览器的',
    items: [
      { id: 'bookmark', label: '书签', tone: 'bookmark' },
      { id: 'history', label: '历史', tone: 'history' },
      { id: 'top-sites', label: '常用网站', tone: 'top-sites' },
      { id: 'settings', label: '设置项', tone: 'settings' }
    ]
  },
  'first slide title should expose the rotating browser data source labels'
);
assert.strictEqual(
  firstSlide.copy.body,
  '开源浏览器聚焦搜索 & 极简新标签页'
);
assert.deepStrictEqual(
  firstSlide.left.interactionSlots.map((slot) => slot.label),
  [
    '开源、无隐私风险、注重用户体验',
    '支持主流浏览器',
    '兼容其他新标签页插件'
  ],
  'first slide should expose exactly the requested centered content rows'
);
assert.deepStrictEqual(
  firstSlide.left.interactionSlots.map((slot) => slot.icon),
  [
    'ri-shield-check-line',
    'ri-chrome-line',
    'ri-puzzle-line'
  ],
  'first slide auxiliary rows should expose the requested Remix icon classes'
);
const trustSlot = firstSlide.left.interactionSlots.find((slot) => slot.kind === 'trust-row');
assert.ok(trustSlot, 'first slide should expose the trust row');
assert.deepStrictEqual(
  trustSlot.linkButton,
  {
    icon: 'ri-github-fill',
    label: 'GitHub 仓库',
    tooltip: '以 GPL-3.0 许可证开源，点击访问 GitHub 仓库',
    href: GITHUB_HOMEPAGE_URL
  },
  'trust row should expose a compact GitHub homepage link button'
);
const browserSlot = firstSlide.left.interactionSlots.find((slot) => slot.kind === 'browser-row');
assert.ok(browserSlot, 'first slide should expose the Chromium browser support row');
assert.deepStrictEqual(
  browserSlot.browserAvatars,
  {
    prefix: '支持',
    suffix: '主流浏览器',
    browsers: [
      { id: 'chrome', name: 'Chrome', src: '../../assets/images/browser-logos/google-chrome-2022.svg' },
      { id: 'edge', name: 'Edge', src: '../../assets/images/browser-logos/microsoft-edge-2019.svg' },
      { id: 'dia', name: 'Dia', src: '../../assets/images/browser-logos/dia.jpg' },
      { id: 'comet', name: 'Comet', src: '../../assets/images/browser-logos/comet.jpg' }
    ]
  },
  'browser row should keep the browser avatar source list for the info tooltip'
);
assert.deepStrictEqual(
  browserSlot.infoTooltip,
  {
    icon: 'ri-information-line',
    label: '支持的浏览器',
    type: 'browser-avatars',
    text: ''
  },
  'browser row should expose a Lumno-style info tooltip for the browser avatars'
);
const compatibilitySlot = firstSlide.left.interactionSlots.find((slot) => slot.kind === 'compatibility-row');
assert.ok(compatibilitySlot, 'first slide should expose the compatibility row');
assert.deepStrictEqual(
  compatibilitySlot.infoTooltip,
  {
    icon: 'ri-information-line',
    label: '兼容说明',
    type: '',
    text: COMPATIBILITY_TOOLTIP
  },
  'compatibility row should expose a Lumno-style info tooltip'
);
assert.strictEqual(firstSlide.visual.kind, 'lumno-web-wordmark-surface');
assert.strictEqual(firstSlide.visual.visible, true);
assert.strictEqual(firstSlide.cursor.enabled, true);
assert.deepStrictEqual(
  firstSlide.actions,
  {
    primary: {
      actionId: 'next',
      label: '快速上手',
      icon: 'ri-arrow-right-line'
    },
    secondary: null,
    ghost: null
  },
  'first page should only expose the primary quick-start action'
);

const secondSlide = blueprint.slides[1];
assert.strictEqual(secondSlide.id, 'setup');
assert.deepStrictEqual(
  secondSlide.copy,
  {
    eyebrow: '',
    title: '原生聚焦搜索体验',
    body: '在任意网站按下快捷键{shortcut}，唤起聚焦搜索悬浮窗。'
  },
  'second page should show the focus search title without the removed shortcut note'
);
assert.strictEqual(
  Object.prototype.hasOwnProperty.call(secondSlide.copy, 'note'),
  false,
  'second page should not expose the removed shortcut-change note'
);
assert.strictEqual(secondSlide.visual.kind, 'bookmark-focus-surface');
assert.strictEqual(secondSlide.visual.visible, true);
assert.strictEqual(secondSlide.cursor.enabled, true);
assert.deepStrictEqual(
  secondSlide.left.interactionSlots,
  [
    {
      id: 'setup-interaction-1',
      kind: 'accordion-row',
      actionId: 'toggleInteractionAccordion',
      accordionId: 'dia-browser',
      icon: 'ri-question-fill',
      label: '致 Dia 浏览器用户',
      description: '',
      accordion: {
        icon: 'ri-arrow-left-s-line',
        text: DIA_BROWSER_DISCLOSURE_TEXT,
        links: [
          {
            label: '快捷键设置页面',
            href: SHORTCUTS_PAGE_URL,
            actionId: 'openShortcuts'
          }
        ],
        expandedByDefault: false
      }
    },
    {
      id: 'setup-interaction-2',
      kind: 'accordion-row',
      actionId: 'toggleInteractionAccordion',
      accordionId: 'local-file-search',
      icon: 'ri-question-fill',
      label: '在本地 PDF/HTML 标签页中使用聚焦搜索',
      description: '',
      accordion: {
        icon: 'ri-arrow-left-s-line',
        text: LOCAL_FILE_ACCORDION_TEXT,
        links: [
          {
            label: '扩展程序详情页',
            href: EXTENSION_DETAILS_URL,
            actionId: 'openExtensionDetails'
          }
        ],
        expandedByDefault: false
      }
    }
  ],
  'second page should expose two shared accordion rows below the subtitle'
);
assert.deepStrictEqual(
  secondSlide.actions,
  {
    primary: {
      actionId: 'next',
      label: '下一步',
      icon: 'ri-arrow-right-line'
    },
    secondary: {
      actionId: 'prev',
      label: '返回',
      icon: ''
    },
    ghost: {
      actionId: 'openShortcuts',
      label: '更换快捷键',
      icon: 'ri-external-link-line',
      tooltip: SHORTCUT_ACTION_TOOLTIP,
      tooltipMaxWidth: 260
    }
  },
  'second page should expose next, previous, and right-aligned shortcut actions'
);

const thirdSlide = blueprint.slides[2];
assert.strictEqual(thirdSlide.id, 'search');
assert.deepStrictEqual(
  thirdSlide.copy,
  {
    eyebrow: '',
    title: '精美新标签页',
    body: '支持海量自定义样式，轻松管理你的书签、访问记录。'
  },
  'third page should introduce the customizable new tab page'
);
assert.strictEqual(thirdSlide.visual.kind, 'newtab-preview-surface');
assert.strictEqual(thirdSlide.visual.visible, true);
assert.strictEqual(thirdSlide.cursor.enabled, true);
assert.deepStrictEqual(
  thirdSlide.actions,
  {
    primary: {
      actionId: 'next',
      label: '下一步',
      icon: 'ri-arrow-right-line'
    },
    secondary: null,
    ghost: null
  },
  'third page should expose a lower-left next action instead of a return action'
);

assert.deepStrictEqual(
  blueprint.slides.map((slide) => slide.cursor.enabled),
  [true, true, true, true, true],
  'the animated cursor should remain available on every onboarding page'
);

blueprint.slides.slice(3).forEach((slide) => {
  assert.deepStrictEqual(
    slide.copy,
    { eyebrow: '', title: '', body: '' },
    'only the requested first three pages should contain copy for now'
  );
});
assert.deepStrictEqual(
  blueprint.slides.map((slide) => slide.visual.visible),
  [true, true, true, false, false],
  'the first three pages should show the right-side visual area'
);

const fallback = onboarding.getOnboardingBlueprint('missing-locale');
assert.strictEqual(fallback.locale, 'en', 'unknown locales should fall back to English');

const zh = onboarding.getOnboardingBlueprint('zh-CN');
assert.strictEqual(zh.locale, 'zh_CN', 'BCP-47 Chinese locale should normalize to extension locale key');

assert.deepStrictEqual(
  onboarding.getShortcutDisplayTokens('⌘T'),
  ['⌘', 'T'],
  'compact mac shortcuts should render as separate keycaps'
);
assert.deepStrictEqual(
  onboarding.getShortcutDisplayTokens('⌘⇧K'),
  ['⌘', '⇧', 'K'],
  'compact mac shortcuts with multiple modifiers should render as separate keycaps'
);
assert.deepStrictEqual(
  onboarding.getShortcutDisplayTokens('Command+T', { preferSymbols: true }),
  ['⌘', 'T'],
  'browser shortcut values should still split command and key into separate keycaps'
);
assert.deepStrictEqual(
  onboarding.getShortcutDisplayTokens('Ctrl+T'),
  ['CTRL', 'T'],
  'non-mac shortcuts should keep textual modifier keycaps by default'
);
assert.deepStrictEqual(
  onboarding.parseShortcutHotkey('Command+Shift+K'),
  {
    ctrl: false,
    alt: false,
    shift: true,
    meta: true,
    key: 'k'
  },
  'configured browser command shortcuts should parse into a keydown matcher spec'
);
assert.strictEqual(
  onboarding.shortcutHotkeyMatchesEvent('Command+Shift+K', {
    code: 'KeyK',
    key: 'K',
    ctrlKey: false,
    altKey: false,
    shiftKey: true,
    metaKey: true
  }),
  true,
  'onboarding should match the user-configured command shortcut from browser commands'
);
assert.strictEqual(
  onboarding.shortcutHotkeyMatchesEvent('Ctrl+Shift+Space', {
    code: 'Space',
    key: ' ',
    ctrlKey: true,
    altKey: false,
    shiftKey: true,
    metaKey: false
  }),
  true,
  'onboarding should match special keys returned by browser command shortcuts'
);
assert.strictEqual(
  onboarding.shortcutHotkeyMatchesEvent('Ctrl+Shift+K', {
    code: 'KeyK',
    key: 'K',
    ctrlKey: true,
    altKey: false,
    shiftKey: false,
    metaKey: false
  }),
  false,
  'onboarding should require all configured modifiers before opening the overlay'
);
assert.strictEqual(
  onboarding.formatShortcutForDisplay('⌘T'),
  '⌘T',
  'compact mac display labels should stay visually compact while tokens remain separate'
);

const initial = onboarding.createOnboardingState(blueprint.slides.length, 0);
assert.deepStrictEqual(initial, {
  index: 0,
  previousIndex: 0,
  direction: 'none',
  count: blueprint.slides.length
});

assert.deepStrictEqual(
  onboarding.reduceOnboardingState(initial, { type: 'NEXT' }),
  { index: 1, previousIndex: 0, direction: 'forward', count: blueprint.slides.length },
  'NEXT should advance one page'
);

assert.deepStrictEqual(
  onboarding.reduceOnboardingState(initial, { type: 'PREV' }),
  { index: 0, previousIndex: 0, direction: 'none', count: blueprint.slides.length },
  'PREV should clamp at the first page'
);

assert.deepStrictEqual(
  onboarding.reduceOnboardingState(initial, { type: 'GOTO', index: 99 }),
  {
    index: blueprint.slides.length - 1,
    previousIndex: 0,
    direction: 'forward',
    count: blueprint.slides.length
  },
  'GOTO should clamp to the final page'
);

console.log('onboarding content tests passed');
