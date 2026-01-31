import { calculateDistance, formatDistance } from "@/lib/utils/distance";

/* =====================================
   TYPE: RESPONSE BACKEND
===================================== */
export interface AttendanceAPI {
  id: number;
  employeeId: number;
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
  updatedAt: string | null;
  // Tambahkan field ini agar sesuai dengan response backend
  distanceFromOffice?: number | null; 

  employee: {
    id: number;
    fullName: string;
    employeeCode: string;
    companyId: number;
    company: {
      companyName: string;
      latitude: string | null;
      longitude: string | null;
      radius: number;
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
  date: string;      
  rawDate: string;   
  checkInTime: string | null;
  checkOutTime: string | null;
  workType: string;
  locationStatus: string | null;
  latitude: string | null;
  longitude: string | null;
  distance: string | null; // Akan menampung hasil formatDistance
  attendanceStatus: string;
  approvalStatus: string;
  proofUrl: string | null;
}

const formatToLocalTime = (str: string | null) => {
  if (!str || str === "-") return "-";
  if (str.includes(":") && str.length <= 8) {
    return str.substring(0, 5); 
  }
  const date = new Date(str);
  if (isNaN(date.getTime())) return str;
  return date.toLocaleTimeString("id-ID", { 
    hour: "2-digit", 
    minute: "2-digit", 
    hour12: false 
  }).replace(".", ":");
};

export const mapAttendanceToUI = (data: AttendanceAPI): AttendanceUI => {
  let distance: string | null = null;

  // Prioritaskan hasil kalkulasi dari Backend jika ada
  if (data.distanceFromOffice !== undefined && data.distanceFromOffice !== null) {
    distance = formatDistance(data.distanceFromOffice);
  } 
  // Jika backend tidak mengirimkan, lakukan fallback kalkulasi manual
  else if (
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

  const dateObj = new Date(data.date);
  const rawDate = !isNaN(dateObj.getTime()) 
    ? dateObj.toISOString().split("T")[0] 
    : "";

  return {
    id: data.id,
    employeeId: data.employeeId,
    fullName: data.employee?.fullName ?? "-",
    employeeCode: data.employee?.employeeCode ?? "-",
    companyName: data.employee?.company?.companyName ?? "-",
    shiftName: data.employee?.scheduleGroup?.nameOfShift ?? "-",
    date: data.date ? new Date(data.date).toLocaleDateString("id-ID") : "-",
    rawDate: rawDate,
    checkInTime: formatToLocalTime(data.checkInTime),
    checkOutTime: formatToLocalTime(data.checkOutTime),
    workType: data.workType,
    locationStatus: data.locationStatus,
    latitude: data.latitude,
    longitude: data.longitude,
    distance, // Sekarang terisi dari backend
    attendanceStatus: data.attendanceStatus,
    approvalStatus: data.approvalStatus,
    proofUrl: data.proof ? `http://localhost:8000/uploads/proofAttendance/${data.proof}` : null,
  };
};

export const mapAttendancesToUI = (data: AttendanceAPI[]): AttendanceUI[] => {
  if (!data) return [];
  return data.map(mapAttendanceToUI);
};