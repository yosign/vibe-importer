import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export type ImageProcessOptions = {
  imagePath: string;
  width?: number;
  height?: number;
  format?: "webp" | "jpg";
  saveToFile?: boolean;
};

export async function processImage({
  imagePath,
  width,
  height,
  format = "webp",
  saveToFile = false
}: ImageProcessOptions) {
  const absolutePath = path.isAbsolute(imagePath) ? imagePath : path.join(process.cwd(), imagePath);
  const extension = format === "jpg" ? "jpg" : "webp";
  const outputDir = path.join(process.cwd(), "exports", "images");
  const outputPath = path.join(
    outputDir,
    `${path.basename(absolutePath, path.extname(absolutePath))}-${width ?? "auto"}x${height ?? "auto"}.${extension}`
  );

  let pipeline = sharp(absolutePath).rotate();
  if (width || height) {
    pipeline = pipeline.resize(width, height, {
      fit: "cover",
      withoutEnlargement: true
    });
  }

  pipeline = format === "jpg" ? pipeline.jpeg({ quality: 82 }) : pipeline.webp({ quality: 82 });

  const buffer = await pipeline.toBuffer();

  if (saveToFile) {
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, buffer);
  }

  return {
    base64: buffer.toString("base64"),
    mimeType: format === "jpg" ? "image/jpeg" : "image/webp",
    outputPath: saveToFile ? outputPath : null
  };
}
