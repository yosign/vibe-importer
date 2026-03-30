"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
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
    pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    ready: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    exported: "bg-zinc-700/50 text-zinc-500 border border-zinc-700"
  };

  return (
    <span
      className={cn(
        "mono inline-flex items-center rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wide",
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
      <Table>
        <TableHeader>
          <TableRow className="border-b border-zinc-800 hover:bg-transparent">
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(event) =>
                  onSelectedIdsChange(event.target.checked ? products.map((product) => product.id) : [])
                }
                className="accent-emerald-500"
              />
            </TableHead>
            <TableHead className="w-12" />
            <TableHead className="text-[12px] uppercase tracking-wider text-zinc-400 font-medium">Title</TableHead>
            <TableHead className="text-[12px] uppercase tracking-wider text-zinc-400 font-medium">Type</TableHead>
            <TableHead className="text-[12px] uppercase tracking-wider text-zinc-400 font-medium">Variants</TableHead>
            <TableHead className="text-[12px] uppercase tracking-wider text-zinc-400 font-medium">Status</TableHead>
            <TableHead className="text-[12px] uppercase tracking-wider text-zinc-400 font-medium">Created</TableHead>
            <TableHead className="text-right text-[12px] uppercase tracking-wider text-zinc-400 font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.id}
              className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30"
            >
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(product.id)}
                  onChange={() => toggleProduct(product.id)}
                  className="accent-emerald-500"
                />
              </TableCell>
              <TableCell>
                {product.firstImage ? (
                  <img
                    src={`/api/images?imagePath=${encodeURIComponent(product.firstImage)}`}
                    alt={product.title}
                    className="h-9 w-9 rounded-md object-cover bg-zinc-800"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 text-xs text-zinc-600">
                    —
                  </div>
                )}
              </TableCell>
              <TableCell>
                <p className="text-[14px] font-medium text-zinc-100">{product.title}</p>
                {product.vendor && (
                  <p className="text-[12px] text-zinc-500">{product.vendor}</p>
                )}
              </TableCell>
              <TableCell className="text-[13px] text-zinc-400">
                {product.type || <span className="text-zinc-700">—</span>}
              </TableCell>
              <TableCell className="mono tabular text-[13px] text-zinc-400">
                {product.variantCount}
              </TableCell>
              <TableCell>
                <StatusBadge status={product.status} />
              </TableCell>
              <TableCell className="mono text-[12px] text-zinc-500">
                {new Date(product.created_at).toLocaleDateString("en-US")}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/products/${product.id}`}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "h-8 w-8 p-0 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
                    )}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(product.id)}
                    className="h-8 w-8 p-0 text-zinc-600 hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
