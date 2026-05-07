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
    const applyFallbackIcon = typeof config.applyFallbackIcon === 'function'
      ? config.applyFallbackIcon
      : noop;
    const attachFaviconWithFallbacks = typeof config.attachFaviconWithFallbacks === 'function'
      ? config.attachFaviconWithFallbacks
      : noop;
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

    function getDefaultTheme() {
      return config.defaultTheme || {};
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
      return tag;
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
      applySuggestionTagStyles(item._xHistoryTag, resolvedTheme, isActive);
      applySuggestionTagStyles(item._xBookmarkTag, resolvedTheme, isActive);
      applySuggestionTagStyles(item._xTopSiteTag, resolvedTheme, isActive);
      if (item._xTagContainer) {
        item._xTagContainer.setAttribute('data-active', isActive ? 'true' : 'false');
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
        const useFallback = !tab.favIconUrl || shouldBlockFaviconForHost(hostForTab);
        const favicon = createFaviconImage(index, { fallbackSize: useFallback });
        if (useFallback) {
          applyFallbackIcon(favicon);
        } else {
          favicon.src = tab.favIconUrl;
          favicon.addEventListener('load', function() {
            applyFaviconOpticalShift(favicon);
          });
        }
        const iconSlot = createIconSlot(favicon, !useFallback);
        leftSide.appendChild(iconSlot);
        suggestionItem._xIconWrap = iconSlot;
        suggestionItem._xIconIsFavicon = !useFallback;
        favicon.onerror = function() {
          reportMissingIcon('tab', tab && tab.url ? tab.url : '', favicon.src);
          applyFallbackIcon(favicon);
          favicon.setAttribute('data-fallback-size', 'true');
          suggestionItem._xIconIsFavicon = false;
          iconSlot.setAttribute('data-favicon', 'false');
        };

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
        suggestionItem.appendChild(switchButton);
        container.appendChild(suggestionItem);

        const themeSourceSuggestion = {
          url: tab.url || '',
          favicon: tab.favIconUrl || ''
        };
        const themeHost = getThemeHostForSuggestion(themeSourceSuggestion);
        const immediateTheme = getImmediateThemeForSuggestion(themeSourceSuggestion) || getDefaultTheme();
        suggestionItem._xTheme = immediateTheme;
        suggestionItem._xThemeHost = themeHost;
        applyThemeVariables(suggestionItem, immediateTheme);
        getThemeForSuggestion(themeSourceSuggestion).then((theme) => {
          if (!suggestionItem.isConnected) {
            return;
          }
          suggestionItem._xTheme = theme;
          updateSelection(getSelectedIndex());
        });
      });

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
        let immediateTheme = getImmediateThemeForSuggestion(suggestion) || getDefaultTheme();
        if (suggestion.type === 'directUrl' || suggestion.type === 'browserPage') {
          immediateTheme = config.urlHighlightTheme || immediateTheme;
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
        if (suggestion.type === 'browserPage') {
          iconNode = createSuggestionInlineIcon('ri-window-2-line');
        } else if (suggestion.type === 'directUrl') {
          iconNode = createSearchIcon();
        } else if (suggestion.type === 'commandNewTab') {
          iconNode = createSuggestionInlineIcon('ri-add-line', 'subtext');
        } else if (suggestion.type === 'commandSettings') {
          iconNode = createSuggestionInlineIcon('ri-settings-3-line', 'subtext');
        } else if (suggestion.type === 'modeSwitch' && suggestion.favicon) {
          const favicon = createFaviconImage(index);
          favicon.src = suggestion.favicon || '';
          favicon.onerror = function() {
            const fallbackIcon = createSearchIcon('subtext');
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
          const favicon = createFaviconImage(index, { objectFitContain: true });
          favicon.src = suggestion.favicon || '';
          favicon.onerror = function() {
            const fallbackIcon = createSearchIcon('subtext');
            if (favicon.parentNode) {
              favicon.parentNode.replaceChild(fallbackIcon, favicon);
            }
          };
          iconNode = favicon;
        } else if (suggestion.favicon) {
          const suggestionHost = suggestion && suggestion.url ? getHostFromUrl(suggestion.url) : '';
          const isLocalSuggestion = suggestionHost && shouldBlockFaviconForHost(suggestionHost);
          if (isLocalSuggestion) {
            iconNode = createLinkIcon();
          } else {
            const favicon = createFaviconImage(index, { objectFitContain: true });
            const faviconPageUrl = suggestion && suggestion.url ? suggestion.url : (suggestion.favicon || '');
            attachFaviconWithFallbacks(favicon, faviconPageUrl, suggestionHost);
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

        if (suggestion.type === 'topSite' || suggestion.isTopSite) {
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

        const isDirectHighlight = isPrimaryHighlight &&
          (suggestion.type === 'directUrl' || suggestion.type === 'browserPage');
        const isMergedHighlight = Boolean(mergedProvider && primarySuggestion === suggestion && isPrimaryHighlight);
        const shouldShowEnterTag = !isPrimarySearchSuggest && isPrimaryHighlight &&
          !onlyKeywordSuggestions &&
          (primaryHighlightReason === 'topSite' ||
            primaryHighlightReason === 'inline' ||
            primaryHighlightReason === 'autocomplete' ||
            isDirectHighlight ||
            isMergedHighlight);
        if (shouldShowEnterTag) {
          actionTags.appendChild(createActionTag(t('action_go_current_tab', '前往'), 'Enter'));
        }
        if (isPrimaryHighlight && onlyKeywordSuggestions && suggestion.type === 'newtab') {
          actionTags.appendChild(createActionTag(getSearchActionLabel(), 'Enter'));
        }

        suggestionItem._xTagContainer = actionTags;
        suggestionItem._xHasActionTags = actionTags.childNodes.length > 0;

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

        suggestionItem.addEventListener('click', function() {
          onActivateSuggestion(suggestion, query);
        });

        leftSide.appendChild(iconNode);
        leftSide.appendChild(textWrapper);
        suggestionItem.appendChild(leftSide);
        rightSide.appendChild(actionTags);

        let historyDeleteButton = null;
        let historyDeleteSlot = null;
        if (suggestion.type === 'history' && !suggestion.isTopSite) {
          historyDeleteSlot = documentRef.createElement('div');
          historyDeleteSlot.className = 'x-nt-history-delete-slot';
          historyDeleteButton = documentRef.createElement('button');
          historyDeleteButton.type = 'button';
          historyDeleteButton.className = 'x-nt-history-delete-button';
          const removeHistoryTooltipText = t('search_remove_history_tooltip', '移除该历史');
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
            suggestion.type !== 'browserPage') {
          getThemeForSuggestion(suggestion).then((theme) => {
            if (!suggestionItem.isConnected) {
              return;
            }
            suggestionItem._xTheme = theme;
            applyThemeVariables(suggestionItem, theme);
            updateSelection(getSelectedIndex());
          });
        }
      });
    }

    return {
      render,
      renderTabs,
      updateSelection,
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
