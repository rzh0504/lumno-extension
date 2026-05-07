(function(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoNewtabPageNotice = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  const NOTICE_ID = '_x_extension_newtab_notice_banner_2026_unique_';

  function getMessage(messages, key, fallback) {
    if (messages && typeof messages.t === 'function') {
      return messages.t(key, fallback);
    }
    if (messages && Object.prototype.hasOwnProperty.call(messages, key)) {
      return String(messages[key] || fallback || '');
    }
    return String(fallback || '');
  }

  function getNoticeParam(params) {
    if (!params) {
      return '';
    }
    if (typeof params.get === 'function') {
      return String(params.get('notice') || '').trim();
    }
    return String(params.notice || '').trim();
  }

  function getRiSvg(messages, icon, className) {
    return messages && typeof messages.getRiSvg === 'function'
      ? messages.getRiSvg(icon, className)
      : '';
  }

  function removeBanner(banner) {
    if (banner && banner.parentNode) {
      banner.parentNode.removeChild(banner);
    }
  }

  function openDetailsPage(options, detailsUrl) {
    const openExtensionDetailsPage = options && options.openExtensionDetailsPage;
    if (typeof openExtensionDetailsPage === 'function') {
      openExtensionDetailsPage(detailsUrl);
      return;
    }
    const chromeApi = options && options.chromeApi;
    const win = options && options.windowObj;
    if (chromeApi && chromeApi.runtime && typeof chromeApi.runtime.sendMessage === 'function') {
      chromeApi.runtime.sendMessage({ action: 'openExtensionDetailsPage' }, (response) => {
        if (chromeApi.runtime && chromeApi.runtime.lastError) {
          if (detailsUrl && win && typeof win.open === 'function') {
            win.open(detailsUrl, '_blank');
          }
          return;
        }
        if (!response || response.ok !== true) {
          const fallbackUrl = response && response.url ? response.url : detailsUrl;
          if (fallbackUrl && win && typeof win.open === 'function') {
            win.open(fallbackUrl, '_blank');
          }
        }
      });
      return;
    }
    if (detailsUrl && win && typeof win.open === 'function') {
      win.open(detailsUrl, '_blank');
    }
  }

  function renderPageNotice(options) {
    const opts = options && typeof options === 'object' ? options : {};
    const messages = opts.messages || {};
    const doc = opts.document || messages.document || root.document;
    const win = opts.windowObj || messages.windowObj || root.window || root;
    if (!doc || !doc.body || getNoticeParam(opts.params) !== 'file-access') {
      return null;
    }

    const existing = doc.getElementById(NOTICE_ID);
    if (existing) {
      removeBanner(existing);
    }

    const banner = doc.createElement('div');
    banner.id = NOTICE_ID;

    const content = doc.createElement('div');
    content.className = 'x-nt-page-notice-content';

    const icon = doc.createElement('div');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = getRiSvg(messages, 'ri-error-warning-line', 'ri-size-20');
    icon.className = 'x-nt-page-notice-icon';

    const message = doc.createElement('div');
    message.textContent = getMessage(
      messages,
      'newtab_file_access_notice_title',
      '由于浏览器限制，若要在本地文件页面（如 PDF、HTML）中唤起聚焦搜索，请手动开启“允许访问文件网址”'
    );
    message.className = 'x-nt-page-notice-message';

    const detailsUrl = String(opts.detailsUrl || messages.detailsUrl || '');
    const primaryButton = doc.createElement('button');
    primaryButton.type = 'button';
    primaryButton.textContent = getMessage(messages, 'newtab_file_access_notice_open_cta', '前往开启');
    primaryButton.className = 'x-nt-page-notice-primary';
    primaryButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openDetailsPage({ ...opts, windowObj: win }, detailsUrl);
    });

    const closeButton = doc.createElement('button');
    closeButton.type = 'button';
    closeButton.setAttribute(
      'aria-label',
      getMessage(messages, 'newtab_file_access_notice_close', '关闭提示')
    );
    closeButton.innerHTML = getRiSvg(messages, 'ri-close-line', 'ri-size-16');
    closeButton.className = 'x-nt-page-notice-close';

    const controller = {
      element: banner,
      dismiss() {
        removeBanner(banner);
        if (typeof opts.onClose === 'function') {
          opts.onClose();
        }
      }
    };

    closeButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      controller.dismiss();
    });

    content.appendChild(icon);
    content.appendChild(message);
    banner.appendChild(content);
    banner.appendChild(primaryButton);
    banner.appendChild(closeButton);

    const bottomDock = opts.bottomDock || messages.bottomDock || null;
    const referenceNode = bottomDock && bottomDock.parentNode === doc.body ? bottomDock : null;
    doc.body.insertBefore(banner, referenceNode);
    return controller;
  }

  return Object.freeze({
    NOTICE_ID,
    renderPageNotice
  });
});
