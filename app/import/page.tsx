"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
    <main className="min-h-screen px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="border-white/70 bg-white/85 backdrop-blur">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-3xl">Import Products</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                扫描 `workspace/imports/` 下的商品目录，并逐个解析写入 Supabase。
              </p>
            </div>
            <Button onClick={handleScan} disabled={scanning}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {scanning ? "Scanning..." : "Scan imports folder"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {scanning ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
            ) : folders.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
                No scanned folders yet. Click &quot;Scan imports folder&quot; to start.
              </div>
            ) : (
              folders.map((folder) => (
                <div
                  key={folder.name}
                  className="flex flex-col gap-3 rounded-2xl border bg-white/80 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">{folder.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {folder.message ?? `Status: ${folder.status}`}
                    </p>
                  </div>
                  <Button
                    variant={folder.status === "success" ? "secondary" : "default"}
                    onClick={() => handleParse(folder.name)}
                    disabled={folder.status === "loading"}
                  >
                    {folder.status === "loading" ? "Parsing..." : "Parse"}
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium">
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
      </div>
    </main>
  );
}
