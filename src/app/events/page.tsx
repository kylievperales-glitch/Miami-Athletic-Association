import Image from "next/image";
import { Arrow, Button, Caption, Eyebrow, PhotoFrame, Status } from "@/components/ui";
import { photos } from "@/content/images";
import { americanX, firstResponderGames, lanes, miamiBeachGames, networkingOut } from "@/content/initiatives";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta(
  "Events & Initiatives",
  "Explore the community experiences, professional gatherings, and developing sporting initiatives connected to Miami Athletic Association.",
  "/events",
);

export default function Events() {
  return (
    <>
      {/* Hero and initiative index */}
      <section className="on-dark bg-navy text-white">
        <div className="wrap pb-10 pt-14 lg:pt-20">
          <Eyebrow className="enter mb-6 text-sun">Events &amp; Initiatives</Eyebrow>
          <h1 className="display display-xl enter enter-2 max-w-[17ch]">
            Experiences That Connect, Inspire, and Bring People Together.
          </h1>
          <p className="lead enter enter-3 mt-8 max-w-2xl text-white/90">
            Explore the community experiences, professional gatherings, and developing sporting initiatives connected to
            Miami Athletic Association.
          </p>
          <nav aria-label="Initiatives on this page" className="enter enter-3 mt-14">
            <ul>
              {lanes.map((lane) => (
                <li key={lane.id} className="border-t border-white/25 last:border-b">
                  <a
                    href={`#${lane.id}`}
                    className="group/card grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-3 py-4 transition-colors hover:bg-white/5 sm:grid-cols-[3.5rem_1fr_auto_1.5rem] sm:py-5"
                  >
                    <span className="label text-sky">{lane.n}</span>
                    <span className="display display-sm">{lane.name}</span>
                    <span className="label col-start-2 mt-1.5 text-white/80 sm:col-start-3 sm:mt-0 sm:text-right">{lane.status}</span>
                    <Arrow className="hidden rotate-90 sm:block group-hover/card:translate-x-0" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      {/* American X */}
      <section id={americanX.id} className="section-y bg-white">
        <div className="wrap">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="reveal lg:col-span-8">
              <Eyebrow className="mb-5 text-green">{americanX.eyebrow}</Eyebrow>
              <h2 className="display display-xl">{americanX.name}</h2>
            </div>
            <div className="reveal flex items-end lg:col-span-3 lg:col-start-10">
              <Image
                src="/images/brand/axht-logo.jpg"
                alt="American X History Tour of Miami logo"
                width={889}
                height={1350}
                className="h-28 w-auto lg:ml-auto lg:h-40"
              />
            </div>
          </div>

          <div className="mt-12 grid grid-cols-6 gap-3 lg:gap-4">
            <PhotoFrame photo={photos.groupCrosswalk} sizes="(min-width: 1024px) 66vw, 100vw" className="reveal col-span-6 aspect-[4/3] lg:col-span-4" />
            <PhotoFrame photo={photos.groupOverhead} sizes="(min-width: 1024px) 33vw, 50vw" className="reveal col-span-3 aspect-[4/5] lg:col-span-2 lg:aspect-auto" />
            <PhotoFrame photo={photos.rideCauseway} sizes="(min-width: 1024px) 33vw, 50vw" className="reveal col-span-3 aspect-[4/5] lg:col-span-2 lg:aspect-[4/3]" />
            <PhotoFrame photo={photos.runLoveMural} sizes="(min-width: 1024px) 66vw, 100vw" className="reveal col-span-6 aspect-[16/9] lg:col-span-4 lg:aspect-[8/3]" />
          </div>
          <Caption className="text-muted">Photos from previous American X History Tour experiences.</Caption>

          <div className="mt-12 grid gap-8 lg:grid-cols-12">
            <div className="reveal lg:col-span-5">
              <p className="label text-muted">Next Edition</p>
              <p className="display display-md mt-3">{americanX.date}</p>
              <div className="mt-4">
                <Status>{americanX.dateStatus}</Status>
              </div>
            </div>
            <div className="reveal lg:col-span-6 lg:col-start-7">
              <p className="lead">{americanX.description}</p>
              <p className="mt-4 text-muted">{americanX.context}</p>
              <div className="mt-7">
                <Button href={americanX.url} external>
                  Explore the American X History Tour
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NetWorkingOut */}
      <section id={networkingOut.id} className="section-y bg-paper">
        <div className="wrap">
          <Eyebrow className="reveal mb-5 text-green">{networkingOut.eyebrow}</Eyebrow>
          <h2 className="display reveal text-[clamp(1.75rem,9.2vw,9rem)] whitespace-nowrap text-blue">{networkingOut.name}</h2>
          <div className="mt-12 grid gap-10 lg:grid-cols-12">
            <div className="reveal lg:col-span-6">
              <PhotoFrame photo={photos.groupFitness} sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-[4/3]" />
              <Caption className="text-muted">Illustrative image.</Caption>
            </div>
            <div className="reveal lg:col-span-5 lg:col-start-8">
              <p className="display display-sm">{networkingOut.intro}</p>
              {networkingOut.body.map((p) => (
                <p key={p} className="mt-5 text-muted">
                  {p}
                </p>
              ))}
              <div className="mt-8">
                <Status>{networkingOut.status}</Status>
              </div>
              <div className="mt-6">
                <Button href="/get-involved#stay-connected">Stay Informed</Button>
              </div>
            </div>
          </div>

          <ul className="mt-14 grid gap-8 border-t border-ink pt-8 md:grid-cols-3">
            {networkingOut.highlights.map((h) => (
              <li key={h.title} className="reveal">
                <h3 className="display display-sm">{h.title}</h3>
                <p className="mt-2 text-muted">{h.text}</p>
              </li>
            ))}
          </ul>

          <div className="reveal mt-12 flex flex-col justify-between gap-5 bg-white p-6 sm:flex-row sm:items-center sm:p-8">
            <p className="max-w-2xl">
              <strong className="font-semibold">Have a venue or organization that would be a good fit?</strong> MAA would
              like to hear from local venues, fitness professionals, and community partners.
            </p>
            <Button href="/partners#inquiry" variant="outline" className="shrink-0">
              Start a Conversation
            </Button>
          </div>
        </div>
      </section>

      {/* First Responder Games */}
      <section id={firstResponderGames.id} className="on-dark bg-pine text-white">
        <div className="grid lg:grid-cols-12">
          <div className="flex flex-col justify-center px-[clamp(1.25rem,4vw,3.5rem)] py-14 lg:col-span-7 lg:py-24">
            <div className="reveal max-w-2xl">
              <Eyebrow className="text-sun">{firstResponderGames.eyebrow}</Eyebrow>
              <h2 className="display display-lg mt-5">{firstResponderGames.name}</h2>
              <p className="lead mt-6 text-white/90">{firstResponderGames.description}</p>
              <div className="mt-8">
                <Button href="/get-involved#stay-connected" variant="sun">
                  Get Updates
                </Button>
              </div>
            </div>
          </div>
          <div className="relative lg:col-span-5">
            <PhotoFrame photo={photos.logCarry} sizes="(min-width: 1024px) 42vw, 100vw" className="aspect-[4/3] h-full w-full lg:aspect-auto" />
            <p className="label absolute bottom-0 left-0 bg-pine px-3 py-2 text-white">Concept image</p>
          </div>
        </div>
      </section>

      {/* Miami Beach Games */}
      <section id={miamiBeachGames.id} className="on-dark relative isolate overflow-hidden bg-navy text-white">
        <Image
          src={photos.volleyballSunset.src}
          alt={photos.volleyballSunset.alt}
          fill
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(6,20,34,.9)_0%,rgba(6,20,34,.72)_48%,rgba(6,20,34,.2)_100%)]" />
        <div className="wrap py-20 lg:py-32">
          <div className="reveal max-w-2xl">
            <Eyebrow className="text-sun">{miamiBeachGames.eyebrow}</Eyebrow>
            <h2 className="display display-xl mt-5">{miamiBeachGames.name}</h2>
            <p className="display display-md mt-7 text-sky">{miamiBeachGames.target}</p>
            <p className="lead mt-6">{miamiBeachGames.description}</p>
            <p className="mt-4 text-white/90">{miamiBeachGames.note}</p>
            <div className="mt-8">
              <Button href={miamiBeachGames.url} external variant="white">
                Explore Miami Beach Games
              </Button>
            </div>
            <Caption className="mt-6 text-white/80">Concept image.</Caption>
          </div>
        </div>
      </section>

      {/* Calendar */}
      <section className="border-b border-line bg-white py-14 lg:py-20">
        <div className="wrap grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="reveal lg:col-span-6">
            <Eyebrow className="mb-4 text-green">Miami Sports &amp; Fitness Calendar</Eyebrow>
            <h2 className="display display-md">A More Connected Miami Events Calendar.</h2>
          </div>
          <div className="reveal lg:col-span-5 lg:col-start-8">
            <p className="text-muted">
              Discover sporting events, fitness experiences, competitions, and community gatherings happening across Miami,
              or submit your own event for consideration.
            </p>
            <div className="mt-6">
              <Button href="/calendar">Explore the Calendar</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="bg-sun text-ink">
        <div className="wrap flex flex-col justify-between gap-8 py-16 lg:flex-row lg:items-end lg:py-20">
          <div className="reveal max-w-3xl">
            <h2 className="display display-lg">Have an Event or Collaboration in Mind?</h2>
            <p className="lead mt-5">
              MAA is interested in connecting with organizers, venues, and organizations developing experiences that bring
              people together through sport.
            </p>
          </div>
          <div className="reveal shrink-0">
            <Button href="/get-involved#inquiry" variant="outline">
              Connect With MAA
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
