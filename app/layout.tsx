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

// Hardcoded literal — no user input, not an XSS risk.
const themeScript = `(function(){try{var t=localStorage.getItem('poiesis:theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={[
        geist.variable, geistMono.variable,
        inconsolata.variable, firaCode.variable, recursive.variable,
        "h-full antialiased",
      ].join(" ")}
    >
      <head>
        {/* Apply theme before first paint — prevents flash of wrong theme */}
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
