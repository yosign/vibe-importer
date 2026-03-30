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
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <header className="border-b border-zinc-800 bg-zinc-950">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-8 px-6">
            <span className="text-sm font-semibold tracking-tight text-zinc-100">Vibe Importer</span>
            <nav className="flex items-center gap-1">
              <Link
                href="/"
                className="rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              >
                Products
              </Link>
              <Link
                href="/import"
                className="rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              >
                Import
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
