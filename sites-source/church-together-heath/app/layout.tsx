import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Church Together | Cumberland Gap Baptist Association",
  description: "Shared association missions and local church ministry workspaces.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
