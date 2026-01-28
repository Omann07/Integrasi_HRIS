"use client";

import { useEffect, useState } from "react";
import {
  EyeIcon,
  Pencil,
  TrashIcon,
  CirclePlus
} from "lucide-react";

import {
  getMyShifts,
  createMyShift,
  updateMyShift,
  deleteMyShift
} from "@/lib/shift/shiftService";
import { ShiftUI } from "@/lib/shift/shiftMapper";

export default function ShiftPage() {
  const [shifts, setShifts] = useState<ShiftUI[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [shiftName, setShiftName] = useState("");
  const [selectedShift, setSelectedShift] = useState<ShiftUI | null>(null);

  /* ================= FETCH DATA ================= */
  const fetchShifts = async () => {
    setLoading(true);
    try {
      const data = await getMyShifts();
      setShifts(data);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  /* ================= HANDLERS ================= */
  const handleAdd = async () => {
    if (!shiftName.trim()) return;
    await createMyShift({ nameOfShift: shiftName });
    setIsModalOpen(false);
    setShiftName("");
    fetchShifts();
  };

  const handleUpdate = async () => {
    if (!selectedShift) return;
    await updateMyShift(selectedShift.id, {
      nameOfShift: selectedShift.shift
    });
    setIsEditOpen(false);
    setSelectedShift(null);
    fetchShifts();
  };

  const handleDelete = async () => {
    if (!selectedShift) return; 
    
    try {
      await deleteMyShift(selectedShift.id); 
      alert("Shift berhasil dihapus");
      
      setIsDeleteOpen(false); 
      setSelectedShift(null); 
      fetchShifts(); 
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menghapus shift");
      setIsDeleteOpen(false);
    }
  };

  return (
    /* PERBAIKAN: Menghapus min-h-screen dan h-full untuk mencegah double scrollbar */
    <div className="w-full p-6 bg-gray-100 dashboard-container">

      {/* ================= MAIN CARD ================= */}
      <div className="card-shadow bg-white rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-black">
            All Shift Information
          </h2>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-white font-bold transition hover:brightness-110 active:scale-95"
            style={{ background: "#2D8EFF" }}
          >
            <CirclePlus className="w-5 h-5" />
            Add Data
          </button>
        </div>

        {/* ================= TABLE ================= */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 border-collapse">
            <thead>
              <tr className="bg-[var(--color-primary)] text-white text-center">
                <th className="py-2 px-4 border">No.</th>
                <th className="py-2 px-4 border text-left">Company Name</th>
                <th className="py-2 px-4 border text-left">Name of Shift</th>
                <th className="py-2 px-4 border w-40">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-black">Loading...</td>
                </tr>
              ) : shifts.length > 0 ? (
                shifts.map((shift, index) => (
                  <tr key={shift.id} className="hover:bg-gray-50 text-black border-b border-gray-200">
                    <td className="py-2 px-4 border text-center">{index + 1}</td>
                    <td className="py-2 px-4 border font-medium">{shift.company}</td>
                    <td className="py-2 px-4 border">{shift.shift}</td>
                    <td className="py-2 px-4 border">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => { setSelectedShift(shift); setIsViewOpen(true); }}
                          className="p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedShift(shift); setIsEditOpen(true); }}
                          className="p-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-600 transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedShift(shift); setIsDeleteOpen(true); }}
                          className="p-2 rounded-md bg-red-700 text-white hover:bg-red-800 transition"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500 italic">No data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ADD MODAL ================= */}
      {isModalOpen && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="modal-content max-w-lg bg-white p-6 rounded-lg shadow-xl w-full">
            <h3 className="modal-title border-b pb-3 mb-6 font-bold text-lg text-black">
              Add Shift
            </h3>

            <label className="input-label font-bold text-black block mb-1 text-sm">Name of Shift</label>
            <input
              className="input mb-6 w-full border p-2 rounded-md text-black focus:ring-1 focus:ring-blue-500 outline-none"
              value={shiftName}
              onChange={(e) => setShiftName(e.target.value)}
              placeholder="Enter shift name"
            />

            <div className="modal-footer flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-md bg-gray-300 text-black font-bold hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 rounded-md text-white font-bold transition hover:brightness-110"
                style={{ background: "var(--color-primary)" }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW MODAL ================= */}
      {isViewOpen && selectedShift && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="modal-content max-w-lg bg-white p-6 rounded-lg shadow-xl w-full">
            <h3 className="modal-title border-b pb-3 mb-6 font-bold text-lg text-black">
              View Shift
            </h3>

            <label className="input-label font-bold text-black block mb-1 text-xs text-gray-500 uppercase">Company Name</label>
            <div className="mb-4 p-2 bg-gray-100 border rounded-md text-black">{selectedShift.company}</div>

            <label className="input-label font-bold text-black block mb-1 text-xs text-gray-500 uppercase">Name of Shift</label>
            <div className="mb-6 p-2 bg-gray-100 border rounded-md text-black">{selectedShift.shift}</div>

            <div className="modal-footer flex justify-end">
              <button
                onClick={() => setIsViewOpen(false)}
                className="px-6 py-2 rounded-md text-white font-bold transition"
                style={{ background: "var(--color-primary)" }}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {isEditOpen && selectedShift && (
        <div className="modal-backdrop fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="modal-content max-w-lg bg-white p-6 rounded-lg shadow-xl w-full">
            <h3 className="modal-title border-b pb-3 mb-6 font-bold text-lg text-black">
              Edit Shift
            </h3>

            <label className="input-label font-bold text-black block mb-1 text-sm">Name of Shift</label>
            <input
              className="input mb-6 w-full border p-2 rounded-md text-black focus:ring-1 focus:ring-blue-500 outline-none"
              value={selectedShift.shift}
              onChange={(e) =>
                setSelectedShift({ ...selectedShift, shift: e.target.value })
              }
            />

            <div className="modal-footer flex justify-end gap-3">
              <button
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 rounded-md bg-gray-300 text-black font-bold hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 rounded-md text-white font-bold transition hover:brightness-110"
                style={{ background: "var(--color-primary)" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE MODAL ================= */}
      {isDeleteOpen && selectedShift && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4 border">
            <h3 className="text-xl font-bold mb-2 text-black">Delete This Shift?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Konfirmasi untuk menghapus shift <strong>{selectedShift.shift}</strong>.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteOpen(false)} 
                className="flex-1 py-2 border border-gray-300 rounded-lg font-medium text-black"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete} // Memanggil fungsi tanpa parameter
                className="flex-1 py-2 bg-red-700 text-white rounded-lg font-medium hover:bg-red-800 transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}