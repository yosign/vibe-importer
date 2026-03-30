import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const IMPORTS_DIR = path.join(process.cwd(), "workspace", "imports");

export async function GET() {
  try {
    const entries = await fs.readdir(IMPORTS_DIR, { withFileTypes: true });
    const folders: string[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const folderPath = path.join(IMPORTS_DIR, entry.name);
      const files = await fs.readdir(folderPath);
      if (files.includes("product.json") || files.includes("info.txt")) {
        folders.push(entry.name);
      }
    }

    return NextResponse.json({
      folders: folders.sort((a, b) => a.localeCompare(b)),
      count: folders.length
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to scan imports directory"
      },
      { status: 500 }
    );
  }
}
