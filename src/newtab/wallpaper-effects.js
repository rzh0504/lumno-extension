(function(root) {
  'use strict';

  const EFFECT_TYPES = ['none', 'grain', 'halftone', 'ascii'];
  const DEFAULT_PREFS = {
    version: 3,
    type: 'none',
    strength: 50,
    size: 50,
    spacing: 50,
    hover: true
  };

  function getOption(options, key, fallback) {
    if (options && Object.prototype.hasOwnProperty.call(options, key)) {
      return options[key];
    }
    return fallback;
  }

  function getFunction(options, key, fallback) {
    const value = getOption(options, key, fallback || function() {});
    return typeof value === 'function' ? value : (fallback || function() {});
  }

  function clampNumber(value, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return min;
    }
    return Math.min(max, Math.max(min, number));
  }

  function normalizePrefs(value) {
    if (!value || typeof value !== 'object') {
      return Object.assign({}, DEFAULT_PREFS);
    }
    const type = EFFECT_TYPES.indexOf(value.type) === -1 ? DEFAULT_PREFS.type : value.type;
    const rawStrength = Number.isFinite(Number(value.strength))
      ? value.strength
      : DEFAULT_PREFS.strength;
    const rawSize = Number.isFinite(Number(value.size))
      ? value.size
      : (Number.isFinite(Number(value.density)) ? value.density : DEFAULT_PREFS.size);
    const rawSpacing = Number.isFinite(Number(value.spacing))
      ? value.spacing
      : DEFAULT_PREFS.spacing;
    return {
      version: DEFAULT_PREFS.version,
      type,
      strength: Math.round(clampNumber(rawStrength, 0, 100)),
      size: Math.round(clampNumber(rawSize, 0, 100)),
      spacing: Math.round(clampNumber(rawSpacing, 0, 100)),
      hover: value.hover === false ? false : DEFAULT_PREFS.hover
    };
  }

  function createWallpaperEffects(options) {
    const documentObj = getOption(options, 'documentObj', root.document);
    const windowObj = getOption(options, 'windowObj', root.window);
    const getCurrentWallpaper = getFunction(options, 'getCurrentWallpaper', function() {
      return null;
    });
    const getWallpaperImageUrl = getFunction(options, 'getWallpaperImageUrl', function() {
      return '';
    });
    const onRender = getFunction(options, 'onRender');
    const HOVER_FADE_DURATION_MS = 240;
    const EFFECT_CROSSFADE_MS = 150;
    const HOVER_SAFE_ZONE_PADDING_PX = 36;
    const HOVER_SAFE_ZONE_SELECTORS = [
      '#_x_extension_newtab_bookmarks_2024_unique_',
      '#_x_extension_newtab_recent_sites_2024_unique_',
      '#_x_extension_newtab_section_safe_corridor_2026_unique_'
    ];
    const HOVER_SAFE_ZONE_RECT_CACHE_MS = 80;
    const ASCII_CHARS = '  .,:;irsXA253hMHGS#9B&@';

    let canvas = null;
    let context = null;
    let prefs = Object.assign({}, DEFAULT_PREFS);
    let renderFrame = 0;
    let renderTimer = 0;
    let renderToken = 0;
    let loadedImage = null;
    let loadedImageUrl = '';
    let loadedSampler = null;
    let loadedSamplerUrl = '';
    let observer = null;
    let pointerBound = false;
    let hoverPointer = {
      active: false,
      x: 0,
      y: 0,
      intensity: 0,
      fadeStartedAt: 0,
      fadeFrom: 0
    };
    let hoverRenderIntensity = 0;
    let hoverSafeZoneElements = null;
    let hoverSafeZoneRectCache = null;
    let hoverSafeZoneRectCacheTime = 0;
    let backgroundLuminanceCache = null;
    let asciiGlyphMetricsCache = null;

    function requestFrame(callback) {
      if (windowObj && typeof windowObj.requestAnimationFrame === 'function') {
        return windowObj.requestAnimationFrame(callback);
      }
      return setTimeout(callback, 16);
    }

    function cancelFrame(id) {
      if (windowObj && typeof windowObj.cancelAnimationFrame === 'function') {
        windowObj.cancelAnimationFrame(id);
        return;
      }
      clearTimeout(id);
    }

    function shouldReduceMotion() {
      return Boolean(windowObj &&
        typeof windowObj.matchMedia === 'function' &&
        windowObj.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    function getViewportSize() {
      const docEl = documentObj.documentElement;
      return {
        width: Math.max(1, windowObj.innerWidth || (docEl ? docEl.clientWidth : 0) || 1),
        height: Math.max(1, windowObj.innerHeight || (docEl ? docEl.clientHeight : 0) || 1)
      };
    }

    function getDeviceScale() {
      return clampNumber(windowObj.devicePixelRatio || 1, 1, 1.5);
    }

    function getThemeMode() {
      return documentObj.body && documentObj.body.getAttribute('data-theme') === 'dark'
        ? 'dark'
        : 'light';
    }

    function getBackgroundColor() {
      const fallback = getThemeMode() === 'dark'
        ? { red: 17, green: 17, blue: 17 }
        : { red: 255, green: 255, blue: 255 };
      if (!windowObj || typeof windowObj.getComputedStyle !== 'function' || !documentObj.body) {
        return fallback;
      }
      const color = windowObj.getComputedStyle(documentObj.body).backgroundColor || '';
      const match = color.match(/rgba?\(([^)]+)\)/i);
      if (!match) {
        return fallback;
      }
      const channels = match[1].split(/[\s,\/]+/).filter(Boolean).slice(0, 3).map(Number);
      if (channels.length < 3 || channels.some((channel) => !Number.isFinite(channel))) {
        return fallback;
      }
      return {
        red: clampChannel(channels[0]),
        green: clampChannel(channels[1]),
        blue: clampChannel(channels[2])
      };
    }

    function getLuminanceFromRgb(red, green, blue) {
      return ((red * 0.299) + (green * 0.587) + (blue * 0.114)) / 255;
    }

    function isWallpaperActive() {
      return Boolean(documentObj.body &&
        documentObj.body.getAttribute('data-wallpaper-active') === 'true' &&
        getCurrentWallpaper());
    }

    function ensureCanvas() {
      if (canvas && context) {
        return canvas;
      }
      if (!documentObj || !documentObj.createElement || !documentObj.body) {
        return null;
      }
      canvas = documentObj.createElement('canvas');
      canvas.className = 'x-nt-wallpaper-effect-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      context = canvas.getContext('2d', { alpha: true });
      if (!context) {
        canvas = null;
        return null;
      }
      documentObj.body.insertBefore(canvas, documentObj.body.firstChild || null);
      bindObservers();
      bindPointer();
      return canvas;
    }

    function bindObservers() {
      if (observer || !root.MutationObserver || !documentObj.body) {
        return;
      }
      observer = new root.MutationObserver((mutations) => {
        const shouldRefresh = mutations.some((mutation) => {
          return mutation.type === 'attributes' &&
            (mutation.attributeName === 'data-theme' ||
              mutation.attributeName === 'data-wallpaper-active');
        });
        if (shouldRefresh) {
          clearHoverSafeZoneRectCache();
          clearBackgroundLuminanceCache();
          scheduleRender();
        }
      });
      observer.observe(documentObj.body, {
        attributes: true,
        attributeFilter: ['data-theme', 'data-wallpaper-active']
      });
    }

    function isHoverEnabled() {
      const normalized = normalizePrefs(prefs);
      const type = normalized.type;
      return normalized.hover !== false && (type === 'halftone' || type === 'ascii') && isWallpaperActive();
    }

    function isInteractivePointerTarget(target) {
      if (!target || typeof target.closest !== 'function') {
        return false;
      }
      return Boolean(target.closest(
        '#_x_extension_newtab_root_2024_unique_, ' +
        '#_x_extension_newtab_wordmark_2026_unique_, ' +
        HOVER_SAFE_ZONE_SELECTORS.join(', ') + ', ' +
        '.x-nt-wallpaper-panel, ' +
        'button, a, input, textarea, select, [role="button"], [contenteditable="true"]'
      ));
    }

    function clearHoverSafeZoneRectCache() {
      hoverSafeZoneRectCache = null;
      hoverSafeZoneRectCacheTime = 0;
    }

    function clearBackgroundLuminanceCache() {
      backgroundLuminanceCache = null;
    }

    function getHoverSafeZoneElements() {
      if (!documentObj || typeof documentObj.querySelectorAll !== 'function') {
        return [];
      }
      if (!hoverSafeZoneElements ||
          hoverSafeZoneElements.length < HOVER_SAFE_ZONE_SELECTORS.length ||
          hoverSafeZoneElements.some((element) => !element || !element.isConnected)) {
        hoverSafeZoneElements = Array.from(documentObj.querySelectorAll(HOVER_SAFE_ZONE_SELECTORS.join(',')));
      }
      return hoverSafeZoneElements;
    }

    function getHoverSafeZoneRects() {
      const now = getNow();
      if (hoverSafeZoneRectCache &&
          (now - hoverSafeZoneRectCacheTime) < HOVER_SAFE_ZONE_RECT_CACHE_MS) {
        return hoverSafeZoneRectCache;
      }
      hoverSafeZoneRectCache = getHoverSafeZoneElements().reduce((entries, element) => {
        if (!element || typeof element.getBoundingClientRect !== 'function') {
          return entries;
        }
        const rect = element.getBoundingClientRect();
        if (!rect || rect.width <= 0 || rect.height <= 0) {
          return entries;
        }
        entries.push({
          rect,
          padding: element.id === '_x_extension_newtab_section_safe_corridor_2026_unique_'
            ? 0
            : HOVER_SAFE_ZONE_PADDING_PX
        });
        return entries;
      }, []);
      hoverSafeZoneRectCacheTime = now;
      return hoverSafeZoneRectCache;
    }

    function isPointerInHoverSafeZone(clientX, clientY) {
      if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
        return false;
      }
      return getHoverSafeZoneRects().some((entry) => {
        const rect = entry.rect;
        const padding = entry.padding;
        return clientX >= rect.left - padding &&
          clientX <= rect.right + padding &&
          clientY >= rect.top - padding &&
          clientY <= rect.bottom + padding;
      });
    }

    function getNow() {
      if (root.performance && typeof root.performance.now === 'function') {
        return root.performance.now();
      }
      return Date.now();
    }

    function getCurrentHoverIntensity() {
      if (hoverPointer.active) {
        return 1;
      }
      if (!hoverPointer.fadeStartedAt) {
        return clampNumber(hoverPointer.intensity, 0, 1);
      }
      const progress = clampNumber((getNow() - hoverPointer.fadeStartedAt) / HOVER_FADE_DURATION_MS, 0, 1);
      return clampNumber(hoverPointer.fadeFrom * (1 - smoothstep(progress)), 0, 1);
    }

    function resetHoverPointer() {
      hoverPointer = {
        active: false,
        x: 0,
        y: 0,
        intensity: 0,
        fadeStartedAt: 0,
        fadeFrom: 0
      };
      hoverRenderIntensity = 0;
    }

    function clearHoverPointer() {
      const hadHover = hoverPointer.active || hoverPointer.intensity > 0 || hoverPointer.fadeStartedAt;
      if (!hadHover) {
        return;
      }
      resetHoverPointer();
      scheduleRender();
    }

    function fadeHoverPointer() {
      if (!hoverPointer.active && hoverPointer.fadeStartedAt) {
        return;
      }
      const intensity = getCurrentHoverIntensity();
      if (intensity <= 0.01) {
        clearHoverPointer();
        return;
      }
      hoverPointer = {
        active: false,
        x: hoverPointer.x,
        y: hoverPointer.y,
        intensity,
        fadeStartedAt: getNow(),
        fadeFrom: intensity
      };
      scheduleRender();
    }

    function updateHoverPointer(event) {
      if (!isHoverEnabled()) {
        clearHoverPointer();
        return;
      }
      const nextX = Number(event.clientX);
      const nextY = Number(event.clientY);
      if (!Number.isFinite(nextX) || !Number.isFinite(nextY)) {
        clearHoverPointer();
        return;
      }
      if (isInteractivePointerTarget(event.target) || isPointerInHoverSafeZone(nextX, nextY)) {
        fadeHoverPointer();
        return;
      }
      hoverPointer = {
        active: true,
        x: nextX,
        y: nextY,
        intensity: 1,
        fadeStartedAt: 0,
        fadeFrom: 1
      };
      scheduleRender();
    }

    function bindPointer() {
      if (pointerBound || !windowObj || typeof windowObj.addEventListener !== 'function') {
        return;
      }
      pointerBound = true;
      windowObj.addEventListener('pointermove', updateHoverPointer, { passive: true });
      windowObj.addEventListener('pointerleave', clearHoverPointer, { passive: true });
      windowObj.addEventListener('blur', clearHoverPointer);
      windowObj.addEventListener('resize', clearHoverSafeZoneRectCache, { passive: true });
      windowObj.addEventListener('scroll', clearHoverSafeZoneRectCache, { passive: true });
    }

    function resizeCanvas() {
      if (!canvas || !context) {
        return null;
      }
      const viewport = getViewportSize();
      const scale = getDeviceScale();
      const width = Math.max(1, Math.round(viewport.width * scale));
      const height = Math.max(1, Math.round(viewport.height * scale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.clearRect(0, 0, viewport.width, viewport.height);
      return viewport;
    }

    function clearCanvas() {
      renderToken += 1;
      resetHoverPointer();
      if (renderFrame) {
        cancelFrame(renderFrame);
        renderFrame = 0;
      }
      if (renderTimer) {
        clearTimeout(renderTimer);
        renderTimer = 0;
      }
      if (canvas && context) {
        const viewport = getViewportSize();
        context.clearRect(0, 0, viewport.width, viewport.height);
        canvas.removeAttribute('data-effect');
        canvas.style.opacity = '0';
        canvas.style.mixBlendMode = 'normal';
      }
      onRender();
    }

    function loadImage(url, token) {
      if (!url) {
        return Promise.resolve(null);
      }
      if (loadedImage && loadedImageUrl === url) {
        return Promise.resolve(loadedImage);
      }
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => {
          if (token !== renderToken) {
            resolve(null);
            return;
          }
          const resolveLoadedImage = () => {
            loadedImage = image;
            loadedImageUrl = url;
            loadedSampler = null;
            loadedSamplerUrl = '';
            resolve(image);
          };
          if (typeof image.decode === 'function') {
            image.decode().then(resolveLoadedImage).catch(resolveLoadedImage);
            return;
          }
          resolveLoadedImage();
        };
        image.onerror = () => {
          reject(new Error('Failed to load wallpaper effect source.'));
        };
        image.src = url;
      });
    }

    function createSampler(image) {
      if (!image) {
        return null;
      }
      const naturalWidth = Math.max(1, image.naturalWidth || image.width || 1);
      const naturalHeight = Math.max(1, image.naturalHeight || image.height || 1);
      const sampleScale = Math.min(1, 520 / naturalWidth, 320 / naturalHeight);
      const sourceCanvas = documentObj.createElement('canvas');
      sourceCanvas.width = Math.max(1, Math.round(naturalWidth * sampleScale));
      sourceCanvas.height = Math.max(1, Math.round(naturalHeight * sampleScale));
      const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
      if (!sourceContext) {
        return null;
      }
      sourceContext.drawImage(image, 0, 0, sourceCanvas.width, sourceCanvas.height);
      let data = null;
      try {
        data = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height).data;
      } catch (e) {
        return null;
      }
      return {
        width: sourceCanvas.width,
        height: sourceCanvas.height,
        naturalWidth,
        naturalHeight,
        scaleX: sourceCanvas.width / naturalWidth,
        scaleY: sourceCanvas.height / naturalHeight,
        data
      };
    }

    function getSampler(image, imageUrl) {
      if (loadedSampler && loadedSamplerUrl === imageUrl) {
        return loadedSampler;
      }
      loadedSampler = createSampler(image);
      loadedSamplerUrl = loadedSampler ? imageUrl : '';
      return loadedSampler;
    }

    function getRenderedMetrics(sampler, viewport) {
      const scale = Math.max(
        viewport.width / sampler.naturalWidth,
        viewport.height / sampler.naturalHeight
      );
      const renderedWidth = sampler.naturalWidth * scale;
      const renderedHeight = sampler.naturalHeight * scale;
      return {
        scale,
        offsetX: (viewport.width - renderedWidth) / 2,
        offsetY: (viewport.height - renderedHeight) / 2
      };
    }

    function sampleColor(sampler, metrics, viewportX, viewportY) {
      const sourceX = ((viewportX - metrics.offsetX) / metrics.scale) * sampler.scaleX;
      const sourceY = ((viewportY - metrics.offsetY) / metrics.scale) * sampler.scaleY;
      const x = Math.round(clampNumber(sourceX, 0, sampler.width - 1));
      const y = Math.round(clampNumber(sourceY, 0, sampler.height - 1));
      const index = (y * sampler.width + x) * 4;
      const red = sampler.data[index] || 0;
      const green = sampler.data[index + 1] || 0;
      const blue = sampler.data[index + 2] || 0;
      const alpha = (sampler.data[index + 3] || 255) / 255;
      return {
        red: Math.round((red * alpha) + (255 * (1 - alpha))),
        green: Math.round((green * alpha) + (255 * (1 - alpha))),
        blue: Math.round((blue * alpha) + (255 * (1 - alpha)))
      };
    }

    function getLuminance(color) {
      return getLuminanceFromRgb(color.red, color.green, color.blue);
    }

    function getBackgroundLuminance() {
      const theme = getThemeMode();
      if (backgroundLuminanceCache && backgroundLuminanceCache.theme === theme) {
        return backgroundLuminanceCache.value;
      }
      const value = getLuminance(getBackgroundColor());
      backgroundLuminanceCache = { theme, value };
      return value;
    }

    function shiftSampleColor(color, amount, lighten) {
      const shift = clampNumber(amount, 0, 1);
      if (lighten) {
        return {
          red: Math.round(color.red + ((255 - color.red) * shift)),
          green: Math.round(color.green + ((255 - color.green) * shift)),
          blue: Math.round(color.blue + ((255 - color.blue) * shift))
        };
      }
      return {
        red: Math.round(color.red * (1 - shift)),
        green: Math.round(color.green * (1 - shift)),
        blue: Math.round(color.blue * (1 - shift))
      };
    }

    function clampChannel(value) {
      return Math.round(clampNumber(value, 0, 255));
    }

    function boostSampleColor(color, amount) {
      const boost = 1 + clampNumber(amount, 0, 1.2);
      const luma = ((color.red * 0.299) + (color.green * 0.587) + (color.blue * 0.114));
      return {
        red: clampChannel(luma + ((color.red - luma) * boost)),
        green: clampChannel(luma + ((color.green - luma) * boost)),
        blue: clampChannel(luma + ((color.blue - luma) * boost))
      };
    }

    function getEffectAlpha(base, strength) {
      return clampNumber((strength / 100) * base, 0, 1);
    }

    function smoothstep(value) {
      const x = clampNumber(value, 0, 1);
      return x * x * (3 - (2 * x));
    }

    function applyToneCurve(tone, strength) {
      const amount = clampNumber(strength, 0, 100) / 100;
      const blackPoint = amount * 0.22;
      const whitePoint = 1 - (amount * 0.08);
      const leveled = clampNumber((tone - blackPoint) / Math.max(0.01, whitePoint - blackPoint), 0, 1);
      const curved = smoothstep(leveled);
      return (leveled * (1 - amount)) + (curved * amount);
    }

    function getEffectTone(luminance, darkMode, strength) {
      const sourceTone = darkMode ? luminance : (1 - luminance);
      return applyToneCurve(sourceTone, strength);
    }

    function getCurvedEffectColor(color, darkMode, tone, saturation) {
      const saturated = boostSampleColor(color, saturation);
      const contrastShift = 0.04 + (tone * 0.12);
      return shiftSampleColor(saturated, contrastShift, darkMode);
    }

    function getControlRange(value, minValue, maxValue) {
      const ratio = clampNumber(value, 0, 100) / 100;
      return minValue + ((maxValue - minValue) * ratio);
    }

    function getAsciiGlyphMetrics(fontSize, font) {
      if (asciiGlyphMetricsCache &&
          asciiGlyphMetricsCache.fontSize === fontSize &&
          asciiGlyphMetricsCache.font === font) {
        return asciiGlyphMetricsCache;
      }
      const glyphWidth = ASCII_CHARS.split('').reduce((maxWidth, char) => {
        if (char === ' ') {
          return maxWidth;
        }
        const metrics = context.measureText(char);
        return Math.max(maxWidth, metrics.width || 0);
      }, fontSize * 0.62);
      const glyphMetrics = context.measureText('@');
      const glyphHeight = (glyphMetrics.actualBoundingBoxAscent || 0) +
        (glyphMetrics.actualBoundingBoxDescent || 0);
      asciiGlyphMetricsCache = {
        fontSize,
        font,
        glyphWidth,
        glyphHeight
      };
      return asciiGlyphMetricsCache;
    }

    function getOverlayBlendLuminance(baseLuminance, effectLuminance) {
      const base = clampNumber(baseLuminance, 0, 1);
      const source = clampNumber(effectLuminance, 0, 1);
      if (base <= 0.5) {
        return 2 * base * source;
      }
      return 1 - (2 * (1 - base) * (1 - source));
    }

    function getHoverInfluence(viewportX, viewportY) {
      if (hoverRenderIntensity <= 0) {
        return 0;
      }
      const viewport = getViewportSize();
      const radius = viewport.width < 720 ? 92 : 132;
      const distance = Math.hypot(viewportX - hoverPointer.x, viewportY - hoverPointer.y);
      if (distance > radius) {
        return 0;
      }
      const falloff = 1 - clampNumber(distance / radius, 0, 1);
      return Math.pow(smoothstep(falloff), 1.18) * hoverRenderIntensity;
    }

    function beginHoverRender() {
      hoverRenderIntensity = getCurrentHoverIntensity();
    }

    function finishHoverRender() {
      if (hoverPointer.active || !hoverPointer.fadeStartedAt) {
        return;
      }
      if (hoverRenderIntensity <= 0.01) {
        resetHoverPointer();
        return;
      }
      scheduleRender();
    }

    function setCanvasVisuals(type, opacity, blendMode) {
      if (!canvas) {
        return;
      }
      canvas.setAttribute('data-effect', type);
      canvas.style.opacity = String(clampNumber(opacity, 0, 1));
      canvas.style.mixBlendMode = blendMode || 'normal';
      onRender();
    }

    function getCanvasOpacity() {
      if (!canvas) {
        return 0;
      }
      const opacity = Number.parseFloat(canvas.style.opacity || '1');
      return clampNumber(Number.isFinite(opacity) ? opacity : 1, 0, 1);
    }

    function getLuminanceAtViewport(viewportX, viewportY, baseLuminance) {
      const normalized = normalizePrefs(prefs);
      if (!canvas ||
          !context ||
          !isWallpaperActive() ||
          normalized.type === 'none' ||
          canvas.style.opacity === '0') {
        return null;
      }
      const viewport = getViewportSize();
      const x = Math.round(clampNumber(viewportX, 0, viewport.width) * (canvas.width / viewport.width));
      const y = Math.round(clampNumber(viewportY, 0, viewport.height) * (canvas.height / viewport.height));
      let pixel = null;
      try {
        pixel = context.getImageData(
          clampNumber(x, 0, canvas.width - 1),
          clampNumber(y, 0, canvas.height - 1),
          1,
          1
        ).data;
      } catch (e) {
        return null;
      }
      const canvasAlpha = (pixel[3] / 255) * getCanvasOpacity();
      const effectLuminance = getLuminanceFromRgb(pixel[0], pixel[1], pixel[2]);
      if (normalized.type === 'grain') {
        if (!Number.isFinite(baseLuminance)) {
          return null;
        }
        const blended = getOverlayBlendLuminance(baseLuminance, effectLuminance);
        return (baseLuminance * (1 - canvasAlpha)) + (blended * canvasAlpha);
      }
      const backgroundLuminance = getBackgroundLuminance();
      return (backgroundLuminance * (1 - canvasAlpha)) + (effectLuminance * canvasAlpha);
    }

    function drawGrain(viewport, strength) {
      const tile = documentObj.createElement('canvas');
      tile.width = 180;
      tile.height = 180;
      const tileContext = tile.getContext('2d');
      if (!tileContext) {
        return;
      }
      const imageData = tileContext.createImageData(tile.width, tile.height);
      for (let index = 0; index < imageData.data.length; index += 4) {
        const value = Math.floor(Math.random() * 255);
        imageData.data[index] = value;
        imageData.data[index + 1] = value;
        imageData.data[index + 2] = value;
        imageData.data[index + 3] = 255;
      }
      tileContext.putImageData(imageData, 0, 0);
      const pattern = context.createPattern(tile, 'repeat');
      if (!pattern) {
        return;
      }
      context.fillStyle = pattern;
      context.fillRect(0, 0, viewport.width, viewport.height);
      setCanvasVisuals('grain', 0.08 + getEffectAlpha(0.22, strength), 'overlay');
    }

    function drawHalftone(viewport, sampler, strength, size, spacing) {
      beginHoverRender();
      const metrics = getRenderedMetrics(sampler, viewport);
      const step = getControlRange(spacing, viewport.width < 720 ? 9 : 10, viewport.width < 720 ? 23 : 26);
      const sizeRadius = getControlRange(size, viewport.width < 720 ? 1.4 : 1.6, viewport.width < 720 ? 13 : 15);
      const maxRadius = Math.min(sizeRadius, step * 0.78);
      const darkMode = getThemeMode() === 'dark';
      for (let y = step / 2; y < viewport.height + step; y += step) {
        for (let x = step / 2; x < viewport.width + step; x += step) {
          const color = sampleColor(sampler, metrics, x, y);
          const luminance = getLuminance(color);
          const tone = getEffectTone(luminance, darkMode, strength);
          const hover = getHoverInfluence(x, y);
          const nextTone = clampNumber(tone + (hover * 0.24), 0, 1);
          if (nextTone <= 0.01) {
            continue;
          }
          const radius = clampNumber(
            nextTone * maxRadius * (1 + (hover * 0.26)),
            0.7,
            maxRadius * 1.24
          );
          const ink = getCurvedEffectColor(color, darkMode, nextTone, 0.2 + (hover * 0.24));
          context.globalAlpha = clampNumber(0.28 + (nextTone * 0.72) + (hover * 0.14), 0.12, 1);
          context.fillStyle = `rgb(${ink.red} ${ink.green} ${ink.blue})`;
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fill();
        }
      }
      context.globalAlpha = 1;
      setCanvasVisuals('halftone', 1, 'normal');
      finishHoverRender();
    }

    function drawAscii(viewport, sampler, strength, size, spacing) {
      beginHoverRender();
      const metrics = getRenderedMetrics(sampler, viewport);
      const darkMode = getThemeMode() === 'dark';
      const fontSize = Math.round(getControlRange(size, 8, viewport.width < 720 ? 24 : 26));
      context.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
      context.textBaseline = 'middle';
      context.textAlign = 'center';
      const glyphMetrics = getAsciiGlyphMetrics(fontSize, context.font);
      const xStep = Math.max(
        getControlRange(spacing, viewport.width < 720 ? 8 : 9, viewport.width < 720 ? 24 : 27),
        glyphMetrics.glyphWidth * 1.12
      );
      const lineHeight = Math.max(
        getControlRange(spacing, 10, viewport.width < 720 ? 26 : 28),
        (glyphMetrics.glyphHeight || fontSize) * 1.16,
        fontSize * 1.08
      );
      for (let y = lineHeight / 2; y < viewport.height + lineHeight; y += lineHeight) {
        for (let x = xStep / 2; x < viewport.width + xStep; x += xStep) {
          const color = sampleColor(sampler, metrics, x, y);
          const luminance = getLuminance(color);
          const tone = getEffectTone(luminance, darkMode, strength);
          const hover = getHoverInfluence(x, y);
          const nextTone = clampNumber(tone + (hover * 0.22), 0, 1);
          if (nextTone <= 0.015) {
            continue;
          }
          const index = Math.round(nextTone * (ASCII_CHARS.length - 1));
          const char = ASCII_CHARS[clampNumber(index, 0, ASCII_CHARS.length - 1)];
          if (char === ' ') {
            continue;
          }
          const ink = getCurvedEffectColor(color, darkMode, nextTone, 0.42 + (hover * 0.24));
          context.globalAlpha = clampNumber(0.12 + (nextTone * 0.88) + (hover * 0.1), 0.08, 1);
          context.fillStyle = `rgb(${ink.red} ${ink.green} ${ink.blue})`;
          context.fillText(char, x, y);
        }
      }
      context.globalAlpha = 1;
      setCanvasVisuals('ascii', 1, 'normal');
      finishHoverRender();
    }

    function renderNow() {
      renderFrame = 0;
      const normalized = normalizePrefs(prefs);
      if (normalized.type === 'none' || !isWallpaperActive()) {
        clearCanvas();
        return;
      }
      if (!ensureCanvas()) {
        return;
      }
      const viewport = resizeCanvas();
      if (!viewport) {
        return;
      }
      const token = ++renderToken;
      if (normalized.type === 'grain') {
        drawGrain(viewport, normalized.strength);
        return;
      }
      const wallpaper = getCurrentWallpaper();
      const imageUrl = wallpaper ? getWallpaperImageUrl(wallpaper) : '';
      loadImage(imageUrl, token).then((image) => {
        if (token !== renderToken || !image) {
          return;
        }
        const sampler = getSampler(image, imageUrl);
        if (!sampler) {
          clearCanvas();
          return;
        }
        const nextViewport = resizeCanvas();
        if (!nextViewport) {
          return;
        }
        if (normalized.type === 'halftone') {
          drawHalftone(nextViewport, sampler, normalized.strength, normalized.size, normalized.spacing);
          return;
        }
        if (normalized.type === 'ascii') {
          drawAscii(nextViewport, sampler, normalized.strength, normalized.size, normalized.spacing);
        }
      }).catch(() => {
        clearCanvas();
      });
    }

    function scheduleRender(delay) {
      if (renderFrame) {
        cancelFrame(renderFrame);
        renderFrame = 0;
      }
      if (renderTimer) {
        clearTimeout(renderTimer);
        renderTimer = 0;
      }
      const wait = Number(delay) || 0;
      if (wait > 0) {
        renderTimer = setTimeout(() => {
          renderTimer = 0;
          renderFrame = requestFrame(renderNow);
        }, wait);
        return;
      }
      renderFrame = requestFrame(renderNow);
    }

    function apply(nextPrefs) {
      const previousType = normalizePrefs(prefs).type;
      prefs = normalizePrefs(nextPrefs);
      if (prefs.hover === false || (prefs.type !== 'halftone' && prefs.type !== 'ascii')) {
        resetHoverPointer();
      }
      if (canvas &&
          context &&
          !shouldReduceMotion() &&
          previousType !== prefs.type &&
          previousType !== 'none' &&
          prefs.type !== 'none' &&
          getCanvasOpacity() > 0.01) {
        canvas.style.opacity = '0';
        scheduleRender(EFFECT_CROSSFADE_MS);
        return;
      }
      scheduleRender();
    }

    function refresh() {
      const normalized = normalizePrefs(prefs);
      if (canvas &&
          context &&
          !shouldReduceMotion() &&
          normalized.type !== 'none' &&
          getCanvasOpacity() > 0.01) {
        canvas.style.opacity = '0';
        scheduleRender(EFFECT_CROSSFADE_MS);
        return;
      }
      scheduleRender(60);
    }

    if (windowObj && typeof windowObj.addEventListener === 'function') {
      windowObj.addEventListener('resize', () => {
        scheduleRender(140);
      }, { passive: true });
    }

    return {
      apply,
      getLuminanceAtViewport,
      refresh,
      normalizePrefs
    };
  }

  root.LumnoNewtabWallpaperEffects = {
    DEFAULT_PREFS,
    EFFECT_TYPES,
    createWallpaperEffects,
    normalizePrefs
  };
})(globalThis);
