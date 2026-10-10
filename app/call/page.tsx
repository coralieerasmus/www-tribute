import type { Metadata } from "next";
import ZoomCall from "@/components/zoom/ZoomCall";

export const metadata: Metadata = {
  title: "Zoom Meeting",
};

export default function Page() {
  return <ZoomCall />;
}
