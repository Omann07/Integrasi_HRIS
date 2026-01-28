"use client";

import * as React from "react";
import { CirclePlus, Eye, Pencil, Trash2 } from "lucide-react";
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
  const [currentCompanyId, setCurrentCompanyId] = React.useState<string>("");

  const [modalType, setModalType] = React.useState<"add" | "edit" | "view" | null>(null);
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
  
      // Ambil companyId dari baris tabel pertama jika ada, 
      // atau dari data shift untuk mendapatkan ID yang sedang login
      if (scheduleRes && scheduleRes.length > 0) {
        setCurrentCompanyId(String(scheduleRes[0].companyId));
      } else if (shiftData && shiftData.length > 0) {
        // Fallback ke data shift jika tabel schedule masih kosong
        // Sesuaikan dengan struktur data shift Anda (biasanya item.companyId atau item.company.id)
        const idFromShift = shiftData[0].companyId || shiftData[0].company?.id;
        setCurrentCompanyId(String(idFromShift || ""));
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
      <div className="table-box">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold card-title">Work Schedule Information</h2>
          <button
            onClick={() => { 
              // PERBAIKAN: Masukkan currentCompanyId saat klik Add
              setForm({ 
                ...INITIAL_FORM, 
                companyId: currentCompanyId, 
                scheduleGroupId: shifts[0]?.id || 0 
              }); 
              setModalType("add"); 
            }}
            className="px-3 py-2 rounded text-white font-bold bg-[#2D8EFF] flex items-center gap-2"
          >
            <CirclePlus className="w-4 h-4" /> Add Data
          </button>
        </div>

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
                    <button onClick={() => { setSelectedRow(r); setModalType("view"); }} className="p-2 rounded text-white bg-[#2D8EFF]"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => { setSelectedRow(r); setForm(mapToFormFields(r)); setModalType("edit"); }} className="p-2 rounded text-white bg-yellow-500"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteTarget(r)} className="p-2 rounded text-white bg-red-700"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(modalType === "add" || modalType === "edit") && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50 bg-black/50">
          <div className="modal-content max-w-3xl bg-white p-6 rounded-lg shadow-xl">
            <h3 className="modal-title border-b pb-3 mb-6 font-bold text-lg">
              {modalType === "add" ? "Add Work Schedule" : "Edit Work Schedule"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="input-label font-bold block mb-1 text-gray-700">Company ID</label>
                  <input 
                    className="input border p-2 w-full rounded bg-gray-100" 
                    value={form.companyId} 
                    readOnly 
                    required 
                  />
                  <small className="text-gray-400 italic">*Terisi otomatis</small>
                </div>
                <div>
                  <label className="input-label font-bold block mb-1">Day of Week</label>
                  <select className="input border p-2 w-full rounded" value={form.dayOfWeek} onChange={(e) => setForm({...form, dayOfWeek: e.target.value})}>
                    {DAY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="input-label font-bold block mb-1">Schedule Group</label>
                  <select 
                    className="input border p-2 w-full rounded bg-white" 
                    value={form.scheduleGroupId} 
                    onChange={(e) => setForm({...form, scheduleGroupId: Number(e.target.value)})}
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>{s.shift}</option>
                    ))}
                  </select>
                </div>
                {/* Input Time Start/End & Break tetap sama */}
                <div className="md:col-span-2">
                  <label className="input-label font-bold block mb-1">Work (Start - End)</label>
                  <div className="flex gap-3 items-center">
                    <input type="time" className="input border p-2 flex-1 rounded" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} required />
                    <span>to</span>
                    <input type="time" className="input border p-2 flex-1 rounded" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} required />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="input-label font-bold block mb-1">Break (Start - End)</label>
                  <div className="flex gap-3 items-center">
                    <input type="time" className="input border p-2 flex-1 rounded" value={form.breakStart} onChange={e => setForm({...form, breakStart: e.target.value})} required />
                    <span>to</span>
                    <input type="time" className="input border p-2 flex-1 rounded" value={form.breakEnd} onChange={e => setForm({...form, breakEnd: e.target.value})} required />
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
    </div>
  );
}