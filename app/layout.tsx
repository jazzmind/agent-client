import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { VersionBar } from "@/components/layout/VersionBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent Client",
  description: "Busibox Agent Client",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const mastraUrl = process.env.MASTRA_API_URL || "";
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <Header basePath={basePath} mastraUrl={mastraUrl} />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <VersionBar version={process.env.NEXT_PUBLIC_VERSION} />
      </body>
    </html>
  );
}
