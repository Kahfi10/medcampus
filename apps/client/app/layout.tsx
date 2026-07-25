import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "MedCampus — Rekam Medis Klinik Kampus",
  description:
    "Sistem pengelolaan rekam medis klinik kampus berbasis web dengan standar keamanan DevSecOps.",
  keywords: ["rekam medis", "klinik kampus", "medcampus", "kesehatan mahasiswa"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
