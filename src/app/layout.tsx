import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Model Tracker - AI Model Releases",
  description: "Track the latest AI model releases from OpenAI, Anthropic, Google, Meta, xAI, and more. Daily updates powered by AI research agents.",
  keywords: ["AI models", "LLM", "GPT", "Claude", "Gemini", "model releases", "benchmarks"],
  authors: [{ name: "Model Tracker" }],
  openGraph: {
    title: "Model Tracker - AI Model Releases",
    description: "Track the latest AI model releases from leading labs. Updated every 4 hours.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Model Tracker - AI Model Releases",
    description: "Track the latest AI model releases from leading labs. Updated every 4 hours.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
