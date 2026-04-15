# 国际象棋应用原型

这是一个零依赖的国际象棋原型，优先满足两个目标：

1. 先在本机直接测试和演示。
2. 后续迁移到 iPad 时尽量少改代码。

## 已实现功能

- 人人对战
- 人机对战
- 3 档难度：初级 / 中级 / 高级
- 兵升变
- 王车易位
- 吃过路兵
- 将军、将死、逼和、五十回合规则、部分子力不足和棋判断
- 悔棋
- 触屏友好的棋盘布局

## 本机运行

直接用浏览器打开 `index.html` 即可开始测试。

如果你更习惯本地服务，也可以在这个目录下启动任意静态文件服务器，然后访问首页。

## 文件说明

- `index.html`：页面结构
- `styles.css`：界面样式
- `engine.js`：棋局规则与 AI
- `app.js`：交互逻辑
- `engine-tests.js`：给 Windows Script Host 用的基础规则自测

## Windows 自测

如果你的系统允许 `cscript` 读取本地脚本，可以在项目目录执行：

```powershell
cscript //NoLogo engine-tests.js
```

## 后续迁移到 iPad 的建议

推荐两条路线：

1. 先把这一版托管成静态网页，直接用 iPad Safari 打开测试。
2. 后续如果需要上架 App Store，可以把当前棋局引擎复用到 `Expo/React Native` 或 `Capacitor` 容器中。

其中 `engine.js` 已经和界面解耦，后续迁移时可以直接复用核心规则和 AI。
