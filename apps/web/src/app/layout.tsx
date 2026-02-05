import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Source_Serif_4 } from "next/font/google";
import { TRPCProvider } from "@/lib/trpc";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MergeWhy - Decision Evidence System",
  description: "Capture decision-making evidence at merge time for engineering teams",
};

function hasValidClerkKeys(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(publishableKey && !publishableKey.includes("YOUR_KEY_HERE"));
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <html lang="en">
      <body
        className={`${inter.variable} ${sourceSerif.variable} font-sans antialiased`}
      >
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );

  if (!hasValidClerkKeys()) {
    return content;
  }

  return <ClerkProvider>{content}</ClerkProvider>;
}
