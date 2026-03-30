import { NextResponse } from "next/server";
import { parseProductFolder } from "@/lib/parser";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { folderName } = (await request.json()) as { folderName?: string };
    if (!folderName) {
      return NextResponse.json({ error: "folderName is required" }, { status: 400 });
    }

    const parsed = await parseProductFolder(folderName);
    const supabase = getSupabaseServerClient();

    const { data: existing } = await supabase
      .from("vi_products")
      .select("id")
      .eq("folder_name", folderName);

    if (existing && existing.length > 0) {
      const existingIds = existing.map((item) => item.id);
      await supabase.from("vi_products").delete().in("id", existingIds);
    }

    const { data: product, error: productError } = await supabase
      .from("vi_products")
      .insert({
        folder_name: parsed.folderName,
        title: parsed.title,
        vendor: parsed.vendor,
        type: parsed.type,
        tags: parsed.tags,
        body_html: parsed.bodyHtml,
        option_name: parsed.optionName,
        status: "pending"
      })
      .select("id")
      .single();

    if (productError || !product) {
      throw productError ?? new Error("Failed to create product");
    }

    const { error: variantsError } = await supabase.from("vi_variants").insert(
      parsed.variants.map((variant) => ({
        product_id: product.id,
        option_value: variant.optionValue,
        sku: variant.sku,
        price: variant.price,
        inventory_qty: variant.inventoryQty
      }))
    );

    if (variantsError) {
      throw variantsError;
    }

    if (parsed.images.length > 0) {
      const { error: imagesError } = await supabase.from("vi_images").insert(
        parsed.images.map((image) => ({
          product_id: product.id,
          filename: image.filename,
          local_path: image.localPath,
          sort_order: image.sortOrder,
          processed: false
        }))
      );

      if (imagesError) {
        throw imagesError;
      }
    }

    return NextResponse.json({
      id: product.id,
      productId: product.id
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to parse product folder"
      },
      { status: 500 }
    );
  }
}
