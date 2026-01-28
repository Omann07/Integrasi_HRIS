"use client";

import { useEffect, useState } from "react";
import Card from "@/components/card";
import {
  Clock,
  Mail,
  XCircle,
  CheckSquare,
  ClipboardClock,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { dashboardService } from "@/lib/dashboard/dashboardService";
import { EmployeeDashboardUI } from "@/lib/dashboard/dashboardMapper";

export default function EmployeeDashboard() {
  const [data, setData] = useState<EmployeeDashboardUI | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const result =
          await dashboardService.getEmployeeDashboard();
        setData(result);
      } catch (err) {
        console.error(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-10 text-center text-red-500">
        Data tidak ditemukan
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Cards */}
      <div className="dashboard-grid">
        <Card
          title="Work Hours"
          value={data.summary.totalWorkHours}
          color="bg-blue-100"
          icon={<Clock />}
        />

        <Card
          title="On Time"
          value={data.summary.onTime}
          color="bg-purple-100"
          icon={<CheckSquare />}
        />

        <Card
          title="Late"
          value={data.summary.late}
          color="bg-yellow-100"
          icon={<ClipboardClock />}
        />

        <Card
          title="Leave/Sick"
          value={data.summary.leave}
          color="bg-green-100"
          icon={<Mail />}
        />

        <Card
          title="Alpha"
          value={data.summary.alpha}
          color="bg-red-100"
          icon={<XCircle />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Radar Chart */}
        <div className="table-box">
          <h3 className="text-lg font-bold mb-4">Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data.overviewData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis />
              <Radar
                dataKey="A"
                stroke="var(--color-primary)"
                fill="var(--color-primary)"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="table-box">
          <h3 className="text-lg font-bold mb-4">Work Hours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.workHoursData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hours" fill="var(--color-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
