import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://app.anja-tanzt.de"),
  title: "Mein Kraftbaum · Anja tanzt",
  description: "Deine persönliche Begleitung für Beckenboden, Kraft und Zeit für dich.",
  openGraph: {
    title: "Mein Kraftbaum",
    description: "Deine Kraft wächst mit dir.",
    images: ["/og.png"],
    locale: "de_DE",
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
