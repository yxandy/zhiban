import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "值班系统",
  description: "值班展示系统工程骨架与本地运行验证入口",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body
        suppressHydrationWarning
        style={{
          WebkitTextSizeAdjust: "100%",
          WebkitTouchCallout: "none",
        }}
      >
        {children}
      </body>
    </html>
  );
}
