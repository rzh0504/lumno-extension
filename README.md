<p align="center">
  <img src="./assets/images/lumno.png" alt="Lumno logo" width="96" height="96" />
</p>

<h1 align="center">Lumno</h1>

<p align="center">
  聚焦搜索 & 极简新标签页
  <br />
  在任意网页快速搜索、直达网址、切换标签页，并增强新标签页体验。
</p>


<p align="center">
  <img src="https://img.shields.io/badge/Manifest-MV3-111827?style=flat-square" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/Browser-Chromium-2563eb?style=flat-square" alt="Chromium" />
  <img src="https://img.shields.io/badge/Language-JavaScript-f59e0b?style=flat-square" alt="JavaScript" />
  <img src="https://img.shields.io/badge/License-GPL--3.0-16a34a?style=flat-square" alt="GPL-3.0" />
</p>

<p align="center">
  <a href="README.md">简体中文</a> |
  <a href="README.en.md">English</a> |
  <a href="README.ja.md">日本語</a>
</p>



Lumno 是一个面向 Chromium 浏览器的 Manifest V3 扩展，把「聚焦搜索命令栏」和「极简新标签页」放在一起：你可以从任意网页快速搜索书签、历史、常用网站、已打开标签页、站内搜索和 AI 助手，也可以把新标签页整理成更好用的工作入口。

当前版本：`0.9.14`

<img width="1400" height="560" alt="banner_m" src="https://github.com/user-attachments/assets/cc8a4e34-bf7d-4448-9280-f5734f8b84bf" />

## 功能亮点

- 聚焦搜索命令栏：在任意可注入网页唤起悬浮搜索，支持打开网址、搜索关键词、切换已打开标签页、打开浏览器内部页面和进入 Lumno 设置。
- 智能搜索结果：整合书签、历史记录、常用网站、浏览器建议和当前已打开标签页，支持结果来源筛选、首位结果优先级、访问选择权重、拼音匹配和黑名单过滤。
- 站内搜索 / AI 搜索：内置 YouTube、Bilibili、GitHub、Google、Bing、Baidu、Zhihu、Douban、Juejin、Taobao、X、Reddit、Wikipedia 等快捷前缀；同时支持 ChatGPT、Gemini、豆包、千问、元宝、MiniMax、DeepSeek、Kimi 等 AI 入口。你也可以添加自定义模板和别名。
- 新标签页：提供搜索框、最近/最常访问站点卡片、书签网格/文件夹级联菜单、书签分页、最近站点固定与隐藏、反馈入口和可调内容宽度。
- 外观与壁纸：支持系统/浅色/深色主题，全局或仅新标签页生效；新标签页内置多套壁纸，支持本地壁纸、遮罩透明度、颗粒/半调/ASCII 滤镜、搜索框宽度和 Lumno 字标开关。
- 网页剪裁 PiP：在支持 Document Picture-in-Picture 的 HTTPS 顶层页面中选择页面局部内容，放入悬浮窗口用于参考和对照。
- 视频自动画中画：在 YouTube、Bilibili、Youku、腾讯视频、抖音、TikTok、Netflix、Vimeo、Prime Video、Disney+、Twitch 等站点切换标签页时，尝试自动进入视频 PiP。
- 标签页与浏览器增强：支持重启后恢复置顶网页标签页、受限页面回退到新标签页、复制当前页面链接、打开扩展快捷键页和扩展详情页。
- 多语言：扩展 UI 支持简体中文、繁体中文、英文、日文和跟随浏览器语言；本 README 支持简体中文、英文、日文切换。

## 实机截图
<p align="center">
  <img src="https://github.com/user-attachments/assets/2f32b28c-2655-4ffe-9f07-678793367f10" alt="Lumno preview 1" width="100%" />
  <br />
  <img src="https://github.com/user-attachments/assets/0c00c851-27c2-430a-a2a6-4e98c026514e" alt="Lumno preview 2" width="100%" />
</p>

## 快捷键

| 操作 | 默认快捷键 |
| --- | --- |
| 打开聚焦搜索命令栏 | `Cmd+Shift+K` / `Ctrl+Shift+K` |
| 打开命令栏并预填当前页面链接 | `Cmd+Shift+L` / `Ctrl+Shift+L` |
| 复制当前页面链接 | `Cmd+Shift+C` / `Ctrl+Shift+C` |

浏览器可能会占用或限制扩展快捷键。请在 `chrome://extensions/shortcuts`、`edge://extensions/shortcuts` 或对应浏览器的扩展快捷键页面中修改。

## 安装使用

也可以从 Chrome Web Store 安装：[Install Lumno on Chrome Web Store](https://chromewebstore.google.com/detail/nggfkkbmogmadfoikakkfegkoilfcfao?utm_source=item-share-cb)

手动安装：

1. 克隆或下载本仓库。
2. 打开 `chrome://extensions/`，或在 Edge/Brave/Vivaldi/Opera 等 Chromium 浏览器中打开对应的扩展管理页。
3. 开启「开发者模式」。
4. 点击「加载已解压的扩展程序」，选择仓库根目录。
5. 可选：进入扩展的设置页，调整语言、主题、新标签页内容、站内搜索、黑名单、PiP 和快捷键策略。

如果需要在本地 HTML、PDF 或 `file://` 页面使用聚焦搜索，请在扩展详情页开启「允许访问文件网址」。

## 开发

这个项目目前没有前端构建步骤，扩展源码会被浏览器直接加载。开发时主要依赖 Node 脚本做语法、资源和功能回归检查。

```bash
npm run check
npm run audit:i18n
npm run audit:style
npm run package:store
```

常用专项测试示例：

```bash
npm run test:settings
npm run test:search
npm run test:site-search-store
npm run test:message-router
npm run test:newtab-layout
npm run test:onboarding-content
```

`npm run package:store` 会读取 `manifest.json` 的版本号，并生成 `dist/lumno-store-v<version>.zip`。本命令依赖系统可用的 `zip` 和 `zipinfo`。

## 目录结构

| 路径 | 说明 |
| --- | --- |
| `manifest.json` | Manifest V3 配置、权限、命令、内容脚本和新标签页覆盖配置 |
| `src/background/` | Service worker、命令分发、搜索数据、站内/AI 搜索、PiP 所有权、置顶标签页恢复 |
| `src/newtab/` | 新标签页 UI、搜索、最近站点、书签、壁纸、反馈和页面提示 |
| `src/overlay/` | 网页内聚焦搜索浮层、结果列表、主题/语言同步和站点修正 |
| `src/content/` | 页面快捷键监听、网页剪裁 PiP、视频自动 PiP |
| `src/options/` | 扩展设置页 |
| `src/onboarding/` | 安装/更新引导页 |
| `src/shared/` | 设置、搜索、favicon、菜单、提示、URL 守卫等共享模块 |
| `_locales/` | 扩展 UI 文案 |
| `assets/data/` | 内置站内搜索和浏览器快捷入口数据 |
| `assets/wallpapers/` | 新标签页内置壁纸与缩略图 |
| `scripts/` | 校验、审计、打包和回归测试脚本 |

## 鸣谢

- 日文本地化：感谢 [Humi](https://github.com/Hum1Tab) 参与日文翻译与校对。
- 内置图标集：[Remix Icon](https://remixicon.com/)
- 内置字体：Open Sans

## GitHub Star 变化

<p align="center">
  <a href="https://www.star-history.com/#kubai087/lumno-extension&Date">
    <img src="https://api.star-history.com/svg?repos=kubai087/lumno-extension&type=Date" alt="Star History Chart" />
  </a>
</p>

## 许可证

本项目使用 [GPL-3.0](LICENSE) 许可证。
