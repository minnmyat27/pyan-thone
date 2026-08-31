import type { Metadata,Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title:{default:"Pyan Thone",template:"%s · Pyan Thone"}, description: "A trusted local second-hand marketplace",manifest:"/manifest.webmanifest",icons:{icon:"/pyan-thone-logo.svg"} };
export const viewport:Viewport={themeColor:"#2563eb",width:"device-width",initialScale:1};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
