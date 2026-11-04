/**
 * Verified collaborators shown on /partners under "Organizations We've
 * Connected With".
 *
 * LEAVE THIS EMPTY until a relationship and its wording are confirmed, and logo
 * use is approved. See CONTENT_TODO.md. When an entry is added, the section
 * switches automatically from its holding message to a logo row.
 */
export type Collaborator = {
  name: string;
  /** Approved public wording, e.g. "Event collaborator". */
  relationship: string;
  /** Path under /public, e.g. "/images/partners/name.png". */
  logo: string;
  url?: string;
};

export const verifiedCollaborators: Collaborator[] = [];

export const benefits = [
  {
    title: "Community Connections",
    text: "Connect with people and organizations involved in Miami's sports, fitness, and hospitality communities.",
  },
  {
    title: "Event Collaboration",
    text: "Explore opportunities to contribute to sporting experiences, community activities, and future initiatives.",
  },
  {
    title: "Destination Engagement",
    text: "Participate in conversations and initiatives connected to Miami's broader sports and hospitality ecosystem.",
  },
];

export const collaboratorTypes = [
  {
    title: "Hospitality & Venues",
    text: "Hotels, resorts, and venues interested in hosting experiences or collaborating on events.",
  },
  {
    title: "Sports & Event Organizations",
    text: "Event producers, leagues, athletic organizations, and organizers interested in new opportunities.",
  },
  {
    title: "Fitness & Community Businesses",
    text: "Studios, gyms, coaches, and local businesses that contribute to Miami's active communities.",
  },
  {
    title: "Brands & Institutional Partners",
    text: "Companies, sponsors, tourism stakeholders, and organizations interested in supporting relevant initiatives.",
  },
];
