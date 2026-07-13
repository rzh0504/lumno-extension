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

  function getBookmarksSignature(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return '';
    }
    return items.map((item, index) => {
      const id = item && item.id ? String(item.id) : '';
      const type = item && item.type ? String(item.type) : '';
      const title = item && item.title ? String(item.title) : '';
      const url = item && item.url ? String(item.url) : '';
      const themeUrl = item && item.themeUrl ? String(item.themeUrl) : '';
      return `${index}::${id}::${type}::${title}::${url}::${themeUrl}`;
    }).join('\n');
  }

  function getBookmarkCacheKey(item) {
    if (!item) {
      return '';
    }
    const id = item.id ? String(item.id) : '';
    const type = item.type ? String(item.type) : '';
    const title = item.title ? String(item.title) : '';
    const url = item.url ? String(item.url) : '';
    const themeUrl = item.themeUrl ? String(item.themeUrl) : '';
    return `${id}::${type}::${title}::${url}::${themeUrl}`;
  }

  function applyBookmarkCardMetadata(card, item, index) {
    if (!card || !item || typeof card.setAttribute !== 'function') {
      return;
    }
    const bookmarkId = item.id ? String(item.id) : '';
    const parentId = item.parentId ? String(item.parentId) : '';
    const itemIndex = Number(item.index);
    card.draggable = false;
    card._xBookmarkItem = item;
    card._xBookmarkPageIndex = Number.isFinite(index) ? index : 0;
    card.setAttribute('data-bookmark-id', bookmarkId);
    card.setAttribute('data-bookmark-type', item.type ? String(item.type) : '');
    card.setAttribute('data-bookmark-parent-id', parentId);
    card.setAttribute('data-bookmark-index', Number.isFinite(itemIndex) ? String(itemIndex) : '');
    card.setAttribute(
      'data-bookmark-draggable',
      bookmarkId && parentId && Number.isFinite(itemIndex) ? 'true' : 'false'
    );
  }

  function createBookmarksView(options) {
    const documentObj = getOption(options, 'documentObj', root.document);
    const windowObj = getOption(options, 'windowObj', root.window);
    const grid = getOption(options, 'grid', null);
    const cards = Array.isArray(getOption(options, 'cards', null))
      ? getOption(options, 'cards', null)
      : [];
    const cardElementCache = getOption(options, 'cardElementCache', new Map());
    const t = getFunction(options, 't', function(key, fallback) {
      return fallback || key || '';
    });
    const formatMessage = getFunction(options, 'formatMessage', function(key, fallback, values) {
      let text = fallback || key || '';
      Object.keys(values || {}).forEach((name) => {
        text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), values[name]);
      });
      return text;
    });
    const sanitizeDisplayText = getFunction(options, 'sanitizeDisplayText', function(value) {
      return String(value || '');
    });
    const getHostFromUrl = getFunction(options, 'getHostFromUrl', function() {
      return '';
    });
    const getSiteDisplayName = getFunction(options, 'getSiteDisplayName', function(host, title) {
      return title || host || '';
    });
    const getUrlDisplay = getFunction(options, 'getUrlDisplay', function(url) {
      return url || '';
    });
    const getRiSvg = getFunction(options, 'getRiSvg', function() {
      return '';
    });
    const getFigmaFolderSvg = getFunction(options, 'getFigmaFolderSvg', function() {
      return '';
    });
    const initFolderPathMorph = getFunction(options, 'initFolderPathMorph');
    const playFolderPathMorph = getFunction(options, 'playFolderPathMorph');
    const stableHashCode = getFunction(options, 'stableHashCode', function(value) {
      const text = String(value || '');
      let hash = 0;
      for (let i = 0; i < text.length; i += 1) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    });
    const normalizeHost = getFunction(options, 'normalizeHost', function(host) {
      return host || '';
    });
    const attachFaviconWithFallbacks = getFunction(options, 'attachFaviconWithFallbacks');
    const isLocalNetworkHost = getFunction(options, 'isLocalNetworkHost', function() {
      return false;
    });
    const getChromeFaviconUrl = getFunction(options, 'getChromeFaviconUrl', function() {
      return '';
    });
    const getBrowserPageFaviconUrl = getFunction(options, 'getBrowserPageFaviconUrl', function() {
      return '';
    });
    const getImmediateThemeForSuggestion = getFunction(options, 'getImmediateThemeForSuggestion', function() {
      return null;
    });
    const queueThemeForTarget = getFunction(options, 'queueThemeForTarget');
    const applyCardTheme = getFunction(options, 'applyCardTheme');
    const shouldDelayHoverFromRecent = getFunction(options, 'shouldDelayHoverFromRecent', function() {
      return false;
    });
    const shouldSuppressHover = getFunction(options, 'shouldSuppressHover', function() {
      return false;
    });
    const bindCursorTooltip = getFunction(options, 'bindCursorTooltip');
    const hideCursorTooltip = getFunction(options, 'hideCursorTooltip');
    const openFolder = getFunction(options, 'openFolder');
    const openFolderMenu = getFunction(options, 'openFolderMenu');
    const navigateToUrl = getFunction(options, 'navigateToUrl');
    const openUrl = getFunction(options, 'openUrl', function(url) {
      navigateToUrl(url);
    });

    function shouldOpenUrlInBackground(event) {
      return Boolean(event && (event.metaKey || event.ctrlKey || Number(event.button) === 1));
    }

    function openBookmarkUrl(url, event) {
      openUrl(url, {
        openInBackgroundTab: shouldOpenUrlInBackground(event)
      });
    }

    function clear() {
      hideCursorTooltip();
      if (grid) {
        grid.innerHTML = '';
      }
      cards.length = 0;
    }

    function appendEmptyFolderState() {
      if (!grid || !documentObj) {
        return;
      }
      const emptyState = documentObj.createElement('div');
      emptyState.className = 'x-nt-bookmark-empty';
      emptyState.innerHTML = `${getRiSvg('ri-file-3-line', 'ri-size-16')}<span>${t('bookmarks_empty_folder', '暂无内容')}</span>`;
      grid.appendChild(emptyState);
    }

    function syncCardElementCache() {
      const MAX_CACHE_SIZE = 1500;
      if (!cardElementCache || cardElementCache.size <= MAX_CACHE_SIZE) {
        return;
      }
      const keys = Array.from(cardElementCache.keys());
      const removeCount = Math.max(1, cardElementCache.size - MAX_CACHE_SIZE);
      for (let i = 0; i < removeCount && i < keys.length; i += 1) {
        cardElementCache.delete(keys[i]);
      }
    }

    function isBookmarkTitleTruncated(titleElement) {
      if (!titleElement) {
        return false;
      }
      const scrollWidth = Number(titleElement.scrollWidth);
      const clientWidth = Number(titleElement.clientWidth);
      return Number.isFinite(scrollWidth) &&
        Number.isFinite(clientWidth) &&
        clientWidth > 0 &&
        scrollWidth > clientWidth + 1;
    }

    function getBrowserFaviconCandidateForBookmark(url, host) {
      const pageUrl = String(url || '').trim();
      if (!pageUrl) {
        return '';
      }
      if (!/^https?:\/\//i.test(pageUrl)) {
        return /^[a-z][a-z0-9+.-]*:/i.test(pageUrl)
          ? getChromeFaviconUrl(pageUrl)
          : '';
      }
      return host && isLocalNetworkHost(host)
        ? getChromeFaviconUrl(pageUrl)
        : '';
    }

    function getPrimaryFaviconCandidateForBookmark(url) {
      return getBrowserPageFaviconUrl(url);
    }

    function buildCard(item, index, state) {
      if (!item || (!item.url && item.type !== 'folder') || !documentObj) {
        return null;
      }
      const menuMode = Boolean(state && state.menuMode);
      const isFolder = item.type === 'folder';
      const themeUrl = item.themeUrl || item.url || '';
      const host = item.host || getHostFromUrl(themeUrl) || '';
      const siteName = getSiteDisplayName(host, item.title);
      const titleText = item.title || siteName || (item.url ? getUrlDisplay(item.url) : t('bookmarks_heading', '书签'));
      const card = documentObj.createElement('button');
      card.type = 'button';
      card.className = 'x-nt-bookmark-card';
      card.draggable = false;
      if (isFolder) {
        card.classList.add('x-nt-bookmark-card--folder');
        if (menuMode) {
          card.setAttribute('aria-haspopup', 'menu');
          card.setAttribute('aria-expanded', 'false');
        }
      }
      card.title = titleText;
      card._xTitleText = titleText;
      card.setAttribute('data-cursor-tooltip', titleText);
      card.setAttribute('aria-label', formatMessage('open_prefix', '打开 {title}', {
        title: titleText
      }));
      card._xNoThemeTint = isFolder;

      const themeSuggestion = { type: isFolder ? 'bookmark' : 'bookmark', url: themeUrl, title: titleText };
      const immediateTheme = getImmediateThemeForSuggestion(themeSuggestion);
      card._xTheme = immediateTheme;
      card._xHost = host;
      applyCardTheme(card, immediateTheme, host);
      if (themeUrl) {
        queueThemeForTarget(card, themeSuggestion, (theme) => {
          if (!card.isConnected) {
            return;
          }
          card._xTheme = theme || card._xTheme;
          applyCardTheme(card, card._xTheme, host);
        }, { priority: index < 4 ? 0 : 2 });
      }

      let icon = null;
      let folderIcon = null;
      if (isFolder) {
        folderIcon = documentObj.createElement('span');
        folderIcon.className = 'x-nt-bookmark-icon x-nt-bookmark-icon--figma';
        folderIcon.innerHTML = getFigmaFolderSvg(`${item.id || 'folder'}-${index}`);
        folderIcon.setAttribute('aria-hidden', 'true');
        initFolderPathMorph(folderIcon);
        icon = folderIcon;
      } else {
        const favicon = documentObj.createElement('img');
        favicon.className = 'x-nt-bookmark-icon';
        favicon.alt = siteName || t('site_icon_alt', '站点');
        favicon.loading = index < 4 ? 'eager' : 'lazy';
        if (index < 4) {
          favicon.fetchPriority = 'high';
        }
        favicon.draggable = false;
        favicon.setAttribute('draggable', 'false');
        attachFaviconWithFallbacks(favicon, item.url, host, {
          primaryUrl: getPrimaryFaviconCandidateForBookmark(item.url),
          browserUrl: getBrowserFaviconCandidateForBookmark(item.url, host)
        });
        icon = favicon;
      }

      const title = documentObj.createElement('span');
      title.className = 'x-nt-bookmark-title';
      title.textContent = sanitizeDisplayText(titleText);

      card.appendChild(icon);
      card.appendChild(title);
      if (isFolder && Array.isArray(item.previewUrls) && item.previewUrls.length > 0) {
        const previewWrap = documentObj.createElement('span');
        previewWrap.className = 'x-nt-folder-preview';
        const maxPreview = Math.min(4, item.previewUrls.length);
        for (let i = 0; i < maxPreview; i += 1) {
          const url = item.previewUrls[i];
          if (!url) {
            continue;
          }
          let previewHost = '';
          try {
            previewHost = normalizeHost(new URL(url).hostname);
          } catch (error) {
            previewHost = '';
          }
          const previewFavicon = documentObj.createElement('img');
          previewFavicon.className = 'x-nt-folder-preview-favicon';
          const rotationSeed = stableHashCode(`${url}|${i}|${item.id || ''}`);
          const rotationDeg = ((rotationSeed % 13) - 6) * 0.5;
          previewFavicon.style.setProperty('--x-nt-folder-favicon-rot', `${rotationDeg.toFixed(2)}deg`);
          previewFavicon.style.zIndex = String(10 + i);
          previewFavicon.alt = '';
          previewFavicon.loading = 'eager';
          previewFavicon.decoding = 'async';
          previewFavicon.setAttribute('aria-hidden', 'true');
          previewFavicon.draggable = false;
          previewFavicon.setAttribute('draggable', 'false');
          attachFaviconWithFallbacks(previewFavicon, url, previewHost, {
            primaryUrl: getPrimaryFaviconCandidateForBookmark(url),
            browserUrl: getBrowserFaviconCandidateForBookmark(url, previewHost)
          });
          previewWrap.appendChild(previewFavicon);
        }
        card.appendChild(previewWrap);
      }
      let hoverIntentTimer = null;
      let isHoverVisualActive = false;
      let isMenuVisualLocked = false;
      const clearHoverIntentTimer = () => {
        if (hoverIntentTimer !== null && windowObj) {
          windowObj.clearTimeout(hoverIntentTimer);
          hoverIntentTimer = null;
        }
      };
      const shouldKeepMenuVisualActive = () => Boolean(
        isFolder &&
        menuMode &&
        (isMenuVisualLocked || card.getAttribute('aria-expanded') === 'true')
      );
      const isHoverSuppressed = (event) => shouldSuppressHover(card, event) === true;
      const setHoverVisualActive = (active) => {
        if (isHoverVisualActive === active) {
          return;
        }
        isHoverVisualActive = active;
        card.classList.toggle('x-nt-bookmark-card--hover', active);
        if (folderIcon) {
          playFolderPathMorph(folderIcon, active);
        }
      };
      const setMenuVisualLocked = (active) => {
        const nextActive = Boolean(active);
        if (isMenuVisualLocked === nextActive) {
          if (nextActive) {
            setHoverVisualActive(true);
          }
          return;
        }
        isMenuVisualLocked = nextActive;
        clearHoverIntentTimer();
        setHoverVisualActive(nextActive);
      };
      const deactivateBookmarkHoverVisual = () => {
        clearHoverIntentTimer();
        if (shouldKeepMenuVisualActive()) {
          setHoverVisualActive(true);
          return;
        }
        setHoverVisualActive(false);
      };
      card._xDeactivateBookmarkHoverVisual = deactivateBookmarkHoverVisual;
      if (isFolder && menuMode) {
        card._xSetBookmarkMenuVisualActive = setMenuVisualLocked;
      }
      const activateBookmarkHoverVisual = (event) => {
        if (isHoverSuppressed(event)) {
          clearHoverIntentTimer();
          setHoverVisualActive(false);
          return;
        }
        const pointerType = event && typeof event.pointerType === 'string' ? event.pointerType : '';
        if (!shouldDelayHoverFromRecent(pointerType)) {
          clearHoverIntentTimer();
          setHoverVisualActive(true);
          return;
        }
        clearHoverIntentTimer();
        hoverIntentTimer = windowObj.setTimeout(() => {
          hoverIntentTimer = null;
          setHoverVisualActive(true);
        }, getOption(options, 'hoverDelayFromRecentMs', 180));
      };
      card.addEventListener('pointerenter', (event) => {
        activateBookmarkHoverVisual(event);
      });
      card.addEventListener('pointerleave', () => {
        deactivateBookmarkHoverVisual();
      });
      card.addEventListener('pointercancel', () => {
        deactivateBookmarkHoverVisual();
      });
      card.addEventListener('focus', () => {
        clearHoverIntentTimer();
        setHoverVisualActive(true);
      });
      card.addEventListener('blur', () => {
        deactivateBookmarkHoverVisual();
      });
      card.addEventListener('pointerdown', () => {
        clearHoverIntentTimer();
        if (isHoverSuppressed()) {
          setHoverVisualActive(false);
        }
      });
      card.addEventListener('dragstart', (event) => {
        event.preventDefault();
      });
      bindCursorTooltip(card, () => card._xTitleText || titleText, {
        maxWidth: 460,
        shouldShow: () => isBookmarkTitleTruncated(title)
      });
      card.addEventListener('click', (event) => {
        if (card._xBookmarkSuppressClick) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        hideCursorTooltip();
        if (isFolder) {
          if (menuMode) {
            setMenuVisualLocked(true);
            openFolderMenu(item, card);
            return;
          }
          openFolder(item.id);
          return;
        }
        openBookmarkUrl(item.url, event);
      });
      card.addEventListener('auxclick', (event) => {
        if (isFolder || !event || Number(event.button) !== 1) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        hideCursorTooltip();
        openBookmarkUrl(item.url, event);
      });
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (isFolder) {
            if (menuMode) {
              setMenuVisualLocked(true);
              openFolderMenu(item, card);
              return;
            }
            openFolder(item.id);
            return;
          }
          openBookmarkUrl(item.url, event);
        }
      });
      return card;
    }

    function render(items, state) {
      const normalizedItems = Array.isArray(items) ? items : [];
      const previousSignature = state && typeof state.signature === 'string' ? state.signature : '';
      const folderId = state && state.folderId ? String(state.folderId) : '';
      const rootFolderId = state && state.rootFolderId ? String(state.rootFolderId) : '1';
      const viewMode = state && state.viewMode === 'list' ? 'list' : 'folder';
      const menuMode = Boolean(state && state.menuMode);
      const isAtRoot = String(folderId || '') === String(rootFolderId || '1');
      const nextSignature = `${folderId}##${viewMode}##${getBookmarksSignature(normalizedItems)}`;
      if (nextSignature === previousSignature) {
        if (normalizedItems.length === 0 && !isAtRoot) {
          clear();
          appendEmptyFolderState();
        }
        return {
          changed: false,
          count: normalizedItems.length,
          isAtRoot,
          signature: nextSignature
        };
      }
      clear();
      if (normalizedItems.length === 0) {
        if (!isAtRoot) {
          appendEmptyFolderState();
        }
        return {
          changed: true,
          count: 0,
          isAtRoot,
          signature: nextSignature
        };
      }
      normalizedItems.forEach((item, index) => {
        const cacheKey = `${viewMode}::${getBookmarkCacheKey(item)}`;
        let card = cacheKey && cardElementCache ? cardElementCache.get(cacheKey) : null;
        if (!card) {
          card = buildCard(item, index, { viewMode, menuMode });
          if (card && cacheKey && cardElementCache) {
            cardElementCache.set(cacheKey, card);
          }
        }
        if (card && grid) {
          applyBookmarkCardMetadata(card, item, index);
          applyCardTheme(card, card._xTheme, card._xHost || '');
          cards.push(card);
          grid.appendChild(card);
        }
      });
      return {
        changed: true,
        count: normalizedItems.length,
        isAtRoot,
        signature: nextSignature
      };
    }

    return {
      appendEmptyFolderState,
      buildCard,
      clear,
      render,
      getSignature: getBookmarksSignature,
      getCacheKey: getBookmarkCacheKey,
      syncCardElementCache,
      getCards: function() {
        return cards;
      }
    };
  }

  root.LumnoNewtabBookmarksView = {
    createBookmarksView,
    getBookmarkCacheKey,
    getBookmarksSignature
  };
})(globalThis);
