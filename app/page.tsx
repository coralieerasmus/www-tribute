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

/* Screen quality per era: older = more pixelated, newer = sharper.
   The looks are defined in retro.css (.era-1995, .era-1999, .era-2006) */
const ERA_LOOK: Record<Screen, string> = {
  instructions: "era-1995",
  google: "era-1999",
  results: "era-1999",
  pizzahut: "era-1999",
  myspace: "era-2006",
};

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

  let content;
  if (screen === "google") content = <GoogleSearch goTo={goTo} />;
  else if (screen === "results") content = <GoogleResults goTo={goTo} />;
  else if (screen === "pizzahut") content = <PizzaHut goTo={goTo} />;
  else if (screen === "myspace") content = <MySpace />;
  else content = <Instructions goTo={goTo} />;

  return (
    <>
      {/* invisible "pixel" filter used by the older eras */}
      <svg
        width="0"
        height="0"
        style={{ position: "absolute" }}
        aria-hidden="true"
      >
        <filter id="pixelate" x="0" y="0" width="100%" height="100%">
          <feFlood x="1" y="1" height="1" width="1" />
          <feComposite width="2" height="2" />
          <feTile result="grid" />
          <feComposite in="SourceGraphic" in2="grid" operator="in" />
          <feMorphology operator="dilate" radius="1" />
        </filter>
      </svg>

      <div className={`era ${ERA_LOOK[screen]}`}>{content}</div>
    </>
  );
}
