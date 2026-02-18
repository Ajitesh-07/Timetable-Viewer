import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "IITP Timetable Viewer",
  description:
    "Find your weekly class schedule, midsem and endsem exam timetables, and compare schedules with friends at IIT Patna.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#08080d" />
      </head>
      <body>
        <Navbar />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
