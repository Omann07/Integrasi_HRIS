"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Users,
  Clock,
  LayoutDashboard,
  CalendarDays,
  HandCoins,
  PanelLeft,
  UserCog,
  FileText,
  Layers,
  CreditCard,
  History,
  LogOut,
  NotebookText,
  Gem,
  Receipt,
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
      } bg-white h-screen shadow-md flex flex-col justify-between pb-8 transition-smooth`}
    >
      {/* Logo + Toggle */}
      <div>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <img src="/logo.png" alt="HRIS" className="h-8" />
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-gray-100 transition-smooth"
          >
            <PanelLeft className="w-6 h-6 text-[var(--color-gray-600)]" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex flex-col px-4 py-2 space-y-1">

          {/* Dashboard */}
          <Link
            href="/dashboard/admin"
            className={`flex items-center p-2 rounded-lg transition-smooth ${isActive(
              "/dashboard/admin"
            )}`}
            style={activeStyle("/dashboard/admin")}
          >
            <LayoutDashboard className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Dashboard</span>}
          </Link>

          {/* Employment */}
          {!isCollapsed && (
            <p className="mt-4 mb-1 text-xs font-semibold text-gray-400">
              Employment
            </p>
          )}
          <Link
            href="/dashboard/admin/employee"
            className={`flex items-center p-2 rounded-lg transition-smooth ${isActive(
              "/dashboard/admin/employee"
            )}`}
            style={activeStyle("/dashboard/admin/employee")}
          >
            <Users className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Employee</span>}
          </Link>

          {/* Attendance */}
          {!isCollapsed && (
            <p className="mt-4 mb-1 text-xs font-semibold text-gray-400">
              Attendance
            </p>
          )}
          <Link
            href="/dashboard/admin/attendance"
            className={`flex items-center p-2 rounded-lg transition-smooth ${isActive(
              "/dashboard/admin/attendance"
            )}`}
            style={activeStyle("/dashboard/admin/attendance")}
          >
            <Clock className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Attendance</span>}
          </Link>

          <Link
            href="/dashboard/admin/workschedule"
            className={`flex items-center p-2 rounded-lg transition-smooth ${isActive(
              "/dashboard/admin/workschedule"
            )}`}
            style={activeStyle("/dashboard/admin/workschedule")}
          >
            <CalendarDays className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Work Schedule</span>}
          </Link>

          <Link
            href="/dashboard/admin/leave-request"
            className={`flex items-center p-2 rounded-lg transition-smooth ${isActive(
              "/dashboard/admin/leave-request"
            )}`}
            style={activeStyle("/dashboard/admin/leave-request")}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Leave Request</span>}
          </Link>

          <Link
            href="/dashboard/admin/leave-type"
            className={`flex items-center p-2 rounded-lg transition-smooth ${isActive(
              "/dashboard/admin/leave-type"
            )}`}
            style={activeStyle("/dashboard/admin/leave-type")}
          >
            <NotebookText className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Leave Type</span>}
          </Link>

          <Link
            href="/dashboard/admin/shift"
            className={`flex items-center p-2 rounded-lg transition-smooth ${isActive(
              "/dashboard/admin/shift"
            )}`}
            style={activeStyle("/dashboard/admin/shift")}
          >
            <UserCog className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Shift</span>}
          </Link>

          {/* Transactions */}
          {!isCollapsed && (
            <p className="mt-4 mb-1 text-xs font-semibold text-gray-400">
              Transactions
            </p>
          )}
          <Link
            href="/dashboard/admin/subscriptions"
            className={`flex items-center p-2 rounded-lg transition-smooth ${isActive(
              "/dashboard/admin/subscriptions"
            )}`}
            style={activeStyle("/dashboard/admin/subscriptions")}
          >
            <Gem className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Subscriptions</span>}
          </Link>

          <Link
            href="/dashboard/admin/history"
            className={`flex items-center p-2 rounded-lg transition-smooth ${isActive(
              "/dashboard/admin/history"
            )}`}
            style={activeStyle("/dashboard/admin/history")}
          >
            <History className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">History</span>}
          </Link>

          <Link
            href="/dashboard/admin/billings"
            className={`flex items-center p-2 rounded-lg transition-smooth ${isActive(
              "/dashboard/admin/billings"
            )}`}
            style={activeStyle("/dashboard/admin/billings")}
          >
            <HandCoins className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3">Billings</span>}
          </Link>
        </nav>
      </div>

      {/* Upgrade Plan */}
      <Link href="/dashboard/admin/plans">
      <div className="flex justify-center w-full">
        <button
          className="
            w-[85%]
            flex
            items-center
            justify-center
            gap-2
            py-3
            rounded-xl
            font-bold
            transition-smooth
            border
          "
          style={{
            background: "#DFEDFF",
            borderColor: "#1e3a5f",
            color: "var(--color-primary)",
          }}
        >
          <Receipt className="w-5 h-5" />
          Plans
        </button>
        </div>
      </Link>
    </div>
  );
}
