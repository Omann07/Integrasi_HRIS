"use client";

import React, { useEffect, useState } from "react";
import { Eye, Trash2, Search, CreditCard, X } from "lucide-react";

import {
  getTransactionHistory,
  getTransactionDetail,
} from "@/lib/transaction/transactionService";

import { TransactionUI, TransactionDetailUI } from "@/lib/transaction/transactionMapper";

export default function HistoryPage() {
  const [data, setData] = useState<TransactionUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // State untuk modal detail dan hapus
  const [selectedUI, setSelectedUI] = useState<TransactionUI | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<TransactionDetailUI | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const result = await getTransactionHistory();
      setData(result);
    } catch (error) {
      console.error("Fetch history failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id: number) => {
    setLoadingDetail(true);
    setShowDetail(true);
    try {
      const detail = await getTransactionDetail(id);
      setSelectedDetail(detail);
    } catch (error) {
      console.error("Fetch detail failed:", error);
      setShowDetail(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredData = data.filter((item) =>
    item.planName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-slate-800">
      <div className="bg-white rounded-2xl shadow-sm border p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">History Information</h2>

          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search plan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 pl-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading history...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8 italic text-gray-500">No transaction found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="p-4 font-semibold uppercase text-xs tracking-wider">No</th>
                  <th className="p-4 font-semibold uppercase text-xs tracking-wider">Date</th>
                  <th className="p-4 font-semibold uppercase text-xs tracking-wider">Type</th>
                  <th className="p-4 font-semibold uppercase text-xs tracking-wider">Plan</th>
                  <th className="p-4 font-semibold uppercase text-xs tracking-wider">Plan Type</th>
                  <th className="p-4 font-semibold uppercase text-xs tracking-wider">Amount</th>
                  <th className="p-4 text-center font-semibold uppercase text-xs tracking-wider">Status</th>
                  <th className="p-4 text-center font-semibold uppercase text-xs tracking-wider">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.map((item, i) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4 text-sm">{i + 1}</td>
                    <td className="p-4 text-sm">{item.date}</td>
                    <td className="p-4 text-sm font-medium text-blue-600">{item.type}</td>
                    <td className="p-4 text-sm font-bold">{item.planName}</td>
                    <td className="p-4 text-sm text-gray-600">{item.planType}</td>
                    <td className="p-4 text-sm font-bold text-slate-700">{item.amount}</td>

                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                        item.status === "PAID"
                          ? "bg-green-100 text-green-600 border border-green-200"
                          : "bg-orange-100 text-orange-600 border border-orange-200"
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="p-4 flex justify-center gap-2">
                      <button
                        onClick={() => handleViewDetail(item.id)}
                        className="p-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 transition"
                        title="View Detail"
                      >
                        <Eye size={16} />
                      </button>

                      {item.status !== "PAID" && item.invoiceUrl && (
                        <a
                          href={item.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-green-600 text-white rounded shadow-sm hover:bg-green-700 transition flex items-center justify-center"
                          title="Pay Now"
                        >
                          <CreditCard size={16} />
                        </a>
                      )}

                      {item.status === "PAID" && (
                        <button
                          onClick={() => {
                            setSelectedUI(item);
                            setShowDelete(true);
                          }}
                          className="p-2 bg-red-600 text-white rounded shadow-sm hover:bg-red-700 transition"
                          title="Delete History"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL VIEW DETAIL ================= */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl p-10 overflow-y-auto max-h-[95vh] relative">
            
            {loadingDetail ? (
              <div className="h-64 flex items-center justify-center">
                <p className="animate-pulse font-bold text-slate-400">Fetching detailed information...</p>
              </div>
            ) : selectedDetail && (
              <>
                <h2 className="text-2xl font-bold mb-8">View History Transactions</h2>

                {/* Section 1: Dates */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Date:</p>
                    <p className="font-bold text-sm">{selectedDetail.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Paid At:</p>
                    <p className="font-bold text-sm">{selectedDetail.paidAt || "-"}</p>
                  </div>
                </div>

                <hr className="mb-8 border-gray-100" />

                {/* Section 2: Status & Type */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-2">Status:</p>
                    <span className={`px-4 py-1.5 rounded-md text-[10px] font-black tracking-widest uppercase border ${
                      selectedDetail.status === "PAID" 
                        ? "bg-green-50 text-green-600 border-green-100" 
                        : "bg-orange-50 text-orange-600 border-orange-100"
                    }`}>
                      {selectedDetail.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-2">Transaction Type:</p>
                    <span className="px-4 py-1.5 rounded-md text-[10px] font-black tracking-widest uppercase bg-blue-50 text-blue-600 border border-blue-100">
                      {selectedDetail.type}
                    </span>
                  </div>
                </div>

                {/* Section 3: Plan Info */}
                <div className="grid grid-cols-2 gap-10 mb-10">
                  <div className="space-y-5">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Plan Name:</p>
                      <p className="font-bold text-lg leading-tight">{selectedDetail.planName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Plan Type:</p>
                      <p className="font-bold text-sm">{selectedDetail.planType}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Plan Price:</p>
                      <p className="font-bold text-sm">{selectedDetail.amount}</p>
                    </div>
                  </div>

                  <div className="space-y-5 border-l border-gray-100 pl-10">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Duration in Days:</p>
                      <p className="font-bold text-sm">{selectedDetail.durationInDays}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Max Employee:</p>
                      <p className="font-bold text-sm">{selectedDetail.maxEmployees}</p>
                    </div>
                  </div>
                </div>

                <hr className="mb-8 border-gray-100" />

                {/* Section 4: IDs & Technicals */}
                <div className="grid grid-cols-2 gap-10 mb-12">
                  <div className="space-y-5">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">External ID:</p>
                      <p className="font-bold text-[13px] text-slate-600 break-all">tsn_{selectedDetail.id}_internal</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Xendit Invoice ID:</p>
                      <p className="font-bold text-[13px] text-slate-600 break-all">{selectedDetail.xenditInvoiceId || "-"}</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Payment Method:</p>
                      <p className="font-bold text-sm">{selectedDetail.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Expiry Date:</p>
                      <p className="font-bold text-sm">{selectedDetail.expiryDate || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Section 5: Total Amount */}
                <div className="border-t-2 border-slate-100 pt-8 mt-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-4">Total Amount</p>
                  <div className="flex justify-between items-center mb-6">
                    <p className="font-bold text-slate-700">{selectedDetail.planName}</p>
                    <p className="font-bold text-slate-700">{selectedDetail.amount}</p>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-4xl font-black tracking-tighter">Total</h4>
                    <h4 className="text-4xl font-black tracking-tighter text-slate-900">{selectedDetail.amount}</h4>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-12">
                  {selectedDetail.status !== "PAID" && selectedDetail.invoiceUrl && (
                    <a
                      href={selectedDetail.invoiceUrl}
                      target="_blank"
                      className="px-10 py-3 bg-emerald-700 text-white rounded font-bold hover:bg-emerald-800 transition active:scale-95"
                    >
                      Pay Now
                    </a>
                  )}
                  <button 
                    onClick={() => setShowDetail(false)} 
                    className="px-10 py-3 bg-[#1e293b] text-white rounded font-bold hover:bg-slate-800 transition active:scale-95"
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL DELETE ================= */}
      {showDelete && selectedUI && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4 border">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Delete This History?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This action cannot be undone. Confirmation for transaction from <b>{selectedUI.date}</b>.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDelete(false)} 
                className="flex-1 py-2.5 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                   // Tambahkan logika delete API di sini
                   setShowDelete(false);
                }} 
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition"
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