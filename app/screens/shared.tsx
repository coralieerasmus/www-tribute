"use client";

import { useEffect, useRef, type ImgHTMLAttributes } from "react";

/* ============================================================
   ASSETS: every image path in one place.
   Files live in public/assets/ (icons in public/assets/icons/)
   ============================================================ */
export const ASSETS = {
  wallpaper: "/assets/desktop.background.png",
  wizardImage: "/assets/wizard-globe.png",
  googleLogo: "/assets/GoogleBETA.png",
  pizzaHutLogo: "/assets/PizzaHutLOGO.png",
  sco: "/assets/SCO.png",

  desktopIcons: [
    { label: "My Computer", src: "/assets/icons/ComputerICON.png" },
    { label: "My Documents", src: "/assets/icons/DocumentsICON.png" },
    { label: "Internet Explorer", src: "/assets/icons/InternetICON.png" },
    { label: "Network Neighborhood", src: "/assets/icons/NetworkICON.png" },
    { label: "Recycle Bin", src: "/assets/icons/BinICON.png" },
  ],

  // MySpace + the "New Message" notification
  zebra: "/assets/Zebra.png",
  profilePic: "/assets/Stansino.png",
  scorpion: "/assets/lobster.png",
  friends: [
    { body: "/assets/lody-body.png", head: "/assets/lody-head.png" },
    { body: "/assets/chris-body.png", head: "/assets/chris-head.png" },
    { body: "/assets/pieter-body.png", head: "/assets/pieter-head.png" },
  ],
  banners: "/assets/banners.png",
  videoThumb: "/assets/Youtube.png",
  chatIcon: "/assets/ChatIcon.png",
  envelope: "/assets/Envelope.png",
};

/* All screens of the website */
export type Screen =
  | "instructions"
  | "chat"
  | "google"
  | "results"
  | "pizzahut"
  | "myspace";

/* Screens get this function so they can switch to another screen */
export type GoTo = (screen: Screen) => void;

/* An <img> that hides itself if the file is missing (no broken "?" icons) */
export function Img(props: ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0)
      img.style.visibility = "hidden";
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img
      ref={ref}
      {...props}
      onError={(e) => (e.currentTarget.style.visibility = "hidden")}
    />
  );
}
