import type { Metadata } from "next";
import ApplePage from "@/components/apple/ApplePage";
import Timeline from "@/components/Timeline";

export const metadata: Metadata = {
  title: "iPhone - Store",
};

export default function Page() {
  return (
    <>
      <ApplePage />
      <Timeline era="apple" />
    </>
  );
}