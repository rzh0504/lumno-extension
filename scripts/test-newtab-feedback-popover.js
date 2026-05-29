const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const newtabJs = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.js'), 'utf8');
const newtabHtml = fs.readFileSync(path.join(repoRoot, 'src/newtab/newtab.html'), 'utf8');
const zhCnMessages = JSON.parse(fs.readFileSync(path.join(repoRoot, '_locales/zh_CN/messages.json'), 'utf8'));
const zhTwMessages = JSON.parse(fs.readFileSync(path.join(repoRoot, '_locales/zh_TW/messages.json'), 'utf8'));
const enMessages = JSON.parse(fs.readFileSync(path.join(repoRoot, '_locales/en/messages.json'), 'utf8'));
const jaMessages = JSON.parse(fs.readFileSync(path.join(repoRoot, '_locales/ja/messages.json'), 'utf8'));

function assertContains(source, needle, message) {
  assert.ok(source.includes(needle), message);
}

assertContains(
  newtabHtml,
  'transition: opacity 170ms ease, transform 360ms cubic-bezier(0.2, 1.45, 0.35, 1)',
  'feedback popover should use the same opening motion as menu surfaces'
);

assertContains(
  newtabHtml,
  'width: 170px;',
  'collapsed feedback popover should exactly fit four 34px icons, three 6px gaps, and 8px side padding'
);

assertContains(
  newtabHtml,
  'width 260ms cubic-bezier(0.22, 1, 0.36, 1), height 260ms cubic-bezier(0.22, 1, 0.36, 1)',
  'feedback popover size animation should use a non-bouncy resize easing'
);

assert.ok(
  !newtabHtml.includes('width 360ms cubic-bezier(0.2, 1.45, 0.35, 1)') &&
    !newtabHtml.includes('min-height 360ms cubic-bezier(0.2, 1.45, 0.35, 1)'),
  'feedback popover should not apply the bouncy menu transform curve to layout dimensions'
);

assertContains(
  newtabHtml,
  '.x-nt-feedback-control[data-detail-open="true"] .x-nt-feedback-menu',
  'wechat detail state should target the menu row'
);

assertContains(
  newtabHtml,
  'visibility: hidden;',
  'wechat detail state should hide the four feedback icons'
);

assertContains(
  newtabJs,
  'x-nt-feedback-detail-collapse',
  'wechat detail should expose a collapse button'
);

assertContains(
  newtabJs,
  "collapseButton.className = 'x-nt-feedback-action x-nt-feedback-detail-collapse';",
  'wechat detail collapse button should reuse the existing feedback icon button treatment'
);

assert.ok(
  !newtabHtml.includes('.x-nt-feedback-detail-collapse {'),
  'wechat detail collapse button should not define a custom button surface'
);

assert.match(
  newtabHtml,
  /\.x-nt-feedback-detail-collapse:hover \{[\s\S]*?transform: none;/,
  'wechat detail collapse button should not lift on hover'
);

assertContains(
  newtabJs,
  "feedbackControl.setAttribute('data-detail-open', open ? 'true' : 'false');",
  'detail open state should be reflected on the feedback container for animation and icon hiding'
);

assertContains(
  newtabJs,
  "collapseButton.innerHTML = getRiSvg('ri-arrow-down-s-line', 'ri-size-16');",
  'wechat detail collapse button should use a chevron-down icon'
);

assertContains(
  newtabJs,
  'image.width = 1080;',
  'wechat QR image should reserve its published width before loading'
);

assertContains(
  newtabJs,
  'image.height = 1596;',
  'wechat QR image should reserve its published height before loading'
);

assertContains(
  newtabJs,
  "t('newtab_feedback_wechat_panel_title', 'Bug reports & feature requests')",
  'wechat detail title should use the bug feedback and feature request copy'
);

assert.match(
  newtabHtml,
  /\.x-nt-feedback-detail-title \{[\s\S]*?font-size: 14px;/,
  'wechat detail title should be larger than the compact feedback labels'
);

assert.strictEqual(
  zhCnMessages.newtab_feedback_wechat_panel_title.message,
  'Bug 反馈 & 新功能提需',
  'zh-CN should label the expanded wechat panel as bug feedback and feature requests'
);
assert.strictEqual(
  zhTwMessages.newtab_feedback_wechat_panel_title.message,
  'Bug 回報與新功能需求',
  'zh-TW should label the expanded wechat panel idiomatically'
);
assert.strictEqual(
  enMessages.newtab_feedback_wechat_panel_title.message,
  'Bug reports & feature requests',
  'en should label the expanded wechat panel clearly'
);
assert.strictEqual(
  jaMessages.newtab_feedback_wechat_panel_title.message,
  'バグ報告・新機能リクエスト',
  'ja should label the expanded wechat panel clearly'
);

console.log('newtab feedback popover tests passed');
