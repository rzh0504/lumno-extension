(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoFeatureHints = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const FEATURE_HINTS = Object.freeze({
    NEWTAB_WALLPAPER: Object.freeze({
      id: 'newtab-wallpaper',
      introducedIn: '0.9.9',
      surface: 'newtab',
      placement: 'bottom-right wallpaper control',
      className: 'x-lumno-feature-hint--newtab-wallpaper',
      arrowSide: 'bottom',
      arrowAlign: 'end',
      badgeIcon: 'ri-asterisk',
      badgeKey: 'newtab_wallpaper_feature_hint_badge',
      badgeFallback: 'New',
      textKey: 'newtab_wallpaper_feature_hint_text',
      textFallback: 'New Tab now supports changing wallpaper!',
      closeLabelKey: 'newtab_wallpaper_feature_hint_close',
      closeLabelFallback: 'Dismiss wallpaper tip'
    })
  });

  const FEATURE_HINT_ARROW_SIDES = Object.freeze({
    top: true,
    right: true,
    bottom: true,
    left: true
  });

  const FEATURE_HINT_ARROW_ALIGNS = Object.freeze({
    start: true,
    center: true,
    end: true
  });

  const FEATURE_HINTS_BY_ID = Object.freeze(Object.keys(FEATURE_HINTS).reduce((map, key) => {
    const hint = FEATURE_HINTS[key];
    map[hint.id] = hint;
    return map;
  }, {}));

  function getMessage(t, key, fallback) {
    return typeof t === 'function' ? t(key, fallback) : (fallback || '');
  }

  function getDefaultRiSvg(id, sizeClass) {
    const size = sizeClass || 'ri-size-16';
    return '<i class="ri-icon ' + size + ' ' + id + '" aria-hidden="true"></i>';
  }

  function getDomIdPart(id) {
    return String(id || 'feature-hint').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'feature_hint';
  }

  function normalizeFeatureHintValue(value, allowedValues, fallback) {
    const normalized = String(value || '').toLowerCase();
    return Object.prototype.hasOwnProperty.call(allowedValues, normalized) ? normalized : fallback;
  }

  function normalizeArrowSide(value) {
    return normalizeFeatureHintValue(value, FEATURE_HINT_ARROW_SIDES, 'bottom');
  }

  function normalizeArrowAlign(value) {
    return normalizeFeatureHintValue(value, FEATURE_HINT_ARROW_ALIGNS, 'center');
  }

  function getFeatureHint(definition) {
    if (!definition) {
      return null;
    }
    if (typeof definition === 'string') {
      return FEATURE_HINTS_BY_ID[definition] || FEATURE_HINTS[definition] || null;
    }
    return definition;
  }

  function createFeatureHint(options) {
    const config = options || {};
    const documentObj = config.documentObj || (typeof document !== 'undefined' ? document : null);
    const definition = getFeatureHint(config.definition || config.id || config.hint);
    if (!definition || !documentObj || typeof documentObj.createElement !== 'function') {
      return null;
    }
    const t = typeof config.t === 'function' ? config.t : null;
    const getRiSvg = typeof config.getRiSvg === 'function' ? config.getRiSvg : getDefaultRiSvg;
    const idPart = getDomIdPart(definition.id);
    const arrowSide = normalizeArrowSide(config.arrowSide || definition.arrowSide);
    const arrowAlign = normalizeArrowAlign(config.arrowAlign || definition.arrowAlign);
    const element = documentObj.createElement('span');
    const text = documentObj.createElement('span');
    const badge = documentObj.createElement('span');
    const badgeIcon = documentObj.createElement('span');
    const badgeText = documentObj.createElement('span');
    const closeButton = documentObj.createElement('button');
    let dismissed = false;

    element.id = config.elementId || `_x_lumno_feature_hint_${idPart}_2026_unique_`;
    element.className = ['x-lumno-feature-hint', definition.className || ''].filter(Boolean).join(' ');
    element.setAttribute('role', 'note');
    element.setAttribute('data-feature-hint-id', definition.id);
    element.setAttribute('data-feature-hint-surface', definition.surface || '');
    element.setAttribute('data-feature-hint-placement', definition.placement || '');
    element.setAttribute('data-feature-hint-version', definition.introducedIn || '');
    element.setAttribute('data-arrow-side', arrowSide);
    element.setAttribute('data-arrow-align', arrowAlign);
    element.setAttribute('data-visible', 'true');
    element.setAttribute('data-dismissed', 'false');
    element.setAttribute('aria-hidden', 'false');

    badge.className = 'x-lumno-feature-hint__badge';
    badgeIcon.className = 'x-lumno-feature-hint__badge-icon';
    badgeText.className = 'x-lumno-feature-hint__badge-text';
    if (definition.badgeIcon) {
      badgeIcon.innerHTML = getRiSvg(definition.badgeIcon, 'ri-size-10');
      badge.appendChild(badgeIcon);
    }
    badge.appendChild(badgeText);

    text.id = config.textId || `_x_lumno_feature_hint_${idPart}_text_2026_unique_`;
    text.className = 'x-lumno-feature-hint__text';

    closeButton.type = 'button';
    closeButton.className = 'x-lumno-feature-hint__close';
    closeButton.innerHTML = getRiSvg('ri-close-line', 'ri-size-12');
    closeButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      controller.dismiss();
    });

    element.appendChild(badge);
    element.appendChild(text);
    element.appendChild(closeButton);

    function syncVisibility(visible) {
      const nextVisible = Boolean(visible) && !dismissed;
      element.setAttribute('data-visible', nextVisible ? 'true' : 'false');
      element.setAttribute('aria-hidden', nextVisible ? 'false' : 'true');
    }

    const controller = {
      definition,
      element,
      textId: text.id,
      dismiss() {
        dismissed = true;
        element.setAttribute('data-dismissed', 'true');
        syncVisibility(false);
        if (typeof config.onDismiss === 'function') {
          config.onDismiss(definition);
        }
      },
      isDismissed() {
        return dismissed;
      },
      setVisible: syncVisibility,
      updateLanguage() {
        const badgeLabel = getMessage(t, definition.badgeKey, definition.badgeFallback);
        const textLabel = getMessage(t, definition.textKey, definition.textFallback);
        const closeLabel = getMessage(t, definition.closeLabelKey, definition.closeLabelFallback);
        badge.setAttribute('aria-label', badgeLabel);
        badgeText.textContent = badgeLabel;
        text.textContent = textLabel;
        closeButton.setAttribute('aria-label', closeLabel);
      }
    };

    controller.updateLanguage();
    return controller;
  }

  return Object.freeze({
    FEATURE_HINTS,
    getFeatureHint,
    normalizeArrowSide,
    normalizeArrowAlign,
    listFeatureHints() {
      return Object.keys(FEATURE_HINTS).map((key) => FEATURE_HINTS[key]);
    },
    createFeatureHint
  });
});
