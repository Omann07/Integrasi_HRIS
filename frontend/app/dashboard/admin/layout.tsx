"use client";

import Sidebar from "@/components/sidebaradmin";
import Navbar from "@/components/navbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar hanya satu kali di layout */}
      <Sidebar />

      {/* Konten utama */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Navbar hanya sekali dan berlaku untuk semua halaman admin */}
        <Navbar role="admin" />

        {/* Halaman utama */}
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
