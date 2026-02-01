"use client";

import React, { useEffect, useState } from "react";
import { CirclePlus, Eye, MapPin, Camera, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getAttendances,
  getAttendanceById,
  createAttendance,
} from "@/lib/attendance/attendanceService";
import { AttendanceUI } from "@/lib/attendance/attendanceMapper";

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const [attendanceData, setAttendanceData] = useState<AttendanceUI[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedRow, setSelectedRow] = useState<AttendanceUI | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  // Form states
  const [workType, setWorkType] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchAttendance();
    }, 300);
  
    return () => clearTimeout(delay);
  }, [search]);
  

  const fetchAttendance = async () => {
    const res = await getAttendances(search);
    setAttendanceData(res);
  };  

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoto(e.target.files?.[0] || null);
  };

  const handleShowDetail = async (id: number) => {
    try {
      setLoading(true);
      const detailData = await getAttendanceById(id);
      setSelectedRow(detailData);
      setShowDetail(true);
    } catch (error) {
      console.error("Failed to fetch detail", error);
      alert("Gagal mengambil detail absensi");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitError("");
      setLoading(true);

      const formData = new FormData();
      formData.append("workType", workType);
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);

      if (photo) formData.append("proof", photo);

      await createAttendance(formData);

      setShowModal(false);
      fetchAttendance();
      
      // Reset form
      setWorkType("");
      setLatitude("");
      setLongitude("");
      setPhoto(null);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Failed submit attendance";
      setSubmitError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 dashboard-container">
      {/* HEADER & TABLE SECTION - Persis Admin */}
      <div className="table-box">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold card-title">Attendance Information</h2>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-2 rounded text-white font-bold bg-[#2D8EFF] flex items-center gap-2"
          >
            <CirclePlus className="w-4 h-4" /> Add Data
          </button>
        </div>

        {/* TABLE SECTION */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="text-white text-center font-bold" style={{ background: "var(--color-primary)" }}>
                <th className="p-3 border">No.</th>
                <th className="p-3 border">Full Name</th>
                <th className="p-3 border">Employee ID</th>
                <th className="p-3 border">Date</th>
                <th className="p-3 border">In/Out</th>
                <th className="p-3 border">Status</th>
                <th className="p-3 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((row, i) => (
                <tr key={row.id} className="border hover:bg-gray-50 bg-white">
                  <td className="p-3 border text-center">{i + 1}</td>
                  <td className="p-3 border">{row.fullName}</td>
                  <td className="p-3 border text-center">{row.employeeCode}</td>
                  <td className="p-3 border text-center">{row.date}</td>
                  <td className="p-3 border text-center">
                    <span className="text-green-600 font-bold">{row.checkInTime || "--:--"}</span>
                    <span className="mx-1">/</span>
                    <span className="text-red-600 font-bold">{row.checkOutTime || "--:--"}</span>
                  </td>
                  <td className="p-3 border text-center">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${row.attendanceStatus === "ALPHA" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {row.attendanceStatus}
                    </span>
                  </td>
                  <td className="p-3 border text-center">
                  <button 
  onClick={() => handleShowDetail(row.id)} // INI BENAR (memanggil API detail)
  className="...">
  <Eye className="w-4 h-4" />
</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD MODAL - Sama persis layout Admin */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50 bg-black/50">
          <div className="modal-content max-w-3xl bg-white p-6 rounded-lg shadow-xl w-full">
            <h3 className="modal-title border-b pb-3 mb-6 font-bold text-lg">Add Attendance</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="input-label font-bold block mb-2">Work Type</label>
                  <select 
                    className="input border p-2 w-full rounded bg-white"
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="WFO">WFO (Office)</option>
                    <option value="WFA">WFA (Anywhere)</option>
                  </select>
                </div>
                <div>
                  <label className="input-label font-bold block mb-2">Proof Photo</label>
                  <input type="file" className="input border p-1 w-full rounded text-sm" onChange={handlePhoto} />
                </div>
                <div className="md:col-span-2">
                  <label className="input-label font-bold block mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" /> Location Coordinates
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      placeholder="Latitude" 
                      className="input border p-2 rounded" 
                      value={latitude} 
                      onChange={(e) => setLatitude(e.target.value)} 
                      required 
                    />
                    <input 
                      placeholder="Longitude" 
                      className="input border p-2 rounded" 
                      value={longitude} 
                      onChange={(e) => setLongitude(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
              </div>

              {submitError && <p className="text-red-500 text-xs mt-4">{submitError}</p>}

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded font-bold">Cancel</button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-4 py-2 text-white rounded font-bold" 
                  style={{ background: "var(--color-primary)" }}
                >
                  {loading ? "Saving..." : "Add Attendance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL (VIEW) */}
      {showDetail && selectedRow && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50 bg-black/50">
          <div className="modal-content max-w-lg bg-white p-6 rounded-lg shadow-xl w-full">
            <h3 className="modal-title border-b pb-3 mb-6 font-bold text-lg">Attendance Detail</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2"><strong>Employee:</strong> <span>{selectedRow.fullName} ({selectedRow.employeeCode})</span></div>
              <div className="flex justify-between border-b pb-2"><strong>Company:</strong> <span>{selectedRow.companyName}</span></div>
              <div className="flex justify-between border-b pb-2"><strong>Work Type:</strong> <span>{selectedRow.workType}</span></div>
              <div className="flex justify-between border-b pb-2">
                <strong>Location Info:</strong> 
                <span>
                  {selectedRow.locationStatus} 
                  {selectedRow.distance ? ` (${selectedRow.distance})` : ""}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2"><strong>Approval:</strong> <span className="font-bold text-blue-600">{selectedRow.approvalStatus}</span></div>
              
              <div className="mt-4">
                <strong className="block mb-2">Proof:</strong>
                {selectedRow.proofUrl ? (
                  <img src={selectedRow.proofUrl} className="w-full h-48 object-cover rounded-lg border" alt="proof" />
                ) : (
                  <div className="w-full h-20 bg-gray-100 flex items-center justify-center rounded text-gray-400 italic">No photo proof</div>
                )}
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={() => setShowDetail(false)} className="px-6 py-2 text-white rounded font-bold" style={{ background: "var(--color-primary)" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}