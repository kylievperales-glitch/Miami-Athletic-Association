import Image from "next/image";
import { Button, Caption, Eyebrow, PhotoFrame } from "@/components/ui";
import { photos } from "@/content/images";
import { leader } from "@/content/site";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta(
  "About",
  "Miami Athletic Association connects people and organizations through athletic experiences, professional relationships, and initiatives that support Miami's sports and fitness community.",
  "/about",
);

const approach = [
  { title: "Connect", text: "Bring together people and organizations across sports, fitness, hospitality, and related industries." },
  { title: "Collaborate", text: "Encourage partnerships that make new experiences and initiatives possible." },
  { title: "Activate", text: "Develop and promote opportunities for people to participate in sports, fitness, and community events." },
  { title: "Promote", text: "Highlight Miami's potential as a destination for sporting experiences and athletic communities." },
];

export default function About() {
  return (
    <>
      {/* Hero */}
      <section className="bg-white">
        <div className="wrap grid gap-10 pb-12 pt-14 lg:grid-cols-12 lg:gap-8 lg:pb-0 lg:pt-20">
          <div className="lg:col-span-7 lg:pb-24">
            <Eyebrow className="enter mb-6 text-green">About Miami Athletic Association</Eyebrow>
            <h1 className="display display-xl enter enter-2">Bringing Miami Together Through Sport.</h1>
            <p className="lead enter enter-3 mt-8 max-w-xl text-muted">
              Miami Athletic Association connects people and organizations through athletic experiences, professional
              relationships, and initiatives that support Miami&apos;s sports and fitness community.
            </p>
          </div>
          <div className="enter enter-2 relative z-10 lg:col-span-5 lg:-mb-32 lg:self-end">
            <PhotoFrame photo={photos.rideCauseway} priority sizes="(min-width: 1024px) 40vw, 100vw" className="aspect-[4/3] lg:aspect-[4/5]" />
          </div>
        </div>
      </section>

      {/* Who we are */}
      <section className="section-y bg-paper">
        <div className="wrap grid gap-8 lg:grid-cols-12 lg:pt-20">
          <h2 className="display display-lg reveal lg:col-span-6">An Association Built Around Connection.</h2>
          <div className="reveal space-y-5 text-muted lg:col-span-5 lg:col-start-8">
            <p className="lead text-ink">
              Miami Athletic Association works at the intersection of sports, fitness, hospitality, and community. Its
              purpose is to bring people and organizations together, support meaningful experiences, and contribute to the
              continued development of Miami&apos;s athletic and sports tourism ecosystem.
            </p>
            <p>
              MAA&apos;s activities range from community-focused events to initiatives designed to connect industry
              professionals and encourage collaboration across organizations.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & vision */}
      <section className="grid lg:grid-cols-2">
        <div className="bg-sky px-[clamp(1.25rem,4vw,3.5rem)] py-16 text-ink lg:py-24">
          <div className="reveal">
            <h2 className="label">Our Mission</h2>
            <p className="display display-md mt-8 max-w-[22ch]">
              To connect Miami&apos;s sports, fitness, hospitality, and community stakeholders through events, relationships,
              and shared opportunities.
            </p>
          </div>
        </div>
        <div className="on-dark bg-pine px-[clamp(1.25rem,4vw,3.5rem)] py-16 text-white lg:py-24">
          <div className="reveal">
            <h2 className="label text-sun">Our Vision</h2>
            <p className="lead mt-8 max-w-[34ch] font-medium lg:text-[1.75rem] lg:leading-[1.3]">
              A Miami where sports and athletic experiences bring communities together, strengthen industry connections,
              and contribute to the city&apos;s identity as a destination for participation and competition.
            </p>
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="section-y bg-white">
        <div className="wrap">
          <Eyebrow className="reveal mb-5 text-green">How We Work</Eyebrow>
          <h2 className="display display-lg reveal">Our Approach</h2>
          <ol className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4">
            {approach.map((item, i) => (
              <li key={item.title} className="reveal border-t-2 border-ink pb-6 pr-6 pt-5 lg:pb-0">
                <span className="label text-muted">0{i + 1}</span>
                <h3 className="display mt-8 text-[clamp(1.6rem,2.3vw,2.1rem)]">{item.title}</h3>
                <p className="mt-3 text-muted">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Background */}
      <section className="bg-paper">
        <div className="grid lg:grid-cols-12">
          <div className="lg:col-span-6">
            <PhotoFrame photo={photos.groupSidewalk} sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-[4/3] h-full w-full lg:aspect-auto lg:min-h-[36rem]" />
          </div>
          <div className="flex flex-col justify-center px-[clamp(1.25rem,4vw,3.5rem)] py-14 lg:col-span-6 lg:py-20">
            <div className="reveal max-w-xl">
              <h2 className="display display-lg">Building on Experience. Looking Ahead.</h2>
              <p className="mt-6 text-muted">
                MAA has a history of bringing people together through community and athletic experiences, including the
                American X History Tour of Miami and fitness-centered networking activities.
              </p>
              <p className="mt-4 text-muted">
                Today, the organization is expanding its focus through new initiatives, industry relationships, and
                opportunities to connect Miami&apos;s sports, fitness, and hospitality communities.
              </p>
              <Caption className="mt-8 text-muted">Photo: participants at a previous American X History Tour.</Caption>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem */}
      <section className="section-y bg-white">
        <div className="wrap grid items-center gap-10 lg:grid-cols-12">
          <div className="reveal lg:col-span-5">
            <h2 className="display text-[clamp(2.25rem,3.4vw,3.6rem)]">Local Connections. Broader Opportunities.</h2>
            <p className="mt-6 text-muted">
              Miami&apos;s combination of local communities, hospitality infrastructure, international visibility, and
              active lifestyle creates opportunities for sporting experiences of many scales.
            </p>
            <p className="mt-4 text-muted">
              MAA is interested in helping connect the people and organizations that can contribute to these experiences,
              from community activities to larger destination-focused initiatives.
            </p>
          </div>
          <div className="reveal grid grid-cols-5 items-end gap-4 lg:col-span-6 lg:col-start-7">
            <PhotoFrame photo={photos.oceanDrive} sizes="(min-width: 1024px) 30vw, 60vw" className="col-span-3 aspect-[4/5]" />
            <PhotoFrame photo={photos.paddleboard} sizes="(min-width: 1024px) 20vw, 40vw" className="col-span-2 aspect-square" />
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="border-t border-line bg-white">
        <div className="wrap section-y grid gap-10 lg:grid-cols-12">
          <div className="reveal lg:col-span-4">
            <div className="relative aspect-[4/5] overflow-hidden bg-paper">
              <Image src={leader.portrait.src} alt={leader.portrait.alt} fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover object-top" />
            </div>
          </div>
          <div className="reveal self-end lg:col-span-7 lg:col-start-6">
            <Eyebrow className="mb-5 text-green">Leadership</Eyebrow>
            <h2 className="display display-lg">{leader.name}</h2>
            <p className="label mt-4 text-muted">{leader.title}</p>
            <p className="lead mt-6 max-w-2xl text-muted">{leader.bio}</p>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="on-dark bg-blue text-white">
        <div className="wrap flex flex-col justify-between gap-8 py-16 lg:flex-row lg:items-end lg:py-24">
          <div className="reveal max-w-3xl">
            <h2 className="display display-lg">Be Part of What&apos;s Next.</h2>
            <p className="lead mt-5 text-white/95">
              MAA welcomes conversations with people and organizations interested in contributing to Miami&apos;s sports and
              fitness community.
            </p>
          </div>
          <div className="reveal shrink-0">
            <Button href="/get-involved" variant="sun">
              Get Involved
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
