"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { ImageEditor, type EditableImage } from "@/components/ImageEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

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
              className="mb-2 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Products
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{product.title}</h1>
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

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          {/* Left: Basic Info */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-5 text-sm font-medium text-zinc-100">Basic Info</h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs text-zinc-400">Title</Label>
                <Input
                  id="title"
                  value={product.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vendor" className="text-xs text-zinc-400">Vendor</Label>
                  <Input
                    id="vendor"
                    value={product.vendor ?? ""}
                    onChange={(e) => updateField("vendor", e.target.value)}
                    className="border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-xs text-zinc-400">Type</Label>
                  <Input
                    id="type"
                    value={product.type ?? ""}
                    onChange={(e) => updateField("type", e.target.value)}
                    className="border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-xs text-zinc-400">Tags</Label>
                  <Input
                    id="tags"
                    value={product.tags ?? ""}
                    onChange={(e) => updateField("tags", e.target.value)}
                    className="border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-xs text-zinc-400">Status</Label>
                  <Select
                    id="status"
                    value={product.status}
                    onChange={(e) => updateField("status", e.target.value as ProductDetail["status"])}
                    className="border-zinc-700 bg-zinc-950 text-zinc-100 focus-visible:ring-emerald-500"
                  >
                    <option value="pending">pending</option>
                    <option value="ready">ready</option>
                    <option value="exported">exported</option>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="option_name" className="text-xs text-zinc-400">Option Name</Label>
                <Input
                  id="option_name"
                  value={product.option_name ?? "Color"}
                  onChange={(e) => updateField("option_name", e.target.value)}
                  className="border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body_html" className="text-xs text-zinc-400">Description</Label>
                <textarea
                  id="body_html"
                  className="min-h-40 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={product.body_html ?? ""}
                  onChange={(e) => updateField("body_html", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Right: Images */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-5 text-sm font-medium text-zinc-100">Images</h2>
            <ImageEditor images={product.images} onChange={(images) => updateField("images", images)} />
          </div>
        </div>

        {/* Variants */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-5 text-sm font-medium text-zinc-100">Variants</h2>
          <div className="space-y-3">
            {product.variants.map((variant, index) => (
              <div key={`${variant.id ?? "new"}-${index}`} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-400">Option Value</Label>
                    <Input
                      value={variant.option_value}
                      onChange={(e) => {
                        const next = [...product.variants];
                        next[index] = { ...variant, option_value: e.target.value };
                        updateField("variants", next);
                      }}
                      className="border-zinc-700 bg-zinc-900 text-zinc-100 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-400">SKU</Label>
                    <Input
                      value={variant.sku}
                      onChange={(e) => {
                        const next = [...product.variants];
                        next[index] = { ...variant, sku: e.target.value };
                        updateField("variants", next);
                      }}
                      className="border-zinc-700 bg-zinc-900 text-zinc-100 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-400">Price</Label>
                    <Input
                      value={variant.price}
                      onChange={(e) => {
                        const next = [...product.variants];
                        next[index] = { ...variant, price: e.target.value };
                        updateField("variants", next);
                      }}
                      className="border-zinc-700 bg-zinc-900 text-zinc-100 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-400">Inventory</Label>
                    <Input
                      type="number"
                      value={variant.inventory_qty}
                      onChange={(e) => {
                        const next = [...product.variants];
                        next[index] = { ...variant, inventory_qty: Number.parseInt(e.target.value, 10) || 0 };
                        updateField("variants", next);
                      }}
                      className="border-zinc-700 bg-zinc-900 text-zinc-100 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-4 bg-zinc-800" />
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              updateField("variants", [
                ...product.variants,
                { option_value: "New Option", sku: "", price: "0.00", inventory_qty: 0 }
              ])
            }
            className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          >
            Add Variant
          </Button>
        </div>
      </div>
    </main>
  );
}
