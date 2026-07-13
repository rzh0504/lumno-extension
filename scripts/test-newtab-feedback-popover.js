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

function getMessage(messages, key) {
  const item = messages[key];
  assert.ok(item && typeof item.message === 'string', `${key} should be localized`);
  return item.message;
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
  'height: 54px;',
  'collapsed feedback popover should reserve vertical breathing room so feedback icons are not clipped'
);

assertContains(
  newtabHtml,
  'padding: 10px 8px;',
  'collapsed feedback popover should keep horizontal sizing while adding vertical breathing room'
);

assertContains(
  newtabHtml,
  'contain: layout;',
  'collapsed feedback popover should not use paint containment because it clips icon rings and shadows'
);

assertContains(
  newtabHtml,
  'overflow: visible;',
  'collapsed feedback popover should allow icon rings and shadows to paint beyond the action row'
);

assert.match(
  newtabHtml,
  /\.x-nt-feedback-control\[data-detail-open="true"\] \.x-nt-feedback-popover \{[\s\S]*?overflow: hidden;/,
  'expanded feedback detail should keep clipping for the QR panel while the collapsed action row can paint freely'
);

assert.match(
  newtabHtml,
  /\.x-nt-feedback-action \{[\s\S]*?position: relative;[\s\S]*?overflow: visible;[\s\S]*?background: transparent;[\s\S]*?border: 0;/,
  'feedback action buttons should let the visual circle paint outside the 34px hit target'
);

assert.match(
  newtabHtml,
  /\.x-nt-feedback-action::before \{[\s\S]*?inset: -1px;[\s\S]*?background: linear-gradient\(180deg, #ffffff 0%, #ecedef 100%\);/,
  'feedback action visual circles should be drawn by an outward pseudo-element to avoid hard-clipped edges'
);

assert.match(
  newtabHtml,
  /\.x-nt-feedback-action-community::before \{[\s\S]*?inset: -1px;/,
  'feedback community action ring should extend past the button box instead of being inset at the edge'
);

assertContains(
  newtabHtml,
  '0 0 0 1px #040404,',
  'feedback community action should draw the black ring outside the circle face'
);

assert.ok(
  !newtabHtml.includes('inset 0 0 0 1px #040404'),
  'feedback community action should not draw the black ring as an inset edge that looks clipped'
);

assertContains(
  newtabHtml,
  'inset 0 1px 0 rgba(255, 255, 255, 0.22)',
  'feedback community action should keep the top highlight subtle after the circle is expanded'
);

assertContains(
  newtabHtml,
  'inset 0 1px 2.4px rgba(255, 255, 255, 0.12)',
  'feedback community action should keep the soft highlight subtle after the circle is expanded'
);

assert.ok(
  !newtabHtml.includes('inset 0 1px 0 rgba(255, 255, 255, 0.52)') &&
    !newtabHtml.includes('inset 0 1px 2.4px rgba(255, 255, 255, 0.36)') &&
    !newtabHtml.includes('inset 0 1px 0 rgba(255, 255, 255, 0.32)') &&
    !newtabHtml.includes('inset 0 1px 2.4px rgba(255, 255, 255, 0.2)'),
  'feedback community action should not keep the old stronger highlight on the expanded circle face'
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
  "const LUMNO_CHROME_WEB_STORE_REVIEW_URL = 'https://chromewebstore.google.com/detail/lumno-%E8%81%9A%E7%84%A6%E6%90%9C%E7%B4%A2%E6%96%B0%E6%A0%87%E7%AD%BE%E9%A1%B5/nggfkkbmogmadfoikakkfegkoilfcfao/reviews?utm_source=item-share-cb';",
  'feedback popover should define a direct Chrome Web Store reviews URL'
);

assertContains(
  newtabJs,
  "chromeReview: LUMNO_CHROME_WEB_STORE_REVIEW_URL,",
  'feedback link fallback should include the Chrome review URL'
);

assertContains(
  newtabJs,
  'let feedbackChromeReviewLink = null;',
  'feedback popover should keep a Chrome review link reference'
);

assertContains(
  newtabJs,
  "feedbackChromeReviewLink.innerHTML = getRiSvg('ri-star-line', 'ri-size-16');",
  'feedback popover should use a rating star icon for the Chrome review action'
);

assertContains(
  newtabJs,
  "feedbackMenu.appendChild(feedbackChromeReviewLink);",
  'feedback popover should place the Chrome review action in the icon row'
);

assert.match(
  newtabJs,
  /async function handleFeedbackCommunityClick\(event\)[\s\S]*const disposition = getOpenDisposition\(event, 'newTab'\);[\s\S]*openFeedbackExternalUrl\([\s\S]*disposition\s*\);/,
  'Discord feedback activation should preserve background-opening modifiers across async link loading'
);

assert.match(
  newtabJs,
  /feedbackCommunityButton\.addEventListener\('auxclick',[\s\S]*isMiddleClick\(event\)[\s\S]*handleFeedbackCommunityClick\(event\)/,
  'Discord feedback action should support middle-click background opening'
);

assert.ok(
  !newtabJs.includes('feedbackMailButton') &&
    !newtabJs.includes('handleFeedbackMailClick') &&
    !newtabJs.includes('openFeedbackMailto') &&
    !newtabJs.includes('mailto:'),
  'feedback popover should remove the email action from the icon row'
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
  getMessage(zhCnMessages, 'newtab_feedback_wechat_panel_title'),
  'Bug 反馈 & 新功能提需',
  'zh-CN should label the expanded wechat panel as bug feedback and feature requests'
);
assert.strictEqual(
  getMessage(zhTwMessages, 'newtab_feedback_wechat_panel_title'),
  'Bug 回報與新功能需求',
  'zh-TW should label the expanded wechat panel idiomatically'
);
assert.strictEqual(
  getMessage(enMessages, 'newtab_feedback_wechat_panel_title'),
  'Bug reports & feature requests',
  'en should label the expanded wechat panel clearly'
);
assert.strictEqual(
  getMessage(jaMessages, 'newtab_feedback_wechat_panel_title'),
  '不具合・要望',
  'ja should label the expanded wechat panel clearly'
);

assert.strictEqual(
  getMessage(zhCnMessages, 'newtab_feedback_chrome_review_label'),
  'Chrome 评分',
  'zh-CN should label the Chrome review action'
);
assert.strictEqual(
  getMessage(zhTwMessages, 'newtab_feedback_chrome_review_label'),
  'Chrome 評分',
  'zh-TW should label the Chrome review action'
);
assert.strictEqual(
  getMessage(enMessages, 'newtab_feedback_chrome_review_label'),
  'Chrome rating',
  'en should label the Chrome review action'
);
assert.strictEqual(
  getMessage(jaMessages, 'newtab_feedback_chrome_review_label'),
  'Chromeで評価',
  'ja should label the Chrome review action'
);

assert.strictEqual(
  getMessage(zhCnMessages, 'newtab_feedback_chrome_review_tooltip'),
  '在 Chrome Web Store 评分',
  'zh-CN should explain the Chrome review action'
);
assert.strictEqual(
  getMessage(zhTwMessages, 'newtab_feedback_chrome_review_tooltip'),
  '在 Chrome Web Store 評分',
  'zh-TW should explain the Chrome review action'
);
assert.strictEqual(
  getMessage(enMessages, 'newtab_feedback_chrome_review_tooltip'),
  'Rate on Chrome Web Store',
  'en should explain the Chrome review action'
);
assert.strictEqual(
  getMessage(jaMessages, 'newtab_feedback_chrome_review_tooltip'),
  'Chrome Web Storeで評価する',
  'ja should explain the Chrome review action'
);

console.log('newtab feedback popover tests passed');
