"use client";

import React, { useEffect, useState } from "react";
import { Eye, Pencil, Trash, CirclePlusIcon } from "lucide-react";

import {
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
} from "@/lib/leave/leaveTypeService";
import { LeaveTypeUI } from "@/lib/leave/leaveTypeMapper";

/* ================= FORM TYPE ================= */

type LeaveFormState = {
  name: string;
  paid: "" | "Yes" | "No";
  maxDays: string;
  description: string;
};

export default function LeaveTypePage(): JSX.Element {
  /* ================= DATA ================= */
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeUI[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  /* ================= ADD ================= */
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [form, setForm] = useState<LeaveFormState>({
    name: "",
    paid: "",
    maxDays: "",
    description: "",
  });

  /* ================= VIEW ================= */
  const [isViewOpen, setIsViewOpen] = useState<boolean>(false);
  const [selectedLeave, setSelectedLeave] =
    useState<LeaveTypeUI | null>(null);

  /* ================= EDIT ================= */
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<LeaveFormState>({
    name: "",
    paid: "",
    maxDays: "",
    description: "",
  });

  /* ================= DELETE ================= */
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  /* ================= FETCH ================= */
  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true);
      const data = await getLeaveTypes();
      setLeaveTypes(data);
    } finally {
      setLoading(false);
    }
  };

  /* ================= ADD ================= */
  const openAddModal = () => setIsAddOpen(true);
  const closeAddModal = () => {
    setIsAddOpen(false);
    setForm({ name: "", paid: "", maxDays: "", description: "" });
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;

    const newItem = await createLeaveType({
      name: form.name.trim(),
      isPaid: form.paid === "Yes",
      maxDays: Number(form.maxDays),
      description: form.description,
    });

    setLeaveTypes((prev) => [...prev, newItem]);
    closeAddModal();
  };

  /* ================= VIEW ================= */
  const openViewModal = (item: LeaveTypeUI) => {
    setSelectedLeave(item);
    setIsViewOpen(true);
  };

  const closeViewModal = () => {
    setIsViewOpen(false);
    setSelectedLeave(null);
  };

  /* ================= EDIT ================= */
  const openEditModal = (item: LeaveTypeUI) => {
    setEditId(item.id);
    setEditForm({
      name: item.name,
      paid: item.isPaid ? "Yes" : "No",
      maxDays: String(item.maxDays),
      description: item.description,
    });
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditId(null);
    setEditForm({ name: "", paid: "", maxDays: "", description: "" });
  };

  const handleSaveEdit = async () => {
    if (!editId) return;

    const updated = await updateLeaveType(editId, {
      name: editForm.name.trim(),
      isPaid: editForm.paid === "Yes",
      maxDays: Number(editForm.maxDays),
      description: editForm.description,
    });

    setLeaveTypes((prev) =>
      prev.map((lt) => (lt.id === editId ? updated : lt))
    );

    closeEditModal();
  };

  /* ================= DELETE ================= */
  const openDeleteModal = (id: number) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteOpen(false);
    setDeleteId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    await deleteLeaveType(deleteId);
    setLeaveTypes((prev) => prev.filter((lt) => lt.id !== deleteId));
    closeDeleteModal();
  };

  /* ================= RENDER ================= */
  return (
    <div className="p-6 dashboard-container">
      <div className="table-box">
        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-center mb-6">
          <h2
            className="text-xl font-bold"
            style={{ color: "var(--color-black)" }}
          >
            Leave Type Information
          </h2>

          <button
            className="flex items-center gap-2 px-4 py-2 rounded text-white text-sm"
            style={{ background: "#2D8EFF" }}
            onClick={openAddModal}
            type="button"
          >
            <CirclePlusIcon className="w-4 h-4" />
            Add Data
          </button>
        </div>

        {/* ================= TABLE ================= */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr
                className="text-white text-center font-bold"
                style={{ background: "var(--color-primary)" }}
              >
                <th className="p-3 border w-12">No.</th>
                <th className="p-3 border">Leave Name</th>
                <th className="p-3 border">Paid Leave</th>
                <th className="p-3 border">Max Days</th>
                <th className="p-3 border">Description</th>
                <th className="p-3 border">Action</th>
              </tr>
            </thead>

            <tbody>
              {!loading &&
                leaveTypes.map((item, index) => (
                  <tr
                    key={item.id}
                    className="bg-white border border-gray-200 hover:bg-gray-100 transition"
                  >
                    <td className="p-3 text-center border">{index + 1}</td>
                    <td className="p-3 border font-medium">{item.name}</td>
                    <td className="p-3 border text-center">
                      {item.isPaid ? "Yes" : "No"}
                    </td>
                    <td className="p-3 border text-center">
                      {item.maxDays} Days
                    </td>
                    <td className="p-3 border">{item.description}</td>
                    <td className="p-3 border">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => openViewModal(item)}
                          className="px-3 py-1 rounded bg-blue-500 text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-3 py-1 rounded bg-yellow-500 text-white"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(item.id)}
                          className="px-3 py-1 rounded bg-red-700 text-white"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
            {/* ================= ADD MODAL ================= */}
            {isAddOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50" onClick={closeAddModal} />
                <div className="relative z-50 w-full max-w-4xl bg-white rounded-lg overflow-hidden shadow-xl">
                  {/* Header */}
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-xl font-bold">Add Leave Type</h3>
                  </div>

                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Kolom Kiri */}
                      <div className="space-y-6">
                        <div>
                          <label className="block font-bold mb-2">Leave Type</label>
                          <input
                            className="w-full border p-3 rounded-md bg-gray-50 focus:bg-white outline-none"
                            placeholder="Insert Leave Type..."
                            value={form.name}
                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label className="block font-bold mb-2">Paid Leave</label>
                          <select
                            className="w-full border p-3 rounded-md bg-gray-50 focus:bg-white outline-none"
                            value={form.paid}
                            onChange={(e) => setForm((p) => ({ ...p, paid: e.target.value as any }))}
                          >
                            <option value="">Is this paid leave?</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold mb-2">Max Days</label>
                          <input
                            className="w-full border p-3 rounded-md bg-gray-50 focus:bg-white outline-none"
                            placeholder="Insert max days..."
                            type="number"
                            value={form.maxDays}
                            onChange={(e) => setForm((p) => ({ ...p, maxDays: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Kolom Kanan */}
                      <div>
                        <label className="block font-bold mb-2">Description</label>
                        <textarea
                          className="w-full border p-3 rounded-md bg-gray-50 focus:bg-white outline-none h-[260px] resize-none"
                          placeholder="Insert Description..."
                          value={form.description}
                          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end gap-4 mt-10">
                      <button 
                        type="button" 
                        onClick={closeAddModal}
                        className="px-8 py-2 border-2 border-slate-700 text-slate-700 font-bold rounded-md hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAdd}
                        className="px-10 py-2 bg-[#1E3A5F] text-white font-bold rounded-md hover:opacity-90"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= VIEW MODAL ================= */}
            {isViewOpen && selectedLeave && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50" onClick={closeViewModal} />
                <div className="relative z-50 w-full max-w-4xl bg-white rounded-lg overflow-hidden shadow-xl">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-xl font-bold">View Leave Type</h3>
                  </div>

                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <label className="block font-bold mb-2">Leave Type</label>
                          <div className="w-full border p-3 rounded-md bg-white text-gray-500 min-h-[50px]">
                            {selectedLeave.name}
                          </div>
                        </div>
                        <div>
                          <label className="block font-bold mb-2">Paid Leave</label>
                          <div className="w-full border p-3 rounded-md bg-white text-gray-500 min-h-[50px]">
                            {selectedLeave.isPaid ? "Yes" : "No"}
                          </div>
                        </div>
                        <div>
                          <label className="block font-bold mb-2">Max Days</label>
                          <div className="w-full border p-3 rounded-md bg-white text-gray-500 min-h-[50px]">
                            {selectedLeave.maxDays}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold mb-2">Description</label>
                        <div className="w-full border p-3 rounded-md bg-white text-gray-500 h-[260px]">
                          {selectedLeave.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-10">
                      <button 
                        type="button" 
                        onClick={closeViewModal}
                        className="px-10 py-2 bg-[#1E3A5F] text-white font-bold rounded-md hover:opacity-90"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= EDIT MODAL ================= */}
            {isEditOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50" onClick={closeEditModal} />
                
                {/* Modal Content */}
                <div className="relative z-50 w-full max-w-4xl bg-white rounded-lg overflow-hidden shadow-xl">
                  {/* Header */}
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-xl font-bold text-gray-800">Edit Leave Type</h3>
                  </div>

                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Kolom Kiri: Inputs */}
                      <div className="space-y-6">
                        <div>
                          <label className="block font-bold text-gray-700 mb-2">Leave Type</label>
                          <input
                            className="w-full border border-gray-300 p-3 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Enter Leave Type"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm((p) => ({ ...p, name: e.target.value }))
                            }
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-gray-700 mb-2">Paid Leave</label>
                          <select
                            className="w-full border border-gray-300 p-3 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={editForm.paid}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                paid: e.target.value as "Yes" | "No" | "",
                              }))
                            }
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-gray-700 mb-2">Max Days</label>
                          <input
                            className="w-full border border-gray-300 p-3 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            type="number"
                            placeholder="Enter max days"
                            value={editForm.maxDays}
                            onChange={(e) =>
                              setEditForm((p) => ({ ...p, maxDays: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      {/* Kolom Kanan: Description */}
                      <div>
                        <label className="block font-bold text-gray-700 mb-2">Description</label>
                        <textarea
                          className="w-full border border-gray-300 p-3 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all h-[260px] resize-none"
                          placeholder="Enter description"
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, description: e.target.value }))
                          }
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 mt-10">
                      <button
                        type="button"
                        onClick={closeEditModal}
                        className="px-8 py-2 border-2 border-slate-700 text-slate-700 font-bold rounded-md hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="px-10 py-2 bg-[#1E3A5F] text-white font-bold rounded-md hover:bg-[#152a45] transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= DELETE MODAL ================= */}
            {isDeleteOpen && (
            <div className="fixed inset-0 z-40 flex items-center justify-center">
                <div
                className="absolute inset-0 bg-black/40"
                onClick={closeDeleteModal}
                />
                <div className="relative z-50 w-[400px] bg-white rounded shadow">
                <div className="px-6 py-4 border-b font-bold">
                    Delete Confirmation
                </div>
                
                {/* ================= DELETE MODAL ================= */}
                {isDeleteOpen && deleteId && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4 border">
                      <h3 className="text-xl font-bold mb-2">Delete This Leave Type?</h3>
                      <p className="text-gray-500 text-sm mb-6">Konfirmasi untuk menghapus data leave type.</p>
                      <div className="flex gap-3">
                        <button 
                          onClick={closeDeleteModal} 
                          className="flex-1 py-2 border border-gray-300 rounded-lg font-medium"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleConfirmDelete} 
                          className="flex-1 py-2 bg-red-700 text-white rounded-lg font-medium"
                        >
                          Confirm Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                </div>
            </div>
            )}
      </div>
    </div>
  );
}
