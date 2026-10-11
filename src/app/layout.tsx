import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f17" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://tooltiva.net"),
  title: {
    default: "Tooltiva - Free, Fast, Privacy-First Online Tools",
    template: "%s | Tooltiva",
  },
  description:
    "Free, fast, and privacy-first online tools for developers and creators. Process CSV, JSON, and files 100% in your browser. Zero server uploads.",
  applicationName: "Tooltiva",
  authors: [{ name: "CodingTangent" }],
  generator: "Next.js",
  keywords: [
    "online tools",
    "developer tools",
    "csv delimiter converter",
    "csv to json",
    "json formatter",
    "privacy-first web tools",
    "client-side utilities",
  ],
  referrer: "origin-when-cross-origin",
  creator: "CodingTangent",
  publisher: "CodingTangent",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tooltiva.net",
    siteName: "Tooltiva",
    title: "Tooltiva - Free, Fast, Privacy-First Online Tools",
    description:
      "Developer utilities that process CSV and JSON locally in your browser without uploading tool content.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tooltiva - Free, Fast, Privacy-First Online Tools",
    description: "Fast developer tools that process CSV and JSON in your browser.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased min-h-screen flex flex-col font-sans transition-colors selection:bg-brand-500 selection:text-white">
        <Header />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
