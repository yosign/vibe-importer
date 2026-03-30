"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PackageSearch, Upload } from "lucide-react";
import { CsvExportButton } from "@/components/CsvExportButton";
import { ProductCard } from "@/components/ProductCard";
import { ProductTable, type ProductRow } from "@/components/ProductTable";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  const pendingCount = products.filter((product) => product.status === "pending").length;

  const tabs = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "ready", label: "Ready" },
    { value: "exported", label: "Exported" }
  ] as const;

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-zinc-100">Products</h1>
            <p className="mt-1 text-[13px] text-zinc-400">Manage and export Shopify products</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/import"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              )}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Link>
            <CsvExportButton
              productIds={selectedIds}
              disabled={readyCount === 0 && selectedIds.length === 0}
              onExported={loadProducts}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid gap-4 md:grid-cols-3">
          <ProductCard label="Total Products" value={products.length} />
          <ProductCard label="Ready to Export" value={readyCount} tone="emerald" />
          <ProductCard label="Pending" value={pendingCount} tone="amber" />
        </div>

        {/* Product table card */}
        <Card className="rounded-xl border border-zinc-800 bg-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800 px-6 py-4">
            <h2 className="text-[13px] font-medium text-zinc-100">Product List</h2>
            {/* Filter tabs */}
            <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={cn(
                    "rounded-md px-3 py-1 text-[13px] font-medium transition-colors",
                    statusFilter === tab.value
                      ? "bg-zinc-700 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-zinc-700 p-8 text-zinc-500">
                <PackageSearch className="h-5 w-5" />
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-zinc-700 p-8 text-zinc-500">
                <PackageSearch className="h-5 w-5" />
                No products found for the current filter.
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
