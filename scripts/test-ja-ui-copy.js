const assert = require('assert');
const fs = require('fs');
const path = require('path');

const messages = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', '_locales', 'ja', 'messages.json'),
  'utf8'
));

function message(key) {
  assert.ok(messages[key], `missing ja message key: ${key}`);
  return String(messages[key].message || '');
}

const expectedMessages = {
  settings_webpage_focus_overlay_section_title: '検索バー',
  settings_tab_blacklist: '非表示リスト',
  settings_recent_sites_title: 'サイト表示',
  settings_version_label: '版',
  document_pip_picker_hint: 'マウスを動かして要素を選択、押すと小窓表示。ホイールで親要素へ切替、Escで中止。',
  settings_shortcuts_section_title: 'キー設定',
  settings_shortcuts_action: 'キー設定へ',
  settings_shortcuts_save: 'キーを保存',
  settings_shortcuts_record_placeholder: 'キーを押す',
  settings_restricted_title: '制限ページでのキー動作',
  newtab_file_access_notice_title: '手元のPDF/HTMLでLumnoを使うには、「ファイルのURLへのアクセスを許可する」をオンにしてください',
  settings_bookmarks_title: '保存ページ',
  settings_bookmark_columns_title: '1行の保存ページ数',
  bookmarks_heading: '保存ページ',
  bookmarks_open_manager: '保存ページ管理を開く',
  search_tag_bookmark: '保存',
  settings_document_pip_title: 'ページ小窓',
  document_pip_picker_unsupported: 'このページでは小窓表示を利用できません',
  settings_wallpaper_upload: '画像を追加',
  settings_wallpaper_status_none: '壁紙は未追加',
  settings_wallpaper_status_ready: '壁紙を追加済み',
  newtab_wallpaper_effect_title: '壁紙効果',
  newtab_wallpaper_effect_strength: '効果の強さ',
  newtab_wallpaper_effect_halftone: '網点',
  newtab_feedback_button_aria: '意見を送る',
  newtab_feedback_menu_aria: '送信先',
  newtab_feedback_wechat_panel_title: '不具合・要望',
  newtab_feedback_mail_subject: 'Lumnoへの意見',
  blacklist_section_title: '検索結果と最近表示の非表示リスト',
  blacklist_add: '非表示リストに追加',
  blacklist_empty: '非表示URLはまだありません',
  blacklist_removed_toast: '非表示リストから削除しました',
  blacklist_preview_title: '一致例',
  blacklist_match_suffix_tooltip: 'このサイトのすべてのページと下位ドメインを非表示\n────────\n例：baidu.com を入力すると、baidu.com/search と tieba.baidu.com は表示されません',
  shortcuts_desc: '検索語を入力してTabを押すとサイト内検索に入ります',
  shortcuts_group_ai_desc: '検索語を入力してTabを押し、質問文を入力すると、以下のAIサイトへ移動して自動入力します（事前に各サイトへのログインが必要です）。',
  blacklist_clear: '非表示リストを空にする',
  confirm_clear_blacklist: '非表示リストを空にしますか？',
  shortcuts_group_custom: '追加済み',
  shortcuts_badge_custom: '追加',
  shortcuts_empty_custom: '追加したサイト内検索はまだありません',
  toast_error_template: '検索URLには {query} が必要です。',
  shortcuts_cancel: '中止',
  confirm_cancel: '中止',
  command_show_search: 'Lumnoを開く',
  command_show_search_prefill: 'ページURLを入れて開く',
  site_search_name_wechat: 'WeChat公式',
  site_brand_wechat_official: 'WeChat公式',
  sync_action_export: '設定を書き出す',
  sync_action_import: '設定を読み込む',
  sync_tooltip_export: '設定を書き出す',
  sync_tooltip_import: '設定を読み込む',
  sync_export_done: '設定を書き出しました',
  sync_import_done: '読み込み完了',
  sync_status_hint: 'ブラウザにログインすると設定が自動同期されます。別のブラウザでは手動で書き出し/読み込みしてください',
  copy_page_url_failed_permission: 'コピーできませんでした。権限を確認してください'
};

Object.entries(expectedMessages).forEach(([key, expected]) => {
  assert.strictEqual(message(key), expected, `unexpected ja UI copy for ${key}`);
});

const compactKeys = [
  'settings_webpage_focus_overlay_section_title',
  'settings_tab_blacklist',
  'settings_recent_sites_title',
  'settings_shortcuts_section_title',
  'settings_shortcuts_action',
  'settings_shortcuts_save',
  'settings_shortcuts_record_placeholder',
  'settings_restricted_title',
  'settings_bookmarks_title',
  'settings_bookmark_columns_title',
  'bookmarks_heading',
  'bookmarks_open_manager',
  'search_tag_bookmark',
  'settings_document_pip_title',
  'settings_wallpaper_upload',
  'settings_wallpaper_status_none',
  'settings_wallpaper_status_ready',
  'newtab_wallpaper_effect_title',
  'newtab_wallpaper_effect_strength',
  'newtab_wallpaper_effect_halftone',
  'newtab_feedback_button_aria',
  'newtab_feedback_menu_aria',
  'newtab_feedback_wechat_panel_title',
  'blacklist_section_title',
  'blacklist_add',
  'blacklist_empty',
  'blacklist_removed_toast',
  'blacklist_preview_title',
  'blacklist_clear',
  'confirm_clear_blacklist',
  'shortcuts_group_custom',
  'shortcuts_badge_custom',
  'shortcuts_empty_custom',
  'toast_error_template',
  'shortcuts_cancel',
  'confirm_cancel',
  'command_show_search',
  'command_show_search_prefill',
  'sync_action_export',
  'sync_action_import',
  'sync_tooltip_export',
  'sync_tooltip_import',
  'sync_export_done',
  'sync_import_done',
  'copy_page_url_failed_permission'
];

const overlongKatakanaTerms = [
  'コマンドバー',
  'ショートカット',
  'ブラックリスト',
  'ブックマーク',
  'ページクリップ',
  'アップロード',
  'フィードバック',
  'プレビュー',
  'テンプレート',
  'キャンセル',
  'インポート',
  'エクスポート',
  'クリップボード',
  'ハーフトーン',
  'サンプリング'
];

compactKeys.forEach((key) => {
  const value = message(key);
  overlongKatakanaTerms.forEach((term) => {
    assert.strictEqual(
      value.includes(term),
      false,
      `${key} should avoid overlong katakana term: ${term}`
    );
  });
});

console.log('Japanese UI copy tests passed');
