// ================= TYPES =================

export interface ApiEmployee {
    id: number;
    employeeCode: string;
    fullName: string;
    dateOfBirth: string;
    nik: string;
    gender: string;
    mobileNumber: string;
    address: string;
    department: string;
    position: string;
    photo: string | null;
    hireDate: string;
    status: string;
    promotionHistory: string | null;
    scheduleGroupId: number | null;
  }
  
  // Frontend display model
  export interface UIEmployee {
    id: number;
    code: string;
    name: string;
    nik: string;
    gender: string;
    phone: string;
    address: string;
    dept: string;
    position: string;
    photo?: string;
    birth: string;
    hireDate: string;
    status: string;
    promotion?: string;
    schedule?: number | null;
  }
  
  // ================= MAPPER API → UI =================
  
  // ================= MAPPER API → UI =================

  export const mapEmployeeToUI = (emp: any): UIEmployee => ({
    id: emp.id,
    // Sesuaikan dengan nama kolom di screenshot database (snake_case)
    code: emp.employee_code || emp.employeeCode, 
    name: emp.full_name || emp.fullName,
    nik: (emp.nik || "").toString().trim(),
    gender: emp.gender,
    phone: emp.mobile_number || emp.mobileNumber,
    address: (emp.address || "").trim(),
    dept: emp.department,
    position: emp.position,
    photo: emp.photo ?? undefined,
    birth: emp.date_of_birth || emp.dateOfBirth
      ? (emp.date_of_birth || emp.dateOfBirth).split("T")[0]
      : "",
    hireDate: emp.hire_date || emp.hireDate
      ? (emp.hire_date || emp.hireDate).split("T")[0]
      : "-", // Memberikan '-' jika kosong agar tidak merusak UI
    status: emp.status,
    promotion: emp.promotion_history || emp.promotionHistory || undefined,
    schedule: emp.schedule_group_id || emp.scheduleGroupId,
  });
  
  // ================= MAPPER UI → API =================
  
  export const mapUIToEmployeePayload = (emp: UIEmployee) => ({
    fullName: emp.name,
    nik: emp.nik,
    gender: emp.gender,
    mobileNumber: emp.phone,
    address: emp.address,
    department: emp.dept,
    position: emp.position,
    dateOfBirth: emp.birth,
    hireDate: emp.hireDate,
    status: emp.status,
    promotionHistory: emp.promotion,
    scheduleGroupId: emp.schedule,
  });
  