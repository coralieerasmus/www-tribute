"use client";

import { useEffect, useState } from "react";
import "./retro.css";
import type { Screen } from "./screens/shared";
import Instructions from "./screens/Instructions";
import GoogleSearch from "./screens/GoogleSearch";
import GoogleResults from "./screens/GoogleResults";
import PizzaHut from "./screens/PizzaHut";
import MySpace from "./screens/MySpace";

const SCREENS: Screen[] = [
  "instructions",
  "google",
  "results",
  "pizzahut",
  "myspace",
];

/* This file only decides which screen to show.
   Every screen lives in its own file in app/screens/
   The current screen is saved in the address bar (e.g. localhost:3000/#pizzahut),
   so refreshing keeps you on the same screen and the back button works. */
export default function Home() {
  const [screen, setScreen] = useState<Screen | null>(null);

  useEffect(() => {
    function readAddressBar() {
      const fromUrl = window.location.hash.slice(1) as Screen;
      setScreen(SCREENS.includes(fromUrl) ? fromUrl : "instructions");
    }
    readAddressBar();
    window.addEventListener("hashchange", readAddressBar);
    return () => window.removeEventListener("hashchange", readAddressBar);
  }, []);

  function goTo(next: Screen) {
    window.location.hash = next;
  }

  if (screen === null) return null; // first split second: wait for the address bar

  if (screen === "google") return <GoogleSearch goTo={goTo} />;
  if (screen === "results") return <GoogleResults goTo={goTo} />;
  if (screen === "pizzahut") return <PizzaHut goTo={goTo} />;
  if (screen === "myspace") return <MySpace />;
  return <Instructions goTo={goTo} />;
}
