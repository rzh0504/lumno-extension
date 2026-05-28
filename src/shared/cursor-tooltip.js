(function(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoCursorTooltip = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const HOST_CLASS = '_x_extension_cursor_tooltip_host_2026_unique_';
  const DEFAULT_VISIBLE_ATTRIBUTE = 'data-visible';
  const DEFAULT_BOUND_ATTRIBUTE = 'data-cursor-tooltip-bound';
  const DEFAULT_TEXT_ATTRIBUTE = 'data-cursor-tooltip';

  function getBaseTooltip() {
    return (root && root.LumnoTooltip) || {};
  }

  function getDocument(options) {
    return (options && options.documentObj) || (root && root.document) || null;
  }

  function getWindow(options) {
    return (options && options.windowObj) || (root && root.window) || root || {};
  }

  function getRequestAnimationFrame(windowObj) {
    if (windowObj && typeof windowObj.requestAnimationFrame === 'function') {
      return windowObj.requestAnimationFrame.bind(windowObj);
    }
    return (callback) => {
      if (root && typeof root.setTimeout === 'function') {
        root.setTimeout(callback, 0);
        return;
      }
      callback();
    };
  }

  function getSetTimeout(windowObj) {
    if (windowObj && typeof windowObj.setTimeout === 'function') {
      return windowObj.setTimeout.bind(windowObj);
    }
    if (root && typeof root.setTimeout === 'function') {
      return root.setTimeout.bind(root);
    }
    return (callback) => {
      callback();
      return 0;
    };
  }

  function getClearTimeout(windowObj) {
    if (windowObj && typeof windowObj.clearTimeout === 'function') {
      return windowObj.clearTimeout.bind(windowObj);
    }
    if (root && typeof root.clearTimeout === 'function') {
      return root.clearTimeout.bind(root);
    }
    return () => {};
  }

  function addClass(element, className) {
    if (!element || !className) {
      return;
    }
    if (element.classList && typeof element.classList.add === 'function') {
      element.classList.add(className);
      return;
    }
    const current = String(element.className || '');
    const parts = current.split(/\s+/).filter(Boolean);
    if (!parts.includes(className)) {
      parts.push(className);
      element.className = parts.join(' ');
    }
  }

  function setAttribute(element, name, value) {
    if (element && typeof element.setAttribute === 'function') {
      element.setAttribute(name, String(value));
    }
  }

  function setStyleProperty(element, name, value) {
    if (element && element.style && typeof element.style.setProperty === 'function') {
      element.style.setProperty(name, value);
    }
  }

  function normalizeCssLength(value) {
    if (value === undefined || value === null || value === '') {
      return '';
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) && value >= 0 ? `${value}px` : '';
    }
    return String(value).trim();
  }

  function getNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function getElementRect(element, fallback) {
    if (element && typeof element.getBoundingClientRect === 'function') {
      return element.getBoundingClientRect();
    }
    return fallback || { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
  }

  function getPointFromInput(input, target) {
    const source = input || {};
    const x = Number(source.clientX !== undefined ? source.clientX : source.x);
    const y = Number(source.clientY !== undefined ? source.clientY : source.y);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      return { clientX: x, clientY: y };
    }
    const rect = getElementRect(target);
    return {
      clientX: rect.left + ((rect.width || 0) / 2),
      clientY: rect.bottom || (rect.top + (rect.height || 0))
    };
  }

  function isTargetActive(target, doc, options) {
    const config = options || {};
    if (config.checkActive === false) {
      return true;
    }
    if (!target) {
      return false;
    }
    if (target.isConnected === false) {
      return false;
    }
    if (doc && doc.activeElement === target) {
      return true;
    }
    if (typeof target.matches === 'function') {
      try {
        return target.matches(':hover');
      } catch (error) {
        return true;
      }
    }
    return true;
  }

  function shouldShowTarget(target, options) {
    const config = options || {};
    if (typeof config.shouldShow !== 'function') {
      return true;
    }
    try {
      return config.shouldShow(target) !== false;
    } catch (error) {
      return false;
    }
  }

  function createElement(doc, options) {
    const baseTooltip = getBaseTooltip();
    const decorateElement = typeof options.decorateElement === 'function'
      ? options.decorateElement
      : null;
    if (typeof baseTooltip.createElement === 'function') {
      return baseTooltip.createElement(doc, Object.assign({}, options, {
        decorateElement: (element) => {
          setAttribute(element, 'data-tooltip-kind', 'cursor');
          if (decorateElement) {
            decorateElement(element);
          }
        }
      }));
    }
    return null;
  }

  function renderText(element, text) {
    const baseTooltip = getBaseTooltip();
    if (typeof baseTooltip.renderText === 'function') {
      return baseTooltip.renderText(element, text);
    }
    if (element) {
      element.textContent = String(text || '');
    }
    return element;
  }

  function positionAtPoint(element, point, options) {
    if (!element || !point) {
      return null;
    }
    const config = options || {};
    const windowObj = getWindow(config);
    const positionMode = config.positionMode === 'absolute' ? 'absolute' : 'fixed';
    const margin = getNumber(config.margin, 8);
    const offsetX = getNumber(config.offsetX, 14);
    const offsetY = getNumber(config.offsetY, 16);
    const viewportWidth = getNumber(windowObj.innerWidth, 1024);
    const viewportHeight = getNumber(windowObj.innerHeight, 768);
    const boundaryElement = config.boundaryElement || null;
    const boundaryRect = positionMode === 'absolute'
      ? getElementRect(boundaryElement, { top: 0, left: 0, right: viewportWidth, bottom: viewportHeight, width: viewportWidth, height: viewportHeight })
      : { top: 0, left: 0, right: viewportWidth, bottom: viewportHeight, width: viewportWidth, height: viewportHeight };
    const availableWidth = Math.max(180, Math.floor((boundaryRect.width || viewportWidth) - (margin * 2)));
    const configuredMaxWidth = config.maxWidth === undefined ? 420 : config.maxWidth;
    const resolvedMaxWidth = typeof configuredMaxWidth === 'number'
      ? `${Math.min(configuredMaxWidth, availableWidth)}px`
      : (normalizeCssLength(configuredMaxWidth) || `${availableWidth}px`);
    setStyleProperty(element, 'max-width', resolvedMaxWidth);
    setStyleProperty(element, 'width', 'max-content');
    setAttribute(element, 'data-tooltip-position', positionMode);

    const tooltipRect = getElementRect(element);
    const pointerLeft = getNumber(point.clientX !== undefined ? point.clientX : point.x, 0) - boundaryRect.left;
    const pointerTop = getNumber(point.clientY !== undefined ? point.clientY : point.y, 0) - boundaryRect.top;
    let left = pointerLeft + offsetX;
    let top = pointerTop + offsetY;
    if (left + tooltipRect.width + margin > (boundaryRect.width || viewportWidth)) {
      left = pointerLeft - tooltipRect.width - offsetX;
    }
    if (top + tooltipRect.height + margin > (boundaryRect.height || viewportHeight)) {
      top = pointerTop - tooltipRect.height - offsetY;
    }

    const maxTop = Math.max(margin, (boundaryRect.height || viewportHeight) - tooltipRect.height - margin);
    const maxLeft = Math.max(margin, (boundaryRect.width || viewportWidth) - tooltipRect.width - margin);
    top = Math.max(margin, Math.min(top, maxTop));
    left = Math.max(margin, Math.min(left, maxLeft));
    setStyleProperty(element, 'top', `${Math.round(top)}px`);
    setStyleProperty(element, 'left', `${Math.round(left)}px`);
    return Object.freeze({ top: Math.round(top), left: Math.round(left) });
  }

  function createController(options) {
    const config = options || {};
    const documentObj = getDocument(config);
    const windowObj = getWindow(config);
    const requestFrame = getRequestAnimationFrame(windowObj);
    const setTimer = getSetTimeout(windowObj);
    const clearTimer = getClearTimeout(windowObj);
    let element = null;
    let hideTimer = null;
    let currentTarget = null;
    let lastPoint = null;
    let token = 0;

    function ensureElement() {
      if (element) {
        return element;
      }
      element = createElement(documentObj, config);
      const appendTo = config.appendTo || (documentObj && documentObj.body);
      if (appendTo && typeof appendTo.appendChild === 'function' && element) {
        appendTo.appendChild(element);
      }
      return element;
    }

    function show(target, text, pointInput, showOptions) {
      const content = String(text || '');
      const mergedOptions = Object.assign({}, config, showOptions || {});
      if (!target || !content || !shouldShowTarget(target, mergedOptions)) {
        return null;
      }
      const tooltip = ensureElement();
      if (!tooltip) {
        return null;
      }
      if (hideTimer) {
        clearTimer(hideTimer);
        hideTimer = null;
      }
      token += 1;
      const showToken = token;
      currentTarget = target;
      lastPoint = getPointFromInput(pointInput, target);
      renderText(tooltip, content);
      setAttribute(tooltip, DEFAULT_VISIBLE_ATTRIBUTE, 'false');
      setAttribute(tooltip, 'aria-hidden', 'true');
      positionAtPoint(tooltip, lastPoint, mergedOptions);
      requestFrame(() => {
        if (showToken !== token || currentTarget !== target || !isTargetActive(target, documentObj, mergedOptions)) {
          return;
        }
        setAttribute(tooltip, DEFAULT_VISIBLE_ATTRIBUTE, 'true');
        setAttribute(tooltip, 'aria-hidden', 'false');
      });
      return tooltip;
    }

    function move(pointInput, moveOptions) {
      if (!element || !currentTarget) {
        return null;
      }
      lastPoint = getPointFromInput(pointInput, currentTarget);
      positionAtPoint(element, lastPoint, Object.assign({}, config, moveOptions || {}));
      return element;
    }

    function hide() {
      if (!element) {
        return null;
      }
      token += 1;
      const hideToken = token;
      currentTarget = null;
      setAttribute(element, DEFAULT_VISIBLE_ATTRIBUTE, 'false');
      setAttribute(element, 'aria-hidden', 'true');
      if (hideTimer) {
        clearTimer(hideTimer);
      }
      hideTimer = setTimer(() => {
        if (hideToken !== token || !element) {
          return;
        }
        setAttribute(element, DEFAULT_VISIBLE_ATTRIBUTE, 'false');
        hideTimer = null;
      }, getNumber(config.hideDelay, 120));
      return element;
    }

    function bind(target, getText, bindOptions) {
      if (!target || typeof target.addEventListener !== 'function') {
        return null;
      }
      const settings = bindOptions || {};
      const boundAttribute = settings.boundAttribute || DEFAULT_BOUND_ATTRIBUTE;
      if (typeof target.getAttribute === 'function' && target.getAttribute(boundAttribute) === 'true') {
        return target;
      }
      addClass(target, HOST_CLASS);
      if (typeof target.setAttribute === 'function') {
        target.setAttribute(boundAttribute, 'true');
      }
      if (
        settings.suppressNativeTitle !== false &&
        typeof target.getAttribute === 'function' &&
        typeof target.removeAttribute === 'function'
      ) {
        const nativeTitle = target.getAttribute('title');
        if (nativeTitle) {
          target.setAttribute('data-cursor-tooltip-native-title', nativeTitle);
          target.removeAttribute('title');
        }
      }
      const resolveText = typeof getText === 'function'
        ? getText
        : () => (typeof target.getAttribute === 'function'
          ? target.getAttribute(settings.attributeName || DEFAULT_TEXT_ATTRIBUTE)
          : '');
      const showBoundTooltip = (event) => {
        if (!shouldShowTarget(target, settings)) {
          hide();
          return;
        }
        show(target, resolveText(target), event, settings);
      };
      const moveBoundTooltip = (event) => {
        move(event, settings);
      };
      const showFocusTooltip = () => {
        if (!shouldShowTarget(target, settings)) {
          hide();
          return;
        }
        show(target, resolveText(target), getPointFromInput(null, target), settings);
      };
      target.addEventListener('pointerenter', showBoundTooltip, true);
      target.addEventListener('pointermove', moveBoundTooltip);
      target.addEventListener('pointerleave', hide);
      target.addEventListener('pointercancel', hide);
      target.addEventListener('focus', showFocusTooltip);
      target.addEventListener('blur', hide);
      return target;
    }

    function bindAll(rootNode, bindOptions) {
      const scope = rootNode || documentObj;
      if (!scope || typeof scope.querySelectorAll !== 'function') {
        return [];
      }
      const settings = bindOptions || {};
      const selector = settings.selector || `[${settings.attributeName || DEFAULT_TEXT_ATTRIBUTE}]`;
      return Array.from(scope.querySelectorAll(selector))
        .map((node) => bind(node, null, settings))
        .filter(Boolean);
    }

    return {
      get element() {
        return ensureElement();
      },
      show,
      move,
      hide,
      bind,
      bindAll
    };
  }

  return Object.freeze({
    hostClassName: HOST_CLASS,
    createController,
    positionAtPoint
  });
});
