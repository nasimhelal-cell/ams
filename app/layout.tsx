import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ConfigureSWR from "@/lib/swrConfig";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AMS",
  description: "Attendance Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConfigureSWR>{children}</ConfigureSWR>
      </body>
    </html>
  );
}
