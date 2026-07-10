import type { Metadata } from "next";
import { Public_Sans, Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/ui/SiteFooter";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  display: "swap",
});

const atkinsonHyperlegible = Atkinson_Hyperlegible({
  variable: "--font-atkinson-hyperlegible",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareNav — Care funding screening",
  description:
    "An educational tool that helps families identify Washington programs that may help pay for long-term care, support at home, and caregiving needs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${atkinsonHyperlegible.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
