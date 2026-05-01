import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreaFix Chatbot Platform",
  description: "Plateforme de chatbots IA pour entreprises",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-black font-mono">
        {children}
      </body>
    </html>
  );
}
