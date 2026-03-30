"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Toast({
  title,
  description,
  variant = "default"
}: {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 shadow-sm",
        variant === "destructive" ? "border-destructive/30 bg-destructive/5" : "border-border bg-background"
      )}
    >
      <p className="font-medium">{title}</p>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
