import Link from "next/link";
import { Newsletter } from "@/components/Forms";
import { GeneralInquiry } from "@/components/GeneralInquiry";
import { Arrow, Caption, Eyebrow, PhotoFrame } from "@/components/ui";
import { photos } from "@/content/images";
import { org, socials } from "@/content/site";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta(
  "Get Involved",
  "Stay connected with Miami Athletic Association, take part in future experiences, volunteer, or start a conversation about working together.",
  "/get-involved",
);

const inquiryLink = (type: string) => `/get-involved?type=${encodeURIComponent(type)}#inquiry`;

const pathways = [
  {
    title: "Attend & Participate",
    text: "Follow MAA's initiatives and discover opportunities to take part in future experiences.",
    cta: "Explore Events",
    href: "/events",
  },
  {
    title: "Partner or Sponsor",
    text: "Explore ways your organization can collaborate with MAA on events, experiences, and new initiatives.",
    cta: "Explore Partnerships",
    href: "/partners",
  },
  {
    title: "Volunteer",
    text: "Interested in supporting future events and community experiences? Let us know how you'd like to contribute.",
    cta: "Express Interest",
    href: inquiryLink("Volunteer Interest"),
  },
  {
    title: "Leadership & Advisory Interest",
    text: "MAA welcomes conversations with individuals interested in contributing their experience, perspective, and expertise to the organization's continued development.",
    cta: "Start a Conversation",
    href: inquiryLink("Leadership or Advisory Interest"),
  },
];

export default function GetInvolved() {
  return (
    <>
      {/* Hero */}
      <section className="bg-white">
        <div className="wrap pb-10 pt-14 lg:pb-14 lg:pt-20">
          <Eyebrow className="enter mb-6 text-green">Get Involved</Eyebrow>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <h1 className="display display-xl enter enter-2 lg:col-span-8">Find Your Place in Miami&apos;s Athletic Community.</h1>
            <p className="enter enter-3 text-muted lg:col-span-4">
              Whether you&apos;re interested in upcoming experiences, professional connections, partnerships, or contributing
              your time and expertise, there are ways to stay connected with Miami Athletic Association.
            </p>
          </div>
        </div>
        <PhotoFrame photo={photos.groupCrosswalk} priority sizes="100vw" className="enter enter-3 h-[56vw] max-h-[42rem] min-h-[16rem] w-full" />
      </section>

      {/* Stay connected */}
      <section id="stay-connected" className="on-dark bg-blue text-white">
        <div className="wrap grid gap-10 py-16 lg:grid-cols-12 lg:items-end lg:py-24">
          <div className="reveal lg:col-span-6">
            <h2 className="display display-lg">Stay Connected With MAA.</h2>
            <p className="lead mt-5 max-w-lg">Be among the first to hear about upcoming initiatives, events, and opportunities to connect.</p>
          </div>
          <div className="reveal lg:col-span-5 lg:col-start-8">
            <Newsletter tone="dark" />
          </div>
        </div>
      </section>

      {/* Pathways */}
      <section className="section-y bg-white">
        <div className="wrap">
          <h2 className="display display-lg reveal">Ways to Get Involved</h2>
          <ul className="mt-12 grid gap-px bg-ink/15 md:grid-cols-2">
            {pathways.map((p) => (
              <li key={p.title} className="reveal bg-white">
                <Link href={p.href} className="group/card flex h-full flex-col justify-between gap-10 p-6 transition-colors hover:bg-paper md:p-9 lg:min-h-[22rem] lg:p-12">
                  <div>
                    <h3 className="display display-md">{p.title}</h3>
                    <p className="mt-4 max-w-md text-muted">{p.text}</p>
                  </div>
                  <span className="inline-flex items-center gap-3 font-display font-semibold text-blue [font-stretch:108%]">
                    {p.cta}
                    <Arrow />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* General inquiry */}
      <section id="inquiry" className="section-y bg-paper">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <div className="reveal self-start lg:col-span-5">
            <h2 className="display display-lg">Let&apos;s Connect.</h2>
            <p className="lead mt-6 text-muted">Have a question, an idea, or an interest in getting involved? We&apos;d like to hear from you.</p>
            <div className="mt-10 hidden lg:block">
              <PhotoFrame photo={photos.groupOverhead} sizes="35vw" className="aspect-[5/4]" />
              <Caption className="text-muted">Participants at a previous American X History Tour.</Caption>
            </div>
          </div>
          <div className="reveal lg:col-span-6 lg:col-start-7">
            <GeneralInquiry />
          </div>
        </div>
      </section>

      {/* Direct contact and socials */}
      <section className="bg-white py-16 lg:py-24">
        <div className="wrap">
          <div className="reveal">
            <h2 className="display display-md">Prefer Email?</h2>
            <p className="mt-3 text-muted">Reach Miami Athletic Association directly at:</p>
            <a
              href={`mailto:${org.email}`}
              className="display mt-4 block break-all text-[clamp(1.25rem,3.6vw,3.25rem)] leading-tight text-blue underline decoration-sun decoration-[3px] underline-offset-[0.18em] transition-colors hover:text-green"
            >
              {org.email}
            </a>
          </div>
          <div className="reveal mt-14 flex flex-col gap-4 border-t border-ink pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">Follow MAA between updates.</p>
            <ul className="flex flex-wrap gap-x-7 gap-y-2">
              {socials.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="group/btn inline-flex min-h-11 items-center gap-2 font-display font-semibold hover:text-blue">
                    {s.label}
                    <Arrow external />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
