# 生日祝福 · Birthday Wishes

一份可以定制、许愿和分享的生日礼物。以「今日偏爱」为主题，搭配奶油纸张、樱桃红与手绘 SVG 插画，适配电脑和手机。

## 功能

- **专属祝福**：自定义姓名、生日、年龄、署名和寄语，内置四套可编辑文案。
- **主题配色**：樱桃、抹茶、莓果三种主题。
- **互动蛋糕**：点击吹灭或重新点亮蜡烛，火焰会随鼠标或触摸产生的气流摆动，熄灭后飘起烟雾和彩纸。
- **生日小惊喜**：播放生日旋律、抽取幸运签。
- **祝福与心愿墙**：写下祝福或愿望，按类型查看留言。
- **独立分享链接**：每份祝福都有专属链接，可以继续编辑并分享给朋友。
- **减少动态效果**：遵循系统设置，减轻动画和彩纸效果。

## 快速开始

推荐使用 Node.js 24 或更高版本。

```sh
git clone https://github.com/wujiahaocoder/birthday-wishes.git
cd birthday-wishes
npm install
npm run dev
```

打开 [http://127.0.0.1:5173/](http://127.0.0.1:5173/)。Windows 用户安装依赖后，也可以双击仓库中的 `启动生日祝福.cmd`。

## 使用

1. 点击「定制这份祝福」，填写寿星信息、署名和寄语，选择喜欢的配色。
2. 保存后，通过分享按钮复制专属链接。
3. 点击蛋糕吹蜡烛，开启生日旋律，或抽取一张幸运签。
4. 在祝福墙留下祝福和愿望，也可以切换分类查看。

创建者可在制作时使用的浏览器继续编辑祝福。请保留启动窗口；关闭后，本地服务会停止。

## 构建与运行

```sh
npm run build:local
npm start
```

默认仅本机可访问。部署到服务器时，可以通过 `HOST` 和 `PORT` 设置监听地址和端口，并配置 HTTPS 反向代理。访问分享链接的设备需要能够连接运行此项目的服务器。

更多操作和开发说明见 [中文使用说明](README.zh-CN.md)。

## 验证

```sh
npm run typecheck
npm run build:local
node scripts/verify.mjs
```

## 许可证与署名

采用 [CC BY-NC 4.0（署名—非商业性使用 4.0 国际）](LICENSE)：**仅限非商业用途，可以自由使用、修改和分发，必须保留原作者署名并注明修改。**

分发原版或修改版时，请保留 [NOTICE](NOTICE) 中的作者与版权声明，提供[许可证链接](https://creativecommons.org/licenses/by-nc/4.0/)，并标明是否作过修改。

作者：[wujiahaocoder](https://github.com/wujiahaocoder) · 项目：[birthday-wishes](https://github.com/wujiahaocoder/birthday-wishes)

第三方依赖与随附代码仍遵循各自的许可证，详见 [NOTICE](NOTICE)。
