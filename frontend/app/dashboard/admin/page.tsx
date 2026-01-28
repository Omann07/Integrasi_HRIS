"use client";

import { useEffect, useState } from "react";
import Card from "@/components/card";
import { Users, CheckSquare, Mail, XCircle, ClipboardClock } from "lucide-react";
import { dashboardService } from "@/lib/dashboard/dashboardService";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await dashboardService.getAdminDashboard();
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!data) return <div className="p-10 text-center text-red-500">Company not found.</div>;

  return (
    <div className="dashboard-container p-6">
      {/* Cards */}
      <div className="dashboard-grid grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card title="Total" value={data.summary?.totalEmployees || 0} color="bg-blue-100" icon={<Users />} />
        <Card title="On Time" value={data.summary?.onTime || 0} color="bg-purple-100" icon={<CheckSquare />} />
        <Card title="Late" value={data.summary?.late || 0} color="bg-yellow-100" icon={<ClipboardClock />} />
        <Card title="Leave" value={data.summary?.leave || 0} color="bg-green-100" icon={<Mail />} />
        <Card title="Alpha" value={data.summary?.alpha || 0} color="bg-red-100" icon={<XCircle />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Kolom Leave - Sekarang aman dari error undefined */}
        <div className="table-box border p-4 rounded bg-white">
          <h4 className="font-bold text-green-700 mb-2">Leave/Sick</h4>
          <ol className="text-sm">
            {data.refinedLists?.leave?.map((item: any, i: number) => (
              <li key={i}>{i + 1}. {item.employee?.fullName || "No Name"}</li>
            ))}
            {(!data.refinedLists?.leave || data.refinedLists.leave.length === 0) && (
              <li className="text-gray-400 italic">Tidak ada data</li>
            )}
          </ol>
        </div>

        {/* Kolom Alpha */}
        <div className="table-box border p-4 rounded bg-white">
          <h4 className="font-bold text-red-600 mb-2">Alpha</h4>
          <ol className="text-sm">
            {data.refinedLists?.alpha?.map((emp: any, i: number) => (
              <li key={i}>{i + 1}. {emp.fullName}</li>
            ))}
          </ol>
        </div>

        {/* Kolom OnTime */}
        <div className="table-box border p-4 rounded bg-white">
          <h4 className="font-bold text-purple-600 mb-2">On Time</h4>
          <ol className="text-sm">
            {data.refinedLists?.onTime?.map((emp: any, i: number) => (
              <li key={i}>{i + 1}. {emp.fullName}</li>
            ))}
          </ol>
        </div>

        {/* Kolom Late */}
        <div className="table-box border p-4 rounded bg-white">
          <h4 className="font-bold text-orange-600 mb-2">Late</h4>
          <ol className="text-sm">
            {data.refinedLists?.late?.map((emp: any, i: number) => (
              <li key={i}>{i + 1}. {emp.fullName}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}