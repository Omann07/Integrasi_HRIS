import { calculateDistance, formatDistance } from "@/lib/utils/distance";

/* =====================================
   TYPE: RESPONSE BACKEND
===================================== */
export interface AttendanceAPI {
  id: number;
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

  fullName: string;
  employeeCode: string;
  companyName: string;
  shiftName: string;

  date: string;
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

  // CEK APAKAH FORMATNYA JAM MURNI (HH:mm:ss)
  // Karena backend Anda mengirim req.formatWIB(..., "HH:mm:ss")
  if (str.includes(":") && str.length <= 8) {
    return str.substring(0, 5); // Mengambil "HH:mm" dari "HH:mm:ss"
  }

  // Jika formatnya ISO Date lengkap
  const date = new Date(str);
  if (isNaN(date.getTime())) return str;
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
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

  return {
    id: data.id,
    fullName: data.employee?.fullName ?? "-",
    employeeCode: data.employee?.employeeCode ?? "-",
    companyName: data.employee?.company?.companyName ?? "-",
    shiftName: data.employee?.scheduleGroup?.nameOfShift ?? "-",

    // Tampilkan tanggal yang lebih rapi
    date: data.date ? new Date(data.date).toLocaleDateString("id-ID") : "-",
    
    // Gunakan helper untuk jam
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

/* =====================================
   MAPPER (ARRAY) ✅ PENTING
===================================== */
export const mapAttendancesToUI = (
  data: AttendanceAPI[]
): AttendanceUI[] => {
  return data.map(mapAttendanceToUI);
};
