import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "杭州国际博览中心二期问卷统计报告",
  description: "基于问卷映射、问卷结构和原始数据生成的可筛选统计报告。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
