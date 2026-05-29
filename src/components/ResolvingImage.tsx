import React, { useState, useEffect } from "react";
import { getLocalFile } from "../lib/indexedDB";

interface ResolvingImageProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  [anyOtherProp: string]: any;
}

export default function ResolvingImage({ src, ...props }: ResolvingImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string>("");

  useEffect(() => {
    let objectUrl = "";
    if (!src) {
      setResolvedSrc("");
      return;
    }

    const isLocal = src.startsWith("local-") || src.startsWith("slide-") || src.startsWith("leftBg-");

    if (isLocal) {
      let isCancelled = false;
      
      getLocalFile(src).then((blob) => {
        if (blob && !isCancelled) {
          objectUrl = URL.createObjectURL(blob);
          setResolvedSrc(objectUrl);
        } else if (!isCancelled) {
          // Fallback just in case
          setResolvedSrc(src);
        }
      }).catch((err) => {
        console.error("Failed to load local image from IndexedDB:", err);
        if (!isCancelled) {
          setResolvedSrc(src);
        }
      });

      return () => {
        isCancelled = true;
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      };
    } else {
      setResolvedSrc(src);
    }
  }, [src]);

  if (!resolvedSrc) {
    return <div className="w-full h-full bg-slate-900/10 animate-pulse rounded-lg" />;
  }

  return <img src={resolvedSrc} {...props} />;
}
