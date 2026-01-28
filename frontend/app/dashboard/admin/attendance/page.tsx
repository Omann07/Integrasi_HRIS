"use client";

import React, { useEffect, useState } from "react";
import { Eye, Plus, X } from "lucide-react";
import {
  getAttendancesAdmin,
  updateAttendanceStatus,
  createAttendanceByAdmin,
} from "@/lib/attendance/attendanceService";
import { getEmployees } from "@/lib/employee/employeeService"; // Pastikan service ini sudah ada
import { AttendanceUI } from "@/lib/attendance/attendanceMapper";

export default function AttendanceAdminPage() {
  const [attendanceList, setAttendanceList] = useState<AttendanceUI[]>([]);
  const [employeeList, setEmployeeList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // --- State Modal & Form ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    date: "",
    checkInTime: "",
    checkOutTime: "",
    workType: "WFO",
    attendanceStatus: "ONTIME",
    approvalStatus: "APPROVED",
  });

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [attendances, employeesData] = await Promise.all([
        getAttendancesAdmin(),
        getEmployees(),
      ]);
      setAttendanceList(attendances);
      setEmployeeList(employeesData.data || employeesData);
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendances = async () => {
    try {
      const data = await getAttendancesAdmin();
      setAttendanceList(data);
    } catch (error) {
      console.error("Failed fetch attendance:", error);
    }
  };

  /* ================= HANDLERS ================= */
  const approveAttendance = async (item: AttendanceUI) => {
    if (item.approvalStatus !== "PENDING") return;
    const confirmApprove = confirm(`Approve attendance for ${item.fullName}?`);
    if (!confirmApprove) return;
    await updateAttendanceStatus(item.id, "APPROVED");
    fetchAttendances();
  };

  const rejectAttendance = async (item: AttendanceUI) => {
    if (item.approvalStatus !== "PENDING") return;
    const confirmReject = confirm(`Reject attendance for ${item.fullName}?`);
    if (!confirmReject) return;
    await updateAttendanceStatus(item.id, "REJECTED");
    fetchAttendances();
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!formData.employeeId || !formData.date) {
    return alert("Employee and Date are required!");
  }

  setLoading(true);
  try {
    const data = new FormData();
    data.append("employeeId", formData.employeeId);
    data.append("date", formData.date); 

    // Helper untuk menggabungkan Tanggal + Jam agar menjadi format ISO yang valid
    const combineDateAndTime = (timeStr: string) => {
      if (!timeStr) return ""; // Kirim string kosong jika tidak diisi
      // Menghasilkan format: 2026-01-27T08:00:00.000Z
      return `${formData.date}T${timeStr}:00.000`;
    };

    data.append("checkInTime", combineDateAndTime(formData.checkInTime));
    data.append("checkOutTime", combineDateAndTime(formData.checkOutTime));
    data.append("workType", formData.workType);
    data.append("attendanceStatus", formData.attendanceStatus);
    data.append("approvalStatus", formData.approvalStatus);

    await createAttendanceByAdmin(data);
    
    alert("Attendance added successfully!");
    setIsModalOpen(false);
    
    // Refresh data tabel
    fetchInitialData();
    
    // Reset Form
    setFormData({
      employeeId: "",
      date: "",
      checkInTime: "",
      checkOutTime: "",
      workType: "WFO",
      attendanceStatus: "ONTIME",
      approvalStatus: "APPROVED",
    });

  } catch (error: any) {
    console.error("Submit Error:", error);
    alert("Error: " + (error.response?.data?.message || "Internal Server Error"));
  } finally {
    setLoading(false);
  }
};

  /* ================= RENDER ================= */
return (
    <div className="p-6 dashboard-container bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm p-6">
        
        {/* Header dengan Tombol Tambah */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Attendance Information</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium shadow-sm"
          >
            <Plus size={18} /> Add Attendance
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr
                className="text-white text-center font-bold"
                style={{ background: "var(--color-primary)" }}
              >
                <th className="p-3 border">No</th>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Employee ID</th>
                <th className="p-3 border">Company</th>
                <th className="p-3 border">Shift</th>
                <th className="p-3 border">Date</th>
                <th className="p-3 border">Check In</th>
                <th className="p-3 border">Check Out</th>
                <th className="p-3 border">Work Type</th>
                <th className="p-3 border">Location</th>
                <th className="p-3 border">Distance</th>
                <th className="p-3 border">Attendance</th>
                <th className="p-3 border">Proof</th>
                <th className="p-3 border">Status</th>
              </tr>
            </thead>

            <tbody>
              {attendanceList.length > 0 ? (
                attendanceList.map((item, index) => (
                  <tr
                    key={item.id}
                    className="bg-white border hover:bg-gray-50 transition text-center"
                  >
                    <td className="p-3 border">{index + 1}</td>
                    <td className="p-3 border text-left font-semibold">
                      {item.fullName}
                    </td>
                    <td className="p-3 border">{item.employeeCode}</td>
                    <td className="p-3 border">{item.companyName}</td>
                    <td className="p-3 border">{item.shiftName}</td>
                    <td className="p-3 border">{item.date}</td>
                    <td className="p-3 border">{item.checkInTime || "-"}</td>
                    <td className="p-3 border">{item.checkOutTime || "-"}</td>
                    <td className="p-3 border">{item.workType}</td>
                    <td className="p-3 border">
                      {item.locationStatus || "-"}
                    </td>
                    <td className="p-3 border">
                      {item.distance || "-"}
                    </td>

                    {/* ATTENDANCE STATUS */}
                    <td className="p-3 border">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          item.attendanceStatus === "ONTIME"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {item.attendanceStatus}
                      </span>
                    </td>

                    {/* PROOF */}
                    <td className="p-3 border">
                      {item.proofUrl ? (
                        <img
                          src={item.proofUrl}
                          className="w-10 h-10 rounded object-cover mx-auto cursor-pointer"
                        />
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* ACTION STATUS */}
                    <td className="p-3 border">
                      <div className="flex justify-center gap-2">
                        {item.approvalStatus === "PENDING" ? (
                          <>
                            <button
                              onClick={() => rejectAttendance(item)}
                              className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-red-50 text-red-600 shadow-sm"
                              title="Reject"
                            >
                              ✖
                            </button>
                            <button
                              onClick={() => approveAttendance(item)}
                              className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-green-50 text-green-600 shadow-sm"
                              title="Approve"
                            >
                              ✔
                            </button>
                          </>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                              item.approvalStatus === "APPROVED"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-red-100 text-red-700 border-red-200"
                            }`}
                          >
                            {item.approvalStatus}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={14}
                    className="p-10 text-center text-gray-400 italic"
                  >
                    {loading ? "Loading..." : "No attendance data found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ================= MODAL TAMBAH DATA (DI LUAR TABEL) ================= */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b bg-gray-50 text-gray-800">
                <h2 className="text-lg font-bold">Add Attendance</h2>
                <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Select Employee */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Employee</label>
                  <select
                    required
                    value={formData.employeeId} // Tambahkan value agar bisa di-reset
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  >
                    <option value="">-- Choose Employee --</option>
                    {employeeList.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Date */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                    <input 
                      type="date" 
                      required 
                      value={formData.date} // Tambahkan value
                      className="w-full border border-gray-300 rounded-lg p-2.5" 
                      onChange={(e) => setFormData({...formData, date: e.target.value})} 
                    />
                  </div>
                  {/* Work Type */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Work Type</label>
                    <select 
                      value={formData.workType} // Tambahkan value
                      className="w-full border border-gray-300 rounded-lg p-2.5" 
                      onChange={(e) => setFormData({...formData, workType: e.target.value})}
                    >
                      <option value="WFO">WFO</option>
                      <option value="WFA">WFA</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Check In Time</label>
                    <input 
                      type="time" 
                      value={formData.checkInTime}
                      className="w-full border border-gray-300 rounded-lg p-2.5" 
                      onChange={(e) => setFormData({...formData, checkInTime: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Check Out Time</label>
                    <input 
                      type="time" 
                      value={formData.checkOutTime}
                      className="w-full border border-gray-300 rounded-lg p-2.5" 
                      onChange={(e) => setFormData({...formData, checkOutTime: e.target.value})} 
                    />
                  </div>
                </div>
                {/* Letakkan ini di dalam grid atau setelah input Time di dalam Modal */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Attendance Status</label>
                  <select 
                    value={formData.attendanceStatus}
                    className="w-full border border-gray-300 rounded-lg p-2.5" 
                    onChange={(e) => setFormData({...formData, attendanceStatus: e.target.value})}
                  >
                    <option value="ONTIME">ONTIME</option>
                    <option value="LATE">LATE</option>
                    <option value="ABSENT">ABSENT</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} // Cegah double submit saat loading
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-md disabled:bg-blue-300"
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}