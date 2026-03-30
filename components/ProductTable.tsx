"use client";

import Link from "next/link";
import { Edit2, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ProductRow = {
  id: string;
  title: string;
  vendor: string | null;
  type: string | null;
  status: "pending" | "ready" | "exported";
  created_at: string;
  variantCount: number;
  imageCount: number;
  firstImage: string | null;
};

function StatusBadge({ status }: { status: ProductRow["status"] }) {
  const styles = {
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    ready: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    exported: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        styles[status]
      )}
    >
      {status}
    </span>
  );
}

export function ProductTable({
  products,
  selectedIds,
  onSelectedIdsChange,
  onDelete
}: {
  products: ProductRow[];
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  onDelete: (id: string) => void;
}) {
  const allSelected = products.length > 0 && selectedIds.length === products.length;

  function toggleProduct(id: string) {
    if (selectedIds.includes(id)) {
      onSelectedIdsChange(selectedIds.filter((item) => item !== id));
      return;
    }
    onSelectedIdsChange([...selectedIds, id]);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="w-10 pb-3 pr-3 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(event) =>
                  onSelectedIdsChange(event.target.checked ? products.map((product) => product.id) : [])
                }
                className="accent-emerald-500"
              />
            </th>
            <th className="w-12 pb-3 pr-4 text-left"></th>
            <th className="pb-3 pr-4 text-left font-medium text-zinc-400">Title</th>
            <th className="pb-3 pr-4 text-left font-medium text-zinc-400">Type</th>
            <th className="pb-3 pr-4 text-left font-medium text-zinc-400">Variants</th>
            <th className="pb-3 pr-4 text-left font-medium text-zinc-400">Status</th>
            <th className="pb-3 pr-4 text-left font-medium text-zinc-400">Created</th>
            <th className="pb-3 text-right font-medium text-zinc-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {products.map((product) => (
            <tr key={product.id} className="group transition-colors hover:bg-zinc-800/40">
              <td className="py-3 pr-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(product.id)}
                  onChange={() => toggleProduct(product.id)}
                  className="accent-emerald-500"
                />
              </td>
              <td className="py-3 pr-4">
                {product.firstImage ? (
                  <img
                    src={`/api/images?imagePath=${encodeURIComponent(product.firstImage)}`}
                    alt={product.title}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-xs text-zinc-600">
                    —
                  </div>
                )}
              </td>
              <td className="py-3 pr-4">
                <p className="font-medium text-zinc-100">{product.title}</p>
                {product.vendor && (
                  <p className="text-xs text-zinc-500">{product.vendor}</p>
                )}
              </td>
              <td className="py-3 pr-4 text-zinc-400">{product.type || <span className="text-zinc-700">—</span>}</td>
              <td className="py-3 pr-4 text-zinc-400">{product.variantCount}</td>
              <td className="py-3 pr-4">
                <StatusBadge status={product.status} />
              </td>
              <td className="py-3 pr-4 text-zinc-500">
                {new Date(product.created_at).toLocaleDateString("en-US")}
              </td>
              <td className="py-3">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/products/${product.id}`}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "h-8 w-8 p-0 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
                    )}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(product.id)}
                    className="h-8 w-8 p-0 text-zinc-600 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
