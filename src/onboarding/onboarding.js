(function() {
  const CONTENT = globalThis.LumnoOnboardingContent || {};
  if (typeof CONTENT.getOnboardingContent !== 'function') {
    return;
  }

  const LANGUAGE_STORAGE_KEY = '_x_extension_language_2024_unique_';
  const RELEASE_URL = 'https://lumno.kubai.design/release/';
  const SHORTCUTS_URL = 'chrome://extensions/shortcuts';
  const ACTION_MESSAGE_BY_ID = Object.freeze({
    openShortcuts: 'openExtensionShortcutsPage',
    openNewtab: 'openNewTab',
    openOptions: 'openOptionsPage'
  });
  const HTML_LANG_BY_LOCALE = Object.freeze({
    zh_CN: 'zh-CN',
    zh_TW: 'zh-TW',
    ja: 'ja',
    en: 'en'
  });
  const TOAST_BY_LOCALE = Object.freeze({
    zh_CN: {
      error: '操作失败，请稍后重试',
      copied: '已复制快捷键设置地址'
    },
    zh_TW: {
      error: '操作失敗，請稍後再試',
      copied: '已複製快捷鍵設定網址'
    },
    ja: {
      error: '操作に失敗しました。後でもう一度お試しください',
      copied: 'ショートカット設定の URL をコピーしました'
    },
    en: {
      error: 'Something went wrong. Please try again.',
      copied: 'Shortcut settings URL copied'
    }
  });

  const params = new URLSearchParams(window.location.search || '');
  const toast = document.getElementById('onboarding-toast');
  let currentLocale = 'en';
  let toastTimer = 0;

  function getChromeApi() {
    return typeof chrome !== 'undefined' ? chrome : null;
  }

  function getToastMessages() {
    return TOAST_BY_LOCALE[currentLocale] || TOAST_BY_LOCALE.en;
  }

  function showToast(message) {
    if (!toast || !message) {
      return;
    }
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = 0;
    }
    toast.textContent = message;
    toast.setAttribute('data-visible', 'true');
    toastTimer = setTimeout(() => {
      toast.setAttribute('data-visible', 'false');
      toastTimer = 0;
    }, 2200);
  }

  function setText(id, text) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text || '';
    }
  }

  function createIcon(className) {
    const icon = document.createElement('i');
    icon.className = `ri-icon ${className || 'ri-arrow-right-line'}`;
    icon.setAttribute('aria-hidden', 'true');
    return icon;
  }

  function bindActionButton(button, action, tone) {
    if (!button || !action) {
      return;
    }
    button.dataset.action = action.id || '';
    const label = button.querySelector('span') || button;
    label.textContent = action.label || '';
    if (tone) {
      button.dataset.actionTone = tone;
    }
  }

  function createStepCard(step, index) {
    const card = document.createElement('article');
    card.className = 'step-card';

    const iconWrap = document.createElement('span');
    iconWrap.className = 'step-icon';
    iconWrap.appendChild(createIcon(step.icon));

    const copy = document.createElement('div');
    copy.className = 'step-copy';

    const title = document.createElement('h3');
    title.className = 'step-title';
    title.textContent = step.title || '';

    const body = document.createElement('p');
    body.className = 'step-body';
    body.textContent = step.body || '';

    copy.appendChild(title);
    copy.appendChild(body);

    if (step.action && step.action.id) {
      const action = document.createElement('button');
      action.className = 'action-button action-button--secondary step-action';
      action.type = 'button';
      action.dataset.action = step.action.id;
      action.appendChild(createIcon(index === 0 ? 'ri-external-link-line' : 'ri-arrow-right-line'));
      const label = document.createElement('span');
      label.textContent = step.action.label || '';
      action.appendChild(label);
      copy.appendChild(action);
    }

    card.appendChild(iconWrap);
    card.appendChild(copy);
    return card;
  }

  function createFeatureCard(feature) {
    const card = document.createElement('article');
    card.className = 'feature-card';

    const icon = document.createElement('span');
    icon.className = 'feature-icon';
    icon.appendChild(createIcon(feature.icon));

    const copy = document.createElement('div');
    copy.className = 'feature-copy';

    const title = document.createElement('h3');
    title.className = 'feature-title';
    title.textContent = feature.title || '';

    const body = document.createElement('p');
    body.className = 'feature-body';
    body.textContent = feature.body || '';

    copy.appendChild(title);
    copy.appendChild(body);
    card.appendChild(icon);
    card.appendChild(copy);
    return card;
  }

  function render(content) {
    currentLocale = content.locale || 'en';
    document.documentElement.lang = HTML_LANG_BY_LOCALE[currentLocale] || 'en';
    document.title = `${content.brand || 'Lumno'} Quick Start`;

    setText('onboarding-eyebrow', content.hero.eyebrow);
    setText('onboarding-title', content.hero.title);
    setText('onboarding-body', content.hero.body);
    setText('onboarding-steps-title', content.stepsTitle);
    setText('onboarding-features-title', content.featuresTitle);
    setText('onboarding-footer-note', content.footer.note);

    bindActionButton(document.querySelector('[data-action-slot="primary"]'), content.hero.primaryAction, 'primary');
    bindActionButton(document.querySelector('[data-action-slot="secondary"]'), content.hero.secondaryAction, 'secondary');
    bindActionButton(document.querySelector('[data-action-slot="release"]'), content.footer.releaseAction, 'release');

    const steps = document.getElementById('onboarding-steps');
    if (steps) {
      steps.textContent = '';
      content.steps.forEach((step, index) => {
        steps.appendChild(createStepCard(step, index));
      });
    }

    const features = document.getElementById('onboarding-features');
    if (features) {
      features.textContent = '';
      content.features.forEach((feature) => {
        features.appendChild(createFeatureCard(feature));
      });
    }
  }

  function getRuntimeLocale(callback) {
    const chromeApi = getChromeApi();
    const fromParam = params.get('locale') || params.get('lang') || '';
    if (fromParam) {
      callback(CONTENT.normalizeLocale(fromParam));
      return;
    }
    if (!chromeApi || !chromeApi.storage) {
      callback(CONTENT.normalizeLocale(navigator.language || 'en'));
      return;
    }
    const storageArea = chromeApi.storage.sync || chromeApi.storage.local;
    if (!storageArea || typeof storageArea.get !== 'function') {
      callback(CONTENT.normalizeLocale(navigator.language || 'en'));
      return;
    }
    try {
      storageArea.get([LANGUAGE_STORAGE_KEY], (result) => {
        const runtimeError = chromeApi.runtime ? chromeApi.runtime.lastError : null;
        const stored = !runtimeError && result ? result[LANGUAGE_STORAGE_KEY] : '';
        const locale = stored && stored !== 'system'
          ? stored
          : (navigator.language || 'en');
        callback(CONTENT.normalizeLocale(locale));
      });
    } catch (e) {
      callback(CONTENT.normalizeLocale(navigator.language || 'en'));
    }
  }

  function updateVersionChip() {
    const chip = document.getElementById('onboarding-version-chip');
    const text = document.getElementById('onboarding-version-text');
    const chromeApi = getChromeApi();
    const versionFromParams = (params.get('version') || '').trim();
    const manifestVersion = chromeApi && chromeApi.runtime && typeof chromeApi.runtime.getManifest === 'function'
      ? String((chromeApi.runtime.getManifest() || {}).version || '').trim()
      : '';
    const version = versionFromParams || (manifestVersion ? `v${manifestVersion}` : '');
    if (!chip || !text) {
      return;
    }
    if (!version) {
      chip.hidden = true;
      return;
    }
    text.textContent = version;
  }

  function openReleasePage() {
    const url = new URL(RELEASE_URL);
    url.searchParams.set('entry', 'ext');
    url.searchParams.set('reason', 'manual');
    const version = (params.get('version') || '').trim();
    if (version) {
      url.searchParams.set('version', version);
    }
    openExternalUrl(url.toString());
  }

  function openExternalUrl(url) {
    const chromeApi = getChromeApi();
    if (chromeApi && chromeApi.runtime && typeof chromeApi.runtime.sendMessage === 'function') {
      chromeApi.runtime.sendMessage({ action: 'createTab', url }, (response) => {
        if (chromeApi.runtime && chromeApi.runtime.lastError) {
          window.open(url, '_blank', 'noopener');
          return;
        }
        if (!response || response.ok === false) {
          window.open(url, '_blank', 'noopener');
        }
      });
      return;
    }
    window.open(url, '_blank', 'noopener');
  }

  function copyShortcutsUrl() {
    const messages = getToastMessages();
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(SHORTCUTS_URL).then(() => {
        showToast(messages.copied);
      }).catch(() => {
        showToast(SHORTCUTS_URL);
      });
      return;
    }
    showToast(SHORTCUTS_URL);
  }

  function runAction(actionId) {
    const id = String(actionId || '');
    if (!id) {
      return;
    }
    if (id === 'openRelease') {
      openReleasePage();
      return;
    }
    const messageAction = ACTION_MESSAGE_BY_ID[id];
    const chromeApi = getChromeApi();
    if (!messageAction || !chromeApi || !chromeApi.runtime || typeof chromeApi.runtime.sendMessage !== 'function') {
      if (id === 'openShortcuts') {
        copyShortcutsUrl();
      }
      return;
    }
    chromeApi.runtime.sendMessage({ action: messageAction }, (response) => {
      if (chromeApi.runtime && chromeApi.runtime.lastError) {
        showToast(getToastMessages().error);
        return;
      }
      if (!response || response.ok === false) {
        showToast(getToastMessages().error);
      }
    });
  }

  document.addEventListener('click', (event) => {
    const target = event.target && event.target.closest
      ? event.target.closest('[data-action]')
      : null;
    if (!target) {
      return;
    }
    event.preventDefault();
    runAction(target.dataset.action);
  });

  getRuntimeLocale((locale) => {
    render(CONTENT.getOnboardingContent(locale));
    updateVersionChip();
  });
})();
