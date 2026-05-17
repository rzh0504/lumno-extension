(function() {
  function resolveElement(value) {
    if (typeof value === 'function') {
      return value();
    }
    return value || null;
  }

  function getOptionNumber(options, key, fallback) {
    const value = Number(options && options[key]);
    return Number.isFinite(value) ? value : fallback;
  }

  function createLayoutController(options) {
    options = options || {};
    const documentObj = options && options.documentObj ? options.documentObj : document;
    const windowObj = options && options.windowObj ? options.windowObj : window;
    const constants = (options && options.constants) || {};
    const minTopPx = getOptionNumber(constants, 'minTopPx', 28);
    const minBottomPx = getOptionNumber(constants, 'minBottomPx', 20);
    const upshiftRatio = getOptionNumber(constants, 'upshiftRatio', 0.06);
    const upshiftMinPx = getOptionNumber(constants, 'upshiftMinPx', 24);
    const upshiftMaxPx = getOptionNumber(constants, 'upshiftMaxPx', 80);
    const contentSectionsExtraUpshiftPx = getOptionNumber(constants, 'contentSectionsExtraUpshiftPx', 20);
    const emptySectionsExtraUpshiftPx = getOptionNumber(constants, 'emptySectionsExtraUpshiftPx', 96);
    const suggestionsBottomInsetPx = getOptionNumber(constants, 'suggestionsBottomInsetPx', 14);

    function getRoot() {
      return resolveElement(options.root);
    }

    function getSearchLayer() {
      return resolveElement(options.searchLayer);
    }

    function getInputParts() {
      return resolveElement(options.inputParts);
    }

    function getWordmarkContainer() {
      return resolveElement(options.wordmarkContainer);
    }

    function getBottomDock() {
      return resolveElement(options.bottomDock);
    }

    function getBookmarkSection() {
      return resolveElement(options.bookmarkSection);
    }

    function getRecentSection() {
      return resolveElement(options.recentSection);
    }

    function getSectionSafeCorridor() {
      return resolveElement(options.sectionSafeCorridor);
    }

    function getSuggestionsContainer() {
      return resolveElement(options.suggestionsContainer);
    }

    function getSuggestionsSurface() {
      return resolveElement(options.suggestionsSurface);
    }

    function getSuggestionsOutline() {
      return resolveElement(options.suggestionsOutline);
    }

    function applyWidthMode(config) {
      const searchMax = Math.max(720, Number((config && config.searchMaxWidth) || 720));
      const contentMax = Math.max(1040, Number((config && config.contentMaxWidth) || 1040));
      if (documentObj && documentObj.documentElement) {
        documentObj.documentElement.style.setProperty('--x-nt-search-max-width', `${searchMax}px`);
        documentObj.documentElement.style.setProperty('--x-nt-content-max-width', `${contentMax}px`);
      }
    }

    function getElementOuterHeight(element) {
      if (!element) {
        return 0;
      }
      const style = windowObj.getComputedStyle(element);
      if (!style || style.display === 'none') {
        return 0;
      }
      const rect = element.getBoundingClientRect();
      const marginTop = Number.parseFloat(style.marginTop) || 0;
      const marginBottom = Number.parseFloat(style.marginBottom) || 0;
      return Math.max(0, rect.height + marginTop + marginBottom);
    }

    function isSectionVisible(section) {
      if (!section) {
        return false;
      }
      const visibleAttr = typeof section.getAttribute === 'function'
        ? section.getAttribute('data-visible')
        : '';
      if (visibleAttr === 'true') {
        return true;
      }
      if (visibleAttr === 'false') {
        return false;
      }
      return section.style.getPropertyValue('display') !== 'none';
    }

    function getCssPixelValue(style, property) {
      if (!style || !property) {
        return 0;
      }
      const value = Number.parseFloat(style.getPropertyValue(property));
      return Number.isFinite(value) ? value : 0;
    }

    function getVerticalFrameHeight(element, options) {
      if (!element) {
        return 0;
      }
      const style = windowObj.getComputedStyle(element);
      if (!style || style.display === 'none') {
        return 0;
      }
      const includeMargin = Boolean(options && options.includeMargin);
      const boxFrame =
        getCssPixelValue(style, 'padding-top') +
        getCssPixelValue(style, 'padding-bottom') +
        getCssPixelValue(style, 'border-top-width') +
        getCssPixelValue(style, 'border-bottom-width');
      if (!includeMargin) {
        return boxFrame;
      }
      return boxFrame +
        getCssPixelValue(style, 'margin-top') +
        getCssPixelValue(style, 'margin-bottom');
    }

    function getElementMinHeight(element) {
      if (!element) {
        return 0;
      }
      const style = windowObj.getComputedStyle(element);
      if (!style || style.display === 'none') {
        return 0;
      }
      return getCssPixelValue(style, 'min-height');
    }

    function getSearchEntryBlockHeight() {
      const root = getRoot();
      const inputParts = getInputParts();
      const searchLayer = getSearchLayer();
      const rootFrameHeight = getVerticalFrameHeight(root);
      const rootMinHeight = getElementMinHeight(root);
      const inputHeight = inputParts && inputParts.container
        ? Math.max(0, Number(inputParts.container.getBoundingClientRect().height) || 0)
        : 44;
      const searchLayerFrameHeight = getVerticalFrameHeight(searchLayer, { includeMargin: true });
      const searchLayerMinHeight = getElementMinHeight(searchLayer);
      const searchLayerBaseHeight = Math.max(
        searchLayerMinHeight,
        inputHeight + searchLayerFrameHeight
      );
      return Math.max(55, rootMinHeight, rootFrameHeight + searchLayerBaseHeight);
    }

    function updateSearchEntryLayout() {
      const body = documentObj && documentObj.body;
      const root = getRoot();
      if (!body || !root) {
        return;
      }
      const viewportHeight = Math.max(0, windowObj.innerHeight || 0);
      if (viewportHeight <= 0) {
        return;
      }
      const bottomDock = getBottomDock();
      const bottomDockVisible = Boolean(
        bottomDock &&
        bottomDock.style.getPropertyValue('display') !== 'none'
      );
      let occupiedBottomHeight = 0;
      if (bottomDockVisible && bottomDock) {
        const dockRect = bottomDock.getBoundingClientRect();
        occupiedBottomHeight = Math.max(0, Number(dockRect && dockRect.height) || 0);
      }
      const availableHeight = Math.max(0, viewportHeight - occupiedBottomHeight);
      const wordmarkOuterHeight = getElementOuterHeight(getWordmarkContainer());
      const searchBlockHeight = wordmarkOuterHeight + getSearchEntryBlockHeight();
      const bookmarkSection = getBookmarkSection();
      const recentSection = getRecentSection();
      const bookmarkVisible = isSectionVisible(bookmarkSection);
      const recentVisible = isSectionVisible(recentSection);
      const extraUpshift = (!bookmarkVisible && !recentVisible)
        ? emptySectionsExtraUpshiftPx
        : contentSectionsExtraUpshiftPx;
      const upwardOffset = Math.min(
        upshiftMaxPx,
        Math.max(upshiftMinPx, availableHeight * upshiftRatio)
      ) + extraUpshift;
      const maxTop = Math.max(minTopPx, availableHeight - searchBlockHeight - minBottomPx);
      let targetTop = ((availableHeight - searchBlockHeight) / 2) - upwardOffset;
      if (!Number.isFinite(targetTop)) {
        targetTop = minTopPx;
      }
      targetTop = Math.max(minTopPx, Math.min(maxTop, targetTop));
      body.style.setProperty('padding-top', `${Math.round(targetTop)}px`, 'important');
    }

    function updateBottomDockLayout(callbacks) {
      const body = documentObj && documentObj.body;
      const bookmarkSection = getBookmarkSection();
      const recentSection = getRecentSection();
      const bottomDock = getBottomDock();
      const sectionSafeCorridor = getSectionSafeCorridor();
      if (!body || !bookmarkSection || !recentSection || !bottomDock || !sectionSafeCorridor) {
        return;
      }
      const bottomDockMaxHeight = Math.max(0, windowObj.innerHeight - 240);
      const bookmarkVisible = isSectionVisible(bookmarkSection);
      const recentVisible = isSectionVisible(recentSection);
      if (!recentVisible && callbacks && typeof callbacks.onRecentHidden === 'function') {
        callbacks.onRecentHidden();
      }
      body.classList.remove('x-nt-stack-layout');
      body.classList.add('x-nt-bottom-layout');
      body.classList.toggle('x-nt-no-bookmarks', !bookmarkVisible);
      sectionSafeCorridor.style.setProperty('display', (bookmarkVisible && recentVisible) ? 'block' : 'none', 'important');
      bottomDock.style.setProperty('max-height', `${bottomDockMaxHeight}px`, 'important');
      bottomDock.style.setProperty('display', (bookmarkVisible || recentVisible) ? 'flex' : 'none', 'important');
      updateSearchEntryLayout();
      updateSuggestionsFloatingLayout();
    }

    function setSuggestionsVisible(visible) {
      const shouldShow = Boolean(visible);
      const root = getRoot();
      const searchLayer = getSearchLayer();
      const inputParts = getInputParts();
      const suggestionsContainer = getSuggestionsContainer();
      const suggestionsSurface = getSuggestionsSurface();
      const suggestionsOutline = getSuggestionsOutline();
      if (!suggestionsContainer) {
        return;
      }
      if (root) {
        if (shouldShow) {
          root.style.setProperty('z-index', '22');
          root.style.setProperty('background', 'transparent');
          root.style.setProperty('border-color', 'transparent');
          root.style.setProperty('box-shadow', 'none');
          root.style.setProperty('backdrop-filter', 'none');
          root.style.setProperty('-webkit-backdrop-filter', 'none');
        } else {
          root.style.removeProperty('z-index');
          root.style.removeProperty('background');
          root.style.removeProperty('border-color');
          root.style.removeProperty('box-shadow');
          root.style.removeProperty('backdrop-filter');
          root.style.removeProperty('-webkit-backdrop-filter');
        }
      }
      if (searchLayer) {
        searchLayer.style.setProperty('z-index', shouldShow ? '20' : '12');
        searchLayer.style.setProperty('border-radius', shouldShow ? '24px 24px 0 0' : '24px');
        searchLayer.style.setProperty('background', shouldShow
          ? 'transparent'
          : 'var(--x-nt-input-bg, rgba(255, 255, 255, 0.9))');
        searchLayer.style.setProperty('border', shouldShow
          ? '1px solid transparent'
          : '1px solid var(--x-nt-input-border, rgba(0, 0, 0, 0.06))');
        searchLayer.style.setProperty('box-shadow', shouldShow
          ? 'none'
          : 'var(--x-nt-input-shadow, 0 20px 60px rgba(0, 0, 0, 0.08))');
      }
      if (inputParts && inputParts.container) {
        inputParts.container.style.setProperty('border-radius', '0');
        inputParts.container.style.setProperty('border', 'none');
        inputParts.container.style.setProperty('border-bottom', 'none');
        inputParts.container.style.setProperty('box-shadow', 'none');
        inputParts.container.style.setProperty('background', 'transparent');
        inputParts.container.style.setProperty('z-index', '2');
      }
      if (inputParts && inputParts.divider) {
        inputParts.divider.style.setProperty('display', 'none');
        inputParts.divider.style.setProperty('opacity', '0');
      }
      if (shouldShow) {
        updateSuggestionsFloatingLayout();
      }
      suggestionsContainer.setAttribute('data-visible', shouldShow ? 'true' : 'false');
      if (suggestionsSurface) {
        suggestionsSurface.setAttribute('data-visible', shouldShow ? 'true' : 'false');
      }
      if (suggestionsOutline) {
        suggestionsOutline.setAttribute('data-visible', shouldShow ? 'true' : 'false');
      }
      if (shouldShow) {
        if (typeof windowObj.requestAnimationFrame === 'function') {
          windowObj.requestAnimationFrame(updateSuggestionsFloatingLayout);
        } else {
          windowObj.setTimeout(updateSuggestionsFloatingLayout, 0);
        }
      }
    }

    function updateSuggestionsFloatingLayout() {
      const suggestionsContainer = getSuggestionsContainer();
      const inputParts = getInputParts();
      if (!suggestionsContainer || !inputParts || !inputParts.container) {
        return;
      }
      const searchLayer = getSearchLayer();
      const root = getRoot();
      const suggestionsSurface = getSuggestionsSurface();
      const suggestionsOutline = getSuggestionsOutline();
      const anchor = searchLayer || inputParts.container;
      const anchorRect = anchor.getBoundingClientRect();
      const rootRect = root ? root.getBoundingClientRect() : anchorRect;
      const visualViewport = windowObj.visualViewport;
      const viewportBottom = visualViewport && Number.isFinite(visualViewport.height)
        ? visualViewport.offsetTop + visualViewport.height
        : Math.max(0, windowObj.innerHeight || 0);
      const dropdownTopViewport = anchorRect.bottom - 1;
      const left = Math.round(anchorRect.left);
      const top = Math.round(dropdownTopViewport);
      const width = Math.max(0, Math.round(anchorRect.width));
      const availableWithoutInset = Math.max(0, viewportBottom - dropdownTopViewport);
      const available = Math.max(0, availableWithoutInset - suggestionsBottomInsetPx);
      const availableFitHeight = Math.ceil(availableWithoutInset);
      const contentHeight = Math.ceil(Math.max(0, Number(suggestionsContainer.scrollHeight) || 0));
      const maxHeight = contentHeight > 0 && contentHeight <= availableFitHeight
        ? contentHeight
        : Math.floor(available);
      suggestionsContainer.style.setProperty('left', `${left}px`);
      suggestionsContainer.style.setProperty('top', `${top}px`);
      suggestionsContainer.style.setProperty('width', `${width}px`);
      suggestionsContainer.style.setProperty('max-height', `${maxHeight}px`);
      if (suggestionsSurface) {
        const suggestionsRect = suggestionsContainer.getBoundingClientRect();
        const surfaceLeft = Math.round(rootRect.left);
        const surfaceTop = Math.round(rootRect.top);
        const surfaceWidth = Math.max(0, Math.round(rootRect.width));
        const surfaceBottom = Math.max(rootRect.bottom, suggestionsRect.bottom);
        const surfaceHeight = Math.max(0, Math.round(surfaceBottom - rootRect.top));
        suggestionsSurface.style.setProperty('left', `${surfaceLeft}px`);
        suggestionsSurface.style.setProperty('top', `${surfaceTop}px`);
        suggestionsSurface.style.setProperty('width', `${surfaceWidth}px`);
        suggestionsSurface.style.setProperty('height', `${surfaceHeight}px`);
        if (suggestionsOutline) {
          suggestionsOutline.style.setProperty('left', `${surfaceLeft}px`);
          suggestionsOutline.style.setProperty('top', `${surfaceTop}px`);
          suggestionsOutline.style.setProperty('width', `${surfaceWidth}px`);
          suggestionsOutline.style.setProperty('height', `${surfaceHeight}px`);
        }
      }
    }

    return {
      applyWidthMode,
      updateBottomDockLayout,
      updateSearchEntryLayout,
      setSuggestionsVisible,
      updateSuggestionsFloatingLayout
    };
  }

  globalThis.LumnoNewtabLayout = {
    createLayoutController
  };
})();
