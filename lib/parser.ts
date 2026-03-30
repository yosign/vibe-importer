import fs from "node:fs/promises";
import path from "node:path";

export type ParsedVariant = {
  optionValue: string;
  sku: string;
  price: string;
  inventoryQty: number;
};

export type ParsedImage = {
  filename: string;
  localPath: string;
  sortOrder: number;
};

export type ParsedProduct = {
  folderName: string;
  title: string;
  vendor: string;
  type: string;
  tags: string;
  bodyHtml: string;
  optionName: string;
  variants: ParsedVariant[];
  images: ParsedImage[];
};

const IMPORTS_DIR = path.join(process.cwd(), "workspace", "imports");

function naturalImageSort(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function normalizeValue(value: string | undefined) {
  return (value ?? "").trim();
}

function splitInfoSections(content: string) {
  const lines = content.split(/\r?\n/);
  const headerMap = new Map<string, string>();
  const variantLines: string[] = [];
  const descriptionLines: string[] = [];

  let currentSection: "header" | "variants" | "description" = "header";

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      if (currentSection === "description") {
        descriptionLines.push("");
      }
      continue;
    }

    if (/^VARIANTS\s*:/i.test(line)) {
      currentSection = "variants";
      continue;
    }

    if (/^DESCRIPTION\s*:/i.test(line)) {
      currentSection = "description";
      const inlineDescription = line.replace(/^DESCRIPTION\s*:/i, "").trim();
      if (inlineDescription) {
        descriptionLines.push(inlineDescription);
      }
      continue;
    }

    if (currentSection === "header") {
      const match = line.match(/^([A-Z_]+)\s*:\s*(.*)$/i);
      if (match) {
        headerMap.set(match[1].toUpperCase(), match[2].trim());
      }
      continue;
    }

    if (currentSection === "variants") {
      variantLines.push(line);
      continue;
    }

    descriptionLines.push(line);
  }

  return {
    headerMap,
    variantLines,
    description: descriptionLines.join("\n").trim()
  };
}

function parseInfoTxt(content: string, folderName: string): Omit<ParsedProduct, "images"> {
  const { headerMap, variantLines, description } = splitInfoSections(content);
  const optionName = normalizeValue(headerMap.get("OPTION_NAME")) || "Color";
  const basePrice = normalizeValue(headerMap.get("PRICE")) || "0.00";

  const variants = variantLines
    .filter((line) => line.trim().startsWith("-"))
    .map((line) => line.replace(/^-/, "").trim())
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter((parts) => parts.length >= 4)
    .map<ParsedVariant>((parts) => ({
      optionValue: parts[0],
      sku: parts[1],
      price: parts[2] || basePrice,
      inventoryQty: Number.parseInt(parts[3], 10) || 0
    }));

  return {
    folderName,
    title: normalizeValue(headerMap.get("TITLE")) || folderName,
    vendor: normalizeValue(headerMap.get("VENDOR")),
    type: normalizeValue(headerMap.get("TYPE")),
    tags: normalizeValue(headerMap.get("TAGS")),
    bodyHtml: description ? `<p>${description.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br />")}</p>` : "",
    optionName,
    variants:
      variants.length > 0
        ? variants
        : [
            {
              optionValue: "Default",
              sku: "",
              price: basePrice,
              inventoryQty: 0
            }
          ]
  };
}

function parseProductJson(content: string, folderName: string): Omit<ParsedProduct, "images"> {
  const data = JSON.parse(content) as {
    title?: string;
    vendor?: string;
    type?: string;
    tags?: string;
    bodyHtml?: string;
    optionName?: string;
    variants?: Array<{
      optionValue?: string;
      sku?: string;
      price?: string;
      inventoryQty?: string | number;
    }>;
  };

  return {
    folderName,
    title: normalizeValue(data.title) || folderName,
    vendor: normalizeValue(data.vendor),
    type: normalizeValue(data.type),
    tags: normalizeValue(data.tags),
    bodyHtml: normalizeValue(data.bodyHtml),
    optionName: normalizeValue(data.optionName) || "Color",
    variants:
      data.variants?.map((variant) => ({
        optionValue: normalizeValue(variant.optionValue) || "Default",
        sku: normalizeValue(variant.sku),
        price: normalizeValue(String(variant.price ?? "0.00")),
        inventoryQty: Number.parseInt(String(variant.inventoryQty ?? 0), 10) || 0
      })) ?? []
  };
}

async function loadImages(folderPath: string): Promise<ParsedImage[]> {
  const imagesDir = path.join(folderPath, "images");

  try {
    const entries = await fs.readdir(imagesDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => /\.(jpg|jpeg|png|webp)$/i.test(name))
      .sort(naturalImageSort)
      .map((filename, index) => ({
        filename,
        localPath: path.join(imagesDir, filename),
        sortOrder: index + 1
      }));
  } catch {
    return [];
  }
}

export async function parseProductFolder(folderName: string): Promise<ParsedProduct> {
  const folderPath = path.join(IMPORTS_DIR, folderName);
  const productJsonPath = path.join(folderPath, "product.json");
  const infoTxtPath = path.join(folderPath, "info.txt");

  let parsed: Omit<ParsedProduct, "images"> | null = null;

  try {
    const productJson = await fs.readFile(productJsonPath, "utf8");
    parsed = parseProductJson(productJson, folderName);
  } catch {
    parsed = null;
  }

  if (!parsed) {
    try {
      const infoTxt = await fs.readFile(infoTxtPath, "utf8");
      parsed = parseInfoTxt(infoTxt, folderName);
    } catch {
      parsed = null;
    }
  }

  if (!parsed) {
    throw new Error(`Folder "${folderName}" does not contain a valid product.json or info.txt`);
  }

  const images = await loadImages(folderPath);
  return {
    ...parsed,
    variants:
      parsed.variants.length > 0
        ? parsed.variants
        : [
            {
              optionValue: "Default",
              sku: "",
              price: "0.00",
              inventoryQty: 0
            }
          ],
    images
  };
}
