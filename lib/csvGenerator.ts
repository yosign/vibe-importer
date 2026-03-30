type CsvVariant = {
  option_value: string | null;
  sku: string | null;
  price: number | string | null;
  inventory_qty: number | null;
};

type CsvImage = {
  local_path: string | null;
  sort_order: number | null;
};

export type CsvProduct = {
  id: string;
  title: string;
  vendor: string | null;
  type: string | null;
  tags: string | null;
  body_html: string | null;
  option_name: string | null;
  variants: CsvVariant[];
  images: CsvImage[];
};

const SHOPIFY_HEADERS = [
  "Handle",
  "Title",
  "Body (HTML)",
  "Vendor",
  "Type",
  "Tags",
  "Published",
  "Option1 Name",
  "Option1 Value",
  "Variant SKU",
  "Variant Price",
  "Variant Inventory Qty",
  "Image Src",
  "Image Position"
];

function escapeCsvValue(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function createHandle(title: string) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function generateShopifyCsv(products: CsvProduct[]) {
  const lines: string[] = [SHOPIFY_HEADERS.join(",")];

  for (const product of products) {
    const handle = createHandle(product.title);
    const variants = product.variants.length > 0 ? product.variants : [{ option_value: "Default", sku: "", price: "0.00", inventory_qty: 0 }];
    const images = [...product.images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    variants.forEach((variant, index) => {
      const isFirstVariant = index === 0;
      lines.push(
        [
          handle,
          isFirstVariant ? product.title : "",
          isFirstVariant ? product.body_html ?? "" : "",
          isFirstVariant ? product.vendor ?? "" : "",
          isFirstVariant ? product.type ?? "" : "",
          isFirstVariant ? product.tags ?? "" : "",
          isFirstVariant ? "TRUE" : "",
          isFirstVariant ? product.option_name ?? "Color" : "",
          variant.option_value ?? "",
          variant.sku ?? "",
          variant.price == null ? "" : String(variant.price),
          variant.inventory_qty == null ? "" : String(variant.inventory_qty),
          "",
          ""
        ].map(escapeCsvValue).join(",")
      );
    });

    images.forEach((image) => {
      lines.push(
        [
          handle,
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          image.local_path ?? "",
          image.sort_order == null ? "" : String(image.sort_order)
        ].map(escapeCsvValue).join(",")
      );
    });
  }

  return `\uFEFF${lines.join("\r\n")}`;
}
