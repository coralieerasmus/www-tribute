import type { Metadata } from "next";
import ApplePage from "@/components/apple/ApplePage";

export const metadata: Metadata = {
  title: "Mac - Store",
};

export default function Page() {
  return <ApplePage />;
}
