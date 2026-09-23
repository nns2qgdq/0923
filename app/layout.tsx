import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Taiwan Weather GIS Dashboard | IDC-2 CWA 即時氣象地圖",
  description: "整合中央氣象署 (CWA) Open Data (O-A0003-001) 與台灣行政區 GIS 向量地圖之互動式天氣儀表板。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  );
}
