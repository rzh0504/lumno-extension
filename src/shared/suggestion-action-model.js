(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoSuggestionActionModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const SITE_SEARCH_TYPES = new Set([
    'siteSearch',
    'inlineSiteSearch',
    'siteSearchPrompt'
  ]);

  const PRIMARY_ENTER_REASONS = new Set([
    'topSite',
    'inline',
    'autocomplete',
    'openTab',
    'currentOpenTab'
  ]);

  function isDirectNavigationSuggestion(suggestion) {
    return Boolean(
      suggestion &&
      (suggestion.type === 'directUrl' || suggestion.type === 'browserPage')
    );
  }

  function isSiteSearchSuggestion(suggestion) {
    return Boolean(suggestion && SITE_SEARCH_TYPES.has(suggestion.type));
  }

  function getVisitButtonAction(suggestion, options) {
    const config = options || {};
    if (!suggestion) {
      return null;
    }
    if (suggestion.type === 'modeSwitch') {
      return null;
    }
    if (suggestion.type === 'newtab') {
      return 'search';
    }
    if (suggestion.type === 'commandNewTab') {
      return 'commandNewTab';
    }
    if (suggestion.type === 'commandSettings') {
      return 'commandSettings';
    }
    if (suggestion.type === 'commandDocumentPip') {
      return 'commandDocumentPip';
    }
    if (config.shouldSwitchMatchedTab) {
      return 'switch';
    }
    if (isSiteSearchSuggestion(suggestion)) {
      return 'search';
    }
    if (isDirectNavigationSuggestion(suggestion)) {
      return 'open';
    }
    if (suggestion.type === 'googleSuggest') {
      return 'search';
    }
    return 'openNewTab';
  }

  function getModifierAdjustedAction(action, options) {
    const rawAction = String(action || '');
    const config = options || {};
    if (config.openInCurrentTab && rawAction === 'openNewTab') {
      return 'go';
    }
    return rawAction;
  }

  function shouldOpenNewTabActionInCurrentTab(suggestion, options) {
    const config = options || {};
    if (!config.openInCurrentTab) {
      return false;
    }
    const action = config.action || getVisitButtonAction(suggestion, config);
    return action === 'openNewTab';
  }

  function createSearchActionModel(options) {
    const config = options || {};
    const suggestion = config.suggestion || null;
    const isPrimaryHighlight = Boolean(config.isPrimaryHighlight);
    const primaryHighlightReason = String(config.primaryHighlightReason || '');
    const onlyKeywordSuggestions = Boolean(config.onlyKeywordSuggestions);
    const isPrimarySearchSuggest = Boolean(config.isPrimarySearchSuggest);
    const isMergedHighlight = Boolean(config.isMergedHighlight);
    const shouldSwitchMatchedTab = Boolean(config.shouldSwitchMatchedTab);
    const enterAction = config.enterAction || 'openNewTab';
    const actionTags = [];
    const isDirectHighlight = isPrimaryHighlight && isDirectNavigationSuggestion(suggestion);
    const shouldShowEnterTag = !isPrimarySearchSuggest &&
      isPrimaryHighlight &&
      !onlyKeywordSuggestions &&
      (
        PRIMARY_ENTER_REASONS.has(primaryHighlightReason) ||
        isDirectHighlight ||
        isMergedHighlight
      );

    if (shouldSwitchMatchedTab) {
      actionTags.push({ action: 'switch', keyLabel: 'Enter' });
    } else if (shouldShowEnterTag) {
      actionTags.push({ action: enterAction, keyLabel: 'Enter' });
    }
    if (isPrimaryHighlight && onlyKeywordSuggestions && suggestion && suggestion.type === 'newtab') {
      actionTags.push({ action: 'search', keyLabel: 'Enter' });
    }

    const visitButtonAction = getVisitButtonAction(suggestion, {
      shouldSwitchMatchedTab
    });
    const alwaysHideVisitButton = !visitButtonAction || Boolean(suggestion && suggestion.type === 'modeSwitch');

    return {
      actionTags,
      visitButtonAction,
      alwaysHideVisitButton,
      hasActionTags: actionTags.length > 0,
      hasSwitchAction: shouldSwitchMatchedTab,
      hideSourceTags: shouldSwitchMatchedTab
    };
  }

  function shouldShowVisitButton(model, isActive) {
    if (!model || model.alwaysHideVisitButton || !model.visitButtonAction) {
      return false;
    }
    return !(isActive && model.hasActionTags);
  }

  function getProviderKey(provider) {
    return provider && provider.key ? String(provider.key) : '';
  }

  function getActionContextKey(options) {
    const config = options || {};
    const primarySuggestion = config.primarySuggestion || null;
    const matchedTabId = primarySuggestion && typeof primarySuggestion._xMatchedTabId === 'number'
      ? String(primarySuggestion._xMatchedTabId)
      : '';
    return [
      Number.isInteger(config.primaryHighlightIndex) ? String(config.primaryHighlightIndex) : '-1',
      String(config.primaryHighlightReason || ''),
      config.onlyKeywordSuggestions ? 'keyword' : 'mixed',
      getProviderKey(config.mergedProvider),
      primarySuggestion && primarySuggestion.type ? String(primarySuggestion.type) : '',
      primarySuggestion && primarySuggestion.url ? String(primarySuggestion.url) : '',
      getProviderKey(primarySuggestion && primarySuggestion.provider),
      matchedTabId
    ].join('|');
  }

  return {
    createSearchActionModel,
    getVisitButtonAction,
    getModifierAdjustedAction,
    shouldOpenNewTabActionInCurrentTab,
    shouldShowVisitButton,
    getActionContextKey
  };
});
