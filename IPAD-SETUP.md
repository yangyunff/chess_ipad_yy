# iPad 版本说明

## 入口文件

- 本机原型入口：`index.html`
- 新的 iPad 适配版入口：`ipad.html`

## 这版做了什么

- 针对 iPad 加入了主屏应用所需的 `manifest`、`theme-color`、安全区和全屏模式支持
- 新增了离线缓存脚本 `sw.js`
- 棋盘和棋子改成了更柔和的护眼配色
- 修正了棋盘格子大小不稳定的问题：现在固定为严格的 `8 x 8` 等大网格

## 本机测试

直接用浏览器打开 `ipad.html` 即可测试新版界面。

## 在 iPad 上像 App 一样使用

1. 把整个目录放到一个静态服务器上
2. 用 iPad Safari 打开 `ipad.html`
3. 点击“分享”
4. 选择“添加到主屏幕”

添加后会以接近 App 的全屏方式打开。

## 主要文件

- `ipad.html`：iPad 版页面入口
- `styles-ipad.css`：iPad 版样式
- `app-ipad.js`：iPad 版交互逻辑
- `engine.js`：棋规和 AI 引擎
- `app.webmanifest`：主屏应用配置
- `sw.js`：离线缓存
- `icon.svg`：应用图标
