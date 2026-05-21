(function(root) {
  'use strict';

  function noop() {}

  function getOption(options, key, fallback) {
    if (options && Object.prototype.hasOwnProperty.call(options, key)) {
      return options[key];
    }
    return fallback;
  }

  function getFunction(options, key, fallback) {
    const value = getOption(options, key, fallback || noop);
    return typeof value === 'function' ? value : (fallback || noop);
  }

  function clampNumber(value, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return min;
    }
    return Math.min(max, Math.max(min, number));
  }

  function createWallpaperAdaptiveTone(options) {
    const documentObj = getOption(options, 'documentObj', root.document);
    const windowObj = getOption(options, 'windowObj', root.window);
    const getTargets = getFunction(options, 'getTargets', function() {
      return [];
    });
    const getCurrentWallpaper = getFunction(options, 'getCurrentWallpaper', function() {
      return null;
    });
    const getWallpaperImageUrl = getFunction(options, 'getWallpaperImageUrl', function() {
      return '';
    });
    const getOverlayAlphaAtViewportY = getFunction(options, 'getOverlayAlphaAtViewportY', function() {
      return 0;
    });
    const getOverlayLuminance = getFunction(options, 'getOverlayLuminance', function() {
      return 1;
    });
    const applyWordmarkThemeAppearance = getFunction(options, 'applyWordmarkThemeAppearance');

    let sampler = null;
    let loadToken = 0;
    let toneFrame = 0;

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

    function getViewportSize() {
      const docEl = documentObj.documentElement;
      return {
        width: Math.max(1, windowObj.innerWidth || (docEl ? docEl.clientWidth : 0) || 1),
        height: Math.max(1, windowObj.innerHeight || (docEl ? docEl.clientHeight : 0) || 1)
      };
    }

    function getToneTargets() {
      const targets = getTargets();
      return Array.isArray(targets) ? targets : [];
    }

    function clear(options) {
      if (toneFrame) {
        cancelFrame(toneFrame);
        toneFrame = 0;
      }
      getToneTargets().forEach((target) => {
        if (!target || !target.element) {
          return;
        }
        target.element.removeAttribute('data-wallpaper-ink');
        target.element.style.removeProperty('--x-nt-wallpaper-local-luma');
      });
      if (!options || options.updateWordmark !== false) {
        applyWordmarkThemeAppearance();
      }
    }

    function getSampleRect(rect, target) {
      const viewport = getViewportSize();
      const minWidth = Math.max(1, Number(target && target.minWidth) || 80);
      const minHeight = Math.max(1, Number(target && target.minHeight) || 40);
      const width = Math.min(viewport.width, Math.max(rect.width + 32, minWidth));
      const height = Math.min(viewport.height, Math.max(rect.height + 28, minHeight));
      const centerX = clampNumber((rect.left + rect.right) / 2, 0, viewport.width);
      const centerY = clampNumber((rect.top + rect.bottom) / 2, 0, viewport.height);
      const maxLeft = Math.max(0, viewport.width - width);
      const maxTop = Math.max(0, viewport.height - height);
      return {
        left: clampNumber(centerX - (width / 2), 0, maxLeft),
        top: clampNumber(centerY - (height / 2), 0, maxTop),
        width,
        height
      };
    }

    function loadImage(url) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => {
          resolve(image);
        };
        image.onerror = () => {
          reject(new Error('Failed to load wallpaper image.'));
        };
        image.src = url;
      });
    }

    function createSampler(image, url) {
      const naturalWidth = Math.max(1, image.naturalWidth || image.width || 1);
      const naturalHeight = Math.max(1, image.naturalHeight || image.height || 1);
      const sampleScale = Math.min(1, 420 / naturalWidth, 260 / naturalHeight);
      const canvas = documentObj.createElement('canvas');
      canvas.width = Math.max(1, Math.round(naturalWidth * sampleScale));
      canvas.height = Math.max(1, Math.round(naturalHeight * sampleScale));
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        return null;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return {
        url,
        canvas,
        context,
        naturalWidth,
        naturalHeight,
        sampleScaleX: canvas.width / naturalWidth,
        sampleScaleY: canvas.height / naturalHeight
      };
    }

    function getRenderedMetrics(sourceSampler) {
      const viewport = getViewportSize();
      const scale = Math.max(
        viewport.width / sourceSampler.naturalWidth,
        viewport.height / sourceSampler.naturalHeight
      );
      const renderedWidth = sourceSampler.naturalWidth * scale;
      const renderedHeight = sourceSampler.naturalHeight * scale;
      return {
        scale,
        offsetX: (viewport.width - renderedWidth) / 2,
        offsetY: (viewport.height - renderedHeight) / 2
      };
    }

    function applyOverlayToLuminance(luminance, viewportY) {
      const alpha = clampNumber(getOverlayAlphaAtViewportY(viewportY), 0, 1);
      const overlayLuminance = clampNumber(getOverlayLuminance(), 0, 1);
      return (luminance * (1 - alpha)) + (overlayLuminance * alpha);
    }

    function getPixelLuminance(sourceSampler, x, y) {
      const pixel = sourceSampler.context.getImageData(x, y, 1, 1).data;
      const alpha = pixel[3] / 255;
      const red = (pixel[0] * alpha) + (255 * (1 - alpha));
      const green = (pixel[1] * alpha) + (255 * (1 - alpha));
      const blue = (pixel[2] * alpha) + (255 * (1 - alpha));
      return ((red * 0.299) + (green * 0.587) + (blue * 0.114)) / 255;
    }

    function sampleLuminanceForRect(sourceSampler, rect) {
      if (!sourceSampler || !sourceSampler.canvas || !sourceSampler.context || !rect) {
        return null;
      }
      const metrics = getRenderedMetrics(sourceSampler);
      const xs = [0.18, 0.34, 0.5, 0.66, 0.82];
      const ys = [0.24, 0.5, 0.76];
      const values = [];
      try {
        ys.forEach((yRatio) => {
          xs.forEach((xRatio) => {
            const viewportX = rect.left + (rect.width * xRatio);
            const viewportY = rect.top + (rect.height * yRatio);
            const sourceX = ((viewportX - metrics.offsetX) / metrics.scale) * sourceSampler.sampleScaleX;
            const sourceY = ((viewportY - metrics.offsetY) / metrics.scale) * sourceSampler.sampleScaleY;
            const x = Math.round(clampNumber(sourceX, 0, sourceSampler.canvas.width - 1));
            const y = Math.round(clampNumber(sourceY, 0, sourceSampler.canvas.height - 1));
            values.push(applyOverlayToLuminance(getPixelLuminance(sourceSampler, x, y), viewportY));
          });
        });
      } catch (e) {
        return null;
      }
      if (values.length === 0) {
        return null;
      }
      values.sort((a, b) => a - b);
      const trimCount = values.length >= 10 ? 2 : 0;
      const trimmed = values.slice(trimCount, values.length - trimCount);
      const sourceValues = trimmed.length > 0 ? trimmed : values;
      const sum = sourceValues.reduce((total, value) => total + value, 0);
      return sum / sourceValues.length;
    }

    function chooseInk(luminance, currentInk) {
      if (!Number.isFinite(luminance)) {
        return currentInk === 'dark' || currentInk === 'light' ? currentInk : 'light';
      }
      if (currentInk === 'dark') {
        return luminance < 0.5 ? 'light' : 'dark';
      }
      if (currentInk === 'light') {
        return luminance > 0.62 ? 'dark' : 'light';
      }
      return luminance >= 0.56 ? 'dark' : 'light';
    }

    function apply() {
      if (!getCurrentWallpaper() ||
          !sampler ||
          !documentObj.body ||
          documentObj.body.getAttribute('data-wallpaper-active') !== 'true') {
        clear({ updateWordmark: false });
        applyWordmarkThemeAppearance();
        return;
      }
      const viewport = getViewportSize();
      getToneTargets().forEach((target) => {
        if (!target || !target.element || !target.sampleElement) {
          return;
        }
        const rect = target.sampleElement.getBoundingClientRect();
        if (rect.width <= 1 ||
            rect.height <= 1 ||
            rect.right <= 0 ||
            rect.left >= viewport.width ||
            rect.bottom <= 0 ||
            rect.top >= viewport.height) {
          target.element.removeAttribute('data-wallpaper-ink');
          target.element.style.removeProperty('--x-nt-wallpaper-local-luma');
          return;
        }
        const sampleRect = getSampleRect(rect, target);
        const luminance = sampleLuminanceForRect(sampler, sampleRect);
        if (!Number.isFinite(luminance)) {
          return;
        }
        const currentInk = target.element.getAttribute('data-wallpaper-ink');
        const nextInk = chooseInk(luminance, currentInk);
        target.element.setAttribute('data-wallpaper-ink', nextInk);
        target.element.style.setProperty('--x-nt-wallpaper-local-luma', luminance.toFixed(3));
      });
      applyWordmarkThemeAppearance();
    }

    function schedule() {
      if (!getCurrentWallpaper() || !sampler) {
        return;
      }
      if (toneFrame) {
        return;
      }
      toneFrame = requestFrame(() => {
        toneFrame = requestFrame(() => {
          toneFrame = 0;
          apply();
        });
      });
    }

    function refresh() {
      const wallpaper = getCurrentWallpaper();
      const imageUrl = wallpaper ? getWallpaperImageUrl(wallpaper) : '';
      const token = ++loadToken;
      if (!wallpaper || !imageUrl) {
        sampler = null;
        clear();
        return;
      }
      if (sampler && sampler.url === imageUrl) {
        schedule();
        return;
      }
      sampler = null;
      clear({ updateWordmark: false });
      applyWordmarkThemeAppearance();
      loadImage(imageUrl).then((image) => {
        if (token !== loadToken) {
          return;
        }
        sampler = createSampler(image, imageUrl);
        apply();
        schedule();
      }).catch(() => {
        if (token !== loadToken) {
          return;
        }
        sampler = null;
        clear();
      });
    }

    return {
      clear,
      refresh,
      schedule
    };
  }

  root.LumnoNewtabWallpaperAdaptiveTone = {
    createWallpaperAdaptiveTone
  };
})(globalThis);
