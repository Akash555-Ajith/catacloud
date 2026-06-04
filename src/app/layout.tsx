import type { Metadata } from "next";
import { Outfit, Playfair_Display, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bluefine | Premium Fish Market Catalogue",
  description: "Exquisite marine catalog for the most demanding culinary chefs. Freshly sourced seafood of unparalleled quality.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(outfit.variable, playfairDisplay.variable, "font-sans dark", geist.variable)}>
      <body style={{ fontFamily: "var(--font-outfit), sans-serif" }}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
