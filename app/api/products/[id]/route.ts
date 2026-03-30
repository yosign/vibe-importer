import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const supabase = getSupabaseServerClient();
    const { id } = params;

    const [{ data: product, error: productError }, { data: variants, error: variantsError }, { data: images, error: imagesError }] =
      await Promise.all([
        supabase
          .from("vi_products")
          .select("id, folder_name, title, vendor, type, tags, body_html, option_name, status, created_at, updated_at")
          .eq("id", id)
          .single(),
        supabase
          .from("vi_variants")
          .select("id, option_value, sku, price, inventory_qty")
          .eq("product_id", id)
          .order("id", { ascending: true }),
        supabase
          .from("vi_images")
          .select("id, filename, local_path, sort_order, processed")
          .eq("product_id", id)
          .order("sort_order", { ascending: true })
      ]);

    if (productError || variantsError || imagesError) {
      throw productError ?? variantsError ?? imagesError;
    }

    return NextResponse.json({
      product: {
        ...product,
        variants,
        images
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch product"
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = (await request.json()) as {
      title?: string;
      vendor?: string;
      type?: string;
      tags?: string;
      body_html?: string;
      option_name?: string;
      status?: "pending" | "ready" | "exported";
      variants?: Array<{
        id?: string;
        option_value?: string;
        sku?: string;
        price?: string | number;
        inventory_qty?: number;
      }>;
      images?: Array<{
        id: string;
        sort_order: number;
      }>;
    };

    const supabase = getSupabaseServerClient();

    const updates = {
      title: body.title,
      vendor: body.vendor,
      type: body.type,
      tags: body.tags,
      body_html: body.body_html,
      option_name: body.option_name,
      status: body.status,
      updated_at: new Date().toISOString()
    };

    const { error: productError } = await supabase.from("vi_products").update(updates).eq("id", id);
    if (productError) {
      throw productError;
    }

    if (Array.isArray(body.variants)) {
      const { error: deleteVariantsError } = await supabase.from("vi_variants").delete().eq("product_id", id);
      if (deleteVariantsError) {
        throw deleteVariantsError;
      }

      if (body.variants.length > 0) {
        const { error: insertVariantsError } = await supabase.from("vi_variants").insert(
          body.variants.map((variant) => ({
            product_id: id,
            option_value: variant.option_value ?? "Default",
            sku: variant.sku ?? "",
            price: variant.price ?? 0,
            inventory_qty: variant.inventory_qty ?? 0
          }))
        );

        if (insertVariantsError) {
          throw insertVariantsError;
        }
      }
    }

    if (Array.isArray(body.images)) {
      for (const image of body.images) {
        const { error: imageError } = await supabase
          .from("vi_images")
          .update({ sort_order: image.sort_order })
          .eq("id", image.id)
          .eq("product_id", id);

        if (imageError) {
          throw imageError;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update product"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const supabase = getSupabaseServerClient();
    const { id } = params;

    const { error } = await supabase.from("vi_products").delete().eq("id", id);
    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete product"
      },
      { status: 500 }
    );
  }
}
