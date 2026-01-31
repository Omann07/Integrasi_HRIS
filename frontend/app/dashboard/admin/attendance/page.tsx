"use client";

import React, { useEffect, useState } from "react";
import { Eye, Plus, X, Trash2, Pencil, Trash, Edit } from "lucide-react";
import {
  getAttendancesAdmin,
  updateAttendanceStatus,
  createAttendanceByAdmin,
  deleteAttendance,
  updateAttendance,
} from "@/lib/attendance/attendanceService";
import { getEmployees } from "@/lib/employee/employeeService";
import { AttendanceUI } from "@/lib/attendance/attendanceMapper";

export default function AttendanceAdminPage() {
  const [attendanceList, setAttendanceList] = useState<AttendanceUI[]>([]);
  const [employeeList, setEmployeeList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // --- State Modals ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<AttendanceUI | null>(null);

  // --- State Form ---
  const [formData, setFormData] = useState({
    employeeId: "",
    date: "",
    checkInTime: "",
    checkOutTime: "",
    workType: "WFO",
    attendanceStatus: "ONTIME",
    approvalStatus: "APPROVED",
  });

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

  /* ================= HANDLERS ================= */

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedId(null);
    setFormData({
      employeeId: "",
      date: "",
      checkInTime: "",
      checkOutTime: "",
      workType: "WFO",
      attendanceStatus: "ONTIME",
      approvalStatus: "APPROVED",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AttendanceUI) => {
    setIsEditMode(true);
    setSelectedId(item.id);
    setFormData({
      employeeId: String(item.employeeId),
      date: item.rawDate || "",
      checkInTime: item.checkInTime !== "-" ? item.checkInTime : "",
      checkOutTime: item.checkOutTime !== "-" ? item.checkOutTime : "",
      workType: item.workType,
      attendanceStatus: item.attendanceStatus,
      approvalStatus: item.approvalStatus,
    });
    setIsModalOpen(true);
  };

  const handleOpenDetail = (item: AttendanceUI) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const approveFast = async (item: AttendanceUI) => {
    if (confirm(`Approve absensi ${item.fullName}?`)) {
      try {
        await updateAttendanceStatus(item.id, "APPROVED");
        fetchInitialData();
      } catch (error) { alert("Gagal approve"); }
    }
  };

  const rejectFast = async (item: AttendanceUI) => {
    if (confirm(`Reject absensi ${item.fullName}?`)) {
      try {
        await updateAttendanceStatus(item.id, "REJECTED");
        fetchInitialData();
      } catch (error) { alert("Gagal reject"); }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus data absensi ini?")) return;
    try {
      await deleteAttendance(id);
      fetchInitialData();
    } catch (error) { alert("Gagal menghapus"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const combineDateTime = (timeStr: string) => {
        if (!timeStr) return null;
        return `${formData.date}T${timeStr}:00.000Z`;
      };

      if (isEditMode && selectedId) {
        const payload = {
          checkInTime: combineDateTime(formData.checkInTime),
          checkOutTime: combineDateTime(formData.checkOutTime),
          workType: formData.workType,
          attendanceStatus: formData.attendanceStatus,
          approvalStatus: formData.approvalStatus,
        };
        await updateAttendance(selectedId, payload);
        alert("Data diperbarui!");
      } else {
        const fd = new FormData();
        fd.append("employeeId", formData.employeeId);
        fd.append("date", formData.date);
        fd.append("checkInTime", combineDateTime(formData.checkInTime) || "");
        fd.append("checkOutTime", combineDateTime(formData.checkOutTime) || "");
        fd.append("workType", formData.workType);
        fd.append("attendanceStatus", formData.attendanceStatus);
        fd.append("approvalStatus", formData.approvalStatus);
        await createAttendanceByAdmin(fd);
        alert("Data ditambahkan!");
      }
      setIsModalOpen(false);
      fetchInitialData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Terjadi kesalahan");
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Attendance Management</h2>
          <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-sm transition">
            <Plus size={18} /> Add Attendance
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              {/* Warna disamakan dengan Employee Page: Blue 600 */}
              <tr className="text-white text-center font-bold" style={{ background: "var(--color-primary, #2563eb)" }}>
                <th className="p-3 border">No</th>
                <th className="p-3 border text-left">Name</th>
                <th className="p-3 border">Date</th>
                <th className="p-3 border">Check In</th>
                <th className="p-3 border">Check Out</th>
                <th className="p-3 border">Work Type</th>
                <th className="p-3 border">Attendance</th>
                <th className="p-3 border">Status</th>
                <th className="p-3 border text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {attendanceList.map((item, index) => (
                <tr key={item.id} className="bg-white border-b border-gray-200 hover:bg-gray-50 transition text-center">
                  <td className="p-3 border text-gray-500">{index + 1}</td>
                  <td className="p-3 border text-left font-semibold">{item.fullName}</td>
                  <td className="p-3 border">{item.date}</td>
                  <td className="p-3 border">{item.checkInTime || "-"}</td>
                  <td className="p-3 border">{item.checkOutTime || "-"}</td>
                  <td className="p-3 border">{item.workType}</td>
                  <td className="p-3 border">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase ${item.attendanceStatus === "ONTIME" ? "bg-green-100 text-green-700 border-green-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"}`}>
                      {item.attendanceStatus}
                    </span>
                  </td>
                  <td className="p-3 border">
                    <div className="flex justify-center items-center gap-2">
                      {item.approvalStatus === "PENDING" ? (
                        <div className="flex gap-1">
                          <button onClick={() => rejectFast(item)} className="w-7 h-7 flex items-center justify-center rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100">✖</button>
                          <button onClick={() => approveFast(item)} className="w-7 h-7 flex items-center justify-center rounded border border-green-200 bg-green-50 text-green-600 hover:bg-green-100">✔</button>
                        </div>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${item.approvalStatus === "APPROVED" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}`}>
                          {item.approvalStatus}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 border text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleOpenDetail(item)} className="p-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition shadow-sm">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleOpenEdit(item)} className="p-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 transition shadow-sm">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 rounded bg-red-700 text-white hover:bg-red-800 transition shadow-sm">
                        <Trash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- MODAL ADD / EDIT --- */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800">{isEditMode ? "Edit Attendance" : "Add Attendance"}</h3>
                <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Form fields... sama seperti sebelumnya */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Employee</label>
                  <select required disabled={isEditMode} value={formData.employeeId} className="w-full mt-1 border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" onChange={(e) => setFormData({...formData, employeeId: e.target.value})}>
                    <option value="">-- Choose Employee --</option>
                    {employeeList.map((emp) => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                      <input type="date" required value={formData.date} className="w-full mt-1 border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setFormData({...formData, date: e.target.value})} />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Work Type</label>
                      <select value={formData.workType} className="w-full mt-1 border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setFormData({...formData, workType: e.target.value})}>
                        <option value="WFO">WFO</option>
                        <option value="WFA">WFA</option>
                      </select>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Check In</label>
                    <input type="time" value={formData.checkInTime} className="w-full mt-1 border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setFormData({...formData, checkInTime: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Check Out</label>
                    <input type="time" value={formData.checkOutTime} className="w-full mt-1 border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setFormData({...formData, checkOutTime: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Attendance</label>
                    <select value={formData.attendanceStatus} className="w-full mt-1 border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setFormData({...formData, attendanceStatus: e.target.value})}>
                      <option value="ONTIME">ONTIME</option>
                      <option value="LATE">LATE</option>
                      <option value="ABSENT">ABSENT</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Approval</label>
                    <select value={formData.approvalStatus} className="w-full mt-1 border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setFormData({...formData, approvalStatus: e.target.value})}>
                      <option value="PENDING">PENDING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-6 border-t border-gray-100 mt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-100 transition">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:brightness-110 transition active:scale-95">
                    {loading ? "Saving..." : isEditMode ? "Update" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL DETAIL --- */}
        {isDetailOpen && selectedItem && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
                <h3 className="text-xl font-bold">Attendance Detail</h3>
                <button onClick={() => setIsDetailOpen(false)}><X size={24} className="text-gray-400" /></button>
              </div>
              <div className="p-8 space-y-4">
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Karyawan</label>
                    <p className="font-semibold text-gray-800">{selectedItem.fullName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">ID</label>
                    <p className="font-semibold text-gray-800">{selectedItem.employeeCode}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lokasi & Jarak</label>
                  <p className="font-semibold text-gray-800">{selectedItem.locationStatus} ({selectedItem.distance || '0 km'})</p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">Bukti Foto</p>
                  {selectedItem.proofUrl ? (
                    <img src={selectedItem.proofUrl} alt="Proof" className="max-h-60 rounded-xl mx-auto border-4 border-white shadow-lg" />
                  ) : (
                    <p className="text-gray-500 italic text-center text-sm py-4">No proof image available</p>
                  )}
                </div>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
                <button onClick={() => setIsDetailOpen(false)} className="px-10 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition">Tutup</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}