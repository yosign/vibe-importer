"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CsvExportButton({
  productIds,
  disabled,
  onExported
}: {
  productIds: string[];
  disabled?: boolean;
  onExported?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ productIds })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `shopify-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      onExported?.();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  const isDisabled = disabled || loading;

  return (
    <Button
      onClick={handleExport}
      disabled={isDisabled}
      className={
        isDisabled
          ? "cursor-not-allowed bg-zinc-800 text-zinc-600 hover:bg-zinc-800"
          : "bg-emerald-600 text-white hover:bg-emerald-500"
      }
    >
      <Download className="mr-2 h-4 w-4" />
      {loading
        ? "Exporting..."
        : productIds.length > 0
          ? `Export CSV (${productIds.length})`
          : "Export CSV"}
    </Button>
  );
}
