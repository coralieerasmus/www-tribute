import type { Metadata } from "next";
import ZoomCall from "@/components/zoom/ZoomCall";
import Timeline from "@/components/Timeline";

export const metadata: Metadata = {
  title: "Zoom Meeting",
};

export default function Page() {
  return (
    <>
      <ZoomCall />
      {/* sits just above the Zoom toolbar */}
      <Timeline era="call" offset={66} />
    </>
  );
}