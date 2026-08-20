import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./styles/kraftbaum-scene.css";
import "./styles/admin-system.css";
import "./styles/visual-luxury.css";
import { PwaRegistration } from "./pwa-registration";
import { ConsentManager } from "./consent-manager";
import {AssetRecoveryScript} from "./asset-recovery-script";
import {configuredTimeZone} from "@/lib/timezone-settings";

export const dynamic="force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("https://app.anja-tanzt.de"),
  title: "Stärke deine Mitte · Anja Schellenberger",
  description: "Deine persönliche Begleitung für Beckenboden, Kraft und Zeit für dich.",
  openGraph: {
    title: "Stärke deine Mitte",
    description: "Deine Kraft wächst mit dir.",
    images: ["/og.png"],
    locale: "de_DE",
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  icons: {
    icon: "/logo-kraftbaum.svg",
    shortcut: "/logo-kraftbaum.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest:"/manifest.webmanifest",
};

export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover"};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" data-time-zone={configuredTimeZone()}>
      <head><AssetRecoveryScript/></head>
      <body>{children}<PwaRegistration/><ConsentManager/></body>
    </html>
  );
}
