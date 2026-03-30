"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { ImageEditor, type EditableImage } from "@/components/ImageEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <main className="min-h-screen px-4 py-10 md:px-8">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-dashed bg-white/70 p-10 text-muted-foreground">
          Loading product...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium">
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/70 bg-white/90">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={product.title} onChange={(e) => updateField("title", e.target.value)} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input id="vendor" value={product.vendor ?? ""} onChange={(e) => updateField("vendor", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input id="type" value={product.type ?? ""} onChange={(e) => updateField("type", e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input id="tags" value={product.tags ?? ""} onChange={(e) => updateField("tags", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select id="status" value={product.status} onChange={(e) => updateField("status", e.target.value as ProductDetail["status"])}>
                    <option value="pending">pending</option>
                    <option value="ready">ready</option>
                    <option value="exported">exported</option>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="option_name">Option Name</Label>
                <Input id="option_name" value={product.option_name ?? "Color"} onChange={(e) => updateField("option_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body_html">Description</Label>
                <textarea
                  id="body_html"
                  className="min-h-40 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={product.body_html ?? ""}
                  onChange={(e) => updateField("body_html", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/90">
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageEditor images={product.images} onChange={(images) => updateField("images", images)} />
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/70 bg-white/90">
          <CardHeader>
            <CardTitle>Variants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {product.variants.map((variant, index) => (
              <div key={`${variant.id ?? "new"}-${index}`} className="space-y-4 rounded-2xl border p-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Option Value</Label>
                    <Input
                      value={variant.option_value}
                      onChange={(e) => {
                        const next = [...product.variants];
                        next[index] = { ...variant, option_value: e.target.value };
                        updateField("variants", next);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input
                      value={variant.sku}
                      onChange={(e) => {
                        const next = [...product.variants];
                        next[index] = { ...variant, sku: e.target.value };
                        updateField("variants", next);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input
                      value={variant.price}
                      onChange={(e) => {
                        const next = [...product.variants];
                        next[index] = { ...variant, price: e.target.value };
                        updateField("variants", next);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Inventory</Label>
                    <Input
                      type="number"
                      value={variant.inventory_qty}
                      onChange={(e) => {
                        const next = [...product.variants];
                        next[index] = { ...variant, inventory_qty: Number.parseInt(e.target.value, 10) || 0 };
                        updateField("variants", next);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Separator />
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                updateField("variants", [
                  ...product.variants,
                  { option_value: "New Option", sku: "", price: "0.00", inventory_qty: 0 }
                ])
              }
            >
              Add Variant
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
