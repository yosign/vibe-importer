import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    const [{ data: products, error: productsError }, { data: variants, error: variantsError }, { data: images, error: imagesError }] =
      await Promise.all([
        supabase
          .from("vi_products")
          .select("id, folder_name, title, vendor, type, tags, body_html, option_name, status, created_at, updated_at")
          .order("created_at", { ascending: false }),
        supabase.from("vi_variants").select("id, product_id"),
        supabase.from("vi_images").select("id, product_id, local_path, sort_order").order("sort_order", { ascending: true })
      ]);

    if (productsError || variantsError || imagesError) {
      throw productsError ?? variantsError ?? imagesError;
    }

    const variantCountMap = new Map<string, number>();
    for (const variant of variants ?? []) {
      variantCountMap.set(variant.product_id, (variantCountMap.get(variant.product_id) ?? 0) + 1);
    }

    const imagesMap = new Map<string, Array<{ local_path: string; sort_order: number }>>();
    for (const image of images ?? []) {
      const next = imagesMap.get(image.product_id) ?? [];
      next.push({
        local_path: image.local_path,
        sort_order: image.sort_order ?? 0
      });
      imagesMap.set(image.product_id, next);
    }

    const result = (products ?? []).map((product) => {
      const productImages = imagesMap.get(product.id) ?? [];
      return {
        ...product,
        variantCount: variantCountMap.get(product.id) ?? 0,
        imageCount: productImages.length,
        firstImage: productImages[0]?.local_path ?? null
      };
    });

    return NextResponse.json({ products: result });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch products"
      },
      { status: 500 }
    );
  }
}
