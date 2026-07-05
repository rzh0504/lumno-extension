(function(root) {
  'use strict';

  const api = {
    createSuggestionsView
  };

  function noop() {}

  function escapeRegExp(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function createSuggestionsView(options) {
    const config = options || {};
    const documentRef = config.document || root.document;
    const container = config.container || null;
    const items = Array.isArray(config.items) ? config.items : [];
    const t = typeof config.t === 'function' ? config.t : function(key, fallback) {
      return fallback || key || '';
    };
    const formatMessage = typeof config.formatMessage === 'function'
      ? config.formatMessage
      : function(key, fallback) {
        return t(key, fallback);
      };
    const actionModel = config.actionModel || root.LumnoSuggestionActionModel || {};
    const getRiSvg = typeof config.getRiSvg === 'function'
      ? config.getRiSvg
      : function() {
        return '';
      };
    const sanitizeDisplayText = typeof config.sanitizeDisplayText === 'function'
      ? config.sanitizeDisplayText
      : function(value) {
        return String(value || '');
      };
    const formatTabRankDebugText = typeof config.formatTabRankDebugText === 'function'
      ? config.formatTabRankDebugText
      : function() {
        return '';
      };
    const isTabRankScoreDebugEnabled = typeof config.isTabRankScoreDebugEnabled === 'function'
      ? config.isTabRankScoreDebugEnabled
      : function() {
        return false;
      };
    const shouldBlockFaviconForHost = typeof config.shouldBlockFaviconForHost === 'function'
      ? config.shouldBlockFaviconForHost
      : function() {
        return false;
      };
    const isLocalNetworkHost = typeof config.isLocalNetworkHost === 'function'
      ? config.isLocalNetworkHost
      : shouldBlockFaviconForHost;
    const getChromeFaviconUrl = typeof config.getChromeFaviconUrl === 'function'
      ? config.getChromeFaviconUrl
      : function() {
        return '';
      };
    const getHostFromUrl = typeof config.getHostFromUrl === 'function'
      ? config.getHostFromUrl
      : function() {
        return '';
      };
    const getThemeHostForSuggestion = typeof config.getThemeHostForSuggestion === 'function'
      ? config.getThemeHostForSuggestion
      : function() {
        return '';
      };
    const getImmediateThemeForSuggestion = typeof config.getImmediateThemeForSuggestion === 'function'
      ? config.getImmediateThemeForSuggestion
      : function() {
        return config.defaultTheme || null;
      };
    const getThemeForSuggestion = typeof config.getThemeForSuggestion === 'function'
      ? config.getThemeForSuggestion
      : function() {
        return Promise.resolve(config.defaultTheme || null);
      };
    const shouldUseUrlFallbackThemeForSuggestion = typeof config.shouldUseUrlFallbackThemeForSuggestion === 'function'
      ? config.shouldUseUrlFallbackThemeForSuggestion
      : function() {
        return false;
      };
    const getThemeForMode = typeof config.getThemeForMode === 'function'
      ? config.getThemeForMode
      : function(theme) {
        return theme || config.defaultTheme || {};
      };
    const getHoverColors = typeof config.getHoverColors === 'function'
      ? config.getHoverColors
      : function() {
        return { bg: 'var(--x-nt-hover-bg, #F3F4F6)', border: 'transparent' };
      };
    const getNeutralHoverActionColors = typeof config.getNeutralHoverActionColors === 'function'
      ? config.getNeutralHoverActionColors
      : function() {
        return {
          bg: 'rgba(200, 208, 218, 0.45)',
          border: 'rgba(148, 163, 184, 0.28)',
          text: '#4B5563'
        };
      };
    const applyThemeVariables = typeof config.applyThemeVariables === 'function'
      ? config.applyThemeVariables
      : noop;
    const applyMarkVariables = typeof config.applyMarkVariables === 'function'
      ? config.applyMarkVariables
      : noop;
    const applyFaviconOpticalAlignment = typeof config.applyFaviconOpticalAlignment === 'function'
      ? config.applyFaviconOpticalAlignment
      : noop;
    const applyFaviconOpticalShift = typeof config.applyFaviconOpticalShift === 'function'
      ? config.applyFaviconOpticalShift
      : noop;
    const setFaviconSrcWithAnimation = typeof config.setFaviconSrcWithAnimation === 'function'
      ? config.setFaviconSrcWithAnimation
      : function(img, src) {
        if (!img || !src) {
          return false;
        }
        img.src = src;
        return true;
      };
    const applyFallbackIcon = typeof config.applyFallbackIcon === 'function'
      ? config.applyFallbackIcon
      : noop;
    const attachFaviconWithFallbacks = typeof config.attachFaviconWithFallbacks === 'function'
      ? config.attachFaviconWithFallbacks
      : noop;
    const getBrowserPageFaviconUrl = typeof config.getBrowserPageFaviconUrl === 'function'
      ? config.getBrowserPageFaviconUrl
      : function() {
        return '';
      };
    const getPageFaviconRenderCandidates = typeof config.getPageFaviconRenderCandidates === 'function'
      ? config.getPageFaviconRenderCandidates
      : function(url, explicitUrl, optionsArg) {
        const pageUrl = String(url || '');
        const explicitFavicon = String(explicitUrl || '').trim();
        const browserPageFavicon = getBrowserPageFaviconUrl(pageUrl);
        const chromeFavicon = getChromeFaviconUrl(pageUrl);
        const isInternalPage = isBrowserInternalUrl(pageUrl);
        const primaryUrl = isInternalPage
          ? (browserPageFavicon || explicitFavicon || chromeFavicon || '')
          : (browserPageFavicon || explicitFavicon || '');
        const shouldUseChromeFallback = isInternalPage ||
          Boolean(optionsArg && optionsArg.includeChromeFallback);
        return {
          primaryUrl,
          browserUrl: shouldUseChromeFallback && chromeFavicon !== primaryUrl ? chromeFavicon : ''
        };
      };
    const reportMissingIcon = typeof config.reportMissingIcon === 'function'
      ? config.reportMissingIcon
      : noop;
    const preloadIcon = typeof config.preloadIcon === 'function' ? config.preloadIcon : noop;
    const setSuggestionsVisible = typeof config.setSuggestionsVisible === 'function'
      ? config.setSuggestionsVisible
      : noop;
    const onSetSelectedIndex = typeof config.onSetSelectedIndex === 'function'
      ? config.onSetSelectedIndex
      : noop;
    const getSelectedIndex = typeof config.getSelectedIndex === 'function'
      ? config.getSelectedIndex
      : function() {
        return -1;
      };
    const onSwitchToTab = typeof config.onSwitchToTab === 'function' ? config.onSwitchToTab : noop;
    const onActivateSuggestion = typeof config.onActivateSuggestion === 'function'
      ? config.onActivateSuggestion
      : noop;
    const onDeleteHistory = typeof config.onDeleteHistory === 'function'
      ? config.onDeleteHistory
      : noop;
    let openInCurrentTabModifierActive = false;
    let openSwitchInNewTabModifierActive = false;
    let openInBackgroundTabModifierActive = false;
    const shouldSwitchMatchedTabSuggestion = typeof config.shouldSwitchMatchedTabSuggestion === 'function'
      ? config.shouldSwitchMatchedTabSuggestion
      : function() {
        return false;
      };
    const showTopActionTooltip = typeof config.showTopActionTooltip === 'function'
      ? config.showTopActionTooltip
      : noop;
    const hideTopActionTooltip = typeof config.hideTopActionTooltip === 'function'
      ? config.hideTopActionTooltip
      : noop;
    const getSearchActionLabel = typeof config.getSearchActionLabel === 'function'
      ? config.getSearchActionLabel
      : function() {
        return 'Search';
      };
    const getSiteSearchDisplayName = typeof config.getSiteSearchDisplayName === 'function'
      ? config.getSiteSearchDisplayName
      : function(provider) {
        return provider && (provider.name || provider.key) ? String(provider.name || provider.key) : '';
      };
    const isAiSiteSearchProvider = typeof config.isAiSiteSearchProvider === 'function'
      ? config.isAiSiteSearchProvider
      : function(provider) {
        return Boolean(provider && String(provider.action || '').trim() === 'openAndSubmit');
      };
    const getDefaultSearchEngineThemeUrl = typeof config.getDefaultSearchEngineThemeUrl === 'function'
      ? config.getDefaultSearchEngineThemeUrl
      : function() {
        return '';
      };
    const getBrandAccentForUrl = typeof config.getBrandAccentForUrl === 'function'
      ? config.getBrandAccentForUrl
      : function() {
        return null;
      };
    const buildThemeFromAccent = typeof config.buildThemeFromAccent === 'function'
      ? config.buildThemeFromAccent
      : function(theme) {
        return theme || config.defaultTheme || {};
      };
    const urlGuards = root.LumnoUrlGuards || {};
    const isBrowserNewtabUrl = typeof config.isBrowserNewtabUrl === 'function'
      ? config.isBrowserNewtabUrl
      : (typeof urlGuards.isBrowserNewtabUrl === 'function'
        ? urlGuards.isBrowserNewtabUrl
        : function(url) {
          const lower = String(url || '').trim().toLowerCase().replace(/[?#].*$/, '').replace(/\/+$/, '');
          return lower === 'chrome://newtab' ||
            lower === 'chrome://new-tab-page' ||
            lower === 'edge://newtab' ||
            lower === 'brave://newtab' ||
            lower === 'vivaldi://newtab' ||
            lower === 'opera://startpage';
        });
    const isBrowserInternalUrl = typeof config.isBrowserInternalUrl === 'function'
      ? config.isBrowserInternalUrl
      : (typeof urlGuards.isBrowserInternalUrl === 'function'
        ? urlGuards.isBrowserInternalUrl
        : function(url) {
          const lower = String(url || '').trim().toLowerCase();
          return lower.startsWith('chrome://') ||
            lower.startsWith('edge://') ||
            lower.startsWith('brave://') ||
            lower.startsWith('vivaldi://') ||
            lower.startsWith('opera://') ||
            lower.startsWith('about:');
        });

    function getDefaultTheme() {
      return config.defaultTheme || {};
    }

    function getUrlFallbackTheme(fallbackTheme) {
      return config.urlHighlightTheme || fallbackTheme || getDefaultTheme();
    }

    function resolveThemeForSuggestion(suggestion, theme) {
      const resolvedTheme = theme || getDefaultTheme();
      return shouldUseUrlFallbackThemeForSuggestion(suggestion, resolvedTheme)
        ? getUrlFallbackTheme(resolvedTheme)
        : resolvedTheme;
    }

    function isLocalUrlSuggestion(suggestion) {
      const url = suggestion && suggestion.url ? String(suggestion.url) : '';
      if (!url) {
        return false;
      }
      try {
        const parsed = new URL(url);
        if (String(parsed.protocol || '').toLowerCase() === 'file:') {
          return true;
        }
      } catch (e) {
        // Fall back to host-based checks below for partially typed URLs.
      }
      const host = getHostFromUrl(url);
      return Boolean(host && (isLocalNetworkHost(host) || shouldBlockFaviconForHost(host)));
    }

    function isTopSiteSuggestion(suggestion) {
      return Boolean(suggestion && (suggestion.type === 'topSite' || suggestion.isTopSite));
    }

    function canRemoveSuggestionFromHistory(suggestion) {
      return Boolean(
        suggestion &&
        suggestion.url &&
        (suggestion.type === 'history' || isTopSiteSuggestion(suggestion))
      );
    }

    function getRemoveSuggestionTooltipText(suggestion) {
      if (isTopSiteSuggestion(suggestion)) {
        return t('search_remove_top_site_tooltip', '移除该常用');
      }
      return t('search_remove_history_tooltip', '移除该历史');
    }

    function createSuggestionInlineIcon(iconName, tone) {
      const icon = documentRef.createElement('span');
      icon.innerHTML = getRiSvg(iconName, 'ri-size-16');
      icon.className = 'x-nt-suggestion-inline-icon';
      if (tone) {
        icon.setAttribute('data-tone', tone);
      }
      return icon;
    }

    function createSearchIcon(tone) {
      return createSuggestionInlineIcon('ri-search-line', tone);
    }

    function createLinkIcon(tone) {
      return createSuggestionInlineIcon('ri-link', tone);
    }

    function createFaviconImage(index, optionsArg) {
      const favicon = documentRef.createElement('img');
      const imageOptions = optionsArg || {};
      favicon.setAttribute('data-x-nt-suggestion-icon', '1');
      favicon.className = 'x-nt-suggestion-favicon';
      favicon.decoding = 'async';
      favicon.loading = 'eager';
      favicon.referrerPolicy = 'no-referrer';
      if (index < 4) {
        favicon.fetchPriority = 'high';
      }
      if (imageOptions.objectFitContain) {
        favicon.setAttribute('data-object-fit', 'contain');
      }
      if (imageOptions.fallbackSize) {
        favicon.setAttribute('data-fallback-size', 'true');
      }
      if (imageOptions.fallbackIconName) {
        favicon.setAttribute('data-fallback-icon-name', imageOptions.fallbackIconName);
      }
      applyFaviconOpticalAlignment(favicon);
      return favicon;
    }

    function createIconSlot(iconNode, isFaviconIcon) {
      const iconSlot = documentRef.createElement('span');
      iconSlot.className = 'x-nt-suggestion-icon-slot';
      iconSlot.setAttribute('data-favicon', isFaviconIcon ? 'true' : 'false');
      iconSlot.appendChild(iconNode);
      iconSlot._xIsFavicon = isFaviconIcon;
      return iconSlot;
    }

    function shouldUseChromeFaviconFallback(url, host) {
      if (!url) {
        return false;
      }
      if (!/^https?:\/\//i.test(url)) {
        return true;
      }
      return Boolean(host && isLocalNetworkHost(host));
    }

    function getFaviconAttachOptions(url, explicitUrl, host) {
      const candidates = getPageFaviconRenderCandidates(url, explicitUrl, {
        includeChromeFallback: shouldUseChromeFaviconFallback(url, host)
      }) || {};
      return {
        primaryUrl: candidates.primaryUrl || '',
        browserUrl: candidates.browserUrl || ''
      };
    }

    function hasTabFavicon(tab) {
      return Boolean(String((tab && tab.favIconUrl) || '').trim());
    }

    function shouldUseFallbackIconForTab(tab, host) {
      return Boolean(
        shouldBlockFaviconForHost(host) ||
        (!hasTabFavicon(tab) && isBrowserNewtabUrl(tab && tab.url))
      );
    }

    function getBrowserPageFallbackIconName(url) {
      const raw = String(url || '').trim();
      if (isBrowserNewtabUrl(raw)) {
        return 'ri-link';
      }
      return isBrowserInternalUrl(raw) ? 'ri-link' : '';
    }

    function setIconEmphasis(item, isActive) {
      if (!item || !item._xIconWrap || item._xIconIsFavicon) {
        return;
      }
      item._xIconWrap.setAttribute('data-emphasis', isActive ? 'true' : 'false');
    }

    function createActionTag(labelText, keyLabel) {
      const tag = documentRef.createElement('span');
      tag.className = 'x-nt-suggestion-action-tag';

      const label = documentRef.createElement('span');
      label.className = 'x-nt-suggestion-action-tag__label';
      label.textContent = labelText;

      const keycap = documentRef.createElement('span');
      keycap.className = 'x-nt-suggestion-action-tag__key';
      keycap.textContent = keyLabel;

      tag.appendChild(label);
      tag.appendChild(keycap);
      tag._xActionLabel = label;
      return tag;
    }

    function setInlineLabelWithIcon(button, labelText, iconMarkup) {
      if (!button) {
        return;
      }
      button.textContent = '';
      const label = documentRef.createElement('span');
      label.className = 'x-nt-suggestion-action-button__label';
      label.textContent = labelText || '';
      button.appendChild(label);
      const icon = documentRef.createElement('span');
      icon.className = 'x-nt-suggestion-action-button__icon';
      icon.innerHTML = iconMarkup || '';
      button.appendChild(icon);
      button.setAttribute('aria-label', labelText || '');
      button.removeAttribute('title');
    }

    function getSuggestionProviderSearchActionLabel(suggestion) {
      const provider = suggestion && suggestion.provider ? suggestion.provider : null;
      if (!provider) {
        return '';
      }
      const site = getSiteSearchDisplayName(provider);
      if (isAiSiteSearchProvider(provider)) {
        return formatMessage('action_open_ai_web', '打开 {site} 网页版', { site });
      }
      return formatMessage('search_in_site', '在 {site} 中搜索', { site });
    }

    function getSuggestionActionLabel(action, suggestion) {
      switch (action) {
        case 'search':
          return getSuggestionProviderSearchActionLabel(suggestion) || getSearchActionLabel();
        case 'switch':
          return t('action_switch', '切换');
        case 'open':
          return t('action_open', '打开');
        case 'openBackgroundTab':
          return t('action_open_background_new_tab', '在后台新开');
        case 'openNewTab':
          return t('action_open_new_tab', '新开');
        case 'go':
          return t('action_go_current_tab', '前往');
        case 'commandNewTab':
          return t('command_newtab', '新建标签页');
        case 'commandSettings':
          return formatMessage('command_settings', '打开 {name} 设置', { name: 'Lumno' });
        case 'commandDocumentPip':
          return t('document_pip_command_action', '开始剪裁');
        default:
          return t('action_open_new_tab', '新开');
      }
    }

    function setSuggestionActionButtonVisible(button, visible) {
      if (!button) {
        return;
      }
      button.setAttribute('data-visible', visible ? 'true' : 'false');
    }

    function setSuggestionActionTagsVisible(element, visible) {
      if (!element) {
        return;
      }
      element.setAttribute('data-visible', visible ? 'true' : 'false');
    }

    function setSuggestionActionButtonPalette(button, text, bg, border) {
      if (!button) {
        return;
      }
      button.style.setProperty(
        '--x-nt-suggestion-action-button-text',
        text || 'var(--x-nt-subtext, #9CA3AF)'
      );
      button.style.setProperty('--x-nt-suggestion-action-button-bg', bg || 'transparent');
      button.style.setProperty('--x-nt-suggestion-action-button-border', border || 'transparent');
    }

    function applySuggestionVisitButtonState(button, visible, active, resolvedTheme) {
      if (!button) {
        return;
      }
      setSuggestionActionButtonVisible(button, visible);
      if (active && resolvedTheme) {
        setSuggestionActionButtonPalette(
          button,
          resolvedTheme.buttonText,
          resolvedTheme.buttonBg,
          resolvedTheme.buttonBorder
        );
        return;
      }
      setSuggestionActionButtonPalette(button, 'var(--x-nt-subtext, #9CA3AF)', 'transparent', 'transparent');
    }

    function createSearchActionModel(optionsArg) {
      if (actionModel && typeof actionModel.createSearchActionModel === 'function') {
        return actionModel.createSearchActionModel(optionsArg);
      }
      return {
        actionTags: [],
        visitButtonAction: 'openNewTab',
        alwaysHideVisitButton: false,
        hasActionTags: false,
        hasSwitchAction: false
      };
    }

    function getModifierAdjustedAction(action) {
      if (actionModel && typeof actionModel.getModifierAdjustedAction === 'function') {
        return actionModel.getModifierAdjustedAction(action, {
          openInCurrentTab: openInCurrentTabModifierActive,
          openSwitchInNewTab: openSwitchInNewTabModifierActive,
          openInBackgroundTab: openInBackgroundTabModifierActive
        });
      }
      if (openSwitchInNewTabModifierActive && action === 'switch') {
        return openInBackgroundTabModifierActive && !openInCurrentTabModifierActive
          ? 'openBackgroundTab'
          : 'openNewTab';
      }
      if (openInBackgroundTabModifierActive && !openInCurrentTabModifierActive &&
          (action === 'openNewTab' || action === 'go' || action === 'switch')) {
        return 'openBackgroundTab';
      }
      return openInCurrentTabModifierActive && action === 'openNewTab' ? 'go' : action;
    }

    function setSuggestionActionTagContent(tag, action, suggestion) {
      if (!tag || !tag._xActionLabel) {
        return;
      }
      tag._xActionLabel.textContent = getSuggestionActionLabel(getModifierAdjustedAction(action), suggestion);
    }

    function setSuggestionVisitButtonContent(button, action, suggestion) {
      setInlineLabelWithIcon(
        button,
        getSuggestionActionLabel(getModifierAdjustedAction(action), suggestion),
        getRiSvg('ri-arrow-right-line', 'ri-size-12')
      );
    }

    function updateModifierActionLabels() {
      items.forEach((item) => {
        if (!item || !item._xIsSearchSuggestion) {
          return;
        }
        if (item._xVisitButton && item._xVisitButtonAction) {
          setSuggestionVisitButtonContent(item._xVisitButton, item._xVisitButtonAction, item._xSuggestion);
        }
        if (Array.isArray(item._xActionTags)) {
          item._xActionTags.forEach((tag) => {
            setSuggestionActionTagContent(tag, tag._xAction, tag._xSuggestion);
          });
        }
      });
    }

    function renderHighlightedText(target, text, query) {
      const safeText = sanitizeDisplayText(text);
      const needle = String(query || '').trim();
      if (!needle) {
        target.textContent = safeText;
        return;
      }
      const parts = safeText.split(new RegExp(`(${escapeRegExp(needle)})`, 'gi'));
      if (parts.length === 1) {
        target.textContent = safeText;
        return;
      }
      parts.forEach((part) => {
        if (!part) {
          return;
        }
        if (part.toLowerCase() === needle.toLowerCase()) {
          const mark = documentRef.createElement('mark');
          mark.className = 'x-nt-suggestion-mark';
          mark.textContent = part;
          target.appendChild(mark);
        } else {
          target.appendChild(documentRef.createTextNode(part));
        }
      });
    }

    function createUrlLine(url) {
      if (!url) {
        return null;
      }
      const urlLine = documentRef.createElement('span');
      urlLine.className = 'x-nt-suggestion-url-line';
      urlLine.textContent = url;
      return urlLine;
    }

    function applySearchSuggestionHighlight(item) {
      item.setAttribute('data-row-state', 'active');
    }

    function resetSearchSuggestion(item) {
      item.removeAttribute('data-row-state');
    }

    function applySearchSuggestionHover(item) {
      item.setAttribute('data-row-state', 'hover');
    }

    function applySuggestionTagStyles(tag, resolvedTheme, isActive) {
      if (!tag) {
        return;
      }
      tag.style.setProperty(
        '--x-nt-suggestion-tag-bg',
        isActive ? resolvedTheme.tagBg : (tag._xDefaultBg || 'var(--x-nt-tag-bg, #F3F4F6)')
      );
      tag.style.setProperty(
        '--x-nt-suggestion-tag-text',
        isActive ? resolvedTheme.tagText : (tag._xDefaultText || 'var(--x-nt-tag-text, #6B7280)')
      );
      tag.style.setProperty(
        '--x-nt-suggestion-tag-border',
        isActive ? resolvedTheme.tagBorder : (tag._xDefaultBorder || 'transparent')
      );
    }

    function applySearchActionStyles(item, theme, isActive) {
      const resolvedTheme = getThemeForMode(theme);
      item.setAttribute('data-active', isActive ? 'true' : 'false');
      item.setAttribute('data-has-action-tags', item._xHasActionTags ? 'true' : 'false');
      applyMarkVariables(item, isActive ? resolvedTheme : getDefaultTheme());
      if (item._xVisitButton) {
        const shouldShowVisitButton = actionModel && typeof actionModel.shouldShowVisitButton === 'function'
          ? actionModel.shouldShowVisitButton(item._xActionModel, isActive)
          : Boolean(!item._xAlwaysHideVisitButton && !(isActive && item._xHasActionTags));
        applySuggestionVisitButtonState(item._xVisitButton, shouldShowVisitButton, isActive, resolvedTheme);
      }
      applySuggestionTagStyles(item._xHistoryTag, resolvedTheme, isActive);
      applySuggestionTagStyles(item._xBookmarkTag, resolvedTheme, isActive);
      applySuggestionTagStyles(item._xTopSiteTag, resolvedTheme, isActive);
      if (item._xTagContainer) {
        setSuggestionActionTagsVisible(item._xTagContainer, Boolean(isActive && item._xHasActionTags));
      }
      if (item._xHistoryDeleteButton) {
        const shouldShowHistoryDelete = Boolean(item._xHasHistoryDeleteButton && item._xIsHovering);
        item.setAttribute('data-history-delete-visible', shouldShowHistoryDelete ? 'true' : 'false');
        const buttonTheme = shouldShowHistoryDelete && isActive
          ? resolvedTheme
          : {
            buttonText: 'var(--x-nt-subtext, #6B7280)',
            buttonBg: 'transparent',
            buttonBorder: 'transparent'
          };
        item._xHistoryDeleteButton.style.setProperty('--x-nt-history-delete-color', buttonTheme.buttonText);
        item._xHistoryDeleteButton.style.setProperty('--x-nt-history-delete-bg', buttonTheme.buttonBg);
        item._xHistoryDeleteButton.style.setProperty('--x-nt-history-delete-border', buttonTheme.buttonBorder);
      }
    }

    function updateSelection(selectedIndex) {
      const resolvedIndex = Number.isInteger(selectedIndex) ? selectedIndex : -1;
      items.forEach((item, index) => {
        const isSelected = index === resolvedIndex;
        const shouldAutoHighlight = resolvedIndex === -1 && item._xIsAutocompleteTop;
        const isHighlighted = isSelected || shouldAutoHighlight;
        if (item._xIsSearchSuggestion) {
          const theme = item._xTheme || getDefaultTheme();
          if (isHighlighted) {
            applySearchSuggestionHighlight(item);
          } else {
            resetSearchSuggestion(item);
          }
          applySearchActionStyles(item, theme, isHighlighted);
          setIconEmphasis(item, Boolean(isHighlighted || item._xIsHovering));
          if (item._xDirectIconWrap) {
            const shouldShow = isHighlighted && theme && theme._xIsBrand;
            const resolvedTheme = getThemeForMode(theme || getDefaultTheme());
            item._xDirectIconWrap.style.setProperty(
              '--x-nt-suggestion-icon-color',
              shouldShow ? resolvedTheme.accent : 'var(--x-nt-subtext, #6B7280)'
            );
          }
          return;
        }
        setIconEmphasis(item, Boolean(isHighlighted || item._xIsHovering));
        const theme = item._xTheme || getDefaultTheme();
        if (isSelected) {
          applySearchSuggestionHighlight(item);
        } else {
          resetSearchSuggestion(item);
        }
        if (isSelected && theme && theme._xIsBrand) {
          const hover = getHoverColors(theme);
          item.style.setProperty('--x-nt-suggestion-active-bg', hover.bg);
          item.style.setProperty('--x-nt-suggestion-active-border', hover.border);
        }
      });
    }

    function getAutoHighlightIndex() {
      return items.findIndex((item) => Boolean(item && item._xIsAutocompleteTop));
    }

    function syncSuggestionLastState() {
      items.forEach((item, index) => {
        if (item && typeof item.setAttribute === 'function') {
          item.setAttribute('data-last', index === items.length - 1 ? 'true' : 'false');
        }
      });
    }

    function clear() {
      if (container) {
        container.innerHTML = '';
      }
      items.length = 0;
      onSetSelectedIndex(-1);
      setSuggestionsVisible(false);
    }

    function destroy() {
      clear();
    }

    function renderTabs(tabList) {
      if (!container) {
        return;
      }
      container.innerHTML = '';
      items.length = 0;
      const limit = Number(config.openTabSuggestionLimit) > 0
        ? Number(config.openTabSuggestionLimit)
        : 3;
      const list = Array.isArray(tabList)
        ? tabList.slice(0, Math.max(1, limit))
        : [];
      if (list.length === 0) {
        onSetSelectedIndex(-1);
        setSuggestionsVisible(false);
        return;
      }
      list.forEach((tab) => {
        if (tab && tab.favIconUrl) {
          preloadIcon(tab.favIconUrl);
        }
      });
      list.forEach((tab, index) => {
        const suggestionItem = documentRef.createElement('div');
        suggestionItem.id = `_x_extension_newtab_suggestion_item_${index}_2024_unique_`;
        suggestionItem.className = 'x-nt-suggestion-item';
        suggestionItem.setAttribute('data-last', index === list.length - 1 ? 'true' : 'false');
        suggestionItem._xIsSearchSuggestion = false;
        suggestionItem._xIsAutocompleteTop = false;
        items.push(suggestionItem);

        const leftSide = documentRef.createElement('div');
        leftSide.className = 'x-nt-suggestion-left';

        let hostForTab = '';
        try {
          hostForTab = tab && tab.url ? new URL(tab.url).hostname : '';
        } catch (e) {
          hostForTab = '';
        }
        const useFallback = shouldUseFallbackIconForTab(tab, hostForTab);
        let iconNode = null;
        if (useFallback) {
          iconNode = createSuggestionInlineIcon(getBrowserPageFallbackIconName(tab && tab.url) || 'ri-link');
        } else {
          const favicon = createFaviconImage(index, {
            fallbackIconName: getBrowserPageFallbackIconName(tab && tab.url)
          });
          attachFaviconWithFallbacks(
            favicon,
            tab.url || '',
            hostForTab,
            getFaviconAttachOptions(tab.url || '', tab.favIconUrl || '', hostForTab)
          );
          iconNode = favicon;
        }
        const iconSlot = createIconSlot(iconNode, !useFallback);
        leftSide.appendChild(iconSlot);
        suggestionItem._xIconWrap = iconSlot;
        suggestionItem._xIconIsFavicon = !useFallback;

        const title = documentRef.createElement('span');
        title.className = 'x-nt-suggestion-title';
        title.textContent = sanitizeDisplayText(tab.title || t('untitled', '无标题'));
        suggestionItem._xTitle = title;
        leftSide.appendChild(title);

        if (isTabRankScoreDebugEnabled()) {
          const rankDebug = documentRef.createElement('span');
          rankDebug.className = 'x-nt-tab-rank-debug';
          rankDebug.textContent = formatTabRankDebugText(tab);
          leftSide.appendChild(rankDebug);
        }

        const switchButton = documentRef.createElement('button');
        switchButton.type = 'button';
        switchButton.className = 'x-nt-tab-switch-button';
        switchButton.innerHTML = `${t('switch_to_tab', '切换到标签页')} ${getRiSvg('ri-arrow-right-line', 'ri-size-12')}`;
        suggestionItem._xSwitchButton = switchButton;
        const rightSide = documentRef.createElement('div');
        rightSide.className = 'x-nt-suggestion-right';

        suggestionItem.addEventListener('mouseenter', function() {
          if (items.indexOf(this) !== getSelectedIndex()) {
            this._xIsHovering = true;
            setIconEmphasis(this, true);
            if (getSelectedIndex() === -1 && this._xIsAutocompleteTop) {
              return;
            }
            const theme = this._xTheme;
            if (theme && theme._xIsBrand) {
              const hover = getHoverColors(theme);
              this.style.setProperty('--x-nt-suggestion-hover-bg', hover.bg);
              this.style.setProperty('--x-nt-suggestion-hover-border', hover.border);
            }
            applySearchSuggestionHover(this);
          }
        });

        suggestionItem.addEventListener('mouseleave', function() {
          if (items.indexOf(this) !== getSelectedIndex()) {
            this._xIsHovering = false;
            updateSelection(getSelectedIndex());
          }
        });

        switchButton.addEventListener('click', function(event) {
          event.stopPropagation();
          onSwitchToTab(tab);
        });

        suggestionItem.addEventListener('click', function() {
          onSwitchToTab(tab);
        });

        suggestionItem.appendChild(leftSide);
        rightSide.appendChild(switchButton);
        suggestionItem.appendChild(rightSide);
        container.appendChild(suggestionItem);

        const themeSourceSuggestion = {
          url: tab.url || '',
          favicon: tab.favIconUrl || ''
        };
        const themeHost = getThemeHostForSuggestion(themeSourceSuggestion);
        const shouldUseLocalUrlFallbackTheme = isLocalUrlSuggestion(themeSourceSuggestion);
        const immediateTheme = shouldUseLocalUrlFallbackTheme
          ? getUrlFallbackTheme(getImmediateThemeForSuggestion(themeSourceSuggestion) || getDefaultTheme())
          : (getImmediateThemeForSuggestion(themeSourceSuggestion) || getDefaultTheme());
        suggestionItem._xTheme = immediateTheme;
        suggestionItem._xThemeHost = themeHost;
        applyThemeVariables(suggestionItem, immediateTheme);
        if (!shouldUseLocalUrlFallbackTheme) {
          getThemeForSuggestion(themeSourceSuggestion).then((theme) => {
            if (!suggestionItem.isConnected) {
              return;
            }
            suggestionItem._xTheme = resolveThemeForSuggestion(themeSourceSuggestion, theme);
            updateSelection(getSelectedIndex());
          });
        }
      });

      syncSuggestionLastState();
      onSetSelectedIndex(-1);
      setSuggestionsVisible(true);
    }

    function markAutocompleteTop(primaryHighlightIndex) {
      items.forEach((item, index) => {
        item._xIsAutocompleteTop = index === primaryHighlightIndex;
      });
    }

    function render(payload) {
      if (!container) {
        return;
      }
      const renderPayload = payload || {};
      const suggestions = Array.isArray(renderPayload.suggestions) ? renderPayload.suggestions : [];
      const query = renderPayload.query || '';
      const primaryHighlightIndex = Number.isInteger(renderPayload.primaryHighlightIndex)
        ? renderPayload.primaryHighlightIndex
        : -1;
      const primaryHighlightReason = renderPayload.primaryHighlightReason || 'none';
      const primarySuggestion = renderPayload.primarySuggestion || null;
      const onlyKeywordSuggestions = Boolean(renderPayload.onlyKeywordSuggestions);
      const mergedProvider = renderPayload.mergedProvider || null;
      const startIndex = Number.isInteger(renderPayload.startIndex) ? renderPayload.startIndex : 0;

      if (!renderPayload.canAppend) {
        container.innerHTML = '';
        items.length = 0;
        onSetSelectedIndex(-1);
      } else {
        markAutocompleteTop(primaryHighlightIndex);
      }

      suggestions.forEach(function(suggestion, index) {
        if (index < startIndex) {
          return;
        }
        const suggestionItem = documentRef.createElement('div');
        suggestionItem.id = `_x_extension_newtab_suggestion_item_${index}_2024_unique_`;
        suggestionItem.className = 'x-nt-suggestion-item';
        suggestionItem.setAttribute('data-last', index === suggestions.length - 1 ? 'true' : 'false');
        const isPrimaryHighlight = index === primaryHighlightIndex;
        const isPrimarySearchSuggest = isPrimaryHighlight && suggestion.type === 'googleSuggest';
        const shouldUseLocalUrlFallbackTheme = isLocalUrlSuggestion(suggestion);
        let immediateTheme = getImmediateThemeForSuggestion(suggestion) || getDefaultTheme();
        if (
          suggestion.type === 'directUrl' ||
          suggestion.type === 'browserPage' ||
          shouldUseLocalUrlFallbackTheme
        ) {
          immediateTheme = getUrlFallbackTheme(immediateTheme);
        }
        const shouldUseSearchEngineTheme = isPrimarySearchSuggest ||
          (onlyKeywordSuggestions && isPrimaryHighlight && suggestion.type === 'newtab');
        if (shouldUseSearchEngineTheme) {
          const engineAccent = getBrandAccentForUrl(getDefaultSearchEngineThemeUrl());
          if (engineAccent) {
            immediateTheme = buildThemeFromAccent(engineAccent, 'brand');
            immediateTheme._xIsBrand = true;
          }
        }
        if (isPrimaryHighlight) {
          applySearchSuggestionHighlight(suggestionItem);
        }
        items.push(suggestionItem);
        suggestionItem._xIsSearchSuggestion = true;
        suggestionItem._xTheme = immediateTheme;
        suggestionItem._xThemeHost = getThemeHostForSuggestion(suggestion);
        suggestionItem._xIsAutocompleteTop = isPrimaryHighlight;
        applyThemeVariables(suggestionItem, immediateTheme);

        const leftSide = documentRef.createElement('div');
        leftSide.className = 'x-nt-suggestion-left';

        let iconNode = null;
        let iconWrapper = null;
        if (suggestion.type === 'browserPage' || suggestion.type === 'directUrl') {
          const shouldRenderBrowserPageFavicon = suggestion.type === 'browserPage' && isBrowserInternalUrl(suggestion.url);
          if (suggestion.favicon || shouldRenderBrowserPageFavicon) {
            const suggestionHost = suggestion && suggestion.url ? getHostFromUrl(suggestion.url) : '';
            const favicon = createFaviconImage(index, {
              objectFitContain: true,
              fallbackIconName: suggestion.type === 'browserPage'
                ? getBrowserPageFallbackIconName(suggestion.url)
                : ''
            });
            attachFaviconWithFallbacks(
              favicon,
              suggestion.url || suggestion.favicon || '',
              suggestionHost,
              getFaviconAttachOptions(suggestion.url || '', suggestion.favicon || '', suggestionHost)
            );
            iconNode = favicon;
          } else {
            iconNode = suggestion.type === 'browserPage'
              ? createSuggestionInlineIcon('ri-window-2-line')
              : createSearchIcon();
          }
        } else if (suggestion.type === 'commandNewTab') {
          iconNode = createSuggestionInlineIcon('ri-add-line', 'subtext');
        } else if (suggestion.type === 'commandSettings') {
          iconNode = createSuggestionInlineIcon('ri-settings-3-line', 'subtext');
        } else if (suggestion.type === 'commandDocumentPip') {
          iconNode = createSuggestionInlineIcon('ri-scissors-cut-line', 'subtext');
        } else if (suggestion.type === 'modeSwitch' && suggestion.favicon) {
          const favicon = createFaviconImage(index);
          favicon.src = suggestion.favicon || '';
          favicon.onerror = function() {
            const fallbackIcon = createLinkIcon('subtext');
            if (favicon.parentNode) {
              favicon.parentNode.replaceChild(fallbackIcon, favicon);
            }
          };
          iconNode = favicon;
        } else if (suggestion.type === 'newtab' || suggestion.type === 'googleSuggest') {
          iconNode = createSearchIcon('subtext');
        } else if (
          suggestion.favicon &&
          (suggestion.type === 'siteSearch' ||
            suggestion.type === 'inlineSiteSearch' ||
            suggestion.type === 'siteSearchPrompt')
        ) {
          const suggestionHost = suggestion && suggestion.url ? getHostFromUrl(suggestion.url) : '';
          const favicon = createFaviconImage(index, { objectFitContain: true });
          attachFaviconWithFallbacks(
            favicon,
            suggestion.url || suggestion.favicon || '',
            suggestionHost,
            getFaviconAttachOptions(suggestion.url || '', suggestion.favicon || '', suggestionHost)
          );
          iconNode = favicon;
        } else if (suggestion.favicon) {
          const suggestionHost = suggestion && suggestion.url ? getHostFromUrl(suggestion.url) : '';
          const isLocalSuggestion = suggestionHost && shouldBlockFaviconForHost(suggestionHost);
          if (isLocalSuggestion) {
            iconNode = createLinkIcon();
          } else {
            const favicon = createFaviconImage(index, { objectFitContain: true });
            const faviconPageUrl = suggestion && suggestion.url ? suggestion.url : (suggestion.favicon || '');
            attachFaviconWithFallbacks(
              favicon,
              faviconPageUrl,
              suggestionHost,
              getFaviconAttachOptions(faviconPageUrl, suggestion.favicon || '', suggestionHost)
            );
            iconNode = favicon;
          }
        } else {
          const suggestionHost = suggestion && suggestion.url ? getHostFromUrl(suggestion.url) : '';
          iconNode = suggestionHost && shouldBlockFaviconForHost(suggestionHost)
            ? createLinkIcon('subtext')
            : createSearchIcon('subtext');
        }

        if (iconNode) {
          const isFaviconIcon = iconNode.tagName === 'IMG';
          const iconSlot = createIconSlot(iconNode, isFaviconIcon);
          iconNode = iconSlot;
          suggestionItem._xIconWrap = iconSlot;
          suggestionItem._xIconIsFavicon = isFaviconIcon;
          if (suggestion.type === 'directUrl' || suggestion.type === 'browserPage') {
            iconWrapper = iconSlot;
          }
        }

        const textWrapper = documentRef.createElement('div');
        textWrapper.className = 'x-nt-suggestion-text';

        const title = documentRef.createElement('span');
        title.textContent = '';
        renderHighlightedText(title, suggestion.title || '', query);
        title.className = 'x-nt-suggestion-title';
        suggestionItem._xTitle = title;

        textWrapper.appendChild(title);
        const reasonText = Array.isArray(suggestion.reasons)
          ? suggestion.reasons.map((item) => String(item || '').trim()).filter(Boolean).join(' · ')
          : '';
        if (isTabRankScoreDebugEnabled() && reasonText) {
          const reasonLine = documentRef.createElement('span');
          reasonLine.textContent = reasonText;
          reasonLine.className = 'x-nt-suggestion-reason';
          textWrapper.appendChild(reasonLine);
        }

        if (suggestion.type === 'history' && !suggestion.isTopSite) {
          const urlLine = createUrlLine(suggestion.url || '');
          if (urlLine) {
            textWrapper.appendChild(urlLine);
          }
          const historyTag = documentRef.createElement('span');
          historyTag.textContent = t('search_tag_history', '历史');
          historyTag.className = 'x-nt-suggestion-tag';
          historyTag.setAttribute('data-tag-type', 'history');
          historyTag._xDefaultBg = 'var(--x-nt-tag-bg, #F3F4F6)';
          historyTag._xDefaultText = 'var(--x-nt-tag-text, #6B7280)';
          historyTag._xDefaultBorder = 'transparent';
          textWrapper.appendChild(historyTag);
          suggestionItem._xHistoryTag = historyTag;
        }

        if (isTopSiteSuggestion(suggestion)) {
          const urlLine = createUrlLine(suggestion.url || '');
          if (urlLine) {
            textWrapper.appendChild(urlLine);
          }
          const topSiteTag = documentRef.createElement('span');
          topSiteTag.textContent = t('search_tag_top_site', '常用');
          topSiteTag.className = 'x-nt-suggestion-tag';
          topSiteTag.setAttribute('data-tag-type', 'top-site');
          topSiteTag._xDefaultBg = 'var(--x-nt-tag-bg, #F3F4F6)';
          topSiteTag._xDefaultText = 'var(--x-nt-tag-text, #6B7280)';
          topSiteTag._xDefaultBorder = 'transparent';
          textWrapper.appendChild(topSiteTag);
          suggestionItem._xTopSiteTag = topSiteTag;
        }

        if (suggestion.type === 'bookmark') {
          if (suggestion.path) {
            const bookmarkPath = documentRef.createElement('span');
            bookmarkPath.textContent = suggestion.path;
            bookmarkPath.className = 'x-nt-suggestion-bookmark-path';
            textWrapper.appendChild(bookmarkPath);
          }
          const bookmarkTag = documentRef.createElement('span');
          bookmarkTag.textContent = t('search_tag_bookmark', '书签');
          bookmarkTag.className = 'x-nt-suggestion-tag';
          bookmarkTag.setAttribute('data-tag-type', 'bookmark');
          bookmarkTag._xDefaultBg = 'var(--x-nt-bookmark-tag-bg, #FEF3C7)';
          bookmarkTag._xDefaultText = 'var(--x-nt-bookmark-tag-text, #D97706)';
          bookmarkTag._xDefaultBorder = 'transparent';
          textWrapper.appendChild(bookmarkTag);
          suggestionItem._xBookmarkTag = bookmarkTag;
        }

        const rightSide = documentRef.createElement('div');
        rightSide.className = 'x-nt-suggestion-right';

        const actionTags = documentRef.createElement('div');
        actionTags.className = 'x-nt-suggestion-action-tags';
        setSuggestionActionTagsVisible(actionTags, false);

        const isMergedHighlight = Boolean(mergedProvider && primarySuggestion === suggestion && isPrimaryHighlight);
        const shouldSwitchMatchedTab = isPrimaryHighlight &&
          (primaryHighlightReason === 'openTab' || primaryHighlightReason === 'currentOpenTab') &&
          shouldSwitchMatchedTabSuggestion(suggestion, index);
        const itemActionModel = createSearchActionModel({
          suggestion,
          isPrimaryHighlight,
          isPrimarySearchSuggest,
          primaryHighlightReason,
          onlyKeywordSuggestions,
          isMergedHighlight,
          shouldSwitchMatchedTab,
          enterAction: 'go'
        });
        const actionTagNodes = [];
        itemActionModel.actionTags.forEach((tag) => {
          const actionTag = createActionTag(
            getSuggestionActionLabel(getModifierAdjustedAction(tag.action), suggestion),
            tag.keyLabel || 'Enter'
          );
          actionTag._xAction = tag.action;
          actionTag._xSuggestion = suggestion;
          actionTags.appendChild(actionTag);
          actionTagNodes.push(actionTag);
        });

        const visitButton = documentRef.createElement('button');
        visitButton.type = 'button';
        visitButton.className = 'x-nt-suggestion-action-button x-nt-suggestion-visit-button';
        setSuggestionActionButtonVisible(visitButton, !itemActionModel.alwaysHideVisitButton);
        setSuggestionActionButtonPalette(visitButton, 'var(--x-nt-subtext, #9CA3AF)', 'transparent', 'transparent');
        setSuggestionVisitButtonContent(visitButton, itemActionModel.visitButtonAction, suggestion);

        suggestionItem._xTagContainer = actionTags;
        suggestionItem._xActionModel = itemActionModel;
        suggestionItem._xHasActionTags = itemActionModel.hasActionTags;
        suggestionItem._xVisitButton = visitButton;
        suggestionItem._xVisitButtonAction = itemActionModel.visitButtonAction;
        suggestionItem._xActionTags = actionTagNodes;
        suggestionItem._xSuggestion = suggestion;
        suggestionItem._xAlwaysHideVisitButton = itemActionModel.alwaysHideVisitButton;
        suggestionItem._xHasSwitchAction = itemActionModel.hasSwitchAction;

        suggestionItem.addEventListener('mouseenter', function() {
          this._xIsHovering = true;
          setIconEmphasis(this, true);
          updateSelection(getSelectedIndex());
          if (items.indexOf(this) !== getSelectedIndex()) {
            if (getSelectedIndex() === -1 && this._xIsAutocompleteTop) {
              return;
            }
            applySearchSuggestionHover(this);
          }
        });

        suggestionItem.addEventListener('mouseleave', function() {
          this._xIsHovering = false;
          updateSelection(getSelectedIndex());
        });

        suggestionItem.addEventListener('click', function(event) {
          onActivateSuggestion(suggestion, query, event, index, suggestionItem);
        });
        visitButton.addEventListener('click', function(event) {
          event.stopPropagation();
          onActivateSuggestion(suggestion, query, event, index, suggestionItem);
        });

        leftSide.appendChild(iconNode);
        leftSide.appendChild(textWrapper);
        suggestionItem.appendChild(leftSide);
        rightSide.appendChild(actionTags);
        rightSide.appendChild(visitButton);

        let historyDeleteButton = null;
        let historyDeleteSlot = null;
        if (canRemoveSuggestionFromHistory(suggestion)) {
          historyDeleteSlot = documentRef.createElement('div');
          historyDeleteSlot.className = 'x-nt-history-delete-slot';
          historyDeleteButton = documentRef.createElement('button');
          historyDeleteButton.type = 'button';
          historyDeleteButton.className = 'x-nt-history-delete-button';
          const removeHistoryTooltipText = getRemoveSuggestionTooltipText(suggestion);
          historyDeleteButton.innerHTML = getRiSvg('ri-delete-bin-6-line', 'ri-size-14');
          historyDeleteButton.setAttribute('aria-label', removeHistoryTooltipText);
          historyDeleteButton.addEventListener('mouseenter', function() {
            const itemIndex = items.indexOf(suggestionItem);
            const isSelected = itemIndex === getSelectedIndex();
            const shouldAutoHighlight = getSelectedIndex() === -1 && suggestionItem._xIsAutocompleteTop;
            const shouldUseThemeHover = Boolean(isSelected || shouldAutoHighlight);
            const buttonThemeSource = suggestionItem._xTheme || getDefaultTheme();
            const resolvedTheme = getThemeForMode(buttonThemeSource);
            const hoverColors = shouldUseThemeHover
              ? getHoverColors(buttonThemeSource)
              : getNeutralHoverActionColors();
            showTopActionTooltip(historyDeleteButton, removeHistoryTooltipText);
            historyDeleteButton.style.removeProperty('transform');
            historyDeleteButton.style.setProperty('--x-nt-history-delete-hover-bg', hoverColors.bg);
            historyDeleteButton.style.setProperty('--x-nt-history-delete-hover-border', hoverColors.border);
            historyDeleteButton.style.setProperty(
              '--x-nt-history-delete-hover-color',
              shouldUseThemeHover ? resolvedTheme.buttonText : hoverColors.text
            );
            historyDeleteButton.setAttribute('data-hover', 'true');
          });
          historyDeleteButton.addEventListener('mouseleave', function() {
            hideTopActionTooltip();
            historyDeleteButton.removeAttribute('data-hover');
            historyDeleteButton.style.removeProperty('transform');
          });
          historyDeleteButton.addEventListener('focus', function() {
            showTopActionTooltip(historyDeleteButton, removeHistoryTooltipText);
          });
          historyDeleteButton.addEventListener('blur', function() {
            hideTopActionTooltip();
            historyDeleteButton.removeAttribute('data-hover');
            historyDeleteButton.style.removeProperty('transform');
          });
          historyDeleteButton.addEventListener('pointerup', function() {
            historyDeleteButton.style.setProperty('transform', 'none');
          });
          historyDeleteButton.addEventListener('pointercancel', function() {
            historyDeleteButton.style.setProperty('transform', 'none');
          });
          historyDeleteButton.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            onDeleteHistory(suggestion, query);
          });
          historyDeleteSlot.appendChild(historyDeleteButton);
        }
        if (historyDeleteSlot) {
          rightSide.appendChild(historyDeleteSlot);
        }
        suggestionItem.appendChild(rightSide);
        if (iconWrapper) {
          suggestionItem._xDirectIconWrap = iconWrapper;
        }
        suggestionItem._xHistoryDeleteButton = historyDeleteButton;
        suggestionItem._xHistoryDeleteSlot = historyDeleteSlot;
        suggestionItem._xHasHistoryDeleteButton = Boolean(historyDeleteButton);
        container.appendChild(suggestionItem);

        if (!shouldUseSearchEngineTheme &&
            !(onlyKeywordSuggestions && suggestion.type === 'newtab') &&
            suggestion.type !== 'directUrl' &&
            suggestion.type !== 'browserPage' &&
            !shouldUseLocalUrlFallbackTheme) {
          getThemeForSuggestion(suggestion).then((theme) => {
            if (!suggestionItem.isConnected) {
              return;
            }
            const nextTheme = resolveThemeForSuggestion(suggestion, theme);
            suggestionItem._xTheme = nextTheme;
            applyThemeVariables(suggestionItem, nextTheme);
            updateSelection(getSelectedIndex());
          });
        }
      });
      syncSuggestionLastState();
    }

    return {
      render,
      renderTabs,
      updateSelection,
      setOpenInCurrentTabModifierActive(active) {
        const nextActive = Boolean(active);
        if (openInCurrentTabModifierActive === nextActive) {
          return;
        }
        openInCurrentTabModifierActive = nextActive;
        updateModifierActionLabels();
      },
      setOpenSwitchInNewTabModifierActive(active) {
        const nextActive = Boolean(active);
        if (openSwitchInNewTabModifierActive === nextActive) {
          return;
        }
        openSwitchInNewTabModifierActive = nextActive;
        updateModifierActionLabels();
      },
      setOpenInBackgroundTabModifierActive(active) {
        const nextActive = Boolean(active);
        if (openInBackgroundTabModifierActive === nextActive) {
          return;
        }
        openInBackgroundTabModifierActive = nextActive;
        updateModifierActionLabels();
      },
      clear,
      destroy,
      getAutoHighlightIndex,
      markAutocompleteTop,
      getItems: function() {
        return items;
      }
    };
  }

  root.LumnoNewtabSuggestionsView = api;
})(globalThis);
