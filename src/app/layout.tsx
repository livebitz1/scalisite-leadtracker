import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScaliSite — Lead Tracker",
  description: "Internal lead tracking for the ScaliSite web design agency.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
