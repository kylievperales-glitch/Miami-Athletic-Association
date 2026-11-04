/**
 * MAA's four initiatives. Dates and statuses live here only.
 *
 * Keep these honest: nothing below is a confirmed schedule, venue, partner or
 * registration. American X is "planned, subject to confirmation"; the others are
 * in development. #NetWorkingOut has no confirmed next date.
 */

export const americanX = {
  id: "american-x-history-tour",
  name: "American X History Tour of Miami",
  eyebrow: "Featured Initiative",
  date: "February 28, 2027",
  dateStatus: "Planned",
  url: "https://american-x-history-tour.vercel.app/",
  homeCopy:
    "Walk, run, or ride through an important chapter of Miami's sporting history. The American X History Tour explores Muhammad Ali's connection to the city through an experience that brings together history, athletics, and community.",
  description:
    "Experience Miami through the story of Muhammad Ali. The American X History Tour brings people together through walking, running, cycling, and the history of one of sport's most influential figures.",
  context:
    "The next edition is being planned in connection with Muhammad Ali Day, and its date is subject to final confirmation. The Tour's own website carries the full history, the event concept, and route information.",
};

export const networkingOut = {
  id: "networkingout",
  href: "/events#networkingout",
  name: "#NetWorkingOut",
  eyebrow: "Community & Professional Connections",
  status: "Program Development",
  teaser: "Professional connections through fitness and shared experiences.",
  intro: "Where professional networking meets fitness and shared experiences.",
  body: [
    "#NetWorkingOut is MAA's approach to creating connections beyond the traditional networking format. By bringing professionals together through active experiences, the program aims to encourage meaningful relationships across Miami's sports, fitness, hospitality, and business communities.",
    "MAA is exploring future opportunities to bring these experiences to local venues and hospitality spaces.",
  ],
  highlights: [
    {
      title: "Move Together",
      text: "Built around shared activity rather than a conference room.",
    },
    {
      title: "Connect Across Industries",
      text: "Intended to bring together people from sports, fitness, hospitality, and business.",
    },
    {
      title: "Discover New Experiences",
      text: "A more active way to discover Miami's venues and hospitality spaces.",
    },
  ],
};

export const firstResponderGames = {
  id: "first-responder-games",
  href: "/events#first-responder-games",
  name: "Florida First Responder Games",
  eyebrow: "In Development · Targeting Summer 2027",
  status: "In Development · Summer 2027 Target",
  target: "Summer 2027",
  teaser: "Exploring a new athletic experience celebrating Florida's first responder community.",
  description:
    "A proposed sporting initiative celebrating the first responder community through athletic competition, camaraderie, and connection. MAA is exploring opportunities to bring this experience to Florida in summer 2027.",
};

export const miamiBeachGames = {
  id: "miami-beach-games",
  href: "/events#miami-beach-games",
  name: "Miami Beach Games",
  eyebrow: "In Development · March 2028",
  status: "In Development · March 2028",
  target: "March 2028",
  url: "https://miami-beach-games.vercel.app/",
  teaser: "Developing a destination-wide sports and fitness initiative for March 2028.",
  description:
    "An ambitious new vision for March in Miami Beach. Miami Beach Games is being developed as a destination-wide celebration of sports, fitness, and community, bringing together event organizers, participants, businesses, and visitors.",
  note: "Miami Beach Games is in development. Programming, venues, and participating organizations have not been finalized.",
};

/** The numbered index at the top of /events. */
export const lanes = [
  { n: "01", id: americanX.id, name: americanX.name, status: `${americanX.date} — ${americanX.dateStatus}` },
  { n: "02", id: networkingOut.id, name: networkingOut.name, status: networkingOut.status },
  { n: "03", id: firstResponderGames.id, name: firstResponderGames.name, status: firstResponderGames.status },
  { n: "04", id: miamiBeachGames.id, name: miamiBeachGames.name, status: miamiBeachGames.status },
];
