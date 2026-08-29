import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Myanmar } from "next/font/google";
import "./globals.css";
import { ServiceWorker } from "@/components/ServiceWorker";
import { LanguageProvider } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const myanmar = Noto_Sans_Myanmar({
  subsets: ["myanmar"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-myanmar",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pyan Thone — Trusted second-hand marketplace",
  description:
    "Give your belongings a new life. Buy and sell trusted second-hand products with condition transparency and verified seller trust.",
  manifest: "/manifest.webmanifest",
  applicationName: "Pyan Thone",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Pyan Thone" },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${myanmar.variable}`}>
      <body className="min-h-dvh antialiased">
        <LanguageProvider>
          {children}
          <ServiceWorker />
        </LanguageProvider>
      </body>
    </html>
  );
}
