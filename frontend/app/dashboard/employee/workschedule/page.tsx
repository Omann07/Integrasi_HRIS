"use client";

import { useEffect, useState } from "react";
import { getMyWorkScheduleEmployee } from "@/lib/workschedule/workScheduleService";
import { mapWorkScheduleEmployee } from "@/lib/workschedule/workScheduleMapper";

export default function WorkSchedulePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeeSchedule = async () => {
      try {
        const res = await getMyWorkScheduleEmployee();
        const mappedData = res.map(mapWorkScheduleEmployee);
        setData(mappedData);
      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeSchedule();
  }, []);

  if (loading) {
    return (
      <div className="p-6 dashboard-container">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 dashboard-container">
      <div className="table-box">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold card-title">
            Work Schedule Information
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr
                className="text-white text-center font-bold"
                style={{ background: "var(--color-primary)" }}
              >
                <th className="p-3 border">No.</th>
                <th className="p-3 border">Schedule Group</th>
                <th className="p-3 border">Day of Week</th>
                <th className="p-3 border">Start Time</th>
                <th className="p-3 border">Break Time</th>
                <th className="p-3 border">End Time</th>
              </tr>
            </thead>

            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-3 text-center border text-gray-500">
                    Tidak ada data jadwal kerja.
                  </td>
                </tr>
              ) : (
                data.map((item, i) => (
                  <tr key={item.id || i} className="border hover:bg-gray-100 bg-white">
                    <td className="p-3 text-center border">{i + 1}</td>
                    {/* Sekarang item.shift sudah pasti string */}
                    <td className="p-3 border text-left font-medium">{item.shift}</td>
                    <td className="p-3 text-center border">{item.dayOfWeek}</td>
                    <td className="p-3 text-center border">{item.startTime}</td>
                    <td className="p-3 text-center border">{item.breakTime}</td>
                    <td className="p-3 text-center border">{item.endTime}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}