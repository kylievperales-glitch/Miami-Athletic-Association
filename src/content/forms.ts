import type { FormConfig } from "@/lib/forms";

export const partnershipForm: FormConfig = {
  kind: "partnership",
  subject: "Partnership inquiry",
  fields: [
    { name: "name", label: "Name", type: "text", required: true, autoComplete: "name", half: true },
    { name: "organization", label: "Organization", type: "text", required: true, autoComplete: "organization", half: true },
    { name: "email", label: "Email", type: "email", required: true, autoComplete: "email", half: true },
    { name: "website", label: "Organization website", type: "url", autoComplete: "url", half: true },
    {
      name: "interest",
      label: "Area of interest",
      type: "select",
      required: true,
      options: [
        "Hosting or Venue Collaboration",
        "Sports or Event Collaboration",
        "Sponsorship",
        "Fitness or Community Partnership",
        "Other",
      ],
    },
    { name: "message", label: "Message", type: "textarea", required: true },
  ],
};

export const inquiryTypes = [
  "General Inquiry",
  "Volunteer Interest",
  "Leadership or Advisory Interest",
  "Event or Program Interest",
  "Other",
];

export const generalForm: FormConfig = {
  kind: "general",
  subject: "General inquiry",
  fields: [
    { name: "name", label: "Name", type: "text", required: true, autoComplete: "name", half: true },
    { name: "email", label: "Email", type: "email", required: true, autoComplete: "email", half: true },
    { name: "organization", label: "Organization", type: "text", autoComplete: "organization", half: true },
    { name: "inquiryType", label: "Inquiry type", type: "select", required: true, half: true, options: inquiryTypes },
    { name: "message", label: "Message", type: "textarea", required: true },
  ],
};
