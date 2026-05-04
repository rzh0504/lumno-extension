(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoSuggestionNavigation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function scrollItemIntoView(container, item, options) {
    if (!container || !item || !item.isConnected) {
      return;
    }
    const config = options || {};
    const direction = config.direction === 'down' ? 'down' : 'up';
    const inset = Number.isFinite(Number(config.inset)) ? Number(config.inset) : 8;

    if (config.didWrap) {
      container.scrollTop = direction === 'down'
        ? 0
        : container.scrollHeight;
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    if (itemRect.top < containerRect.top + inset) {
      container.scrollTop -= (containerRect.top + inset) - itemRect.top;
    } else if (itemRect.bottom > containerRect.bottom - inset) {
      container.scrollTop += itemRect.bottom - (containerRect.bottom - inset);
    }
  }

  return {
    scrollItemIntoView
  };
});
