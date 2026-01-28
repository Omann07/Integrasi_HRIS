"use client";

import React, { useEffect, useState } from "react";
import { CirclePlus, Eye, Pencil, Trash2 } from "lucide-react";

// Import Services
import {
  getMyLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  cancelLeaveRequest,
} from "@/lib/leave/leaveRequestService";
import { getLeaveTypes } from "@/lib/leave/leaveTypeService";
import { getEmployeeProfile } from "@/lib/auth/authService"; // Import profil service

// Import Types
import { LeaveTypeUI } from "@/lib/leave/leaveTypeMapper";
import { LeaveEmployeeUI } from "@/lib/leave/leaveRequestMapper";

type LeaveFormState = {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  attachment: File | null;
};

export default function LeavesEmployeePage(): JSX.Element {
  const [leaves, setLeaves] = useState<LeaveEmployeeUI[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeUI[]>([]);
  const [employeeName, setEmployeeName] = useState<string>(""); // State untuk nama otomatis

  const [addModal, setAddModal] = useState<boolean>(false);
  const [editModal, setEditModal] = useState<boolean>(false);
  const [viewModal, setViewModal] = useState<boolean>(false);
  const [selected, setSelected] = useState<LeaveEmployeeUI | null>(null);

  const [form, setForm] = useState<LeaveFormState>({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
    attachment: null,
  });

  useEffect(() => {
    fetchLeaves();
    fetchLeaveTypes();
    fetchProfile(); // Ambil nama saat page load
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getEmployeeProfile();
      
      // Berdasarkan hasil .rest Anda:
      // Nama ada di: res.user.Employee[0].fullName
      if (res.status && res.user && res.user.Employee && res.user.Employee.length > 0) {
        setEmployeeName(res.user.Employee[0].fullName);
      } else if (res.user?.name) {
        // Fallback ke res.user.name jika array Employee kosong
        setEmployeeName(res.user.name);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setEmployeeName("Error Loading Name");
    }
  };

  const fetchLeaves = async () => {
    const data = await getMyLeaveRequests();
    setLeaves(data);
  };

  const fetchLeaveTypes = async () => {
    const data = await getLeaveTypes();
    setLeaveTypes(data);
  };

  // Cari fungsi handleCreate di page.tsx Anda dan ganti dengan ini:

const handleCreate = async () => {
  // 1. Validasi Client-side sederhana
  if (!form.leaveTypeId || !form.startDate || !form.endDate || !form.reason) {
    alert("Harap isi semua kolom yang wajib diisi.");
    return;
  }

  if (new Date(form.endDate) < new Date(form.startDate)) {
    alert("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
    return;
  }

  try {
    const fd = new FormData();
    fd.append("leaveTypeId", form.leaveTypeId);
    fd.append("startDate", form.startDate);
    fd.append("endDate", form.endDate);
    fd.append("reason", form.reason);
    if (form.attachment) fd.append("attachment", form.attachment);

    await createLeaveRequest(fd);
    
    // Reset form dan tutup modal jika sukses
    setAddModal(false);
    setForm({ leaveTypeId: "", startDate: "", endDate: "", reason: "", attachment: null });
    fetchLeaves();
    alert("Pengajuan cuti berhasil dikirim!");

  } catch (err: any) {
    // 2. Menangkap pesan error spesifik dari Backend (Controller)
    const backendMessage = err.response?.data?.message;
    
    if (backendMessage) {
      alert(`Gagal: ${backendMessage}`);
    } else {
      alert("Terjadi kesalahan koneksi ke server.");
    }
    
    console.error("Detail Error:", err.response?.data);
  }
};

  const handleUpdate = async () => {
    if (!selected) return;
    try {
      const fd = new FormData();
      fd.append("leaveTypeId", form.leaveTypeId);
      fd.append("startDate", form.startDate);
      fd.append("endDate", form.endDate);
      fd.append("reason", form.reason);
      if (form.attachment) fd.append("attachment", form.attachment);

      await updateLeaveRequest(selected.id, fd);
      setEditModal(false);
      fetchLeaves();
    } catch (err) {
      alert("Failed to update leave request");
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this request?")) return;
    await cancelLeaveRequest(id);
    fetchLeaves();
  };

  const statusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "approved") return <span className="bg-green-100 text-green-700 px-4 py-1 rounded-md text-sm font-medium">Approved</span>;
    if (s === "rejected") return <span className="bg-red-100 text-red-700 px-4 py-1 rounded-md text-sm font-medium">Rejected</span>;
    return <span className="bg-yellow-100 text-yellow-700 px-4 py-1 rounded-md text-sm font-medium">Pending</span>;
  };

  return (
    <div className="p-6">
      <div className="card border border-gray-200 shadow-sm bg-white rounded-lg">
        <div className="flex justify-between items-center px-5 py-4 border-b">
          <h2 className="text-lg font-bold text-black">Leaves Information</h2>
          <button
            onClick={() => {
              setForm({ leaveTypeId: "", startDate: "", endDate: "", reason: "", attachment: null });
              setAddModal(true);
            }}
            className="flex items-center font-bold px-4 py-2 rounded-md text-white bg-[#2D8EFF]"
          >
            <CirclePlus className="w-4 h-4 mr-2" /> Add Data
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm text-center">
            <thead>
              <tr className="text-white font-bold bg-[#1D3A5E]">
                <th className="p-3 border">No.</th>
                <th className="p-3 border">Leave Type</th>
                <th className="p-3 border">Start Date</th>
                <th className="p-3 border">End Date</th>
                <th className="p-3 border">Total Days</th>
                <th className="p-3 border">Status</th>
                <th className="p-3 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((item, i) => (
                <tr key={item.id} className="border hover:bg-gray-50 transition">
                  <td className="p-3 border">{i + 1}</td>
                  <td className="p-3 border">{item.type}</td>
                  <td className="p-3 border">{item.start}</td>
                  <td className="p-3 border">{item.end}</td>
                  <td className="p-3 border">{item.days}</td>
                  <td className="p-3 border">{statusBadge(item.status)}</td>
                  <td className="p-3 border">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => { setSelected(item); setViewModal(true); }} className="p-2 rounded bg-blue-500 text-white"><Eye size={14} /></button>
                      {item.status === "pending" && (
                        <>
                          <button 
                            onClick={() => { 
                              setSelected(item); 
                              setForm({ 
                                leaveTypeId: String(item.leaveTypeId), // Menggunakan ID yang sudah di-map
                                startDate: item.start, 
                                endDate: item.end, 
                                reason: item.reason, 
                                attachment: null 
                              }); 
                              setEditModal(true); 
                            }} 
                            className="p-2 rounded bg-yellow-500 text-white"
                          >
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleCancel(item.id)} className="p-2 rounded bg-red-700 text-white"><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* VIEW MODAL */}
        {viewModal && selected && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-[900px] shadow-xl overflow-hidden">
              <div className="px-8 py-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-black">View Request Leave</h2>
                <button onClick={() => setViewModal(false)} className="text-gray-400 hover:text-black text-2xl">&times;</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 p-10 gap-10">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <label className="block mb-1 font-bold text-sm text-black">Employee Name</label>
                    <div className="w-full border border-gray-200 rounded-md h-12 px-4 flex items-center bg-gray-50">
                      {employeeName}
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-sm text-black">Leave Type</label>
                    <div className="w-full border border-gray-200 rounded-md h-12 px-4 flex items-center bg-gray-50">
                      {selected.type}
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-sm text-black">Date (Start - End)</label>
                    <div className="w-full border border-gray-200 rounded-md h-12 px-4 flex items-center bg-gray-50">
                      {selected.start} — {selected.end}
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-sm text-black">Status</label>
                    <div className="mt-1">{statusBadge(selected.status)}</div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div>
                    <label className="block mb-1 font-bold text-sm text-black">Reason</label>
                    <div className="w-full border border-gray-200 rounded-md min-h-[100px] p-4 bg-gray-50">
                      {selected.reason}
                    </div>
                  </div>
                  
                  {/* Alasan Penolakan (Hanya muncul jika rejected) */}
                  {selected.status === "rejected" && (
                    <div>
                      <label className="block mb-1 font-bold text-sm text-red-600">Rejection Reason</label>
                      <div className="w-full border border-red-200 rounded-md p-4 bg-red-50 text-red-700">
                        {selected.rejectedReason}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block mb-1 font-bold text-sm text-black">Attachment</label>
                    <div className="mt-2 border border-gray-200 rounded-md p-2 bg-gray-50 flex justify-center">
                      {selected.attachment && selected.attachment !== "/no-image.png" ? (
                        <img 
                          src={selected.attachment} 
                          alt="Attachment" 
                          className="max-h-40 object-contain rounded"
                        />
                      ) : (
                        <span className="text-gray-400 text-sm py-4">No attachment provided</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end px-10 py-8 border-t bg-gray-50">
                <button 
                  onClick={() => setViewModal(false)} 
                  className="px-10 py-2.5 bg-[#1D3A5E] text-white rounded-lg font-bold hover:bg-opacity-90 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ADD / EDIT MODAL */}
        {(addModal || editModal) && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-[900px] shadow-xl overflow-hidden">
              <div className="px-8 py-6 border-b">
                <h2 className="text-xl font-bold text-black">{addModal ? "Add Request Leave" : "Edit Request Leave"}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 p-10 gap-10">
                <div className="space-y-6">
                  <div>
                    <label className="block mb-2 font-bold text-sm text-black">Employee Name</label>
                    <div className="w-full border border-gray-300 rounded-md h-12 px-4 flex items-center bg-gray-50 text-gray-500">
                      {employeeName} {/* Otomatis Terisi */}
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 font-bold text-sm text-black">Leave Type</label>
                    <select
                      className="w-full border border-gray-300 rounded-md h-12 px-4 bg-white focus:ring-1 focus:ring-blue-500"
                      value={form.leaveTypeId}
                      onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
                    >
                      <option value="">Select Leave Type</option>
                      {leaveTypes.map((lt) => (
                        <option key={lt.id} value={lt.id}>{lt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 font-bold text-sm text-black">Date (Start - End)</label>
                    <div className="flex items-center gap-3">
                      <input type="date" className="flex-1 border border-gray-300 rounded-md h-12 px-3" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                      <span className="text-gray-400">—</span>
                      <input type="date" className="flex-1 border border-gray-300 rounded-md h-12 px-3" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block mb-2 font-bold text-sm text-black">Reason</label>
                    <textarea 
                      className="w-full border border-gray-300 rounded-md min-h-[100px] p-4" 
                      value={form.reason} 
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-bold text-sm text-black">Attachment</label>
                    <input type="file" onChange={(e) => setForm({ ...form, attachment: e.target.files?.[0] || null })} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 px-10 py-10 border-t">
                <button onClick={() => { setAddModal(false); setEditModal(false); }} className="px-10 py-2.5 border-2 border-[#1D3A5E] text-[#1D3A5E] rounded-lg font-bold">Cancel</button>
                <button onClick={addModal ? handleCreate : handleUpdate} className="px-12 py-2.5 bg-[#1D3A5E] text-white rounded-lg font-bold">{addModal ? "Add" : "Save"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}