(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LumnoOnboardingContent = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const SUPPORTED_LOCALES = Object.freeze(['zh_CN', 'zh_TW', 'ja', 'en']);

  function normalizeLocale(locale) {
    const raw = String(locale || '').trim();
    if (!raw) {
      return 'en';
    }
    const lower = raw.toLowerCase().replace('_', '-');
    if (lower.startsWith('zh')) {
      if (lower.includes('tw') || lower.includes('hk') || lower.includes('mo') || lower.includes('hant')) {
        return 'zh_TW';
      }
      return 'zh_CN';
    }
    if (lower === 'ja' || lower.startsWith('ja-')) {
      return 'ja';
    }
    return 'en';
  }

  const CONTENT = Object.freeze({
    zh_CN: Object.freeze({
      locale: 'zh_CN',
      brand: 'Lumno',
      hero: Object.freeze({
        eyebrow: '安装完成',
        title: '用 Lumno 把浏览器变成命令工作台',
        body: '先完成一个目标：设置快捷键，然后从任意网页唤起聚焦搜索。之后你可以慢慢探索站内搜索、新标签页和实验室功能。',
        primaryAction: Object.freeze({ id: 'openShortcuts', label: '设置快捷键' }),
        secondaryAction: Object.freeze({ id: 'openNewtab', label: '打开 Lumno 新标签页' })
      }),
      stepsTitle: '推荐的第一次使用路径',
      steps: Object.freeze([
        Object.freeze({
          icon: 'ri-keyboard-line',
          title: '设置唤起快捷键',
          body: '打开浏览器扩展快捷键页，给「Open command bar」设置一个顺手的组合键。',
          action: Object.freeze({ id: 'openShortcuts', label: '前往快捷键设置' })
        }),
        Object.freeze({
          icon: 'ri-search-2-line',
          title: '试一次聚焦搜索',
          body: '在任意网页按下快捷键，输入关键词即可搜索历史、书签、常用站点和已打开标签页。',
          action: Object.freeze({ id: 'openNewtab', label: '用新标签页练习' })
        }),
        Object.freeze({
          icon: 'ri-corner-up-right-line',
          title: '用 Tab 锁定站内搜索',
          body: '输入 gh、yt、bb、gpt 等关键词后按 Tab，再输入搜索内容，即可直达站内结果或 AI 输入框。',
          action: Object.freeze({ id: 'openOptions', label: '管理站内搜索' })
        }),
        Object.freeze({
          icon: 'ri-layout-grid-line',
          title: '整理新标签页',
          body: '用 Lumno 新标签页查看常用站点、书签和壁纸，让每次开新页都更快进入工作状态。',
          action: Object.freeze({ id: 'openNewtab', label: '打开新标签页' })
        }),
        Object.freeze({
          icon: 'ri-flask-line',
          title: '按需开启实验室功能',
          body: '自动画中画、网页剪裁和置顶标签页恢复都在设置里，可以等熟悉核心流程后再启用。',
          action: Object.freeze({ id: 'openOptions', label: '打开设置' })
        })
      ]),
      featuresTitle: 'Lumno 能帮你做什么',
      features: Object.freeze([
        Object.freeze({ icon: 'ri-command-line', title: '网页聚焦搜索', body: '在任何页面打开统一命令栏。' }),
        Object.freeze({ icon: 'ri-bookmark-3-line', title: '书签与历史', body: '混合搜索书签、历史、常用站点和标签页。' }),
        Object.freeze({ icon: 'ri-global-line', title: '站内搜索', body: '用关键词直达 GitHub、YouTube、Bilibili、AI 工具等。' }),
        Object.freeze({ icon: 'ri-window-line', title: '极简新标签页', body: '同一套搜索体验延伸到新标签页。' })
      ]),
      footer: Object.freeze({
        note: '以后也可以在设置页的「常规」里重新打开这份引导。',
        releaseAction: Object.freeze({ id: 'openRelease', label: '查看更新日志' })
      })
    }),
    zh_TW: Object.freeze({
      locale: 'zh_TW',
      brand: 'Lumno',
      hero: Object.freeze({
        eyebrow: '安裝完成',
        title: '用 Lumno 把瀏覽器變成命令工作台',
        body: '先完成一個目標：設定快捷鍵，然後從任意網頁喚起聚焦搜尋。之後你可以慢慢探索站內搜尋、新分頁與實驗室功能。',
        primaryAction: Object.freeze({ id: 'openShortcuts', label: '設定快捷鍵' }),
        secondaryAction: Object.freeze({ id: 'openNewtab', label: '開啟 Lumno 新分頁' })
      }),
      stepsTitle: '推薦的第一次使用路徑',
      steps: Object.freeze([
        Object.freeze({
          icon: 'ri-keyboard-line',
          title: '設定喚起快捷鍵',
          body: '開啟瀏覽器擴充功能快捷鍵頁，替「Open command bar」設定一個順手的組合鍵。',
          action: Object.freeze({ id: 'openShortcuts', label: '前往快捷鍵設定' })
        }),
        Object.freeze({
          icon: 'ri-search-2-line',
          title: '試一次聚焦搜尋',
          body: '在任意網頁按下快捷鍵，輸入關鍵字即可搜尋歷史、書籤、常用站點和已開啟分頁。',
          action: Object.freeze({ id: 'openNewtab', label: '用新分頁練習' })
        }),
        Object.freeze({
          icon: 'ri-corner-up-right-line',
          title: '用 Tab 鎖定站內搜尋',
          body: '輸入 gh、yt、bb、gpt 等關鍵字後按 Tab，再輸入搜尋內容，即可直達站內結果或 AI 輸入框。',
          action: Object.freeze({ id: 'openOptions', label: '管理站內搜尋' })
        }),
        Object.freeze({
          icon: 'ri-layout-grid-line',
          title: '整理新分頁',
          body: '用 Lumno 新分頁查看常用站點、書籤與桌布，讓每次開新頁都更快進入工作狀態。',
          action: Object.freeze({ id: 'openNewtab', label: '開啟新分頁' })
        }),
        Object.freeze({
          icon: 'ri-flask-line',
          title: '按需開啟實驗室功能',
          body: '自動畫中畫、網頁剪裁和釘選分頁恢復都在設定裡，可以等熟悉核心流程後再啟用。',
          action: Object.freeze({ id: 'openOptions', label: '開啟設定' })
        })
      ]),
      featuresTitle: 'Lumno 能幫你做什麼',
      features: Object.freeze([
        Object.freeze({ icon: 'ri-command-line', title: '網頁聚焦搜尋', body: '在任何頁面開啟統一命令欄。' }),
        Object.freeze({ icon: 'ri-bookmark-3-line', title: '書籤與歷史', body: '混合搜尋書籤、歷史、常用站點和分頁。' }),
        Object.freeze({ icon: 'ri-global-line', title: '站內搜尋', body: '用關鍵字直達 GitHub、YouTube、Bilibili、AI 工具等。' }),
        Object.freeze({ icon: 'ri-window-line', title: '極簡新分頁', body: '同一套搜尋體驗延伸到新分頁。' })
      ]),
      footer: Object.freeze({
        note: '以後也可以在設定頁的「常規」裡重新開啟這份引導。',
        releaseAction: Object.freeze({ id: 'openRelease', label: '查看更新日誌' })
      })
    }),
    ja: Object.freeze({
      locale: 'ja',
      brand: 'Lumno',
      hero: Object.freeze({
        eyebrow: 'インストール完了',
        title: 'Lumno でブラウザをコマンドワークスペースに',
        body: 'まずはショートカットを設定し、任意のページからフォーカス検索を開くところまで進めましょう。その後でサイト検索、新しいタブ、実験機能を試せます。',
        primaryAction: Object.freeze({ id: 'openShortcuts', label: 'ショートカットを設定' }),
        secondaryAction: Object.freeze({ id: 'openNewtab', label: 'Lumno の新しいタブを開く' })
      }),
      stepsTitle: '最初におすすめの流れ',
      steps: Object.freeze([
        Object.freeze({
          icon: 'ri-keyboard-line',
          title: '起動ショートカットを設定',
          body: 'ブラウザの拡張機能ショートカットページを開き、「Open command bar」に使いやすいキーを割り当てます。',
          action: Object.freeze({ id: 'openShortcuts', label: 'ショートカット設定へ' })
        }),
        Object.freeze({
          icon: 'ri-search-2-line',
          title: 'フォーカス検索を試す',
          body: '任意のページでショートカットを押すと、履歴、ブックマーク、よく使うサイト、開いているタブをまとめて検索できます。',
          action: Object.freeze({ id: 'openNewtab', label: '新しいタブで試す' })
        }),
        Object.freeze({
          icon: 'ri-corner-up-right-line',
          title: 'Tab でサイト検索を固定',
          body: 'gh、yt、bb、gpt などのキーワードを入力して Tab を押し、検索語を入れると目的のサイトや AI 入力欄へ移動できます。',
          action: Object.freeze({ id: 'openOptions', label: 'サイト検索を管理' })
        }),
        Object.freeze({
          icon: 'ri-layout-grid-line',
          title: '新しいタブを整える',
          body: 'よく使うサイト、ブックマーク、壁紙を Lumno の新しいタブでまとめて確認できます。',
          action: Object.freeze({ id: 'openNewtab', label: '新しいタブを開く' })
        }),
        Object.freeze({
          icon: 'ri-flask-line',
          title: '必要に応じて実験機能を有効化',
          body: '自動 Picture-in-Picture、ページ切り抜き、ピン留めタブ復元は設定から後で有効にできます。',
          action: Object.freeze({ id: 'openOptions', label: '設定を開く' })
        })
      ]),
      featuresTitle: 'Lumno でできること',
      features: Object.freeze([
        Object.freeze({ icon: 'ri-command-line', title: 'ページ上のフォーカス検索', body: 'どのページからでも統一されたコマンドバーを開けます。' }),
        Object.freeze({ icon: 'ri-bookmark-3-line', title: 'ブックマークと履歴', body: 'ブックマーク、履歴、よく使うサイト、タブを横断検索できます。' }),
        Object.freeze({ icon: 'ri-global-line', title: 'サイト検索', body: 'キーワードで GitHub、YouTube、Bilibili、AI ツールなどへ移動できます。' }),
        Object.freeze({ icon: 'ri-window-line', title: 'ミニマルな新しいタブ', body: '同じ検索体験を新しいタブでも使えます。' })
      ]),
      footer: Object.freeze({
        note: 'このガイドは、あとから設定ページの「全体設定」で開き直せます。',
        releaseAction: Object.freeze({ id: 'openRelease', label: 'リリースノートを見る' })
      })
    }),
    en: Object.freeze({
      locale: 'en',
      brand: 'Lumno',
      hero: Object.freeze({
        eyebrow: 'Installed',
        title: 'Turn your browser into a command workspace with Lumno',
        body: 'Start with one win: set the shortcut, then open Focus Search from any page. Site search, New Tab, and Labs can come right after that.',
        primaryAction: Object.freeze({ id: 'openShortcuts', label: 'Set shortcut' }),
        secondaryAction: Object.freeze({ id: 'openNewtab', label: 'Open Lumno New Tab' })
      }),
      stepsTitle: 'Recommended first run',
      steps: Object.freeze([
        Object.freeze({
          icon: 'ri-keyboard-line',
          title: 'Set the command shortcut',
          body: 'Open the browser extension shortcut page and assign a comfortable key combo to “Open command bar”.',
          action: Object.freeze({ id: 'openShortcuts', label: 'Open shortcut settings' })
        }),
        Object.freeze({
          icon: 'ri-search-2-line',
          title: 'Try Focus Search once',
          body: 'Press the shortcut on any page, then search history, bookmarks, top sites, and open tabs from one input.',
          action: Object.freeze({ id: 'openNewtab', label: 'Practice in New Tab' })
        }),
        Object.freeze({
          icon: 'ri-corner-up-right-line',
          title: 'Press Tab for site search',
          body: 'Type gh, yt, bb, gpt, or another keyword, press Tab, then type your query to jump straight into that site or AI input.',
          action: Object.freeze({ id: 'openOptions', label: 'Manage site search' })
        }),
        Object.freeze({
          icon: 'ri-layout-grid-line',
          title: 'Tune your New Tab',
          body: 'Use Lumno New Tab for common sites, bookmarks, wallpaper, and the same fast search workflow.',
          action: Object.freeze({ id: 'openNewtab', label: 'Open New Tab' })
        }),
        Object.freeze({
          icon: 'ri-flask-line',
          title: 'Enable Labs when useful',
          body: 'Auto Picture-in-Picture, page clipping, and pinned-tab recovery live in Settings when you are ready.',
          action: Object.freeze({ id: 'openOptions', label: 'Open Settings' })
        })
      ]),
      featuresTitle: 'What Lumno gives you',
      features: Object.freeze([
        Object.freeze({ icon: 'ri-command-line', title: 'Focus Search anywhere', body: 'Open one command bar on top of any page.' }),
        Object.freeze({ icon: 'ri-bookmark-3-line', title: 'Bookmarks and history', body: 'Search bookmarks, history, top sites, and tabs together.' }),
        Object.freeze({ icon: 'ri-global-line', title: 'Site search', body: 'Jump into GitHub, YouTube, Bilibili, AI tools, and more by keyword.' }),
        Object.freeze({ icon: 'ri-window-line', title: 'Minimal New Tab', body: 'Bring the same search workflow to every new tab.' })
      ]),
      footer: Object.freeze({
        note: 'You can reopen this guide later from Settings > General > Quick Start.',
        releaseAction: Object.freeze({ id: 'openRelease', label: 'View release notes' })
      })
    })
  });

  function getSupportedLocales() {
    return SUPPORTED_LOCALES.slice();
  }

  function getOnboardingContent(locale) {
    const normalized = normalizeLocale(locale);
    return CONTENT[normalized] || CONTENT.en;
  }

  return Object.freeze({
    normalizeLocale,
    getSupportedLocales,
    getOnboardingContent
  });
});
