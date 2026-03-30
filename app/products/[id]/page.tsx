"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { ImageEditor, type EditableImage } from "@/components/ImageEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

type EditableVariant = {
  id?: string;
  option_value: string;
  sku: string;
  price: string;
  inventory_qty: number;
};

type ProductDetail = {
  id: string;
  title: string;
  vendor: string | null;
  type: string | null;
  tags: string | null;
  body_html: string | null;
  option_name: string | null;
  status: "pending" | "ready" | "exported";
  variants: EditableVariant[];
  images: EditableImage[];
};

const inputClass =
  "border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:border-emerald-500";

export default function ProductEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const response = await fetch(`/api/products/${params.id}`, { cache: "no-store" });
        const data = (await response.json()) as { product?: ProductDetail; error?: string };
        if (!response.ok || !data.product) {
          throw new Error(data.error ?? "Failed to load product");
        }
        setProduct({
          ...data.product,
          variants: data.product.variants.map((variant) => ({
            ...variant,
            price: String(variant.price ?? "")
          }))
        });
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    }

    void loadProduct();
  }, [params.id]);

  function updateField<K extends keyof ProductDetail>(key: K, value: ProductDetail[K]) {
    setProduct((current) => (current ? { ...current, [key]: value } : current));
  }

  async function handleSave() {
    if (!product) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: product.title,
          vendor: product.vendor ?? "",
          type: product.type ?? "",
          tags: product.tags ?? "",
          body_html: product.body_html ?? "",
          option_name: product.option_name ?? "Color",
          status: product.status,
          variants: product.variants,
          images: product.images.map((image) => ({
            id: image.id,
            sort_order: image.sort_order
          }))
        })
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Save failed");
      }

      window.alert("Product updated");
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !product) {
    return (
      <main className="px-6 py-8">
        <div className="mx-auto max-w-6xl rounded-xl border border-dashed border-zinc-700 p-10 text-zinc-500">
          Loading product...
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="mb-2 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-zinc-100"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Products
            </Link>
            <h1 className="text-[24px] font-semibold tracking-tight text-zinc-100">{product.title}</h1>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 text-white hover:bg-emerald-500"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Two-column layout: left=3, right=2 */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* LEFT column (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Product Info card */}
            <Card className="rounded-xl border border-zinc-800 bg-zinc-900">
              <CardHeader className="border-b border-zinc-800 px-6 py-4">
                <CardTitle className="text-[13px] font-medium text-zinc-100">Product Info</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-[12px] uppercase tracking-wider text-zinc-400">Title</Label>
                  <Input
                    id="title"
                    value={product.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vendor" className="text-[12px] uppercase tracking-wider text-zinc-400">Vendor</Label>
                    <Input
                      id="vendor"
                      value={product.vendor ?? ""}
                      onChange={(e) => updateField("vendor", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-[12px] uppercase tracking-wider text-zinc-400">Type</Label>
                    <Input
                      id="type"
                      value={product.type ?? ""}
                      onChange={(e) => updateField("type", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-[12px] uppercase tracking-wider text-zinc-400">Tags</Label>
                    <Input
                      id="tags"
                      value={product.tags ?? ""}
                      onChange={(e) => updateField("tags", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="option_name" className="text-[12px] uppercase tracking-wider text-zinc-400">Option Name</Label>
                    <Input
                      id="option_name"
                      value={product.option_name ?? "Color"}
                      onChange={(e) => updateField("option_name", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-[12px] uppercase tracking-wider text-zinc-400">Status</Label>
                  <select
                    id="status"
                    value={product.status}
                    onChange={(e) => updateField("status", e.target.value as ProductDetail["status"])}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="pending">pending</option>
                    <option value="ready">ready</option>
                    <option value="exported">exported</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Description card */}
            <Card className="rounded-xl border border-zinc-800 bg-zinc-900">
              <CardHeader className="border-b border-zinc-800 px-6 py-4">
                <CardTitle className="text-[13px] font-medium text-zinc-100">Description</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <textarea
                  id="body_html"
                  className="mono min-h-32 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-0"
                  value={product.body_html ?? ""}
                  onChange={(e) => updateField("body_html", e.target.value)}
                  placeholder="<p>Product description HTML...</p>"
                />
              </CardContent>
            </Card>
          </div>

          {/* RIGHT column (2/5) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images card */}
            <Card className="rounded-xl border border-zinc-800 bg-zinc-900">
              <CardHeader className="border-b border-zinc-800 px-6 py-4">
                <CardTitle className="text-[13px] font-medium text-zinc-100">Images</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ImageEditor images={product.images} onChange={(images) => updateField("images", images)} />
              </CardContent>
            </Card>

            {/* Variants card */}
            <Card className="rounded-xl border border-zinc-800 bg-zinc-900">
              <CardHeader className="border-b border-zinc-800 px-6 py-4">
                <CardTitle className="text-[13px] font-medium text-zinc-100">Variants</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-[11px] uppercase tracking-wider text-zinc-500 px-4">Option</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider text-zinc-500">SKU</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider text-zinc-500">Price</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider text-zinc-500">Qty</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.variants.map((variant, index) => (
                      <TableRow
                        key={`${variant.id ?? "new"}-${index}`}
                        className="border-b border-zinc-800/50 hover:bg-zinc-800/20"
                      >
                        <TableCell className="px-4 py-2">
                          <Input
                            value={variant.option_value}
                            onChange={(e) => {
                              const next = [...product.variants];
                              next[index] = { ...variant, option_value: e.target.value };
                              updateField("variants", next);
                            }}
                            className="h-7 border-zinc-700 bg-zinc-950 text-xs text-zinc-100 focus-visible:ring-0 focus-visible:border-emerald-500"
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            value={variant.sku}
                            onChange={(e) => {
                              const next = [...product.variants];
                              next[index] = { ...variant, sku: e.target.value };
                              updateField("variants", next);
                            }}
                            className="mono h-7 border-zinc-700 bg-zinc-950 text-xs text-zinc-100 focus-visible:ring-0 focus-visible:border-emerald-500"
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            value={variant.price}
                            onChange={(e) => {
                              const next = [...product.variants];
                              next[index] = { ...variant, price: e.target.value };
                              updateField("variants", next);
                            }}
                            className="mono h-7 border-zinc-700 bg-zinc-950 text-xs text-zinc-100 focus-visible:ring-0 focus-visible:border-emerald-500"
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            type="number"
                            value={variant.inventory_qty}
                            onChange={(e) => {
                              const next = [...product.variants];
                              next[index] = {
                                ...variant,
                                inventory_qty: Number.parseInt(e.target.value, 10) || 0
                              };
                              updateField("variants", next);
                            }}
                            className="mono h-7 border-zinc-700 bg-zinc-950 text-xs text-zinc-100 focus-visible:ring-0 focus-visible:border-emerald-500"
                          />
                        </TableCell>
                        <TableCell className="py-2 pr-4">
                          <button
                            type="button"
                            onClick={() => {
                              const next = product.variants.filter((_, i) => i !== index);
                              updateField("variants", next);
                            }}
                            className="text-zinc-600 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      updateField("variants", [
                        ...product.variants,
                        { option_value: "New Option", sku: "", price: "0.00", inventory_qty: 0 }
                      ])
                    }
                    className="w-full border-dashed border-zinc-700 bg-transparent text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Add Variant
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
