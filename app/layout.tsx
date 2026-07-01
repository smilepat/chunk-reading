import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "chunk-reading — 직독직해 cue 데모",
  description:
    "영어 지문을 의미 단위로 끊고 한국어 직독직해 cue로 연습하는 드롭인 컴포넌트 데모",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
