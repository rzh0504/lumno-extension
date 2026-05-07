(function(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoNewtabToast = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  function createToastController(toastElement, options) {
    const opts = options && typeof options === 'object' ? options : {};
    const win = opts.windowObj || root.window || root;
    const setTimer = typeof win.setTimeout === 'function'
      ? win.setTimeout.bind(win)
      : setTimeout;
    const clearTimer = typeof win.clearTimeout === 'function'
      ? win.clearTimeout.bind(win)
      : clearTimeout;
    const defaultDuration = Number.isFinite(Number(opts.duration))
      ? Math.max(0, Number(opts.duration))
      : 2200;
    let timer = null;

    function hide() {
      if (!toastElement) {
        return;
      }
      if (timer) {
        clearTimer(timer);
        timer = null;
      }
      toastElement.setAttribute('data-show', 'false');
    }

    function show(message, showOptions) {
      const showOpts = showOptions && typeof showOptions === 'object' ? showOptions : {};
      if (!toastElement || !message) {
        return;
      }
      hide();
      toastElement.textContent = String(message);
      if (showOpts.error) {
        toastElement.style.setProperty('background', opts.errorBackground || 'rgba(153, 27, 27, 0.92)');
      } else {
        toastElement.style.removeProperty('background');
      }
      toastElement.setAttribute('data-show', 'true');
      const duration = Number.isFinite(Number(showOpts.duration))
        ? Math.max(0, Number(showOpts.duration))
        : defaultDuration;
      if (duration > 0) {
        timer = setTimer(() => {
          timer = null;
          if (toastElement) {
            toastElement.setAttribute('data-show', 'false');
          }
        }, duration);
      }
    }

    function destroy() {
      hide();
      toastElement = null;
    }

    return Object.freeze({
      show,
      hide,
      destroy
    });
  }

  return Object.freeze({
    createToastController
  });
});
