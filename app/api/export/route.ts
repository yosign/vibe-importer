import { NextResponse } from "next/server";
import { CsvProduct, generateShopifyCsv } from "@/lib/csvGenerator";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { productIds } = (await request.json()) as { productIds?: string[] };
    const supabase = getSupabaseServerClient();

    let productQuery = supabase
      .from("vi_products")
      .select("id, title, vendor, type, tags, body_html, option_name, status")
      .order("created_at", { ascending: false });

    if (Array.isArray(productIds) && productIds.length > 0) {
      productQuery = productQuery.in("id", productIds);
    } else {
      productQuery = productQuery.eq("status", "ready");
    }

    const { data: products, error: productsError } = await productQuery;
    if (productsError) {
      throw productsError;
    }

    const selectedProducts = products ?? [];
    const selectedIds = selectedProducts.map((product) => product.id);

    if (selectedIds.length === 0) {
      return NextResponse.json({ error: "No products available for export" }, { status: 400 });
    }

    const [{ data: variants, error: variantsError }, { data: images, error: imagesError }] = await Promise.all([
      supabase
        .from("vi_variants")
        .select("product_id, option_value, sku, price, inventory_qty")
        .in("product_id", selectedIds),
      supabase
        .from("vi_images")
        .select("product_id, local_path, sort_order")
        .in("product_id", selectedIds)
    ]);

    if (variantsError || imagesError) {
      throw variantsError ?? imagesError;
    }

    const variantsMap = new Map<string, CsvProduct["variants"]>();
    for (const variant of variants ?? []) {
      const next = variantsMap.get(variant.product_id) ?? [];
      next.push(variant);
      variantsMap.set(variant.product_id, next);
    }

    const imagesMap = new Map<string, CsvProduct["images"]>();
    for (const image of images ?? []) {
      const next = imagesMap.get(image.product_id) ?? [];
      next.push(image);
      imagesMap.set(image.product_id, next);
    }

    const csv = generateShopifyCsv(
      selectedProducts.map((product) => ({
        ...product,
        variants: variantsMap.get(product.id) ?? [],
        images: imagesMap.get(product.id) ?? []
      }))
    );

    const { error: updateError } = await supabase
      .from("vi_products")
      .update({
        status: "exported",
        updated_at: new Date().toISOString()
      })
      .in("id", selectedIds);

    if (updateError) {
      throw updateError;
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="shopify-export-${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to export CSV"
      },
      { status: 500 }
    );
  }
}
