import Image from "next/image";
import { categoryById } from "@/content/calendar";
import { publicImageUrl } from "@/lib/supabase/config";
import { cx } from "@/components/ui";

/**
 * An event's image, or a branded category panel when none was provided.
 * The fallback is graphic only, never a photo, so it can't be mistaken for the event itself.
 */
export function EventVisual({
  category,
  imagePath,
  sizes,
  className,
  priority,
  size = "md",
}: {
  category: string;
  imagePath: string | null;
  sizes: string;
  className?: string;
  priority?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const url = publicImageUrl(imagePath);
  const cat = categoryById(category);
  if (url) {
    return (
      <div className={cx("relative overflow-hidden bg-paper", className)}>
        <Image src={url} alt="" fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className={cx("relative isolate flex overflow-hidden", className)}
      style={{ background: cat.color, color: cat.ink }}
    >
      <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 -z-10 h-full w-full opacity-[0.16]">
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={-60 + i * 26} y1="130" x2={20 + i * 26} y2="-10" stroke="currentColor" strokeWidth="7" />
        ))}
      </svg>
      <div className={cx("mt-auto flex w-full items-end justify-between gap-3", size === "sm" ? "p-3" : "p-5")}>
        <span className={cx("display leading-none", size === "lg" ? "text-[clamp(1.5rem,3vw,2.4rem)]" : size === "sm" ? "text-base" : "text-xl")}>
          {cat.short}
        </span>
        <span className="label opacity-80">MAA Calendar</span>
      </div>
    </div>
  );
}

export function CategoryTag({ category, className }: { category: string; className?: string }) {
  const cat = categoryById(category);
  return (
    <span className={cx("label inline-flex items-center gap-2 text-muted", className)}>
      <span aria-hidden="true" className="size-2.5 shrink-0 ring-1 ring-ink/10" style={{ background: cat.color }} />
      {cat.label}
    </span>
  );
}
