import type { Metadata } from "next";
import { Space_Grotesk, Lexend_Deca } from "next/font/google";
import Logo from "@/components/Logo";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const lexendDeca = Lexend_Deca({
  variable: "--font-lexend-deca",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Marking Assistant",
  description: "Assistant to help grade learner submissions against Tech Educators Rubrics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${lexendDeca.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="w-full max-w-3xl mx-auto pt-4 pb-0 pl-12 pr-6">
          <Logo />
        </header>
        {children}
      </body>
    </html>
  );
}
