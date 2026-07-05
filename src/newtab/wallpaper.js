(function() {
  const WALLPAPER_ADAPTIVE_TONE = globalThis.LumnoNewtabWallpaperAdaptiveTone || {};
  const WALLPAPER_EFFECTS = globalThis.LumnoNewtabWallpaperEffects || {};
  const WALLPAPER_LOCAL_STORE = globalThis.LumnoNewtabWallpaperLocalStore || {};
  const DEFAULT_STORAGE_KEYS = {
    wallpaper: '_x_extension_newtab_wallpaper_2026_unique_',
    localWallpaper: '_x_extension_newtab_local_wallpaper_2026_unique_',
    overlay: '_x_extension_newtab_wallpaper_overlay_2026_unique_',
    effect: '_x_extension_newtab_wallpaper_effect_2026_unique_',
    wordmark: '_x_extension_newtab_wordmark_visible_2026_unique_',
    favicon: '_x_extension_newtab_favicon_2026_unique_'
  };
  const PRELOAD_STORAGE_KEY = '_x_extension_newtab_wallpaper_preload_2026_unique_';

  function createWallpaperRuntime(options) {
    options = options || {};
    const documentObj = options.documentObj || document;
    const windowObj = options.windowObj || window;
    const document = documentObj;
    const window = windowObj;
    const chrome = options.chromeObj || globalThis.chrome || {};
    const extensionRoutes = options.extensionRoutes || globalThis.LumnoExtensionRoutes || {};
    const storageArea = options.storageArea || null;
    const localWallpaperStorageArea = options.localWallpaperStorageArea || null;
    const storageKeys = Object.assign({}, DEFAULT_STORAGE_KEYS, options.storageKeys || {});
    const NEWTAB_WALLPAPER_STORAGE_KEY = storageKeys.wallpaper;
    const NEWTAB_LOCAL_WALLPAPER_STORAGE_KEY = storageKeys.localWallpaper;
    const NEWTAB_WALLPAPER_OVERLAY_STORAGE_KEY = storageKeys.overlay;
    const NEWTAB_WALLPAPER_EFFECT_STORAGE_KEY = storageKeys.effect;
    const NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY = storageKeys.wordmark;
    const NEWTAB_FAVICON_STORAGE_KEY = storageKeys.favicon;
    const t = typeof options.t === 'function'
      ? options.t
      : function(_key, fallback) { return fallback || ''; };
    const formatMessage = typeof options.formatMessage === 'function'
      ? options.formatMessage
      : function(_key, fallback, params) {
        let text = fallback || '';
        Object.keys(params || {}).forEach((token) => {
          text = text.replace(new RegExp('\\{' + token + '\\}', 'g'), params[token]);
        });
        return text;
      };
    const getThemeMode = typeof options.getThemeMode === 'function'
      ? options.getThemeMode
      : function() { return 'system'; };
    const getThemeScope = typeof options.getThemeScope === 'function'
      ? options.getThemeScope
      : function() { return 'global'; };
    const setThemeMode = typeof options.setThemeMode === 'function'
      ? options.setThemeMode
      : function() {};
    const setThemeScope = typeof options.setThemeScope === 'function'
      ? options.setThemeScope
      : function() {};
    const BroadcastChannelCtor = typeof options.BroadcastChannel === 'function'
      ? options.BroadcastChannel
      : (window && typeof window.BroadcastChannel === 'function'
        ? window.BroadcastChannel
        : (typeof globalThis.BroadcastChannel === 'function' ? globalThis.BroadcastChannel : null));
    const searchWidthConfig = Object.assign({
      min: 720,
      max: 1040,
      fallback: 920,
      snapPoints: [720, 920, 1040],
      snapThreshold: 14
    }, options.searchWidthConfig || {});
    const getSearchWidth = typeof options.getSearchWidth === 'function'
      ? options.getSearchWidth
      : function() { return searchWidthConfig.fallback; };
    const setSearchWidth = typeof options.setSearchWidth === 'function'
      ? options.setSearchWidth
      : function() {};
    const getRiSvg = typeof options.getRiSvg === 'function'
      ? options.getRiSvg
      : function(id, sizeClass) {
        const size = sizeClass || 'ri-size-16';
        return '<i class="ri-icon ' + size + ' ' + id + '" aria-hidden="true"></i>';
      };
    const showToast = typeof options.showToast === 'function' ? options.showToast : function() {};
    const showTopActionTooltip = typeof options.showTopActionTooltip === 'function'
      ? options.showTopActionTooltip
      : function() {};
    const hideTopActionTooltip = typeof options.hideTopActionTooltip === 'function'
      ? options.hideTopActionTooltip
      : function() {};
    const applyWordmarkThemeAppearance = typeof options.applyWordmarkThemeAppearance === 'function'
      ? options.applyWordmarkThemeAppearance
      : function() {};
    const hasWordmarkVisibleGetter = typeof options.getWordmarkVisible === 'function';
    const getWordmarkVisible = hasWordmarkVisibleGetter
      ? options.getWordmarkVisible
      : function() { return true; };
    const setWordmarkVisible = typeof options.setWordmarkVisible === 'function'
      ? options.setWordmarkVisible
      : function() {};
    const getAdaptiveToneTargets = typeof options.getAdaptiveToneTargets === 'function'
      ? options.getAdaptiveToneTargets
      : function() { return []; };
    const localWallpaperStore = typeof WALLPAPER_LOCAL_STORE.createWallpaperLocalStore === 'function'
      ? WALLPAPER_LOCAL_STORE.createWallpaperLocalStore({
        documentObj,
        windowObj
      })
      : null;

    const NEWTAB_WALLPAPER_DEFAULT_DIRECTORY = 'assets/wallpapers';
    const NEWTAB_WALLPAPER_EXTENSION_DIRECTORY = 'assets/wallpapers';
    const NEWTAB_WALLPAPER_THUMBNAIL_SUFFIX = '-thumb.webp';
    const NEWTAB_WALLPAPER_DEFAULT_ID = 'monet-coastal-white';
    const NEWTAB_CUSTOM_WALLPAPER_ID = WALLPAPER_LOCAL_STORE.CUSTOM_WALLPAPER_ID || 'custom-upload';
    const NEWTAB_CUSTOM_WALLPAPER_ID_PREFIX = WALLPAPER_LOCAL_STORE.CUSTOM_WALLPAPER_ID_PREFIX || 'custom-wallpaper-';
    const NEWTAB_LOCAL_WALLPAPER_DISABLED_VALUE = '__lumno_local_wallpaper_disabled__';
    const NEWTAB_WALLPAPER_OPTIONS = [
      {
        id: 'dark-linocut-topographic',
        nameKey: 'newtab_wallpaper_name_dark_linocut_topographic',
        fallbackName: 'Night topography',
        file: 'lumno-newtab-dark-linocut-topographic.webp'
      },
      {
        id: 'dark-monet-lily-nocturne',
        nameKey: 'newtab_wallpaper_name_dark_monet_lily_nocturne',
        fallbackName: 'Lily nocturne',
        file: 'lumno-newtab-dark-monet-lily-nocturne.webp'
      },
      {
        id: 'dark-shanshui-moonlit',
        nameKey: 'newtab_wallpaper_name_dark_shanshui_moonlit',
        fallbackName: 'Moonlit shanshui',
        file: 'lumno-newtab-dark-shanshui-moonlit.webp'
      },
      {
        id: 'monet-coastal-white',
        nameKey: 'newtab_wallpaper_name_monet_coastal_white',
        fallbackName: 'Monet coast',
        file: 'lumno-newtab-monet-coastal-white.webp'
      },
      {
        id: 'monet-field-white',
        nameKey: 'newtab_wallpaper_name_monet_field_white',
        fallbackName: 'Monet field',
        file: 'lumno-newtab-monet-field-white.webp'
      },
      {
        id: 'monet-lily-pond-white',
        nameKey: 'newtab_wallpaper_name_monet_lily_pond_white',
        fallbackName: 'Lily pond',
        file: 'lumno-newtab-monet-lily-pond-white.webp'
      },
      {
        id: 'seurat-coast-white',
        nameKey: 'newtab_wallpaper_name_seurat_coast_white',
        fallbackName: 'Seurat coast',
        file: 'lumno-newtab-seurat-coast-white.webp'
      },
      {
        id: 'seurat-park-white',
        nameKey: 'newtab_wallpaper_name_seurat_park_white',
        fallbackName: 'Seurat park',
        file: 'lumno-newtab-seurat-park-white.webp'
      },
      {
        id: 'seurat-riverside-white',
        nameKey: 'newtab_wallpaper_name_seurat_riverside_white',
        fallbackName: 'Seurat riverside',
        file: 'lumno-newtab-seurat-riverside-white.webp'
      },
      {
        id: 'white-3d-architecture',
        nameKey: 'newtab_wallpaper_name_white_3d_architecture',
        fallbackName: 'Daylight architecture',
        file: 'lumno-newtab-white-3d-architecture.webp'
      },
      {
        id: 'white-linocut-topographic',
        nameKey: 'newtab_wallpaper_name_white_linocut_topographic',
        fallbackName: 'Daylight topography',
        file: 'lumno-newtab-white-linocut-topographic.webp'
      },
      {
        id: 'white-risograph-collage',
        nameKey: 'newtab_wallpaper_name_white_risograph_collage',
        fallbackName: 'Daylight collage',
        file: 'lumno-newtab-white-risograph-collage.webp'
      },
      {
        id: 'white-shanshui',
        nameKey: 'newtab_wallpaper_name_white_shanshui',
        fallbackName: 'Clear shanshui',
        file: 'lumno-newtab-white-shanshui.webp'
      },
      {
        id: 'settings-bg-light-monet-newtab',
        nameKey: 'newtab_wallpaper_name_settings_bg_light_monet_newtab',
        fallbackName: 'Monet light',
        file: 'settings-bg-light-monet-newtab.webp'
      }
    ];
    const NEWTAB_WALLPAPER_OVERLAY_STORAGE_VERSION = 2;
    const NEWTAB_WALLPAPER_OVERLAY_DEFAULTS = { light: 50, dark: 50 };
    const NEWTAB_WALLPAPER_OVERLAY_SNAP_POINTS = [0, 50, 100];
    const NEWTAB_WALLPAPER_OVERLAY_SNAP_THRESHOLD = 4;
    const NEWTAB_WALLPAPER_OVERLAY_STOPS = {
      light: { top: 54, mid: 20, bottom: 38 },
      dark: { top: 44, mid: 20, bottom: 50 }
    };
    const NEWTAB_WALLPAPER_EFFECT_DEFAULTS = WALLPAPER_EFFECTS.DEFAULT_PREFS || {
      version: 3,
      type: 'none',
      strength: 50,
      size: 50,
      spacing: 50,
      hover: true
    };
    const NEWTAB_WALLPAPER_EFFECT_TYPES = [
      { type: 'none', labelKey: 'newtab_wallpaper_effect_none', fallback: 'Off' },
      { type: 'grain', labelKey: 'newtab_wallpaper_effect_grain', fallback: 'Grain' },
      { type: 'halftone', labelKey: 'newtab_wallpaper_effect_halftone', fallback: 'Halftone' },
      { type: 'ascii', labelKey: 'newtab_wallpaper_effect_ascii', fallback: 'ASCII' }
    ];
    const NEWTAB_FAVICON_DEFAULT_ID = 'default';
    const NEWTAB_FAVICON_OPTIONS = [
      {
        id: 'default',
        nameKey: 'newtab_favicon_name_default',
        fallbackName: 'Default',
        file: 'assets/images/lumno.png',
        type: 'image/png'
      },
      {
        id: 'alternate',
        nameKey: 'newtab_favicon_name_alternate',
        fallbackName: 'Alternate',
        file: 'assets/images/lumno-newtab-favicon.svg',
        preview: 'inlineSvg',
        themeAwareSvg: true,
        type: 'image/svg+xml',
        sizes: 'any'
      }
    ];
    const NEWTAB_FAVICON_THEME_QUERY = '(prefers-color-scheme: dark)';
    const NEWTAB_FAVICON_THEME_BROADCAST_CHANNEL = 'lumno:newtab-favicon-theme';
    const NEWTAB_FAVICON_THEME_REFRESH_ACTION = 'lumno:newtab-favicon-theme-refresh';
    const NEWTAB_FAVICON_PRELOAD_STORAGE_KEY = '_x_extension_newtab_favicon_preload_2026_unique_';
    const NEWTAB_FAVICON_SVG_SHADOW_PATH = 'M14.1832 28.5107C14.7736 26.0503 17.4872 24.8712 19.8045 25.8872L29.0688 29.9483C23.1024 42.5571 20.9583 59.1892 34.0764 74.4517C35.5367 76.1508 37.0158 77.6786 38.5039 79.0511C15.0742 61.6944 10.3754 44.3784 14.1832 28.5107ZM50.1563 62.6667C55.3534 57.1072 64.2555 57.3891 69.0898 63.2669L69.4706 63.7295C65.5069 61.937 61.0203 61.3468 56.5866 62.1747L49.3526 63.5259L50.1563 62.6667Z';
    const NEWTAB_FAVICON_SVG_MAIN_PATH = 'M34.0761 74.4516C15.8955 53.2991 27.0297 29.5157 37.0262 17.4579C38.6314 15.5217 41.5522 15.6368 43.1924 17.5435L54.2217 30.3654C58.8053 35.6938 59.7099 43.2656 56.5107 49.524L49.3531 63.5257L56.8412 62.1274C64.6007 60.6784 72.5332 63.5719 77.5374 69.6765L83.762 77.2699C85.0646 78.859 85.0813 81.1684 83.4746 82.4491C74.4334 89.6554 52.1633 95.4955 34.0761 74.4516Z';
    const NEWTAB_FAVICON_THEMES = {
      light: {
        color: '#000000',
        shadowOpacity: '0.2',
        mainOpacity: '0.5'
      },
      dark: {
        color: '#f1f3f4',
        shadowOpacity: '0.34',
        mainOpacity: '0.72'
      }
    };
    const WALLPAPER_PANEL_RESIZE_DURATION_MS = 260;
    const WALLPAPER_PANEL_RESIZE_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
    const WALLPAPER_VISUAL_TRANSITION_MS = 220;
    const WALLPAPER_VISUAL_REFRESH_DELAY_MS = 80;
    const WALLPAPER_IMAGE_READY_CACHE_LIMIT = 8;

    let initialWallpaperApplied = false;
    let hasWallpaperBootstrapStarted = false;
    let hasNewtabFaviconBootstrapStarted = false;
    let resolveInitialWallpaperReady = null;
    const initialWallpaperReadyPromise = new Promise((resolve) => {
      resolveInitialWallpaperReady = resolve;
    });
    let initialNewtabFaviconReadyPromise = null;
    let initialWallpaperOverlayReadyPromise = null;
    let wallpaperControl = null;
    let wallpaperButton = null;
    let wallpaperPanel = null;
    let wallpaperPanelHeader = null;
    let wallpaperPanelTitle = null;
    let wallpaperEnabledToggle = null;
    let logoPanelTitle = null;
    let logoEnabledToggle = null;
    let wallpaperAppearanceTitle = null;
    let wallpaperAppearanceInfoButton = null;
    let wallpaperAppearanceScopeTabs = null;
    let wallpaperAppearanceOptions = null;
    let wallpaperSearchWidthControl = null;
    let wallpaperSearchWidthLabel = null;
    let wallpaperSearchWidthValue = null;
    let wallpaperSearchWidthSlider = null;
    let wallpaperAppearanceMoreSettingsLink = null;
    let wallpaperAppearanceMoreSettingsText = null;
    let wallpaperSearchWidthSaveTimer = null;
    let wallpaperOverlayLabel = null;
    let wallpaperOverlaySlider = null;
    let wallpaperEffectLabel = null;
    let wallpaperEffectOptions = null;
    let wallpaperEffectTabsIndicator = null;
    let wallpaperEffectStrengthControl = null;
    let wallpaperEffectHoverControl = null;
    let wallpaperEffectHoverTitle = null;
    let wallpaperEffectHoverToggle = null;
    let wallpaperEffectStrengthLabel = null;
    let wallpaperEffectSlider = null;
    let wallpaperEffectSizeControl = null;
    let wallpaperEffectSizeLabel = null;
    let wallpaperEffectSizeSlider = null;
    let wallpaperEffectSpacingControl = null;
    let wallpaperEffectSpacingLabel = null;
    let wallpaperEffectSpacingSlider = null;
    let newtabFaviconTitle = null;
    let newtabFaviconOptions = null;
    let newtabFaviconThemeQueryList = null;
    let newtabFaviconThemeChangeHandler = null;
    let hasNewtabFaviconLifecycleListeners = false;
    let newtabFaviconLifecycleRefreshHandler = null;
    let newtabFaviconThemeBroadcastChannel = null;
    let hasNewtabFaviconThemeBroadcastListener = false;
    let wallpaperSliderValueBubble = null;
    let wallpaperSliderValueHideTimer = null;
    let wallpaperSliderValueTarget = null;
    let wallpaperSliderValueDragTarget = null;
    let wallpaperOverlaySaveTimer = null;
    let wallpaperEffectSaveTimer = null;
    let wallpaperPanelResizeTimer = null;
    let wallpaperPanelResizeCleanup = null;
    let wallpaperTabsIndicatorRefreshFrame = 0;
    let wallpaperEffectTabsIndicatorRefreshFrame = 0;
    let wallpaperActiveSlider = null;
    let wallpaperAppearanceAnimationTimers = [];
    let wallpaperAppearanceModeLabelsHeld = false;
    let customWallpapers = [];
    let customWallpaperUploadTile = null;
    let customWallpaperInput = null;
    let customWallpaperImporting = false;
    let wallpaperStorageChangeSeq = 0;
    let wallpaperVisualSeq = 0;
    let wallpaperVisualRefreshTimer = 0;
    let appliedWallpaperVisualUrl = '';
    let appliedWallpaperVisualActive = false;
    const wallpaperImageReadyCache = new Map();

    function appendChildren(parent, children) {
      (children || []).forEach((child) => {
        if (child) {
          parent.appendChild(child);
        }
      });
      return parent;
    }

    function createDomElement(tagName, options) {
      const element = document.createElement(tagName);
      const config = options || {};
      if (config.className) {
        element.className = config.className;
      }
      if (config.textContent !== undefined) {
        element.textContent = config.textContent;
      }
      if (config.innerHTML !== undefined) {
        element.innerHTML = config.innerHTML;
      }
      Object.keys(config.attrs || {}).forEach((name) => {
        const value = config.attrs[name];
        if (value !== null && value !== undefined) {
          element.setAttribute(name, String(value));
        }
      });
      appendChildren(element, config.children);
      return element;
    }

    function createPanelDivider() {
      return createDomElement('div', { className: 'x-nt-panel-divider' });
    }

    function createWallpaperSwitch(onChange) {
      const label = createDomElement('label', { className: 'x-nt-wallpaper-switch' });
      const input = createDomElement('input', { attrs: { role: 'switch' } });
      const slider = createDomElement('span', {
        className: 'x-nt-wallpaper-switch-slider',
        attrs: { 'aria-hidden': 'true' }
      });
      input.type = 'checkbox';
      if (typeof onChange === 'function') {
        input.addEventListener('change', onChange);
      }
      appendChildren(label, [input, slider]);
      return { label, input };
    }

    function createSwitchPanelSection(onChange) {
      const section = createDomElement('div', { className: 'x-nt-wallpaper-section' });
      const header = createDomElement('div', { className: 'x-nt-wallpaper-panel-header' });
      const title = createDomElement('div', { className: 'x-nt-wallpaper-panel-title' });
      const switchControl = createWallpaperSwitch(onChange);
      appendChildren(header, [title, switchControl.label]);
      section.appendChild(header);
      return { section, header, title, toggle: switchControl.input };
    }

    function createOverlayScale(items) {
      const scale = createDomElement('div', { className: 'x-nt-overlay-scale' });
      (items || []).forEach((item) => {
        const tickAttrs = { 'data-align': item.align || 'center' };
        if (item.key) {
          tickAttrs['data-overlay-tick'] = item.key;
        }
        scale.appendChild(createDomElement('span', {
          className: 'x-nt-overlay-tick',
          textContent: item.text,
          attrs: tickAttrs
        }));
      });
      return scale;
    }

    function createDefaultEffectScale() {
      return createOverlayScale([
        { align: 'start', text: '0' },
        { align: 'center', text: t('newtab_wallpaper_overlay_default_tick', 'Default'), key: 'default' },
        { align: 'end', text: '100%' }
      ]);
    }

    function ensureWallpaperSliderValueBubble() {
      if (wallpaperSliderValueBubble && wallpaperSliderValueBubble.isConnected) {
        return wallpaperSliderValueBubble;
      }
      wallpaperSliderValueBubble = document.createElement('div');
      wallpaperSliderValueBubble.id = '_x_extension_newtab_slider_value_bubble_2026_unique_';
      wallpaperSliderValueBubble.className = 'x-lumno-feature-hint x-nt-slider-value-bubble';
      wallpaperSliderValueBubble.setAttribute('data-visible', 'false');
      wallpaperSliderValueBubble.setAttribute('data-arrow-side', 'bottom');
      wallpaperSliderValueBubble.setAttribute('data-arrow-align', 'center');
      wallpaperSliderValueBubble.setAttribute('aria-hidden', 'true');
      const host = document.body || document.documentElement;
      if (host) {
        host.appendChild(wallpaperSliderValueBubble);
      }
      return wallpaperSliderValueBubble;
    }

    function isElementHovered(element) {
      if (!element || typeof element.matches !== 'function') {
        return false;
      }
      try {
        return element.matches(':hover');
      } catch (e) {
        return false;
      }
    }

    function isElementFocusVisible(element) {
      if (!element || typeof element.matches !== 'function') {
        return false;
      }
      try {
        return element.matches(':focus-visible');
      } catch (e) {
        return false;
      }
    }

    function formatWallpaperSliderValue(slider) {
      if (!slider) {
        return '';
      }
      const value = Number(slider.value);
      if (!Number.isFinite(value)) {
        return String(slider.value || '');
      }
      const suffix = slider.getAttribute('data-value-suffix') || '';
      return `${Math.round(value)}${suffix}`;
    }

    function getWallpaperSliderPercent(slider) {
      const min = Number(slider && slider.min);
      const max = Number(slider && slider.max);
      const value = Number(slider && slider.value);
      if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min || !Number.isFinite(value)) {
        return 0;
      }
      return clampNumber((value - min) / (max - min), 0, 1);
    }

    function shouldShowWallpaperSliderValue(slider) {
      return Boolean(slider && slider.isConnected && !slider.disabled &&
        (wallpaperSliderValueDragTarget === slider ||
          (document.activeElement === slider && isElementFocusVisible(slider)) ||
          isElementHovered(slider)));
    }

    function positionWallpaperSliderValueBubble(slider) {
      const bubble = ensureWallpaperSliderValueBubble();
      if (!bubble || !slider) {
        return;
      }
      bubble.textContent = formatWallpaperSliderValue(slider);
      const sliderRect = slider.getBoundingClientRect();
      const bubbleRect = bubble.getBoundingClientRect();
      const viewportWidth = Math.max(0, window.innerWidth || 0);
      const thumbSize = 16;
      const percent = getWallpaperSliderPercent(slider);
      const centerX = sliderRect.left + (thumbSize / 2) + Math.max(0, sliderRect.width - thumbSize) * percent;
      const spacing = 12;
      let arrowSide = 'bottom';
      let top = sliderRect.top - bubbleRect.height - spacing;
      if (top < 8) {
        arrowSide = 'top';
        top = sliderRect.bottom + spacing;
      }
      const maxLeft = viewportWidth > 0 ? viewportWidth - bubbleRect.width - 8 : centerX;
      const left = clampNumber(centerX - (bubbleRect.width / 2), 8, Math.max(8, maxLeft));
      bubble.setAttribute('data-arrow-side', arrowSide);
      bubble.setAttribute('data-arrow-align', 'center');
      bubble.style.setProperty('top', `${Math.round(top)}px`);
      bubble.style.setProperty('left', `${Math.round(left)}px`);
    }

    function syncWallpaperSliderValueBubble(slider) {
      if (wallpaperSliderValueTarget !== slider) {
        return;
      }
      if (!shouldShowWallpaperSliderValue(slider)) {
        hideWallpaperSliderValueBubble(slider, { force: true });
        return;
      }
      positionWallpaperSliderValueBubble(slider);
      if (wallpaperSliderValueBubble) {
        wallpaperSliderValueBubble.setAttribute('data-visible', 'true');
      }
    }

    function showWallpaperSliderValueBubble(slider) {
      if (!slider || slider.disabled) {
        return;
      }
      wallpaperSliderValueTarget = slider;
      if (wallpaperSliderValueHideTimer !== null) {
        window.clearTimeout(wallpaperSliderValueHideTimer);
        wallpaperSliderValueHideTimer = null;
      }
      positionWallpaperSliderValueBubble(slider);
      window.requestAnimationFrame(() => {
        if (wallpaperSliderValueTarget !== slider || !shouldShowWallpaperSliderValue(slider)) {
          return;
        }
        if (wallpaperSliderValueBubble) {
          wallpaperSliderValueBubble.setAttribute('data-visible', 'true');
        }
      });
    }

    function hideWallpaperSliderValueBubble(slider, options) {
      const force = Boolean(options && options.force);
      const target = slider || wallpaperSliderValueTarget;
      if (!target && !wallpaperSliderValueBubble) {
        return;
      }
      if (!force && target && wallpaperSliderValueDragTarget === target) {
        return;
      }
      if (!force && target && shouldShowWallpaperSliderValue(target)) {
        return;
      }
      wallpaperSliderValueTarget = null;
      if (wallpaperSliderValueBubble) {
        wallpaperSliderValueBubble.setAttribute('data-visible', 'false');
      }
      if (wallpaperSliderValueHideTimer !== null) {
        window.clearTimeout(wallpaperSliderValueHideTimer);
      }
      wallpaperSliderValueHideTimer = window.setTimeout(() => {
        wallpaperSliderValueHideTimer = null;
      }, 180);
    }

    function finishWallpaperSliderValueDrag() {
      const slider = wallpaperSliderValueDragTarget;
      wallpaperSliderValueDragTarget = null;
      window.removeEventListener('pointerup', finishWallpaperSliderValueDrag, true);
      window.removeEventListener('pointercancel', finishWallpaperSliderValueDrag, true);
      if (slider && shouldShowWallpaperSliderValue(slider)) {
        showWallpaperSliderValueBubble(slider);
        return;
      }
      hideWallpaperSliderValueBubble(slider, { force: true });
    }

    function blurWallpaperPanelActiveElement() {
      const activeElement = document.activeElement;
      if (!activeElement || !wallpaperPanel || !wallpaperPanel.contains(activeElement)) {
        return;
      }
      if (typeof activeElement.blur !== 'function') {
        return;
      }
      activeElement.blur();
    }

    function cancelWallpaperPanelActiveControls() {
      finishWallpaperSliderValueDrag();
      wallpaperActiveSlider = null;
      blurWallpaperPanelActiveElement();
    }

    function bindWallpaperSliderValueBubble(slider) {
      if (!slider) {
        return;
      }
      slider.addEventListener('mouseenter', () => {
        showWallpaperSliderValueBubble(slider);
      });
      slider.addEventListener('mousemove', () => {
        syncWallpaperSliderValueBubble(slider);
      });
      slider.addEventListener('mouseleave', () => {
        hideWallpaperSliderValueBubble(slider);
      });
      slider.addEventListener('focus', () => {
        showWallpaperSliderValueBubble(slider);
      });
      slider.addEventListener('blur', () => {
        hideWallpaperSliderValueBubble(slider, { force: true });
      });
      slider.addEventListener('pointerdown', () => {
        if (slider.disabled) {
          return;
        }
        wallpaperSliderValueDragTarget = slider;
        showWallpaperSliderValueBubble(slider);
        window.addEventListener('pointerup', finishWallpaperSliderValueDrag, true);
        window.addEventListener('pointercancel', finishWallpaperSliderValueDrag, true);
      });
      slider.addEventListener('input', () => {
        showWallpaperSliderValueBubble(slider);
      });
      slider.addEventListener('change', () => {
        syncWallpaperSliderValueBubble(slider);
      });
    }

    function setWallpaperActiveSlider(slider) {
      wallpaperActiveSlider = slider || null;
    }

    function clearWallpaperActiveSlider(slider) {
      if (!slider || wallpaperActiveSlider === slider) {
        wallpaperActiveSlider = null;
      }
    }

    function createWallpaperSliderInput(config) {
      const slider = createDomElement('input', {
        className: config.sliderClass || config.className || 'x-nt-overlay-slider x-nt-effect-slider',
        attrs: {
          'aria-label': t(config.labelKey, config.fallback),
          min: '0',
          max: '100',
          step: '1'
        }
      });
      slider.type = 'range';
      slider.addEventListener('pointerdown', () => {
        setWallpaperActiveSlider(slider);
      });
      slider.addEventListener('pointerup', () => {
        clearWallpaperActiveSlider(slider);
      });
      slider.addEventListener('pointercancel', () => {
        clearWallpaperActiveSlider(slider);
      });
      slider.addEventListener('blur', () => {
        clearWallpaperActiveSlider(slider);
      });
      slider.addEventListener('input', () => {
        const fallbackValue = typeof config.getFallbackValue === 'function'
          ? config.getFallbackValue()
          : Number(slider.value);
        const value = wallpaperActiveSlider === slider
          ? snapWallpaperOverlaySliderValue(slider.value)
          : normalizeWallpaperOverlayOpacity(slider.value, fallbackValue);
        if (String(value) !== slider.value) {
          slider.value = String(value);
        }
        config.persist(value);
      });
      bindWallpaperSliderValueBubble(slider);
      return slider;
    }

    function createWallpaperSliderControl(config) {
      const control = createDomElement('div', {
        className: config.controlClass || 'x-nt-effect-slider-control',
        attrs: { 'data-visible': 'true' }
      });
      const header = createDomElement('div', {
        className: config.headerClass || 'x-nt-overlay-control-header'
      });
      const label = createDomElement('span', {
        className: config.labelClass || 'x-nt-effect-slider-label'
      });
      const wrap = createDomElement('div', {
        className: config.wrapClass || 'x-nt-overlay-slider-wrap x-nt-effect-slider-wrap'
      });
      const slider = createWallpaperSliderInput(config);
      header.appendChild(label);
      appendChildren(wrap, [slider, config.scale || createDefaultEffectScale()]);
      appendChildren(control, [header, wrap]);
      return { control, label, slider, wrap };
    }

    function createEffectToggleControl() {
      const control = createDomElement('div', {
        className: 'x-nt-effect-slider-control x-nt-effect-toggle-control',
        attrs: { 'data-visible': 'true' }
      });
      const header = createDomElement('div', {
        className: 'x-nt-overlay-control-header x-nt-effect-toggle-header'
      });
      const title = createDomElement('span', { className: 'x-nt-effect-slider-label' });
      const switchControl = createWallpaperSwitch(() => {
        persistWallpaperEffectPrefs({ hover: Boolean(switchControl.input.checked) });
      });
      appendChildren(header, [title, switchControl.label]);
      control.appendChild(header);
      return { control, title, toggle: switchControl.input };
    }

    let currentWallpaperOverlayOpacity = {
      light: NEWTAB_WALLPAPER_OVERLAY_DEFAULTS.light,
      dark: NEWTAB_WALLPAPER_OVERLAY_DEFAULTS.dark
    };
    let currentWallpaperEffectPrefs = Object.assign({}, NEWTAB_WALLPAPER_EFFECT_DEFAULTS);
    let wallpaperBuiltInGrid = null;
    let wallpaperLocalGrid = null;
    let wallpaperBody = null;
    let wallpaperTabs = null;
    let wallpaperTabsIndicator = null;
    let wallpaperBuiltInTab = null;
    let wallpaperLocalTab = null;
    let activeWallpaperTab = 'built-in';
    let wallpaperPanelRendered = false;
    let currentWallpaperId = '';
    let lastActiveWallpaperId = '';
    let localWallpaperOverrideActive = false;
    let currentWordmarkVisible = normalizeNewtabWordmarkVisible(getWordmarkVisible());
    let currentNewtabFaviconId = NEWTAB_FAVICON_DEFAULT_ID;

    function isCustomWallpaperId(id) {
      if (localWallpaperStore) {
        return localWallpaperStore.isCustomWallpaperId(id);
      }
      return String(id || '').startsWith(NEWTAB_CUSTOM_WALLPAPER_ID_PREFIX);
    }

    function getCustomWallpaperById(id) {
      const normalizedId = String(id || '').trim();
      if (!normalizedId) {
        return null;
      }
      return customWallpapers.find((item) => item && item.id === normalizedId) || null;
    }

    function getWallpaperById(id) {
      const normalizedId = String(id || '').trim();
      if (!normalizedId) {
        return null;
      }
      if (isCustomWallpaperId(normalizedId)) {
        return getCustomWallpaperById(normalizedId);
      }
      return NEWTAB_WALLPAPER_OPTIONS.find((item) => item && item.id === normalizedId) || null;
    }

    function getWallpaperTileContainers() {
      return [wallpaperBuiltInGrid, wallpaperLocalGrid].filter(Boolean);
    }

    function getWallpaperRestoreId() {
      return normalizeNewtabWallpaperId(lastActiveWallpaperId) || NEWTAB_WALLPAPER_DEFAULT_ID;
    }

    function normalizeNewtabWordmarkVisible(value) {
      return value !== false;
    }

    function getNewtabFaviconById(id) {
      const normalizedId = String(id || '').trim();
      return NEWTAB_FAVICON_OPTIONS.find((item) => item && item.id === normalizedId) || null;
    }

    function normalizeNewtabFaviconId(value) {
      const raw = value && typeof value === 'object' && value.id
        ? value.id
        : value;
      const id = String(raw || '').trim();
      return getNewtabFaviconById(id) ? id : NEWTAB_FAVICON_DEFAULT_ID;
    }

    function getNewtabFaviconDisplayName(item) {
      if (!item) {
        return '';
      }
      return t(item.nameKey, item.fallbackName || item.id || '');
    }

    function getNewtabFaviconUrl(item) {
      return item && item.file ? getRuntimeAssetUrl(item.file) : '';
    }

    function getNewtabFaviconThemeQueryList() {
      if (!window || typeof window.matchMedia !== 'function') {
        return null;
      }
      try {
        return window.matchMedia(NEWTAB_FAVICON_THEME_QUERY);
      } catch (_error) {
        return null;
      }
    }

    function getNewtabFaviconBrowserTheme() {
      const queryList = getNewtabFaviconThemeQueryList();
      return queryList && queryList.matches ? 'dark' : 'light';
    }

    function buildNewtabFaviconSvgDataUrl(themeName) {
      const theme = NEWTAB_FAVICON_THEMES[themeName] || NEWTAB_FAVICON_THEMES.light;
      const svg = [
        '<svg width="104" height="104" viewBox="0 0 104 104" fill="none" xmlns="http://www.w3.org/2000/svg">',
        `<path opacity="${theme.shadowOpacity}" d="${NEWTAB_FAVICON_SVG_SHADOW_PATH}" fill="${theme.color}"/>`,
        `<path d="${NEWTAB_FAVICON_SVG_MAIN_PATH}" fill="${theme.color}" fill-opacity="${theme.mainOpacity}"/>`,
        '</svg>'
      ].join('');
      return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }

    function getNewtabFaviconHref(item) {
      if (item && item.themeAwareSvg) {
        return buildNewtabFaviconSvgDataUrl(getNewtabFaviconBrowserTheme());
      }
      return getNewtabFaviconUrl(item);
    }

    function cacheNewtabFaviconPreloadId(id) {
      const normalizedId = normalizeNewtabFaviconId(id);
      try {
        if (window && window.localStorage) {
          window.localStorage.setItem(NEWTAB_FAVICON_PRELOAD_STORAGE_KEY, normalizedId);
        }
      } catch (_error) {
        // The main runtime still applies the favicon even when localStorage is unavailable.
      }
    }

    function clearNewtabFaviconThemeListener() {
      if (!newtabFaviconThemeQueryList || !newtabFaviconThemeChangeHandler) {
        newtabFaviconThemeQueryList = null;
        newtabFaviconThemeChangeHandler = null;
        return;
      }
      if (typeof newtabFaviconThemeQueryList.removeEventListener === 'function') {
        newtabFaviconThemeQueryList.removeEventListener('change', newtabFaviconThemeChangeHandler);
      } else if (typeof newtabFaviconThemeQueryList.removeListener === 'function') {
        newtabFaviconThemeQueryList.removeListener(newtabFaviconThemeChangeHandler);
      }
      newtabFaviconThemeQueryList = null;
      newtabFaviconThemeChangeHandler = null;
    }

    function applyNewtabFaviconLinkAttributes(link, item) {
      const themeName = item && item.themeAwareSvg ? getNewtabFaviconBrowserTheme() : '';
      link.setAttribute('rel', 'icon');
      link.setAttribute('type', item.type || 'image/png');
      link.setAttribute('href', getNewtabFaviconHref(item));
      if (item.sizes) {
        link.setAttribute('sizes', item.sizes);
      } else {
        link.removeAttribute('sizes');
      }
      link.setAttribute('data-newtab-favicon-id', item.id);
      if (themeName) {
        link.setAttribute('data-lumno-newtab-favicon-theme', themeName);
      } else {
        link.removeAttribute('data-lumno-newtab-favicon-theme');
      }
    }

    function refreshNewtabFaviconLink() {
      const item = getNewtabFaviconById(currentNewtabFaviconId) ||
        getNewtabFaviconById(NEWTAB_FAVICON_DEFAULT_ID);
      const link = getNewtabFaviconLink();
      if (link && item) {
        applyNewtabFaviconLinkAttributes(link, item);
      }
    }

    function refreshNewtabFaviconLinkIfThemeAware() {
      const item = getNewtabFaviconById(currentNewtabFaviconId);
      if (item && item.themeAwareSvg) {
        refreshNewtabFaviconLink();
      }
    }

    function getNewtabFaviconThemeBroadcastChannel() {
      if (newtabFaviconThemeBroadcastChannel) {
        return newtabFaviconThemeBroadcastChannel;
      }
      if (typeof BroadcastChannelCtor !== 'function') {
        return null;
      }
      try {
        newtabFaviconThemeBroadcastChannel = new BroadcastChannelCtor(NEWTAB_FAVICON_THEME_BROADCAST_CHANNEL);
      } catch (_error) {
        newtabFaviconThemeBroadcastChannel = null;
      }
      return newtabFaviconThemeBroadcastChannel;
    }

    function bindNewtabFaviconThemeBroadcastListener() {
      if (hasNewtabFaviconThemeBroadcastListener) {
        return;
      }
      hasNewtabFaviconThemeBroadcastListener = true;
      const channel = getNewtabFaviconThemeBroadcastChannel();
      if (!channel) {
        return;
      }
      const handleMessage = (event) => {
        const data = event && event.data ? event.data : null;
        if (!data || data.action !== NEWTAB_FAVICON_THEME_REFRESH_ACTION) {
          return;
        }
        refreshNewtabFaviconLinkIfThemeAware();
      };
      if (typeof channel.addEventListener === 'function') {
        channel.addEventListener('message', handleMessage);
      } else {
        channel.onmessage = handleMessage;
      }
    }

    function broadcastNewtabFaviconThemeRefresh() {
      const channel = getNewtabFaviconThemeBroadcastChannel();
      if (!channel || typeof channel.postMessage !== 'function') {
        return;
      }
      try {
        channel.postMessage({
          action: NEWTAB_FAVICON_THEME_REFRESH_ACTION,
          at: Date.now()
        });
      } catch (_error) {
        // BroadcastChannel can be unavailable in constrained extension contexts.
      }
    }

    function bindNewtabFaviconLifecycleRefreshListeners() {
      if (hasNewtabFaviconLifecycleListeners) {
        return;
      }
      hasNewtabFaviconLifecycleListeners = true;
      newtabFaviconLifecycleRefreshHandler = () => {
        refreshNewtabFaviconLinkIfThemeAware();
      };
      if (window && typeof window.addEventListener === 'function') {
        window.addEventListener('focus', newtabFaviconLifecycleRefreshHandler, { passive: true });
        window.addEventListener('pageshow', newtabFaviconLifecycleRefreshHandler, { passive: true });
      }
      if (document && typeof document.addEventListener === 'function') {
        document.addEventListener('visibilitychange', newtabFaviconLifecycleRefreshHandler, { passive: true });
      }
    }

    function bindNewtabFaviconThemeListener(item) {
      clearNewtabFaviconThemeListener();
      if (!item || !item.themeAwareSvg) {
        return;
      }
      bindNewtabFaviconLifecycleRefreshListeners();
      bindNewtabFaviconThemeBroadcastListener();
      const queryList = getNewtabFaviconThemeQueryList();
      if (!queryList) {
        return;
      }
      newtabFaviconThemeQueryList = queryList;
      newtabFaviconThemeChangeHandler = () => {
        refreshNewtabFaviconLinkIfThemeAware();
        broadcastNewtabFaviconThemeRefresh();
      };
      if (typeof queryList.addEventListener === 'function') {
        queryList.addEventListener('change', newtabFaviconThemeChangeHandler);
      } else if (typeof queryList.addListener === 'function') {
        queryList.addListener(newtabFaviconThemeChangeHandler);
      }
    }

    function normalizeNewtabWallpaperId(value) {
      const raw = value && typeof value === 'object' && value.id
        ? value.id
        : value;
      const id = String(raw || '').trim();
      if (id === NEWTAB_CUSTOM_WALLPAPER_ID) {
        const firstCustomWallpaper = customWallpapers[0];
        return firstCustomWallpaper ? firstCustomWallpaper.id : '';
      }
      if (getWallpaperById(id)) {
        return id;
      }
      const matchedByPath = NEWTAB_WALLPAPER_OPTIONS.find((item) => {
        const localPath = getWallpaperLocalPath(item);
        const runtimePath = getWallpaperRuntimePath(item);
        const legacyFile = getWallpaperLegacyFile(item);
        return id === localPath ||
          id === runtimePath ||
          id.endsWith(`/${item.file}`) ||
          (legacyFile && id.endsWith(`/${legacyFile}`));
      });
      return matchedByPath ? matchedByPath.id : '';
    }

    function getWallpaperLegacyFile(item) {
      const file = item && item.file ? item.file : '';
      return file.endsWith('.webp') ? file.replace(/\.webp$/, '.png') : '';
    }

    function getWallpaperThumbnailFile(item) {
      const file = item && item.file ? item.file : '';
      return file ? file.replace(/\.[^.]+$/, NEWTAB_WALLPAPER_THUMBNAIL_SUFFIX) : '';
    }

    function getWallpaperLocalPath(item) {
      if (!item || !item.file) {
        return '';
      }
      return `${NEWTAB_WALLPAPER_DEFAULT_DIRECTORY}/${item.file}`;
    }

    function getWallpaperRuntimePath(item, options) {
      if (item && isCustomWallpaperId(item.id)) {
        return '';
      }
      if (!item || !item.file) {
        return '';
      }
      const file = options && options.thumbnail ? getWallpaperThumbnailFile(item) : item.file;
      return file ? `${NEWTAB_WALLPAPER_EXTENSION_DIRECTORY}/${file}` : '';
    }

    function getWallpaperImageUrl(item) {
      if (item && isCustomWallpaperId(item.id)) {
        return item.imageDataUrl || '';
      }
      const runtimePath = getWallpaperRuntimePath(item);
      if (!runtimePath) {
        return '';
      }
      if (chrome && chrome.runtime && typeof chrome.runtime.getURL === 'function') {
        return chrome.runtime.getURL(runtimePath);
      }
      return `../../${runtimePath}`;
    }

    function getWallpaperThumbnailUrl(item) {
      if (item && isCustomWallpaperId(item.id)) {
        return item.thumbnailDataUrl || item.imageDataUrl || '';
      }
      const runtimePath = getWallpaperRuntimePath(item, { thumbnail: true });
      if (!runtimePath) {
        return getWallpaperImageUrl(item);
      }
      if (chrome && chrome.runtime && typeof chrome.runtime.getURL === 'function') {
        return chrome.runtime.getURL(runtimePath);
      }
      return `../../${runtimePath}`;
    }

    function getWallpaperDisplayName(item) {
      if (!item) {
        return '';
      }
      if (item.nameKey) {
        return t(item.nameKey, item.fallbackName || item.id || '');
      }
      const storedName = String(item.name || '').trim();
      if (!storedName) {
        return t('newtab_wallpaper_custom_name', 'Local wallpaper');
      }
      return storedName;
    }

    // Used by overlay math; adaptive image sampling lives in wallpaper-adaptive-tone.js.
    function clampNumber(value, min, max) {
      const number = Number(value);
      if (!Number.isFinite(number)) {
        return min;
      }
      return Math.min(max, Math.max(min, number));
    }

    function getViewportSize() {
      const docEl = document.documentElement;
      return {
        width: Math.max(1, window.innerWidth || (docEl ? docEl.clientWidth : 0) || 1),
        height: Math.max(1, window.innerHeight || (docEl ? docEl.clientHeight : 0) || 1)
      };
    }

    function getWallpaperOverlayAlphaAtViewportY(viewportY) {
      const mode = getResolvedWallpaperOverlayMode();
      const stops = NEWTAB_WALLPAPER_OVERLAY_STOPS[mode] || NEWTAB_WALLPAPER_OVERLAY_STOPS.light;
      const opacity = getWallpaperOverlayOpacityForCurrentMode();
      const topAlpha = getWallpaperOverlayStopPercent(stops.top, opacity) / 100;
      const midAlpha = getWallpaperOverlayStopPercent(stops.mid, opacity) / 100;
      const bottomAlpha = getWallpaperOverlayStopPercent(stops.bottom, opacity) / 100;
      const viewport = getViewportSize();
      const position = clampNumber(viewportY / viewport.height, 0, 1);
      if (position <= 0.42) {
        return topAlpha + ((midAlpha - topAlpha) * (position / 0.42));
      }
      return midAlpha + ((bottomAlpha - midAlpha) * ((position - 0.42) / 0.58));
    }

    function getWallpaperAdaptiveToneTargets() {
      const externalTargets = typeof getAdaptiveToneTargets === 'function'
        ? getAdaptiveToneTargets()
        : [];
      const targets = Array.isArray(externalTargets) ? externalTargets.slice() : [];
      targets.push({
        element: wallpaperButton,
        sampleElement: wallpaperButton,
        minWidth: 54,
        minHeight: 54,
        iconButton: true
      });
      return targets;
    }

    let wallpaperEffects = null;
    const wallpaperAdaptiveTone = typeof WALLPAPER_ADAPTIVE_TONE.createWallpaperAdaptiveTone === 'function'
      ? WALLPAPER_ADAPTIVE_TONE.createWallpaperAdaptiveTone({
        documentObj,
        windowObj,
        getTargets: getWallpaperAdaptiveToneTargets,
        getCurrentWallpaper: () => getWallpaperById(currentWallpaperId),
        getWallpaperImageUrl,
        getOverlayAlphaAtViewportY: getWallpaperOverlayAlphaAtViewportY,
        getOverlayLuminance: () => getResolvedWallpaperOverlayMode() === 'dark' ? 0 : 1,
        getEffectLuminanceAtViewport: (viewportX, viewportY, baseLuminance) => {
          return wallpaperEffects && typeof wallpaperEffects.getLuminanceAtViewport === 'function'
            ? wallpaperEffects.getLuminanceAtViewport(viewportX, viewportY, baseLuminance)
            : null;
        },
        applyWordmarkThemeAppearance
      })
      : null;
    wallpaperEffects = typeof WALLPAPER_EFFECTS.createWallpaperEffects === 'function'
      ? WALLPAPER_EFFECTS.createWallpaperEffects({
        documentObj,
        windowObj,
        getCurrentWallpaper: () => getWallpaperById(currentWallpaperId),
        getWallpaperImageUrl,
        onRender: scheduleWallpaperAdaptiveToneUpdate
      })
      : null;

    function scheduleWallpaperAdaptiveToneUpdate() {
      if (wallpaperAdaptiveTone) {
        wallpaperAdaptiveTone.schedule();
      }
    }

    function refreshWallpaperAdaptiveSampler() {
      if (wallpaperAdaptiveTone) {
        wallpaperAdaptiveTone.refresh();
      }
    }

    function refreshWallpaperEffects() {
      if (wallpaperEffects) {
        wallpaperEffects.refresh();
      }
    }

    function getRuntimeAssetUrl(path) {
      const value = String(path || '').trim();
      if (!value) {
        return '';
      }
      if (chrome && chrome.runtime && typeof chrome.runtime.getURL === 'function') {
        return chrome.runtime.getURL(value);
      }
      return `../../${value}`;
    }

    function getCssUrlValue(url) {
      const safe = String(url || '')
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '')
        .replace(/\r/g, '');
      return safe ? `url("${safe}")` : 'none';
    }

    function cacheWallpaperImageReady(url, promise) {
      if (!url || !promise) {
        return;
      }
      if (wallpaperImageReadyCache.has(url)) {
        wallpaperImageReadyCache.delete(url);
      }
      wallpaperImageReadyCache.set(url, promise);
      while (wallpaperImageReadyCache.size > WALLPAPER_IMAGE_READY_CACHE_LIMIT) {
        const firstKey = wallpaperImageReadyCache.keys().next().value;
        wallpaperImageReadyCache.delete(firstKey);
      }
    }

    function waitForWallpaperImageReady(url) {
      const imageUrl = String(url || '').trim();
      if (!imageUrl) {
        return Promise.resolve();
      }
      const cached = wallpaperImageReadyCache.get(imageUrl);
      if (cached) {
        return cached;
      }
      const promise = new Promise((resolve) => {
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => {
          if (typeof image.decode === 'function') {
            image.decode().then(resolve).catch(resolve);
            return;
          }
          resolve();
        };
        image.onerror = resolve;
        image.src = imageUrl;
      });
      cacheWallpaperImageReady(imageUrl, promise);
      return promise;
    }

    function createWallpaperTransitionLayer() {
      if (!document.body || shouldReduceMotion()) {
        return null;
      }
      const computedStyle = window.getComputedStyle(document.body);
      const layer = document.createElement('div');
      layer.className = 'x-nt-wallpaper-transition-layer';
      layer.style.backgroundColor = computedStyle.backgroundColor;
      layer.style.backgroundImage = computedStyle.backgroundImage;
      layer.style.backgroundSize = computedStyle.backgroundSize;
      layer.style.backgroundPosition = computedStyle.backgroundPosition;
      layer.style.backgroundRepeat = computedStyle.backgroundRepeat;
      layer.style.backgroundAttachment = 'fixed';
      document.body.insertBefore(layer, document.body.firstChild);
      return layer;
    }

    function releaseWallpaperTransitionLayer(layer) {
      if (!layer || !layer.parentNode) {
        return;
      }
      window.requestAnimationFrame(() => {
        layer.setAttribute('data-exit', 'true');
        window.setTimeout(() => {
          if (layer.parentNode) {
            layer.parentNode.removeChild(layer);
          }
        }, WALLPAPER_VISUAL_TRANSITION_MS + 80);
      });
    }

    function applyWallpaperVisualState(wallpaper) {
      const target = document.documentElement;
      const imageUrl = wallpaper ? getWallpaperImageUrl(wallpaper) : '';
      appliedWallpaperVisualUrl = imageUrl;
      appliedWallpaperVisualActive = Boolean(wallpaper);
      if (target) {
        target.style.setProperty('--x-nt-wallpaper-image', imageUrl ? getCssUrlValue(imageUrl) : 'none');
        target.style.setProperty('--x-nt-wallpaper-size', 'cover');
        target.style.setProperty('--x-nt-wallpaper-position', 'center center');
        target.setAttribute('data-wallpaper-active', wallpaper ? 'true' : 'false');
      }
      if (document.body) {
        document.body.setAttribute('data-wallpaper-active', wallpaper ? 'true' : 'false');
      }
      return imageUrl;
    }

    function runWallpaperVisualRefresh(seq) {
      if (seq !== wallpaperVisualSeq) {
        return;
      }
      refreshWallpaperAdaptiveSampler();
      refreshWallpaperEffects();
    }

    function scheduleWallpaperVisualRefresh(seq) {
      if (wallpaperVisualRefreshTimer) {
        window.clearTimeout(wallpaperVisualRefreshTimer);
        wallpaperVisualRefreshTimer = 0;
      }
      wallpaperVisualRefreshTimer = window.setTimeout(() => {
        wallpaperVisualRefreshTimer = 0;
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            runWallpaperVisualRefresh(seq);
          });
        });
      }, WALLPAPER_VISUAL_REFRESH_DELAY_MS);
    }

    function getRawWallpaperId(value) {
      return value && typeof value === 'object' && value.id ? value.id : value;
    }

    function shouldWaitForCustomWallpapers(value) {
      const id = String(getRawWallpaperId(value) || '').trim();
      return id === NEWTAB_CUSTOM_WALLPAPER_ID || isCustomWallpaperId(id);
    }

    function hasStorageValue(result, key) {
      return Boolean(result && Object.prototype.hasOwnProperty.call(result, key));
    }

    function readStorageValue(area, key) {
      return new Promise((resolve) => {
        if (!area || !key || typeof area.get !== 'function') {
          resolve({ hasValue: false, value: undefined });
          return;
        }
        area.get([key], (result) => {
          resolve({
            hasValue: hasStorageValue(result, key),
            value: result ? result[key] : undefined
          });
        });
      });
    }

    function writeStorageValue(area, key, value, onError) {
      if (!area || !key || typeof area.set !== 'function') {
        return;
      }
      area.set({ [key]: value }, () => {
        if (chrome.runtime && chrome.runtime.lastError && typeof onError === 'function') {
          onError();
        }
      });
    }

    function writeSyncedWallpaperValue(value, options) {
      writeStorageValue(storageArea, NEWTAB_WALLPAPER_STORAGE_KEY, value, () => {
        if (options && options.showError) {
          showToast(t('newtab_wallpaper_save_error', 'Failed to save wallpaper'), true);
        }
      });
    }

    function writeLocalWallpaperValue(value, options) {
      writeStorageValue(localWallpaperStorageArea, NEWTAB_LOCAL_WALLPAPER_STORAGE_KEY, value, () => {
        if (options && options.showError) {
          showToast(t('newtab_wallpaper_save_error', 'Failed to save wallpaper'), true);
        }
      });
    }

    function resolveLocalWallpaperOverride(value, hasValue) {
      if (!hasValue) {
        return { hasOverride: false, id: '', shouldClear: false };
      }
      const rawId = String(getRawWallpaperId(value) || '').trim();
      if (rawId === NEWTAB_LOCAL_WALLPAPER_DISABLED_VALUE) {
        return { hasOverride: true, id: '', shouldClear: false };
      }
      const nextId = normalizeNewtabWallpaperId(value);
      if (nextId && isCustomWallpaperId(nextId)) {
        return { hasOverride: true, id: nextId, shouldClear: false };
      }
      return { hasOverride: false, id: '', shouldClear: Boolean(rawId) };
    }

    function resolveSyncedWallpaperValue(value, hasValue) {
      const raw = hasValue ? value : NEWTAB_WALLPAPER_DEFAULT_ID;
      if (shouldWaitForCustomWallpapers(raw)) {
        const nextCustomId = normalizeNewtabWallpaperId(raw);
        if (nextCustomId && isCustomWallpaperId(nextCustomId)) {
          return {
            id: nextCustomId,
            sanitizedId: NEWTAB_WALLPAPER_DEFAULT_ID,
            migrateCustomToLocal: true
          };
        }
        return {
          id: NEWTAB_WALLPAPER_DEFAULT_ID,
          sanitizedId: NEWTAB_WALLPAPER_DEFAULT_ID,
          migrateCustomToLocal: false
        };
      }
      const nextId = normalizeNewtabWallpaperId(raw);
      return {
        id: nextId,
        sanitizedId: !hasValue || (raw && raw !== nextId) ? nextId : null,
        migrateCustomToLocal: false
      };
    }

    function writeWallpaperPreloadCache(wallpaper) {
      try {
        if (!window.localStorage) {
          return;
        }
        const path = wallpaper && !isCustomWallpaperId(wallpaper.id)
          ? getWallpaperRuntimePath(wallpaper)
          : '';
        if (!path) {
          window.localStorage.removeItem(PRELOAD_STORAGE_KEY);
          return;
        }
        window.localStorage.setItem(PRELOAD_STORAGE_KEY, JSON.stringify({
          version: 1,
          id: wallpaper.id,
          path,
          updatedAt: Date.now()
        }));
      } catch (e) {
        // localStorage may be unavailable in constrained contexts; storage is only a fast-path cache.
      }
    }

    function normalizeCustomWallpaperRecord(record) {
      return localWallpaperStore ? localWallpaperStore.normalizeRecord(record) : null;
    }

    function readCustomWallpaperRecords() {
      return localWallpaperStore ? localWallpaperStore.readAll() : Promise.resolve([]);
    }

    function writeCustomWallpaperRecord(record) {
      return localWallpaperStore
        ? localWallpaperStore.write(record)
        : Promise.reject(new Error('Local wallpaper store is not available.'));
    }

    function deleteCustomWallpaperRecord(record) {
      return localWallpaperStore
        ? localWallpaperStore.remove(record)
        : Promise.reject(new Error('Local wallpaper store is not available.'));
    }

    function buildCustomWallpaperRecordFromFile(file) {
      return localWallpaperStore
        ? localWallpaperStore.buildRecordFromFile(file)
        : Promise.reject(new Error('Local wallpaper store is not available.'));
    }

    function normalizeWallpaperOverlayOpacity(value, fallback) {
      const fallbackValue = Number.isFinite(Number(fallback)) ? Number(fallback) : 50;
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed)) {
        return Math.max(0, Math.min(100, Math.round(fallbackValue)));
      }
      return Math.max(0, Math.min(100, parsed));
    }

    function snapWallpaperOverlaySliderValue(value) {
      const normalized = normalizeWallpaperOverlayOpacity(value, 50);
      const target = NEWTAB_WALLPAPER_OVERLAY_SNAP_POINTS.find((point) => {
        const threshold = point === 100 ? 0 : NEWTAB_WALLPAPER_OVERLAY_SNAP_THRESHOLD;
        return Math.abs(normalized - point) <= threshold;
      });
      return typeof target === 'number' ? target : normalized;
    }

    function legacyWallpaperOverlayOpacityToSliderValue(value, fallback) {
      return normalizeWallpaperOverlayOpacity(
        Math.round(normalizeWallpaperOverlayOpacity(value, 100) / 2),
        fallback
      );
    }

    function normalizeWallpaperOverlayPrefs(value) {
      if (value && typeof value === 'object') {
        if (value.version !== NEWTAB_WALLPAPER_OVERLAY_STORAGE_VERSION) {
          return {
            version: NEWTAB_WALLPAPER_OVERLAY_STORAGE_VERSION,
            light: legacyWallpaperOverlayOpacityToSliderValue(value.light, NEWTAB_WALLPAPER_OVERLAY_DEFAULTS.light),
            dark: legacyWallpaperOverlayOpacityToSliderValue(value.dark, NEWTAB_WALLPAPER_OVERLAY_DEFAULTS.dark)
          };
        }
        return {
          version: NEWTAB_WALLPAPER_OVERLAY_STORAGE_VERSION,
          light: normalizeWallpaperOverlayOpacity(value.light, NEWTAB_WALLPAPER_OVERLAY_DEFAULTS.light),
          dark: normalizeWallpaperOverlayOpacity(value.dark, NEWTAB_WALLPAPER_OVERLAY_DEFAULTS.dark)
        };
      }
      const shared = typeof value === 'undefined' || value === null
        ? NEWTAB_WALLPAPER_OVERLAY_DEFAULTS.light
        : legacyWallpaperOverlayOpacityToSliderValue(value, NEWTAB_WALLPAPER_OVERLAY_DEFAULTS.light);
      return {
        version: NEWTAB_WALLPAPER_OVERLAY_STORAGE_VERSION,
        light: shared,
        dark: shared
      };
    }

    function getResolvedWallpaperOverlayMode() {
      return document.body && document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    function getWallpaperOverlayOpacityForCurrentMode() {
      const mode = getResolvedWallpaperOverlayMode();
      return normalizeWallpaperOverlayOpacity(
        currentWallpaperOverlayOpacity[mode],
        NEWTAB_WALLPAPER_OVERLAY_DEFAULTS[mode]
      );
    }

    function getWallpaperOverlayStopPercent(base, value) {
      const basePercent = clampNumber(Number(base) || 0, 0, 100);
      const sliderValue = normalizeWallpaperOverlayOpacity(value, 50);
      if (sliderValue <= 50) {
        return basePercent * Math.pow(sliderValue / 50, 1.08);
      }
      const progress = (sliderValue - 50) / 50;
      return basePercent + ((100 - basePercent) * Math.pow(progress, 1.08));
    }

    function formatOverlayCssPercent(base, opacity) {
      const value = getWallpaperOverlayStopPercent(base, opacity);
      return `${Number(value.toFixed(1))}%`;
    }

    function applyWallpaperOverlayOpacity(value) {
      currentWallpaperOverlayOpacity = normalizeWallpaperOverlayPrefs(value);
      const target = document.documentElement;
      if (target) {
        ['light', 'dark'].forEach((mode) => {
          const stops = NEWTAB_WALLPAPER_OVERLAY_STOPS[mode];
          const opacity = currentWallpaperOverlayOpacity[mode];
          target.style.setProperty(`--x-nt-wallpaper-overlay-${mode}-top`, formatOverlayCssPercent(stops.top, opacity));
          target.style.setProperty(`--x-nt-wallpaper-overlay-${mode}-mid`, formatOverlayCssPercent(stops.mid, opacity));
          target.style.setProperty(`--x-nt-wallpaper-overlay-${mode}-bottom`, formatOverlayCssPercent(stops.bottom, opacity));
        });
      }
      updateWallpaperOverlayControlUi();
      scheduleWallpaperAdaptiveToneUpdate();
    }

    function updateWallpaperSliderElement(slider, config) {
      if (!slider) {
        return;
      }
      const value = Number(config.value);
      const normalizedValue = Number.isFinite(value) ? value : 0;
      slider.value = String(normalizedValue);
      slider.style.setProperty('--x-nt-overlay-slider-percent', `${normalizedValue}%`);
      slider.setAttribute('aria-valuenow', String(normalizedValue));
      slider.setAttribute('aria-valuetext', `${normalizedValue}%`);
      if (typeof config.enabled === 'boolean') {
        slider.disabled = !config.enabled;
        if (slider.parentElement) {
          slider.parentElement.setAttribute('data-disabled', config.enabled ? 'false' : 'true');
        }
      }
      if (config.labelKey) {
        slider.setAttribute('aria-label', t(config.labelKey, config.fallback));
      }
      syncWallpaperSliderValueBubble(slider);
    }

    function updateWallpaperOverlayControlUi() {
      const value = getWallpaperOverlayOpacityForCurrentMode();
      updateWallpaperSliderElement(wallpaperOverlaySlider, {
        value,
        labelKey: 'newtab_wallpaper_overlay_opacity',
        fallback: 'Mask effect'
      });
      if (wallpaperOverlayLabel) {
        wallpaperOverlayLabel.textContent = t('newtab_wallpaper_overlay_opacity', 'Mask effect');
      }
    }

    function persistWallpaperOverlayOpacity(mode, value) {
      const nextMode = mode === 'dark' ? 'dark' : 'light';
      const nextValue = normalizeWallpaperOverlayOpacity(value, currentWallpaperOverlayOpacity[nextMode]);
      const nextPrefs = {
        version: NEWTAB_WALLPAPER_OVERLAY_STORAGE_VERSION,
        light: currentWallpaperOverlayOpacity.light,
        dark: currentWallpaperOverlayOpacity.dark,
        [nextMode]: nextValue
      };
      applyWallpaperOverlayOpacity(nextPrefs);
      if (!storageArea) {
        return;
      }
      if (wallpaperOverlaySaveTimer !== null) {
        clearTimeout(wallpaperOverlaySaveTimer);
      }
      wallpaperOverlaySaveTimer = setTimeout(() => {
        wallpaperOverlaySaveTimer = null;
        storageArea.set({ [NEWTAB_WALLPAPER_OVERLAY_STORAGE_KEY]: nextPrefs });
      }, 120);
    }

    function bootstrapInitialWallpaperOverlay() {
      if (initialWallpaperOverlayReadyPromise) {
        return initialWallpaperOverlayReadyPromise;
      }
      initialWallpaperOverlayReadyPromise = new Promise((resolve) => {
        if (!storageArea) {
          applyWallpaperOverlayOpacity({
            version: NEWTAB_WALLPAPER_OVERLAY_STORAGE_VERSION,
            light: NEWTAB_WALLPAPER_OVERLAY_DEFAULTS.light,
            dark: NEWTAB_WALLPAPER_OVERLAY_DEFAULTS.dark
          });
          resolve();
          return;
        }
        storageArea.get([NEWTAB_WALLPAPER_OVERLAY_STORAGE_KEY], (result) => {
          const raw = result ? result[NEWTAB_WALLPAPER_OVERLAY_STORAGE_KEY] : null;
          const prefs = normalizeWallpaperOverlayPrefs(raw);
          applyWallpaperOverlayOpacity(prefs);
          if (raw && JSON.stringify(raw) !== JSON.stringify(prefs)) {
            storageArea.set({ [NEWTAB_WALLPAPER_OVERLAY_STORAGE_KEY]: prefs });
          }
          resolve();
        });
      });
      return initialWallpaperOverlayReadyPromise;
    }

    function normalizeWallpaperEffectPrefs(value) {
      if (wallpaperEffects && typeof wallpaperEffects.normalizePrefs === 'function') {
        return wallpaperEffects.normalizePrefs(value);
      }
      if (!value || typeof value !== 'object') {
        return Object.assign({}, NEWTAB_WALLPAPER_EFFECT_DEFAULTS);
      }
      const matchedType = NEWTAB_WALLPAPER_EFFECT_TYPES.some((item) => item.type === value.type);
      const strength = normalizeWallpaperOverlayOpacity(value.strength, NEWTAB_WALLPAPER_EFFECT_DEFAULTS.strength);
      const rawSize = Number.isFinite(Number(value.size)) ? value.size : value.density;
      const size = normalizeWallpaperOverlayOpacity(rawSize, NEWTAB_WALLPAPER_EFFECT_DEFAULTS.size);
      const spacing = normalizeWallpaperOverlayOpacity(value.spacing, NEWTAB_WALLPAPER_EFFECT_DEFAULTS.spacing);
      return {
        version: NEWTAB_WALLPAPER_EFFECT_DEFAULTS.version,
        type: matchedType ? value.type : NEWTAB_WALLPAPER_EFFECT_DEFAULTS.type,
        strength,
        size,
        spacing,
        hover: value.hover === false ? false : NEWTAB_WALLPAPER_EFFECT_DEFAULTS.hover
      };
    }

    function doesWallpaperEffectSupportSize(type) {
      return type === 'halftone' || type === 'ascii';
    }

    function doesWallpaperEffectSupportSpacing(type) {
      return type === 'halftone' || type === 'ascii';
    }

    function doesWallpaperEffectSupportHover(type) {
      return type === 'halftone' || type === 'ascii';
    }

    function getWallpaperEffectLabel(type) {
      const item = NEWTAB_WALLPAPER_EFFECT_TYPES.find((effect) => effect.type === type) ||
        NEWTAB_WALLPAPER_EFFECT_TYPES[0];
      return t(item.labelKey, item.fallback);
    }

    function updateWallpaperEffectTabsIndicator() {
      if (!wallpaperEffectOptions || !wallpaperEffectTabsIndicator) {
        return;
      }
      const activeButton = wallpaperEffectOptions.querySelector('button[data-wallpaper-effect-type][data-active="true"]');
      if (!activeButton) {
        wallpaperEffectTabsIndicator.style.width = '0px';
        return;
      }
      const containerRect = wallpaperEffectOptions.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      if (containerRect.width <= 0 || buttonRect.width <= 0) {
        return;
      }
      const scaleX = wallpaperEffectOptions.offsetWidth > 0
        ? containerRect.width / wallpaperEffectOptions.offsetWidth
        : 1;
      const normalizedScaleX = scaleX > 0 ? scaleX : 1;
      const inset = 2;
      const borderLeft = Number.parseFloat(window.getComputedStyle(wallpaperEffectOptions).borderLeftWidth) || 0;
      const offset = Math.round(((buttonRect.left - containerRect.left) / normalizedScaleX) - inset - borderLeft);
      wallpaperEffectTabsIndicator.style.width = `${Math.round(buttonRect.width / normalizedScaleX)}px`;
      wallpaperEffectTabsIndicator.style.transform = `translateX(${offset}px)`;
    }

    function scheduleWallpaperEffectTabsIndicatorRefresh() {
      if (wallpaperEffectTabsIndicatorRefreshFrame) {
        return;
      }
      wallpaperEffectTabsIndicatorRefreshFrame = requestAnimationFrame(() => {
        wallpaperEffectTabsIndicatorRefreshFrame = requestAnimationFrame(() => {
          wallpaperEffectTabsIndicatorRefreshFrame = 0;
          updateWallpaperEffectTabsIndicator();
        });
      });
    }

    function updateWallpaperTabsIndicator() {
      if (!wallpaperTabs || !wallpaperTabsIndicator) {
        return;
      }
      const activeButton = wallpaperTabs.querySelector('button[data-wallpaper-tab][data-active="true"]');
      if (!activeButton) {
        wallpaperTabsIndicator.style.width = '0px';
        return;
      }
      const containerRect = wallpaperTabs.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      if (containerRect.width <= 0 || buttonRect.width <= 0) {
        return;
      }
      const scaleX = wallpaperTabs.offsetWidth > 0
        ? containerRect.width / wallpaperTabs.offsetWidth
        : 1;
      const normalizedScaleX = scaleX > 0 ? scaleX : 1;
      const inset = 2;
      const borderLeft = Number.parseFloat(window.getComputedStyle(wallpaperTabs).borderLeftWidth) || 0;
      const offset = Math.round(((buttonRect.left - containerRect.left) / normalizedScaleX) - inset - borderLeft);
      wallpaperTabsIndicator.style.width = `${Math.round(buttonRect.width / normalizedScaleX)}px`;
      wallpaperTabsIndicator.style.transform = `translateX(${offset}px)`;
    }

    function scheduleWallpaperTabsIndicatorRefresh() {
      if (wallpaperTabsIndicatorRefreshFrame) {
        return;
      }
      wallpaperTabsIndicatorRefreshFrame = requestAnimationFrame(() => {
        wallpaperTabsIndicatorRefreshFrame = requestAnimationFrame(() => {
          wallpaperTabsIndicatorRefreshFrame = 0;
          updateWallpaperTabsIndicator();
        });
      });
    }

    function updateWallpaperPanelTabIndicators() {
      updateWallpaperTabsIndicator();
      updateWallpaperEffectTabsIndicator();
    }

    function scheduleWallpaperPanelTabIndicatorsRefresh() {
      scheduleWallpaperTabsIndicatorRefresh();
      scheduleWallpaperEffectTabsIndicatorRefresh();
    }

    function scheduleWallpaperPanelOpenTabIndicatorsRefresh() {
      scheduleWallpaperPanelTabIndicatorsRefresh();
      window.setTimeout(() => {
        if (isWallpaperPanelOpen()) {
          updateWallpaperPanelTabIndicators();
        }
      }, 240);
      if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
        document.fonts.ready.then(() => {
          if (isWallpaperPanelOpen()) {
            scheduleWallpaperPanelTabIndicatorsRefresh();
          }
        }).catch(() => {});
      }
    }

    function cleanupWallpaperPanelResize() {
      if (wallpaperPanelResizeTimer !== null) {
        window.clearTimeout(wallpaperPanelResizeTimer);
        wallpaperPanelResizeTimer = null;
      }
      if (typeof wallpaperPanelResizeCleanup === 'function') {
        wallpaperPanelResizeCleanup();
        wallpaperPanelResizeCleanup = null;
      }
    }

    function measureWallpaperPanelOpenHeight() {
      if (!wallpaperPanel) {
        return 0;
      }
      const previousHeight = wallpaperPanel.style.height;
      const previousTransition = wallpaperPanel.style.transition;
      wallpaperPanel.style.transition = 'none';
      wallpaperPanel.style.height = 'auto';
      const height = wallpaperPanel.getBoundingClientRect().height;
      wallpaperPanel.style.height = previousHeight;
      wallpaperPanel.style.transition = previousTransition;
      return height;
    }

    function animateWallpaperPanelResize(mutate) {
      if (typeof mutate !== 'function') {
        return;
      }
      const canAnimate = wallpaperPanel &&
        isWallpaperPanelOpen() &&
        !shouldReduceMotion();
      if (!canAnimate) {
        mutate();
        scheduleWallpaperPanelTabIndicatorsRefresh();
        return;
      }

      cleanupWallpaperPanelResize();
      const startHeight = wallpaperPanel.getBoundingClientRect().height;
      const previousHeight = wallpaperPanel.style.height;
      const previousOverflow = wallpaperPanel.style.overflow;
      const previousTransition = wallpaperPanel.style.transition;
      const previousWillChange = wallpaperPanel.style.willChange;

      wallpaperPanel.style.height = `${startHeight}px`;
      wallpaperPanel.style.overflow = 'hidden';
      wallpaperPanel.style.willChange = 'height, transform, opacity, filter';
      mutate();
      const endHeight = measureWallpaperPanelOpenHeight();

      const restorePanel = () => {
        wallpaperPanel.style.height = previousHeight;
        wallpaperPanel.style.overflow = previousOverflow;
        wallpaperPanel.style.transition = previousTransition;
        wallpaperPanel.style.willChange = previousWillChange;
        wallpaperPanel.removeEventListener('transitionend', handleTransitionEnd);
        if (wallpaperPanelResizeTimer !== null) {
          window.clearTimeout(wallpaperPanelResizeTimer);
          wallpaperPanelResizeTimer = null;
        }
        wallpaperPanelResizeCleanup = null;
        scheduleWallpaperPanelTabIndicatorsRefresh();
      };
      function handleTransitionEnd(event) {
        if (event && event.target === wallpaperPanel && event.propertyName === 'height') {
          restorePanel();
        }
      }

      if (Math.abs(endHeight - startHeight) < 1) {
        restorePanel();
        return;
      }

      wallpaperPanelResizeCleanup = restorePanel;
      wallpaperPanel.style.height = `${startHeight}px`;
      wallpaperPanel.style.transition = `height ${WALLPAPER_PANEL_RESIZE_DURATION_MS}ms ${WALLPAPER_PANEL_RESIZE_EASING}`;
      void wallpaperPanel.offsetHeight;
      wallpaperPanel.addEventListener('transitionend', handleTransitionEnd);
      requestAnimationFrame(() => {
        if (!wallpaperPanelResizeCleanup) {
          return;
        }
        wallpaperPanel.style.height = `${endHeight}px`;
      });
      wallpaperPanelResizeTimer = window.setTimeout(restorePanel, WALLPAPER_PANEL_RESIZE_DURATION_MS + 80);
    }

    function updateWallpaperTabSelectionUi(tab) {
      const nextTab = tab === 'local' ? 'local' : 'built-in';
      if (wallpaperBody) {
        wallpaperBody.setAttribute('data-active-tab', nextTab);
      }
      [
        { tab: 'built-in', button: wallpaperBuiltInTab, panel: wallpaperBuiltInGrid },
        { tab: 'local', button: wallpaperLocalTab, panel: wallpaperLocalGrid }
      ].forEach((item) => {
        const selected = item.tab === nextTab;
        if (item.button) {
          item.button.setAttribute('data-active', selected ? 'true' : 'false');
          item.button.setAttribute('aria-selected', selected ? 'true' : 'false');
          item.button.tabIndex = selected ? 0 : -1;
        }
        if (item.panel) {
          item.panel.setAttribute('aria-hidden', selected ? 'false' : 'true');
        }
      });
    }

    function setWallpaperActiveTab(tab) {
      const nextTab = tab === 'local' ? 'local' : 'built-in';
      const isSameTab = activeWallpaperTab === nextTab &&
        wallpaperBody &&
        wallpaperBody.getAttribute('data-active-tab') === nextTab;
      if (isSameTab) {
        updateWallpaperTabSelectionUi(nextTab);
        scheduleWallpaperTabsIndicatorRefresh();
        return;
      }
      animateWallpaperPanelResize(() => {
        const previousTab = activeWallpaperTab;
        activeWallpaperTab = nextTab;
        updateWallpaperTabSelectionUi(nextTab);
        playWallpaperEnterMotion(
          getWallpaperGridForTab(nextTab),
          previousTab === 'local' && nextTab === 'built-in' ? 'enter-prev' : 'enter-next'
        );
      });
      scheduleWallpaperTabsIndicatorRefresh();
    }

    function setWallpaperBodyVisible(visible) {
      if (!wallpaperBody) {
        return;
      }
      const nextVisible = visible ? 'true' : 'false';
      if (wallpaperBody.getAttribute('data-visible') === nextVisible) {
        wallpaperBody.setAttribute('aria-hidden', visible ? 'false' : 'true');
        if (visible) {
          scheduleWallpaperPanelTabIndicatorsRefresh();
        }
        return;
      }
      animateWallpaperPanelResize(() => {
        wallpaperBody.setAttribute('data-visible', nextVisible);
        wallpaperBody.setAttribute('aria-hidden', visible ? 'false' : 'true');
        if (visible) {
          playWallpaperEnterMotion(wallpaperBody, 'enter');
        }
      });
      if (visible) {
        scheduleWallpaperTabsIndicatorRefresh();
        scheduleWallpaperEffectTabsIndicatorRefresh();
      }
    }

    function setWallpaperEffectSliderControlVisible(control, visible) {
      if (!control) {
        return false;
      }
      const nextVisible = visible ? 'true' : 'false';
      const changed = control.getAttribute('data-visible') !== nextVisible;
      control.setAttribute('data-visible', nextVisible);
      control.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (changed && visible) {
        playWallpaperEnterMotion(control, 'enter');
      }
      return changed;
    }

    function applyWallpaperEffectPrefs(value) {
      currentWallpaperEffectPrefs = normalizeWallpaperEffectPrefs(value);
      if (document.body) {
        document.body.setAttribute('data-wallpaper-effect', currentWallpaperEffectPrefs.type);
      }
      if (wallpaperEffects) {
        wallpaperEffects.apply(currentWallpaperEffectPrefs);
      }
      updateWallpaperEffectControlUi();
    }

    function getWallpaperEffectControlVisibility(prefs) {
      return {
        strength: prefs.type !== 'none',
        hover: doesWallpaperEffectSupportHover(prefs.type),
        size: doesWallpaperEffectSupportSize(prefs.type),
        spacing: doesWallpaperEffectSupportSpacing(prefs.type)
      };
    }

    function isWallpaperEffectControlVisibilityChanged(control, visible) {
      return Boolean(control &&
        control.getAttribute('data-visible') !== (visible ? 'true' : 'false'));
    }

    function updateWallpaperEffectControlsVisibility(visibility) {
      const changed = [
        [wallpaperEffectStrengthControl, visibility.strength],
        [wallpaperEffectHoverControl, visibility.hover],
        [wallpaperEffectSizeControl, visibility.size],
        [wallpaperEffectSpacingControl, visibility.spacing]
      ].some((item) => isWallpaperEffectControlVisibilityChanged(item[0], item[1]));
      const applyVisibility = () => {
        setWallpaperEffectSliderControlVisible(wallpaperEffectStrengthControl, visibility.strength);
        setWallpaperEffectSliderControlVisible(wallpaperEffectHoverControl, visibility.hover);
        setWallpaperEffectSliderControlVisible(wallpaperEffectSizeControl, visibility.size);
        setWallpaperEffectSliderControlVisible(wallpaperEffectSpacingControl, visibility.spacing);
      };
      if (changed) {
        animateWallpaperPanelResize(applyVisibility);
        return;
      }
      applyVisibility();
    }

    function updateWallpaperEffectOptionsUi(prefs) {
      if (wallpaperEffectOptions) {
        wallpaperEffectOptions.querySelectorAll('.x-nt-effect-option').forEach((button) => {
          const selected = button.getAttribute('data-wallpaper-effect-type') === prefs.type;
          button.setAttribute('data-selected', selected ? 'true' : 'false');
          button.setAttribute('data-active', selected ? 'true' : 'false');
          button.setAttribute('aria-pressed', selected ? 'true' : 'false');
          const type = button.getAttribute('data-wallpaper-effect-type') || 'none';
          button.textContent = getWallpaperEffectLabel(type);
          button.setAttribute(
            'aria-label',
            formatMessage('newtab_wallpaper_effect_select_label', 'Use {effect} wallpaper filter', {
              effect: getWallpaperEffectLabel(type)
            })
          );
        });
        wallpaperEffectOptions.setAttribute('aria-label', t('newtab_wallpaper_effect_title', 'Wallpaper filter'));
        scheduleWallpaperEffectTabsIndicatorRefresh();
      }
    }

    function updateWallpaperEffectSlidersUi(prefs, visibility) {
      updateWallpaperSliderElement(wallpaperEffectSlider, {
        value: prefs.strength,
        enabled: visibility.strength,
        labelKey: 'newtab_wallpaper_effect_strength',
        fallback: 'Sampling strength'
      });
      updateWallpaperSliderElement(wallpaperEffectSizeSlider, {
        value: prefs.size,
        enabled: visibility.size,
        labelKey: 'newtab_wallpaper_effect_size',
        fallback: 'Size'
      });
      updateWallpaperSliderElement(wallpaperEffectSpacingSlider, {
        value: prefs.spacing,
        enabled: visibility.spacing,
        labelKey: 'newtab_wallpaper_effect_spacing',
        fallback: 'Spacing'
      });
    }

    function updateWallpaperEffectHoverUi(prefs, supportsHover) {
      if (wallpaperEffectHoverToggle) {
        wallpaperEffectHoverToggle.checked = prefs.hover !== false;
        wallpaperEffectHoverToggle.disabled = !supportsHover;
        wallpaperEffectHoverToggle.setAttribute('aria-checked', prefs.hover !== false ? 'true' : 'false');
        wallpaperEffectHoverToggle.setAttribute(
          'aria-label',
          t('newtab_wallpaper_effect_hover', 'Hover effect')
        );
      }
    }

    function updateWallpaperEffectTextUi() {
      if (wallpaperEffectLabel) {
        wallpaperEffectLabel.textContent = t('newtab_wallpaper_effect_title', 'Wallpaper filter');
      }
      if (wallpaperEffectStrengthLabel) {
        wallpaperEffectStrengthLabel.textContent = t('newtab_wallpaper_effect_strength', 'Sampling strength');
      }
      if (wallpaperEffectSizeLabel) {
        wallpaperEffectSizeLabel.textContent = t('newtab_wallpaper_effect_size', 'Size');
      }
      if (wallpaperEffectSpacingLabel) {
        wallpaperEffectSpacingLabel.textContent = t('newtab_wallpaper_effect_spacing', 'Spacing');
      }
      if (wallpaperEffectHoverTitle) {
        wallpaperEffectHoverTitle.textContent = t('newtab_wallpaper_effect_hover', 'Hover effect');
      }
    }

    function updateWallpaperEffectControlUi() {
      const prefs = normalizeWallpaperEffectPrefs(currentWallpaperEffectPrefs);
      const visibility = getWallpaperEffectControlVisibility(prefs);
      updateWallpaperEffectControlsVisibility(visibility);
      updateWallpaperEffectOptionsUi(prefs);
      updateWallpaperEffectSlidersUi(prefs, visibility);
      updateWallpaperEffectHoverUi(prefs, visibility.hover);
      updateWallpaperEffectTextUi();
    }

    function persistWallpaperEffectPrefs(partial) {
      const nextPrefs = normalizeWallpaperEffectPrefs(Object.assign({}, currentWallpaperEffectPrefs, partial || {}));
      applyWallpaperEffectPrefs(nextPrefs);
      if (!storageArea) {
        return;
      }
      if (wallpaperEffectSaveTimer !== null) {
        clearTimeout(wallpaperEffectSaveTimer);
      }
      wallpaperEffectSaveTimer = setTimeout(() => {
        wallpaperEffectSaveTimer = null;
        storageArea.set({ [NEWTAB_WALLPAPER_EFFECT_STORAGE_KEY]: nextPrefs });
      }, 120);
    }

    function bootstrapInitialWallpaperEffect() {
      if (!storageArea) {
        applyWallpaperEffectPrefs(NEWTAB_WALLPAPER_EFFECT_DEFAULTS);
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        storageArea.get([NEWTAB_WALLPAPER_EFFECT_STORAGE_KEY], (result) => {
          const raw = result ? result[NEWTAB_WALLPAPER_EFFECT_STORAGE_KEY] : null;
          const prefs = normalizeWallpaperEffectPrefs(raw);
          applyWallpaperEffectPrefs(prefs);
          if (raw && JSON.stringify(raw) !== JSON.stringify(prefs)) {
            storageArea.set({ [NEWTAB_WALLPAPER_EFFECT_STORAGE_KEY]: prefs });
          }
          resolve();
        });
      });
    }

    function finalizeInitialWallpaper() {
      if (initialWallpaperApplied) {
        return;
      }
      initialWallpaperApplied = true;
      if (typeof resolveInitialWallpaperReady === 'function') {
        resolveInitialWallpaperReady();
      }
    }

    function updateWallpaperSelectionUi() {
      if (wallpaperButton) {
        const isActive = Boolean(currentWallpaperId);
        wallpaperButton.setAttribute('data-active', isActive ? 'true' : 'false');
        wallpaperButton.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      }
      if (wallpaperEnabledToggle) {
        wallpaperEnabledToggle.checked = Boolean(currentWallpaperId);
        wallpaperEnabledToggle.setAttribute('aria-checked', currentWallpaperId ? 'true' : 'false');
        wallpaperEnabledToggle.setAttribute('aria-label', t('newtab_wallpaper_toggle_label', 'Toggle wallpaper'));
      }
      setWallpaperBodyVisible(Boolean(currentWallpaperId));
      const tileContainers = getWallpaperTileContainers();
      if (tileContainers.length === 0) {
        return;
      }
      tileContainers.forEach((container) => {
        container.querySelectorAll('.x-nt-wallpaper-tile').forEach((tile) => {
          const selected = tile.getAttribute('data-wallpaper-id') === currentWallpaperId;
          tile.setAttribute('data-selected', selected ? 'true' : 'false');
          tile.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });
      });
    }

    function updateLogoSwitchUi() {
      if (hasWordmarkVisibleGetter) {
        currentWordmarkVisible = normalizeNewtabWordmarkVisible(getWordmarkVisible());
      }
      if (logoEnabledToggle) {
        logoEnabledToggle.checked = currentWordmarkVisible;
        logoEnabledToggle.setAttribute('aria-checked', currentWordmarkVisible ? 'true' : 'false');
        logoEnabledToggle.setAttribute(
          'aria-label',
          t('settings_newtab_wordmark_title', 'Show brand mark above the New Tab search bar')
        );
      }
    }

    function applyWordmarkVisible(value) {
      currentWordmarkVisible = normalizeNewtabWordmarkVisible(value);
      setWordmarkVisible(currentWordmarkVisible);
      updateLogoSwitchUi();
    }

    function persistWordmarkVisible(value) {
      const nextValue = normalizeNewtabWordmarkVisible(value);
      applyWordmarkVisible(nextValue);
      if (!storageArea || !NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY) {
        return;
      }
      storageArea.set({ [NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY]: nextValue });
    }

    function getNewtabFaviconOptionButtons() {
      if (!newtabFaviconOptions) {
        return [];
      }
      return Array.from(newtabFaviconOptions.children || []).filter((child) => {
        return child && String(child.className || '').split(/\s+/).includes('x-nt-favicon-option');
      });
    }

    function getNewtabFaviconLink() {
      const head = document.head || document.getElementsByTagName && document.getElementsByTagName('head')[0];
      if (!head) {
        return null;
      }
      const children = Array.from(head.children || []);
      let link = children.find((child) => child &&
        String(child.tagName || '').toUpperCase() === 'LINK' &&
        child.getAttribute &&
        child.getAttribute('data-lumno-newtab-favicon') === 'true');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('data-lumno-newtab-favicon', 'true');
        head.appendChild(link);
      }
      return link;
    }

    function updateNewtabFaviconSelectionUi() {
      const currentItem = getNewtabFaviconById(currentNewtabFaviconId) ||
        getNewtabFaviconById(NEWTAB_FAVICON_DEFAULT_ID);
      if (newtabFaviconTitle) {
        newtabFaviconTitle.textContent = t('newtab_favicon_title', 'New Tab favicon');
      }
      if (newtabFaviconOptions) {
        newtabFaviconOptions.setAttribute('aria-label', t('newtab_favicon_title', 'New Tab favicon'));
      }
      getNewtabFaviconOptionButtons().forEach((button) => {
        const item = getNewtabFaviconById(button.getAttribute('data-newtab-favicon-id'));
        if (!item) {
          return;
        }
        const selected = currentItem && item.id === currentItem.id;
        const name = getNewtabFaviconDisplayName(item);
        button.setAttribute('data-selected', selected ? 'true' : 'false');
        button.setAttribute('aria-pressed', selected ? 'true' : 'false');
        button.setAttribute('aria-label', formatMessage('newtab_favicon_select_label', 'Select {name} favicon', {
          name
        }));
      });
    }

    function applyNewtabFavicon(value) {
      const nextId = normalizeNewtabFaviconId(value);
      const item = getNewtabFaviconById(nextId) || getNewtabFaviconById(NEWTAB_FAVICON_DEFAULT_ID);
      currentNewtabFaviconId = item ? item.id : NEWTAB_FAVICON_DEFAULT_ID;
      cacheNewtabFaviconPreloadId(currentNewtabFaviconId);
      bindNewtabFaviconThemeListener(item);
      const link = getNewtabFaviconLink();
      if (link && item) {
        applyNewtabFaviconLinkAttributes(link, item);
      }
      updateNewtabFaviconSelectionUi();
    }

    function persistNewtabFavicon(value) {
      const nextId = normalizeNewtabFaviconId(value);
      applyNewtabFavicon(nextId);
      writeStorageValue(storageArea, NEWTAB_FAVICON_STORAGE_KEY, nextId, () => {
        showToast(t('newtab_favicon_save_error', 'Failed to save favicon'), true);
      });
    }

    function bootstrapInitialNewtabFavicon() {
      if (hasNewtabFaviconBootstrapStarted) {
        return initialNewtabFaviconReadyPromise || Promise.resolve();
      }
      hasNewtabFaviconBootstrapStarted = true;
      initialNewtabFaviconReadyPromise = readStorageValue(storageArea, NEWTAB_FAVICON_STORAGE_KEY).then((storedValue) => {
        const nextId = normalizeNewtabFaviconId(storedValue.value);
        applyNewtabFavicon(nextId);
        if (storedValue.hasValue && storedValue.value !== nextId) {
          writeStorageValue(storageArea, NEWTAB_FAVICON_STORAGE_KEY, nextId);
        }
      });
      return initialNewtabFaviconReadyPromise;
    }

    function getWallpaperAppearanceOptionButtons() {
      if (!wallpaperAppearanceOptions) {
        return [];
      }
      return Array.from(wallpaperAppearanceOptions.querySelectorAll('.x-nt-appearance-option'));
    }

    function getWallpaperAppearanceOptionMotionElement(button) {
      if (!button || typeof button.querySelector !== 'function') {
        return button;
      }
      return button.querySelector('.x-nt-appearance-option-content') || button;
    }

    function updateWallpaperAppearanceScopeTabsUi(scope) {
      if (wallpaperAppearanceScopeTabs) {
        const activeScope = scope === 'home' ? 'home' : 'global';
        wallpaperAppearanceScopeTabs.querySelectorAll('.x-nt-appearance-scope-tab').forEach((button) => {
          const selected = button.getAttribute('data-theme-scope') === activeScope;
          button.setAttribute('data-selected', selected ? 'true' : 'false');
          button.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });
      }
      updateWallpaperSearchWidthControlUi();
    }

    function getSearchWidthMin() {
      return Number.isFinite(Number(searchWidthConfig.min)) ? Number(searchWidthConfig.min) : 720;
    }

    function getSearchWidthMax() {
      const min = getSearchWidthMin();
      const max = Number.isFinite(Number(searchWidthConfig.max)) ? Number(searchWidthConfig.max) : 1040;
      return Math.max(min + 1, max);
    }

    function normalizeSearchWidthValue(value) {
      const min = getSearchWidthMin();
      const max = getSearchWidthMax();
      const fallback = Number.isFinite(Number(searchWidthConfig.fallback))
        ? Number(searchWidthConfig.fallback)
        : 920;
      const number = Number(value);
      if (!Number.isFinite(number)) {
        return Math.min(max, Math.max(min, Math.round(fallback)));
      }
      return Math.min(max, Math.max(min, Math.round(number)));
    }

    function getSearchWidthSnapPoints() {
      const points = Array.isArray(searchWidthConfig.snapPoints)
        ? searchWidthConfig.snapPoints
        : [720, 920, 1040];
      return points.map(normalizeSearchWidthValue)
        .filter((value, index, array) => array.indexOf(value) === index)
        .sort((a, b) => a - b);
    }

    function getSearchWidthPercent(value) {
      const min = getSearchWidthMin();
      const max = getSearchWidthMax();
      return ((normalizeSearchWidthValue(value) - min) / (max - min)) * 100;
    }

    function snapSearchWidthValue(value, threshold) {
      const width = normalizeSearchWidthValue(value);
      const snapThreshold = Number.isFinite(Number(threshold))
        ? Number(threshold)
        : Number(searchWidthConfig.snapThreshold || 14);
      const matched = getSearchWidthSnapPoints().find((point) => Math.abs(point - width) <= snapThreshold);
      return Number.isFinite(matched) ? matched : width;
    }

    function formatSearchWidthValue(value) {
      return `${normalizeSearchWidthValue(value)} px`;
    }

    function updateSearchWidthSliderElement(width) {
      if (!wallpaperSearchWidthSlider) {
        return;
      }
      const value = normalizeSearchWidthValue(width);
      wallpaperSearchWidthSlider.min = String(getSearchWidthMin());
      wallpaperSearchWidthSlider.max = String(getSearchWidthMax());
      wallpaperSearchWidthSlider.value = String(value);
      wallpaperSearchWidthSlider.style.setProperty('--x-nt-overlay-slider-percent', `${getSearchWidthPercent(value)}%`);
      wallpaperSearchWidthSlider.setAttribute('aria-valuenow', String(value));
      wallpaperSearchWidthSlider.setAttribute('aria-valuetext', formatSearchWidthValue(value));
      if (wallpaperSearchWidthValue) {
        wallpaperSearchWidthValue.textContent = formatSearchWidthValue(value);
      }
    }

    function setSearchWidthControlVisible(visible) {
      if (!wallpaperSearchWidthControl) {
        return;
      }
      const nextVisible = visible ? 'true' : 'false';
      if (wallpaperSearchWidthControl.getAttribute('data-visible') === nextVisible) {
        wallpaperSearchWidthControl.setAttribute('aria-hidden', visible ? 'false' : 'true');
        return;
      }
      animateWallpaperPanelResize(() => {
        wallpaperSearchWidthControl.setAttribute('data-visible', nextVisible);
        wallpaperSearchWidthControl.setAttribute('aria-hidden', visible ? 'false' : 'true');
        if (visible) {
          playWallpaperEnterMotion(wallpaperSearchWidthControl, 'enter');
        }
      });
    }

    function updateWallpaperSearchWidthControlUi() {
      if (!wallpaperSearchWidthControl) {
        return;
      }
      if (wallpaperSearchWidthLabel) {
        wallpaperSearchWidthLabel.textContent = t('newtab_search_width_title', 'Search box width');
      }
      if (wallpaperSearchWidthSlider) {
        wallpaperSearchWidthSlider.setAttribute(
          'aria-label',
          t('newtab_search_width_aria', 'Adjust New Tab search box width')
        );
      }
      if (wallpaperSearchWidthControl) {
        wallpaperSearchWidthControl.querySelectorAll('[data-search-width-tick]').forEach((tick) => {
          const key = tick.getAttribute('data-search-width-tick');
          if (key === 'standard') {
            tick.textContent = t('newtab_search_width_standard', 'Standard');
          } else if (key === 'wide') {
            tick.textContent = t('newtab_search_width_wide', 'Wide');
          } else if (key === 'max') {
            tick.textContent = t('newtab_search_width_max', 'Max');
          }
        });
      }
      updateSearchWidthSliderElement(getSearchWidth());
      setSearchWidthControlVisible(true);
    }

    function persistSearchWidthFromSlider(value, options) {
      const final = Boolean(options && options.final);
      const threshold = final
        ? Number(searchWidthConfig.snapThreshold || 14) * 1.35
        : Number(searchWidthConfig.snapThreshold || 14);
      const width = snapSearchWidthValue(value, threshold);
      if (wallpaperSearchWidthSlider && wallpaperSearchWidthSlider.value !== String(width)) {
        wallpaperSearchWidthSlider.value = String(width);
      }
      setSearchWidth(width, { persist: false });
      updateSearchWidthSliderElement(width);
      if (wallpaperSearchWidthSaveTimer !== null) {
        window.clearTimeout(wallpaperSearchWidthSaveTimer);
        wallpaperSearchWidthSaveTimer = null;
      }
      const persist = () => {
        wallpaperSearchWidthSaveTimer = null;
        setSearchWidth(width, { persist: true });
      };
      if (final) {
        persist();
        return;
      }
      wallpaperSearchWidthSaveTimer = window.setTimeout(persist, 140);
    }

    function updateWallpaperAppearanceSelectionUi() {
      updateWallpaperAppearanceScopeTabsUi(getThemeScope());
      if (wallpaperAppearanceOptions) {
        getWallpaperAppearanceOptionButtons().forEach((button) => {
          const selected = button.getAttribute('data-theme-mode') === getThemeMode();
          button.setAttribute('data-selected', selected ? 'true' : 'false');
          button.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });
      }
      updateWallpaperSearchWidthControlUi();
    }

    function updateCustomWallpaperUploadTile() {
      if (!customWallpaperUploadTile) {
        return;
      }
      customWallpaperUploadTile.setAttribute('data-loading', customWallpaperImporting ? 'true' : 'false');
      customWallpaperUploadTile.setAttribute('aria-label', t('newtab_wallpaper_add_local', 'Add local wallpaper'));
      if (customWallpaperImporting) {
        hideCustomWallpaperTooltip();
      }
    }

    function renderCustomWallpaperTiles() {
      if (!wallpaperLocalGrid || !customWallpaperUploadTile) {
        return;
      }
      animateWallpaperPanelResize(() => {
        wallpaperLocalGrid.querySelectorAll('.x-nt-wallpaper-custom-tile').forEach((tile) => {
          tile.remove();
        });
        const insertionPoint = customWallpaperUploadTile.nextSibling;
        customWallpapers.forEach((item) => {
          wallpaperLocalGrid.insertBefore(createCustomWallpaperTile(item), insertionPoint);
        });
      });
      updateWallpaperLanguageStrings();
      updateWallpaperSelectionUi();
    }

    function loadCustomWallpapers() {
      return readCustomWallpaperRecords().then((records) => {
        customWallpapers = records;
        updateCustomWallpaperUploadTile();
        renderCustomWallpaperTiles();
        return records;
      }).catch(() => {
        customWallpapers = [];
        updateCustomWallpaperUploadTile();
        renderCustomWallpaperTiles();
        return [];
      });
    }

    function applyNewtabWallpaper(value) {
      const nextId = normalizeNewtabWallpaperId(value);
      const wallpaper = getWallpaperById(nextId);
      const imageUrl = wallpaper ? getWallpaperImageUrl(wallpaper) : '';
      const active = Boolean(wallpaper);
      const isInitialWallpaperApply = !initialWallpaperApplied;
      const shouldAnimateVisualChange = initialWallpaperApplied &&
        (imageUrl !== appliedWallpaperVisualUrl || active !== appliedWallpaperVisualActive);
      const visualSeq = ++wallpaperVisualSeq;
      currentWallpaperId = wallpaper ? wallpaper.id : '';
      if (currentWallpaperId) {
        lastActiveWallpaperId = currentWallpaperId;
        setWallpaperActiveTab(isCustomWallpaperId(currentWallpaperId) ? 'local' : 'built-in');
      }
      writeWallpaperPreloadCache(wallpaper);
      updateWallpaperSelectionUi();
      if (isInitialWallpaperApply) {
        applyWallpaperVisualState(wallpaper);
        scheduleWallpaperVisualRefresh(visualSeq);
        finalizeInitialWallpaper();
        return;
      }
      finalizeInitialWallpaper();
      waitForWallpaperImageReady(imageUrl).then(() => {
        if (visualSeq !== wallpaperVisualSeq) {
          return;
        }
        const transitionLayer = shouldAnimateVisualChange ? createWallpaperTransitionLayer() : null;
        applyWallpaperVisualState(wallpaper);
        releaseWallpaperTransitionLayer(transitionLayer);
        scheduleWallpaperVisualRefresh(visualSeq);
      });
    }

    function bootstrapInitialWallpaper() {
      if (hasWallpaperBootstrapStarted) {
        return initialWallpaperReadyPromise;
      }
      hasWallpaperBootstrapStarted = true;
      const customWallpapersPromise = loadCustomWallpapers();
      Promise.all([
        customWallpapersPromise,
        readStorageValue(storageArea, NEWTAB_WALLPAPER_STORAGE_KEY),
        readStorageValue(localWallpaperStorageArea, NEWTAB_LOCAL_WALLPAPER_STORAGE_KEY)
      ]).then((results) => {
        const syncedValue = results[1];
        const localValue = results[2];
        const localResolution = resolveLocalWallpaperOverride(localValue.value, localValue.hasValue);
        if (localResolution.shouldClear) {
          writeLocalWallpaperValue('');
        }
        if (localResolution.hasOverride) {
          localWallpaperOverrideActive = true;
          applyNewtabWallpaper(localResolution.id);
          return;
        }
        const syncedResolution = resolveSyncedWallpaperValue(syncedValue.value, syncedValue.hasValue);
        if (syncedResolution.migrateCustomToLocal) {
          localWallpaperOverrideActive = true;
          writeLocalWallpaperValue(syncedResolution.id);
        } else {
          localWallpaperOverrideActive = false;
        }
        applyNewtabWallpaper(syncedResolution.id);
        if (syncedResolution.sanitizedId !== null) {
          writeSyncedWallpaperValue(syncedResolution.sanitizedId);
        }
      });
      return initialWallpaperReadyPromise;
    }

    function persistNewtabWallpaper(id) {
      const wasUsingLocalWallpaper = localWallpaperOverrideActive || isCustomWallpaperId(currentWallpaperId);
      const nextId = normalizeNewtabWallpaperId(id);
      applyNewtabWallpaper(nextId);
      if (nextId && isCustomWallpaperId(nextId)) {
        localWallpaperOverrideActive = true;
        writeLocalWallpaperValue(nextId, { showError: true });
        return;
      }
      if (!nextId && wasUsingLocalWallpaper) {
        localWallpaperOverrideActive = true;
        writeLocalWallpaperValue(NEWTAB_LOCAL_WALLPAPER_DISABLED_VALUE, { showError: true });
        return;
      }
      localWallpaperOverrideActive = false;
      writeSyncedWallpaperValue(nextId, { showError: true });
      writeLocalWallpaperValue('');
    }

    function canShowCustomWallpaperTooltip(target) {
      return Boolean(target &&
        target.isConnected &&
        !customWallpaperImporting &&
        target.getAttribute('data-loading') !== 'true');
    }

    function showCustomWallpaperTooltip(target) {
      if (!canShowCustomWallpaperTooltip(target)) {
        hideCustomWallpaperTooltip();
        return;
      }
      showTopActionTooltip(target, t('newtab_wallpaper_add_local', 'Add local wallpaper'));
    }

    function hideCustomWallpaperTooltip() {
      hideTopActionTooltip();
    }

    function openCustomWallpaperPicker() {
      if (customWallpaperInput && !customWallpaperImporting) {
        hideCustomWallpaperTooltip();
        customWallpaperInput.click();
      }
    }

    function importCustomWallpaperFile(file) {
      if (!file || customWallpaperImporting) {
        return;
      }
      customWallpaperImporting = true;
      updateCustomWallpaperUploadTile();
      buildCustomWallpaperRecordFromFile(file).then((record) => {
        return writeCustomWallpaperRecord(record).then(() => record);
      }).then((record) => {
        const nextWallpaper = normalizeCustomWallpaperRecord(record);
        if (!nextWallpaper) {
          throw new Error('Invalid wallpaper record.');
        }
        customWallpapers = customWallpapers.concat(nextWallpaper);
        persistNewtabWallpaper(nextWallpaper.id);
        renderCustomWallpaperTiles();
        showToast(t('newtab_wallpaper_import_done', 'Wallpaper imported'), false);
      }).catch(() => {
        showToast(t('newtab_wallpaper_import_error', 'Failed to import wallpaper'), true);
      }).finally(() => {
        customWallpaperImporting = false;
        if (customWallpaperInput) {
          customWallpaperInput.value = '';
        }
        updateCustomWallpaperUploadTile();
      });
    }

    function deleteCustomWallpaper(id) {
      const targetWallpaper = getCustomWallpaperById(id);
      if (!targetWallpaper || customWallpaperImporting) {
        return;
      }
      hideTopActionTooltip();
      deleteCustomWallpaperRecord(targetWallpaper).then(() => {
        customWallpapers = customWallpapers.filter((item) => item && item.id !== targetWallpaper.id);
        renderCustomWallpaperTiles();
        if (currentWallpaperId === targetWallpaper.id) {
          persistNewtabWallpaper('');
        } else {
          updateWallpaperSelectionUi();
        }
        showToast(t('newtab_wallpaper_delete_done', 'Deleted'), false);
      }).catch(() => {
        showToast(t('newtab_wallpaper_delete_error', 'Failed to delete wallpaper'), true);
      });
    }

    function isWallpaperPanelOpen() {
      return Boolean(wallpaperPanel && wallpaperPanel.getAttribute('data-open') === 'true');
    }

    function setWallpaperPanelOpenState(open) {
      if (!document.body) {
        return;
      }
      if (open) {
        document.body.setAttribute('data-wallpaper-panel-open', 'true');
        return;
      }
      document.body.removeAttribute('data-wallpaper-panel-open');
    }

    function getWallpaperAppearanceModeLabel(mode) {
      if (mode === 'light') {
        return t('settings_theme_light', 'Light');
      }
      if (mode === 'dark') {
        return t('settings_theme_dark', 'Dark');
      }
      if (getThemeScope() === 'home') {
        return t('newtab_theme_follow_global', 'Follow "Global"');
      }
      return t('settings_theme_system', 'Auto');
    }

    function updateWallpaperAppearanceModeLabels() {
      if (wallpaperAppearanceModeLabelsHeld) {
        return;
      }
      if (!wallpaperAppearanceOptions) {
        return;
      }
      getWallpaperAppearanceOptionButtons().forEach((button) => {
        const mode = button.getAttribute('data-theme-mode') || 'system';
        const modeLabel = getWallpaperAppearanceModeLabel(mode);
        button.setAttribute('aria-label', formatMessage('mode_switch_title', '{name}: switch to {mode} mode', {
          name: 'Lumno',
          mode: modeLabel
        }));
        const label = button.querySelector('.x-nt-appearance-label');
        if (label) {
          label.textContent = modeLabel;
        }
      });
    }

    function clearWallpaperAppearanceScopeAnimation(options) {
      wallpaperAppearanceAnimationTimers.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      wallpaperAppearanceAnimationTimers = [];
      if (!options || options.releaseLabels !== false) {
        wallpaperAppearanceModeLabelsHeld = false;
      }
      getWallpaperAppearanceOptionButtons().forEach((button) => {
        const motionElement = getWallpaperAppearanceOptionMotionElement(button);
        if (!motionElement) {
          return;
        }
        motionElement.style.removeProperty('transition');
        motionElement.style.removeProperty('transform');
        motionElement.style.removeProperty('opacity');
        motionElement.style.removeProperty('filter');
        motionElement.style.removeProperty('will-change');
      });
      if (wallpaperAppearanceOptions) {
        wallpaperAppearanceOptions.removeAttribute('data-scope-animating');
      }
    }

    function shouldReduceMotion() {
      return Boolean(window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    function playWallpaperEnterMotion(element, state) {
      if (!element) {
        return;
      }
      const nextState = state || 'enter';
      if (shouldReduceMotion()) {
        element.removeAttribute('data-motion');
        return;
      }
      element.setAttribute('data-motion', nextState);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (element.getAttribute('data-motion') === nextState) {
            element.removeAttribute('data-motion');
          }
        });
      });
    }

    function getWallpaperGridForTab(tab) {
      return tab === 'local' ? wallpaperLocalGrid : wallpaperBuiltInGrid;
    }

    function getAppearanceScopeDirection(scope) {
      return scope === 'home' ? 1 : -1;
    }

    function getAppearanceOptionDelay(index, count, direction) {
      const visualIndex = direction > 0 ? (count - 1 - index) : index;
      return Math.max(0, visualIndex * 20);
    }

    function animateWallpaperAppearanceScopeChange(previousScope, nextScope) {
      const targetScope = nextScope === 'home' ? 'home' : 'global';
      const sourceScope = previousScope === 'home' ? 'home' : 'global';
      const buttons = getWallpaperAppearanceOptionButtons();
      clearWallpaperAppearanceScopeAnimation();
      if (!buttons.length || sourceScope === targetScope || shouldReduceMotion()) {
        setThemeScope(targetScope);
        updateWallpaperAppearanceSelectionUi();
        updateWallpaperAppearanceModeLabels();
        return;
      }
      const direction = getAppearanceScopeDirection(targetScope);
      const offsetPx = 24;
      const durationMs = 220;
      const fadeBlurDurationMs = 140;
      const handoffOverlapMs = 70;
      const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
      wallpaperAppearanceModeLabelsHeld = true;
      if (wallpaperAppearanceOptions) {
        wallpaperAppearanceOptions.setAttribute('data-scope-animating', 'true');
      }
      updateWallpaperAppearanceScopeTabsUi(targetScope);

      let maxOutDelay = 0;
      buttons.forEach((button, index) => {
        const motionElement = getWallpaperAppearanceOptionMotionElement(button);
        if (!motionElement) {
          return;
        }
        const delay = getAppearanceOptionDelay(index, buttons.length, direction);
        maxOutDelay = Math.max(maxOutDelay, delay);
        motionElement.style.setProperty('will-change', 'transform, opacity, filter');
        motionElement.style.setProperty(
          'transition',
          `transform ${durationMs}ms ${easing} ${delay}ms, opacity ${fadeBlurDurationMs}ms ${easing} ${delay}ms, filter ${fadeBlurDurationMs}ms ${easing} ${delay}ms`
        );
        motionElement.style.setProperty('opacity', '0');
        motionElement.style.setProperty('filter', 'blur(3px)');
        motionElement.style.setProperty('transform', `translate3d(${direction * -offsetPx}px, 0, 0)`);
      });

      const handoffDelayMs = Math.max(0, durationMs + maxOutDelay - handoffOverlapMs);
      const handoffTimer = window.setTimeout(() => {
        wallpaperAppearanceAnimationTimers = wallpaperAppearanceAnimationTimers.filter((timerId) => timerId !== handoffTimer);
        setThemeScope(targetScope);
        wallpaperAppearanceModeLabelsHeld = false;
        updateWallpaperAppearanceSelectionUi();
        updateWallpaperAppearanceModeLabels();
        buttons.forEach((button) => {
          const motionElement = getWallpaperAppearanceOptionMotionElement(button);
          if (!motionElement) {
            return;
          }
          motionElement.style.setProperty('transition', 'none');
          motionElement.style.setProperty('opacity', '0');
          motionElement.style.setProperty('filter', 'blur(3px)');
          motionElement.style.setProperty('transform', `translate3d(${direction * offsetPx}px, 0, 0)`);
        });
        if (wallpaperAppearanceOptions) {
          void wallpaperAppearanceOptions.offsetHeight;
        }
        let maxInDelay = 0;
        buttons.forEach((button, index) => {
          const motionElement = getWallpaperAppearanceOptionMotionElement(button);
          if (!motionElement) {
            return;
          }
          const delay = getAppearanceOptionDelay(index, buttons.length, direction);
          maxInDelay = Math.max(maxInDelay, delay);
          motionElement.style.setProperty(
            'transition',
            `transform ${durationMs}ms ${easing} ${delay}ms, opacity ${fadeBlurDurationMs}ms ${easing} ${delay}ms, filter ${fadeBlurDurationMs}ms ${easing} ${delay}ms`
          );
          motionElement.style.setProperty('opacity', '1');
          motionElement.style.setProperty('filter', 'blur(0px)');
          motionElement.style.setProperty('transform', 'translate3d(0, 0, 0)');
        });
        const cleanupTimer = window.setTimeout(() => {
          wallpaperAppearanceAnimationTimers = wallpaperAppearanceAnimationTimers.filter((timerId) => timerId !== cleanupTimer);
          clearWallpaperAppearanceScopeAnimation();
          updateWallpaperAppearanceSelectionUi();
          updateWallpaperAppearanceModeLabels();
        }, durationMs + maxInDelay + 24);
        wallpaperAppearanceAnimationTimers.push(cleanupTimer);
      }, handoffDelayMs);
      wallpaperAppearanceAnimationTimers.push(handoffTimer);
    }

    function getWallpaperButtonLabel() {
      return t('settings_tab_appearance', 'Appearance');
    }

    function updateWallpaperButtonLanguageStrings() {
      if (wallpaperButton) {
        const label = getWallpaperButtonLabel();
        wallpaperButton.setAttribute('aria-label', label);
        wallpaperButton.removeAttribute('title');
      }
    }

    function updateWallpaperAppearanceLanguageStrings() {
      if (wallpaperAppearanceTitle) {
        wallpaperAppearanceTitle.textContent = t('settings_tab_appearance', 'Appearance');
      }
      if (wallpaperAppearanceMoreSettingsLink) {
        const label = t('newtab_more_settings', 'More settings');
        wallpaperAppearanceMoreSettingsLink.setAttribute('aria-label', label);
        wallpaperAppearanceMoreSettingsLink.setAttribute('href', buildAppearanceSettingsUrl());
        if (wallpaperAppearanceMoreSettingsText) {
          wallpaperAppearanceMoreSettingsText.textContent = label;
        }
      }
      if (wallpaperAppearanceInfoButton) {
        wallpaperAppearanceInfoButton.setAttribute(
          'aria-label',
          t('newtab_theme_scope_help_label', 'Theme scope info')
        );
      }
      if (wallpaperAppearanceScopeTabs) {
        wallpaperAppearanceScopeTabs.setAttribute('aria-label', t('newtab_theme_scope_label', 'Theme scope'));
        wallpaperAppearanceScopeTabs.querySelectorAll('.x-nt-appearance-scope-tab').forEach((button) => {
          const scope = button.getAttribute('data-theme-scope') === 'home' ? 'home' : 'global';
          const label = scope === 'home'
            ? t('newtab_theme_scope_home', 'New Tab')
            : t('newtab_theme_scope_global', 'Global');
          button.textContent = label;
          button.setAttribute('aria-label', formatMessage(
            'newtab_theme_scope_select_label',
            'Apply theme changes to {scope}',
            { scope: label }
          ));
        });
      }
    }

    function updateWallpaperSectionLanguageStrings() {
      if (wallpaperPanelTitle) {
        const title = t('newtab_wallpaper_title', 'Wallpaper');
        wallpaperPanelTitle.textContent = title;
        if (wallpaperPanel) {
          wallpaperPanel.setAttribute('aria-label', t('settings_tab_appearance', 'Appearance'));
        }
      }
      if (wallpaperTabs) {
        wallpaperTabs.setAttribute('aria-label', t('newtab_wallpaper_title', 'Wallpaper'));
      }
      if (wallpaperBuiltInTab) {
        const label = t('newtab_wallpaper_builtin_section', 'Built-in');
        wallpaperBuiltInTab.textContent = label;
        wallpaperBuiltInTab.setAttribute('aria-label', label);
      }
      if (wallpaperBuiltInGrid) {
        wallpaperBuiltInGrid.setAttribute('aria-label', t('newtab_wallpaper_builtin_section', 'Built-in'));
      }
      if (wallpaperLocalTab) {
        const label = t('newtab_wallpaper_local_section', 'Local');
        wallpaperLocalTab.textContent = label;
        wallpaperLocalTab.setAttribute('aria-label', label);
      }
      if (wallpaperLocalGrid) {
        wallpaperLocalGrid.setAttribute('aria-label', t('newtab_wallpaper_local_section', 'Local'));
      }
      if (logoPanelTitle) {
        logoPanelTitle.textContent = t('newtab_logo_title', 'Brand mark');
      }
    }

    function updateWallpaperScaleLanguageStrings() {
      if (wallpaperPanel) {
        wallpaperPanel.querySelectorAll('[data-overlay-tick="transparent"]').forEach((tick) => {
          tick.textContent = t('newtab_wallpaper_overlay_transparent_tick', 'Transparent');
        });
        wallpaperPanel.querySelectorAll('[data-overlay-tick="default"]').forEach((tick) => {
          tick.textContent = t('newtab_wallpaper_overlay_default_tick', 'Default');
        });
        wallpaperPanel.querySelectorAll('[data-overlay-tick="cover"]').forEach((tick) => {
          tick.textContent = t('newtab_wallpaper_overlay_cover_tick', 'Cover');
        });
      }
    }

    function updateWallpaperTileLanguageStrings() {
      const tileContainers = getWallpaperTileContainers();
      if (tileContainers.length === 0) {
        return;
      }
      tileContainers.forEach((container) => {
        container.querySelectorAll('.x-nt-wallpaper-delete-button').forEach((button) => {
          button.setAttribute('aria-label', t('newtab_wallpaper_delete_local', 'Delete imported wallpaper'));
        });
        container.querySelectorAll('.x-nt-wallpaper-tile').forEach((tile) => {
          const wallpaperId = tile.getAttribute('data-wallpaper-id');
          const item = getWallpaperById(wallpaperId);
          if (!item) {
            return;
          }
          tile.setAttribute('aria-label', formatMessage('newtab_wallpaper_select_label', 'Select {name}', {
            name: getWallpaperDisplayName(item)
          }));
        });
      });
    }

    function updateWallpaperLanguageStrings() {
      updateWallpaperButtonLanguageStrings();
      updateWallpaperAppearanceLanguageStrings();
      updateWallpaperOverlayControlUi();
      updateWallpaperEffectControlUi();
      updateCustomWallpaperUploadTile();
      updateWallpaperSectionLanguageStrings();
      updateLogoSwitchUi();
      updateNewtabFaviconSelectionUi();
      updateWallpaperAppearanceModeLabels();
      updateWallpaperScaleLanguageStrings();
      updateWallpaperTileLanguageStrings();
    }

    function createAppearanceInfoButton() {
      const button = createDomElement('button', {
        className: 'x-nt-appearance-info-button',
        innerHTML: getRiSvg('ri-question-line', 'ri-size-14')
      });
      button.type = 'button';
      const showHelp = () => {
        showTopActionTooltip(
          button,
          t(
            'newtab_theme_scope_help',
            '"Global" sets the default theme. "New Tab" overrides only the new tab page; choose "Follow Global" there to inherit the global setting.'
          )
        );
      };
      button.addEventListener('mouseenter', showHelp);
      button.addEventListener('mouseleave', hideTopActionTooltip);
      button.addEventListener('focus', showHelp);
      button.addEventListener('blur', hideTopActionTooltip);
      return button;
    }

    function createAppearanceScopeTabs() {
      const tabs = createDomElement('div', {
        className: 'x-nt-appearance-scope-tabs',
        attrs: { role: 'group' }
      });
      [
        { scope: 'global', fallback: 'Global' },
        { scope: 'home', fallback: 'New Tab' }
      ].forEach((item) => {
        const button = createDomElement('button', {
          className: 'x-nt-appearance-scope-tab',
          textContent: item.fallback,
          attrs: {
            'data-theme-scope': item.scope,
            'data-selected': 'false',
            'aria-pressed': 'false'
          }
        });
        button.type = 'button';
        button.addEventListener('click', () => {
          animateWallpaperAppearanceScopeChange(getThemeScope(), item.scope);
        });
        tabs.appendChild(button);
      });
      return tabs;
    }

    function createSearchWidthScale() {
      const scale = createDomElement('div', {
        className: 'x-nt-overlay-scale x-nt-search-width-scale',
        attrs: { 'aria-hidden': 'true' }
      });
      const ticks = [];
      const min = getSearchWidthMin();
      if (min < 720) {
        ticks.push({ key: 'min', value: min, fallback: '', align: 'start' });
      }
      ticks.push(
        { key: 'standard', value: 720, fallback: 'Standard' },
        { key: 'wide', value: 920, fallback: 'Wide' },
        { key: 'max', value: 1040, fallback: 'Max', align: 'end' }
      );
      ticks.forEach((item) => {
        const label = item.key === 'min'
          ? ''
          : t(`newtab_search_width_${item.key}`, item.fallback);
        const tick = createDomElement('span', {
          className: 'x-nt-overlay-tick x-nt-search-width-tick',
          textContent: label,
          attrs: {
            'data-search-width-tick': item.key,
            'data-align': item.align || 'center'
          }
        });
        tick.style.setProperty('--x-nt-search-width-tick-percent', `${getSearchWidthPercent(item.value)}%`);
        scale.appendChild(tick);
      });
      return scale;
    }

    function buildAppearanceSettingsUrl() {
      if (extensionRoutes && typeof extensionRoutes.buildOptionsUrl === 'function') {
        return extensionRoutes.buildOptionsUrl(chrome, 'appearance');
      }
      if (chrome && chrome.runtime && typeof chrome.runtime.getURL === 'function') {
        return `${chrome.runtime.getURL('src/options/options.html')}#appearance`;
      }
      try {
        return new URL('../options/options.html#appearance', window.location.href).toString();
      } catch (e) {
        return '../options/options.html#appearance';
      }
    }

    function createAppearanceMoreSettingsLink() {
      const label = t('newtab_more_settings', 'More settings');
      wallpaperAppearanceMoreSettingsText = createDomElement('span', {
        className: 'x-nt-appearance-more-settings-text',
        textContent: label
      });
      wallpaperAppearanceMoreSettingsLink = createDomElement('a', {
        className: 'x-nt-appearance-more-settings',
        attrs: {
          href: buildAppearanceSettingsUrl(),
          'aria-label': label
        },
        children: [
          wallpaperAppearanceMoreSettingsText,
          createDomElement('span', {
            className: 'x-nt-appearance-more-settings-icon',
            innerHTML: getRiSvg('ri-arrow-right-s-line', 'ri-size-14'),
            attrs: { 'aria-hidden': 'true' }
          })
        ]
      });
      wallpaperAppearanceMoreSettingsLink.addEventListener('click', () => {
        wallpaperAppearanceMoreSettingsLink.setAttribute('href', buildAppearanceSettingsUrl());
      });
      return wallpaperAppearanceMoreSettingsLink;
    }

    function createSearchWidthControl() {
      const control = createDomElement('div', {
        className: 'x-nt-overlay-control x-nt-search-width-control',
        attrs: {
          'data-visible': 'false',
          'aria-hidden': 'true'
        }
      });
      const header = createDomElement('div', { className: 'x-nt-overlay-control-header' });
      wallpaperSearchWidthLabel = createDomElement('span', {
        className: 'x-nt-overlay-label',
        textContent: t('newtab_search_width_title', 'Search box width')
      });
      wallpaperSearchWidthValue = createDomElement('span', {
        className: 'x-nt-overlay-value',
        textContent: formatSearchWidthValue(getSearchWidth())
      });
      const wrap = createDomElement('div', {
        className: 'x-nt-overlay-slider-wrap x-nt-search-width-slider-wrap'
      });
      wallpaperSearchWidthSlider = createDomElement('input', {
        className: 'x-nt-overlay-slider x-nt-search-width-slider',
        attrs: {
          type: 'range',
          min: String(getSearchWidthMin()),
          max: String(getSearchWidthMax()),
          step: '1',
          'data-value-suffix': ' px',
          'aria-label': t('newtab_search_width_aria', 'Adjust New Tab search box width')
        }
      });
      wallpaperSearchWidthSlider.addEventListener('input', () => {
        persistSearchWidthFromSlider(wallpaperSearchWidthSlider.value, { final: false });
      });
      wallpaperSearchWidthSlider.addEventListener('change', () => {
        persistSearchWidthFromSlider(wallpaperSearchWidthSlider.value, { final: true });
      });
      bindWallpaperSliderValueBubble(wallpaperSearchWidthSlider);
      appendChildren(header, [wallpaperSearchWidthLabel, wallpaperSearchWidthValue]);
      appendChildren(wrap, [wallpaperSearchWidthSlider, createSearchWidthScale()]);
      appendChildren(control, [header, wrap, createAppearanceMoreSettingsLink()]);
      wallpaperSearchWidthControl = control;
      updateSearchWidthSliderElement(getSearchWidth());
      return control;
    }

    function createAppearanceOption(item) {
      const button = createDomElement('button', {
        className: 'x-nt-appearance-option',
        attrs: {
          'data-theme-mode': item.mode,
          'data-selected': 'false',
          'aria-pressed': 'false'
        }
      });
      button.type = 'button';
      const image = createDomElement('img');
      image.src = getRuntimeAssetUrl(item.image);
      image.alt = '';
      image.draggable = false;
      const check = createDomElement('span', {
        className: 'x-nt-appearance-check',
        innerHTML: getRiSvg('ri-check-line', 'ri-size-16')
      });
      const preview = createDomElement('span', {
        className: 'x-nt-appearance-preview',
        children: [image, check]
      });
      const label = createDomElement('span', { className: 'x-nt-appearance-label' });
      const content = createDomElement('span', {
        className: 'x-nt-appearance-option-content',
        children: [preview, label]
      });
      button.appendChild(content);
      button.addEventListener('click', () => {
        setThemeMode(item.mode);
      });
      return button;
    }

    function createAppearanceSection() {
      const section = createDomElement('div', { className: 'x-nt-appearance-section' });
      const header = createDomElement('div', { className: 'x-nt-appearance-header' });
      const titleGroup = createDomElement('div', { className: 'x-nt-appearance-title-group' });
      wallpaperAppearanceTitle = createDomElement('div', { className: 'x-nt-wallpaper-panel-title' });
      wallpaperAppearanceInfoButton = createAppearanceInfoButton();
      wallpaperAppearanceScopeTabs = createAppearanceScopeTabs();
      wallpaperAppearanceOptions = createDomElement('div', { className: 'x-nt-appearance-options' });
      [
        { mode: 'system', image: 'assets/images/system.svg' },
        { mode: 'light', image: 'assets/images/light.svg' },
        { mode: 'dark', image: 'assets/images/dark.svg' }
      ].forEach((item) => {
        wallpaperAppearanceOptions.appendChild(createAppearanceOption(item));
      });
      appendChildren(titleGroup, [wallpaperAppearanceTitle, wallpaperAppearanceInfoButton]);
      appendChildren(header, [titleGroup, wallpaperAppearanceScopeTabs]);
      appendChildren(section, [header, wallpaperAppearanceOptions, createSearchWidthControl()]);
      return section;
    }

    function createEffectOptions() {
      const options = createDomElement('div', {
        className: 'x-nt-effect-options',
        attrs: {
          role: 'tablist',
          'aria-label': t('newtab_wallpaper_effect_title', 'Wallpaper filter')
        }
      });
      wallpaperEffectTabsIndicator = createDomElement('span', {
        className: 'x-nt-effect-indicator',
        attrs: { 'aria-hidden': 'true' }
      });
      options.appendChild(wallpaperEffectTabsIndicator);
      NEWTAB_WALLPAPER_EFFECT_TYPES.forEach((item) => {
        const button = createDomElement('button', {
          className: 'x-nt-effect-option',
          textContent: item.fallback,
          attrs: {
            'data-wallpaper-effect-type': item.type,
            'data-selected': 'false',
            'data-active': 'false',
            'aria-pressed': 'false'
          }
        });
        button.type = 'button';
        button.addEventListener('click', () => {
          persistWallpaperEffectPrefs({ type: item.type });
        });
        options.appendChild(button);
      });
      return options;
    }

    function createWallpaperOverlayControl() {
      const overlayScale = createOverlayScale([
        { align: 'start', text: t('newtab_wallpaper_overlay_transparent_tick', 'Transparent'), key: 'transparent' },
        { align: 'center', text: t('newtab_wallpaper_overlay_default_tick', 'Default'), key: 'default' },
        { align: 'end', text: t('newtab_wallpaper_overlay_cover_tick', 'Cover'), key: 'cover' }
      ]);
      const overlayControl = createWallpaperSliderControl({
        controlClass: 'x-nt-overlay-control x-nt-overlay-control--effect',
        labelClass: 'x-nt-overlay-label',
        sliderClass: 'x-nt-overlay-slider',
        wrapClass: 'x-nt-overlay-slider-wrap',
        labelKey: 'newtab_wallpaper_overlay_opacity',
        fallback: 'Mask effect',
        getFallbackValue: getWallpaperOverlayOpacityForCurrentMode,
        persist: (value) => {
          persistWallpaperOverlayOpacity(getResolvedWallpaperOverlayMode(), value);
        },
        scale: overlayScale
      });
      wallpaperOverlayLabel = overlayControl.label;
      wallpaperOverlaySlider = overlayControl.slider;
      return overlayControl.control;
    }

    function createWallpaperEffectHeader() {
      const effectHeader = createDomElement('div', {
        className: 'x-nt-overlay-control-header x-nt-effect-control-header'
      });
      wallpaperEffectLabel = createDomElement('span', { className: 'x-nt-effect-label' });
      effectHeader.appendChild(wallpaperEffectLabel);
      return effectHeader;
    }

    function createWallpaperEffectSlider(prefKey, labelKey, fallback) {
      return createWallpaperSliderControl({
        labelKey,
        fallback,
        getFallbackValue: () => currentWallpaperEffectPrefs[prefKey],
        persist: (value) => {
          persistWallpaperEffectPrefs({ [prefKey]: value });
        }
      });
    }

    function createWallpaperEffectSliderControls() {
      const hoverControl = createEffectToggleControl();
      wallpaperEffectHoverControl = hoverControl.control;
      wallpaperEffectHoverTitle = hoverControl.title;
      wallpaperEffectHoverToggle = hoverControl.toggle;

      const strengthControl = createWallpaperEffectSlider(
        'strength',
        'newtab_wallpaper_effect_strength',
        'Sampling strength'
      );
      wallpaperEffectStrengthControl = strengthControl.control;
      wallpaperEffectStrengthLabel = strengthControl.label;
      wallpaperEffectSlider = strengthControl.slider;

      const sizeControl = createWallpaperEffectSlider('size', 'newtab_wallpaper_effect_size', 'Size');
      wallpaperEffectSizeControl = sizeControl.control;
      wallpaperEffectSizeLabel = sizeControl.label;
      wallpaperEffectSizeSlider = sizeControl.slider;

      const spacingControl = createWallpaperEffectSlider('spacing', 'newtab_wallpaper_effect_spacing', 'Spacing');
      wallpaperEffectSpacingControl = spacingControl.control;
      wallpaperEffectSpacingLabel = spacingControl.label;
      wallpaperEffectSpacingSlider = spacingControl.slider;

      return [
        wallpaperEffectHoverControl,
        wallpaperEffectStrengthControl,
        wallpaperEffectSizeControl,
        wallpaperEffectSpacingControl
      ];
    }

    function createWallpaperEffectControl() {
      const effectControl = createDomElement('div', { className: 'x-nt-effect-control' });
      wallpaperEffectOptions = createEffectOptions();
      appendChildren(effectControl, [
        createWallpaperOverlayControl(),
        createWallpaperEffectHeader(),
        wallpaperEffectOptions,
        ...createWallpaperEffectSliderControls()
      ]);
      return effectControl;
    }

    function createWallpaperTabs() {
      const tabs = createDomElement('div', {
        className: 'x-nt-wallpaper-tabs',
        attrs: { role: 'tablist' }
      });
      wallpaperTabsIndicator = createDomElement('span', {
        className: 'x-nt-wallpaper-tabs-indicator',
        attrs: { 'aria-hidden': 'true' }
      });
      tabs.appendChild(wallpaperTabsIndicator);
      [
        { tab: 'built-in', fallback: 'Built-in' },
        { tab: 'local', fallback: 'Local' }
      ].forEach((item) => {
        const button = createDomElement('button', {
          className: 'x-nt-wallpaper-tab',
          textContent: item.fallback,
          attrs: {
            role: 'tab',
            'data-wallpaper-tab': item.tab,
            'data-active': 'false',
            'aria-selected': 'false'
          }
        });
        button.type = 'button';
        button.addEventListener('click', () => {
          setWallpaperActiveTab(item.tab);
        });
        if (item.tab === 'built-in') {
          wallpaperBuiltInTab = button;
        } else {
          wallpaperLocalTab = button;
        }
        tabs.appendChild(button);
      });
      return tabs;
    }

    function createWallpaperUploadTile() {
      customWallpaperUploadTile = createDomElement('div', {
        className: 'x-nt-wallpaper-tile x-nt-wallpaper-upload-tile',
        attrs: {
          role: 'button',
          tabindex: '0',
          'data-upload': 'true',
          'data-loading': 'false',
          'data-selected': 'false',
          'aria-pressed': 'false'
        }
      });
      const placeholder = createDomElement('span', {
        className: 'x-nt-wallpaper-upload-placeholder',
        innerHTML: getRiSvg('ri-add-large-line', 'ri-size-18')
      });
      const thumb = createWallpaperThumb([placeholder], 'x-nt-wallpaper-upload-thumb');
      customWallpaperUploadTile.appendChild(thumb);
      bindCustomWallpaperUploadTile(customWallpaperUploadTile);
      return customWallpaperUploadTile;
    }

    function bindCustomWallpaperUploadTile(tile) {
      tile.addEventListener('click', openCustomWallpaperPicker);
      tile.addEventListener('keydown', (event) => {
        if (!event || (event.key !== 'Enter' && event.key !== ' ')) {
          return;
        }
        event.preventDefault();
        openCustomWallpaperPicker();
      });
      tile.addEventListener('mouseenter', () => {
        showCustomWallpaperTooltip(tile);
      });
      tile.addEventListener('mouseleave', hideCustomWallpaperTooltip);
      tile.addEventListener('focusin', () => {
        showCustomWallpaperTooltip(tile);
      });
      tile.addEventListener('focusout', (event) => {
        const nextTarget = event && event.relatedTarget ? event.relatedTarget : null;
        if (!nextTarget || !tile.contains(nextTarget)) {
          hideCustomWallpaperTooltip();
        }
      });
    }

    function createWallpaperImage(src, className) {
      const image = createDomElement('img');
      image.src = src;
      image.alt = '';
      image.draggable = false;
      image.loading = 'lazy';
      image.decoding = 'async';
      if (className) {
        image.className = className;
      }
      return image;
    }

    function createWallpaperThumb(children, extraClassName) {
      return createDomElement('span', {
        className: ['x-nt-wallpaper-thumb', extraClassName].filter(Boolean).join(' '),
        children
      });
    }

    function createWallpaperCheckMark() {
      return createDomElement('span', {
        className: 'x-nt-wallpaper-check',
        innerHTML: getRiSvg('ri-check-line', 'ri-size-16')
      });
    }

    function bindWallpaperTileActivation(tile, onActivate, shouldIgnoreEvent) {
      const activate = (event) => {
        if (typeof shouldIgnoreEvent === 'function' && shouldIgnoreEvent(event)) {
          return;
        }
        onActivate(event);
      };
      tile.addEventListener('click', activate);
      tile.addEventListener('keydown', (event) => {
        if (!event || (event.key !== 'Enter' && event.key !== ' ')) {
          return;
        }
        if (typeof shouldIgnoreEvent === 'function' && shouldIgnoreEvent(event)) {
          return;
        }
        event.preventDefault();
        onActivate(event);
      });
    }

    function createSelectableWallpaperTile(item, options) {
      const config = options || {};
      const tile = createDomElement(config.tagName || 'button', {
        className: ['x-nt-wallpaper-tile', config.className].filter(Boolean).join(' '),
        attrs: Object.assign({
          'data-wallpaper-id': item.id,
          'data-selected': 'false',
          'aria-pressed': 'false'
        }, config.attrs || {}),
        children: [
          createWallpaperThumb([createWallpaperImage(getWallpaperThumbnailUrl(item), config.imageClassName)]),
          createWallpaperCheckMark()
        ]
      });
      if (tile.tagName === 'BUTTON') {
        tile.type = 'button';
      }
      if (typeof config.onSelect === 'function') {
        if (tile.tagName === 'BUTTON') {
          tile.addEventListener('click', config.onSelect);
        } else {
          bindWallpaperTileActivation(tile, config.onSelect, config.shouldIgnoreEvent);
        }
      }
      return tile;
    }

    function isWallpaperDeleteButtonEvent(event) {
      return Boolean(event &&
        event.target &&
        event.target.closest &&
        event.target.closest('.x-nt-wallpaper-delete-button'));
    }

    function createBuiltInWallpaperTile(item) {
      return createSelectableWallpaperTile(item, {
        attrs: { 'data-wallpaper-path': getWallpaperLocalPath(item) },
        onSelect: () => {
          persistNewtabWallpaper(item.id);
        }
      });
    }

    function createCustomWallpaperTile(item) {
      const tile = createSelectableWallpaperTile(item, {
        tagName: 'div',
        className: 'x-nt-wallpaper-custom-tile',
        imageClassName: 'x-nt-wallpaper-custom-image',
        attrs: {
          role: 'button',
          tabindex: '0',
          'data-custom-wallpaper': 'true'
        },
        shouldIgnoreEvent: isWallpaperDeleteButtonEvent,
        onSelect: () => {
          persistNewtabWallpaper(item.id);
        }
      });
      const deleteButton = createDomElement('button', {
        className: 'x-nt-wallpaper-delete-button',
        attrs: {
          'aria-label': t('newtab_wallpaper_delete_local', 'Delete imported wallpaper')
        },
        innerHTML: getRiSvg('ri-subtract-line', 'ri-size-14')
      });
      deleteButton.type = 'button';
      deleteButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        deleteCustomWallpaper(item.id);
      });
      tile.appendChild(deleteButton);
      return tile;
    }

    function createWallpaperBody(effectControl) {
      wallpaperBody = createDomElement('div', {
        className: 'x-nt-wallpaper-body',
        attrs: {
          'data-visible': 'true',
          'data-active-tab': activeWallpaperTab
        }
      });
      wallpaperTabs = createWallpaperTabs();
      wallpaperBuiltInGrid = createDomElement('div', {
        className: 'x-nt-wallpaper-grid x-nt-wallpaper-grid--built-in',
        attrs: {
          role: 'tabpanel',
          'data-wallpaper-panel': 'built-in'
        }
      });
      wallpaperLocalGrid = createDomElement('div', {
        className: 'x-nt-wallpaper-grid x-nt-wallpaper-grid--local',
        attrs: {
          role: 'tabpanel',
          'data-wallpaper-panel': 'local'
        }
      });
      wallpaperLocalGrid.appendChild(createWallpaperUploadTile());
      NEWTAB_WALLPAPER_OPTIONS.forEach((item) => {
        wallpaperBuiltInGrid.appendChild(createBuiltInWallpaperTile(item));
      });
      appendChildren(wallpaperBody, [
        wallpaperTabs,
        wallpaperBuiltInGrid,
        wallpaperLocalGrid,
        effectControl
      ]);
      return wallpaperBody;
    }

    function createWallpaperSection(effectControl) {
      const headerSection = createSwitchPanelSection(() => {
        if (wallpaperEnabledToggle.checked) {
          persistNewtabWallpaper(getWallpaperRestoreId());
          return;
        }
        persistNewtabWallpaper('');
      });
      wallpaperPanelHeader = headerSection.header;
      wallpaperPanelTitle = headerSection.title;
      wallpaperEnabledToggle = headerSection.toggle;
      customWallpaperInput = createDomElement('input', { className: 'x-nt-wallpaper-file-input' });
      customWallpaperInput.type = 'file';
      customWallpaperInput.accept = 'image/*';
      customWallpaperInput.tabIndex = -1;
      customWallpaperInput.addEventListener('change', (event) => {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        importCustomWallpaperFile(file);
      });
      appendChildren(headerSection.section, [
        customWallpaperInput,
        createWallpaperBody(effectControl)
      ]);
      renderCustomWallpaperTiles();
      return headerSection.section;
    }

    function createNewtabFaviconPreview(item) {
      if (item && item.preview === 'inlineSvg') {
        return createDomElement('span', {
          className: 'x-nt-favicon-image x-nt-favicon-svg-preview',
          attrs: { 'aria-hidden': 'true' },
          innerHTML: [
            '<svg viewBox="0 0 104 104" fill="none" xmlns="http://www.w3.org/2000/svg">',
            `<path opacity="var(--x-nt-favicon-shadow-opacity, 0.2)" d="${NEWTAB_FAVICON_SVG_SHADOW_PATH}" fill="currentColor"/>`,
            `<path d="${NEWTAB_FAVICON_SVG_MAIN_PATH}" fill="currentColor" fill-opacity="var(--x-nt-favicon-main-opacity, 0.5)"/>`,
            '</svg>'
          ].join('')
        });
      }
      const image = createDomElement('img', { className: 'x-nt-favicon-image' });
      image.src = getNewtabFaviconUrl(item);
      image.alt = '';
      image.draggable = false;
      return image;
    }

    function createNewtabFaviconOption(item) {
      const preview = createNewtabFaviconPreview(item);
      const tile = createDomElement('button', {
        className: 'x-nt-wallpaper-tile x-nt-favicon-option',
        attrs: {
          'data-newtab-favicon-id': item.id,
          'data-selected': 'false',
          'aria-pressed': 'false'
        },
        children: [
          createWallpaperThumb([preview], 'x-nt-favicon-thumb'),
          createWallpaperCheckMark()
        ]
      });
      tile.type = 'button';
      tile.addEventListener('click', () => {
        persistNewtabFavicon(item.id);
      });
      return tile;
    }

    function createNewtabFaviconGroup() {
      const group = createDomElement('div', { className: 'x-nt-favicon-group' });
      newtabFaviconTitle = createDomElement('div', {
        className: 'x-nt-wallpaper-panel-title x-nt-favicon-title'
      });
      newtabFaviconOptions = createDomElement('div', {
        className: 'x-nt-favicon-options',
        attrs: { role: 'group' }
      });
      NEWTAB_FAVICON_OPTIONS.forEach((item) => {
        newtabFaviconOptions.appendChild(createNewtabFaviconOption(item));
      });
      appendChildren(group, [newtabFaviconTitle, newtabFaviconOptions]);
      return group;
    }

    function createLogoSection() {
      const logoSection = createSwitchPanelSection(() => {
        persistWordmarkVisible(logoEnabledToggle.checked);
      });
      logoPanelTitle = logoSection.title;
      logoEnabledToggle = logoSection.toggle;
      logoSection.section.appendChild(createNewtabFaviconGroup());
      return logoSection.section;
    }

    function renderWallpaperPanel() {
      if (!wallpaperPanel || wallpaperPanelRendered) {
        return;
      }
      wallpaperPanelRendered = true;
      const effectControl = createWallpaperEffectControl();
      appendChildren(wallpaperPanel, [
        createAppearanceSection(),
        createPanelDivider(),
        createWallpaperSection(effectControl),
        createPanelDivider(),
        createLogoSection()
      ]);
      updateWallpaperLanguageStrings();
      setWallpaperActiveTab(activeWallpaperTab);
      updateCustomWallpaperUploadTile();
      updateWallpaperSelectionUi();
      updateWallpaperAppearanceSelectionUi();
      updateNewtabFaviconSelectionUi();
    }

    function openWallpaperPanel() {
      if (!wallpaperPanel || !wallpaperButton) {
        return;
      }
      renderWallpaperPanel();
      wallpaperPanel.setAttribute('data-open', 'true');
      wallpaperButton.setAttribute('data-open', 'true');
      wallpaperButton.setAttribute('aria-expanded', 'true');
      if (wallpaperControl) {
        wallpaperControl.setAttribute('data-panel-open', 'true');
      }
      setWallpaperPanelOpenState(true);
      scheduleWallpaperPanelOpenTabIndicatorsRefresh();
    }

    function closeWallpaperPanel(options) {
      if (!wallpaperPanel || !wallpaperButton) {
        return;
      }
      cancelWallpaperPanelActiveControls();
      hideWallpaperSliderValueBubble(null, { force: true });
      wallpaperPanel.setAttribute('data-open', 'false');
      wallpaperButton.setAttribute('data-open', 'false');
      wallpaperButton.setAttribute('aria-expanded', 'false');
      if (wallpaperControl) {
        wallpaperControl.setAttribute('data-panel-open', 'false');
      }
      setWallpaperPanelOpenState(false);
      if (options && options.restoreFocus) {
        try {
          wallpaperButton.focus({ preventScroll: true });
        } catch (e) {
          wallpaperButton.focus();
        }
      }
    }

    function toggleWallpaperPanel() {
      if (isWallpaperPanelOpen()) {
        closeWallpaperPanel();
        return;
      }
      openWallpaperPanel();
    }

    function createWallpaperControls() {
      wallpaperControl = document.createElement('div');
      wallpaperControl.className = 'x-nt-wallpaper-control';
      wallpaperControl.setAttribute('data-panel-open', 'false');
      wallpaperButton = document.createElement('button');
      wallpaperButton.type = 'button';
      wallpaperButton.className = 'x-nt-wallpaper-button';
      wallpaperButton.setAttribute('aria-haspopup', 'dialog');
      wallpaperButton.setAttribute('aria-expanded', 'false');
      wallpaperButton.setAttribute('data-open', 'false');
      wallpaperButton.setAttribute('data-active', 'false');
      wallpaperButton.innerHTML = getRiSvg('ri-t-shirt-2-line', 'ri-size-20');
      wallpaperPanel = document.createElement('div');
      wallpaperPanel.className = 'x-nt-wallpaper-panel';
      wallpaperPanel.setAttribute('data-open', 'false');
      wallpaperPanel.setAttribute('role', 'dialog');
      wallpaperPanel.setAttribute('aria-modal', 'false');
      wallpaperPanel.addEventListener('scroll', () => {
        hideWallpaperSliderValueBubble(null, { force: true });
      }, { passive: true });
      wallpaperButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        hideTopActionTooltip();
        toggleWallpaperPanel();
      });
      const showWallpaperButtonTooltip = () => {
        if (isWallpaperPanelOpen()) {
          hideTopActionTooltip();
          return;
        }
        showTopActionTooltip(wallpaperButton, getWallpaperButtonLabel(), {
          placement: 'top'
        });
      };
      wallpaperButton.addEventListener('mouseenter', showWallpaperButtonTooltip);
      wallpaperButton.addEventListener('mouseleave', hideTopActionTooltip);
      wallpaperButton.addEventListener('focus', showWallpaperButtonTooltip);
      wallpaperButton.addEventListener('blur', hideTopActionTooltip);
      wallpaperControl.appendChild(wallpaperPanel);
      wallpaperControl.appendChild(wallpaperButton);
      window.addEventListener('resize', scheduleWallpaperPanelTabIndicatorsRefresh, { passive: true });
      window.addEventListener('resize', () => {
        hideWallpaperSliderValueBubble(null, { force: true });
      }, { passive: true });
      updateWallpaperLanguageStrings();
      updateWallpaperSelectionUi();
    }


    function handleStorageChange(changes) {
      if (!changes) {
        return false;
      }
      let handled = false;
      if (changes[NEWTAB_WALLPAPER_OVERLAY_STORAGE_KEY]) {
        applyWallpaperOverlayOpacity(changes[NEWTAB_WALLPAPER_OVERLAY_STORAGE_KEY].newValue);
        handled = true;
      }
      if (NEWTAB_LOCAL_WALLPAPER_STORAGE_KEY && changes[NEWTAB_LOCAL_WALLPAPER_STORAGE_KEY]) {
        const raw = changes[NEWTAB_LOCAL_WALLPAPER_STORAGE_KEY].newValue;
        const hasValue = typeof raw !== 'undefined';
        const rawWallpaperId = String(getRawWallpaperId(raw) || '').trim();
        const shouldRefreshCustomWallpapers = shouldWaitForCustomWallpapers(raw) &&
          !getWallpaperById(rawWallpaperId);
        const applyLocalWallpaper = () => {
          const localResolution = resolveLocalWallpaperOverride(raw, hasValue);
          if (localResolution.shouldClear) {
            writeLocalWallpaperValue('');
          }
          if (localResolution.hasOverride) {
            localWallpaperOverrideActive = true;
            applyNewtabWallpaper(localResolution.id);
            return;
          }
          localWallpaperOverrideActive = false;
          readStorageValue(storageArea, NEWTAB_WALLPAPER_STORAGE_KEY).then((syncedValue) => {
            const syncedResolution = resolveSyncedWallpaperValue(syncedValue.value, syncedValue.hasValue);
            if (syncedResolution.migrateCustomToLocal) {
              localWallpaperOverrideActive = true;
              writeLocalWallpaperValue(syncedResolution.id);
            }
            applyNewtabWallpaper(syncedResolution.id);
            if (syncedResolution.sanitizedId !== null) {
              writeSyncedWallpaperValue(syncedResolution.sanitizedId);
            }
          });
        };
        wallpaperStorageChangeSeq += 1;
        if (shouldRefreshCustomWallpapers) {
          const changeSeq = wallpaperStorageChangeSeq;
          loadCustomWallpapers().then(() => {
            if (changeSeq === wallpaperStorageChangeSeq) {
              applyLocalWallpaper();
            }
          });
        } else {
          applyLocalWallpaper();
        }
        handled = true;
      }
      if (changes[NEWTAB_WALLPAPER_STORAGE_KEY]) {
        const raw = changes[NEWTAB_WALLPAPER_STORAGE_KEY].newValue;
        const rawWallpaperId = String(getRawWallpaperId(raw) || '').trim();
        const shouldRefreshCustomWallpapers = shouldWaitForCustomWallpapers(raw) &&
          !getWallpaperById(rawWallpaperId);
        const applyStoredWallpaper = () => {
          const syncedResolution = resolveSyncedWallpaperValue(raw, true);
          if (syncedResolution.sanitizedId !== null) {
            writeSyncedWallpaperValue(syncedResolution.sanitizedId);
          }
          if (localWallpaperOverrideActive) {
            return;
          }
          if (syncedResolution.migrateCustomToLocal) {
            localWallpaperOverrideActive = true;
            writeLocalWallpaperValue(syncedResolution.id);
          } else {
            localWallpaperOverrideActive = false;
          }
          applyNewtabWallpaper(syncedResolution.id);
        };
        wallpaperStorageChangeSeq += 1;
        if (shouldRefreshCustomWallpapers) {
          const changeSeq = wallpaperStorageChangeSeq;
          loadCustomWallpapers().then(() => {
            if (changeSeq === wallpaperStorageChangeSeq) {
              applyStoredWallpaper();
            }
          });
        } else {
          applyStoredWallpaper();
        }
        handled = true;
      }
      if (changes[NEWTAB_WALLPAPER_EFFECT_STORAGE_KEY]) {
        applyWallpaperEffectPrefs(changes[NEWTAB_WALLPAPER_EFFECT_STORAGE_KEY].newValue);
        handled = true;
      }
      if (NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY && changes[NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY]) {
        const raw = changes[NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY].newValue;
        const nextValue = normalizeNewtabWordmarkVisible(raw);
        applyWordmarkVisible(nextValue);
        if (storageArea && raw !== nextValue) {
          storageArea.set({ [NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY]: nextValue });
        }
        handled = true;
      }
      if (NEWTAB_FAVICON_STORAGE_KEY && changes[NEWTAB_FAVICON_STORAGE_KEY]) {
        const raw = changes[NEWTAB_FAVICON_STORAGE_KEY].newValue;
        const nextId = normalizeNewtabFaviconId(raw);
        applyNewtabFavicon(nextId);
        if (storageArea && raw !== nextId) {
          writeStorageValue(storageArea, NEWTAB_FAVICON_STORAGE_KEY, nextId);
        }
        handled = true;
      }
      return handled;
    }

    function getControlElement() {
      return wallpaperControl;
    }

    function containsTarget(target) {
      return Boolean(wallpaperControl && target &&
        (target === wallpaperControl || wallpaperControl.contains(target)));
    }

    return {
      storageKeys,
      createControls: createWallpaperControls,
      getControlElement,
      containsTarget,
      isPanelOpen: isWallpaperPanelOpen,
      closePanel: closeWallpaperPanel,
      updateLanguageStrings: updateWallpaperLanguageStrings,
      updateAppearanceSelectionUi: updateWallpaperAppearanceSelectionUi,
      updateSearchWidthUi: updateWallpaperSearchWidthControlUi,
      updateWordmarkVisibilityUi: updateLogoSwitchUi,
      bootstrapInitialWallpaper,
      bootstrapInitialWallpaperOverlay,
      bootstrapInitialWallpaperEffect,
      bootstrapInitialNewtabFavicon,
      handleStorageChange,
      scheduleAdaptiveToneUpdate: scheduleWallpaperAdaptiveToneUpdate
    };
  }

  globalThis.LumnoNewtabWallpaper = {
    STORAGE_KEYS: DEFAULT_STORAGE_KEYS,
    createWallpaperRuntime
  };
})();
