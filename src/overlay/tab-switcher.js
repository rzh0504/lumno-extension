(function() {
  'use strict';

  const HOST_ID = '_x_extension_tab_switcher_host_2026_unique_';
  const PANEL_ID = '_x_extension_tab_switcher_panel_2026_unique_';

  function handleExistingSwitcher(context) {
    const existingHost = document.getElementById(HOST_ID);
    if (!existingHost) {
      return false;
    }
    if (context && context.advanceOnExisting === true && typeof existingHost._lumnoTabSwitcherAdvance === 'function') {
      existingHost._lumnoTabSwitcherAdvance();
      return true;
    }
    const cleanup = existingHost._lumnoTabSwitcherCleanup;
    if (typeof cleanup === 'function') {
      cleanup();
    }
    existingHost.remove();
    return true;
  }

  function getMessage(key, fallback) {
    try {
      if (chrome && chrome.i18n && typeof chrome.i18n.getMessage === 'function') {
        return chrome.i18n.getMessage(key) || fallback;
      }
    } catch (error) {
      // Ignore i18n failures in page context.
    }
    return fallback;
  }

  function sanitizeText(value, fallback) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    return text || fallback || '';
  }

  function getHostLabel(url) {
    try {
      return new URL(url).hostname.replace(/^www\./i, '');
    } catch (error) {
      return '';
    }
  }

  function createElement(doc, tagName, className) {
    const element = doc.createElement(tagName);
    if (className) {
      element.className = className;
    }
    return element;
  }

  function setButtonActive(button, active) {
    if (!button) {
      return;
    }
    button.setAttribute('data-active', active ? 'true' : 'false');
    button.setAttribute('aria-selected', active ? 'true' : 'false');
    if (active && typeof button.focus === 'function') {
      button.focus({ preventScroll: true });
    }
  }

  function clampSelectedIndex(index, length) {
    if (length <= 0) {
      return 0;
    }
    const normalized = Number.isFinite(Number(index)) ? Number(index) : 0;
    return ((normalized % length) + length) % length;
  }

  function buildStyles() {
    return `
      :host {
        all: initial;
      }
      #${PANEL_ID},
      #${PANEL_ID} * {
        box-sizing: border-box;
        font-family: "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0;
      }
      #${PANEL_ID} {
        all: unset;
        position: fixed;
        left: 50%;
        top: 18vh;
        transform: translateX(-50%) translateY(10px) scale(0.98);
        transform-origin: top center;
        z-index: 2147483647;
        width: min(820px, calc(100vw - 28px));
        color: #172033;
        background: rgba(248, 250, 252, 0.94);
        border: 1px solid rgba(15, 23, 42, 0.12);
        border-radius: 18px;
        box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24), 0 2px 12px rgba(15, 23, 42, 0.12);
        backdrop-filter: blur(28px) saturate(160%);
        -webkit-backdrop-filter: blur(28px) saturate(160%);
        padding: 12px;
        pointer-events: auto;
        opacity: 0;
        filter: blur(8px);
        transition: opacity 140ms ease, filter 180ms ease, transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      #${PANEL_ID}[data-visible="true"] {
        opacity: 1;
        filter: blur(0);
        transform: translateX(-50%) translateY(0) scale(1);
      }
      .x-tab-switcher-title {
        color: rgba(23, 32, 51, 0.68);
        font-size: 12px;
        font-weight: 700;
        line-height: 1.2;
        padding: 2px 4px 10px;
        text-transform: uppercase;
      }
      .x-tab-switcher-list {
        display: grid;
        grid-template-columns: repeat(var(--x-tab-count, 5), minmax(0, 1fr));
        gap: 10px;
        width: 100%;
      }
      .x-tab-switcher-card {
        all: unset;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 9px;
        border-radius: 12px;
        border: 1px solid rgba(15, 23, 42, 0.12);
        background: rgba(255, 255, 255, 0.72);
        padding: 8px;
        color: #172033;
        cursor: default;
        box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
        transition: transform 130ms ease, border-color 130ms ease, background 130ms ease, box-shadow 130ms ease;
      }
      .x-tab-switcher-card[data-active="true"] {
        transform: translateY(-2px);
        border-color: rgba(37, 99, 235, 0.58);
        background: rgba(255, 255, 255, 0.96);
        box-shadow: 0 14px 34px rgba(37, 99, 235, 0.18), 0 8px 18px rgba(15, 23, 42, 0.1);
      }
      .x-tab-switcher-card:focus-visible {
        outline: 2px solid rgba(37, 99, 235, 0.72);
        outline-offset: 2px;
      }
      .x-tab-switcher-thumb {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 10;
        overflow: hidden;
        border-radius: 8px;
        border: 1px solid rgba(15, 23, 42, 0.1);
        background:
          linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(20, 184, 166, 0.18)),
          linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(226, 232, 240, 0.92));
      }
      .x-tab-switcher-thumb img[data-kind="thumbnail"] {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        object-position: top center;
      }
      .x-tab-switcher-fallback {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .x-tab-switcher-favicon {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
      }
      .x-tab-switcher-meta {
        min-width: 0;
        display: grid;
        gap: 3px;
      }
      .x-tab-switcher-name-row {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .x-tab-switcher-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #172033;
        font-size: 13px;
        font-weight: 700;
        line-height: 1.25;
      }
      .x-tab-switcher-current {
        flex: 0 0 auto;
        border-radius: 999px;
        padding: 2px 6px;
        color: #0f766e;
        background: rgba(20, 184, 166, 0.13);
        font-size: 10px;
        font-weight: 700;
        line-height: 1.2;
      }
      .x-tab-switcher-host {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: rgba(23, 32, 51, 0.58);
        font-size: 11px;
        font-weight: 600;
        line-height: 1.25;
      }
      @media (max-width: 720px) {
        #${PANEL_ID} {
          top: 10vh;
          width: min(430px, calc(100vw - 20px));
        }
        .x-tab-switcher-list {
          grid-template-columns: 1fr;
        }
        .x-tab-switcher-card {
          display: grid;
          grid-template-columns: 96px minmax(0, 1fr);
          align-items: center;
        }
      }
      @media (prefers-color-scheme: dark) {
        #${PANEL_ID} {
          color: #f8fafc;
          background: rgba(15, 23, 42, 0.9);
          border-color: rgba(255, 255, 255, 0.14);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.36), 0 2px 12px rgba(0, 0, 0, 0.18);
        }
        .x-tab-switcher-title {
          color: rgba(248, 250, 252, 0.62);
        }
        .x-tab-switcher-card {
          color: #f8fafc;
          background: rgba(30, 41, 59, 0.78);
          border-color: rgba(255, 255, 255, 0.12);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
        }
        .x-tab-switcher-card[data-active="true"] {
          background: rgba(30, 41, 59, 0.98);
          border-color: rgba(96, 165, 250, 0.64);
          box-shadow: 0 14px 34px rgba(96, 165, 250, 0.16), 0 8px 18px rgba(0, 0, 0, 0.24);
        }
        .x-tab-switcher-name {
          color: #f8fafc;
        }
        .x-tab-switcher-host {
          color: rgba(248, 250, 252, 0.56);
        }
        .x-tab-switcher-thumb {
          border-color: rgba(255, 255, 255, 0.12);
          background:
            linear-gradient(135deg, rgba(96, 165, 250, 0.18), rgba(45, 212, 191, 0.14)),
            linear-gradient(180deg, rgba(51, 65, 85, 0.9), rgba(15, 23, 42, 0.94));
        }
      }
    `;
  }

  window._x_extension_toggleTabSwitcher_2026_unique_ = function(rawContext) {
    const context = rawContext && typeof rawContext === 'object' ? rawContext : {};
    if (handleExistingSwitcher(context)) {
      return;
    }
    const tabs = Array.isArray(context.tabs) ? context.tabs.filter((tab) => tab && typeof tab.id === 'number') : [];
    if (!tabs.length) {
      return;
    }

    const host = document.createElement('div');
    host.id = HOST_ID;
    host.style.cssText = [
      'all: initial !important',
      'position: fixed !important',
      'inset: 0 !important',
      'z-index: 2147483647 !important',
      'pointer-events: none !important',
      'contain: layout style paint !important'
    ].join(';');
    const shadow = typeof host.attachShadow === 'function' ? host.attachShadow({ mode: 'open' }) : host;
    const style = document.createElement('style');
    style.textContent = buildStyles();
    shadow.appendChild(style);

    const panel = createElement(document, 'div', '');
    panel.id = PANEL_ID;
    panel.setAttribute('role', 'listbox');
    panel.setAttribute('aria-label', getMessage('tab_switcher_title', 'Recent tabs'));
    panel.style.setProperty('--x-tab-count', String(Math.max(1, Math.min(5, tabs.length))));
    const zoomRaw = Number(context.tabZoomFactor);
    if (Number.isFinite(zoomRaw) && zoomRaw > 0 && zoomRaw !== 1) {
      panel.style.setProperty('zoom', String(Math.max(0.35, Math.min(4, 1 / zoomRaw))));
    }

    const title = createElement(document, 'div', 'x-tab-switcher-title');
    title.textContent = getMessage('tab_switcher_title', 'Recent tabs');
    panel.appendChild(title);

    const list = createElement(document, 'div', 'x-tab-switcher-list');
    panel.appendChild(list);
    const buttons = [];
    let selectedIndex = clampSelectedIndex(context.selectedIndex, tabs.length);

    function renderSelection() {
      buttons.forEach((button, index) => {
        setButtonActive(button, index === selectedIndex);
      });
    }

    function close() {
      const cleanup = host._lumnoTabSwitcherCleanup;
      if (typeof cleanup === 'function') {
        cleanup();
      }
      host.remove();
    }

    function switchToSelected() {
      const selected = tabs[selectedIndex];
      if (!selected || typeof selected.id !== 'number') {
        close();
        return;
      }
      chrome.runtime.sendMessage({
        action: 'switchToTab',
        tabId: selected.id,
        windowId: typeof selected.windowId === 'number' ? selected.windowId : null
      }, () => {
        close();
      });
    }

    function selectByOffset(offset) {
      selectedIndex = clampSelectedIndex(selectedIndex + offset, tabs.length);
      renderSelection();
    }

    host._lumnoTabSwitcherAdvance = function() {
      selectByOffset(1);
    };

    function stopHandledKeyEvent(event) {
      if (!event) {
        return;
      }
      event.preventDefault();
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
      event.stopPropagation();
    }

    function handleKeydown(event) {
      if (!event) {
        return;
      }
      const keyText = String(event.key || '').toLowerCase();
      if (event.key === 'Tab') {
        stopHandledKeyEvent(event);
        selectByOffset(event.shiftKey ? -1 : 1);
        return;
      }
      if (keyText === 'q') {
        stopHandledKeyEvent(event);
        selectByOffset(1);
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        stopHandledKeyEvent(event);
        selectByOffset(1);
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        stopHandledKeyEvent(event);
        selectByOffset(-1);
        return;
      }
      if (event.key === 'Enter') {
        stopHandledKeyEvent(event);
        switchToSelected();
        return;
      }
      if (event.key === 'Escape') {
        stopHandledKeyEvent(event);
        close();
      }
    }

    function handleKeyup(event) {
      if (!event) {
        return;
      }
      const keyText = String(event.key || '').toLowerCase();
      if (keyText === 'q') {
        stopHandledKeyEvent(event);
        switchToSelected();
      }
    }

    function handlePointerDown(event) {
      const path = event && typeof event.composedPath === 'function' ? event.composedPath() : [];
      if (!path.includes(panel) && !panel.contains(event.target)) {
        close();
      }
    }

    tabs.forEach((tab, index) => {
      const card = createElement(document, 'button', 'x-tab-switcher-card');
      card.type = 'button';
      card.setAttribute('role', 'option');
      const titleText = sanitizeText(tab.title, getMessage('tab_switcher_untitled', 'Untitled'));
      card.setAttribute('aria-label', titleText);

      const thumb = createElement(document, 'div', 'x-tab-switcher-thumb');
      const thumbnail = typeof tab.thumbnail === 'string' ? tab.thumbnail : '';
      if (thumbnail && thumbnail.startsWith('data:image/')) {
        const thumbImage = createElement(document, 'img', '');
        thumbImage.setAttribute('data-kind', 'thumbnail');
        thumbImage.alt = '';
        thumbImage.src = thumbnail;
        thumb.appendChild(thumbImage);
      } else {
        const fallback = createElement(document, 'div', 'x-tab-switcher-fallback');
        if (tab.favIconUrl) {
          const favicon = createElement(document, 'img', 'x-tab-switcher-favicon');
          favicon.alt = getMessage('tab_switcher_favicon_alt', 'Site icon');
          favicon.src = tab.favIconUrl;
          fallback.appendChild(favicon);
        }
        thumb.appendChild(fallback);
      }
      card.appendChild(thumb);

      const meta = createElement(document, 'div', 'x-tab-switcher-meta');
      const nameRow = createElement(document, 'div', 'x-tab-switcher-name-row');
      const name = createElement(document, 'div', 'x-tab-switcher-name');
      name.textContent = titleText;
      name.title = titleText;
      nameRow.appendChild(name);
      if (tab.current) {
        const current = createElement(document, 'span', 'x-tab-switcher-current');
        current.textContent = getMessage('tab_switcher_current', 'Current');
        nameRow.appendChild(current);
      }
      const hostLabel = createElement(document, 'div', 'x-tab-switcher-host');
      hostLabel.textContent = getHostLabel(tab.url) || tab.url || '';
      meta.appendChild(nameRow);
      meta.appendChild(hostLabel);
      card.appendChild(meta);

      card.addEventListener('mouseenter', () => {
        selectedIndex = index;
        renderSelection();
      });
      card.addEventListener('focus', () => {
        selectedIndex = index;
        renderSelection();
      });
      card.addEventListener('click', (event) => {
        stopHandledKeyEvent(event);
        selectedIndex = index;
        switchToSelected();
      });
      buttons.push(card);
      list.appendChild(card);
    });

    shadow.appendChild(panel);
    document.documentElement.appendChild(host);

    host._lumnoTabSwitcherCleanup = function() {
      window.removeEventListener('keydown', handleKeydown, true);
      window.removeEventListener('keyup', handleKeyup, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
    window.addEventListener('keydown', handleKeydown, true);
    window.addEventListener('keyup', handleKeyup, true);
    document.addEventListener('pointerdown', handlePointerDown, true);

    renderSelection();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (panel.isConnected) {
          panel.setAttribute('data-visible', 'true');
        }
      });
    });
  };
})();
