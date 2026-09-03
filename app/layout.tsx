import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import "./globals.css";
import "@xyflow/react/dist/style.css";

const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], display: "swap" });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], display: "swap" });
const jetBrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "AIssessor / Market Lab", template: "%s | AIssessor" },
  description: "An interactive TAM, SAM, SOM, ARPU, ARR, and unit economics model for the AIssessor MVP.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "AIssessor / Market Lab — make the market case.",
    description: "Live, editable market sizing and revenue planning for the AIssessor MVP.",
  },
  twitter: { card: "summary" },
};

const themeScript = `
  (function() {
    try {
      const savedTheme = localStorage.getItem('theme');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const activeTheme = (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : (systemDark ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', activeTheme);

      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (!localStorage.getItem('theme')) {
          document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
      });
    } catch(e) {}
  })()
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${spaceGrotesk.variable} ${dmSans.variable} ${jetBrainsMono.variable}`}>
        <Providers>
          <AnalyticsTracker />
          {children}
        </Providers>
      </body>
    </html>
  );
}
