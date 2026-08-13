import type { Metadata } from "next";
import { KraftbaumApp } from "./kraftbaum-app";

// The app shell contains build-specific CSS and JavaScript URLs. It must never
// be retained across deployments by Safari, a PWA cache or a reverse proxy.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Stärke deine Mitte · Anja Schellenberger",
  description: "Deine persönliche Begleitung für Beckenboden, Kraft und Zeit für dich.",
};

export default function Home() {
  return <KraftbaumApp />;
}
