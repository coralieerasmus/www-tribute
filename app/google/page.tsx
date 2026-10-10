import type { Metadata } from "next";
import GoogleHome from "@/components/google/GoogleHome";

export const metadata: Metadata = {
  title: "Google",
};

export default function Page() {
  return <GoogleHome />;
}
