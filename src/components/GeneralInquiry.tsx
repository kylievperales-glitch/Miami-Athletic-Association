"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { generalForm, inquiryTypes } from "@/content/forms";
import { InquiryForm } from "@/components/Forms";

/** Pathway links pass ?type=... so the matching inquiry type is preselected. */
function WithPreset() {
  const type = useSearchParams().get("type");
  const preset = type && inquiryTypes.includes(type) ? type : undefined;
  return <InquiryForm key={preset} config={generalForm} defaults={preset ? { inquiryType: preset } : undefined} />;
}

export function GeneralInquiry() {
  return (
    <Suspense fallback={<InquiryForm config={generalForm} />}>
      <WithPreset />
    </Suspense>
  );
}
