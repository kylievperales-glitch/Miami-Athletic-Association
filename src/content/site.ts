/** Organization details used across the site. Edit here, not in components. */

export const org = {
  name: "Miami Athletic Association",
  short: "MAA",
  location: "Miami / Miami Beach, Florida",
  email: "miamiathleticassociation@gmail.com",
  mission:
    "Connecting Miami's sports, fitness, hospitality, and community stakeholders through events, relationships, and shared opportunities.",
  description:
    "Miami Athletic Association brings people, businesses, and organizations together through athletic experiences, industry connections, and initiatives that celebrate Miami.",
};

export const nav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Events & Initiatives", href: "/events" },
  { label: "Partners", href: "/partners" },
  { label: "Get Involved", href: "/get-involved" },
] as const;

export const socials = [
  { label: "Instagram", href: "https://www.instagram.com/miamiathletic/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/miami-athletic-association/" },
  { label: "YouTube", href: "https://www.youtube.com/@miamiathleticassociation/videos" },
] as const;

export const leader = {
  name: "Kevin A. Krueger",
  title: "Founder",
  bio: "Kevin A. Krueger leads Miami Athletic Association's efforts to connect people and organizations through sports, fitness, and community experiences. His work includes developing athletic initiatives, building relationships across Miami's hospitality and sports communities, and exploring new opportunities for collaboration.",
  portrait: {
    src: "/images/people/kevin-krueger.jpg",
    alt: "Portrait of Kevin A. Krueger in a dark suit and light blue tie",
  },
};
