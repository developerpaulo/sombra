import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM para Venda de Sites",
  description: "Sistema para captar, analisar e organizar leads de desenvolvimento de sites."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
