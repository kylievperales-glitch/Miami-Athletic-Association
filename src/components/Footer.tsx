import Image from "next/image";
import Link from "next/link";
import { nav, org, socials } from "@/content/site";

export function Footer() {
  return (
    <footer className="on-dark bg-navy text-white">
      <div className="wrap pb-8 pt-16 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="flex items-center gap-5">
              <span className="inline-flex shrink-0 bg-white p-1.5">
                <Image src="/images/brand/maa-logo-white.png" alt="" width={600} height={529} className="h-16 w-auto" unoptimized />
              </span>
              <p className="display display-sm max-w-[14ch]">{org.name}</p>
            </div>
            <p className="mt-7 max-w-md text-white/85">{org.mission}</p>
          </div>

          <nav aria-label="Footer" className="lg:col-span-3">
            <h2 className="label mb-4 text-sky">Navigate</h2>
            <ul className="space-y-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="inline-block py-1 underline-offset-4 hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <h2 className="label mb-4 text-sky">Contact</h2>
            <a href={`mailto:${org.email}`} className="block break-all py-1 underline underline-offset-4 hover:text-sun">
              {org.email}
            </a>
            <p className="mt-1 text-white/85">{org.location}</p>
            <h2 className="label mb-3 mt-8 text-sky">Follow</h2>
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {socials.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block py-1 underline-offset-4 hover:underline"
                  >
                    {s.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-white/20 pt-6 text-[0.8125rem] text-white/75 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {org.name}. All rights reserved.
          </p>
          <p>American X History Tour photographs are MAA&apos;s own. Other imagery is illustrative.</p>
        </div>
      </div>
    </footer>
  );
}
