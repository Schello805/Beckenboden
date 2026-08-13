import type { Metadata } from "next";
import { KraftbaumApp } from "./kraftbaum-app";

export const metadata: Metadata = {
  title: "Stärke deine Mitte · Anja Schellenberger",
  description: "Deine persönliche Begleitung für Beckenboden, Kraft und Zeit für dich.",
};

export default function Home() {
  return <KraftbaumApp />;
}
