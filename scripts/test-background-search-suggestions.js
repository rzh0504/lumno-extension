const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const backgroundSourceForAssertions = fs.readFileSync(path.join(repoRoot, 'src/background/background.js'), 'utf8');

assert.ok(
  /searchBlacklistItems,\s*faviconRequestBlacklistItems,\s*searchSelectionStats\s*\]\s*=\s*await Promise\.all/.test(backgroundSourceForAssertions),
  'background search suggestions should keep Promise.all result order aligned with searchSelectionStats'
);

function createEvent() {
  return {
    addListener() {},
    removeListener() {},
    hasListener() {
      return false;
    }
  };
}

function createStorageArea(initialData) {
  const data = initialData || {};
  return {
    get(keys, callback) {
      const result = {};
      const keyList = Array.isArray(keys)
        ? keys
        : (typeof keys === 'string' ? [keys] : Object.keys(keys || {}));
      keyList.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          result[key] = data[key];
        }
      });
      setTimeout(() => callback(result), 0);
    },
    set(items, callback) {
      Object.assign(data, items || {});
      if (callback) {
        setTimeout(callback, 0);
      }
    },
    remove(keys, callback) {
      (Array.isArray(keys) ? keys : [keys]).forEach((key) => {
        delete data[key];
      });
      if (callback) {
        setTimeout(callback, 0);
      }
    }
  };
}

function createChromeStub() {
  const messageListeners = [];
  const storageArea = createStorageArea({});
  const now = Date.now();
  const openTabs = [
    {
      id: 25,
      windowId: 1,
      title: 'Digital Experience Testing Cloud | TestMu AI (Formerly LambdaTest) Enterprise Cloud',
      url: 'https://app.testmu.com/enterprise-cloud'
    }
  ];
  const historyItems = [
    {
      title: 'GitHub',
      url: 'https://github.com/',
      visitCount: 18,
      typedCount: 4,
      lastVisitTime: now - 1000
    },
    {
      title: 'GitHub Lumno Repo',
      url: 'https://github.com/kubai087/lumno-extension',
      visitCount: 7,
      typedCount: 1,
      lastVisitTime: now - 2000
    },
    {
      title: 'Example',
      url: 'https://example.com/',
      visitCount: 1,
      typedCount: 0,
      lastVisitTime: now - 3000
    },
    {
      title: '微信读书',
      url: 'https://weread.qq.com/',
      visitCount: 4,
      typedCount: 0,
      lastVisitTime: now - 5000
    }
  ].concat(
    Array.from({ length: 260 }, (_, index) => ({
      title: `Filler History ${index + 1}`,
      url: `https://filler.example.com/${index + 1}`,
      visitCount: 1,
      typedCount: 0,
      lastVisitTime: now - 10_000 - index
    })),
    [{
      title: 'Final Cut Camera',
      url: 'https://apps.apple.com/final-cut-camera',
      visitCount: 3,
      typedCount: 0,
      lastVisitTime: now - 20_000
    }]
  );
  const topSiteItems = [
    { title: 'GitHub', url: 'https://github.com/' }
  ];

  const chromeApi = {
    runtime: {
      id: 'abc',
      lastError: null,
      getURL(relativePath) {
        return path.join(repoRoot, relativePath);
      },
      getManifest() {
        return { version: '0.9.16' };
      },
      onMessage: {
        addListener(listener) {
          messageListeners.push(listener);
        }
      },
      onInstalled: createEvent(),
      onStartup: createEvent(),
      onConnect: createEvent(),
      setUninstallURL(_url, callback) {
        if (callback) {
          callback();
        }
      },
      openOptionsPage(callback) {
        if (callback) {
          callback();
        }
      }
    },
    storage: {
      sync: storageArea,
      local: createStorageArea({}),
      onChanged: createEvent()
    },
    history: {
      search(options, callback) {
        const text = String(options && options.text || '').toLowerCase();
        const startTime = Number(options && options.startTime) || 0;
        const maxResults = Math.max(0, Math.floor(Number(options && options.maxResults) || historyItems.length));
        const items = (text
          ? historyItems.filter((item) => (
              item.title.toLowerCase().includes(text) ||
              item.url.toLowerCase().includes(text)
            ))
          : historyItems)
          .filter((item) => (Number(item.lastVisitTime) || 0) >= startTime)
          .slice(0, maxResults);
        setTimeout(() => callback(items), 0);
      },
      deleteUrl(options, callback) {
        const targetUrl = String(options && options.url || '');
        for (let index = historyItems.length - 1; index >= 0; index -= 1) {
          if (historyItems[index] && historyItems[index].url === targetUrl) {
            historyItems.splice(index, 1);
          }
        }
        for (let index = topSiteItems.length - 1; index >= 0; index -= 1) {
          if (topSiteItems[index] && topSiteItems[index].url === targetUrl) {
            topSiteItems.splice(index, 1);
          }
        }
        if (callback) {
          callback();
        }
      },
      onVisited: createEvent(),
      onVisitRemoved: createEvent()
    },
    topSites: {
      get(callback) {
        setTimeout(() => callback(topSiteItems.slice()), 0);
      }
    },
    bookmarks: {
      search(_options, callback) {
        setTimeout(() => callback([
          {
            id: '10',
            parentId: '1',
            title: 'GitHub Bookmark',
            url: 'https://github.com/notifications'
          }
        ]), 0);
      },
      getTree(callback) {
        setTimeout(() => callback([
          {
            id: '0',
            title: '',
            children: [
              {
                id: '1',
                parentId: '0',
                title: 'Bookmarks bar',
                children: [
                  {
                    id: '10',
                    parentId: '1',
                    title: 'GitHub Bookmark',
                    url: 'https://github.com/notifications'
                  }
                ]
              }
            ]
          }
        ]), 0);
      },
      onCreated: createEvent(),
      onRemoved: createEvent(),
      onChanged: createEvent(),
      onMoved: createEvent(),
      onChildrenReordered: createEvent(),
      onImportEnded: createEvent()
    },
    tabs: {
      query(_options, callback) {
        setTimeout(() => callback(openTabs), 0);
      },
      create(options, callback) {
        if (callback) {
          setTimeout(() => callback({ id: 1, windowId: 1, url: options && options.url || '' }), 0);
        }
      },
      update(tabId, options, callback) {
        if (callback) {
          setTimeout(() => callback({ id: tabId, windowId: 1, url: options && options.url || '' }), 0);
        }
      },
      sendMessage(_tabId, _message, callback) {
        if (callback) {
          setTimeout(() => callback({ ok: true }), 0);
        }
      },
      remove(_tabIds, callback) {
        if (callback) {
          callback();
        }
      },
      captureVisibleTab(_windowId, _options, callback) {
        if (callback) {
          callback('');
        }
      },
      onCreated: createEvent(),
      onUpdated: createEvent(),
      onRemoved: createEvent(),
      onActivated: createEvent(),
      onReplaced: createEvent(),
      onMoved: createEvent(),
      onAttached: createEvent(),
      onDetached: createEvent()
    },
    windows: {
      update(windowId, _options, callback) {
        if (callback) {
          callback({ id: windowId });
        }
      },
      getCurrent(callback) {
        callback({ id: 1 });
      },
      onFocusChanged: createEvent(),
      WINDOW_ID_NONE: -1
    },
    commands: {
      getAll(callback) {
        callback([]);
      },
      onCommand: createEvent()
    },
    action: {
      onClicked: createEvent(),
      setIcon(_options, callback) {
        if (callback) {
          callback();
        }
      },
      setTitle(_options, callback) {
        if (callback) {
          callback();
        }
      }
    },
    alarms: {
      create() {},
      clear(_name, callback) {
        if (callback) {
          callback(true);
        }
      },
      onAlarm: createEvent()
    },
    scripting: {
      executeScript(_options, callback) {
        if (callback) {
          callback([]);
        }
      },
      insertCSS(_options, callback) {
        if (callback) {
          callback();
        }
      }
    },
    search: {
      query(_options, callback) {
        if (callback) {
          callback();
        }
      }
    },
    permissions: {
      contains(_options, callback) {
        callback(true);
      }
    },
    tabGroups: {
      TAB_GROUP_ID_NONE: -1
    }
  };

  return { chromeApi, messageListeners };
}

function loadBackgroundForTest() {
  const { chromeApi, messageListeners } = createChromeStub();
  const context = vm.createContext({
    console,
    chrome: chromeApi,
    setTimeout,
    clearTimeout,
    URL,
    URLSearchParams,
    Blob,
    navigator: { userAgent: 'Fake Chrome' },
    fetch: async () => {
      throw new Error('network disabled in background search test');
    }
  });
  context.globalThis = context;
  context.importScripts = (...urls) => {
    urls.forEach((url) => {
      vm.runInContext(fs.readFileSync(String(url), 'utf8'), context, {
        filename: String(url)
      });
    });
  };

  const backgroundSource = fs.readFileSync(path.join(repoRoot, 'src/background/background.js'), 'utf8') +
    '\nglobalThis.__testGetSearchSuggestions = getSearchSuggestions;\n';
  vm.runInContext(backgroundSource, context, {
    filename: 'src/background/background.js'
  });
  return { context, messageListeners };
}

function sendBackgroundMessage(messageListeners, request) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (response) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(response);
    };
    messageListeners.forEach((listener) => {
      listener(request, {}, finish);
    });
    setTimeout(() => finish(null), 20);
  });
}

async function run() {
  const { context, messageListeners } = loadBackgroundForTest();
  assert.strictEqual(
    typeof context.__testGetSearchSuggestions,
    'function',
    'background search function should be exposed in the test harness'
  );

  const suggestions = await context.__testGetSearchSuggestions('github');
  assert.ok(
    suggestions.some((item) => item && item.url === 'https://github.com/'),
    'background search suggestions should include local browser results instead of returning only the frontend search action'
  );
  assert.ok(
    suggestions.some((item) => item && (item.type === 'bookmark' || item.type === 'history' || item.type === 'topSite')),
    'background search suggestions should include at least one enabled local source type'
  );

  const deleteResponse = await sendBackgroundMessage(messageListeners, {
    action: 'deleteHistoryUrl',
    url: 'https://github.com/'
  });
  assert.strictEqual(
    deleteResponse && deleteResponse.ok,
    true,
    'deleteHistoryUrl should report a successful deletion'
  );
  assert.strictEqual(
    deleteResponse && deleteResponse.url,
    'https://github.com/',
    'deleteHistoryUrl should echo the removed URL'
  );
  const suggestionsAfterDelete = await context.__testGetSearchSuggestions('github');
  assert.ok(
    !suggestionsAfterDelete.some((item) => item && item.url === 'https://github.com/'),
    'deleted history/top-site URLs should not be returned from stale local search caches'
  );

  const camelInitialSuggestions = await context.__testGetSearchSuggestions('fcc');
  assert.ok(
    camelInitialSuggestions.some((item) => item && item.url === 'https://apps.apple.com/final-cut-camera'),
    'background search suggestions should match camel-case and multi-word title initials'
  );

  const pinyinInitialSuggestions = await context.__testGetSearchSuggestions('wxds');
  assert.ok(
    pinyinInitialSuggestions.some((item) => item && item.url === 'https://weread.qq.com/'),
    'background search suggestions should match Chinese title pinyin initials'
  );

  const openTabInitialSuggestions = await context.__testGetSearchSuggestions('DETC');
  assert.ok(
    openTabInitialSuggestions.some((item) => (
      item &&
      item.url === 'https://app.testmu.com/enterprise-cloud' &&
      item._xMatchedTabId === 25
    )),
    'background search suggestions should match initials from currently open tab titles'
  );
}

run()
  .then(() => {
    console.log('background search suggestion tests passed');
  })
  .catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  });
