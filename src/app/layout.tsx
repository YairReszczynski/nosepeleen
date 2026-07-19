import type { Metadata, Viewport } from "next";
import { Nunito, Syne } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "No Se Peleen — el amor supera las cuotas",
  description:
    "Agenda compartida de compras en cuotas para que el amor gane y la Visa no pelee.",
  applicationName: "No Se Peleen",
  appleWebApp: {
    capable: true,
    title: "No Se Peleen",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#fff8f0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${nunito.variable} ${syne.variable} h-full`}>
      <body className="min-h-full antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
