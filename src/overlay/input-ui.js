(function() {
  if (window._x_extension_createSearchInput_2024_unique_) {
    return;
  }

  const IMPORTANT_PRIORITY = 'important';
  const COMPONENT_STYLE_ID = '_x_extension_input_component_style_2026_unique_';
  const COMPONENT_CLASSES = Object.freeze({
    container: '_x_extension_input_container_class_2026_',
    input: '_x_extension_input_class_2026_',
    divider: '_x_extension_input_divider_class_2026_',
    icon: '_x_extension_input_icon_class_2026_',
    rightIcon: '_x_extension_input_right_icon_class_2026_'
  });
  const INPUT_FONT_STACK = "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  const COMPONENT_STYLES = Object.freeze({
    input: [
      ['all', 'unset'],
      ['width', '100%'],
      ['padding', '20px 64px 20px 50px'],
      ['background', 'transparent'],
      ['border', 'none'],
      ['border-bottom', 'none'],
      ['color', 'var(--x-ext-input-text, #1F2937)'],
      ['font-size', '16px'],
      ['font-family', INPUT_FONT_STACK],
      ['font-weight', '500'],
      ['outline', 'none'],
      ['box-sizing', 'border-box'],
      ['margin', '0'],
      ['line-height', '1'],
      ['text-decoration', 'none'],
      ['list-style', 'none'],
      ['display', 'block'],
      ['text-align', 'left'],
      ['cursor', 'text'],
      ['vertical-align', 'baseline'],
      ['caret-color', 'var(--x-ext-input-caret, #7DB7FF)']
    ],
    divider: [
      ['all', 'unset'],
      ['position', 'absolute'],
      ['left', 'var(--x-ext-input-divider-inset, 20px)'],
      ['right', 'var(--x-ext-input-divider-inset, 20px)'],
      ['bottom', '0'],
      ['height', '1px'],
      ['background', 'var(--x-ext-input-underline, #E5E7EB)'],
      ['opacity', 'var(--x-ext-input-divider-opacity, 0.55)'],
      ['pointer-events', 'none'],
      ['display', 'block']
    ],
    icon: [
      ['all', 'unset'],
      ['position', 'absolute'],
      ['left', '20px'],
      ['top', '50%'],
      ['transform', 'translateY(-50%)'],
      ['color', 'var(--x-ext-input-icon, #9CA3AF)'],
      ['pointer-events', 'none'],
      ['z-index', '1'],
      ['box-sizing', 'border-box'],
      ['margin', '0'],
      ['padding', '6px 0'],
      ['line-height', '1'],
      ['text-decoration', 'none'],
      ['list-style', 'none'],
      ['outline', 'none'],
      ['background', 'transparent'],
      ['font-size', '100%'],
      ['font', 'inherit'],
      ['vertical-align', 'baseline'],
      ['display', 'flex'],
      ['align-items', 'center'],
      ['justify-content', 'center']
    ],
    rightIcon: [
      ['all', 'unset'],
      ['position', 'absolute'],
      ['right', '14px'],
      ['top', '50%'],
      ['transform', 'translateY(-50%)'],
      ['width', '30px'],
      ['height', '30px'],
      ['border-radius', '8px'],
      ['z-index', '2'],
      ['box-sizing', 'border-box'],
      ['margin', '0'],
      ['padding', '0'],
      ['line-height', '1'],
      ['text-decoration', 'none'],
      ['list-style', 'none'],
      ['outline', 'none'],
      ['background', 'transparent'],
      ['display', 'inline-flex'],
      ['align-items', 'center'],
      ['justify-content', 'center'],
      ['color', 'var(--x-ext-input-icon, #9CA3AF)'],
      ['cursor', 'pointer'],
      ['transition', 'background-color 140ms ease, color 140ms ease, transform 160ms ease']
    ],
    container: [
      ['all', 'unset'],
      ['position', 'relative'],
      ['width', '100%'],
      ['flex-shrink', '0'],
      ['box-sizing', 'border-box'],
      ['margin', '0'],
      ['padding', '0'],
      ['line-height', '1'],
      ['text-decoration', 'none'],
      ['list-style', 'none'],
      ['outline', 'none'],
      ['color', 'inherit'],
      ['font-size', '100%'],
      ['font', 'inherit'],
      ['vertical-align', 'baseline'],
      ['display', 'block'],
      ['background', 'transparent'],
      ['border-radius', '28px 28px 0 0'],
      ['overflow', 'hidden']
    ]
  });

  function priorityFor(useImportantStyles) {
    return useImportantStyles ? IMPORTANT_PRIORITY : '';
  }

  function formatDeclaration(declaration, useImportantStyles) {
    const property = declaration[0];
    const value = declaration[1];
    const suffix = useImportantStyles ? ' !important' : '';
    return `      ${property}: ${value}${suffix};`;
  }

  function buildCssText(declarations, useImportantStyles) {
    return `\n${declarations.map((declaration) => formatDeclaration(declaration, useImportantStyles)).join('\n')}\n    `;
  }

  function buildRule(selector, declarations) {
    return `${selector} {\n${declarations.map((declaration) => formatDeclaration(declaration, false)).join('\n')}\n      }`;
  }

  function applyBaseStyles(element, className, declarations, useInlineStyles, useImportantStyles) {
    if (element.classList) {
      element.classList.add(className);
    }
    if (useInlineStyles) {
      element.style.cssText = buildCssText(declarations, useImportantStyles);
    }
  }

  function applyStyleOverrides(element, overrides, useImportantStyles) {
    if (!overrides) {
      return;
    }
    const priority = priorityFor(useImportantStyles);
    Object.keys(overrides).forEach((property) => {
      element.style.setProperty(property, overrides[property], priority);
    });
  }

  function setElementStyle(element, property, value, useImportantStyles) {
    element.style.setProperty(property, value, priorityFor(useImportantStyles));
  }

  function findById(rootNode, id) {
    if (!rootNode || !id) {
      return null;
    }
    if (typeof rootNode.getElementById === 'function') {
      return rootNode.getElementById(id);
    }
    if (typeof rootNode.querySelector === 'function') {
      return rootNode.querySelector(`#${id}`);
    }
    return null;
  }

  function appendStylesheet(doc, rootNode, id, href) {
    if (!doc || !rootNode || !id || !href || findById(rootNode, id)) {
      return;
    }
    const link = doc.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    rootNode.appendChild(link);
  }

  function getRuntimeUrl(path) {
    if (typeof chrome === 'undefined' || !chrome.runtime || typeof chrome.runtime.getURL !== 'function') {
      return '';
    }
    return chrome.runtime.getURL(path);
  }

  function ensureAssetStyles(rootNode, isolatedStyles) {
    const targetRoot = rootNode || document.head || document.documentElement;
    if (!targetRoot) {
      return;
    }
    const openSansId = isolatedStyles
      ? '_x_extension_open_sans_shadow_css_2026_unique_'
      : '_x_extension_open_sans_css_2024_unique_';
    const remixIconId = isolatedStyles
      ? '_x_extension_remixicon_shadow_css_2026_unique_'
      : '_x_extension_remixicon_css_2024_unique_';
    appendStylesheet(document, targetRoot, openSansId, getRuntimeUrl('assets/fonts/open-sans/open-sans.css'));
    appendStylesheet(document, targetRoot, remixIconId, getRuntimeUrl('assets/remixicon/fonts/remixicon.css'));
  }

  function ensureComponentStyles(rootNode) {
    if (!rootNode || findById(rootNode, COMPONENT_STYLE_ID)) {
      return;
    }
    const style = document.createElement('style');
    style.id = COMPONENT_STYLE_ID;
    style.textContent = `
      ${buildRule(`.${COMPONENT_CLASSES.container}`, COMPONENT_STYLES.container)}
      ${buildRule(`.${COMPONENT_CLASSES.input}`, COMPONENT_STYLES.input)}
      ${buildRule(`.${COMPONENT_CLASSES.divider}`, COMPONENT_STYLES.divider)}
      .${COMPONENT_CLASSES.divider}[data-visible="false"] {
        display: none;
      }
      ${buildRule(`.${COMPONENT_CLASSES.icon}`, COMPONENT_STYLES.icon)}
      ${buildRule(`.${COMPONENT_CLASSES.rightIcon}`, COMPONENT_STYLES.rightIcon)}
      .${COMPONENT_CLASSES.rightIcon}[data-hover-active="true"] {
        background: var(--x-ext-input-icon-hover-bg, rgba(148, 163, 184, 0.16));
        color: var(--x-ext-input-icon-hover, #4B5563);
        transform: translateY(-50%) scale(1.06);
      }
      .${COMPONENT_CLASSES.rightIcon} * {
        pointer-events: none;
        cursor: pointer;
      }
    `;
    rootNode.appendChild(style);
  }

  function applyNoTranslate(element) {
    if (!element || !element.setAttribute) {
      return element;
    }
    element.setAttribute('translate', 'no');
    element.setAttribute('lang', 'zxx');
    element.setAttribute('data-no-translate', 'true');
    if (element.classList) {
      element.classList.add('notranslate');
    }
    return element;
  }

  function getMessage(key, fallback) {
    try {
      if (typeof chrome !== 'undefined' && chrome.i18n && typeof chrome.i18n.getMessage === 'function') {
        const value = chrome.i18n.getMessage(key);
        if (value) {
          return value;
        }
      }
    } catch (error) {
      // Ignore i18n failures in page context.
    }
    return fallback;
  }

  window._x_extension_createSearchInput_2024_unique_ = function(options) {
    const config = options || {};
    const styleRoot = config.styleRoot || null;
    const isolatedStyles = Boolean(config.useIsolatedStyles || config.styleMode === 'isolated');
    const useImportantStyles = Object.prototype.hasOwnProperty.call(config, 'useImportantStyles')
      ? Boolean(config.useImportantStyles)
      : !isolatedStyles;
    const useInlineBaseStyles = !isolatedStyles || !styleRoot;

    ensureAssetStyles(isolatedStyles ? styleRoot : null, isolatedStyles);
    if (isolatedStyles && styleRoot) {
      ensureComponentStyles(styleRoot);
    }

    const input = document.createElement('input');
    applyNoTranslate(input);
    input.id = config.inputId || '_x_extension_search_input_2024_unique_';
    input.autocomplete = 'off';
    input.type = 'text';
    input.placeholder = config.placeholder || getMessage('search_placeholder', '搜索或输入网址...');
    applyBaseStyles(input, COMPONENT_CLASSES.input, COMPONENT_STYLES.input, useInlineBaseStyles, useImportantStyles);
    applyStyleOverrides(input, config.inputStyleOverrides, useImportantStyles);

    const hasBorderOverride = Boolean(
      config.inputStyleOverrides &&
      Object.prototype.hasOwnProperty.call(config.inputStyleOverrides, 'border-bottom')
    );
    const showUnderlineWhenEmpty = Boolean(config.showUnderlineWhenEmpty);

    const divider = document.createElement('div');
    applyNoTranslate(divider);
    divider.id = config.dividerId || '_x_extension_input_divider_2024_unique_';
    applyBaseStyles(divider, COMPONENT_CLASSES.divider, COMPONENT_STYLES.divider, useInlineBaseStyles, useImportantStyles);
    applyStyleOverrides(divider, config.dividerStyleOverrides, useImportantStyles);

    function setDividerVisible(visible) {
      if (isolatedStyles && styleRoot) {
        divider.setAttribute('data-visible', visible ? 'true' : 'false');
        return;
      }
      setElementStyle(divider, 'display', visible ? 'block' : 'none', useImportantStyles);
    }

    function updateInputUnderline(value) {
      if (hasBorderOverride) {
        setDividerVisible(false);
        return;
      }
      if (showUnderlineWhenEmpty) {
        setDividerVisible(true);
        return;
      }
      const isEmpty = !value || !value.trim();
      setDividerVisible(!isEmpty);
    }

    updateInputUnderline(input.value);

    if (typeof config.onInput === 'function') {
      input.addEventListener('input', config.onInput);
    }
    input.addEventListener('input', function(event) {
      updateInputUnderline(event.target.value);
    });
    if (typeof config.onFocus === 'function') {
      input.addEventListener('focus', config.onFocus);
    }
    if (typeof config.onBlur === 'function') {
      input.addEventListener('blur', config.onBlur);
    }
    if (typeof config.onKeyDown === 'function') {
      input.addEventListener('keydown', config.onKeyDown);
    }

    const icon = document.createElement('div');
    applyNoTranslate(icon);
    icon.id = config.iconId || '_x_extension_search_icon_2024_unique_';
    icon.innerHTML = '<i class="_x_extension_svg_2024_unique_ ri-icon ri-size-16 ri-search-line" aria-hidden="true"></i>';
    applyBaseStyles(icon, COMPONENT_CLASSES.icon, COMPONENT_STYLES.icon, useInlineBaseStyles, useImportantStyles);
    applyStyleOverrides(icon, config.iconStyleOverrides, useImportantStyles);

    const rightIcon = document.createElement('button');
    applyNoTranslate(rightIcon);
    rightIcon.id = config.rightIconId || '_x_extension_search_right_icon_2024_unique_';
    rightIcon.type = 'button';
    rightIcon.innerHTML = config.rightIconHtml || '<i class="_x_extension_svg_2024_unique_ ri-icon ri-size-16 ri-settings-6-line" aria-hidden="true"></i>';
    rightIcon.setAttribute('aria-label', config.rightIconAlt || getMessage('settings_button_aria', 'Settings'));
    applyBaseStyles(rightIcon, COMPONENT_CLASSES.rightIcon, COMPONENT_STYLES.rightIcon, useInlineBaseStyles, useImportantStyles);
    applyStyleOverrides(rightIcon, config.rightIconStyleOverrides, useImportantStyles);
    Array.from(rightIcon.querySelectorAll('*')).forEach((node) => {
      if (!node || !node.style || (isolatedStyles && styleRoot)) {
        return;
      }
      setElementStyle(node, 'pointer-events', 'none', useImportantStyles);
      setElementStyle(node, 'cursor', 'pointer', useImportantStyles);
    });

    const setRightIconVisualState = (active) => {
      if (isolatedStyles && styleRoot) {
        rightIcon.setAttribute('data-hover-active', active ? 'true' : 'false');
        return;
      }
      setElementStyle(rightIcon, 'background', active
        ? 'var(--x-ext-input-icon-hover-bg, rgba(148, 163, 184, 0.16))'
        : 'transparent', useImportantStyles);
      setElementStyle(rightIcon, 'color', active
        ? 'var(--x-ext-input-icon-hover, #4B5563)'
        : 'var(--x-ext-input-icon, #9CA3AF)', useImportantStyles);
      setElementStyle(rightIcon, 'transform', active
        ? 'translateY(-50%) scale(1.06)'
        : 'translateY(-50%)', useImportantStyles);
    };
    setRightIconVisualState(false);
    rightIcon.addEventListener('mouseenter', () => {
      setRightIconVisualState(true);
    });
    rightIcon.addEventListener('mouseleave', () => {
      setRightIconVisualState(false);
    });
    rightIcon.addEventListener('blur', () => {
      setRightIconVisualState(false);
    });
    rightIcon.addEventListener('pointerup', () => {
      setRightIconVisualState(false);
    });
    rightIcon.addEventListener('pointercancel', () => {
      setRightIconVisualState(false);
    });
    rightIcon.addEventListener('click', () => {
      setRightIconVisualState(false);
      if (typeof rightIcon.blur === 'function') {
        rightIcon.blur();
      }
    });

    const container = document.createElement('div');
    applyNoTranslate(container);
    container.id = config.containerId || '_x_extension_input_container_2024_unique_';
    applyBaseStyles(container, COMPONENT_CLASSES.container, COMPONENT_STYLES.container, useInlineBaseStyles, useImportantStyles);
    applyStyleOverrides(container, config.containerStyleOverrides, useImportantStyles);

    container.appendChild(icon);
    container.appendChild(input);
    container.appendChild(divider);
    if (config.showRightIcon !== false) {
      container.appendChild(rightIcon);
    }

    return { container: container, input: input, icon: icon, rightIcon: rightIcon, divider: divider };
  };
})();
