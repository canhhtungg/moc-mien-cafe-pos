import type { Metadata } from "next";
import "./globals.css";
import { CafeSessionProvider } from "@/context/CafeSessionContext";
import { CafeShell } from "@/components/CafeShell";

export const metadata: Metadata = {
  title: "Mộc Miên Café — Quản lý quán cafe tối giản & thân thiện",
  description: "Hệ thống gọi món, pha chế và quản lý quán cafe phong cách Minimalist ấm áp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CafeSessionProvider>
          <CafeShell>{children}</CafeShell>
        </CafeSessionProvider>
      </body>
    </html>
  );
}
