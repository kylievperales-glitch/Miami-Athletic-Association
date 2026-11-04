import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Photo } from "@/content/images";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "solid" | "sun" | "outline" | "outline-light" | "white";
  external?: boolean;
  className?: string;
};

const variants = {
  solid: "bg-blue text-white hover:bg-navy",
  sun: "bg-sun text-ink hover:bg-white",
  white: "bg-white text-ink hover:bg-sun",
  outline: "border border-ink text-ink hover:bg-ink hover:text-white",
  "outline-light": "border border-white/70 text-white hover:bg-white hover:text-ink",
};

export function Button({ href, children, variant = "solid", external, className }: ButtonProps) {
  const classes = cx(
    "group/btn inline-flex min-h-13 items-center justify-center gap-3 px-6 py-3 font-display text-[0.95rem] font-semibold [font-stretch:108%] transition-colors duration-200",
    variants[variant],
    className,
  );
  const inner = (
    <>
      {children}
      <Arrow external={external} />
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {inner}
    </Link>
  );
}

export function Arrow({ external, className }: { external?: boolean; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={cx(
        "size-4 shrink-0 transition-transform duration-200 ease-out-athletic",
        external
          ? "-rotate-45 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5"
          : "group-hover/btn:translate-x-1 group-hover/card:translate-x-1",
        className,
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M1 8h13M9 3l5 5-5 5" />
    </svg>
  );
}

/** Small uppercase line above a heading. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("label", className)}>{children}</p>;
}

/** Status of an initiative. Calm by design: a dated note, not a warning. */
export function Status({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <span
      className={cx(
        "label inline-flex items-center gap-2 border px-2.5 py-1.5",
        tone === "light" ? "border-ink/25 text-ink" : "border-white/40 text-white",
      )}
    >
      <span aria-hidden="true" className={cx("size-1.5", tone === "light" ? "bg-green" : "bg-sun")} />
      {children}
    </span>
  );
}

type PhotoFrameProps = {
  photo: Photo;
  sizes: string;
  className?: string;
  priority?: boolean;
  /** Zoom gently when the parent `group/card` is hovered. */
  zoom?: boolean;
};

export function PhotoFrame({ photo, sizes, className, priority, zoom }: PhotoFrameProps) {
  return (
    <div className={cx("relative overflow-hidden bg-paper", className)}>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizes}
        priority={priority}
        style={{ objectPosition: photo.focus }}
        className={cx(
          "object-cover",
          zoom && "transition-transform duration-700 ease-out-athletic group-hover/card:scale-[1.04]",
        )}
      />
    </div>
  );
}

export function Caption({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("mt-2.5 text-[0.8125rem] leading-snug", className)}>{children}</p>;
}

/** Interior page heading on a light ground. */
export function SectionHead({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("reveal max-w-4xl", className)}>
      {eyebrow && <Eyebrow className="mb-5 text-green">{eyebrow}</Eyebrow>}
      <h2 className="display display-lg">{title}</h2>
      {children && <div className="lead mt-6 max-w-2xl text-muted">{children}</div>}
    </div>
  );
}

export { cx };
