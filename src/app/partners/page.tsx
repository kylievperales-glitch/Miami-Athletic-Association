import Image from "next/image";
import { InquiryForm } from "@/components/Forms";
import { Button, Eyebrow, PhotoFrame } from "@/components/ui";
import { partnershipForm } from "@/content/forms";
import { photos } from "@/content/images";
import { benefits, collaboratorTypes, verifiedCollaborators } from "@/content/partners";
import { org } from "@/content/site";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta(
  "Partners",
  "Miami Athletic Association welcomes conversations about partnerships that can help bring new experiences and opportunities to Miami.",
  "/partners",
);

export default function Partners() {
  return (
    <>
      {/* Hero */}
      <section className="on-dark bg-green text-white">
        <div className="grid lg:grid-cols-12">
          <div className="flex flex-col justify-center px-[clamp(1.25rem,4vw,3.5rem)] py-14 lg:col-span-7 lg:py-24">
            <Eyebrow className="enter text-white">Partnerships &amp; Collaboration</Eyebrow>
            <h1 className="display enter enter-2 mt-6 text-[clamp(2.3rem,4.7vw,5rem)]">Building Connections. Creating Opportunities.</h1>
            <p className="lead enter enter-3 mt-8 max-w-2xl">
              Miami Athletic Association works to connect organizations across sports, fitness, hospitality, and related
              industries. We welcome conversations about partnerships that can help bring new experiences and
              opportunities to Miami.
            </p>
            <div className="enter enter-3 mt-9">
              <Button href="#inquiry" variant="sun">
                Start a Conversation
              </Button>
            </div>
          </div>
          <div className="lg:col-span-5">
            <PhotoFrame photo={photos.hotelTerrace} priority sizes="(min-width: 1024px) 42vw, 100vw" className="aspect-[16/10] h-full w-full lg:aspect-auto" />
          </div>
        </div>
      </section>

      {/* Why partner */}
      <section className="section-y bg-white">
        <div className="wrap">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="reveal lg:col-span-7">
              <Eyebrow className="mb-5 text-green">Why Partner With MAA?</Eyebrow>
              <h2 className="display display-lg">Collaboration Starts With Shared Goals.</h2>
            </div>
            <p className="lead reveal text-muted lg:col-span-4 lg:col-start-9">
              From community experiences to developing sports tourism initiatives, MAA is interested in relationships that
              connect people, support events, and create opportunities for participating organizations.
            </p>
          </div>
          <ol className="mt-14 grid gap-px bg-line md:grid-cols-3">
            {benefits.map((b, i) => (
              <li key={b.title} className="reveal bg-white pb-2 pt-6 md:px-8 md:first:pl-0 md:last:pr-0">
                <span className="display text-5xl text-blue lg:text-6xl">{i + 1}</span>
                <h3 className="display display-sm mt-8">{b.title}</h3>
                <p className="mt-3 text-muted">{b.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Who we collaborate with */}
      <section className="section-y bg-navy text-white on-dark">
        <div className="wrap">
          <h2 className="display display-lg reveal max-w-3xl">Who We Collaborate With</h2>
          <ul className="mt-12">
            {collaboratorTypes.map((c) => (
              <li key={c.title} className="reveal grid gap-3 border-t border-white/25 py-7 transition-colors last:border-b hover:bg-white/5 lg:grid-cols-12 lg:items-baseline lg:py-9">
                <h3 className="display display-md lg:col-span-7">{c.title}</h3>
                <p className="text-white/85 lg:col-span-4 lg:col-start-9">{c.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Verified collaborators */}
      <section className="bg-paper py-14 lg:py-20">
        <div className="wrap grid gap-6 lg:grid-cols-12 lg:items-center">
          <h2 className="display display-md reveal lg:col-span-5">Organizations We&apos;ve Connected With</h2>
          {verifiedCollaborators.length > 0 ? (
            <ul className="reveal flex flex-wrap items-center gap-8 lg:col-span-6 lg:col-start-7">
              {verifiedCollaborators.map((c) => (
                <li key={c.name}>
                  <Image src={c.logo} alt={c.name} width={160} height={80} className="h-16 w-auto object-contain" />
                  <p className="mt-2 text-[0.8125rem] text-muted">{c.relationship}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="reveal text-muted lg:col-span-6 lg:col-start-7">
              Collaborating organizations will be recognized here as acknowledgements are confirmed.
            </p>
          )}
        </div>
      </section>

      {/* Inquiry */}
      <section id="inquiry" className="section-y bg-white">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <div className="reveal self-start lg:sticky lg:top-32 lg:col-span-5">
            <h2 className="display text-[clamp(2.25rem,3.4vw,3.6rem)]">Let&apos;s Explore a Collaboration.</h2>
            <p className="lead mt-6 text-muted">Tell us a little about your organization and what you have in mind.</p>
            <p className="mt-8 text-[0.9375rem] text-muted">
              Prefer to write directly?{" "}
              <a href={`mailto:${org.email}`} className="break-all font-semibold text-blue underline underline-offset-4">
                {org.email}
              </a>
            </p>
          </div>
          <div className="reveal lg:col-span-6 lg:col-start-7">
            <InquiryForm config={partnershipForm} />
          </div>
        </div>
      </section>
    </>
  );
}
