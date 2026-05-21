(function() {
  const WALLPAPER_ADAPTIVE_TONE = globalThis.LumnoNewtabWallpaperAdaptiveTone || {};
  const WALLPAPER_EFFECTS = globalThis.LumnoNewtabWallpaperEffects || {};
  const WALLPAPER_LOCAL_STORE = globalThis.LumnoNewtabWallpaperLocalStore || {};
  const FEATURE_HINTS = globalThis.LumnoFeatureHints || {};
  const DEFAULT_STORAGE_KEYS = {
    wallpaper: '_x_extension_newtab_wallpaper_2026_unique_',
    overlay: '_x_extension_newtab_wallpaper_overlay_2026_unique_',
    effect: '_x_extension_newtab_wallpaper_effect_2026_unique_',
    wordmark: '_x_extension_newtab_wordmark_visible_2026_unique_'
  };
  const PRELOAD_STORAGE_KEY = '_x_extension_newtab_wallpaper_preload_2026_unique_';

  function createWallpaperRuntime(options) {
    options = options || {};
    const documentObj = options.documentObj || document;
    const windowObj = options.windowObj || window;
    const document = documentObj;
    const window = windowObj;
    const chrome = options.chromeObj || globalThis.chrome || {};
    const storageArea = options.storageArea || null;
    const storageKeys = Object.assign({}, DEFAULT_STORAGE_KEYS, options.storageKeys || {});
    const NEWTAB_WALLPAPER_STORAGE_KEY = storageKeys.wallpaper;
    const NEWTAB_WALLPAPER_OVERLAY_STORAGE_KEY = storageKeys.overlay;
    const NEWTAB_WALLPAPER_EFFECT_STORAGE_KEY = storageKeys.effect;
    const NEWTAB_WORDMARK_VISIBLE_STORAGE_KEY = storageKeys.wordmark;
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

    const NEWTAB_WALLPAPER_DEFAULT_DIRECTORY = '/Users/kevinxu/github/Lumno/output/imagegen';
    const NEWTAB_WALLPAPER_EXTENSION_DIRECTORY = 'output/imagegen';
    const NEWTAB_WALLPAPER_THUMBNAIL_SUFFIX = '-thumb.webp';
    const NEWTAB_WALLPAPER_DEFAULT_ID = 'settings-bg-light-monet-newtab';
    const NEWTAB_CUSTOM_WALLPAPER_ID = WALLPAPER_LOCAL_STORE.CUSTOM_WALLPAPER_ID || 'custom-upload';
    const NEWTAB_CUSTOM_WALLPAPER_ID_PREFIX = WALLPAPER_LOCAL_STORE.CUSTOM_WALLPAPER_ID_PREFIX || 'custom-wallpaper-';
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
      version: 2,
      type: 'none',
      strength: 50,
      size: 50,
      spacing: 50
    };
    const NEWTAB_WALLPAPER_EFFECT_TYPES = [
      { type: 'none', labelKey: 'newtab_wallpaper_effect_none', fallback: 'Off' },
      { type: 'grain', labelKey: 'newtab_wallpaper_effect_grain', fallback: 'Grain' },
      { type: 'halftone', labelKey: 'newtab_wallpaper_effect_halftone', fallback: 'Dots' },
      { type: 'ascii', labelKey: 'newtab_wallpaper_effect_ascii', fallback: 'ASCII' }
    ];
    const WALLPAPER_PANEL_RESIZE_DURATION_MS = 260;
    const WALLPAPER_PANEL_RESIZE_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

    let initialWallpaperApplied = false;
    let hasWallpaperBootstrapStarted = false;
    let resolveInitialWallpaperReady = null;
    const initialWallpaperReadyPromise = new Promise((resolve) => {
      resolveInitialWallpaperReady = resolve;
    });
    let initialWallpaperOverlayReadyPromise = null;
    let wallpaperControl = null;
    let wallpaperButton = null;
    let wallpaperFeatureHintController = null;
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
    let wallpaperOverlayLabel = null;
    let wallpaperOverlayValue = null;
    let wallpaperOverlaySlider = null;
    let wallpaperEffectLabel = null;
    let wallpaperEffectValue = null;
    let wallpaperEffectOptions = null;
    let wallpaperEffectTabsIndicator = null;
    let wallpaperEffectStrengthControl = null;
    let wallpaperEffectStrengthLabel = null;
    let wallpaperEffectStrengthValue = null;
    let wallpaperEffectSlider = null;
    let wallpaperEffectSizeControl = null;
    let wallpaperEffectSizeLabel = null;
    let wallpaperEffectSizeValue = null;
    let wallpaperEffectSizeSlider = null;
    let wallpaperEffectSpacingControl = null;
    let wallpaperEffectSpacingLabel = null;
    let wallpaperEffectSpacingValue = null;
    let wallpaperEffectSpacingSlider = null;
    let wallpaperOverlaySaveTimer = null;
    let wallpaperEffectSaveTimer = null;
    let wallpaperPanelResizeTimer = null;
    let wallpaperPanelResizeCleanup = null;
    let wallpaperOverlayPointerActive = false;
    let wallpaperEffectPointerActive = false;
    let wallpaperEffectSizePointerActive = false;
    let wallpaperEffectSpacingPointerActive = false;
    let wallpaperAppearanceAnimationTimers = [];
    let wallpaperAppearanceModeLabelsHeld = false;
    let customWallpapers = [];
    let customWallpaperUploadTile = null;
    let customWallpaperInput = null;
    let customWallpaperImporting = false;
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
    let currentWordmarkVisible = normalizeNewtabWordmarkVisible(getWordmarkVisible());

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

    function getRawWallpaperId(value) {
      return value && typeof value === 'object' && value.id ? value.id : value;
    }

    function shouldWaitForCustomWallpapers(value) {
      const id = String(getRawWallpaperId(value) || '').trim();
      return id === NEWTAB_CUSTOM_WALLPAPER_ID || isCustomWallpaperId(id);
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

    function updateWallpaperOverlayControlUi() {
      const value = getWallpaperOverlayOpacityForCurrentMode();
      if (wallpaperOverlaySlider) {
        wallpaperOverlaySlider.value = String(value);
        wallpaperOverlaySlider.style.setProperty('--x-nt-overlay-slider-percent', `${value}%`);
        wallpaperOverlaySlider.setAttribute('aria-valuenow', String(value));
        wallpaperOverlaySlider.setAttribute('aria-valuetext', `${value}%`);
      }
      if (wallpaperOverlayValue) {
        wallpaperOverlayValue.textContent = String(value);
      }
      if (wallpaperOverlayLabel) {
        wallpaperOverlayLabel.textContent = t('newtab_wallpaper_overlay_opacity', 'Mask effect');
      }
      if (wallpaperOverlaySlider) {
        wallpaperOverlaySlider.setAttribute(
          'aria-label',
          t('newtab_wallpaper_overlay_opacity', 'Mask effect')
        );
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
        spacing
      };
    }

    function doesWallpaperEffectSupportSize(type) {
      return type === 'halftone' || type === 'ascii';
    }

    function doesWallpaperEffectSupportSpacing(type) {
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
      requestAnimationFrame(() => {
        requestAnimationFrame(updateWallpaperEffectTabsIndicator);
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
      requestAnimationFrame(() => {
        requestAnimationFrame(updateWallpaperTabsIndicator);
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

    function updateWallpaperEffectControlUi() {
      const prefs = normalizeWallpaperEffectPrefs(currentWallpaperEffectPrefs);
      const isEffectEnabled = prefs.type !== 'none';
      const supportsSize = doesWallpaperEffectSupportSize(prefs.type);
      const supportsSpacing = doesWallpaperEffectSupportSpacing(prefs.type);
      const strengthVisibleChanged = wallpaperEffectStrengthControl &&
        wallpaperEffectStrengthControl.getAttribute('data-visible') !== (isEffectEnabled ? 'true' : 'false');
      const sizeVisibleChanged = wallpaperEffectSizeControl &&
        wallpaperEffectSizeControl.getAttribute('data-visible') !== (supportsSize ? 'true' : 'false');
      const spacingVisibleChanged = wallpaperEffectSpacingControl &&
        wallpaperEffectSpacingControl.getAttribute('data-visible') !== (supportsSpacing ? 'true' : 'false');
      const updateSliderVisibility = () => {
        setWallpaperEffectSliderControlVisible(wallpaperEffectStrengthControl, isEffectEnabled);
        setWallpaperEffectSliderControlVisible(wallpaperEffectSizeControl, supportsSize);
        setWallpaperEffectSliderControlVisible(wallpaperEffectSpacingControl, supportsSpacing);
      };
      if (strengthVisibleChanged || sizeVisibleChanged || spacingVisibleChanged) {
        animateWallpaperPanelResize(updateSliderVisibility);
      } else {
        updateSliderVisibility();
      }
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
      if (wallpaperEffectSlider) {
        wallpaperEffectSlider.value = String(prefs.strength);
        wallpaperEffectSlider.style.setProperty('--x-nt-overlay-slider-percent', `${prefs.strength}%`);
        wallpaperEffectSlider.setAttribute('aria-valuenow', String(prefs.strength));
        wallpaperEffectSlider.setAttribute('aria-valuetext', `${prefs.strength}%`);
        wallpaperEffectSlider.disabled = !isEffectEnabled;
        if (wallpaperEffectSlider.parentElement) {
          wallpaperEffectSlider.parentElement.setAttribute('data-disabled', isEffectEnabled ? 'false' : 'true');
        }
        wallpaperEffectSlider.setAttribute(
          'aria-label',
          t('newtab_wallpaper_effect_strength', 'Sampling strength')
        );
      }
      if (wallpaperEffectSizeSlider) {
        wallpaperEffectSizeSlider.value = String(prefs.size);
        wallpaperEffectSizeSlider.style.setProperty('--x-nt-overlay-slider-percent', `${prefs.size}%`);
        wallpaperEffectSizeSlider.setAttribute('aria-valuenow', String(prefs.size));
        wallpaperEffectSizeSlider.setAttribute('aria-valuetext', `${prefs.size}%`);
        wallpaperEffectSizeSlider.disabled = !supportsSize;
        if (wallpaperEffectSizeSlider.parentElement) {
          wallpaperEffectSizeSlider.parentElement.setAttribute('data-disabled', supportsSize ? 'false' : 'true');
        }
        wallpaperEffectSizeSlider.setAttribute(
          'aria-label',
          t('newtab_wallpaper_effect_size', 'Size')
        );
      }
      if (wallpaperEffectSpacingSlider) {
        wallpaperEffectSpacingSlider.value = String(prefs.spacing);
        wallpaperEffectSpacingSlider.style.setProperty('--x-nt-overlay-slider-percent', `${prefs.spacing}%`);
        wallpaperEffectSpacingSlider.setAttribute('aria-valuenow', String(prefs.spacing));
        wallpaperEffectSpacingSlider.setAttribute('aria-valuetext', `${prefs.spacing}%`);
        wallpaperEffectSpacingSlider.disabled = !supportsSpacing;
        if (wallpaperEffectSpacingSlider.parentElement) {
          wallpaperEffectSpacingSlider.parentElement.setAttribute('data-disabled', supportsSpacing ? 'false' : 'true');
        }
        wallpaperEffectSpacingSlider.setAttribute(
          'aria-label',
          t('newtab_wallpaper_effect_spacing', 'Spacing')
        );
      }
      if (wallpaperEffectLabel) {
        wallpaperEffectLabel.textContent = t('newtab_wallpaper_effect_title', 'Wallpaper filter');
      }
      if (wallpaperEffectValue) {
        wallpaperEffectValue.textContent = getWallpaperEffectLabel(prefs.type);
      }
      if (wallpaperEffectStrengthLabel) {
        wallpaperEffectStrengthLabel.textContent = t('newtab_wallpaper_effect_strength', 'Sampling strength');
      }
      if (wallpaperEffectStrengthValue) {
        wallpaperEffectStrengthValue.textContent = `${prefs.strength}%`;
      }
      if (wallpaperEffectSizeLabel) {
        wallpaperEffectSizeLabel.textContent = t('newtab_wallpaper_effect_size', 'Size');
      }
      if (wallpaperEffectSizeValue) {
        wallpaperEffectSizeValue.textContent = `${prefs.size}%`;
      }
      if (wallpaperEffectSpacingLabel) {
        wallpaperEffectSpacingLabel.textContent = t('newtab_wallpaper_effect_spacing', 'Spacing');
      }
      if (wallpaperEffectSpacingValue) {
        wallpaperEffectSpacingValue.textContent = `${prefs.spacing}%`;
      }
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
          t('settings_newtab_wordmark_title', 'Show logo above the New Tab search bar')
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
    }

    function updateCustomWallpaperUploadTile() {
      if (!customWallpaperUploadTile) {
        return;
      }
      customWallpaperUploadTile.setAttribute('data-loading', customWallpaperImporting ? 'true' : 'false');
      customWallpaperUploadTile.setAttribute('aria-label', t('newtab_wallpaper_add_local', 'Add local wallpaper'));
      updateWallpaperSelectionUi();
    }

    function createCustomWallpaperTile(item) {
      const tile = document.createElement('div');
      tile.className = 'x-nt-wallpaper-tile x-nt-wallpaper-custom-tile';
      tile.setAttribute('role', 'button');
      tile.setAttribute('tabindex', '0');
      tile.setAttribute('data-wallpaper-id', item.id);
      tile.setAttribute('data-custom-wallpaper', 'true');
      tile.setAttribute('data-selected', 'false');
      tile.setAttribute('aria-pressed', 'false');
      const thumb = document.createElement('span');
      thumb.className = 'x-nt-wallpaper-thumb';
      const image = document.createElement('img');
      image.className = 'x-nt-wallpaper-custom-image';
      image.src = getWallpaperThumbnailUrl(item);
      image.alt = '';
      image.draggable = false;
      thumb.appendChild(image);
      const check = document.createElement('span');
      check.className = 'x-nt-wallpaper-check';
      check.innerHTML = getRiSvg('ri-check-line', 'ri-size-16');
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'x-nt-wallpaper-delete-button';
      deleteButton.setAttribute('aria-label', t('newtab_wallpaper_delete_local', 'Delete imported wallpaper'));
      deleteButton.innerHTML = getRiSvg('ri-subtract-line', 'ri-size-14');
      deleteButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        deleteCustomWallpaper(item.id);
      });
      tile.appendChild(thumb);
      tile.appendChild(check);
      tile.appendChild(deleteButton);
      tile.addEventListener('click', (event) => {
        if (event.target && event.target.closest && event.target.closest('.x-nt-wallpaper-delete-button')) {
          return;
        }
        persistNewtabWallpaper(item.id);
      });
      tile.addEventListener('keydown', (event) => {
        if (!event || (event.key !== 'Enter' && event.key !== ' ')) {
          return;
        }
        if (event.target && event.target.closest && event.target.closest('.x-nt-wallpaper-delete-button')) {
          return;
        }
        event.preventDefault();
        persistNewtabWallpaper(item.id);
      });
      return tile;
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
      currentWallpaperId = wallpaper ? wallpaper.id : '';
      if (currentWallpaperId) {
        lastActiveWallpaperId = currentWallpaperId;
        setWallpaperActiveTab(isCustomWallpaperId(currentWallpaperId) ? 'local' : 'built-in');
      }
      const target = document.documentElement;
      if (target) {
        const imageUrl = wallpaper ? getWallpaperImageUrl(wallpaper) : '';
        target.style.setProperty('--x-nt-wallpaper-image', imageUrl ? getCssUrlValue(imageUrl) : 'none');
        target.style.setProperty('--x-nt-wallpaper-size', 'cover');
        target.style.setProperty('--x-nt-wallpaper-position', 'center center');
        target.setAttribute('data-wallpaper-active', wallpaper ? 'true' : 'false');
      }
      if (document.body) {
        document.body.setAttribute('data-wallpaper-active', wallpaper ? 'true' : 'false');
      }
      writeWallpaperPreloadCache(wallpaper);
      refreshWallpaperAdaptiveSampler();
      refreshWallpaperEffects();
      updateWallpaperSelectionUi();
      finalizeInitialWallpaper();
    }

    function bootstrapInitialWallpaper() {
      if (hasWallpaperBootstrapStarted) {
        return initialWallpaperReadyPromise;
      }
      hasWallpaperBootstrapStarted = true;
      const customWallpapersPromise = loadCustomWallpapers();
      if (!storageArea) {
        customWallpapersPromise.then(() => {
          applyNewtabWallpaper(NEWTAB_WALLPAPER_DEFAULT_ID);
        });
        return initialWallpaperReadyPromise;
      }
      storageArea.get([NEWTAB_WALLPAPER_STORAGE_KEY], (result) => {
        const hasStoredWallpaper = Boolean(result &&
          Object.prototype.hasOwnProperty.call(result, NEWTAB_WALLPAPER_STORAGE_KEY));
        const raw = hasStoredWallpaper
          ? result[NEWTAB_WALLPAPER_STORAGE_KEY]
          : NEWTAB_WALLPAPER_DEFAULT_ID;
        const applyStoredWallpaper = () => {
          const nextId = normalizeNewtabWallpaperId(raw);
          applyNewtabWallpaper(nextId);
          if (!hasStoredWallpaper || (raw && raw !== nextId)) {
            storageArea.set({ [NEWTAB_WALLPAPER_STORAGE_KEY]: nextId });
          }
        };
        if (shouldWaitForCustomWallpapers(raw)) {
          customWallpapersPromise.then(applyStoredWallpaper);
          return;
        }
        applyStoredWallpaper();
      });
      return initialWallpaperReadyPromise;
    }

    function persistNewtabWallpaper(id) {
      const nextId = normalizeNewtabWallpaperId(id);
      applyNewtabWallpaper(nextId);
      if (!storageArea) {
        return;
      }
      storageArea.set({ [NEWTAB_WALLPAPER_STORAGE_KEY]: nextId }, () => {
        if (chrome.runtime && chrome.runtime.lastError) {
          showToast(t('newtab_wallpaper_save_error', 'Failed to save wallpaper'), true);
        }
      });
    }

    function showCustomWallpaperTooltip(target) {
      showTopActionTooltip(target, t('newtab_wallpaper_add_local', 'Add local wallpaper'));
    }

    function openCustomWallpaperPicker() {
      if (customWallpaperInput && !customWallpaperImporting) {
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
        renderCustomWallpaperTiles();
        persistNewtabWallpaper(nextWallpaper.id);
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

    function updateWallpaperLanguageStrings() {
      if (wallpaperButton) {
        const label = t('settings_tab_appearance', 'Appearance');
        wallpaperButton.setAttribute('aria-label', label);
        wallpaperButton.removeAttribute('title');
      }
      if (wallpaperFeatureHintController &&
          typeof wallpaperFeatureHintController.updateLanguage === 'function') {
        wallpaperFeatureHintController.updateLanguage();
      }
      if (wallpaperAppearanceTitle) {
        wallpaperAppearanceTitle.textContent = t('settings_tab_appearance', 'Appearance');
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
      updateWallpaperOverlayControlUi();
      updateWallpaperEffectControlUi();
      updateCustomWallpaperUploadTile();
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
        logoPanelTitle.textContent = t('newtab_logo_title', 'Logo');
      }
      updateLogoSwitchUi();
      updateWallpaperAppearanceModeLabels();
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

    function renderWallpaperPanel() {
      if (!wallpaperPanel || wallpaperPanelRendered) {
        return;
      }
      wallpaperPanelRendered = true;
      const appearanceSection = document.createElement('div');
      appearanceSection.className = 'x-nt-appearance-section';
      const appearanceHeader = document.createElement('div');
      appearanceHeader.className = 'x-nt-appearance-header';
      const appearanceTitleGroup = document.createElement('div');
      appearanceTitleGroup.className = 'x-nt-appearance-title-group';
      wallpaperAppearanceTitle = document.createElement('div');
      wallpaperAppearanceTitle.className = 'x-nt-wallpaper-panel-title';
      wallpaperAppearanceInfoButton = document.createElement('button');
      wallpaperAppearanceInfoButton.type = 'button';
      wallpaperAppearanceInfoButton.className = 'x-nt-appearance-info-button';
      wallpaperAppearanceInfoButton.innerHTML = getRiSvg('ri-question-line', 'ri-size-14');
      wallpaperAppearanceInfoButton.addEventListener('mouseenter', () => {
        showTopActionTooltip(
          wallpaperAppearanceInfoButton,
          t(
            'newtab_theme_scope_help',
            '"Global" affects the global theme mode. "New Tab" affects only the new tab page.'
          )
        );
      });
      wallpaperAppearanceInfoButton.addEventListener('mouseleave', hideTopActionTooltip);
      wallpaperAppearanceInfoButton.addEventListener('focus', () => {
        showTopActionTooltip(
          wallpaperAppearanceInfoButton,
          t(
            'newtab_theme_scope_help',
            '"Global" affects the global theme mode. "New Tab" affects only the new tab page.'
          )
        );
      });
      wallpaperAppearanceInfoButton.addEventListener('blur', hideTopActionTooltip);
      wallpaperAppearanceScopeTabs = document.createElement('div');
      wallpaperAppearanceScopeTabs.className = 'x-nt-appearance-scope-tabs';
      wallpaperAppearanceScopeTabs.setAttribute('role', 'group');
      [
        { scope: 'global', fallback: 'Global' },
        { scope: 'home', fallback: 'New Tab' }
      ].forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'x-nt-appearance-scope-tab';
        button.setAttribute('data-theme-scope', item.scope);
        button.setAttribute('data-selected', 'false');
        button.setAttribute('aria-pressed', 'false');
        button.textContent = item.fallback;
        button.addEventListener('click', () => {
          animateWallpaperAppearanceScopeChange(getThemeScope(), item.scope);
        });
        wallpaperAppearanceScopeTabs.appendChild(button);
      });
      wallpaperAppearanceOptions = document.createElement('div');
      wallpaperAppearanceOptions.className = 'x-nt-appearance-options';
      [
        { mode: 'system', image: 'assets/images/system.svg' },
        { mode: 'light', image: 'assets/images/light.svg' },
        { mode: 'dark', image: 'assets/images/dark.svg' }
      ].forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'x-nt-appearance-option';
        button.setAttribute('data-theme-mode', item.mode);
        button.setAttribute('data-selected', 'false');
        button.setAttribute('aria-pressed', 'false');
        const preview = document.createElement('span');
        preview.className = 'x-nt-appearance-preview';
        const image = document.createElement('img');
        image.src = getRuntimeAssetUrl(item.image);
        image.alt = '';
        image.draggable = false;
        preview.appendChild(image);
        const check = document.createElement('span');
        check.className = 'x-nt-appearance-check';
        check.innerHTML = getRiSvg('ri-check-line', 'ri-size-16');
        const label = document.createElement('span');
        label.className = 'x-nt-appearance-label';
        const content = document.createElement('span');
        content.className = 'x-nt-appearance-option-content';
        preview.appendChild(check);
        content.appendChild(preview);
        content.appendChild(label);
        button.appendChild(content);
        button.addEventListener('click', () => {
          setThemeMode(item.mode);
        });
        wallpaperAppearanceOptions.appendChild(button);
      });
      appearanceTitleGroup.appendChild(wallpaperAppearanceTitle);
      appearanceTitleGroup.appendChild(wallpaperAppearanceInfoButton);
      appearanceHeader.appendChild(appearanceTitleGroup);
      appearanceHeader.appendChild(wallpaperAppearanceScopeTabs);
      appearanceSection.appendChild(appearanceHeader);
      appearanceSection.appendChild(wallpaperAppearanceOptions);
      const overlayControl = document.createElement('div');
      overlayControl.className = 'x-nt-overlay-control x-nt-overlay-control--effect';
      const overlayHeader = document.createElement('div');
      overlayHeader.className = 'x-nt-overlay-control-header';
      wallpaperOverlayLabel = document.createElement('span');
      wallpaperOverlayLabel.className = 'x-nt-overlay-label';
      wallpaperOverlayValue = document.createElement('span');
      wallpaperOverlayValue.className = 'x-nt-overlay-value';
      wallpaperOverlaySlider = document.createElement('input');
      wallpaperOverlaySlider.className = 'x-nt-overlay-slider';
      wallpaperOverlaySlider.type = 'range';
      wallpaperOverlaySlider.min = '0';
      wallpaperOverlaySlider.max = '100';
      wallpaperOverlaySlider.step = '1';
      wallpaperOverlaySlider.setAttribute(
        'aria-label',
        t('newtab_wallpaper_overlay_opacity', 'Mask effect')
      );
      wallpaperOverlaySlider.addEventListener('pointerdown', () => {
        wallpaperOverlayPointerActive = true;
      });
      wallpaperOverlaySlider.addEventListener('pointerup', () => {
        wallpaperOverlayPointerActive = false;
      });
      wallpaperOverlaySlider.addEventListener('pointercancel', () => {
        wallpaperOverlayPointerActive = false;
      });
      wallpaperOverlaySlider.addEventListener('blur', () => {
        wallpaperOverlayPointerActive = false;
      });
      wallpaperOverlaySlider.addEventListener('input', () => {
        const value = wallpaperOverlayPointerActive
          ? snapWallpaperOverlaySliderValue(wallpaperOverlaySlider.value)
          : normalizeWallpaperOverlayOpacity(wallpaperOverlaySlider.value, getWallpaperOverlayOpacityForCurrentMode());
        if (String(value) !== wallpaperOverlaySlider.value) {
          wallpaperOverlaySlider.value = String(value);
        }
        persistWallpaperOverlayOpacity(getResolvedWallpaperOverlayMode(), value);
      });
      overlayHeader.appendChild(wallpaperOverlayLabel);
      overlayHeader.appendChild(wallpaperOverlayValue);
      overlayControl.appendChild(overlayHeader);
      const overlaySliderWrap = document.createElement('div');
      overlaySliderWrap.className = 'x-nt-overlay-slider-wrap';
      overlaySliderWrap.appendChild(wallpaperOverlaySlider);
      const overlayScale = document.createElement('div');
      overlayScale.className = 'x-nt-overlay-scale';
      [
        { align: 'start', text: t('newtab_wallpaper_overlay_transparent_tick', 'Transparent'), key: 'transparent' },
        { align: 'center', text: t('newtab_wallpaper_overlay_default_tick', 'Default'), key: 'default' },
        { align: 'end', text: t('newtab_wallpaper_overlay_cover_tick', 'Cover'), key: 'cover' }
      ].forEach((item) => {
        const tick = document.createElement('span');
        tick.className = 'x-nt-overlay-tick';
        tick.setAttribute('data-align', item.align);
        if (item.key) {
          tick.setAttribute('data-overlay-tick', item.key);
        }
        tick.textContent = item.text;
        overlayScale.appendChild(tick);
      });
      overlaySliderWrap.appendChild(overlayScale);
      overlayControl.appendChild(overlaySliderWrap);
      const effectControl = document.createElement('div');
      effectControl.className = 'x-nt-effect-control';
      const effectHeader = document.createElement('div');
      effectHeader.className = 'x-nt-overlay-control-header x-nt-effect-control-header';
      wallpaperEffectLabel = document.createElement('span');
      wallpaperEffectLabel.className = 'x-nt-effect-label';
      wallpaperEffectValue = document.createElement('span');
      wallpaperEffectValue.className = 'x-nt-overlay-value x-nt-effect-value';
      effectHeader.appendChild(wallpaperEffectLabel);
      effectHeader.appendChild(wallpaperEffectValue);
      effectControl.appendChild(overlayControl);
      effectControl.appendChild(effectHeader);
      wallpaperEffectOptions = document.createElement('div');
      wallpaperEffectOptions.className = 'x-nt-effect-options';
      wallpaperEffectOptions.setAttribute('role', 'tablist');
      wallpaperEffectOptions.setAttribute('aria-label', t('newtab_wallpaper_effect_title', 'Wallpaper filter'));
      wallpaperEffectTabsIndicator = document.createElement('span');
      wallpaperEffectTabsIndicator.className = 'x-nt-effect-indicator';
      wallpaperEffectTabsIndicator.setAttribute('aria-hidden', 'true');
      wallpaperEffectOptions.appendChild(wallpaperEffectTabsIndicator);
      NEWTAB_WALLPAPER_EFFECT_TYPES.forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'x-nt-effect-option';
        button.setAttribute('data-wallpaper-effect-type', item.type);
        button.setAttribute('data-selected', 'false');
        button.setAttribute('data-active', 'false');
        button.setAttribute('aria-pressed', 'false');
        button.textContent = item.fallback;
        button.addEventListener('click', () => {
          persistWallpaperEffectPrefs({ type: item.type });
        });
        wallpaperEffectOptions.appendChild(button);
      });
      effectControl.appendChild(wallpaperEffectOptions);
      wallpaperEffectStrengthControl = document.createElement('div');
      wallpaperEffectStrengthControl.className = 'x-nt-effect-slider-control';
      wallpaperEffectStrengthControl.setAttribute('data-visible', 'true');
      const effectStrengthHeader = document.createElement('div');
      effectStrengthHeader.className = 'x-nt-overlay-control-header';
      wallpaperEffectStrengthLabel = document.createElement('span');
      wallpaperEffectStrengthLabel.className = 'x-nt-effect-slider-label';
      wallpaperEffectStrengthValue = document.createElement('span');
      wallpaperEffectStrengthValue.className = 'x-nt-overlay-value x-nt-effect-slider-value';
      effectStrengthHeader.appendChild(wallpaperEffectStrengthLabel);
      effectStrengthHeader.appendChild(wallpaperEffectStrengthValue);
      wallpaperEffectStrengthControl.appendChild(effectStrengthHeader);
      const effectSliderWrap = document.createElement('div');
      effectSliderWrap.className = 'x-nt-overlay-slider-wrap x-nt-effect-slider-wrap';
      wallpaperEffectSlider = document.createElement('input');
      wallpaperEffectSlider.className = 'x-nt-overlay-slider x-nt-effect-slider';
      wallpaperEffectSlider.type = 'range';
      wallpaperEffectSlider.min = '0';
      wallpaperEffectSlider.max = '100';
      wallpaperEffectSlider.step = '1';
      wallpaperEffectSlider.setAttribute(
        'aria-label',
        t('newtab_wallpaper_effect_strength', 'Sampling strength')
      );
      wallpaperEffectSlider.addEventListener('pointerdown', () => {
        wallpaperEffectPointerActive = true;
      });
      wallpaperEffectSlider.addEventListener('pointerup', () => {
        wallpaperEffectPointerActive = false;
      });
      wallpaperEffectSlider.addEventListener('pointercancel', () => {
        wallpaperEffectPointerActive = false;
      });
      wallpaperEffectSlider.addEventListener('blur', () => {
        wallpaperEffectPointerActive = false;
      });
      wallpaperEffectSlider.addEventListener('input', () => {
        const value = wallpaperEffectPointerActive
          ? snapWallpaperOverlaySliderValue(wallpaperEffectSlider.value)
          : normalizeWallpaperOverlayOpacity(wallpaperEffectSlider.value, currentWallpaperEffectPrefs.strength);
        if (String(value) !== wallpaperEffectSlider.value) {
          wallpaperEffectSlider.value = String(value);
        }
        persistWallpaperEffectPrefs({ strength: value });
      });
      effectSliderWrap.appendChild(wallpaperEffectSlider);
      const createEffectScale = () => {
        const scale = document.createElement('div');
        scale.className = 'x-nt-overlay-scale';
        [
          { align: 'start', text: '0' },
          { align: 'center', text: t('newtab_wallpaper_overlay_default_tick', 'Default'), key: 'default' },
          { align: 'end', text: '100%' }
        ].forEach((item) => {
          const tick = document.createElement('span');
          tick.className = 'x-nt-overlay-tick';
          tick.setAttribute('data-align', item.align);
          if (item.key) {
            tick.setAttribute('data-overlay-tick', item.key);
          }
          tick.textContent = item.text;
          scale.appendChild(tick);
        });
        return scale;
      };
      const effectScale = createEffectScale();
      effectSliderWrap.appendChild(effectScale);
      wallpaperEffectStrengthControl.appendChild(effectSliderWrap);
      effectControl.appendChild(wallpaperEffectStrengthControl);
      wallpaperEffectSizeControl = document.createElement('div');
      wallpaperEffectSizeControl.className = 'x-nt-effect-slider-control';
      wallpaperEffectSizeControl.setAttribute('data-visible', 'true');
      const effectSizeHeader = document.createElement('div');
      effectSizeHeader.className = 'x-nt-overlay-control-header';
      wallpaperEffectSizeLabel = document.createElement('span');
      wallpaperEffectSizeLabel.className = 'x-nt-effect-slider-label';
      wallpaperEffectSizeValue = document.createElement('span');
      wallpaperEffectSizeValue.className = 'x-nt-overlay-value x-nt-effect-slider-value';
      effectSizeHeader.appendChild(wallpaperEffectSizeLabel);
      effectSizeHeader.appendChild(wallpaperEffectSizeValue);
      wallpaperEffectSizeControl.appendChild(effectSizeHeader);
      const effectSizeSliderWrap = document.createElement('div');
      effectSizeSliderWrap.className = 'x-nt-overlay-slider-wrap x-nt-effect-slider-wrap';
      wallpaperEffectSizeSlider = document.createElement('input');
      wallpaperEffectSizeSlider.className = 'x-nt-overlay-slider x-nt-effect-slider';
      wallpaperEffectSizeSlider.type = 'range';
      wallpaperEffectSizeSlider.min = '0';
      wallpaperEffectSizeSlider.max = '100';
      wallpaperEffectSizeSlider.step = '1';
      wallpaperEffectSizeSlider.setAttribute(
        'aria-label',
        t('newtab_wallpaper_effect_size', 'Size')
      );
      wallpaperEffectSizeSlider.addEventListener('pointerdown', () => {
        wallpaperEffectSizePointerActive = true;
      });
      wallpaperEffectSizeSlider.addEventListener('pointerup', () => {
        wallpaperEffectSizePointerActive = false;
      });
      wallpaperEffectSizeSlider.addEventListener('pointercancel', () => {
        wallpaperEffectSizePointerActive = false;
      });
      wallpaperEffectSizeSlider.addEventListener('blur', () => {
        wallpaperEffectSizePointerActive = false;
      });
      wallpaperEffectSizeSlider.addEventListener('input', () => {
        const value = wallpaperEffectSizePointerActive
          ? snapWallpaperOverlaySliderValue(wallpaperEffectSizeSlider.value)
          : normalizeWallpaperOverlayOpacity(wallpaperEffectSizeSlider.value, currentWallpaperEffectPrefs.size);
        if (String(value) !== wallpaperEffectSizeSlider.value) {
          wallpaperEffectSizeSlider.value = String(value);
        }
        persistWallpaperEffectPrefs({ size: value });
      });
      effectSizeSliderWrap.appendChild(wallpaperEffectSizeSlider);
      effectSizeSliderWrap.appendChild(createEffectScale());
      wallpaperEffectSizeControl.appendChild(effectSizeSliderWrap);
      effectControl.appendChild(wallpaperEffectSizeControl);
      wallpaperEffectSpacingControl = document.createElement('div');
      wallpaperEffectSpacingControl.className = 'x-nt-effect-slider-control';
      wallpaperEffectSpacingControl.setAttribute('data-visible', 'true');
      const effectSpacingHeader = document.createElement('div');
      effectSpacingHeader.className = 'x-nt-overlay-control-header';
      wallpaperEffectSpacingLabel = document.createElement('span');
      wallpaperEffectSpacingLabel.className = 'x-nt-effect-slider-label';
      wallpaperEffectSpacingValue = document.createElement('span');
      wallpaperEffectSpacingValue.className = 'x-nt-overlay-value x-nt-effect-slider-value';
      effectSpacingHeader.appendChild(wallpaperEffectSpacingLabel);
      effectSpacingHeader.appendChild(wallpaperEffectSpacingValue);
      wallpaperEffectSpacingControl.appendChild(effectSpacingHeader);
      const effectSpacingSliderWrap = document.createElement('div');
      effectSpacingSliderWrap.className = 'x-nt-overlay-slider-wrap x-nt-effect-slider-wrap';
      wallpaperEffectSpacingSlider = document.createElement('input');
      wallpaperEffectSpacingSlider.className = 'x-nt-overlay-slider x-nt-effect-slider';
      wallpaperEffectSpacingSlider.type = 'range';
      wallpaperEffectSpacingSlider.min = '0';
      wallpaperEffectSpacingSlider.max = '100';
      wallpaperEffectSpacingSlider.step = '1';
      wallpaperEffectSpacingSlider.setAttribute(
        'aria-label',
        t('newtab_wallpaper_effect_spacing', 'Spacing')
      );
      wallpaperEffectSpacingSlider.addEventListener('pointerdown', () => {
        wallpaperEffectSpacingPointerActive = true;
      });
      wallpaperEffectSpacingSlider.addEventListener('pointerup', () => {
        wallpaperEffectSpacingPointerActive = false;
      });
      wallpaperEffectSpacingSlider.addEventListener('pointercancel', () => {
        wallpaperEffectSpacingPointerActive = false;
      });
      wallpaperEffectSpacingSlider.addEventListener('blur', () => {
        wallpaperEffectSpacingPointerActive = false;
      });
      wallpaperEffectSpacingSlider.addEventListener('input', () => {
        const value = wallpaperEffectSpacingPointerActive
          ? snapWallpaperOverlaySliderValue(wallpaperEffectSpacingSlider.value)
          : normalizeWallpaperOverlayOpacity(wallpaperEffectSpacingSlider.value, currentWallpaperEffectPrefs.spacing);
        if (String(value) !== wallpaperEffectSpacingSlider.value) {
          wallpaperEffectSpacingSlider.value = String(value);
        }
        persistWallpaperEffectPrefs({ spacing: value });
      });
      effectSpacingSliderWrap.appendChild(wallpaperEffectSpacingSlider);
      effectSpacingSliderWrap.appendChild(createEffectScale());
      wallpaperEffectSpacingControl.appendChild(effectSpacingSliderWrap);
      effectControl.appendChild(wallpaperEffectSpacingControl);
      const divider = document.createElement('div');
      divider.className = 'x-nt-panel-divider';
      const wallpaperSection = document.createElement('div');
      wallpaperSection.className = 'x-nt-wallpaper-section';
      wallpaperPanelHeader = document.createElement('div');
      wallpaperPanelHeader.className = 'x-nt-wallpaper-panel-header';
      wallpaperPanelTitle = document.createElement('div');
      wallpaperPanelTitle.className = 'x-nt-wallpaper-panel-title';
      const wallpaperSwitchLabel = document.createElement('label');
      wallpaperSwitchLabel.className = 'x-nt-wallpaper-switch';
      wallpaperEnabledToggle = document.createElement('input');
      wallpaperEnabledToggle.type = 'checkbox';
      wallpaperEnabledToggle.setAttribute('role', 'switch');
      wallpaperEnabledToggle.addEventListener('change', () => {
        if (wallpaperEnabledToggle.checked) {
          persistNewtabWallpaper(getWallpaperRestoreId());
          return;
        }
        persistNewtabWallpaper('');
      });
      const wallpaperSwitchSlider = document.createElement('span');
      wallpaperSwitchSlider.className = 'x-nt-wallpaper-switch-slider';
      wallpaperSwitchSlider.setAttribute('aria-hidden', 'true');
      wallpaperSwitchLabel.appendChild(wallpaperEnabledToggle);
      wallpaperSwitchLabel.appendChild(wallpaperSwitchSlider);
      wallpaperPanelHeader.appendChild(wallpaperPanelTitle);
      wallpaperPanelHeader.appendChild(wallpaperSwitchLabel);
      wallpaperBody = document.createElement('div');
      wallpaperBody.className = 'x-nt-wallpaper-body';
      wallpaperBody.setAttribute('data-visible', 'true');
      wallpaperBody.setAttribute('data-active-tab', activeWallpaperTab);
      wallpaperTabs = document.createElement('div');
      wallpaperTabs.className = 'x-nt-wallpaper-tabs';
      wallpaperTabs.setAttribute('role', 'tablist');
      wallpaperTabsIndicator = document.createElement('span');
      wallpaperTabsIndicator.className = 'x-nt-wallpaper-tabs-indicator';
      wallpaperTabsIndicator.setAttribute('aria-hidden', 'true');
      wallpaperTabs.appendChild(wallpaperTabsIndicator);
      [
        { tab: 'built-in', fallback: 'Built-in' },
        { tab: 'local', fallback: 'Local' }
      ].forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'x-nt-wallpaper-tab';
        button.setAttribute('role', 'tab');
        button.setAttribute('data-wallpaper-tab', item.tab);
        button.setAttribute('data-active', 'false');
        button.setAttribute('aria-selected', 'false');
        button.textContent = item.fallback;
        button.addEventListener('click', () => {
          setWallpaperActiveTab(item.tab);
        });
        if (item.tab === 'built-in') {
          wallpaperBuiltInTab = button;
        } else {
          wallpaperLocalTab = button;
        }
        wallpaperTabs.appendChild(button);
      });
      wallpaperBuiltInGrid = document.createElement('div');
      wallpaperBuiltInGrid.className = 'x-nt-wallpaper-grid x-nt-wallpaper-grid--built-in';
      wallpaperBuiltInGrid.setAttribute('role', 'tabpanel');
      wallpaperBuiltInGrid.setAttribute('data-wallpaper-panel', 'built-in');
      wallpaperLocalGrid = document.createElement('div');
      wallpaperLocalGrid.className = 'x-nt-wallpaper-grid x-nt-wallpaper-grid--local';
      wallpaperLocalGrid.setAttribute('role', 'tabpanel');
      wallpaperLocalGrid.setAttribute('data-wallpaper-panel', 'local');
      customWallpaperInput = document.createElement('input');
      customWallpaperInput.className = 'x-nt-wallpaper-file-input';
      customWallpaperInput.type = 'file';
      customWallpaperInput.accept = 'image/*';
      customWallpaperInput.tabIndex = -1;
      customWallpaperInput.addEventListener('change', (event) => {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        importCustomWallpaperFile(file);
      });
      customWallpaperUploadTile = document.createElement('div');
      customWallpaperUploadTile.className = 'x-nt-wallpaper-tile x-nt-wallpaper-upload-tile';
      customWallpaperUploadTile.setAttribute('role', 'button');
      customWallpaperUploadTile.setAttribute('tabindex', '0');
      customWallpaperUploadTile.setAttribute('data-upload', 'true');
      customWallpaperUploadTile.setAttribute('data-loading', 'false');
      customWallpaperUploadTile.setAttribute('data-selected', 'false');
      customWallpaperUploadTile.setAttribute('aria-pressed', 'false');
      const customThumb = document.createElement('span');
      customThumb.className = 'x-nt-wallpaper-thumb x-nt-wallpaper-upload-thumb';
      const customPlaceholder = document.createElement('span');
      customPlaceholder.className = 'x-nt-wallpaper-upload-placeholder';
      customPlaceholder.innerHTML = getRiSvg('ri-add-large-line', 'ri-size-18');
      customThumb.appendChild(customPlaceholder);
      customWallpaperUploadTile.appendChild(customThumb);
      customWallpaperUploadTile.addEventListener('click', () => {
        openCustomWallpaperPicker();
      });
      customWallpaperUploadTile.addEventListener('keydown', (event) => {
        if (!event || (event.key !== 'Enter' && event.key !== ' ')) {
          return;
        }
        event.preventDefault();
        openCustomWallpaperPicker();
      });
      customWallpaperUploadTile.addEventListener('mouseenter', () => {
        showCustomWallpaperTooltip(customWallpaperUploadTile);
      });
      customWallpaperUploadTile.addEventListener('mouseleave', hideTopActionTooltip);
      customWallpaperUploadTile.addEventListener('focusin', () => {
        showCustomWallpaperTooltip(customWallpaperUploadTile);
      });
      customWallpaperUploadTile.addEventListener('focusout', (event) => {
        const nextTarget = event && event.relatedTarget ? event.relatedTarget : null;
        if (!nextTarget || !customWallpaperUploadTile.contains(nextTarget)) {
          hideTopActionTooltip();
        }
      });
      wallpaperLocalGrid.appendChild(customWallpaperUploadTile);
      renderCustomWallpaperTiles();
      NEWTAB_WALLPAPER_OPTIONS.forEach((item) => {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'x-nt-wallpaper-tile';
        tile.setAttribute('data-wallpaper-id', item.id);
        tile.setAttribute('data-wallpaper-path', getWallpaperLocalPath(item));
        tile.setAttribute('data-selected', 'false');
        tile.setAttribute('aria-pressed', 'false');
        const thumb = document.createElement('span');
        thumb.className = 'x-nt-wallpaper-thumb';
        const image = document.createElement('img');
        image.src = getWallpaperThumbnailUrl(item);
        image.alt = '';
        image.draggable = false;
        image.loading = 'lazy';
        image.decoding = 'async';
        thumb.appendChild(image);
        const check = document.createElement('span');
        check.className = 'x-nt-wallpaper-check';
        check.innerHTML = getRiSvg('ri-check-line', 'ri-size-16');
        tile.appendChild(thumb);
        tile.appendChild(check);
        tile.addEventListener('click', () => {
          persistNewtabWallpaper(item.id);
        });
        wallpaperBuiltInGrid.appendChild(tile);
      });
      wallpaperBody.appendChild(wallpaperTabs);
      wallpaperBody.appendChild(wallpaperBuiltInGrid);
      wallpaperBody.appendChild(wallpaperLocalGrid);
      wallpaperBody.appendChild(effectControl);
      wallpaperSection.appendChild(wallpaperPanelHeader);
      wallpaperSection.appendChild(customWallpaperInput);
      wallpaperSection.appendChild(wallpaperBody);
      const logoDivider = document.createElement('div');
      logoDivider.className = 'x-nt-panel-divider';
      const logoSection = document.createElement('div');
      logoSection.className = 'x-nt-wallpaper-section';
      const logoHeader = document.createElement('div');
      logoHeader.className = 'x-nt-wallpaper-panel-header';
      logoPanelTitle = document.createElement('div');
      logoPanelTitle.className = 'x-nt-wallpaper-panel-title';
      const logoSwitchLabel = document.createElement('label');
      logoSwitchLabel.className = 'x-nt-wallpaper-switch';
      logoEnabledToggle = document.createElement('input');
      logoEnabledToggle.type = 'checkbox';
      logoEnabledToggle.setAttribute('role', 'switch');
      logoEnabledToggle.addEventListener('change', () => {
        persistWordmarkVisible(logoEnabledToggle.checked);
      });
      const logoSwitchSlider = document.createElement('span');
      logoSwitchSlider.className = 'x-nt-wallpaper-switch-slider';
      logoSwitchSlider.setAttribute('aria-hidden', 'true');
      logoSwitchLabel.appendChild(logoEnabledToggle);
      logoSwitchLabel.appendChild(logoSwitchSlider);
      logoHeader.appendChild(logoPanelTitle);
      logoHeader.appendChild(logoSwitchLabel);
      logoSection.appendChild(logoHeader);
      wallpaperPanel.appendChild(appearanceSection);
      wallpaperPanel.appendChild(divider);
      wallpaperPanel.appendChild(wallpaperSection);
      wallpaperPanel.appendChild(logoDivider);
      wallpaperPanel.appendChild(logoSection);
      updateWallpaperLanguageStrings();
      setWallpaperActiveTab(activeWallpaperTab);
      updateCustomWallpaperUploadTile();
      updateWallpaperSelectionUi();
      updateWallpaperAppearanceSelectionUi();
    }

    function openWallpaperPanel() {
      if (!wallpaperPanel || !wallpaperButton) {
        return;
      }
      dismissWallpaperFeatureHint();
      renderWallpaperPanel();
      wallpaperPanel.setAttribute('data-open', 'true');
      wallpaperButton.setAttribute('data-open', 'true');
      wallpaperButton.setAttribute('aria-expanded', 'true');
      if (wallpaperControl) {
        wallpaperControl.setAttribute('data-panel-open', 'true');
      }
      scheduleWallpaperPanelOpenTabIndicatorsRefresh();
    }

    function closeWallpaperPanel(options) {
      if (!wallpaperPanel || !wallpaperButton) {
        return;
      }
      wallpaperPanel.setAttribute('data-open', 'false');
      wallpaperButton.setAttribute('data-open', 'false');
      wallpaperButton.setAttribute('aria-expanded', 'false');
      if (wallpaperControl) {
        wallpaperControl.setAttribute('data-panel-open', 'false');
      }
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

    function dismissWallpaperFeatureHint() {
      if (wallpaperFeatureHintController &&
          typeof wallpaperFeatureHintController.dismiss === 'function') {
        wallpaperFeatureHintController.dismiss();
      }
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
      if (typeof FEATURE_HINTS.createFeatureHint === 'function') {
        wallpaperFeatureHintController = FEATURE_HINTS.createFeatureHint({
          documentObj,
          definition: 'newtab-wallpaper',
          t,
          getRiSvg
        });
        if (wallpaperFeatureHintController && wallpaperFeatureHintController.textId) {
          wallpaperButton.setAttribute('aria-describedby', wallpaperFeatureHintController.textId);
        }
      }
      wallpaperPanel = document.createElement('div');
      wallpaperPanel.className = 'x-nt-wallpaper-panel';
      wallpaperPanel.setAttribute('data-open', 'false');
      wallpaperPanel.setAttribute('role', 'dialog');
      wallpaperPanel.setAttribute('aria-modal', 'false');
      wallpaperButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        hideTopActionTooltip();
        toggleWallpaperPanel();
      });
      wallpaperButton.addEventListener('mouseenter', hideTopActionTooltip);
      wallpaperButton.addEventListener('mouseleave', hideTopActionTooltip);
      wallpaperButton.addEventListener('focus', hideTopActionTooltip);
      wallpaperButton.addEventListener('blur', hideTopActionTooltip);
      if (wallpaperFeatureHintController && wallpaperFeatureHintController.element) {
        wallpaperControl.appendChild(wallpaperFeatureHintController.element);
      }
      wallpaperControl.appendChild(wallpaperPanel);
      wallpaperControl.appendChild(wallpaperButton);
      window.addEventListener('resize', scheduleWallpaperPanelTabIndicatorsRefresh, { passive: true });
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
      if (changes[NEWTAB_WALLPAPER_STORAGE_KEY]) {
        const raw = changes[NEWTAB_WALLPAPER_STORAGE_KEY].newValue;
        const nextWallpaperId = normalizeNewtabWallpaperId(raw);
        if (storageArea && raw && raw !== nextWallpaperId) {
          storageArea.set({ [NEWTAB_WALLPAPER_STORAGE_KEY]: nextWallpaperId });
        }
        applyNewtabWallpaper(nextWallpaperId);
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
      updateWordmarkVisibilityUi: updateLogoSwitchUi,
      bootstrapInitialWallpaper,
      bootstrapInitialWallpaperOverlay,
      bootstrapInitialWallpaperEffect,
      handleStorageChange,
      scheduleAdaptiveToneUpdate: scheduleWallpaperAdaptiveToneUpdate
    };
  }

  globalThis.LumnoNewtabWallpaper = {
    STORAGE_KEYS: DEFAULT_STORAGE_KEYS,
    createWallpaperRuntime
  };
})();
