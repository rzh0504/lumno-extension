(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoOnboardingContent = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const SUPPORTED_LOCALES = Object.freeze(['zh_CN', 'zh_TW', 'ja', 'en']);
  const LUMNO_GITHUB_HOMEPAGE_URL = 'https://github.com/kubai087/lumno-extension';
  const EMPTY_COPY = Object.freeze({ eyebrow: '', title: '', body: '' });
  const FIRST_SLIDE_TITLE_CYCLE = Object.freeze({
    prefix: '让浏览器的',
    items: Object.freeze([
      Object.freeze({ id: 'bookmark', label: '书签', tone: 'bookmark' }),
      Object.freeze({ id: 'history', label: '历史', tone: 'history' }),
      Object.freeze({ id: 'top-sites', label: '常用网站', tone: 'top-sites' }),
      Object.freeze({ id: 'settings', label: '设置项', tone: 'settings' })
    ])
  });
  const FIRST_SLIDE_COPY = Object.freeze({
    eyebrow: '',
    title: '让浏览器的书签一搜即达',
    titleLines: Object.freeze(['让浏览器的书签', '一搜即达']),
    titleLogo: Object.freeze({
      label: 'Lumno',
      src: '../../assets/images/lumno.png'
    }),
    titleCycle: FIRST_SLIDE_TITLE_CYCLE,
    body: '开源浏览器聚焦搜索 & 极简新标签页'
  });
  const FOCUS_SEARCH_COPY = Object.freeze({
    eyebrow: '',
    title: '原生聚焦搜索体验',
    body: '在任意网站按下快捷键{shortcut}，唤起聚焦搜索悬浮窗。'
  });
  const DIA_BROWSER_DISCLOSURE_TEXT =
    '在 Dia 中，若聚焦搜索浮窗的快捷键不可用，请进入浏览器的快捷键设置页面，将“Open command bar”从“In Dia”改为“Global”。';
  const SHORTCUTS_PAGE_URL = 'chrome://extensions/shortcuts';
  const LOCAL_FILE_ACCORDION_TEXT =
    '请前往扩展程序详情页，为 Lumno 开启“允许访问文件网址”，开启后刷新对应标签页。';
  const EXTENSION_DETAILS_URL = 'chrome://extensions/?id=nkbkcafoocmnnconoijmhloecgamfcai';
  const NEWTAB_COPY = Object.freeze({
    eyebrow: '',
    title: '精美新标签页',
    body: '支持海量自定义样式，轻松管理你的书签、访问记录。'
  });
  const BROWSER_AVATAR_ROW = Object.freeze({
    prefix: '支持',
    suffix: '主流浏览器',
    browsers: Object.freeze([
      Object.freeze({ id: 'chrome', name: 'Chrome', src: '../../assets/images/browser-logos/google-chrome-2022.svg' }),
      Object.freeze({ id: 'edge', name: 'Edge', src: '../../assets/images/browser-logos/microsoft-edge-2019.svg' }),
      Object.freeze({ id: 'dia', name: 'Dia', src: '../../assets/images/browser-logos/dia.jpg' }),
      Object.freeze({ id: 'comet', name: 'Comet', src: '../../assets/images/browser-logos/comet.jpg' })
    ])
  });
  const FIRST_SLIDE_ROWS = Object.freeze([
    Object.freeze({
      kind: 'trust-row',
      icon: 'ri-shield-check-line',
      label: '开源、无隐私风险、注重用户体验',
      linkButton: Object.freeze({
        icon: 'ri-github-fill',
        label: 'GitHub 仓库',
        tooltip: '以 GPL-3.0 许可证开源，点击访问 GitHub 仓库',
        href: LUMNO_GITHUB_HOMEPAGE_URL
      })
    }),
    Object.freeze({
      kind: 'browser-row',
      icon: 'ri-chrome-line',
      label: '支持主流浏览器',
      browserAvatars: BROWSER_AVATAR_ROW,
      infoTooltip: Object.freeze({
        icon: 'ri-information-line',
        label: '支持的浏览器',
        type: 'browser-avatars'
      })
    }),
    Object.freeze({
      kind: 'compatibility-row',
      icon: 'ri-puzzle-line',
      label: '兼容其他新标签页插件',
      infoTooltip: Object.freeze({
        icon: 'ri-information-line',
        label: '兼容说明',
        text: '受 Chrome 限制，Lumno 无法提供单独关闭新标签页的入口，但它可以与其他新标签页插件同时使用。\n具体而言，安装 Lumno 后，再覆盖安装或重新启用你正在使用的新标签页插件，让它继续接管新标签页即可。'
      })
    })
  ]);
  const VISUAL_MOUNT_ID = 'onboarding-visual-stage';
  const CURSOR_MOUNT_ID = 'onboarding-cursor-layer';

  const LOCALE_META = Object.freeze({
    zh_CN: Object.freeze({ locale: 'zh_CN', htmlLang: 'zh-CN' }),
    zh_TW: Object.freeze({ locale: 'zh_TW', htmlLang: 'zh-TW' }),
    ja: Object.freeze({ locale: 'ja', htmlLang: 'ja' }),
    en: Object.freeze({ locale: 'en', htmlLang: 'en' })
  });

  const SLIDE_SLOTS = Object.freeze([
    Object.freeze({
      id: 'intro',
      copy: FIRST_SLIDE_COPY,
      visualKind: 'lumno-web-wordmark-surface',
      visualVisible: true,
      interactionRows: FIRST_SLIDE_ROWS,
      cursorEnabled: true,
      actions: Object.freeze({
        primary: Object.freeze({
          actionId: 'next',
          label: '快速上手',
          icon: 'ri-arrow-right-line'
        })
      })
    }),
    Object.freeze({
      id: 'setup',
      copy: FOCUS_SEARCH_COPY,
      visualKind: 'bookmark-focus-surface',
      visualVisible: true,
      interactionRows: Object.freeze([
        Object.freeze({
          kind: 'accordion-row',
          actionId: 'toggleInteractionAccordion',
          accordionId: 'dia-browser',
          icon: 'ri-question-fill',
          label: '致 Dia 浏览器用户',
          accordion: Object.freeze({
            icon: 'ri-arrow-left-s-line',
            text: DIA_BROWSER_DISCLOSURE_TEXT,
            links: Object.freeze([
              Object.freeze({
                label: '快捷键设置页面',
                href: SHORTCUTS_PAGE_URL,
                actionId: 'openShortcuts'
              })
            ]),
            expandedByDefault: false
          })
        }),
        Object.freeze({
          kind: 'accordion-row',
          actionId: 'toggleInteractionAccordion',
          accordionId: 'local-file-search',
          icon: 'ri-question-fill',
          label: '在本地 PDF/HTML 标签页中使用聚焦搜索',
          accordion: Object.freeze({
            icon: 'ri-arrow-left-s-line',
            text: LOCAL_FILE_ACCORDION_TEXT,
            links: Object.freeze([
              Object.freeze({
                label: '扩展程序详情页',
                href: EXTENSION_DETAILS_URL,
                actionId: 'openExtensionDetails'
              })
            ]),
            expandedByDefault: false
          })
        })
      ]),
      cursorEnabled: true,
      actions: Object.freeze({
        primary: Object.freeze({
          actionId: 'next',
          label: '下一步',
          icon: 'ri-arrow-right-line'
        }),
        secondary: Object.freeze({
          actionId: 'prev',
          label: '返回'
        }),
        ghost: Object.freeze({
          actionId: 'openShortcuts',
          label: '更换快捷键',
          icon: 'ri-external-link-line',
          tooltip: '由于浏览器的限制，请在 扩展程序/键盘快捷键 页面修改插件的所有快捷键，点击前往',
          tooltipMaxWidth: 260
        })
      })
    }),
    Object.freeze({
      id: 'search',
      copy: NEWTAB_COPY,
      visualKind: 'newtab-preview-surface',
      visualVisible: true,
      interactionKinds: Object.freeze(['segmented-control', 'inline-action']),
      cursorEnabled: true,
      actions: Object.freeze({
        primary: Object.freeze({
          actionId: 'next',
          label: '下一步',
          icon: 'ri-arrow-right-line'
        })
      })
    }),
    Object.freeze({
      id: 'newtab',
      visualKind: 'empty-surface',
      visualVisible: false,
      interactionKinds: Object.freeze(['choice-list', 'inline-action']),
      cursorEnabled: true
    }),
    Object.freeze({
      id: 'finish',
      visualKind: 'empty-surface',
      visualVisible: false,
      interactionKinds: Object.freeze(['checklist', 'final-action']),
      cursorEnabled: true
    })
  ]);

  function normalizeLocale(locale) {
    const raw = String(locale || '').trim();
    if (!raw) {
      return 'en';
    }
    const lower = raw.toLowerCase().replace('_', '-');
    if (lower.startsWith('zh')) {
      if (lower.includes('tw') || lower.includes('hk') || lower.includes('mo') || lower.includes('hant')) {
        return 'zh_TW';
      }
      return 'zh_CN';
    }
    if (lower === 'ja' || lower.startsWith('ja-')) {
      return 'ja';
    }
    return 'en';
  }

  function normalizeShortcutValue(value) {
    return String(value || '').trim().replace(/\s*\+\s*/g, '+');
  }

  function getShortcutKeyLabel(keyToken, preferSymbols) {
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
    return preferSymbols
      ? (keyMapMac[keyToken] || keyToken)
      : (keyMapDefault[keyToken] || keyToken);
  }

  function getModifierSymbol(token) {
    const lower = String(token || '').toLowerCase();
    if (lower === 'command' || lower === 'cmd' || lower === 'meta' || lower === 'super' || token === '⌘') {
      return '⌘';
    }
    if (lower === 'shift' || token === '⇧') {
      return '⇧';
    }
    if (lower === 'ctrl' || lower === 'control' || lower === 'macctrl' || token === '⌃') {
      return '⌃';
    }
    if (lower === 'alt' || lower === 'option' || token === '⌥') {
      return '⌥';
    }
    return '';
  }

  function normalizeShortcutTokenText(token) {
    const text = String(token || '');
    return text.length > 1 ? text.toUpperCase() : text;
  }

  function getCompactMacShortcutTokens(value) {
    const compact = String(value || '').trim().replace(/\s+/g, '');
    if (!compact || compact.includes('+') || !/[⌘⇧⌃⌥]/.test(compact)) {
      return null;
    }
    const tokens = [];
    let index = 0;
    while (index < compact.length) {
      const symbol = getModifierSymbol(compact[index]);
      if (!symbol) {
        break;
      }
      tokens.push(symbol);
      index += 1;
    }
    const keyToken = compact.slice(index);
    if (tokens.length === 0 || !keyToken) {
      return null;
    }
    tokens.push(getShortcutKeyLabel(keyToken, true));
    return tokens.map(normalizeShortcutTokenText);
  }

  function getShortcutDisplayTokens(shortcut, options) {
    const value = normalizeShortcutValue(shortcut);
    if (!value) {
      return [];
    }
    const compactTokens = getCompactMacShortcutTokens(value);
    if (compactTokens) {
      return compactTokens;
    }
    const parts = value.split('+').filter(Boolean);
    if (parts.length === 0) {
      return [];
    }
    const preferSymbols = Boolean(options && options.preferSymbols) ||
      parts.some((part) => /^[⌘⇧⌃⌥]$/.test(String(part || ''))) ||
      parts.some((part) => /^(?:Command|Cmd|Meta|Super)$/i.test(String(part || '')));
    const keyToken = parts.pop();
    const tokens = [];
    parts.forEach((token) => {
      const symbol = getModifierSymbol(token);
      if (preferSymbols && symbol) {
        tokens.push(symbol);
        return;
      }
      tokens.push(/^Command$/i.test(token) ? 'Cmd' : token);
    });
    tokens.push(getShortcutKeyLabel(keyToken, preferSymbols));
    return tokens.map(normalizeShortcutTokenText);
  }

  function formatShortcutForDisplay(shortcut, options) {
    const tokens = getShortcutDisplayTokens(shortcut, options);
    if (tokens.length === 0) {
      return '';
    }
    const shouldUseCompactSymbols = tokens.some((token) => /[⌘⇧⌃⌥]/.test(token));
    return tokens.join(shouldUseCompactSymbols ? '' : '+');
  }

  function parseShortcutHotkey(shortcut) {
    const value = normalizeShortcutValue(shortcut);
    if (!value) {
      return null;
    }
    const parts = value.split('+').map((item) => String(item || '').trim()).filter(Boolean);
    if (parts.length === 0) {
      return null;
    }
    const keyToken = parts[parts.length - 1];
    const modifierTokens = parts.slice(0, -1);
    const spec = {
      ctrl: false,
      alt: false,
      shift: false,
      meta: false,
      key: ''
    };

    modifierTokens.forEach((token) => {
      const lower = token.toLowerCase();
      if (lower === 'ctrl' || lower === 'control' || lower === 'macctrl' || token === '⌃') {
        spec.ctrl = true;
      } else if (lower === 'alt' || lower === 'option' || token === '⌥') {
        spec.alt = true;
      } else if (lower === 'shift' || token === '⇧') {
        spec.shift = true;
      } else if (lower === 'command' || lower === 'cmd' || lower === 'meta' || lower === 'super' || token === '⌘') {
        spec.meta = true;
      }
    });

    const keyLower = keyToken.toLowerCase();
    const specialMap = {
      tab: 'Tab',
      enter: 'Enter',
      return: 'Enter',
      esc: 'Escape',
      escape: 'Escape',
      space: ' ',
      spacebar: ' ',
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight',
      arrowup: 'ArrowUp',
      arrowdown: 'ArrowDown',
      arrowleft: 'ArrowLeft',
      arrowright: 'ArrowRight',
      comma: ',',
      period: '.',
      slash: '/',
      semicolon: ';',
      quote: '\'',
      minus: '-',
      plus: '+',
      equal: '+',
      backslash: '\\',
      backquote: '`',
      bracketleft: '[',
      bracketright: ']'
    };
    if (specialMap[keyLower]) {
      spec.key = specialMap[keyLower];
      return spec;
    }
    if (/^f\d{1,2}$/.test(keyLower)) {
      spec.key = keyLower.toUpperCase();
      return spec;
    }
    if (keyLower.length === 1) {
      spec.key = keyLower;
      return spec;
    }
    spec.key = keyToken;
    return spec;
  }

  function getShortcutKeyTokenFromCode(rawCode) {
    const code = String(rawCode || '').trim();
    if (!code) {
      return '';
    }
    if (/^Key[A-Z]$/.test(code)) {
      return code.slice(3).toLowerCase();
    }
    if (/^Digit[0-9]$/.test(code)) {
      return code.slice(5);
    }
    const codeMap = {
      Backquote: '`',
      Minus: '-',
      Equal: '+',
      BracketLeft: '[',
      BracketRight: ']',
      Backslash: '\\',
      Semicolon: ';',
      Quote: '\'',
      Comma: ',',
      Period: '.',
      Slash: '/',
      Space: ' ',
      Tab: 'Tab',
      Enter: 'Enter',
      Escape: 'Escape',
      ArrowUp: 'ArrowUp',
      ArrowDown: 'ArrowDown',
      ArrowLeft: 'ArrowLeft',
      ArrowRight: 'ArrowRight'
    };
    if (codeMap[code]) {
      return codeMap[code];
    }
    if (/^F\d{1,2}$/.test(code)) {
      return code.toUpperCase();
    }
    return '';
  }

  function getShortcutKeyTokenFromEvent(event) {
    if (!event) {
      return '';
    }
    return getShortcutKeyTokenFromCode(event.code) || String(event.key || '');
  }

  function shortcutHotkeySpecMatchesEvent(spec, event) {
    if (!spec || !event) {
      return false;
    }
    if (Boolean(event.ctrlKey) !== spec.ctrl ||
        Boolean(event.altKey) !== spec.alt ||
        Boolean(event.shiftKey) !== spec.shift ||
        Boolean(event.metaKey) !== spec.meta) {
      return false;
    }
    const eventKey = getShortcutKeyTokenFromEvent(event);
    if (spec.key.length === 1) {
      return eventKey.toLowerCase() === spec.key;
    }
    if (spec.key.startsWith('F')) {
      return eventKey.toUpperCase() === spec.key;
    }
    return eventKey === spec.key;
  }

  function shortcutHotkeyMatchesEvent(shortcut, event) {
    return shortcutHotkeySpecMatchesEvent(parseShortcutHotkey(shortcut), event);
  }

  function cloneCopy(copy) {
    const source = copy || EMPTY_COPY;
    const cloned = {
      eyebrow: source.eyebrow || '',
      title: source.title || '',
      body: source.body || ''
    };
    if (source.note) {
      cloned.note = String(source.note || '');
    }
    if (Array.isArray(source.titleLines) && source.titleLines.length > 0) {
      cloned.titleLines = Object.freeze(source.titleLines.map((line) => String(line || '')));
    }
    const titleLogo = cloneTitleLogo(source.titleLogo);
    if (titleLogo) {
      cloned.titleLogo = titleLogo;
    }
    const titleCycle = cloneTitleCycle(source.titleCycle);
    if (titleCycle) {
      cloned.titleCycle = titleCycle;
    }
    return cloned;
  }

  function cloneTitleLogo(titleLogo) {
    const src = String(titleLogo && titleLogo.src || '').trim();
    if (!src) {
      return null;
    }
    return Object.freeze({
      label: String(titleLogo && titleLogo.label || ''),
      src
    });
  }

  function cloneTitleCycle(titleCycle) {
    if (!titleCycle || !Array.isArray(titleCycle.items) || titleCycle.items.length === 0) {
      return null;
    }
    const items = titleCycle.items.map((item) => ({
      id: String(item && item.id || ''),
      label: String(item && item.label || ''),
      tone: String(item && item.tone || '')
    })).filter((item) => item.id && item.label && item.tone);
    if (items.length === 0) {
      return null;
    }
    return Object.freeze({
      prefix: String(titleCycle.prefix || ''),
      items: Object.freeze(items.map((item) => Object.freeze(item)))
    });
  }

  function cloneAction(action) {
    if (!action || typeof action !== 'object') {
      return null;
    }
    const label = String(action.label || '').trim();
    const actionId = String(action.actionId || '').trim();
    if (!label || !actionId) {
      return null;
    }
    const cloned = {
      actionId,
      label,
      icon: String(action.icon || '').trim()
    };
    const tooltip = String(action.tooltip || '').trim();
    if (tooltip) {
      cloned.tooltip = tooltip;
    }
    const tooltipMaxWidth = Number(action.tooltipMaxWidth);
    if (Number.isFinite(tooltipMaxWidth) && tooltipMaxWidth > 0) {
      cloned.tooltipMaxWidth = Math.round(tooltipMaxWidth);
    }
    return Object.freeze(cloned);
  }

  function cloneActions(actions) {
    const source = actions || {};
    return Object.freeze({
      primary: cloneAction(source.primary),
      secondary: cloneAction(source.secondary),
      ghost: cloneAction(source.ghost)
    });
  }

  function cloneBrowserAvatars(browserAvatars) {
    if (!browserAvatars || !Array.isArray(browserAvatars.browsers) || browserAvatars.browsers.length === 0) {
      return null;
    }
    return {
      prefix: String(browserAvatars.prefix || ''),
      suffix: String(browserAvatars.suffix || ''),
      browsers: browserAvatars.browsers.map((browser) => ({
        id: String(browser && browser.id || ''),
        name: String(browser && browser.name || ''),
        src: String(browser && browser.src || '')
      })).filter((browser) => browser.id && browser.name && browser.src)
    };
  }

  function cloneInfoTooltip(infoTooltip) {
    if (!infoTooltip || typeof infoTooltip !== 'object') {
      return null;
    }
    const text = String(infoTooltip.text || '').trim();
    const type = String(infoTooltip.type || '').trim();
    if (!text && !type) {
      return null;
    }
    return {
      icon: String(infoTooltip.icon || 'ri-information-line').trim() || 'ri-information-line',
      label: String(infoTooltip.label || '说明').trim() || '说明',
      type,
      text
    };
  }

  function cloneLinkButton(linkButton) {
    if (!linkButton || typeof linkButton !== 'object') {
      return null;
    }
    const href = String(linkButton.href || '').trim();
    const label = String(linkButton.label || '').trim();
    if (!href || !label || !/^https?:\/\//i.test(href)) {
      return null;
    }
    const tooltip = String(linkButton.tooltip || label).trim() || label;
    return {
      icon: String(linkButton.icon || 'ri-github-fill').trim() || 'ri-github-fill',
      label,
      tooltip,
      href
    };
  }

  function cloneAccordionLinks(links) {
    if (!Array.isArray(links)) {
      return [];
    }
    return links
      .map((link) => {
        const label = String(link && link.label || '').trim();
        const href = String(link && link.href || '').trim();
        const actionId = String(link && link.actionId || '').trim();
        if (!label || !href || !/^(?:https?:\/\/|chrome:\/\/)/i.test(href)) {
          return null;
        }
        const clonedLink = { label, href };
        if (actionId) {
          clonedLink.actionId = actionId;
        }
        return Object.freeze(clonedLink);
      })
      .filter(Boolean);
  }

  function createInteractionSlots(slot, slideId) {
    if (Array.isArray(slot.interactionRows)) {
      return slot.interactionRows.map((row, index) => {
        const interactionSlot = {
          id: `${slideId}-interaction-${index + 1}`,
          kind: row.kind || 'info-row',
          actionId: String(row.actionId || ''),
          accordionId: String(row.accordionId || '').trim(),
          icon: row.icon || '',
          label: row.label || '',
          description: ''
        };
        const browserAvatars = cloneBrowserAvatars(row.browserAvatars);
        if (browserAvatars && browserAvatars.browsers.length > 0) {
          interactionSlot.browserAvatars = Object.freeze({
            prefix: browserAvatars.prefix,
            suffix: browserAvatars.suffix,
            browsers: Object.freeze(browserAvatars.browsers.map((browser) => Object.freeze(browser)))
          });
        }
        const infoTooltip = cloneInfoTooltip(row.infoTooltip);
        if (infoTooltip) {
          interactionSlot.infoTooltip = Object.freeze(infoTooltip);
        }
        const linkButton = cloneLinkButton(row.linkButton);
        if (linkButton) {
          interactionSlot.linkButton = Object.freeze(linkButton);
        }
        if (row.accordion && typeof row.accordion === 'object') {
          const accordionLinks = cloneAccordionLinks(row.accordion.links);
          const accordion = {
            icon: String(row.accordion.icon || 'ri-arrow-left-s-line').trim() || 'ri-arrow-left-s-line',
            text: String(row.accordion.text || ''),
            expandedByDefault: row.accordion.expandedByDefault === true
          };
          if (accordionLinks.length > 0) {
            accordion.links = Object.freeze(accordionLinks);
          }
          interactionSlot.accordion = Object.freeze(accordion);
        }
        return Object.freeze(interactionSlot);
      });
    }
    const kinds = Array.isArray(slot.interactionKinds) ? slot.interactionKinds : [];
    return kinds.map((kind, index) => Object.freeze({
      id: `${slideId}-interaction-${index + 1}`,
      kind,
      actionId: index === 0 ? 'next' : '',
      label: '',
      description: ''
    }));
  }

  function createSlide(slot, index) {
    return Object.freeze({
      id: slot.id,
      sequence: index + 1,
      copy: Object.freeze(cloneCopy(slot.copy)),
      left: Object.freeze({
        copySlotId: 'onboarding-copy-panel',
        interactionMountId: 'onboarding-interaction-slots',
        interactionSlots: Object.freeze(createInteractionSlots(slot, slot.id))
      }),
      visual: Object.freeze({
        mountId: VISUAL_MOUNT_ID,
        kind: slot.visualKind,
        renderer: 'placeholder',
        acceptsRealUi: true,
        visible: slot.visualVisible !== false
      }),
      actions: cloneActions(slot.actions),
      cursor: Object.freeze({
        mountId: CURSOR_MOUNT_ID,
        enabled: slot.cursorEnabled,
        path: Object.freeze([])
      })
    });
  }

  function getSupportedLocales() {
    return SUPPORTED_LOCALES.slice();
  }

  function getOnboardingBlueprint(locale) {
    const normalized = normalizeLocale(locale);
    const meta = LOCALE_META[normalized] || LOCALE_META.en;
    return Object.freeze({
      brand: 'Lumno',
      locale: meta.locale,
      htmlLang: meta.htmlLang,
      mode: 'paginated',
      shell: Object.freeze({
        rootId: 'onboarding-root',
        copyPanelId: 'onboarding-copy-panel',
        interactionMountId: 'onboarding-interaction-slots',
        visualStageId: VISUAL_MOUNT_ID,
        cursorLayerId: CURSOR_MOUNT_ID
      }),
      slides: Object.freeze(SLIDE_SLOTS.map(createSlide))
    });
  }

  function clampIndex(count, index) {
    const safeCount = Math.max(0, Number.isFinite(count) ? Math.floor(count) : 0);
    if (safeCount <= 0) {
      return 0;
    }
    const numericIndex = Number.isFinite(index) ? Math.floor(index) : 0;
    return Math.min(Math.max(0, numericIndex), safeCount - 1);
  }

  function getDirection(previousIndex, nextIndex) {
    if (nextIndex > previousIndex) {
      return 'forward';
    }
    if (nextIndex < previousIndex) {
      return 'back';
    }
    return 'none';
  }

  function createOnboardingState(count, initialIndex) {
    const safeCount = Math.max(0, Number.isFinite(count) ? Math.floor(count) : 0);
    const index = clampIndex(safeCount, initialIndex);
    return {
      index,
      previousIndex: index,
      direction: 'none',
      count: safeCount
    };
  }

  function reduceOnboardingState(state, event) {
    const current = state || createOnboardingState(0, 0);
    const count = Math.max(0, Number.isFinite(current.count) ? Math.floor(current.count) : 0);
    const currentIndex = clampIndex(count, current.index);
    const type = event && event.type ? String(event.type) : '';
    let nextIndex = currentIndex;

    if (type === 'NEXT') {
      nextIndex = clampIndex(count, currentIndex + 1);
    } else if (type === 'PREV') {
      nextIndex = clampIndex(count, currentIndex - 1);
    } else if (type === 'GOTO') {
      nextIndex = clampIndex(count, event.index);
    } else if (type === 'HOME') {
      nextIndex = 0;
    } else if (type === 'END') {
      nextIndex = clampIndex(count, count - 1);
    }

    return {
      index: nextIndex,
      previousIndex: currentIndex,
      direction: getDirection(currentIndex, nextIndex),
      count
    };
  }

  function getSlideByIndex(blueprint, index) {
    const slides = blueprint && Array.isArray(blueprint.slides) ? blueprint.slides : [];
    return slides[clampIndex(slides.length, index)] || null;
  }

  return Object.freeze({
    normalizeLocale,
    getShortcutDisplayTokens,
    formatShortcutForDisplay,
    parseShortcutHotkey,
    shortcutHotkeyMatchesEvent,
    getSupportedLocales,
    getOnboardingBlueprint,
    getOnboardingContent: getOnboardingBlueprint,
    createOnboardingState,
    reduceOnboardingState,
    getSlideByIndex
  });
});
