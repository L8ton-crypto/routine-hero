import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RoutineHero — Turn Daily Routines into Epic Adventures",
  description: "Gamified routine charts for kids. Build morning, afterschool, and bedtime routines with XP, levels, streaks, and celebrations. Make habits fun!",
  keywords: ["kids routines", "habit tracker", "gamified chores", "children", "family app"],
  openGraph: {
    title: "RoutineHero — Gamified Routines for Kids",
    description: "Turn daily routines into epic adventures! XP, levels, streaks, and celebrations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.jsdelivr.net/npm/twemoji@14.0.2/dist/twemoji.min.js" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function parseEmoji() {
                if (typeof twemoji !== 'undefined') {
                  twemoji.parse(document.body, { folder: 'svg', ext: '.svg' });
                }
              }
              // Parse on load and observe DOM changes
              if (document.readyState === 'complete') parseEmoji();
              else window.addEventListener('load', parseEmoji);
              new MutationObserver(function() { parseEmoji(); }).observe(document.body, { childList: true, subtree: true });
            `,
          }}
        />
      </body>
    </html>
  );
}
