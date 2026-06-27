# Lumno Chrome Store Image 01 - Focus Search

这是第一张 Chrome 商店宣传图的 Figma 开发插件。运行后会生成一张 `1280 x 800` 的可编辑画板，里面的主要 UI 都是 Figma Frame/Text/Shape，不是扁平截图。

之所以采用插件生成，而不是贴 SVG/PNG，是因为 Figma 的 Auto Layout 需要通过 Frame 的 `layoutMode`、padding、spacing 等属性来保留结构。参考：Figma Plugin API 的 [`layoutMode`](https://www.figma.com/plugin-docs/api/properties/nodes-layoutmode/) 文档。

## How to Run

1. Open Figma.
2. Go to `Plugins -> Development -> Import plugin from manifest...`.
3. Select `manifest.json` in this folder.
4. Run `Lumno Store Image 01 - Focus Search`.

The generated frame is `1280 x 800` and uses editable frames, text, fills, and auto-layout containers.

If an older copy of this development plugin was already imported, import `manifest.json` again so Figma picks up the updated `documentAccess` setting.

## Copy

Headline:

```text
别翻了，直接搜
书签、历史和标签页
```

Subcopy:

```text
在当前网页按下快捷键，常用网站、书签、历史和已打开页面都放到一起。
```

## Data/Interaction Notes

- Shortcut follows `manifest.json`: `Cmd+Shift+K` / `Ctrl+Shift+K`.
- Overlay width follows `src/overlay/search-panel.js`, `src/overlay/shell.js`, and `src/overlay/lifecycle.js`: standard preset `760px`.
- Suggestion row height follows `src/overlay/suggestions-view.css`: `52px`.
- Search input typography follows `src/shared/search-input.css`: 16px, medium.
- Results use real Lumno result types and zh-CN labels: `已打开`, `常用`, `书签`, `历史`, `搜索`.
- Demo query uses `extension`, matching Lumno onboarding examples.
