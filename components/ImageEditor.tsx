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
    <div className="space-y-4">
      {orderedImages.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
          No images found in this product folder.
        </div>
      ) : null}
      {orderedImages.map((image, index) => (
        <div
          key={image.id}
          className="flex items-center justify-between rounded-2xl border bg-white/80 p-4"
        >
          <div className="flex items-center gap-3">
            <img
              src={`/api/images?imagePath=${encodeURIComponent(image.local_path)}`}
              alt={image.filename}
              className="h-14 w-14 rounded-xl object-cover"
            />
            <div>
              <p className="font-medium">{image.filename}</p>
              <button
                type="button"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => setPreviewImage(image)}
              >
                Preview path
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" onClick={() => moveImage(index, -1)}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={() => moveImage(index, 1)}>
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button type="button" variant="secondary" onClick={() => optimizeImage(image)}>
              <WandSparkles className="mr-2 h-4 w-4" />
              Process
            </Button>
          </div>
        </div>
      ))}

      <Dialog open={Boolean(previewImage)} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>{previewImage?.filename}</DialogDescription>
          </DialogHeader>
          {previewImage ? (
            <img
              src={`/api/images?imagePath=${encodeURIComponent(previewImage.local_path)}`}
              alt={previewImage.filename}
              className="max-h-[60vh] w-full rounded-xl object-contain"
            />
          ) : null}
          <div className="break-all rounded-xl bg-muted p-4 text-sm">{previewImage?.local_path}</div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPreviewImage(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
