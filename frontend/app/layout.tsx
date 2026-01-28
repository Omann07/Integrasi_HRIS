import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

// Gunakan font Inter dari Google Fonts
const inter = Inter({ subsets: ["latin"] });

// Metadata global aplikasi
export const metadata: Metadata = {
  title: "HRIS App",
  description: "Human Resource Information System built with Next.js & Tailwind CSS",
};

// Root Layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Navbar global (opsional) */}
        {/* <header className="w-full bg-blue-600 text-white p-4 font-semibold">
          HRIS System
        </header> */}

        {/* Konten utama (semua page akan dirender di sini) */}
        <main className="min-h-screen">{children}</main>

        {/* Footer global (opsional) */}
        <footer className="w-full bg-gray-100 text-center text-sm p-4">
          © {new Date().getFullYear()} HRIS. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
