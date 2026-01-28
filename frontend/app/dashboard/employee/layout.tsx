import Sidebar from "@/components/sidebaremployee";
import Navbar from "@/components/navbar";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar untuk employee */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Navbar hanya satu */}
        <Navbar role="employee" />
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
