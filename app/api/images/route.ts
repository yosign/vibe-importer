import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { processImage } from "@/lib/imageProcessor";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imagePath = searchParams.get("imagePath");

    if (!imagePath) {
      return NextResponse.json({ error: "imagePath is required" }, { status: 400 });
    }

    const absolutePath = path.isAbsolute(imagePath) ? imagePath : path.join(process.cwd(), imagePath);
    const buffer = await fs.readFile(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const mimeType =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load image"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      imagePath?: string;
      width?: number;
      height?: number;
      format?: "webp" | "jpg";
      saveToFile?: boolean;
    };

    if (!body.imagePath) {
      return NextResponse.json({ error: "imagePath is required" }, { status: 400 });
    }

    const result = await processImage({
      imagePath: body.imagePath,
      width: body.width,
      height: body.height,
      format: body.format,
      saveToFile: body.saveToFile ?? true
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process image"
      },
      { status: 500 }
    );
  }
}
