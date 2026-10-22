import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "今日偏爱 · 把生日的美好都送给你",
  description: "一封写给你的生日来信，一块甜甜的蛋糕，和每一句值得珍藏的祝福。定制专属生日页，写下心愿，让美好被看见。",
  icons: { icon: "/favicon.svg" },
  openGraph: { title: "今日偏爱 · 一份专属生日祝福", description: "今天的快乐和偏爱，全都给你。", type: "website", locale: "zh_CN" },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
