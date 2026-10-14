"use client";

import { useEffect, useState } from "react";
import "./retro.css";
import type { Screen } from "./screens/shared";
import Instructions from "./screens/Instructions";
import Chat from "./screens/Chat";
import GoogleSearch from "./screens/GoogleSearch";
import GoogleResults from "./screens/GoogleResults";
import PizzaHut from "./screens/PizzaHut";
import MySpace from "./screens/MySpace";

const SCREENS: Screen[] = [
  "instructions",
  "chat",
  "google",
  "results",
  "pizzahut",
  "myspace",
];

/* Screen quality per era: older = more pixelated, newer = sharper.
   The looks are defined in retro.css (.era-1995, .era-1997, .era-1999, .era-2006) */
const ERA_LOOK: Record<Screen, string> = {
  instructions: "era-1995",
  chat: "era-1997",
  google: "era-1999",
  results: "era-1999",
  pizzahut: "era-1999",
  myspace: "era-2006",
};

/* The mouse cursor pictures (in public/assets/cursors/) */
const CURSOR_FILES = [
  "/assets/cursors/arrow.png",
  "/assets/cursors/hand.png",
  "/assets/cursors/arrow-xp.png",
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

  // load the retro cursor pictures right away, so they never flash
  useEffect(() => {
    CURSOR_FILES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // tell the whole page which cursor to use (also while switching screens)
  useEffect(() => {
    if (screen) {
      document.documentElement.dataset.cursor =
        ERA_LOOK[screen] === "era-2006" ? "xp" : "retro";
    }
  }, [screen]);

  function goTo(next: Screen) {
    window.location.hash = next;
  }

  if (screen === null) return null; // first split second: wait for the address bar

  let content;
  if (screen === "chat") content = <Chat goTo={goTo} />;
  else if (screen === "google") content = <GoogleSearch goTo={goTo} />;
  else if (screen === "results") content = <GoogleResults goTo={goTo} />;
  else if (screen === "pizzahut") content = <PizzaHut goTo={goTo} />;
  else if (screen === "myspace") content = <MySpace />;
  else content = <Instructions goTo={goTo} />;

  return <div className={`era ${ERA_LOOK[screen]}`}>{content}</div>;
}
