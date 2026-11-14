import Link from "next/link";
import type { ReactNode } from "react";
import type { EventStatus } from "@/lib/events/types";
import { cx } from "@/components/ui";

export const statusMeta: Record<EventStatus, { label: string; className: string }> = {
  pending: { label: "Pending Review", className: "bg-sun text-ink" },
  draft: { label: "Draft", className: "bg-paper text-ink ring-1 ring-inset ring-ink/20" },
  published: { label: "Published", className: "bg-green text-white" },
  rejected: { label: "Rejected", className: "bg-[#fbe9e7] text-[#8c1d18] ring-1 ring-inset ring-[#8c1d18]/30" },
  archived: { label: "Archived", className: "bg-[#ecebe6] text-muted" },
};

export function StatusBadge({ status }: { status: EventStatus }) {
  const m = statusMeta[status];
  return <span className={cx("label inline-flex items-center whitespace-nowrap px-2 py-1 text-[0.6875rem]", m.className)}>{m.label}</span>;
}

const emailStyles: Record<string, string> = {
  sent: "bg-green text-white",
  pending: "bg-sun text-ink",
  sending: "bg-sky text-ink",
  failed: "bg-[#fbe9e7] text-[#8c1d18] ring-1 ring-inset ring-[#8c1d18]/30",
};
export function EmailBadge({ status }: { status: string }) {
  return <span className={cx("label inline-flex px-2 py-1 text-[0.6875rem]", emailStyles[status])}>{status}</span>;
}

export const emailKindLabel: Record<string, string> = {
  submission_confirmation: "Submission confirmation",
  admin_new_submission: "New submission alert",
  event_approved: "Approval notice",
  event_rejected: "Rejection notice",
};

export function PageHeader({ title, eyebrow, children }: { title: string; eyebrow?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-ink pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="label mb-2 text-green">{eyebrow}</p>}
        <h1 className="display text-[clamp(1.75rem,3vw,2.5rem)]">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

const btn = {
  primary: "bg-blue text-white hover:bg-navy",
  green: "bg-green text-white hover:bg-pine",
  outline: "border border-ink/30 bg-white text-ink hover:border-ink",
  danger: "border border-[#b3261e]/40 bg-white text-[#b3261e] hover:bg-[#b3261e] hover:text-white",
  ghost: "text-blue hover:text-navy underline-offset-4 hover:underline",
};
export type BtnVariant = keyof typeof btn;

export const buttonClass = (variant: BtnVariant = "primary", className?: string) =>
  cx(
    "inline-flex min-h-11 items-center justify-center gap-2 px-4 font-display text-[0.875rem] font-semibold [font-stretch:106%] transition-colors disabled:cursor-wait disabled:opacity-60",
    btn[variant],
    className,
  );

export function ButtonLink({ href, variant = "primary", children, className }: { href: string; variant?: BtnVariant; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "success" | "warning" | "error"; children: ReactNode }) {
  const border = { info: "border-sky", success: "border-green", warning: "border-sun", error: "border-[#b3261e]" }[tone];
  return <div className={cx("border-l-4 bg-white px-4 py-3 text-[0.9375rem]", border)}>{children}</div>;
}

export function Panel({ title, children, className, action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cx("border border-line bg-white", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="font-display text-[1rem] font-semibold [font-stretch:106%]">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
