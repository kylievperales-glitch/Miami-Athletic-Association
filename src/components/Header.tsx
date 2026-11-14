"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { nav, org, socials } from "@/content/site";
import { cx } from "@/components/ui";

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label={`${org.name} home`}>
      <Image
        src="/images/brand/maa-logo-white.png"
        alt=""
        width={600}
        height={529}
        className="h-12 w-auto sm:h-14"
        unoptimized
        priority
      />
      <span className="label max-w-[9.5rem] text-[0.625rem] leading-tight text-ink sm:max-w-[11rem] sm:text-[0.6875rem]">{org.name}</span>
    </Link>
  );
}

export function Header() {
  const path = usePathname();
  const menu = useRef<HTMLDialogElement>(null);

  const open = () => {
    menu.current?.showModal();
    document.documentElement.style.overflow = "hidden";
  };
  const close = () => menu.current?.close();
  const onClosed = () => {
    document.documentElement.style.overflow = "";
  };

  const main = nav.filter((item) => item.href !== "/get-involved");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="wrap flex h-[4.75rem] items-center justify-between gap-6">
        <Brand />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {main.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(path, item.href) ? "page" : undefined}
              className={cx(
                "relative px-2.5 py-2 font-display xl:px-3.5 text-[0.9rem] font-medium [font-stretch:106%] transition-colors hover:text-blue",
                "after:absolute after:inset-x-2.5 xl:after:inset-x-3.5 after:bottom-0.5 after:h-0.5 after:origin-left after:bg-green after:transition-transform after:duration-300",
                isActive(path, item.href) ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100",
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/get-involved"
            aria-current={isActive(path, "/get-involved") ? "page" : undefined}
            className="ml-2 inline-flex min-h-11 xl:ml-3 items-center bg-blue px-5 font-display text-[0.9rem] font-semibold text-white transition-colors [font-stretch:106%] hover:bg-navy"
          >
            Get Involved
          </Link>
        </nav>

        <button
          type="button"
          onClick={open}
          aria-haspopup="dialog"
          className="label flex min-h-11 items-center gap-3 px-1 lg:hidden"
        >
          Menu
          <span aria-hidden="true" className="flex w-6 flex-col gap-1.5">
            <span className="h-0.5 bg-ink" />
            <span className="h-0.5 bg-ink" />
          </span>
        </button>
      </div>

      <dialog ref={menu} className="menu on-dark lg:hidden" aria-label="Site menu" onClose={onClosed}>
        <div className="flex h-full flex-col">
          <div className="wrap flex h-[4.75rem] shrink-0 items-center justify-between">
            <span className="label">{org.name}</span>
            <button type="button" onClick={close} className="label flex min-h-11 items-center px-1" autoFocus>
              Close
            </button>
          </div>
          <nav aria-label="Mobile" className="wrap flex-1 overflow-y-auto pt-6">
            <ul>
              {nav.map((item) => (
                <li key={item.href} className="border-t border-white/20">
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={isActive(path, item.href) ? "page" : undefined}
                    className={cx(
                      "display flex min-h-16 items-center py-4 text-[1.75rem] sm:text-4xl",
                      isActive(path, item.href) && "text-sun",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="wrap shrink-0 space-y-2 pb-8 pt-6 text-[0.95rem]">
            <a href={`mailto:${org.email}`} className="block break-all underline underline-offset-4">
              {org.email}
            </a>
            <ul className="flex gap-5">
              {socials.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </dialog>
    </header>
  );
}
