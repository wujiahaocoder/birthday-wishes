# 生日祝福 · Birthday Wishes 使用说明

一份可以定制、许愿和珍藏祝福的生日礼物。奶油纸张、樱桃红、手写感排版，适配电脑和手机。所有插画都是代码绘制的 SVG，没有生成图片或外部图片依赖。

## 本地运行

Windows 用户安装依赖后，也可以直接双击本项目目录中的 `启动生日祝福.cmd`。它会启动服务并打开浏览器；如果服务已经启动，则直接打开页面。请保留启动窗口。

使用 Node.js 24 或更高版本，在本目录运行：

```sh
npm install
npm run dev:local
```

浏览器打开终端显示的地址，默认是 `http://127.0.0.1:5173/`。

用于长期运行的优化版本：

```sh
npm run build:local
npm run start:local
```

`PORT` 可配置端口；`HOST` 默认 `127.0.0.1`，部署到自己的服务器时可设置为 `0.0.0.0`，在前面配置 HTTPS 反向代理。访问分享链接的设备需要能够连接运行项目的服务器；默认地址仅供本机使用。

## 使用方式

- 顶部「定制这份祝福」可以修改名字、生日、年龄、署名、寄语和三种主题色。内置四套可修改的祝福文案。
- 保存后会生成独立链接。每个链接拥有独立的祝福内容和留言墙。
- 创建者可在制作时使用的浏览器继续编辑祝福。更换浏览器或清理浏览器后，可以重新制作一份。
- 留言和愿望都会公开显示在当前祝福页中。内置祝福明确标注，不计入真实留言数量。
- 点击蛋糕吹灭蜡烛，再点一次重新点亮。移动鼠标或在蛋糕上滑动，会形成影响火焰的气流。
- 可以播放生日旋律、抽取幸运签、复制专属链接。音乐仅在点击播放后开启。

## 火焰效果

`components/BirthdayCake.tsx` 中的 SVG 火焰使用带惯性和阻尼的弹簧积分，而非循环摇摆动画。鼠标横向速度、距离衰减和热扰动共同驱动火苗中段与尖端。熄灭时火苗收缩，烟雾上升、弯曲并渐隐。页面不可见或蛋糕移出屏幕后暂停计算；系统开启「减少动态效果」时保留静态火焰并关闭彩纸。

## 验证

```sh
npm run typecheck
npm run build:local
node scripts/verify.mjs
```

验证脚本使用独立的临时环境，检查配置保存、编辑权限、输入校验、重复提交、留言筛选分页、限流、不同页面隔离，以及服务重启后的行为。

云端构建可以运行 `npm run build`。`npm run dev` 等同于 `npm run dev:local`，`npm start` 等同于 `npm run start:local`。原始 Vinext 开发命令保留为 `npm run dev:cloud`。

## 主要文件

| 路径 | 用途 |
| --- | --- |
| `app/page.tsx` | 祝福页、定制、分享、留言和音乐交互 |
| `app/globals.css` | 三套配色、纸张细节与响应式布局 |
| `components/BirthdayCake.tsx` | 手绘 SVG 蛋糕、火焰和烟雾 |
| `lib/celebration.ts` | 默认祝福、预设文案与输入约束 |
| `app/api/celebrations/` | 配置及留言服务端接口 |
| `db/schema.ts` | 数据表结构 |
| `scripts/local-server.mjs` | 本地开发及生产服务 |
| `server/local-database.mjs` | 持久化 SQLite 适配 |

## 许可证与署名

本项目采用 [PolyForm Noncommercial License 1.0.0](LICENSE)。仅限非商业用途；在该范围内可以自由使用、修改与分发，分发时须附带许可证或其官方链接，并保留 [NOTICE](NOTICE) 中的原作者署名。

原作者为 [wujiahaocoder](https://github.com/wujiahaocoder)，项目地址为 [birthday-wishes](https://github.com/wujiahaocoder/birthday-wishes)。第三方依赖与随附代码遵循各自的许可证，详见 [NOTICE](NOTICE)。
