import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inconsolata, Fira_Code, Recursive } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

const geist      = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono  = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const inconsolata = Inconsolata({ variable: "--font-inconsolata", subsets: ["latin"] });
const firaCode   = Fira_Code({ variable: "--font-fira-code", subsets: ["latin"] });
const recursive  = Recursive({ variable: "--font-recursive", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Poiesis — Bring your verses to life",
  description: "Polish your poem. Illustrate it. Narrate it. Present it.",
  icons: { apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Poiesis' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={[
        geist.variable, geistMono.variable,
        inconsolata.variable, firaCode.variable, recursive.variable,
        "h-full antialiased dark",
      ].join(" ")}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
