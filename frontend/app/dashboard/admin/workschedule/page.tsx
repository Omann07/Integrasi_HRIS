"use client";

import * as React from "react";
import { CirclePlus, Pencil, Trash2 } from "lucide-react";
import { 
  getWorkSchedules, createWorkSchedule, 
  updateWorkSchedule, deleteWorkSchedule 
} from "@/lib/workschedule/workScheduleService";
import { getMyShifts } from "@/lib/shift/shiftService";
import { 
  mapScheduleToUI, mapFormToPayload, 
  mapToFormFields, DAY_OPTIONS 
} from "@/lib/workschedule/workScheduleMapper";

const INITIAL_FORM = {
  companyId: "",
  scheduleGroupId: 0,
  dayOfWeek: "Monday",
  startTime: "",
  breakStart: "",
  breakEnd: "",
  endTime: "",
};

export default function WorkScheduleAdminPage() {
  const [rows, setRows] = React.useState<any[]>([]);
  const [shifts, setShifts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Modal & Selection States
  const [modalType, setModalType] = React.useState<"add" | "edit" | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<any | null>(null);
  const [selectedRow, setSelectedRow] = React.useState<any | null>(null);
  const [form, setForm] = React.useState(INITIAL_FORM);

  const fetchData = async () => {
    try {
      const [scheduleRes, shiftData] = await Promise.all([
        getWorkSchedules(),
        getMyShifts(),
      ]);
  
      setShifts(shiftData); 
      setRows(mapScheduleToUI(scheduleRes || []));
  
      if (shiftData.length > 0 && form.scheduleGroupId === 0) {
        setForm(prev => ({ ...prev, scheduleGroupId: shiftData[0].id }));
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = mapFormToPayload(form);
    
    if (modalType === "add") {
      await createWorkSchedule(payload);
    } else if (modalType === "edit" && selectedRow) {
      await updateWorkSchedule(selectedRow.id, payload);
    }
    
    setModalType(null);
    fetchData();
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteWorkSchedule(deleteTarget.id);
      setDeleteTarget(null);
      fetchData();
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 dashboard-container">
      {/* HEADER SECTION */}
      <div className="table-box">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold card-title">Work Schedule Information</h2>
          <button
            onClick={() => { setForm({ ...INITIAL_FORM, scheduleGroupId: shifts[0]?.id || 0 }); setModalType("add"); }}
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
                <th className="p-3 border">Company ID</th>
                <th className="p-3 border">Schedule Group</th>
                <th className="p-3 border">Day of Week</th>
                <th className="p-3 border">Start Time</th>
                <th className="p-3 border">Break</th>
                <th className="p-3 border">End Time</th>
                <th className="p-3 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, index) => (
                <tr key={r.id} className="border hover:bg-gray-50">
                  <td className="p-3 text-center border">{index + 1}</td>
                  <td className="p-3 text-center border">{r.companyId}</td>
                  <td className="p-3 border">{r.scheduleGroup}</td>
                  <td className="p-3 text-center border">{r.dayOfWeek}</td>
                  <td className="p-3 text-center border">{r.startTime}</td>
                  <td className="p-3 text-center border">{r.breakStart} - {r.breakEnd}</td>
                  <td className="p-3 text-center border">{r.endTime}</td>
                  <td className="p-3 flex gap-2 justify-center border">
                    <button 
                      onClick={() => { setSelectedRow(r); setForm(mapToFormFields(r)); setModalType("edit"); }} 
                      className="p-2 rounded text-white bg-yellow-500"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteTarget(r)} 
                      className="p-2 rounded text-white bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL (ADD / EDIT) */}
      {(modalType === "add" || modalType === "edit") && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50 bg-black/50">
          <div className="modal-content max-w-3xl bg-white p-6 rounded-lg shadow-xl">
            <h3 className="modal-title border-b pb-3 mb-6 font-bold text-lg">
              {modalType === "add" ? "Add Work Schedule" : "Edit Work Schedule"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="input-label font-bold block mb-1">Company ID</label>
                  <input className="input border p-2 w-full rounded" value={form.companyId} onChange={(e) => setForm({...form, companyId: e.target.value})} required />
                </div>
                <div>
                  <label className="input-label font-bold block mb-1">Day of Week</label>
                  <select className="input border p-2 w-full rounded" value={form.dayOfWeek} onChange={(e) => setForm({...form, dayOfWeek: e.target.value})}>
                    {DAY_OPTIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="input-label font-bold block mb-1">Schedule Group</label>
                  <select 
                    className="input border p-2 w-full rounded bg-white" 
                    value={form.scheduleGroupId} 
                    onChange={(e) => setForm({...form, scheduleGroupId: Number(e.target.value)})}
                  >
                    {shifts.length === 0 && <option value="">No shifts available</option>}
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>{s.shift}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="input-label font-bold block mb-1">Work (Start - End)</label>
                  <div className="flex gap-3 items-center">
                    <input type="time" className="input border p-2 flex-1 rounded" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} />
                    <span>to</span>
                    <input type="time" className="input border p-2 flex-1 rounded" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="input-label font-bold block mb-1">Break (Start - End)</label>
                  <div className="flex gap-3 items-center">
                    <input type="time" className="input border p-2 flex-1 rounded" value={form.breakStart} onChange={e => setForm({...form, breakStart: e.target.value})} />
                    <span>to</span>
                    <input type="time" className="input border p-2 flex-1 rounded" value={form.breakEnd} onChange={e => setForm({...form, breakEnd: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 border rounded font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 text-white rounded font-bold" style={{ background: "var(--color-primary)" }}>
                  {modalType === "add" ? "Add" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4 border">
            <h3 className="text-xl font-bold mb-2">Delete This Schedule?</h3>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete this schedule? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2 bg-red-700 text-white rounded-lg font-medium hover:bg-red-800">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}