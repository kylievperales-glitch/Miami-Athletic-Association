import Image from "next/image";
import Link from "next/link";
import { Newsletter } from "@/components/Forms";
import { Arrow, Button, Caption, Eyebrow, PhotoFrame, SectionHead, Status } from "@/components/ui";
import { photos } from "@/content/images";
import { americanX, firstResponderGames, miamiBeachGames, networkingOut } from "@/content/initiatives";
import { org } from "@/content/site";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta(null, org.description, "/");

const focus = [
  {
    title: "Sports Tourism",
    text: "Supporting Miami's potential as a destination for sporting events, athletic experiences, and the visitors they attract.",
    chip: "bg-sky",
  },
  {
    title: "Events & Experiences",
    text: "Developing and promoting experiences that bring people together through sports, fitness, and community participation.",
    chip: "bg-green",
  },
  {
    title: "Industry Connections",
    text: "Creating opportunities for professionals and organizations across sports, hospitality, and related industries to connect.",
    chip: "bg-blue",
  },
  {
    title: "Community Engagement",
    text: "Encouraging participation, collaboration, and stronger connections within Miami's local communities.",
    chip: "bg-sun",
  },
];

const collaborators = ["Hospitality venues", "Event organizers", "Sports organizations", "Brands"];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="on-dark relative isolate flex flex-col overflow-hidden bg-navy text-white lg:min-h-[43.5vw] lg:flex-row lg:items-center">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden sm:aspect-[16/9] lg:absolute lg:inset-y-0 lg:left-[42%] lg:right-0 lg:aspect-auto lg:w-auto">
          <Image
            src={photos.groupCrosswalk.src}
            alt={photos.groupCrosswalk.alt}
            fill
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            style={{ objectPosition: photos.groupCrosswalk.focus }}
            className="object-cover"
          />
        </div>
        <div className="wrap pb-12 pt-9 sm:pb-14 sm:pt-11 lg:mx-0 lg:w-[42%] lg:max-w-none lg:py-14 lg:pl-[max(clamp(1.25rem,4vw,3.5rem),calc((100vw-1480px)/2+3.5rem))] lg:pr-8">
          <div className="max-w-[40rem]">
            <h1 className="display enter text-[clamp(2.5rem,4.5vw,4.1rem)]">
              Connecting Miami&apos;s Sports, Fitness &amp; Hospitality Communities.
            </h1>
            <p className="lead enter enter-2 mt-7 max-w-[35rem]">
              Miami Athletic Association brings people, businesses, and organizations together through athletic
              experiences, industry connections, and initiatives that celebrate Miami as a place to participate,
              connect, and compete.
            </p>
            <div className="enter enter-3 mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button href="/events" variant="sun" className="whitespace-nowrap">
                Explore Events
              </Button>
              <Button href="/get-involved" variant="outline-light" className="whitespace-nowrap">
                Get Involved
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="section-y bg-white">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <div className="reveal self-start lg:sticky lg:top-32 lg:col-span-5">
            <Eyebrow className="mb-5 text-green">Our Focus</Eyebrow>
            <h2 className="display display-lg max-w-[12ch]">Connecting People Through Sport.</h2>
            <p className="lead mt-6 max-w-md text-muted">
              From community experiences to destination-wide initiatives, MAA works across sports, fitness, hospitality,
              and tourism to create opportunities for participation and collaboration.
            </p>
          </div>
          <ol className="lg:col-span-6 lg:col-start-7">
            {focus.map((item, i) => (
              <li key={item.title} className="reveal grid grid-cols-[3rem_1fr] gap-x-3 border-t border-ink py-8 last:border-b sm:grid-cols-[4.5rem_1fr] sm:py-10">
                <span className="flex items-start gap-2">
                  <span aria-hidden="true" className={`mt-1 size-3 ${item.chip}`} />
                  <span className="label text-muted">0{i + 1}</span>
                </span>
                <div>
                  <h3 className="display display-md">{item.title}</h3>
                  <p className="mt-3 max-w-lg text-muted">{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Featured initiative */}
      <section className="on-dark overflow-hidden bg-navy text-white">
        <div className="grid lg:grid-cols-12">
          <div className="relative lg:col-span-7">
            <PhotoFrame photo={photos.runLoveMural} sizes="(min-width: 1024px) 60vw, 100vw" className="aspect-[4/3] h-full w-full lg:aspect-auto lg:min-h-[46rem]" />
          </div>
          <div className="flex flex-col justify-center px-[clamp(1.25rem,4vw,3.5rem)] py-14 lg:col-span-5 lg:py-20">
            <div className="reveal">
              <Eyebrow className="text-sun">{americanX.eyebrow}</Eyebrow>
              <h2 className="display display-lg mt-5">{americanX.name}</h2>
              <p className="mt-7 flex flex-wrap items-center gap-3">
                <span className="display display-sm">{americanX.date}</span>
                <Status tone="dark">{americanX.dateStatus}</Status>
              </p>
              <p className="mt-6 max-w-lg text-white/90">{americanX.homeCopy}</p>
              <div className="mt-8">
                <Button href={americanX.url} external variant="sun">
                  Explore the Tour
                </Button>
              </div>
              <Caption className="mt-8 text-white/75">Photo: a previous American X History Tour.</Caption>
            </div>
          </div>
        </div>
      </section>

      {/* Other initiatives */}
      <section className="section-y bg-paper">
        <div className="wrap">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <SectionHead eyebrow="Events & Initiatives" title="Experiences That Bring Miami Together.">
              <p>MAA&apos;s initiatives span community events, professional connections, and ambitious new sporting experiences.</p>
            </SectionHead>
            <div className="reveal shrink-0">
              <Button href="/events" variant="outline">
                View All Initiatives
              </Button>
            </div>
          </div>

          <div className="mt-14 grid gap-x-8 gap-y-12 lg:grid-cols-12">
            <Link href={networkingOut.href} className="group/card reveal lg:col-span-7">
              <PhotoFrame photo={photos.marathonStreet} sizes="(min-width: 1024px) 56vw, 100vw" zoom className="aspect-[4/3] lg:aspect-[16/11]" />
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Status>{networkingOut.status}</Status>
              </div>
              <h3 className="display display-md mt-4 flex items-center gap-3">
                {networkingOut.name}
                <Arrow />
              </h3>
              <p className="mt-2 max-w-md text-muted">{networkingOut.teaser}</p>
            </Link>

            <div className="grid gap-12 lg:col-span-5 lg:pt-24">
              {[
                { item: firstResponderGames, photo: photos.logCarry },
                { item: miamiBeachGames, photo: photos.volleyballSunset },
              ].map(({ item, photo }) => (
                <Link key={item.id} href={item.href} className="group/card reveal grid gap-5 sm:grid-cols-[42%_1fr] lg:grid-cols-[38%_1fr]">
                  <PhotoFrame photo={photo} sizes="(min-width: 1024px) 18vw, (min-width: 640px) 40vw, 100vw" zoom className="aspect-[4/3] sm:aspect-[4/5]" />
                  <div className="self-end">
                    <Status>{item.status}</Status>
                    <h3 className="display display-sm mt-4">{item.name}</h3>
                    <p className="mt-2 text-[0.975rem] text-muted">{item.teaser}</p>
                    <span className="mt-3 inline-flex items-center gap-2 font-display text-[0.9rem] font-semibold text-blue">
                      Learn more <span className="sr-only">about {item.name}</span>
                      <Arrow />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <p className="mt-10 text-[0.8125rem] text-muted">Images in this section are illustrative and do not show MAA events.</p>
        </div>
      </section>

      {/* Why Miami */}
      <section className="relative overflow-hidden bg-white">
        <PhotoFrame photo={photos.aerialSouthBeach} sizes="100vw" className="h-[52vw] max-h-[52rem] min-h-[20rem] w-full" />
        <div className="wrap">
          <div className="reveal relative z-10 bg-white pb-16 pt-10 sm:pt-14 lg:-ml-[100vw] lg:-mt-48 lg:max-w-[calc(48rem+100vw)] lg:pb-24 lg:pl-[100vw] lg:pr-14 lg:pt-16">
            <Eyebrow className="mb-5 text-green">Why Miami</Eyebrow>
            <h2 className="display display-lg">A City Built for Sport and Connection.</h2>
            <p className="lead mt-6 text-muted">
              Miami brings together a distinctive combination of athletic culture, international visitors, hospitality,
              and year-round opportunities for outdoor activity. MAA sees an opportunity to connect these strengths,
              supporting experiences that engage local communities while contributing to Miami&apos;s appeal as a sports
              and fitness destination.
            </p>
          </div>
        </div>
      </section>

      {/* Collaboration */}
      <section className="on-dark bg-pine text-white">
        <div className="grid lg:grid-cols-12">
          <div className="order-2 flex flex-col justify-between gap-12 px-[clamp(1.25rem,4vw,3.5rem)] py-14 lg:order-1 lg:col-span-7 lg:py-24">
            <div className="reveal">
              <h2 className="display display-xl max-w-[11ch]">Let&apos;s Create Something Together.</h2>
              <p className="lead mt-7 max-w-xl text-white/90">
                From hospitality venues and event organizers to sports organizations and brands, MAA is interested in
                connecting with people and businesses that see opportunity in bringing Miami together through sport.
              </p>
              <div className="mt-9">
                <Button href="/partners" variant="sun">
                  Explore Partnerships
                </Button>
              </div>
            </div>
            <ul className="reveal grid grid-cols-2 gap-x-6 border-t border-white/30 pt-5 sm:grid-cols-4">
              {collaborators.map((c) => (
                <li key={c} className="label py-1.5 text-white/90">
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 lg:order-2 lg:col-span-5">
            <PhotoFrame photo={photos.rooftopSunset} sizes="(min-width: 1024px) 42vw, 100vw" className="aspect-[16/10] h-full w-full lg:aspect-auto" />
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-paper py-16 sm:py-24">
        <div className="wrap grid items-end gap-10 lg:grid-cols-12">
          <div className="reveal lg:col-span-6">
            <h2 className="display display-md max-w-[17ch]">Stay Connected With Miami Athletic Association.</h2>
            <p className="mt-4 max-w-md text-muted">Get updates on MAA initiatives, upcoming experiences, and opportunities to connect.</p>
          </div>
          <div className="reveal lg:col-span-5 lg:col-start-8">
            <Newsletter />
          </div>
        </div>
      </section>
    </>
  );
}
