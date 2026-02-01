"use client";

import { useEffect, useState, useRef } from "react";
import { Eye, Edit, Trash, CirclePlus, CircleArrowLeft, Pencil, X, Upload, Download, History } from "lucide-react";
import { useSearchParams } from "next/navigation";

import Image from "next/image";
import { 
  getEmployees, 
  updateEmployee, 
  deleteEmployee, 
  createEmployee,
  exportEmployeesCsv,
  importEmployeesCsv,
} from "@/lib/employee/employeeService";
import { getMyShifts } from "@/lib/shift/shiftService";
import { mapEmployeeToUI, mapUIToEmployeePayload, UIEmployee } from "@/lib/employee/employeeMapper";

export default function EmployeePage() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";

  const [employeeList, setEmployeeList] = useState<UIEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<UIEmployee | null>(null);
  const [editEmployee, setEditEmployee] = useState<any | null>(null);
  const [deleteEmployeeData, setDeleteEmployeeData] = useState<UIEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduleGroups, setScheduleGroups] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // State untuk Modal Tambah Data
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    email: "",
    password: "",
    fullName: "",
    dateOfBirth: "",
    nik: "",
    gender: "MALE",
    mobileNumber: "",
    address: "",
    position: "",
    department: "",
    hireDate: new Date().toISOString().split("T")[0],
    scheduleGroupId: "",
  });

  useEffect(() => {
    const delay = setTimeout(async () => {
      setLoading(true);
      await fetchEmployees();
      setLoading(false);
    }, 300);
  
    return () => clearTimeout(delay);
  }, [search]);
  
  useEffect(() => {
    fetchScheduleGroups();
  }, []);  

  const fetchEmployees = async () => {
    try {
      const res = await getEmployees(search);
      const rawData = res.data ?? res;
      // Menggunakan Mapper yang Anda sediakan
      setEmployeeList(rawData.map(mapEmployeeToUI));
    } catch (err) {
      console.error("Fetch employee failed", err);
    }
  };

  const fetchScheduleGroups = async () => {
    try {
      const res = await getMyShifts();
      setScheduleGroups(res);
    } catch (err) {
      console.error("Fetch schedule group failed", err);
    }
  };

  const getShiftName = (id: any) => {
    const found = scheduleGroups.find((sg) => String(sg.id) === String(id));
    return found ? found.shift : "Not Assigned";
  };

  const handleAddEmployee = async () => {
    try {
      // Kita buat payload manual untuk memastikan 'name' dan 'fullName' terkirim
      const payload = {
        name: newEmployee.fullName,     // Tambahkan ini karena backend minta field 'name'
        fullName: newEmployee.fullName, // Tetap kirim fullName
        email: newEmployee.email,
        password: newEmployee.password,
        nik: newEmployee.nik,
        dateOfBirth: newEmployee.dateOfBirth,
        gender: newEmployee.gender,
        mobileNumber: newEmployee.mobileNumber,
        address: newEmployee.address,
        position: newEmployee.position,
        department: newEmployee.department,
        hireDate: newEmployee.hireDate,
        scheduleGroupId: Number(newEmployee.scheduleGroupId),
      };

      console.log("Payload dikirim:", payload); // Cek console F12 untuk memastikan data tidak kosong

      await createEmployee(payload);
      alert("Employee berhasil ditambahkan!");
      setIsAddModalOpen(false);
      fetchEmployees();
      
      // Reset form
      setNewEmployee({
        email: "", password: "", fullName: "", dateOfBirth: "",
        nik: "", gender: "MALE", mobileNumber: "", address: "",
        position: "", department: "", hireDate: new Date().toISOString().split("T")[0],
        scheduleGroupId: ""
      });
    } catch (err: any) {
      // Menampilkan pesan error detail dari backend agar tahu field mana yang kurang
      const serverMessage = err.response?.data?.message || "Gagal menambah karyawan";
      alert(serverMessage);
      console.error("Error backend:", err.response?.data);
    }
  };

  const handleDelete = async () => {
    if (!deleteEmployeeData) return;
    try {
      await deleteEmployee(deleteEmployeeData.id);
      fetchEmployees();
      setDeleteEmployeeData(null);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleSaveChanges = async () => {
    if (!editEmployee) return;
    try {
      const formData = new FormData();
      formData.append("fullName", editEmployee.name);
      formData.append("nik", editEmployee.nik);
      formData.append("gender", editEmployee.gender);
      formData.append("mobileNumber", editEmployee.phone);
      formData.append("address", editEmployee.address);
      formData.append("department", editEmployee.dept);
      formData.append("position", editEmployee.position);
      formData.append("dateOfBirth", editEmployee.birth);
      formData.append("hireDate", editEmployee.hireDate); // Menambahkan hireDate
      formData.append("status", editEmployee.status);
      formData.append("promotionHistory", editEmployee.promotion ?? "");
      formData.append("scheduleGroupId", String(editEmployee.schedule));

      if (editEmployee.photoFile) {
        formData.append("photo", editEmployee.photoFile);
      }

      await updateEmployee(editEmployee.id, formData);
      fetchEmployees();
      setEditEmployee(null);
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleExportCsv = async () => {
    const blob = await exportEmployeesCsv();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employees.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleImportCsv = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await importEmployeesCsv(file);
    alert("Import berhasil");
    fetchEmployees();
    e.target.value = "";
  };

  if (loading) return <div className="p-10 text-center font-bold text-blue-600">Loading Employees...</div>;

  return (
    <div className="p-6 bg-gray-50 text-gray-800">
      {/* ================= TABLE BOX ================= */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold">All Employee Information</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 text-sm font-bold border rounded hover:bg-gray-100">
              <Upload size={16} /> Import
            </button>
            <button onClick={handleExportCsv} className="flex items-center gap-2 px-3 py-2 text-sm font-bold border rounded hover:bg-gray-100">
              <Download size={16} /> Export
            </button>
            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">
              <CirclePlus size={16} /> Add Data
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept=".csv" hidden onChange={handleImportCsv} />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
            <tr className="text-white text-center font-bold"style={{ background: "var(--color-primary, #2563eb)" }}>
                <th className="p-3 border w-12">No.</th>
                <th className="p-3 border text-left">Full Name</th>
                <th className="p-3 border">NIK</th>
                <th className="p-3 border">Position</th>
                <th className="p-3 border">Shift</th>
                <th className="p-3 border">Status</th>
                <th className="p-3 border text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {employeeList.map((emp, index) => (
                <tr key={emp.id} className="bg-white border-b border-gray-200 hover:bg-gray-50 transition text-center">
                  <td className="p-3 border text-gray-500">{index + 1}</td>
                  <td className="p-3 border text-left font-semibold">{emp.name}</td>
                  <td className="p-3 border">{emp.nik}</td>
                  <td className="p-3 border text-left">{emp.position}</td>
                  <td className="p-3 border font-medium text-blue-600">{getShiftName(emp.schedule)}</td>
                  <td className="p-3 border">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase ${
                      emp.status === "ACTIVE" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="p-3 border">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setSelectedEmployee(emp)} className="p-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition shadow-sm"><Eye size={14} /></button>
                      <button onClick={() => setEditEmployee(emp)} className="p-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 transition shadow-sm"><Edit size={14} /></button>
                      <button onClick={() => setDeleteEmployeeData(emp)} className="p-2 rounded bg-red-700 text-white hover:bg-red-800 transition shadow-sm"><Trash size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL ADD ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl p-8 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-xl font-bold text-blue-600">Register New Employee</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
              <div className="md:col-span-2 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h4 className="text-sm font-bold text-blue-700 mb-3 uppercase tracking-tight">Login Credentials</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                    <input type="email" value={newEmployee.email} onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})} className="w-full mt-1 p-3 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="employee@gmail.com" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                    <input type="password" value={newEmployee.password} onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})} className="w-full mt-1 p-3 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
                  </div>
                </div>
              </div>

              {[
                { key: "fullName", label: "Full Name", type: "text" },
                { key: "nik", label: "NIK", type: "text" },
                { key: "mobileNumber", label: "Phone Number", type: "text" },
                { key: "dateOfBirth", label: "Birth Date", type: "date" },
                { key: "department", label: "Department", type: "text" },
                { key: "position", label: "Position", type: "text" },
                { key: "hireDate", label: "Hire Date", type: "date" },
              ].map((item) => (
                <div key={item.key}>
                  <label className="text-xs font-bold text-gray-500 uppercase">{item.label}</label>
                  <input type={item.type} value={(newEmployee as any)[item.key]} onChange={(e) => setNewEmployee({ ...newEmployee, [item.key]: e.target.value })} className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              ))}

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Gender</label>
                <select value={newEmployee.gender} onChange={(e) => setNewEmployee({...newEmployee, gender: e.target.value})} className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
                <textarea value={newEmployee.address} onChange={(e) => setNewEmployee({...newEmployee, address: e.target.value})} className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20" placeholder="Alamat lengkap..." />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Assignment Shift Group</label>
                <select value={newEmployee.scheduleGroupId} onChange={(e) => setNewEmployee({...newEmployee, scheduleGroupId: e.target.value})} className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">-- Select Shift Group --</option>
                  {scheduleGroups.map((sg) => (
                    <option key={sg.id} value={sg.id}>{sg.shift}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-8 mt-6 border-t border-gray-100">
              <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-100 transition">Cancel</button>
              <button onClick={handleAddEmployee} className="px-10 py-2 text-white rounded-lg font-bold shadow-md hover:brightness-110 transition active:scale-95 bg-blue-600">Create Employee</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL VIEW (DATA LENGKAP) ================= */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl p-8 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-xl font-bold">Employee Detailed Profile</h3>
              <button onClick={() => setSelectedEmployee(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="flex flex-col items-center">
                <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-4 border-gray-50 shadow-lg">
                  <Image src={selectedEmployee.photo ? `http://localhost:8000/uploads/photoEmployee/${selectedEmployee.photo}` : "/profile2.jpeg"} alt="Employee" fill className="object-cover" />
                </div>
                <p className="mt-4 font-bold text-lg">{selectedEmployee.name}</p>
                <p className="text-blue-600 font-bold text-sm tracking-widest uppercase mt-1">{selectedEmployee.code || "EMP-XXXX"}</p>
                <p className="text-gray-500 font-medium text-sm">{selectedEmployee.position}</p>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {[
                  { label: "NIK", value: selectedEmployee.nik },
                  { label: "Gender", value: selectedEmployee.gender },
                  { label: "Phone", value: selectedEmployee.phone },
                  { label: "Department", value: selectedEmployee.dept },
                  { label: "Birth Date", value: selectedEmployee.birth },
                  { label: "Hire Date", value: selectedEmployee.hireDate }, // Data baru
                  { label: "Current Shift", value: getShiftName(selectedEmployee.schedule) },
                  { label: "Status", value: selectedEmployee.status },
                ].map((item, idx) => (
                  <div key={idx}>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.label}</label>
                    <p className="p-3 bg-gray-50 border border-gray-100 rounded-lg mt-1 font-medium">{item.value || "-"}</p>
                  </div>
                ))}
                
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Address</label>
                  <p className="p-3 bg-gray-50 border border-gray-100 rounded-lg mt-1 font-medium">{selectedEmployee.address || "-"}</p>
                </div>

                {/* Seksi Promotion History yang baru */}
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <History size={14} className="text-blue-500" /> Promotion History
                  </label>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mt-1 text-sm italic text-blue-800">
                    {selectedEmployee.promotion || "No records of promotion or status changes yet."}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-8 mt-6 border-t border-gray-100">
              <button onClick={() => setSelectedEmployee(null)} className="px-10 py-2 text-white rounded-lg font-bold shadow-md bg-blue-600">Back to List</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL EDIT (DENGAN HIRE DATE & PROMOTION) ================= */}
      {editEmployee && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl p-8 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setEditEmployee(null)}><CircleArrowLeft className="w-6 h-6 text-gray-400" /></button>
                <h3 className="text-xl font-bold">Edit Employee Data</h3>
              </div>
              <button onClick={() => setEditEmployee(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center h-fit">
                <Image src={editEmployee.photo ? `http://localhost:8000/uploads/photoEmployee/${editEmployee.photo}` : "/noprofile.jpg"} alt="Edit Profile" width={150} height={150} className="rounded-xl object-cover shadow-md mb-4" />
                <input type="file" onChange={(e) => setEditEmployee({ ...editEmployee, photoFile: e.target.files?.[0] })} className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                {[
                  { key: "name", label: "Full Name", type: "text" },
                  { key: "nik", label: "NIK", type: "text" },
                  { key: "phone", label: "Mobile Number", type: "text" },
                  { key: "dept", label: "Department", type: "text" },
                  { key: "position", label: "Position", type: "text" },
                  { key: "birth", label: "Birth Date", type: "date" },
                  { key: "hireDate", label: "Hire Date", type: "date" }, // Data baru di edit
                ].map((item) => (
                  <div key={item.key}>
                    <label className="text-xs font-bold text-gray-500 uppercase">{item.label}</label>
                    <div className="relative mt-1">
                      <input type={item.type} value={editEmployee[item.key] || ""} onChange={(e) => setEditEmployee({ ...editEmployee, [item.key]: e.target.value })} className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      <Pencil className="absolute right-3 top-3.5 w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                ))}

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
                  <input type="text" value={editEmployee.address || ""} onChange={(e) => setEditEmployee({ ...editEmployee, address: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Assignment Shift</label>
                  <select value={editEmployee.schedule} onChange={(e) => setEditEmployee({ ...editEmployee, schedule: e.target.value })} className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">-- Select Shift --</option>
                    {scheduleGroups.map((sg) => (
                      <option key={sg.id} value={sg.id}>{sg.shift}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                  <select value={editEmployee.status} onChange={(e) => setEditEmployee({ ...editEmployee, status: e.target.value })} className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                {/* Input Promotion History di Edit */}
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Promotion History Records</label>
                  <textarea value={editEmployee.promotion || ""} onChange={(e) => setEditEmployee({ ...editEmployee, promotion: e.target.value })} className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24" placeholder="Update promotion history here..." />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-8 mt-6 border-t border-gray-100">
              <button onClick={() => setEditEmployee(null)} className="px-6 py-2 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-100 transition">Cancel</button>
              <button onClick={handleSaveChanges} className="px-10 py-2 text-white rounded-lg font-bold bg-blue-600 shadow-md hover:brightness-110 transition">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DELETE ================= */}
      {deleteEmployeeData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4 border">
            <h3 className="text-xl font-bold mb-2">Delete This Employee?</h3>
            <p className="text-gray-500 text-sm mb-6">Konfirmasi untuk menghapus <b>{deleteEmployeeData.name}</b>.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteEmployeeData(null)} className="flex-1 py-2 border border-gray-300 rounded-lg font-medium">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2 bg-red-700 text-white rounded-lg font-medium">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}