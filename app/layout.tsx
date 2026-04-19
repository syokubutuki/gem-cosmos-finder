import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cosmos Finder — スマホの向こうの宇宙",
  description:
    "スマホカメラを向けた方向にある天体と距離をAR風に表示。ISSから460億光年先の宇宙の果てまで、距離を体感できるWebアプリ。",
  keywords: ["宇宙", "AR", "天体", "星座", "距離", "ISS", "天文"],
  openGraph: {
    title: "Cosmos Finder — スマホの向こうの宇宙",
    description: "スマホを向けた方向の天体と距離をAR風に可視化",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
