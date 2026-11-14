/** Calendar categories, labels and public copy. Edit wording here, not in components. */

export const categories = [
  { id: "running_endurance", label: "Running & Endurance", short: "Running", color: "#0f5e9c", tint: "#e3eef7", ink: "#ffffff" },
  { id: "sports_competitions", label: "Sports & Competitions", short: "Sports", color: "#1b7a4b", tint: "#e2f0e8", ink: "#ffffff" },
  { id: "fitness_wellness", label: "Fitness & Wellness", short: "Fitness", color: "#48a8e0", tint: "#e6f3fb", ink: "#10171d" },
  { id: "networking_community", label: "Networking & Community", short: "Community", color: "#f2e85c", tint: "#fbf8d6", ink: "#10171d" },
  { id: "other", label: "Other", short: "Other", color: "#4e5861", tint: "#ecebe6", ink: "#ffffff" },
] as const;

export type CategoryId = (typeof categories)[number]["id"];
export const categoryIds = categories.map((c) => c.id) as CategoryId[];
export const categoryById = (id: string) => categories.find((c) => c.id === id) ?? categories[4];

export const admissionTypes = [
  { id: "free", label: "Free" },
  { id: "paid", label: "Paid" },
  { id: "registration_varies", label: "Registration Required — Price Varies" },
] as const;
export type AdmissionType = (typeof admissionTypes)[number]["id"];
export const admissionLabel = (id: string) => admissionTypes.find((a) => a.id === id)?.label ?? id;

export const organizerTypes = [
  { id: "maa", label: "Miami Athletic Association" },
  { id: "third_party", label: "Third-Party Organizer" },
] as const;
export type OrganizerType = (typeof organizerTypes)[number]["id"];

/** Filter for who organizes an event. */
export const organizerFilters = [
  { id: "all", label: "All Events" },
  { id: "maa", label: "MAA Events" },
  { id: "community", label: "Community Events" },
] as const;

export const calendarCopy = {
  hero: {
    eyebrow: "Miami Athletic Association",
    title: "Miami Sports & Fitness Calendar",
    description:
      "Discover sporting events, fitness experiences, competitions, and community gatherings happening across Miami.",
    secondary: "Explore upcoming events or submit your own for consideration on the Miami Athletic Association calendar.",
    cta: "Submit an Event",
  },
  explore: {
    title: "Explore Upcoming Events",
    text: "Browse by date or category to find events that interest you.",
  },
  invite: {
    title: "Hosting an Event in Miami?",
    text: "Share your event with the Miami Athletic Association community. Submit the details below for review and possible inclusion in our public calendar.",
    cta: "Submit Your Event",
    note: "All submissions are reviewed before publication. Submitting an event does not guarantee inclusion in the calendar.",
  },
  emptyDay: "No events are currently listed for this date.",
  emptyMonth: "No events are currently listed for this month. Check back for updates or explore another month.",
  thirdParty: "This event is organized by a third party. Please confirm details with the organizer.",
  guidelines: {
    title: "Submission Guidelines",
    paragraphs: [
      "Miami Athletic Association welcomes submissions for sports, fitness, athletic, and related community events taking place in the Miami area.",
      "Events should include accurate dates, locations, organizer information, and a working link where details can be verified.",
      "All submissions are subject to review. MAA reserves the right to decline, edit, or remove listings that are incomplete, inaccurate, unrelated to the calendar's purpose, or otherwise unsuitable for publication.",
      "Submission does not guarantee publication, and inclusion on the calendar does not imply MAA sponsorship or endorsement.",
    ],
  },
  form: {
    submit: "Submit Event for Review",
    urlHelp:
      "Provide a link to an official event page, registration page, or organizer website where we can verify the event details.",
    accuracy:
      "I confirm that the event information is accurate and that I am authorized to submit this event for consideration.",
    newsletter:
      "I would also like to receive email updates from Miami Athletic Association about upcoming events and initiatives.",
    successTitle: "Event Submitted Successfully",
    successText:
      "Thank you for submitting your event to Miami Athletic Association. Your submission has been received and is pending review. If approved, it will appear on our public calendar.",
    emailSent: "A confirmation email will be sent to the address provided.",
  },
};
