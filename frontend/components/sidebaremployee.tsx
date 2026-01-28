"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Clock,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  UserCog,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path
      ? "text-white font-semibold active-link"
      : "text-[var(--color-primary)] font-semibold hover:bg-gray-100 hover:text-[var(--color-primary)]";

  const activeStyle = (path: string) =>
    pathname === path ? { background: "var(--gradient-blue)" } : {};

  return (
    <div
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } bg-white h-screen shadow-md flex flex-col justify-between transition-smooth`}
    >
      {/* Logo + Toggle */}
      <div>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <img src="/logo.png" alt="HRIS" className="h-8" />

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-gray-100 transition-smooth"
          >
            <PanelLeft className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex flex-col px-4 py-2 space-y-1">
          {/* Dashboard */}
          <Link
            href="/dashboard/employee"
            className={`flex items-center p-2 rounded-lg transition-smooth ${isActive(
              "/dashboard/employee"
            )}`}
            style={activeStyle("/dashboard/employee")}
          >
            <LayoutDashboard className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Dashboard</span>}
          </Link>

          {/* Attendance Section */}
          {!isCollapsed && (
            <p className="mt-4 mb-1 text-xs font-semibold text-gray-400">
              Attendance
            </p>
          )}

          <Link
            href="/dashboard/employee/attendance"
            className={`flex items-center p-2 rounded-lg transition-smooth ${isActive(
              "/dashboard/employee/attendance"
            )}`}
            style={activeStyle("/dashboard/employee/attendance")}
          >
            <Clock className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Attendance</span>}
          </Link>

          <Link
            href="/dashboard/employee/workschedule"
            className={`flex items-center p-2 rounded-lg transition-smooth ${isActive(
              "/dashboard/employee/workschedule"
            )}`}
            style={activeStyle("/dashboard/employee/workschedule")}
          >
            <CalendarDays className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Work Schedule</span>}
          </Link>

          <Link
            href="/dashboard/employee/leaves"
            className={`flex items-center p-2 rounded-lg transition-smooth ${isActive(
              "/dashboard/employee/leaves"
            )}`}
            style={activeStyle("/dashboard/employee/leaves")}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Leave Request</span>}
          </Link>

          <Link
            href="/dashboard/employee/shift"
            className={`flex items-center p-2 rounded-lg transition-smooth ${isActive(
              "/dashboard/employee/shift"
            )}`}
            style={activeStyle("/dashboard/employee/shift")}
          >
            <UserCog className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Shift</span>}
          </Link>
        </nav>
      </div>
    </div>
  );
}
