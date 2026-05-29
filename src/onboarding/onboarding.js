(function() {
  const MODEL = globalThis.LumnoOnboardingContent || {};
  if (typeof MODEL.getOnboardingBlueprint !== 'function') {
    return;
  }

  const LANGUAGE_STORAGE_KEY = '_x_extension_language_2024_unique_';
  const SHOW_SEARCH_COMMAND_NAME = 'show-search';
  const SHORTCUT_PLACEHOLDER = '{shortcut}';
  const TITLE_CYCLE_INTERVAL_MS = 1900;
  const TEXT_SWAP_FALLBACK_DURATION_MS = 200;
  const ACTION_MESSAGE_BY_ID = Object.freeze({
    openShortcuts: 'openExtensionShortcutsPage',
    openNewtab: 'openNewTab',
    openOptions: 'openOptionsPage'
  });
  const BROWSER_AVATAR_CLASS_BY_ID = Object.freeze({
    chrome: 'browser-avatar--chrome',
    edge: 'browser-avatar--edge',
    dia: 'browser-avatar--dia',
    comet: 'browser-avatar--comet'
  });
  const LUMNO_OVERLAY_QUERY = 'extension';
  const LUMNO_OVERLAY_FAKE_RESULTS = Object.freeze([
    Object.freeze({
      type: 'topSite',
      title: 'Chrome Web Store - Extensions',
      detail: 'https://chromewebstore.google.com/category/extensions',
      sourceTag: '常用',
      favicon: 'https://www.google.com/s2/favicons?domain=chromewebstore.google.com&sz=32',
      actionTagLabel: '新开',
      actionTagKey: 'Enter',
      visitButtonLabel: '新开',
      active: true
    }),
    Object.freeze({
      type: 'bookmark',
      title: 'Chrome Extensions API Reference',
      detail: '书签 / 开发 / Browser extensions',
      sourceTag: '书签',
      sourceTagKind: 'bookmark',
      favicon: 'https://www.google.com/s2/favicons?domain=developer.chrome.com&sz=32',
      visitButtonLabel: '新开'
    }),
    Object.freeze({
      type: 'history',
      title: 'Extensions - Chrome for Developers',
      detail: 'https://developer.chrome.com/docs/extensions',
      sourceTag: '历史',
      favicon: 'https://www.google.com/s2/favicons?domain=developer.chrome.com&sz=32',
      visitButtonLabel: '新开',
      historyDeletable: true
    }),
    Object.freeze({
      type: 'newtab',
      title: '搜索 "extension"',
      visitButtonLabel: '搜索'
    }),
    Object.freeze({
      type: 'browserPage',
      title: '打开 chrome://extensions/',
      visitButtonLabel: '打开'
    })
  ]);

  const params = new URLSearchParams(window.location.search || '');
  const root = document.querySelector('[data-onboarding-shell]');
  const versionText = document.getElementById('onboarding-version-text');
  const progressLabel = document.getElementById('onboarding-progress-label');
  const progressDots = document.getElementById('onboarding-progress-dots');
  const copyPanel = document.getElementById('onboarding-copy-panel');
  const eyebrow = document.getElementById('onboarding-eyebrow');
  const title = document.getElementById('onboarding-title');
  const body = document.getElementById('onboarding-body');
  const bodyPrefix = document.getElementById('onboarding-body-prefix');
  const shortcutLabel = document.getElementById('onboarding-shortcut-label');
  const bodySuffix = document.getElementById('onboarding-body-suffix');
  const interactionSlots = document.getElementById('onboarding-interaction-slots');
  const visualStage = document.getElementById('onboarding-visual-stage');
  const cursorLayer = document.getElementById('onboarding-cursor-layer');
  const copyActions = document.querySelector('.onboarding-copy-actions');
  const primaryActionButton = document.querySelector('.onboarding-action-button--primary');
  const secondaryActionButton = document.querySelector('.onboarding-action-button--secondary');
  const ghostActionButton = document.querySelector('.onboarding-action-button--ghost');
  const prevButton = document.querySelector('[data-onboarding-prev]');
  const nextButton = document.querySelector('[data-onboarding-next]');
  let blueprint = null;
  let state = null;
  let currentShortcutValue = getDefaultShortcutValue();
  let currentShortcutLabel = getDefaultShortcutLabel();
  let titleCycleInterval = 0;
  let titleCycleSwapTimeout = 0;
  let copySwapTimeout = 0;
  let titleCycleIndex = 0;
  const onboardingInfoTooltipController = globalThis.LumnoTooltip &&
      typeof globalThis.LumnoTooltip.createController === 'function'
    ? globalThis.LumnoTooltip.createController({
      id: '_x_extension_onboarding_info_tooltip_2026_unique_',
      className: 'onboarding-info-tooltip',
      maxWidth: 360
    })
    : null;

  function getChromeApi() {
    return typeof chrome !== 'undefined' ? chrome : null;
  }

  function setText(element, value) {
    if (!element) {
      return;
    }
    const text = String(value || '');
    element.textContent = text;
    element.dataset.empty = text ? 'false' : 'true';
  }

  function getCssTimeMs(value, fallback) {
    const raw = String(value || '').trim();
    if (!raw) {
      return fallback;
    }
    const numeric = Number.parseFloat(raw);
    if (!Number.isFinite(numeric)) {
      return fallback;
    }
    return raw.endsWith('s') && !raw.endsWith('ms') ? numeric * 1000 : numeric;
  }

  function getTextSwapDurationMs() {
    if (typeof getComputedStyle !== 'function' || !document.documentElement) {
      return TEXT_SWAP_FALLBACK_DURATION_MS;
    }
    return getCssTimeMs(
      getComputedStyle(document.documentElement).getPropertyValue('--text-swap-dur'),
      TEXT_SWAP_FALLBACK_DURATION_MS
    );
  }

  function prefersReducedMotion() {
    return typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function isMacPlatform() {
    return /Mac|iPhone|iPad|iPod/i.test(String(navigator.platform || ''));
  }

  function getDefaultShortcutValue() {
    return isMacPlatform() ? 'Command+Shift+K' : 'Ctrl+Shift+K';
  }

  function getDefaultShortcutLabel() {
    return formatShortcutForDisplay(getDefaultShortcutValue()) || getDefaultShortcutValue();
  }

  function normalizeShortcutValue(value) {
    return String(value || '').trim().replace(/\s*\+\s*/g, '+');
  }

  function getShortcutDisplayTokens(shortcut) {
    if (typeof MODEL.getShortcutDisplayTokens === 'function') {
      return MODEL.getShortcutDisplayTokens(shortcut, { preferSymbols: isMacPlatform() });
    }
    const value = normalizeShortcutValue(shortcut);
    if (!value) {
      return [];
    }
    const parts = value.split('+').filter(Boolean);
    if (parts.length === 0) {
      return [];
    }
    const shouldUseSymbols = isMacPlatform() || parts.some((part) => /^(?:Command|Cmd|Meta)$/i.test(part));
    const keyToken = parts.pop();
    const tokens = [];
    parts.forEach((token) => {
      const lower = token.toLowerCase();
      if (!shouldUseSymbols) {
        tokens.push(lower === 'command' || lower === 'cmd' || lower === 'meta' ? 'Cmd' : token);
        return;
      }
      if (lower === 'command' || lower === 'cmd' || lower === 'meta') {
        tokens.push('⌘');
      } else if (lower === 'shift') {
        tokens.push('⇧');
      } else if (lower === 'ctrl' || lower === 'control' || lower === 'macctrl') {
        tokens.push('⌃');
      } else if (lower === 'alt' || lower === 'option') {
        tokens.push('⌥');
      }
    });
    const keyMapMac = {
      ArrowUp: '↑',
      ArrowDown: '↓',
      ArrowLeft: '←',
      ArrowRight: '→',
      Enter: '↩',
      Return: '↩',
      Escape: '⎋',
      Esc: '⎋',
      Tab: '⇥',
      Space: 'Space',
      Spacebar: 'Space',
      Comma: ',',
      Period: '.',
      Slash: '/',
      Semicolon: ';',
      Quote: '\'',
      Minus: '-',
      Plus: '+',
      Backslash: '\\',
      Backquote: '`',
      BracketLeft: '[',
      BracketRight: ']'
    };
    const keyMapDefault = {
      ArrowUp: 'Up',
      ArrowDown: 'Down',
      ArrowLeft: 'Left',
      ArrowRight: 'Right',
      Escape: 'Esc',
      Comma: ',',
      Period: '.',
      Slash: '/',
      Semicolon: ';',
      Quote: '\'',
      Minus: '-',
      Plus: '+',
      Backslash: '\\',
      Backquote: '`',
      BracketLeft: '[',
      BracketRight: ']'
    };
    const keyLabel = shouldUseSymbols
      ? (keyMapMac[keyToken] || keyToken)
      : (keyMapDefault[keyToken] || keyToken);
    tokens.push(keyLabel);
    return tokens.map((token) => {
      const text = String(token || '');
      return text.length > 1 ? text.toUpperCase() : text;
    });
  }

  function formatShortcutForDisplay(shortcut) {
    if (typeof MODEL.formatShortcutForDisplay === 'function') {
      return MODEL.formatShortcutForDisplay(shortcut, { preferSymbols: isMacPlatform() });
    }
    const tokens = getShortcutDisplayTokens(shortcut);
    if (tokens.length === 0) {
      return '';
    }
    const value = normalizeShortcutValue(shortcut);
    const shouldUseSymbols = isMacPlatform() || value.split('+').some((part) => /^(?:Command|Cmd|Meta)$/i.test(part));
    return tokens.join(shouldUseSymbols ? '' : '+');
  }

  function loadCurrentShortcut(callback) {
    const chromeApi = getChromeApi();
    const fallback = getDefaultShortcutValue();
    if (!chromeApi || !chromeApi.commands || typeof chromeApi.commands.getAll !== 'function') {
      callback(fallback);
      return;
    }
    try {
      chromeApi.commands.getAll((commands) => {
        if (chromeApi.runtime && chromeApi.runtime.lastError) {
          callback(fallback);
          return;
        }
        const items = Array.isArray(commands) ? commands : [];
        const command = items.find((item) => item && item.name === SHOW_SEARCH_COMMAND_NAME);
        const shortcut = command && typeof command.shortcut === 'string'
          ? command.shortcut
          : '';
        callback(shortcut || fallback);
      });
    } catch (error) {
      callback(fallback);
    }
  }

  function getRuntimeLocale(callback) {
    const chromeApi = getChromeApi();
    const fromParam = params.get('locale') || params.get('lang') || '';
    if (fromParam) {
      callback(MODEL.normalizeLocale(fromParam));
      return;
    }
    if (!chromeApi || !chromeApi.storage) {
      callback(MODEL.normalizeLocale(navigator.language || 'en'));
      return;
    }
    const storageArea = chromeApi.storage.sync || chromeApi.storage.local;
    if (!storageArea || typeof storageArea.get !== 'function') {
      callback(MODEL.normalizeLocale(navigator.language || 'en'));
      return;
    }
    try {
      storageArea.get([LANGUAGE_STORAGE_KEY], (result) => {
        const runtimeError = chromeApi.runtime ? chromeApi.runtime.lastError : null;
        const stored = !runtimeError && result ? result[LANGUAGE_STORAGE_KEY] : '';
        const locale = stored && stored !== 'system'
          ? stored
          : (navigator.language || 'en');
        callback(MODEL.normalizeLocale(locale));
      });
    } catch (e) {
      callback(MODEL.normalizeLocale(navigator.language || 'en'));
    }
  }

  function updateVersionChip() {
    const chromeApi = getChromeApi();
    const versionFromParams = (params.get('version') || '').trim();
    const manifestVersion = chromeApi && chromeApi.runtime && typeof chromeApi.runtime.getManifest === 'function'
      ? String((chromeApi.runtime.getManifest() || {}).version || '').trim()
      : '';
    const version = versionFromParams || (manifestVersion ? `v${manifestVersion}` : '');
    if (!versionText) {
      return;
    }
    versionText.textContent = version || '';
    const chip = versionText.closest('.version-chip');
    if (chip) {
      chip.hidden = !version;
    }
  }

  function createIcon(className) {
    const icon = document.createElement('i');
    icon.className = `ri-icon ${className || 'ri-arrow-right-line'}`;
    icon.setAttribute('aria-hidden', 'true');
    return icon;
  }

  function escapeRegExp(text) {
    return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function createSkeletonLine(className) {
    const line = document.createElement('span');
    line.className = className;
    line.setAttribute('aria-hidden', 'true');
    return line;
  }

  function createBrowserAvatar(browser) {
    const id = String(browser && browser.id || '').trim().toLowerCase();
    const name = String(browser && browser.name || '').trim();
    const src = String(browser && browser.src || '').trim();
    const avatar = document.createElement('span');
    avatar.className = `browser-avatar ${BROWSER_AVATAR_CLASS_BY_ID[id] || 'browser-avatar--fallback'}`;
    avatar.setAttribute('aria-hidden', 'true');
    if (name) {
      avatar.title = name;
    }
    if (src) {
      const image = document.createElement('img');
      image.className = 'browser-avatar-image';
      image.src = src;
      image.alt = '';
      image.decoding = 'async';
      image.setAttribute('aria-hidden', 'true');
      image.addEventListener('error', () => {
        avatar.textContent = (name || id || '?').slice(0, 1).toUpperCase();
      });
      avatar.appendChild(image);
      return avatar;
    }
    avatar.textContent = (name || id || '?').slice(0, 1).toUpperCase();
    return avatar;
  }

  function createBrowserAvatarGroup(browsers) {
    const items = Array.isArray(browsers) ? browsers : [];
    const names = items.map((browser) => browser && browser.name).filter(Boolean);
    const group = document.createElement('span');
    group.className = 'browser-avatar-group';
    group.setAttribute('role', 'img');
    group.setAttribute('aria-label', names.length > 0 ? `${names.join('、')} 等` : '');
    items.forEach((browser) => {
      group.appendChild(createBrowserAvatar(browser));
    });
    const ellipsis = document.createElement('span');
    ellipsis.className = 'browser-avatar-ellipsis';
    ellipsis.setAttribute('aria-hidden', 'true');
    ellipsis.textContent = '…';
    group.appendChild(ellipsis);
    return group;
  }

  function createInteractionRowIcon(iconClass) {
    const className = String(iconClass || '').trim();
    if (!className) {
      return null;
    }
    const iconSlot = document.createElement('span');
    iconSlot.className = 'interaction-row-icon';
    iconSlot.appendChild(createIcon(className));
    return iconSlot;
  }

  function getBrowserTooltipText(browserAvatars) {
    const browsers = browserAvatars && Array.isArray(browserAvatars.browsers)
      ? browserAvatars.browsers
      : [];
    return browsers.map((browser) => browser && browser.name).filter(Boolean).join('、');
  }

  function renderBrowserAvatarTooltip(element, browserAvatars) {
    if (!element) {
      return;
    }
    element.classList.add('onboarding-browser-tooltip');
    element.replaceChildren(createBrowserAvatarGroup(browserAvatars.browsers));
  }

  function positionBrowserAvatarTooltip(element, target) {
    if (!element || !target || typeof target.getBoundingClientRect !== 'function') {
      return;
    }
    element.style.setProperty('max-width', '220px');
    element.style.setProperty('width', 'max-content');
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = element.getBoundingClientRect();
    const margin = 8;
    const spacing = 8;
    let left = targetRect.right + spacing;
    let top = targetRect.top + ((targetRect.height - tooltipRect.height) / 2);
    if (left + tooltipRect.width > window.innerWidth - margin) {
      left = targetRect.left - tooltipRect.width - spacing;
    }
    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipRect.height - margin));
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipRect.width - margin));
    element.style.setProperty('left', `${Math.round(left)}px`);
    element.style.setProperty('top', `${Math.round(top)}px`);
  }

  function renderInfoTooltipContent(element, infoTooltip, browserAvatars, text) {
    if (!element) {
      return;
    }
    if (infoTooltip && infoTooltip.type === 'browser-avatars' && browserAvatars) {
      renderBrowserAvatarTooltip(element, browserAvatars);
      return;
    }
    element.classList.remove('onboarding-browser-tooltip');
    if (globalThis.LumnoTooltip && typeof globalThis.LumnoTooltip.renderText === 'function') {
      globalThis.LumnoTooltip.renderText(element, text);
    }
  }

  function showOnboardingInfoTooltip(button, infoTooltip, browserAvatars) {
    const text = String(infoTooltip && infoTooltip.text || getBrowserTooltipText(browserAvatars) || '').trim();
    if (!onboardingInfoTooltipController || !button || !text) {
      return;
    }
    const options = {
      placement: 'top',
      maxWidth: 360,
      spacing: infoTooltip && infoTooltip.type === 'browser-avatars' ? 24 : 8
    };
    const element = onboardingInfoTooltipController.show(button, text, options);
    renderInfoTooltipContent(element, infoTooltip, browserAvatars, text);
    if (infoTooltip && infoTooltip.type === 'browser-avatars') {
      positionBrowserAvatarTooltip(element, button);
    } else if (globalThis.LumnoTooltip && typeof globalThis.LumnoTooltip.position === 'function') {
      globalThis.LumnoTooltip.position(element, button, options);
    }
  }

  function hideOnboardingInfoTooltip() {
    if (!onboardingInfoTooltipController) {
      return;
    }
    onboardingInfoTooltipController.hide();
  }

  function createInteractionInfoButton(infoTooltip, browserAvatars) {
    const text = String(infoTooltip && infoTooltip.text || getBrowserTooltipText(browserAvatars) || '').trim();
    const button = document.createElement('button');
    button.className = 'interaction-info-button';
    button.type = 'button';
    button.dataset.tooltip = text;
    if (infoTooltip && infoTooltip.type) {
      button.dataset.tooltipType = infoTooltip.type;
    }
    button.setAttribute('aria-label', String(infoTooltip && infoTooltip.label || '说明'));
    button.appendChild(createIcon(String(infoTooltip && infoTooltip.icon || 'ri-information-line')));
    const showTooltip = () => showOnboardingInfoTooltip(button, infoTooltip, browserAvatars);
    button.addEventListener('mouseenter', showTooltip);
    button.addEventListener('mouseleave', hideOnboardingInfoTooltip);
    button.addEventListener('focus', showTooltip);
    button.addEventListener('blur', hideOnboardingInfoTooltip);
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      showTooltip();
    });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        hideOnboardingInfoTooltip();
        button.blur();
      }
    });
    return button;
  }

  function createInteractionLinkButton(linkButton) {
    const href = String(linkButton && linkButton.href || '').trim();
    const label = String(linkButton && linkButton.label || 'GitHub 仓库').trim() || 'GitHub 仓库';
    const tooltip = String(linkButton && linkButton.tooltip || label).trim() || label;
    const link = document.createElement('a');
    link.className = 'interaction-info-button interaction-link-button';
    link.href = href;
    link.target = '_blank';
    link.rel = 'noreferrer noopener';
    link.dataset.tooltip = tooltip;
    link.setAttribute('aria-label', label);
    link.appendChild(createIcon(String(linkButton && linkButton.icon || 'ri-github-fill')));
    const tooltipModel = { text: tooltip };
    const showTooltip = () => showOnboardingInfoTooltip(link, tooltipModel, null);
    link.addEventListener('mouseenter', showTooltip);
    link.addEventListener('mouseleave', hideOnboardingInfoTooltip);
    link.addEventListener('focus', showTooltip);
    link.addEventListener('blur', hideOnboardingInfoTooltip);
    link.addEventListener('click', hideOnboardingInfoTooltip);
    link.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        hideOnboardingInfoTooltip();
        link.blur();
      }
    });
    return link;
  }

  function createInteractionLabel(slot) {
    const label = document.createElement('span');
    label.className = 'interaction-label';
    label.textContent = slot.label;
    return label;
  }

  function createInteractionSlot(slot) {
    const hasAction = Boolean(slot.actionId);
    const hasInfoTooltip = Boolean(slot.infoTooltip && (slot.infoTooltip.text || slot.infoTooltip.type));
    const hasLinkButton = Boolean(slot.linkButton && slot.linkButton.href);
    const hasInlineAffordance = hasInfoTooltip || hasLinkButton;
    const item = document.createElement(hasAction ? 'button' : 'div');
    item.className = `interaction-slot${hasAction ? '' : ' interaction-slot--static'}`;
    if (hasAction) {
      item.type = 'button';
      item.dataset.action = slot.actionId;
    }
    item.dataset.interactionKind = slot.kind;
    if (hasInlineAffordance) {
      item.classList.add('interaction-slot--with-info');
    }

    const copy = document.createElement('span');
    copy.className = 'interaction-copy';
    if (hasInlineAffordance) {
      copy.classList.add('interaction-copy--with-info');
    }
    if (slot.label) {
      copy.appendChild(createInteractionLabel(slot));
    } else {
      copy.appendChild(createSkeletonLine('skeleton-line skeleton-line--label'));
      copy.appendChild(createSkeletonLine('skeleton-line skeleton-line--meta'));
    }
    if (hasInfoTooltip) {
      copy.appendChild(createInteractionInfoButton(slot.infoTooltip, slot.browserAvatars));
    }
    if (hasLinkButton) {
      copy.appendChild(createInteractionLinkButton(slot.linkButton));
    }

    const icon = createInteractionRowIcon(slot.icon);
    if (icon) {
      item.appendChild(icon);
    }
    item.appendChild(copy);
    return item;
  }

  function renderInteractions(slide) {
    if (!interactionSlots) {
      return;
    }
    hideOnboardingInfoTooltip();
    interactionSlots.textContent = '';
    slide.left.interactionSlots.forEach((slot) => {
      interactionSlots.appendChild(createInteractionSlot(slot));
    });
  }

  function createSurfaceRail() {
    const rail = document.createElement('div');
    rail.className = 'surface-rail';
    for (let index = 0; index < 3; index += 1) {
      rail.appendChild(createSkeletonLine('surface-rail-dot'));
    }
    return rail;
  }

  function createSurfacePanel(className, rows) {
    const panel = document.createElement('div');
    panel.className = className;
    for (let index = 0; index < rows; index += 1) {
      panel.appendChild(createSkeletonLine(`surface-row surface-row--${index + 1}`));
    }
    return panel;
  }

  function createGenericVisualSurface() {
    const surface = document.createElement('div');
    surface.className = 'visual-surface';

    const chromeBar = document.createElement('div');
    chromeBar.className = 'surface-chrome';
    chromeBar.appendChild(createSurfaceRail());
    chromeBar.appendChild(createSkeletonLine('surface-address'));

    const bodyGrid = document.createElement('div');
    bodyGrid.className = 'surface-body';
    bodyGrid.appendChild(createSurfacePanel('surface-panel', 4));
    bodyGrid.appendChild(createSurfacePanel('surface-panel', 3));

    surface.appendChild(chromeBar);
    surface.appendChild(bodyGrid);
    return surface;
  }

  function createSuggestionInlineIcon(iconName, tone) {
    const icon = document.createElement('span');
    icon.className = 'x-ov-suggestion-inline-icon';
    if (tone) {
      icon.dataset.tone = tone;
    }
    icon.appendChild(createIcon(iconName));
    return icon;
  }

  function createLumnoOverlayFavicon(result) {
    if (result && (result.type === 'newtab' || result.type === 'googleSuggest')) {
      return createSuggestionInlineIcon('ri-search-line', 'subtext');
    }
    if (result && result.type === 'browserPage') {
      return createSuggestionInlineIcon('ri-link');
    }
    if (result && result.type === 'commandNewTab') {
      return createSuggestionInlineIcon('ri-add-line', 'subtext');
    }
    if (result && result.type === 'commandSettings') {
      return createSuggestionInlineIcon('ri-settings-3-line', 'subtext');
    }
    const src = String(result && result.favicon || '').trim();
    if (!src) {
      return createSuggestionInlineIcon('ri-link');
    }
    const image = document.createElement('img');
    image.className = 'x-ov-suggestion-favicon';
    image.src = src;
    image.alt = '';
    image.decoding = 'async';
    image.loading = 'eager';
    image.referrerPolicy = 'no-referrer';
    image.addEventListener('error', () => {
      if (image.parentNode) {
        image.parentNode.replaceChild(createSuggestionInlineIcon('ri-link'), image);
      }
    });
    return image;
  }

  function appendHighlightedQueryText(target, text, query) {
    const value = String(text || '');
    const needle = String(query || '').trim();
    if (!target || !needle) {
      if (target) {
        target.textContent = value;
      }
      return;
    }
    const parts = value.split(new RegExp(`(${escapeRegExp(needle)})`, 'gi'));
    parts.forEach((part) => {
      if (!part) {
        return;
      }
      if (part.toLowerCase() === needle.toLowerCase()) {
        const mark = document.createElement('mark');
        mark.style.background = 'var(--x-ext-mark-bg, #CFE8FF)';
        mark.style.color = 'var(--x-ext-mark-text, #1E3A8A)';
        mark.style.padding = '0 1px';
        mark.style.borderRadius = '2px';
        mark.style.lineHeight = 'inherit';
        mark.textContent = part;
        target.appendChild(mark);
        return;
      }
      target.appendChild(document.createTextNode(part));
    });
  }

  function createLumnoOverlaySourceTag(result) {
    const sourceTag = document.createElement('span');
    sourceTag.className = 'x-ov-suggestion-source-tag';
    sourceTag.dataset.visible = result.sourceTag ? 'true' : 'false';
    sourceTag.textContent = result.sourceTag || '';
    if (result.sourceTagKind === 'bookmark') {
      sourceTag.style.setProperty('--x-ov-suggestion-source-tag-bg', 'var(--x-ov-bookmark-tag-bg, #FEF3C7)');
      sourceTag.style.setProperty('--x-ov-suggestion-source-tag-text', 'var(--x-ov-bookmark-tag-text, #D97706)');
    }
    return sourceTag;
  }

  function createLumnoOverlayActionTag(labelText, keyLabel) {
    const tag = document.createElement('span');
    tag.className = 'x-ov-action-tag';

    const label = document.createElement('span');
    label.className = 'x-ov-action-tag__label';
    label.textContent = labelText || '新开';

    const keycap = document.createElement('span');
    keycap.className = 'x-ov-action-tag__key';
    keycap.textContent = keyLabel || 'Enter';

    tag.appendChild(label);
    tag.appendChild(keycap);
    return tag;
  }

  function appendInlineLabelWithIcon(container, labelText, iconClass) {
    const label = document.createElement('span');
    label.className = 'x-ov-inline-label';
    label.textContent = labelText || '新开';

    const icon = document.createElement('span');
    icon.className = 'x-ov-inline-icon';
    icon.appendChild(createIcon(iconClass || 'ri-arrow-right-line'));

    container.appendChild(label);
    container.appendChild(icon);
  }

  function createLumnoOverlayResult(result, index, total) {
    const item = document.createElement('div');
    item.className = 'x-ov-suggestion-item lumno-overlay-result';
    item.dataset.active = result.active ? 'true' : 'false';
    item.dataset.type = result.type || '';
    item.dataset.last = index === total - 1 ? 'true' : 'false';
    item.style.setProperty('--result-index', String(index));

    const leftSide = document.createElement('div');
    leftSide.className = 'x-ov-suggestion-left';
    leftSide.dataset.motion = 'true';

    const iconSlot = document.createElement('span');
    iconSlot.className = 'x-ov-suggestion-icon-slot';
    iconSlot.appendChild(createLumnoOverlayFavicon(result));

    const textWrapper = document.createElement('div');
    textWrapper.className = 'x-ov-suggestion-text';

    const titleNode = document.createElement('span');
    titleNode.className = 'x-ov-suggestion-title';
    appendHighlightedQueryText(titleNode, result.title, LUMNO_OVERLAY_QUERY);
    textWrapper.appendChild(titleNode);

    if (result.detail) {
      const detailNode = document.createElement('span');
      detailNode.className = result.type === 'bookmark'
        ? 'x-ov-suggestion-bookmark-path'
        : 'x-ov-suggestion-url-line';
      detailNode.textContent = result.detail || '';
      textWrapper.appendChild(detailNode);
    }

    const sourceTag = createLumnoOverlaySourceTag(result);
    if (result.sourceTag) {
      textWrapper.appendChild(sourceTag);
    }

    leftSide.appendChild(iconSlot);
    leftSide.appendChild(textWrapper);

    const rightSide = document.createElement('div');
    rightSide.className = 'x-ov-suggestion-right';

    const actionTags = document.createElement('div');
    actionTags.className = 'x-ov-suggestion-action-tags';
    actionTags.dataset.visible = result.active && result.actionTagLabel ? 'true' : 'false';
    if (result.actionTagLabel) {
      actionTags.appendChild(createLumnoOverlayActionTag(result.actionTagLabel, result.actionTagKey));
    }

    const visitButton = document.createElement('button');
    visitButton.type = 'button';
    visitButton.className = 'x-ov-suggestion-action-button x-ov-suggestion-visit-button';
    visitButton.dataset.visible = result.active && result.actionTagLabel ? 'false' : 'true';
    appendInlineLabelWithIcon(visitButton, result.visitButtonLabel, 'ri-arrow-right-line');

    let historyDeleteSlot = null;
    if (result.historyDeletable) {
      historyDeleteSlot = document.createElement('div');
      historyDeleteSlot.className = 'x-ov-history-delete-slot';
      historyDeleteSlot.dataset.visible = 'false';
      const historyDeleteButton = document.createElement('button');
      historyDeleteButton.type = 'button';
      historyDeleteButton.className = 'x-ov-history-delete-button';
      historyDeleteButton.dataset.visible = 'false';
      historyDeleteButton.setAttribute('aria-label', '移除该历史');
      historyDeleteButton.appendChild(createIcon('ri-delete-bin-6-line'));
      historyDeleteSlot.appendChild(historyDeleteButton);
    }

    rightSide.appendChild(actionTags);
    rightSide.appendChild(visitButton);
    if (historyDeleteSlot) {
      rightSide.appendChild(historyDeleteSlot);
    }

    item.appendChild(leftSide);
    item.appendChild(rightSide);
    return item;
  }

  function createLumnoOverlaySurface() {
    const panel = document.createElement('div');
    panel.id = '_x_extension_overlay_2024_unique_';
    panel.className = 'lumno-overlay-panel';
    panel.setAttribute('aria-label', 'Lumno overlay demo');

    const inputRoot = document.createElement('div');
    inputRoot.className = 'x-lumno-search-input x-lumno-search-input__container';

    const searchIcon = document.createElement('span');
    searchIcon.className = 'x-lumno-search-input__icon';
    searchIcon.appendChild(createIcon('ri-search-2-line'));

    const query = document.createElement('div');
    query.className = 'x-lumno-search-input__field lumno-overlay-query';
    query.setAttribute('role', 'searchbox');
    query.setAttribute('aria-label', 'Search Lumno demo');
    query.appendChild(document.createTextNode(LUMNO_OVERLAY_QUERY));

    const caret = document.createElement('span');
    caret.className = 'lumno-overlay-query-caret';
    caret.setAttribute('aria-hidden', 'true');
    query.appendChild(caret);

    const modeBadge = document.createElement('div');
    modeBadge.className = 'x-lumno-search-input-mode__badge';
    modeBadge.dataset.surface = 'overlay';
    modeBadge.dataset.visible = 'false';

    const rightIcon = document.createElement('button');
    rightIcon.type = 'button';
    rightIcon.className = 'x-lumno-search-input__right-icon';
    rightIcon.setAttribute('aria-label', 'Settings');
    rightIcon.appendChild(createIcon('ri-settings-line'));

    const closeOtherTabsButton = document.createElement('button');
    closeOtherTabsButton.type = 'button';
    closeOtherTabsButton.className = 'x-ov-close-other-tabs';
    closeOtherTabsButton.setAttribute('aria-label', '清理本页外的其他标签页（除置顶与群组）');
    closeOtherTabsButton.appendChild(createIcon('ri-brush-2-line'));

    const divider = document.createElement('span');
    divider.className = 'x-lumno-search-input__divider';

    inputRoot.appendChild(searchIcon);
    inputRoot.appendChild(query);
    inputRoot.appendChild(divider);
    inputRoot.appendChild(rightIcon);
    inputRoot.appendChild(closeOtherTabsButton);
    inputRoot.appendChild(modeBadge);

    const results = document.createElement('div');
    results.className = 'x-ov-suggestions-container lumno-overlay-results';
    LUMNO_OVERLAY_FAKE_RESULTS.forEach((result, index) => {
      results.appendChild(createLumnoOverlayResult(result, index, LUMNO_OVERLAY_FAKE_RESULTS.length));
    });

    panel.appendChild(inputRoot);
    panel.appendChild(results);
    return panel;
  }

  function createBrowserPageSection(className, lineClasses) {
    const section = document.createElement('div');
    section.className = `browser-page-section ${className || ''}`.trim();
    (lineClasses || []).forEach((lineClass) => {
      section.appendChild(createSkeletonLine(`browser-page-line ${lineClass}`.trim()));
    });
    return section;
  }

  function createBrowserPageSkeleton() {
    const page = document.createElement('div');
    page.className = 'browser-page-skeleton';

    const main = document.createElement('div');
    main.className = 'browser-page-main';

    const hero = document.createElement('div');
    hero.className = 'browser-page-section browser-page-hero';
    hero.appendChild(createSkeletonLine('browser-page-title'));
    hero.appendChild(createSkeletonLine('browser-page-line browser-page-line--wide'));
    hero.appendChild(createSkeletonLine('browser-page-line browser-page-line--mid'));
    hero.appendChild(createSkeletonLine('browser-page-line browser-page-line--short'));

    const rows = document.createElement('div');
    rows.className = 'browser-page-section';
    for (let index = 0; index < 4; index += 1) {
      const row = document.createElement('span');
      row.className = 'browser-page-row';
      row.setAttribute('aria-hidden', 'true');
      rows.appendChild(row);
    }

    const sidebar = document.createElement('div');
    sidebar.className = 'browser-page-sidebar';
    sidebar.appendChild(createBrowserPageSection('', [
      'browser-page-line--wide',
      'browser-page-line--mid',
      'browser-page-line--short'
    ]));
    sidebar.appendChild(createBrowserPageSection('', [
      'browser-page-line--wide',
      'browser-page-line--mid'
    ]));

    main.appendChild(hero);
    main.appendChild(rows);
    page.appendChild(main);
    page.appendChild(sidebar);
    return page;
  }

  function createBrowserTabs() {
    const tabs = document.createElement('div');
    tabs.className = 'browser-tabs';
    tabs.appendChild(createSkeletonLine('browser-tab'));
    tabs.appendChild(createSkeletonLine('browser-tab browser-tab--muted'));
    return tabs;
  }

  function createBrowserActions() {
    const actions = document.createElement('div');
    actions.className = 'browser-actions';
    for (let index = 0; index < 2; index += 1) {
      const dot = document.createElement('span');
      dot.className = 'browser-action-dot';
      dot.setAttribute('aria-hidden', 'true');
      actions.appendChild(dot);
    }
    return actions;
  }

  function createBookmarkFocusSurface() {
    const rootNode = document.createElement('div');
    rootNode.className = 'bookmark-focus-ui';

    const browserWindow = document.createElement('div');
    browserWindow.className = 'browser-window';

    const browserBar = document.createElement('div');
    browserBar.className = 'browser-bar';
    browserBar.appendChild(createSurfaceRail());
    browserBar.appendChild(createBrowserTabs());
    browserBar.appendChild(createSkeletonLine('browser-address'));
    browserBar.appendChild(createBrowserActions());

    browserWindow.appendChild(browserBar);
    browserWindow.appendChild(createBrowserPageSkeleton());

    rootNode.appendChild(browserWindow);
    rootNode.appendChild(createLumnoOverlaySurface());
    return rootNode;
  }

  function createDemoCursorSvg() {
    const namespace = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(namespace, 'svg');
    svg.setAttribute('class', 'figma-cursor');
    svg.setAttribute('viewBox', '0 0 48 58');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const cursorPath = 'M8.3 5.9 C7.0 5.0 5.7 6.1 6.3 7.7 L17.1 52.1 C17.7 54.7 21.1 55.0 22.2 52.5 L28.8 36.9 C29.2 36.0 29.9 35.4 30.8 35.1 L43.0 30.5 C45.9 29.5 46.2 25.7 43.5 24.2 L8.3 5.9 Z';

    const outline = document.createElementNS(namespace, 'path');
    outline.setAttribute('class', 'figma-cursor__outline');
    outline.setAttribute('d', cursorPath);
    outline.setAttribute('stroke-linejoin', 'round');
    outline.setAttribute('stroke-linecap', 'round');

    const fill = document.createElementNS(namespace, 'path');
    fill.setAttribute('class', 'figma-cursor__fill');
    fill.setAttribute('d', cursorPath);
    fill.setAttribute('stroke-linejoin', 'round');
    fill.setAttribute('stroke-linecap', 'round');
    fill.setAttribute('stroke-width', '3');
    fill.setAttribute('fill', '#303030');
    fill.setAttribute('stroke', '#303030');

    svg.appendChild(outline);
    svg.appendChild(fill);
    return svg;
  }

  function renderVisualSurface(slide) {
    if (!visualStage) {
      return;
    }
    visualStage.textContent = '';
    visualStage.dataset.visualKind = slide.visual.kind;
    if (cursorLayer) {
      cursorLayer.textContent = '';
      cursorLayer.dataset.cursorEnabled = 'false';
    }
    if (!slide.visual.visible) {
      return;
    }
    if (slide.visual.kind === 'bookmark-focus-surface') {
      visualStage.appendChild(createBookmarkFocusSurface());
    } else {
      visualStage.appendChild(createGenericVisualSurface());
    }
    renderCursor(slide);
  }

  function renderActionButton(button, action) {
    if (!button) {
      return false;
    }
    const normalizedAction = action || null;
    button.hidden = !normalizedAction;
    button.disabled = !normalizedAction;
    if (!normalizedAction) {
      button.removeAttribute('data-action');
      button.removeAttribute('aria-label');
      return false;
    }
    button.dataset.action = normalizedAction.actionId;
    button.setAttribute('aria-label', normalizedAction.label);
    const labelNode = button.querySelector('span');
    if (labelNode) {
      labelNode.textContent = normalizedAction.label;
    }
    const icon = button.querySelector('.ri-icon');
    if (icon) {
      const iconClass = String(normalizedAction.icon || '').trim();
      icon.hidden = !iconClass;
      icon.className = `ri-icon ri-size-14 ${iconClass}`.trim();
    }
    return true;
  }

  function renderCopyActions(slide) {
    if (!copyActions) {
      return;
    }
    const actions = slide.actions || {};
    const hasPrimary = renderActionButton(primaryActionButton, actions.primary);
    const hasSecondary = renderActionButton(secondaryActionButton, actions.secondary);
    const hasGhost = renderActionButton(ghostActionButton, actions.ghost);
    const visible = hasPrimary || hasSecondary || hasGhost;
    copyActions.hidden = !visible;
    copyActions.dataset.visible = visible ? 'true' : 'false';
  }

  function renderCursor(slide) {
    if (!cursorLayer) {
      return;
    }
    cursorLayer.textContent = '';
    cursorLayer.dataset.cursorEnabled = slide.cursor.enabled ? 'true' : 'false';
    if (!slide.cursor.enabled) {
      return;
    }
    const cursor = document.createElement('span');
    cursor.className = 'demo-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.appendChild(createDemoCursorSvg());
    cursorLayer.appendChild(cursor);
  }

  function updateProgress() {
    if (!blueprint || !state) {
      return;
    }
    const current = state.index + 1;
    const total = blueprint.slides.length;
    if (progressLabel) {
      progressLabel.textContent = `${current} / ${total}`;
    }
    if (progressDots) {
      progressDots.textContent = '';
      blueprint.slides.forEach((slide, index) => {
        const dot = document.createElement('button');
        dot.className = 'progress-dot';
        dot.type = 'button';
        dot.dataset.slideTarget = String(index);
        dot.dataset.active = index === state.index ? 'true' : 'false';
        dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
        dot.appendChild(createSkeletonLine('progress-dot-mark'));
        progressDots.appendChild(dot);
      });
    }
    if (prevButton) {
      prevButton.disabled = state.index <= 0;
    }
    if (nextButton) {
      nextButton.disabled = state.index >= total - 1;
    }
  }

  function renderBodyCopy(slide) {
    const value = String(slide.copy.body || '');
    if (!body) {
      return;
    }
    body.dataset.empty = value ? 'false' : 'true';
    if (!bodyPrefix || !shortcutLabel || !bodySuffix) {
      setText(body, value.replace(SHORTCUT_PLACEHOLDER, currentShortcutLabel));
      return;
    }
    if (!value.includes(SHORTCUT_PLACEHOLDER)) {
      bodyPrefix.textContent = value;
      shortcutLabel.textContent = '';
      shortcutLabel.hidden = true;
      bodySuffix.textContent = '';
      return;
    }
    const parts = value.split(SHORTCUT_PLACEHOLDER);
    bodyPrefix.textContent = parts[0] || '';
    renderShortcutLabel();
    bodySuffix.textContent = parts.slice(1).join(SHORTCUT_PLACEHOLDER);
  }

  function renderShortcutLabel() {
    if (!shortcutLabel) {
      return;
    }
    shortcutLabel.textContent = '';
    shortcutLabel.hidden = !currentShortcutLabel;
    if (!currentShortcutLabel) {
      shortcutLabel.removeAttribute('aria-label');
      return;
    }
    const tokens = getShortcutDisplayTokens(currentShortcutValue);
    const labels = tokens.length > 0 ? tokens : [currentShortcutLabel];
    shortcutLabel.setAttribute('aria-label', normalizeShortcutValue(currentShortcutValue) || currentShortcutLabel);
    labels.forEach((label) => {
      const keycap = document.createElement('span');
      keycap.className = 'shortcut-keycap';
      const text = String(label || '');
      if (text.length > 1) {
        const minWidth = Math.max(24, Math.round(text.length * 7.5 + 14));
        keycap.style.minWidth = `${minWidth}px`;
      }
      keycap.textContent = text;
      shortcutLabel.appendChild(keycap);
    });
  }

  function stopTitleCycle() {
    if (titleCycleInterval) {
      window.clearInterval(titleCycleInterval);
      titleCycleInterval = 0;
    }
    if (titleCycleSwapTimeout) {
      window.clearTimeout(titleCycleSwapTimeout);
      titleCycleSwapTimeout = 0;
    }
    titleCycleIndex = 0;
  }

  function getTitleCycleItems(titleCycle) {
    return titleCycle && Array.isArray(titleCycle.items)
      ? titleCycle.items.filter((item) => item && item.label && item.tone)
      : [];
  }

  function setTitleCycleItem(rotator, item) {
    const textNode = rotator
      ? rotator.querySelector('[data-title-rotator-text]')
      : null;
    if (!rotator || !textNode || !item) {
      return;
    }
    setTitleCycleWidth(rotator, item.label);
    rotator.dataset.tone = item.tone;
    textNode.textContent = item.label;
  }

  function getTitleCycleMeasureNode(rotator) {
    if (!rotator) {
      return null;
    }
    let measureNode = rotator.querySelector('[data-title-rotator-measure]');
    if (measureNode) {
      return measureNode;
    }
    measureNode = document.createElement('span');
    measureNode.className = 'title-rotator__measure';
    measureNode.setAttribute('data-title-rotator-measure', '');
    measureNode.setAttribute('aria-hidden', 'true');
    rotator.appendChild(measureNode);
    return measureNode;
  }

  function measureTitleCycleWidth(rotator, label) {
    const measureNode = getTitleCycleMeasureNode(rotator);
    if (!rotator || !measureNode) {
      return 0;
    }
    measureNode.textContent = String(label || '');
    const style = getComputedStyle(rotator);
    const padding = (Number.parseFloat(style.paddingLeft) || 0) +
      (Number.parseFloat(style.paddingRight) || 0);
    return Math.ceil(measureNode.getBoundingClientRect().width + padding);
  }

  function setTitleCycleWidth(rotator, label) {
    const width = measureTitleCycleWidth(rotator, label);
    if (width > 0) {
      rotator.style.width = `${width}px`;
    }
  }

  function swapTitleCycleItem(rotator, item) {
    const textNode = rotator
      ? rotator.querySelector('[data-title-rotator-text]')
      : null;
    if (!rotator || !textNode || !item) {
      return;
    }
    if (prefersReducedMotion()) {
      setTitleCycleItem(rotator, item);
      return;
    }
    if (titleCycleSwapTimeout) {
      window.clearTimeout(titleCycleSwapTimeout);
      titleCycleSwapTimeout = 0;
    }
    setTitleCycleWidth(rotator, item.label);
    textNode.classList.add('is-exit');
    titleCycleSwapTimeout = window.setTimeout(() => {
      titleCycleSwapTimeout = 0;
      if (!rotator.isConnected || !textNode.isConnected) {
        return;
      }
      rotator.dataset.tone = item.tone;
      textNode.textContent = item.label;
      textNode.classList.remove('is-exit');
      textNode.classList.add('is-enter-start');
      void textNode.offsetHeight;
      textNode.classList.remove('is-enter-start');
    }, getTextSwapDurationMs());
  }

  function startTitleCycle(rotator, items) {
    stopTitleCycle();
    const safeItems = Array.isArray(items) ? items : [];
    if (!rotator || safeItems.length < 2 || prefersReducedMotion()) {
      return;
    }
    titleCycleIndex = 0;
    titleCycleInterval = window.setInterval(() => {
      titleCycleIndex = (titleCycleIndex + 1) % safeItems.length;
      swapTitleCycleItem(rotator, safeItems[titleCycleIndex]);
    }, TITLE_CYCLE_INTERVAL_MS);
  }

  function createTitleLogoMark(titleLogo) {
    if (!titleLogo || !titleLogo.src) {
      return null;
    }
    const logo = document.createElement('img');
    logo.className = 'title-logo-mark';
    logo.src = String(titleLogo.src || '');
    logo.alt = '';
    logo.decoding = 'async';
    logo.loading = 'eager';
    logo.setAttribute('aria-hidden', 'true');
    const label = String(titleLogo.label || '').trim();
    if (label) {
      logo.title = label;
    }
    return logo;
  }

  function appendTitleLine(text, titleLogo) {
    const span = document.createElement('span');
    const logo = createTitleLogoMark(titleLogo);
    span.className = logo ? 'title-line title-line--with-logo' : 'title-line';
    span.appendChild(document.createTextNode(String(text || '')));
    if (logo) {
      span.appendChild(logo);
    }
    title.appendChild(span);
  }

  function renderTitleCycleCopy(slide, lines) {
    const titleCycle = slide.copy.titleCycle || null;
    const items = getTitleCycleItems(titleCycle);
    if (items.length === 0) {
      return false;
    }
    title.setAttribute('aria-label', String(slide.copy.title || ''));

    const firstLine = document.createElement('span');
    firstLine.className = 'title-line title-line--rotating';
    firstLine.appendChild(document.createTextNode(String(titleCycle.prefix || '')));

    const rotator = document.createElement('span');
    rotator.className = 'title-rotator t-resize';
    rotator.dataset.tone = items[0].tone;
    rotator.setAttribute('aria-hidden', 'true');
    rotator.setAttribute('data-title-rotator', '');

    const textNode = document.createElement('span');
    textNode.className = 'title-rotator__text t-text-swap';
    textNode.setAttribute('data-title-rotator-text', '');
    textNode.textContent = items[0].label;
    rotator.appendChild(textNode);
    firstLine.appendChild(rotator);
    title.appendChild(firstLine);
    setTitleCycleWidth(rotator, items[0].label);

    const secondLine = String(lines[1] || '');
    if (secondLine) {
      const breakNode = document.createElement('br');
      breakNode.className = 'title-break';
      breakNode.setAttribute('aria-hidden', 'true');
      title.appendChild(breakNode);
      appendTitleLine(secondLine, slide.copy.titleLogo);
    }

    startTitleCycle(rotator, items);
    return true;
  }

  function renderTitleCopy(slide) {
    if (!title) {
      return;
    }
    stopTitleCycle();
    const text = String(slide.copy.title || '');
    const lines = Array.isArray(slide.copy.titleLines) ? slide.copy.titleLines : [];
    title.dataset.empty = text ? 'false' : 'true';
    title.textContent = '';
    title.removeAttribute('aria-label');
    if (renderTitleCycleCopy(slide, lines)) {
      return;
    }
    if (lines.length === 0) {
      title.textContent = text;
      return;
    }
    lines.forEach((line, index) => {
      if (index > 0) {
        const breakNode = document.createElement('br');
        breakNode.className = 'title-break';
        breakNode.setAttribute('aria-hidden', 'true');
        title.appendChild(breakNode);
      }
      appendTitleLine(String(line || ''), index === lines.length - 1 ? slide.copy.titleLogo : null);
    });
  }

  function render() {
    if (!blueprint || !state) {
      return;
    }
    const slide = MODEL.getSlideByIndex(blueprint, state.index);
    if (!slide || !root) {
      return;
    }
    root.dataset.activeSlide = slide.id;
    root.dataset.activeIndex = String(state.index);
    root.dataset.direction = state.direction;
    root.dataset.cursorReady = slide.cursor.enabled ? 'true' : 'false';
    root.dataset.visualVisible = slide.visual.visible ? 'true' : 'false';
    document.documentElement.lang = blueprint.htmlLang || 'en';
    document.title = `${blueprint.brand} Onboarding`;

    if (copyPanel) {
      copyPanel.dataset.slideId = slide.id;
    }
    setText(eyebrow, slide.copy.eyebrow);
    renderTitleCopy(slide);
    renderBodyCopy(slide);
    renderInteractions(slide);
    renderCopyActions(slide);
    renderVisualSurface(slide);
    updateProgress();
  }

  function getCopySwapTargets() {
    return [title, body].filter(Boolean);
  }

  function clearCopySwapClasses() {
    getCopySwapTargets().forEach((element) => {
      element.classList.remove('t-copy-swap', 'is-exit', 'is-enter-start');
    });
  }

  function commitState(nextState) {
    state = nextState;
    render();
  }

  function animateCopySwap(nextState) {
    if (copySwapTimeout) {
      window.clearTimeout(copySwapTimeout);
      copySwapTimeout = 0;
    }
    const targets = getCopySwapTargets();
    if (targets.length === 0 || prefersReducedMotion()) {
      clearCopySwapClasses();
      commitState(nextState);
      return;
    }
    targets.forEach((element) => {
      element.classList.add('t-copy-swap');
      element.classList.remove('is-enter-start');
      element.classList.add('is-exit');
    });
    copySwapTimeout = window.setTimeout(() => {
      copySwapTimeout = 0;
      commitState(nextState);
      const nextTargets = getCopySwapTargets();
      nextTargets.forEach((element) => {
        element.classList.add('t-copy-swap', 'is-enter-start');
        element.classList.remove('is-exit');
      });
      nextTargets.forEach((element) => {
        void element.offsetHeight;
      });
      nextTargets.forEach((element) => {
        element.classList.remove('is-enter-start');
      });
    }, getTextSwapDurationMs());
  }

  function dispatch(action) {
    if (!state || !blueprint) {
      return;
    }
    const nextState = MODEL.reduceOnboardingState(state, action);
    if (nextState.index === state.index || nextState.direction === 'none') {
      commitState(nextState);
      return;
    }
    animateCopySwap(nextState);
  }

  function runExtensionAction(actionId) {
    const id = String(actionId || '');
    if (!id) {
      return;
    }
    if (id === 'next') {
      dispatch({ type: 'NEXT' });
      return;
    }
    if (id === 'prev') {
      dispatch({ type: 'PREV' });
      return;
    }

    const chromeApi = getChromeApi();
    const messageAction = ACTION_MESSAGE_BY_ID[id];
    if (!messageAction || !chromeApi || !chromeApi.runtime || typeof chromeApi.runtime.sendMessage !== 'function') {
      return;
    }
    chromeApi.runtime.sendMessage({ action: messageAction }, () => {});
  }

  document.addEventListener('click', (event) => {
    const target = event.target && event.target.closest
      ? event.target.closest('[data-action], [data-slide-target], [data-onboarding-prev], [data-onboarding-next]')
      : null;
    if (!target) {
      return;
    }
    event.preventDefault();
    if (target.hasAttribute('data-onboarding-prev')) {
      dispatch({ type: 'PREV' });
      return;
    }
    if (target.hasAttribute('data-onboarding-next')) {
      dispatch({ type: 'NEXT' });
      return;
    }
    if (target.dataset.slideTarget) {
      dispatch({ type: 'GOTO', index: Number(target.dataset.slideTarget) });
      return;
    }
    runExtensionAction(target.dataset.action);
  });

  document.addEventListener('keydown', (event) => {
    if (!event || event.defaultPrevented) {
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      dispatch({ type: 'NEXT' });
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      dispatch({ type: 'PREV' });
    } else if (event.key === 'Home') {
      event.preventDefault();
      dispatch({ type: 'HOME' });
    } else if (event.key === 'End') {
      event.preventDefault();
      dispatch({ type: 'END' });
    }
  });

  getRuntimeLocale((locale) => {
    blueprint = MODEL.getOnboardingBlueprint(locale);
    const requestedIndex = Number(params.get('slide') || 0);
    state = MODEL.createOnboardingState(blueprint.slides.length, requestedIndex);
    updateVersionChip();
    render();
    loadCurrentShortcut((shortcut) => {
      const nextShortcutLabel = formatShortcutForDisplay(shortcut) || getDefaultShortcutLabel();
      if (shortcut && nextShortcutLabel !== currentShortcutLabel) {
        currentShortcutValue = shortcut;
        currentShortcutLabel = nextShortcutLabel;
        render();
      }
    });
  });
})();
