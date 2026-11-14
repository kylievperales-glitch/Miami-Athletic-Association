import Image from "next/image";
import { org } from "@/content/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <Image src="/images/brand/maa-logo-white.png" alt="" width={600} height={529} className="h-12 w-auto" unoptimized priority />
          <span className="label max-w-[11rem] text-[0.6875rem] leading-tight">{org.name}</span>
        </div>
        <div className="border border-line border-t-4 border-t-blue bg-white p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
