"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** The public header and footer are not shown inside the private dashboard. */
export function HideOnAdmin({ children }: { children: ReactNode }) {
  const path = usePathname();
  return path === "/admin" || path.startsWith("/admin/") ? null : <>{children}</>;
}
