"use client";

import React, { useEffect, useState } from "react";
import { Eye, Trash } from "lucide-react";
import {
  getLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
} from "@/lib/leave/leaveRequestService";
import { LeaveUI } from "@/lib/leave/leaveRequestMapper";

export default function LeavesAdminPage() {
  const [leaveList, setLeaveList] = useState<LeaveUI[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<LeaveUI | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [deleteLeave, setDeleteLeave] = useState<LeaveUI | null>(null);
  const isImage = (url: string) =>
    /\.(jpg|jpeg|png|webp)$/i.test(url);
  
  const isPdf = (url: string) =>
    /\.pdf$/i.test(url);
  
  
  // ================== DATA FETCHING ==================
  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const data = await getLeaveRequests();
      setLeaveList(data);
    } catch (error) {
      console.error("Failed to fetch leaves:", error);
    }
  };

  // ================== HANDLERS ==================
  const approveLeave = async (leave: LeaveUI) => {
    if (leave.status !== "pending") return;
    const confirmApprove = confirm(`Approve leave request for ${leave.name}?`);
    if (!confirmApprove) return;

    await approveLeaveRequest(leave.id);
    fetchLeaves(); // Refresh data
  };

  const rejectLeave = async (leave: LeaveUI) => {
    if (leave.status !== "pending") return;

    const reason = prompt("Reason for rejection?");
    if (!reason) return;

    await rejectLeaveRequest(leave.id, reason);
    fetchLeaves(); // Refresh data
  };

  const openView = (leave: LeaveUI) => {
    setSelectedLeave(leave);
    setShowViewModal(true);
  };

  const closeView = () => {
    setSelectedLeave(null);
    setShowViewModal(false);
  };

  return (
    <div className="p-6 dashboard-container bg-gray-50 min-h-screen">
      <div className="table-box bg-white rounded-lg shadow-sm p-6">
        <h2 className="card-title text-xl mb-6 font-bold text-gray-800">
          Leaves Information
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="text-white text-center font-bold" style={{ background: "var(--color-primary, #2563eb)" }}>
                <th className="p-3 border w-12">No.</th>
                <th className="p-3 border">Full Name</th>
                <th className="p-3 border">Leave Type</th>
                <th className="p-3 border">Start Date</th>
                <th className="p-3 border">End Date</th>
                <th className="p-3 border">Total Days</th>
                <th className="p-3 border">Reason</th>
                <th className="p-3 border">Attachment</th>
                <th className="p-3 border">Status</th>
                <th className="p-3 border">Approved At</th>
                <th className="p-3 border">Rejected Reason</th>
                <th className="p-3 border">Action</th>
              </tr>
            </thead>

            <tbody>
              {leaveList.length > 0 ? (
                leaveList.map((item, index) => (
                  <tr key={item.id} className="bg-white border border-gray-200 hover:bg-gray-50 transition text-center">
                    <td className="p-3 border text-gray-500">{index + 1}</td>
                    <td className="p-3 border text-left font-semibold text-gray-700">{item.name}</td>
                    <td className="p-3 border text-left">{item.type}</td>
                    <td className="p-3 border whitespace-nowrap">{item.start}</td>
                    <td className="p-3 border whitespace-nowrap">{item.end}</td>
                    <td className="p-3 border font-medium">{item.days}</td>
                    <td className="p-3 border text-left max-w-xs truncate">{item.reason}</td>
                    <td className="p-3 border">
                    {item.attachment ? (
                      isImage(item.attachment) ? (
                        <img
                          src={item.attachment}
                          className="w-10 h-10 rounded object-cover mx-auto cursor-pointer"
                          onClick={() => openView(item)}
                        />
                      ) : (
                        <a
                          href={item.attachment}
                          target="_blank"
                          className="text-blue-600 underline font-semibold"
                        >
                          View PDF
                        </a>
                      )
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                    {/* STATUS ACTION / LABEL */}
                    <td className="p-3 border">
                      <div className="flex justify-center gap-2">
                        {item.status === "pending" ? (
                          <>
                            <button
                              onClick={() => rejectLeave(item)}
                              className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-red-50 text-red-600 shadow-sm transition"
                              title="Reject"
                            >
                              <span className="text-lg font-bold">✖</span>
                            </button>
                            <button
                              onClick={() => approveLeave(item)}
                              className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-green-50 text-green-600 shadow-sm transition"
                              title="Approve"
                            >
                              <span className="text-lg font-bold">✔</span>
                            </button>
                          </>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              item.status === "approved"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-red-100 text-red-700 border-red-200"
                            }`}
                          >
                            {item.status}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 border text-gray-500">{item.approvedAt || "-"}</td>
                    <td className="p-3 border text-gray-500 italic">{item.rejectedReason || "-"}</td>

                    {/* GENERAL ACTIONS */}
                    <td className="p-3 border">
                      <div className="flex gap-2 justify-center">
                        <button
                          className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition shadow-sm"
                          onClick={() => openView(item)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="px-3 py-1 rounded bg-red-700 text-white hover:bg-red-800 transition shadow-sm"
                          onClick={() => setDeleteLeave(item)}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="p-10 text-center text-gray-400 italic">No leave requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================= VIEW MODAL ========================= */}
      {showViewModal && selectedLeave && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl p-8 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
              <h3 className="text-xl font-bold text-gray-800">View Leave Request Details</h3>
              <button onClick={closeView} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
              {/* LEFT SIDE */}
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Employee Name</label>
                  <p className="p-3 bg-gray-50 border rounded-lg text-gray-800 font-medium">{selectedLeave.name}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Leave Type</label>
                  <p className="p-3 bg-gray-50 border rounded-lg text-gray-800">{selectedLeave.type}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Period</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-3 bg-gray-50 border rounded-lg text-center">{selectedLeave.start}</div>
                    <span className="text-gray-400 font-bold">to</span>
                    <div className="flex-1 p-3 bg-gray-50 border rounded-lg text-center">{selectedLeave.end}</div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Reason for Leave</label>
                  <div className="p-3 bg-gray-50 border rounded-lg text-gray-800 min-h-[100px] whitespace-pre-wrap">
                    {selectedLeave.reason}
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Evidence / Attachment</label>
                  <div className="mt-2 border rounded-lg p-2 bg-gray-50 inline-block">
                  {selectedLeave.attachment ? (
                    isImage(selectedLeave.attachment) ? (
                      <img
                        src={selectedLeave.attachment}
                        className="max-w-full max-h-[350px] rounded shadow border"
                        alt="attachment-preview"
                      />
                    ) : isPdf(selectedLeave.attachment) ? (
                      <a
                        href={selectedLeave.attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline font-semibold"
                      >
                        View PDF
                      </a>
                    ) : (
                      <a
                        href={selectedLeave.attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        Download Attachment
                      </a>
                    )
                    ) : (
                    <span className="text-gray-400 italic">
                      No attachment
                    </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Current Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-3 h-3 rounded-full ${
                      selectedLeave.status === 'approved' ? 'bg-green-500' : 
                      selectedLeave.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></span>
                    <span className="font-bold capitalize text-gray-700">{selectedLeave.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Approved At</label>
                    <p className="p-3 bg-gray-50 border rounded-lg text-gray-600">{selectedLeave.approvedAt || "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Total Days</label>
                    <p className="p-3 bg-gray-50 border rounded-lg text-gray-600 font-bold">{selectedLeave.days}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Rejection Reason</label>
                  <p className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 italic">
                    {selectedLeave.rejectedReason || "No rejection record."}
                  </p>
                </div>
                
                <div className="flex justify-end pt-6">
                  <button
                    className="px-10 py-2 rounded-lg font-bold text-white shadow-md hover:brightness-110 transition active:scale-95"
                    style={{ background: "var(--color-primary, #2563eb)" }}
                    onClick={closeView}
                  >
                    Back to List
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


        {/* ================= DELETE MODAL ================= */}
        {deleteLeave && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm">
              <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4 border">
                  <h3 className="text-xl font-bold mb-2">Delete This Leave Request?</h3>
                  <p className="text-gray-500 text-sm mb-6">Konfirmasi untuk menghapus data pengajuan cuti.</p>
                    <div className="flex gap-3">
                        <button 
                          onClick={() => setDeleteLeave(null)} 
                          className="flex-1 py-2 border border-gray-300 rounded-lg font-medium"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => setDeleteLeave(null)} 
                          className="flex-1 py-2 bg-red-700 text-white rounded-lg font-medium"
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