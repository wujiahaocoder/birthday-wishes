# 今日偏爱 · Birthday Studio

手绘 SVG 生日祝福网站，可定制姓名、日期、年龄、祝福语与配色，支持带气流与阻尼的蜡烛火焰、吹蜡烛彩纸、生日旋律、幸运签，以及保存到服务端的许愿留言。

Node.js 24+：

```sh
npm install
npm run dev
```

本地地址默认 `http://127.0.0.1:5173/`。真实数据在 `data/birthday.sqlite` 中持久保存。

生产运行：`npm run build:local`，然后 `npm start`。

完整使用、存储与部署说明见 [README.zh-CN.md](README.zh-CN.md)。
