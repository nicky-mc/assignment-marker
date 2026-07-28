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
        <header className="px-6 py-4">
          <Logo />
        </header>
        {children}
      </body>
    </html>
  );
}
