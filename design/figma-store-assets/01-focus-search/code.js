// Creates Chrome Web Store promotional image 01 as editable Figma nodes.
// The composition mirrors Lumno's real interaction model:
// - Cmd/Ctrl+Shift+K opens the overlay.
// - Standard overlay width is 760px.
// - Suggestions are 52px rows.
// - Query "extension" matches onboarding examples and realistic result types.

const ARTBOARD_W = 1280;
const ARTBOARD_H = 800;

const colors = {
  white: '#FFFFFF',
  page: '#F8FAFC',
  ink: '#111827',
  sub: '#64748B',
  muted: '#94A3B8',
  line: '#E5E7EB',
  panel: '#FFFFFF',
  panelSoft: '#F3F4F6',
  blue: '#2563EB',
  blueSoft: '#EEF6FF',
  blueLine: '#BFDBFE',
  keyText: '#1E3A8A',
  amberSoft: '#FEF3C7',
  amberText: '#D97706',
  chromeBlue: '#4285F4',
  github: '#24292F',
  green: '#61AA76',
  pink: '#E879F9'
};

const data = {
  headline: ['别翻了，直接搜', '书签、历史和标签页'],
  subcopy: '在当前网页按下快捷键，常用网站、书签、历史和已打开页面都放到一起。',
  shortcut: '⌘ / Ctrl + Shift + K',
  query: 'extension',
  browserUrl: 'github.com/kubai087/lumno-extension',
  suggestions: [
    {
      kind: 'openTab',
      iconText: 'GH',
      iconBg: colors.github,
      title: 'kubai087/lumno-extension',
      detail: 'https://github.com/kubai087/lumno-extension',
      tag: '已打开',
      tagBg: '#E0F2FE',
      tagText: '#0369A1',
      active: true,
      actions: [{ label: '切换', key: 'Enter' }]
    },
    {
      kind: 'topSite',
      iconText: 'C',
      iconBg: colors.chromeBlue,
      title: 'Chrome Web Store - Extensions',
      detail: 'https://chromewebstore.google.com/category/extensions',
      tag: '常用',
      tagBg: '#F3F4F6',
      tagText: '#6B7280',
      active: false,
      actions: []
    },
    {
      kind: 'bookmark',
      iconText: 'D',
      iconBg: '#3578CB',
      title: 'Chrome Extensions API Reference',
      detail: '书签 / 开发 / Browser extensions',
      tag: '书签',
      tagBg: colors.amberSoft,
      tagText: colors.amberText,
      active: false,
      actions: []
    },
    {
      kind: 'history',
      iconText: 'H',
      iconBg: colors.green,
      title: 'Extensions - Chrome for Developers',
      detail: 'https://developer.chrome.com/docs/extensions',
      tag: '历史',
      tagBg: '#F3F4F6',
      tagText: '#6B7280',
      active: false,
      actions: []
    },
    {
      kind: 'search',
      iconText: '',
      iconBg: '#FFFFFF',
      title: '搜索 "extension"',
      detail: '使用默认搜索引擎',
      tag: '搜索',
      tagBg: '#EEF6FF',
      tagText: '#1D4ED8',
      active: false,
      actions: []
    }
  ],
  recentSites: [
    {
      name: 'Chrome Web Store',
      title: 'Lumno - Chrome Web Store',
      url: 'chromewebstore.google.com',
      iconText: 'C',
      iconBg: colors.chromeBlue,
      bg: '#DCEBFE'
    },
    {
      name: 'GitHub',
      title: 'kubai087/lumno-extension',
      url: 'github.com',
      iconText: 'GH',
      iconBg: colors.github,
      bg: '#EEF2F7'
    },
    {
      name: 'Tailwind CSS',
      title: 'Utility-first CSS framework docs',
      url: 'tailwindcss.com',
      iconText: 'TW',
      iconBg: '#06B6D4',
      bg: '#DFF7FB'
    },
    {
      name: 'Figma',
      title: 'Plugin API: Auto Layout',
      url: 'figma.com',
      iconText: 'F',
      iconBg: '#A259FF',
      bg: '#F7E5FF'
    }
  ]
};

function rgb(hex) {
  const clean = hex.replace('#', '');
  const value = parseInt(clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean, 16);
  return {
    r: ((value >> 16) & 255) / 255,
    g: ((value >> 8) & 255) / 255,
    b: (value & 255) / 255
  };
}

function paint(hex, opacity = 1) {
  return { type: 'SOLID', color: rgb(hex), opacity };
}

function shadow(colorHex, opacity, x, y, blur, spread = 0) {
  const effect = {
    type: 'DROP_SHADOW',
    color: { ...rgb(colorHex), a: opacity },
    offset: { x, y },
    radius: blur,
    visible: true,
    blendMode: 'NORMAL'
  };
  // Figma only accepts the `spread` field on certain node/effect combinations.
  // Omitting zero spread keeps shadows compatible across regular frames.
  if (spread !== 0) {
    effect.spread = spread;
  }
  return effect;
}

function makeFrame(name, opts = {}) {
  const node = figma.createFrame();
  node.name = name;
  node.clipsContent = opts.clipsContent ?? false;
  node.fills = opts.fill ? [paint(opts.fill, opts.fillOpacity ?? 1)] : [];
  node.strokes = opts.stroke ? [paint(opts.stroke, opts.strokeOpacity ?? 1)] : [];
  if (opts.stroke || opts.strokeWeight != null) {
    node.strokeWeight = opts.strokeWeight ?? 1;
  }
  node.cornerRadius = opts.radius ?? 0;
  node.effects = opts.effects ?? [];
  if (opts.width || opts.height) {
    node.resize(opts.width ?? 100, opts.height ?? 100);
  }
  if (opts.layout) {
    node.layoutMode = opts.layout;
    node.primaryAxisSizingMode = opts.primarySizing ?? 'AUTO';
    node.counterAxisSizingMode = opts.counterSizing ?? 'AUTO';
    node.primaryAxisAlignItems = opts.primaryAlign ?? 'MIN';
    node.counterAxisAlignItems = opts.counterAlign ?? 'MIN';
    node.itemSpacing = opts.gap ?? 0;
    node.paddingTop = opts.paddingTop ?? opts.paddingY ?? opts.padding ?? 0;
    node.paddingBottom = opts.paddingBottom ?? opts.paddingY ?? opts.padding ?? 0;
    node.paddingLeft = opts.paddingLeft ?? opts.paddingX ?? opts.padding ?? 0;
    node.paddingRight = opts.paddingRight ?? opts.paddingX ?? opts.padding ?? 0;
  }
  return node;
}

function setXY(node, x, y) {
  node.x = x;
  node.y = y;
  return node;
}

async function getFonts() {
  const available = await figma.listAvailableFontsAsync();
  const has = (family, style) => available.some((item) =>
    item.fontName.family === family && item.fontName.style === style
  );
  const pick = (candidates) => {
    for (const font of candidates) {
      if (has(font.family, font.style)) return font;
    }
    return { family: 'Inter', style: 'Regular' };
  };

  return {
    zhRegular: pick([
      { family: 'PingFang SC', style: 'Regular' },
      { family: 'Noto Sans CJK SC', style: 'Regular' },
      { family: 'Source Han Sans SC', style: 'Regular' },
      { family: 'Inter', style: 'Regular' }
    ]),
    zhMedium: pick([
      { family: 'PingFang SC', style: 'Medium' },
      { family: 'PingFang SC', style: 'Semibold' },
      { family: 'Noto Sans CJK SC', style: 'Medium' },
      { family: 'Inter', style: 'Medium' }
    ]),
    zhSemi: pick([
      { family: 'PingFang SC', style: 'Semibold' },
      { family: 'PingFang SC', style: 'Medium' },
      { family: 'Noto Sans CJK SC', style: 'Bold' },
      { family: 'Inter', style: 'Semi Bold' },
      { family: 'Inter', style: 'Bold' }
    ]),
    uiRegular: pick([
      { family: 'Open Sans', style: 'Regular' },
      { family: 'Inter', style: 'Regular' }
    ]),
    uiMedium: pick([
      { family: 'Open Sans', style: 'Medium' },
      { family: 'Open Sans', style: 'SemiBold' },
      { family: 'Inter', style: 'Medium' }
    ]),
    uiSemi: pick([
      { family: 'Open Sans', style: 'SemiBold' },
      { family: 'Open Sans', style: 'Bold' },
      { family: 'Inter', style: 'Semi Bold' },
      { family: 'Inter', style: 'Bold' }
    ])
  };
}

async function loadFonts(fonts) {
  const unique = new Map();
  Object.values(fonts).forEach((font) => unique.set(`${font.family}/${font.style}`, font));
  await Promise.all([...unique.values()].map((font) => figma.loadFontAsync(font)));
}

function makeText(name, value, opts, fonts) {
  const node = figma.createText();
  node.name = name;
  node.fontName = opts.font ?? fonts.zhRegular;
  node.fontSize = opts.size ?? 14;
  node.lineHeight = opts.lineHeight
    ? { unit: 'PIXELS', value: opts.lineHeight }
    : { unit: 'AUTO' };
  node.letterSpacing = { unit: 'PERCENT', value: 0 };
  node.fills = [paint(opts.color ?? colors.ink, opts.opacity ?? 1)];
  node.textAutoResize = opts.resize ?? 'WIDTH_AND_HEIGHT';
  if (opts.width) {
    node.textAutoResize = 'HEIGHT';
    node.resize(opts.width, 10);
  }
  node.characters = value;
  return node;
}

function add(parent, child) {
  parent.appendChild(child);
  return child;
}

function makePill(label, opts, fonts) {
  const pill = makeFrame(`Pill / ${label}`, {
    layout: 'HORIZONTAL',
    paddingX: opts.paddingX ?? 10,
    paddingY: opts.paddingY ?? 5,
    gap: 6,
    radius: 999,
    fill: opts.fill ?? colors.panelSoft,
    stroke: opts.stroke,
    strokeOpacity: opts.strokeOpacity ?? 1,
    counterAlign: 'CENTER',
    primaryAlign: 'CENTER'
  });
  add(pill, makeText('Label', label, {
    size: opts.size ?? 12,
    lineHeight: opts.lineHeight ?? 14,
    color: opts.color ?? colors.sub,
    font: opts.font ?? fonts.zhMedium
  }, fonts));
  return pill;
}

function makeIcon(label, bg, fonts, size = 26) {
  const icon = makeFrame(`Favicon / ${label || 'Search'}`, {
    width: size,
    height: size,
    radius: 8,
    fill: bg || colors.white,
    stroke: bg ? null : colors.line,
    layout: 'HORIZONTAL',
    primaryAlign: 'CENTER',
    counterAlign: 'CENTER'
  });
  if (label) {
    add(icon, makeText('Icon letters', label, {
      size: label.length > 1 ? 7.5 : 12,
      lineHeight: 12,
      color: bg === colors.github ? colors.white : colors.white,
      font: fonts.uiSemi
    }, fonts));
  } else {
    const circle = figma.createEllipse();
    circle.name = 'Search lens';
    circle.resize(10, 10);
    circle.strokes = [paint(colors.muted)];
    circle.strokeWeight = 1.6;
    circle.fills = [];
    icon.appendChild(circle);
  }
  return icon;
}

function makeActionTag(action, fonts) {
  const tag = makeFrame(`Action / ${action.label}`, {
    layout: 'HORIZONTAL',
    paddingLeft: 8,
    paddingRight: 4,
    paddingY: 4,
    gap: 6,
    radius: 999,
    fill: colors.blueSoft,
    stroke: colors.blueLine,
    counterAlign: 'CENTER'
  });
  add(tag, makeText('Action label', action.label, {
    size: 11,
    lineHeight: 12,
    color: colors.keyText,
    font: fonts.zhMedium
  }, fonts));
  const key = makeFrame(`Key / ${action.key}`, {
    layout: 'HORIZONTAL',
    paddingX: 7,
    paddingY: 3,
    radius: 6,
    fill: colors.white,
    stroke: colors.blueLine,
    counterAlign: 'CENTER',
    primaryAlign: 'CENTER',
    effects: [shadow('#000000', 0.12, 0, 1, 0)]
  });
  add(key, makeText('Key label', action.key, {
    size: 10,
    lineHeight: 10,
    color: colors.keyText,
    font: fonts.uiMedium
  }, fonts));
  add(tag, key);
  return tag;
}

function makeSuggestionRow(item, fonts) {
  const row = makeFrame(`Suggestion / ${item.title}`, {
    width: 736,
    height: 52,
    layout: 'HORIZONTAL',
    primarySizing: 'FIXED',
    counterSizing: 'FIXED',
    paddingX: 16,
    paddingY: 12,
    gap: 12,
    radius: 16,
    fill: item.active ? colors.panelSoft : colors.white,
    stroke: item.active ? colors.line : colors.white,
    counterAlign: 'CENTER',
    primaryAlign: 'SPACE_BETWEEN'
  });

  const left = makeFrame('Left', {
    width: item.actions.length ? 510 : 640,
    layout: 'HORIZONTAL',
    gap: 12,
    counterAlign: 'CENTER',
    primarySizing: 'FIXED',
    counterSizing: 'AUTO'
  });
  add(left, makeIcon(item.iconText, item.iconBg, fonts, 24));

  const textWrap = makeFrame('Text + tag', {
    width: item.actions.length ? 464 : 594,
    layout: 'HORIZONTAL',
    gap: 6,
    counterAlign: 'CENTER',
    primarySizing: 'FIXED',
    counterSizing: 'AUTO'
  });
  const title = makeText('Title', item.title, {
    width: item.actions.length ? 286 : 350,
    size: 14,
    lineHeight: 20,
    color: colors.ink,
    font: item.active ? fonts.uiSemi : fonts.uiRegular
  }, fonts);
  add(textWrap, title);
  add(textWrap, makeText('Detail', item.detail, {
    width: item.actions.length ? 122 : 170,
    size: 12,
    lineHeight: 16,
    color: item.kind === 'bookmark' ? colors.blue : colors.blue,
    font: fonts.uiRegular
  }, fonts));
  add(textWrap, makePill(item.tag, {
    paddingX: 6,
    paddingY: 4,
    size: 10,
    lineHeight: 12,
    fill: item.tagBg,
    color: item.tagText,
    font: fonts.zhMedium
  }, fonts));
  add(left, textWrap);
  add(row, left);

  const actions = makeFrame('Actions', {
    layout: 'HORIZONTAL',
    gap: 6,
    counterAlign: 'CENTER'
  });
  item.actions.forEach((action) => add(actions, makeActionTag(action, fonts)));
  add(row, actions);
  return row;
}

function makeOverlay(fonts) {
  const overlay = makeFrame('Lumno overlay / standard 760px', {
    width: 760,
    layout: 'VERTICAL',
    primarySizing: 'AUTO',
    counterSizing: 'FIXED',
    fill: colors.white,
    fillOpacity: 0.96,
    stroke: '#000000',
    strokeOpacity: 0.08,
    radius: 32,
    effects: [
      shadow('#000000', 0.05, 0, 17, 120),
      shadow('#000000', 0.10, 0, 32, 44.5),
      shadow('#000000', 0.15, 0, 80, 120)
    ],
    counterAlign: 'CENTER'
  });

  const input = makeFrame('Search input', {
    width: 760,
    height: 60,
    layout: 'HORIZONTAL',
    primarySizing: 'FIXED',
    counterSizing: 'FIXED',
    paddingLeft: 20,
    paddingRight: 13,
    gap: 12,
    counterAlign: 'CENTER',
    primaryAlign: 'SPACE_BETWEEN'
  });
  const left = makeFrame('Input left', {
    layout: 'HORIZONTAL',
    gap: 14,
    counterAlign: 'CENTER'
  });
  add(left, makeText('Search icon', '⌕', {
    size: 17,
    lineHeight: 18,
    color: colors.muted,
    font: fonts.uiRegular
  }, fonts));
  add(left, makeText('Query', data.query, {
    size: 16,
    lineHeight: 18,
    color: '#1F2937',
    font: fonts.uiMedium
  }, fonts));
  add(input, left);
  add(input, makePill(data.shortcut, {
    paddingX: 9,
    paddingY: 5,
    size: 11,
    lineHeight: 13,
    fill: '#F8FAFC',
    stroke: colors.line,
    color: colors.sub,
    font: fonts.uiMedium
  }, fonts));
  add(overlay, input);

  const divider = figma.createLine();
  divider.name = 'Input divider';
  divider.resize(720, 0);
  divider.strokes = [paint(colors.line, 0.78)];
  divider.strokeWeight = 1;
  add(overlay, divider);

  const list = makeFrame('Suggestions / real result types', {
    width: 760,
    layout: 'VERTICAL',
    padding: 12,
    gap: 4,
    counterSizing: 'FIXED',
    counterAlign: 'CENTER'
  });
  data.suggestions.forEach((item) => add(list, makeSuggestionRow(item, fonts)));
  add(overlay, list);
  return overlay;
}

function makeBrowserWindow(fonts) {
  const win = makeFrame('Background browser page', {
    width: 1060,
    height: 456,
    radius: 28,
    fill: '#F8FAFC',
    stroke: colors.line,
    effects: [shadow('#0F172A', 0.08, 0, 16, 44)],
    clipsContent: true
  });

  const bar = makeFrame('Browser top bar', {
    width: 1060,
    height: 54,
    layout: 'HORIZONTAL',
    primarySizing: 'FIXED',
    counterSizing: 'FIXED',
    paddingX: 18,
    gap: 16,
    fill: colors.white,
    counterAlign: 'CENTER'
  });
  const lights = makeFrame('Window controls', {
    layout: 'HORIZONTAL',
    gap: 7,
    counterAlign: 'CENTER'
  });
  ['#FF5F57', '#FFBD2E', '#28C840'].forEach((c) => {
    const dot = figma.createEllipse();
    dot.name = 'Control';
    dot.resize(11, 11);
    dot.fills = [paint(c)];
    lights.appendChild(dot);
  });
  add(bar, lights);
  const address = makeFrame('Address bar', {
    width: 660,
    height: 32,
    radius: 999,
    fill: '#F1F5F9',
    stroke: '#E2E8F0',
    layout: 'HORIZONTAL',
    paddingX: 14,
    gap: 8,
    counterAlign: 'CENTER'
  });
  add(address, makeText('Lock', '⌁', {
    size: 13,
    color: colors.muted,
    font: fonts.uiRegular
  }, fonts));
  add(address, makeText('URL', data.browserUrl, {
    size: 13,
    lineHeight: 14,
    color: '#475569',
    font: fonts.uiMedium
  }, fonts));
  add(bar, address);
  add(win, bar);

  const body = makeFrame('GitHub-like page skeleton', {
    width: 1060,
    height: 402,
    fill: colors.white,
    layout: 'VERTICAL',
    paddingX: 54,
    paddingY: 32,
    gap: 22,
    primarySizing: 'FIXED',
    counterSizing: 'FIXED'
  });
  const repo = makeFrame('Repo heading', {
    layout: 'VERTICAL',
    gap: 10,
    counterSizing: 'AUTO'
  });
  add(repo, makeText('Repo title', 'kubai087 / lumno-extension', {
    size: 22,
    lineHeight: 28,
    color: '#0F172A',
    font: fonts.uiSemi
  }, fonts));
  add(repo, makeText('Repo desc', '聚焦搜索 & 极简新标签页 · Manifest V3 · Chromium Extension', {
    size: 13,
    lineHeight: 18,
    color: colors.sub,
    font: fonts.zhRegular
  }, fonts));
  add(body, repo);

  const tabs = makeFrame('Repo tabs', {
    layout: 'HORIZONTAL',
    gap: 8,
    counterAlign: 'CENTER'
  });
  ['Code', 'Issues', 'Pull requests', 'Actions', 'Wiki'].forEach((label, i) => {
    add(tabs, makePill(label, {
      fill: i === 0 ? '#E0F2FE' : '#F8FAFC',
      stroke: '#E2E8F0',
      color: i === 0 ? '#075985' : '#64748B',
      paddingX: 12,
      paddingY: 7,
      size: 12,
      font: fonts.uiMedium
    }, fonts));
  });
  add(body, tabs);

  const files = makeFrame('File list', {
    width: 640,
    layout: 'VERTICAL',
    radius: 14,
    stroke: '#E2E8F0',
    fill: '#FFFFFF',
    counterSizing: 'FIXED',
    clipsContent: true
  });
  ['src/overlay/search-panel.js', 'src/newtab/newtab.js', 'assets/data/site-search.json'].forEach((label) => {
    const row = makeFrame(`File / ${label}`, {
      width: 640,
      height: 42,
      layout: 'HORIZONTAL',
      primarySizing: 'FIXED',
      counterSizing: 'FIXED',
      paddingX: 14,
      gap: 10,
      counterAlign: 'CENTER',
      fill: '#FFFFFF'
    });
    add(row, makeText('File icon', '▣', { size: 12, color: '#94A3B8', font: fonts.uiRegular }, fonts));
    add(row, makeText('Filename', label, {
      size: 13,
      lineHeight: 16,
      color: '#334155',
      font: fonts.uiRegular
    }, fonts));
    add(files, row);
  });
  add(body, files);
  add(win, body);
  return win;
}

function makeRecentCard(item, fonts) {
  const card = makeFrame(`Recent / ${item.name}`, {
    width: 214,
    height: 118,
    radius: 28,
    fill: item.bg,
    stroke: '#FFFFFF',
    strokeOpacity: 0.65,
    effects: [
      shadow('#C7C7C7', 0.10, 0, 2, 5),
      shadow('#C7C7C7', 0.09, 0, 8, 8),
      shadow('#C7C7C7', 0.05, 0, 19, 11)
    ],
    layout: 'VERTICAL',
    padding: 8,
    gap: 10,
    primarySizing: 'FIXED',
    counterSizing: 'FIXED'
  });
  const inner = makeFrame('Inner', {
    width: 198,
    height: 78,
    radius: 20,
    fill: colors.white,
    stroke: '#000000',
    strokeOpacity: 0.08,
    layout: 'VERTICAL',
    paddingX: 14,
    paddingY: 12,
    gap: 5,
    primarySizing: 'FIXED',
    counterSizing: 'FIXED',
    effects: [shadow('#C7C7C7', 0.08, 0, 5, 8)]
  });
  const head = makeFrame('Header', {
    layout: 'HORIZONTAL',
    gap: 7,
    counterAlign: 'CENTER'
  });
  add(head, makeIcon(item.iconText, item.iconBg, fonts, 22));
  add(head, makeText('Name', item.name, {
    size: 12,
    lineHeight: 14,
    color: '#111827',
    font: fonts.uiSemi
  }, fonts));
  add(inner, head);
  add(inner, makeText('Title', item.title, {
    width: 150,
    size: 10,
    lineHeight: 13,
    color: '#111827',
    font: fonts.uiRegular
  }, fonts));
  add(card, inner);
  add(card, makeText('URL', item.url, {
    width: 174,
    size: 12,
    lineHeight: 14,
    color: '#64748B',
    font: fonts.uiRegular
  }, fonts));
  return card;
}

function makeFooterCards(fonts) {
  const wrap = makeFrame('New tab recent cards / sample data', {
    layout: 'VERTICAL',
    gap: 12
  });
  add(wrap, makeText('Heading', 'Recent', {
    size: 13,
    lineHeight: 16,
    color: '#111827',
    font: fonts.uiSemi
  }, fonts));
  const row = makeFrame('Cards', {
    layout: 'HORIZONTAL',
    gap: 14,
    counterAlign: 'CENTER'
  });
  data.recentSites.forEach((item) => add(row, makeRecentCard(item, fonts)));
  add(wrap, row);
  return wrap;
}

function makeTitleBlock(fonts) {
  const block = makeFrame('Copy block', {
    layout: 'VERTICAL',
    gap: 16
  });
  add(block, makePill('Chrome Web Store · 01', {
    fill: '#EFF6FF',
    stroke: '#DBEAFE',
    color: '#1D4ED8',
    paddingX: 12,
    paddingY: 7,
    size: 12,
    font: fonts.uiSemi
  }, fonts));
  add(block, makeText('Headline', data.headline.join('\n'), {
    width: 540,
    size: 52,
    lineHeight: 61,
    color: '#0F172A',
    font: fonts.zhSemi
  }, fonts));
  add(block, makeText('Subcopy', data.subcopy, {
    width: 610,
    size: 18,
    lineHeight: 29,
    color: '#475569',
    font: fonts.zhRegular
  }, fonts));
  return block;
}

async function main() {
  if (figma.currentPage && typeof figma.currentPage.loadAsync === 'function') {
    await figma.currentPage.loadAsync();
  }

  const fonts = await getFonts();
  await loadFonts(fonts);

  const artboard = makeFrame('Chrome Store 01 / Focus Search / 1280x800', {
    width: ARTBOARD_W,
    height: ARTBOARD_H,
    fill: colors.white,
    clipsContent: true
  });
  artboard.x = 120;
  artboard.y = 120;

  const bgGlow = figma.createEllipse();
  bgGlow.name = 'Soft blue glow';
  bgGlow.resize(780, 420);
  bgGlow.fills = [paint('#DBEAFE', 0.42)];
  bgGlow.effects = [shadow('#60A5FA', 0.20, 0, 0, 120)];
  bgGlow.x = 505;
  bgGlow.y = 116;
  artboard.appendChild(bgGlow);

  const copy = makeTitleBlock(fonts);
  add(artboard, copy);
  setXY(copy, 72, 64);

  const browser = makeBrowserWindow(fonts);
  add(artboard, browser);
  setXY(browser, 112, 236);

  const overlay = makeOverlay(fonts);
  add(artboard, overlay);
  setXY(overlay, 386, 250);

  const recent = makeFooterCards(fonts);
  add(artboard, recent);
  setXY(recent, 205, 616);

  const note = makeFrame('Trust note', {
    layout: 'HORIZONTAL',
    gap: 8,
    paddingX: 12,
    paddingY: 8,
    radius: 999,
    fill: '#F8FAFC',
    stroke: '#E2E8F0',
    counterAlign: 'CENTER'
  });
  add(note, makeText('Dot', '●', { size: 8, color: '#22C55E', font: fonts.uiRegular }, fonts));
  add(note, makeText('Text', '开源 · 默认本地处理', {
    size: 12,
    lineHeight: 14,
    color: '#475569',
    font: fonts.zhMedium
  }, fonts));
  add(artboard, note);
  setXY(note, 1030, 720);

  figma.currentPage.appendChild(artboard);
  figma.currentPage.selection = [artboard];
  figma.viewport.scrollAndZoomIntoView([artboard]);
  figma.closePlugin('Created Lumno store image 01.');
}

function getErrorMessage(error) {
  return error && error.message ? error.message : String(error);
}

function reportFailure(error) {
  const message = getErrorMessage(error);
  console.error('[Lumno Store Image 01]', error && error.stack ? error.stack : message);
  try {
    figma.notify(`Lumno image 01 failed: ${message}`, { error: true, timeout: 8000 });
  } catch (_) {
    // Ignore notify failures so the plugin can still close with a readable message.
  }
  figma.closePlugin(`Failed: ${message}`);
}

main().catch(reportFailure);
