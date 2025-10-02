import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Multi-Model AI Playground",
  description: "Compare AI models in real-time with concurrent streaming",
  keywords: ["AI", "machine learning", "model comparison", "OpenAI", "Anthropic", "xAI", "streaming"],
  authors: [{ name: "AI Playground Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
