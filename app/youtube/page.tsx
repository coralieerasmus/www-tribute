import type { Metadata } from "next";
import YouTubePage from "@/components/youtube/YouTubePage";

export const metadata: Metadata = {
  title: "Rick Astley - Never Gonna Give You Up (Official Video) - YouTube",
};

export default function Page() {
  return <YouTubePage />;
}
