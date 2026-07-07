import type { Metadata, Viewport } from "next";
import SyncManager from "@/components/SyncManager";
import "./globals.css";

export const metadata: Metadata = {
  title: "Training Memo",
  description: "シンプルなトレーニング記録アプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Training Memo",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="h-full bg-gray-50">
        <SyncManager />
        {children}
      </body>
    </html>
  );
}
