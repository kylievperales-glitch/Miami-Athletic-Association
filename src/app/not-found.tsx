import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="wrap section-y">
      <p className="label mb-5 text-green">Page not found</p>
      <h1 className="display display-lg max-w-3xl">This page doesn&apos;t exist.</h1>
      <div className="mt-9">
        <Button href="/">Back to Home</Button>
      </div>
    </section>
  );
}
