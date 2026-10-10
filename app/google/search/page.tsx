import { Suspense } from "react";
import type { Metadata } from "next";
import GoogleResults from "@/components/google/GoogleResults";

export const metadata: Metadata = {
  title: "apple laptops - Google Search",
};

export default function Page() {
  // useSearchParams() needs a Suspense boundary so the rest of the page can be prerendered.
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#fff" }} />}>
      <GoogleResults />
    </Suspense>
  );
}
