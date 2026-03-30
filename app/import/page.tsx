"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, FolderOpen, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FolderState = {
  name: string;
  status: "idle" | "loading" | "success" | "error";
  message?: string;
};

export default function ImportPage() {
  const [folders, setFolders] = useState<FolderState[]>([]);
  const [scanning, setScanning] = useState(false);

  async function handleScan() {
    setScanning(true);
    try {
      const response = await fetch("/api/scan", { cache: "no-store" });
      const data = (await response.json()) as { folders?: string[]; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Scan failed");
      }
      setFolders((data.folders ?? []).map((name) => ({ name, status: "idle" })));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function handleParse(folderName: string) {
    setFolders((current) =>
      current.map((folder) =>
        folder.name === folderName ? { ...folder, status: "loading", message: undefined } : folder
      )
    );

    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ folderName })
      });
      const data = (await response.json()) as { id?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Parse failed");
      }
      setFolders((current) =>
        current.map((folder) =>
          folder.name === folderName
            ? { ...folder, status: "success", message: `Created product ${data.id}` }
            : folder
        )
      );
    } catch (error) {
      setFolders((current) =>
        current.map((folder) =>
          folder.name === folderName
            ? {
                ...folder,
                status: "error",
                message: error instanceof Error ? error.message : "Parse failed"
              }
            : folder
        )
      );
    }
  }

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Import Products</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Scan your imports folder and parse product folders into Supabase
            </p>
          </div>
          <Button
            onClick={handleScan}
            disabled={scanning}
            className="bg-emerald-600 text-white hover:bg-emerald-500"
          >
            {scanning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {scanning ? "Scanning..." : "Scan Folder"}
          </Button>
        </div>

        {/* Folder list */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900">
          {scanning ? (
            <div className="space-y-px p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-zinc-800" />
              ))}
            </div>
          ) : folders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-700 m-4 p-10 text-center text-sm text-zinc-500">
              <FolderOpen className="h-8 w-8 text-zinc-600" />
              <p>No folders found.</p>
              <p className="text-xs">Add product folders to <code className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">workspace/imports/</code></p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {folders.map((folder) => (
                <div
                  key={folder.name}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-100">{folder.name}</p>
                    <p
                      className={cn(
                        "mt-0.5 text-xs",
                        folder.status === "success" && "text-emerald-400",
                        folder.status === "error" && "text-red-400",
                        folder.status === "idle" && "text-zinc-500",
                        folder.status === "loading" && "text-zinc-400"
                      )}
                    >
                      {folder.message ?? (folder.status === "idle" ? "Ready to parse" : folder.status)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={folder.status === "success" ? "secondary" : "default"}
                    onClick={() => handleParse(folder.name)}
                    disabled={folder.status === "loading"}
                    className={cn(
                      folder.status !== "success" && "bg-emerald-600 text-white hover:bg-emerald-500",
                      folder.status === "success" && "bg-zinc-800 text-zinc-400"
                    )}
                  >
                    {folder.status === "loading" ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : null}
                    {folder.status === "loading" ? "Parsing..." : "Parse"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
      </div>
    </main>
  );
}
