"use client";

import { useEffect, useState } from "react";
import { EyeIcon } from "lucide-react";
import { getMyShiftsEmployee } from "@/lib/shift/shiftService";
import { ShiftUI } from "@/lib/shift/shiftMapper";

export default function EmployeeShiftPage() {
  const [shifts, setShifts] = useState<ShiftUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewData, setViewData] = useState({ company: "", shift: "" });

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    getMyShiftsEmployee()
      .then(setShifts)
      .finally(() => setLoading(false));
  }, []);

  return (
    /* PERBAIKAN: Menghapus min-h-screen agar tidak terjadi double scroll bar */
    <div className="p-6 bg-gray-100 dashboard-container">

      {/* MAIN CARD */}
      <div className="card-shadow bg-white rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-black">My Shift Information</h2>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 border-collapse">
            <thead>
              <tr className="bg-[var(--color-primary)] text-white text-center">
                <th className="py-2 px-4 border w-16">No.</th>
                <th className="py-2 px-4 border text-left">Company Name</th>
                <th className="py-2 px-4 border text-left">Name of Shift</th>
                <th className="py-2 px-4 border w-24">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-black">Loading data...</td>
                </tr>
              ) : shifts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-gray-500 italic">Tidak ada data shift</td>
                </tr>
              ) : (
                shifts.map((shift, i) => (
                  <tr key={shift.id} className="hover:bg-gray-50 text-black border-b">
                    <td className="py-2 px-4 border text-center">{i + 1}</td>
                    <td className="py-2 px-4 border">{shift.company}</td>
                    <td className="py-2 px-4 border">{shift.shift}</td>
                    <td className="py-2 px-4 border text-center">
                      <div className="flex justify-center">
                        {/* VIEW BUTTON */}
                        <button
                          onClick={() => {
                            setViewData({
                              company: shift.company,
                              shift: shift.shift,
                            });
                            setIsViewOpen(true);
                          }}
                          className="p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= VIEW MODAL ================= */}
      {isViewOpen && (
        <div className="modal-backdrop fixed inset-0 bg-black/40 flex justify-center items-center z-[999] p-4">
          <div className="modal-content max-w-lg bg-white p-6 rounded-lg shadow-lg w-full">

            <h3 className="modal-title border-b pb-3 mb-6 font-bold text-lg text-black">
              View Shift
            </h3>

            <div className="mb-4">
              <label className="input-label font-bold block mb-1 text-black">
                Company Name
              </label>
              <input
                type="text"
                readOnly
                value={viewData.company}
                className="input w-full border p-2 rounded-md bg-gray-100 text-black outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="input-label font-bold block mb-1 text-black">
                Name of Shift
              </label>
              <input
                type="text"
                readOnly
                value={viewData.shift}
                className="input w-full border p-2 rounded-md bg-gray-100 text-black outline-none"
              />
            </div>

            <div className="modal-footer flex justify-end">
              <button
                onClick={() => setIsViewOpen(false)}
                className="btn-primary px-4 py-2 rounded-md text-white"
                style={{ background: "var(--color-primary)" }}
              >
                Back
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}