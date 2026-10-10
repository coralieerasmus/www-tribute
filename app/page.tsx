"use client";

import { useState } from "react";
import "./retro.css";
import type { Screen } from "./screens/shared";
import Instructions from "./screens/Instructions";
import GoogleSearch from "./screens/GoogleSearch";
import GoogleResults from "./screens/GoogleResults";
import PizzaHut from "./screens/PizzaHut";

/* This file only decides which screen to show.
   Every screen lives in its own file in app/screens/ */
export default function Home() {
  const [screen, setScreen] = useState<Screen>("instructions");

  if (screen === "google") return <GoogleSearch goTo={setScreen} />;
  if (screen === "results") return <GoogleResults goTo={setScreen} />;
  if (screen === "pizzahut") return <PizzaHut />;
  return <Instructions goTo={setScreen} />;
}
