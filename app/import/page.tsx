"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, FolderOpen, Loader2 } from "lucide-react";
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
            <h1 className="text-[28px] font-semibold tracking-tight text-zinc-100">Import</h1>
            <p className="mt-1 text-[13px] text-zinc-400">
              Scan workspace/imports and parse product folders
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
              <ArrowRight className="mr-2 h-4 w-4" />
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
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-800 m-4 p-12 text-center">
              <FolderOpen className="h-10 w-10 text-zinc-700" />
              <p className="text-[14px] text-zinc-400">No folders found</p>
              <p className="mono text-[13px] text-zinc-600">
                Add product folders to workspace/imports/
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {folders.map((folder) => (
                <div
                  key={folder.name}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FolderOpen className="h-5 w-5 flex-shrink-0 text-zinc-500" />
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium text-zinc-100">{folder.name}</p>
                      {folder.message && (
                        <p
                          className={cn(
                            "mono mt-0.5 text-[12px]",
                            folder.status === "success" && "text-emerald-400",
                            folder.status === "error" && "text-rose-400",
                            folder.status === "idle" && "text-zinc-500",
                            folder.status === "loading" && "text-zinc-400"
                          )}
                        >
                          {folder.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex flex-shrink-0 items-center gap-3">
                    {/* Status chip */}
                    {folder.status === "idle" && (
                      <span className="mono rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-amber-400">
                        Pending
                      </span>
                    )}
                    {folder.status === "loading" && (
                      <span className="mono flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-blue-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Parsing...
                      </span>
                    )}
                    {folder.status === "success" && (
                      <span className="mono flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Done
                      </span>
                    )}
                    {folder.status === "error" && (
                      <span className="mono rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-rose-400">
                        Error
                      </span>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleParse(folder.name)}
                      disabled={folder.status === "loading"}
                      className={cn(
                        folder.status !== "success" && "bg-emerald-600 text-white hover:bg-emerald-500",
                        folder.status === "success" && "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      )}
                    >
                      Parse
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] text-zinc-500 transition-colors hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
      </div>
    </main>
  );
}
