"use client";

import React, { useEffect, useState } from "react";
import { Eye, Plus, X, Camera, Trash2, Pencil, Trash, Edit } from "lucide-react";
import {
  getAttendancesAdmin,
  getAttendanceById,
  updateAttendanceStatus,
  createAttendanceByAdmin,
  deleteAttendance,
  updateAttendance,
} from "@/lib/attendance/attendanceService";
import { getEmployees } from "@/lib/employee/employeeService";
import { AttendanceUI, } from "@/lib/attendance/attendanceMapper";

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

// Pastikan getAttendanceById sudah di-import dari service
const handleOpenDetail = async (item: AttendanceUI) => {
  setLoading(true);
  try {
    // Ambil data detail terbaru yang mengandung perhitungan jarak dari backend
    const detailData = await getAttendanceById(item.id); 
    setSelectedItem(detailData);
    setIsDetailOpen(true);
  } catch (error) {
    console.error("Gagal mengambil detail:", error);
    alert("Gagal mengambil detail absensi terbaru.");
  } finally {
    setLoading(false);
  }
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
      const normalizeTime = (time: string) => {
        if (!time) return null;
        return time.length === 5 ? time : time.slice(0, 5);
      };      

      if (isEditMode && selectedId) {
        const payload = {
          checkInTime: normalizeTime(formData.checkInTime),
          checkOutTime: normalizeTime(formData.checkOutTime),
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
        fd.append("checkInTime", normalizeTime(formData.checkInTime) || "");
        fd.append("checkOutTime", normalizeTime(formData.checkOutTime) || "");
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
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
      {/* Header Modal */}
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Attendance Detail</h3>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-0.5">{selectedItem.date}</p>
        </div>
        <button onClick={() => setIsDetailOpen(false)} className="hover:bg-gray-200 p-1.5 rounded-full transition">
          <X size={24} className="text-gray-400" />
        </button>
      </div>

      {/* Body Modal */}
      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        
        {/* Section 1: Karyawan & Company */}
        <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
          <div>
            <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Employee Name</label>
            <p className="font-bold text-gray-800 leading-tight">{selectedItem.fullName}</p>
            <p className="text-xs text-blue-600 font-medium">{selectedItem.employeeCode}</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Company & Shift</label>
            <p className="font-bold text-gray-800 leading-tight">{selectedItem.companyName}</p>
            <p className="text-xs text-gray-500">{selectedItem.shiftName}</p>
          </div>
        </div>

        {/* Section 2: Time & Status */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Check In</label>
            <span className="text-lg font-bold text-green-600">{selectedItem.checkInTime || "--:--"}</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Check Out</label>
            <span className="text-lg font-bold text-red-600">{selectedItem.checkOutTime || "--:--"}</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Status</label>
            <span className={`text-xs font-black block mt-1 ${selectedItem.attendanceStatus === 'ONTIME' ? 'text-green-600' : 'text-orange-500'}`}>
              {selectedItem.attendanceStatus}
            </span>
          </div>
        </div>

        {/* Section 3: Location Detail */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Location Info</label>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-800">{selectedItem.locationStatus}</p>
                {selectedItem.distance && (
                  <span className="text-blue-600 font-bold bg-blue-100 px-2 py-0.5 rounded text-[10px]">
                    {selectedItem.distance} from office
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                Lat: {selectedItem.latitude || '-'}, Lon: {selectedItem.longitude || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Photo Proof */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Camera size={16} className="text-gray-400" />
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Photo Proof</label>
          </div>
          {selectedItem.proofUrl ? (
            <div className="relative group">
              <img 
                src={selectedItem.proofUrl} 
                alt="Attendance Proof" 
                className="w-full h-52 object-cover rounded-xl border border-gray-200 shadow-sm transition group-hover:brightness-90" 
              />
              <a 
                href={selectedItem.proofUrl} 
                target="_blank" 
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 text-white font-bold text-xs rounded-xl"
              >
                View Full Image
              </a>
            </div>
          ) : (
            <div className="w-full h-32 bg-gray-50 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 text-gray-400">
              <Camera size={32} className="mb-2 opacity-20" />
              <p className="italic text-xs">No photo proof attached</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Modal */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
        <div className="flex-1 flex items-center">
           <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
             selectedItem.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700 border-green-200' : 
             selectedItem.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' : 
             'bg-yellow-100 text-yellow-700 border-yellow-200'
           }`}>
             Status: {selectedItem.approvalStatus}
           </span>
        </div>
        <button 
          onClick={() => setIsDetailOpen(false)} 
          className="px-8 py-2.5 bg-gray-800 text-white rounded-xl font-bold shadow-lg hover:bg-gray-900 transition active:scale-95 text-sm"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
}