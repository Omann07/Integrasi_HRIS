import { calculateDistance, formatDistance } from "@/lib/utils/distance";

/* =====================================
   TYPE: RESPONSE BACKEND
===================================== */
export interface AttendanceAPI {
  id: number;
  employeeId: number; // Pastikan ini ada di response backend
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workType: string;
  latitude: string | null;
  longitude: string | null;
  proof: string | null;
  locationStatus: string | null;
  attendanceStatus: string;
  approvalStatus: string;
  createdAt: string;

  employee: {
    fullName: string;
    employeeCode: string;
    company: {
      companyName: string;
      latitude: string | null;
      longitude: string | null;
    };
    scheduleGroup: {
      nameOfShift: string;
    } | null;
  };
}

/* =====================================
   TYPE: UI
===================================== */
export interface AttendanceUI {
  id: number;
  employeeId: number;

  fullName: string;
  employeeCode: string;
  companyName: string;
  shiftName: string;

  date: string;      // Untuk tampilan tabel (dd/mm/yyyy)
  rawDate: string;   // Untuk isi form input date (yyyy-mm-dd)
  
  checkInTime: string | null;
  checkOutTime: string | null;
  workType: string;

  locationStatus: string | null;
  latitude: string | null;
  longitude: string | null;
  distance: string | null;

  attendanceStatus: string;
  approvalStatus: string;

  proofUrl: string | null;
}

const formatToLocalTime = (str: string | null) => {
  if (!str || str === "-") return "-";

  // Jika formatnya jam murni "HH:mm:ss"
  if (str.includes(":") && str.length <= 8) {
    return str.substring(0, 5); // Ambil HH:mm
  }

  // Jika formatnya ISO Date
  const date = new Date(str);
  if (isNaN(date.getTime())) return str;
  return date.toLocaleTimeString("id-ID", { 
    hour: "2-digit", 
    minute: "2-digit", 
    hour12: false 
  }).replace(".", ":");
};

export const mapAttendanceToUI = (
  data: AttendanceAPI
): AttendanceUI => {
  let distance: string | null = null;

  if (
    data.workType === "WFO" &&
    data.latitude &&
    data.longitude &&
    data.employee?.company?.latitude &&
    data.employee?.company?.longitude
  ) {
    const meter = calculateDistance(
      Number(data.latitude),
      Number(data.longitude),
      Number(data.employee.company.latitude),
      Number(data.employee.company.longitude)
    );

    distance = formatDistance(meter);
  }

  // Persiapkan Raw Date untuk input HTML (yyyy-mm-dd)
  const dateObj = new Date(data.date);
  const rawDate = !isNaN(dateObj.getTime()) 
    ? dateObj.toISOString().split("T")[0] 
    : "";

  return {
    id: data.id,
    employeeId: data.employeeId, // Diperlukan agar dropdown terpilih otomatis
    fullName: data.employee?.fullName ?? "-",
    employeeCode: data.employee?.employeeCode ?? "-",
    companyName: data.employee?.company?.companyName ?? "-",
    shiftName: data.employee?.scheduleGroup?.nameOfShift ?? "-",

    // Tampilan Tabel: 31/01/2026
    date: data.date ? new Date(data.date).toLocaleDateString("id-ID") : "-",
    
    // Nilai Input Form: 2026-01-31
    rawDate: rawDate,
    
    checkInTime: formatToLocalTime(data.checkInTime),
    checkOutTime: formatToLocalTime(data.checkOutTime),
    
    workType: data.workType,
    locationStatus: data.locationStatus,
    latitude: data.latitude,
    longitude: data.longitude,
    distance,
    attendanceStatus: data.attendanceStatus,
    approvalStatus: data.approvalStatus,
    proofUrl: data.proof ? `http://localhost:8000/uploads/proofAttendance/${data.proof}` : null,
  };
};

export const mapAttendancesToUI = (
  data: AttendanceAPI[]
): AttendanceUI[] => {
  if (!data) return [];
  return data.map(mapAttendanceToUI);
};