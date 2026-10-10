"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Shows an image from /public (e.g. a logo exported from your Figma file).
 * If the file doesn't exist yet, it renders `fallback` instead so the page
 * never shows a broken-image icon.
 */
export default function BrandImage({
  src,
  alt,
  fallback,
  className,
  style,
}: {
  src: string;
  alt: string;
  fallback?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // The image can fail before React hydrates, in which case onError never fires.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) return <>{fallback ?? null}</>;
  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={className}
      style={style}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
