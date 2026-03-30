"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

function statusVariant(status: ProductRow["status"]) {
  if (status === "ready") return "secondary";
  if (status === "exported") return "outline";
  return "default";
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) =>
                onSelectedIdsChange(event.target.checked ? products.map((product) => product.id) : [])
              }
            />
          </TableHead>
          <TableHead>缩略图</TableHead>
          <TableHead>标题</TableHead>
          <TableHead>供应商</TableHead>
          <TableHead>类型</TableHead>
          <TableHead>变体数</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>
              <input
                type="checkbox"
                checked={selectedIds.includes(product.id)}
                onChange={() => toggleProduct(product.id)}
              />
            </TableCell>
            <TableCell>
              {product.firstImage ? (
                <img
                  src={`/api/images?imagePath=${encodeURIComponent(product.firstImage)}`}
                  alt={product.title}
                  className="h-12 w-12 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground">
                  N/A
                </div>
              )}
            </TableCell>
            <TableCell className="font-medium">{product.title}</TableCell>
            <TableCell>{product.vendor || "-"}</TableCell>
            <TableCell>{product.type || "-"}</TableCell>
            <TableCell>{product.variantCount}</TableCell>
            <TableCell>
              <Badge variant={statusVariant(product.status)}>{product.status}</Badge>
            </TableCell>
            <TableCell>{new Date(product.created_at).toLocaleString("zh-CN")}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <Link
                  href={`/products/${product.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  编辑
                </Link>
                <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(product.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
