"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

export type EditableImage = {
  id: string;
  filename: string;
  local_path: string;
  sort_order: number;
  processed?: boolean;
};

export function ImageEditor({
  images,
  onChange
}: {
  images: EditableImage[];
  onChange: (images: EditableImage[]) => void;
}) {
  const [previewImage, setPreviewImage] = useState<EditableImage | null>(null);
  const orderedImages = useMemo(
    () => [...images].sort((a, b) => a.sort_order - b.sort_order),
    [images]
  );

  function moveImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= orderedImages.length) {
      return;
    }

    const next = [...orderedImages];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onChange(
      next.map((image, idx) => ({
        ...image,
        sort_order: idx + 1
      }))
    );
  }

  async function optimizeImage(image: EditableImage) {
    try {
      const response = await fetch("/api/images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          imagePath: image.local_path,
          width: 1200,
          format: "webp",
          saveToFile: true
        })
      });

      if (!response.ok) {
        throw new Error("Image processing failed");
      }

      const data = (await response.json()) as { outputPath?: string | null };
      window.alert(data.outputPath ? `Processed image saved to ${data.outputPath}` : "Image processed");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Image processing failed");
    }
  }

  return (
    <div className="space-y-3">
      {orderedImages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-700 p-6 text-[13px] text-zinc-500">
          No images found in this product folder.
        </div>
      ) : null}

      {orderedImages.map((image, index) => (
        <div
          key={image.id}
          className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"
        >
          {/* Image preview */}
          <button
            type="button"
            onClick={() => setPreviewImage(image)}
            className="mb-3 block w-full overflow-hidden rounded-lg"
          >
            <img
              src={`/api/images?imagePath=${encodeURIComponent(image.local_path)}`}
              alt={image.filename}
              className="max-h-48 w-full rounded-lg object-cover"
            />
          </button>

          {/* Controls row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => moveImage(index, -1)}
                  className="h-7 w-7 border border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => moveImage(index, 1)}
                  className="h-7 w-7 border border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
              <span className="mono truncate text-[12px] text-zinc-400">{image.filename}</span>
              {image.processed && (
                <span className="flex-shrink-0 mono rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-400">
                  processed
                </span>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => optimizeImage(image)}
              className="flex-shrink-0 border-emerald-700 bg-transparent text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
            >
              <WandSparkles className="mr-1.5 h-3 w-3" />
              Process
            </Button>
          </div>
        </div>
      ))}

      <Dialog open={Boolean(previewImage)} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Image Preview</DialogTitle>
            <DialogDescription className="text-zinc-400">{previewImage?.filename}</DialogDescription>
          </DialogHeader>
          {previewImage ? (
            <img
              src={`/api/images?imagePath=${encodeURIComponent(previewImage.local_path)}`}
              alt={previewImage.filename}
              className="max-h-[60vh] w-full rounded-lg object-contain"
            />
          ) : null}
          <div className="mono break-all rounded-lg bg-zinc-950 p-3 text-xs text-zinc-400">
            {previewImage?.local_path}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewImage(null)}
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
