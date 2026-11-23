import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/fraunces/full-italic.css";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/caveat/500.css";
import "@fontsource/reenie-beanie/400.css";
import "@fontsource/shadows-into-light/400.css";
import "@fontsource/kalam/400.css";
import "./globals.css";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "24 Rotations",
  description: `24 songs, chosen by his closest friends, for ${site.recipientName}'s 24th birthday.`,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#17130f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <div className="vignette" aria-hidden />
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
