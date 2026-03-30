import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vibe Importer",
  description: "Shopify product import and CSV export tool"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="bg-zinc-950">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <header className="border-b border-zinc-800 bg-zinc-950 h-12">
          <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-6">
            {/* Left: monogram + name */}
            <div className="flex items-center gap-2.5">
              <span className="mono text-[20px] font-bold text-emerald-500 leading-none">VI</span>
              <span className="text-[14px] font-medium tracking-tight text-zinc-100">Vibe Importer</span>
            </div>
            {/* Center: nav */}
            <nav className="flex items-center gap-6">
              <Link
                href="/"
                className="text-[13px] text-zinc-400 uppercase tracking-widest transition-colors hover:text-zinc-100"
              >
                Products
              </Link>
              <Link
                href="/import"
                className="text-[13px] text-zinc-400 uppercase tracking-widest transition-colors hover:text-zinc-100"
              >
                Import
              </Link>
            </nav>
            {/* Right: version badge */}
            <span className="mono rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
              v1.0
            </span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
