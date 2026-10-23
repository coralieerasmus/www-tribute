import type { Metadata } from "next";
import GoogleHome from "@/components/google/GoogleHome";
import Timeline from "@/components/Timeline";

export const metadata: Metadata = {
  title: "Google",
};

export default function Page() {
  return (
    <>
      <GoogleHome />
      <Timeline era="google" placement="top" offset={12} />
    </>
  );
}