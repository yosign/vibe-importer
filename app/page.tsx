"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Boxes, CircleCheckBig, PackageSearch } from "lucide-react";
import { CsvExportButton } from "@/components/CsvExportButton";
import { ProductCard } from "@/components/ProductCard";
import { ProductTable, type ProductRow } from "@/components/ProductTable";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ProductsResponse = {
  products: ProductRow[];
  error?: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "ready" | "exported">("all");
  const [loading, setLoading] = useState(true);

  async function loadProducts() {
    setLoading(true);
    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      const data = (await response.json()) as ProductsResponse;
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load products");
      }
      setProducts(data.products);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (statusFilter === "all") {
      return products;
    }
    return products.filter((product) => product.status === statusFilter);
  }, [products, statusFilter]);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this product?")) {
      return;
    }

    const response = await fetch(`/api/products/${id}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      window.alert(data?.error ?? "Delete failed");
      return;
    }

    setSelectedIds((current) => current.filter((item) => item !== id));
    await loadProducts();
  }

  const readyCount = products.filter((product) => product.status === "ready").length;

  return (
    <main className="min-h-screen px-4 py-10 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
              Shopify Import Workflow
            </div>
            <h1 className="text-4xl font-semibold tracking-tight">Vibe Importer</h1>
            <p className="max-w-2xl text-muted-foreground">
              解析本地商品目录，编辑结构化商品数据，并导出 Shopify CSV。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/import" className={cn(buttonVariants({ variant: "outline" }))}>
              Go to Import
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <CsvExportButton
              productIds={selectedIds}
              disabled={readyCount === 0 && selectedIds.length === 0}
              onExported={loadProducts}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <ProductCard label="All Products" value={products.length} detail="已入库商品总数" />
          <ProductCard label="Ready" value={readyCount} detail="可导出到 Shopify 的商品" tone="secondary" />
          <ProductCard label="Selected" value={selectedIds.length} detail="当前表格中已选中的商品" />
        </div>

        <Card className="border-white/70 bg-white/90 backdrop-blur">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Boxes className="h-5 w-5" />
                Product List
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                选择商品后可批量导出；未选择时默认导出全部 `ready` 状态商品。
              </p>
            </div>
            <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <TabsList>
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="pending">pending</TabsTrigger>
                <TabsTrigger value="ready">ready</TabsTrigger>
                <TabsTrigger value="exported">exported</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed p-8 text-muted-foreground">
                <PackageSearch className="h-5 w-5" />
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed p-8 text-muted-foreground">
                <CircleCheckBig className="h-5 w-5" />
                No products found for current filter.
              </div>
            ) : (
              <ProductTable
                products={filteredProducts}
                selectedIds={selectedIds}
                onSelectedIdsChange={setSelectedIds}
                onDelete={handleDelete}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
