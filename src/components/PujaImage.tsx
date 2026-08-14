import SacredArt from "./SacredArt";
import { cn, optimizedImage } from "@/lib/utils";

/**
 * Photo ho to photo dikhao, warna SVG artwork.
 * Cloudinary photos apne aap optimise hoti hain (f_auto,q_auto).
 */
export default function PujaImage({
  imageUrl,
  artKey,
  alt,
  className,
  rounded = "rounded-t-2xl",
  width = 800,
  priority = false,
}: {
  imageUrl?: string | null;
  artKey?: string;
  alt: string;
  className?: string;
  rounded?: string;
  width?: number;
  priority?: boolean;
}) {
  const src = optimizedImage(imageUrl, width);

  if (!src) {
    return <SacredArt artKey={artKey} className={className} rounded={rounded} />;
  }

  return (
    <div className={cn("relative overflow-hidden bg-saffron-100", rounded, className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
      />
    </div>
  );
}
