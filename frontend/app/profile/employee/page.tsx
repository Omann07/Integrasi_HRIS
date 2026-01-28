"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  Building2,
  CircleArrowLeft,
  Upload,
  IdCardLanyard,
  CalendarDays,
  Mars,
  House,
  SquareUser,
  Building,
  FileBadge2,
  ClipboardList,
  FileText,
} from "lucide-react";

import {
  getEmployeeProfile,
  changeEmployeePassword,
} from "@/lib/auth/authService";

import { updateMyEmployeeProfile } from "@/lib/employee/employeeService";

export default function EmployeeProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* ================= PROFILE (ALLOWED FIELD) ================= */
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  /* tampilkan nama file */
  const [photoName, setPhotoName] = useState("");

  /* ================= PASSWORD ================= */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /* ================= FETCH PROFILE ================= */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getEmployeeProfile();
        setUser(res.user);

        if (res.user.Employee?.length > 0) {
          const emp = res.user.Employee[0];
          setEmployee(emp);

          setFullName(emp.fullName || "");
          setMobileNumber(emp.mobileNumber || "");
          setDateOfBirth(emp.dateOfBirth?.slice(0, 10) || "");
          setAddress(emp.address || "");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /* ================= UPDATE PROFILE ================= */
  const handleUpdateProfile = async () => {
    try {
      const formData = new FormData();

      // ✅ HANYA FIELD YANG DIIZINKAN BACKEND
      formData.append("fullName", fullName);
      formData.append("mobileNumber", mobileNumber);
      formData.append("dateOfBirth", dateOfBirth);
      formData.append("address", address);

      if (photo) {
        formData.append("photo", photo);
      }

      await updateMyEmployeeProfile(formData);
      alert("Profile berhasil diperbarui");

      const res = await getEmployeeProfile();
      setUser(res.user);
      setEmployee(res.user.Employee[0]);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Gagal update profile");
    }
  };

  /* ================= UPDATE PASSWORD ================= */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await changeEmployeePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      alert("Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Gagal ganti password");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user || !employee) return <div className="p-6">Profile tidak ditemukan</div>;

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header
        className="flex items-center px-6 py-4 text-white"
        style={{ background: "var(--gradient-blue)" }}
      >
        <Link href="/dashboard/employee">
          <CircleArrowLeft className="w-6 h-6 mr-2" />
        </Link>
        <h1 className="text-xl font-bold">My Profile</h1>
      </header>

      <div className="p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* ================= LEFT ================= */}
          <div className="md:col-span-2 space-y-6">

            {/* EDIT PROFILE */}
            <div className="card card-shadow p-6">
              <h2 className="text-lg font-bold text-[var(--color-accent)] mb-4">
                Edit Profile
              </h2>

              <div className="space-y-4">

                <div>
                  <label className="input-label font-bold">Employee ID</label>
                  <input readOnly className="input" value={employee.employeeCode} />
                </div>
                
                <div>
                  <label className="input-label font-bold">Full Name</label>
                  <input
                    className="input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                <label className="input-label font-bold">Email</label>
                  <input readOnly className="input" value={user.email} />
                </div>
                <div>
                  <label className="input-label font-bold">Mobile Number</label>
                  <input
                    className="input"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="input-label font-bold">Date of Birth</label>
                  <input
                    type="date"
                    className="input"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
                {/* READ ONLY (FORBIDDEN FIELD) */}
                <div>
                  <label className="input-label font-bold">NIK</label>
                  <input readOnly className="input" value={employee.nik} />
                </div>
                <div>
                  <label className="input-label font-bold">Gender</label>
                  <input readOnly className="input" value={employee.gender} />
                </div>
                <div>
                <label className="input-label font-bold">Alamat</label>
                <input
                  className="input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                </div>
                {/* UPLOAD PHOTO */}
                <div>
                  <label className="upload-box flex items-center gap-2 cursor-pointer w-fit">
                    <Upload className="w-4 h-4" />
                    Upload Photo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPhoto(file);
                          setPhotoName(file.name);
                        }
                      }}
                    />
                  </label>

                  {/* ✅ NAMA FILE */}
                  {photoName && (
                    <p className="text-xs mt-2 text-gray-600">
                      Selected file: <strong>{photoName}</strong>
                    </p>
                  )}
                </div>

                <button onClick={handleUpdateProfile} className="btn-primary">
                  Save Profile
                </button>
              </div>
            </div>

            {/* CHANGE PASSWORD */}
            <div className="card card-shadow p-6">
              <h2 className="text-lg font-bold text-[var(--color-accent)] mb-4">
                Change Password
              </h2>

              {/* Tambahkan onSubmit di sini */}
              <form className="space-y-4" onSubmit={handleChangePassword}>
                <div>
                  <label className="input-label font-bold">
                    Current Password <span className="text-red-600">*</span>
                  </label>
                  <input 
                    type="password" 
                    className="input" 
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="input-label font-bold">
                    New Password <span className="text-red-600">*</span>
                  </label>
                  <input 
                    type="password" 
                    className="input" 
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />

                  <p className="text-xs italic mt-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    <span>Must be at least 8 characters long.</span>
                    <br />
                    Must contain:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
                      <li>uppercase letters</li>
                      <li>lowercase letters</li>
                      <li>special characters</li>
                      <li>numbers</li>
                    </ul>
                  </p>
                </div>

                <div>
                  <label className="input-label font-bold">
                    Confirm Password <span className="text-red-600">*</span>
                  </label>
                  <input 
                    type="password" 
                    className="input" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />

                  <p className="text-xs italic text-gray-700 mt-2 leading-relaxed">
                    Password confirmation must match the new password.
                  </p>
                </div>

                <div className="pt-4">
                  <button type="submit" className="btn-primary" style={{ background: "var(--color-primary)" }}>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT SECTION */}
          <div className="card card-shadow p-6 text-center">
            <div className="flex flex-col items-center space-y-3">
              <Image
                src={
                  employee.photo
                    ? `http://localhost:8000/uploads/photoEmployee/${employee.photo}`
                    : "/profile2.jpeg"
                }
                alt="Employee Profile"
                width={100}
                height={100}
                className="rounded-full mx-auto object-cover"
              />


              <h3 className="text-lg font-semibold">{employee.fullName}</h3>
              <p className="text-sm">{user.email}</p>

              <span
                className="text-xs font-medium px-3 py-1 rounded-full"
                style={{
                  background: "var(--color-secondary)",
                  color: "var(--color-primary)"
                }}
              >
                EMPLOYEE
              </span>
            </div>

            {/* SUMMARY LIST */}
            <div className="border-t mt-4 pt-4 text-left space-y-2">

              <div>
                <p className="font-bold text-sm flex items-center">
                  <IdCardLanyard className="w-4 h-4 mr-2" />
                  Employee ID
                </p>
                <p className="text-sm ml-6">{employee.employeeCode}</p>
              </div>

              <div>
                <p className="font-bold text-sm flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Phone Number
                </p>
                <p className="text-sm ml-6">{employee.mobileNumber}</p>
              </div>

              <div>
                <p className="font-bold text-sm flex items-center">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Date of Birth
                </p>
                <p className="text-sm ml-6">
                  {employee.dateOfBirth?.slice(0, 10)}
                </p>
              </div>

              <div>
                <p className="font-bold text-sm flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  NIK
                </p>
                <p className="text-sm ml-6">{employee.nik}</p>
              </div>

              <div>
                <p className="font-bold text-sm flex items-center">
                  <Mars className="w-4 h-4 mr-2" />
                  Gender
                </p>
                <p className="text-sm ml-6">{employee.gender}</p>
              </div>

              <div>
                <p className="font-bold text-sm flex items-center">
                  <House className="w-4 h-4 mr-2" />
                  Address
                </p>
                <p className="text-sm ml-6">{employee.address}</p>
              </div>

              <div>
                <p className="font-bold text-sm flex items-center">
                  <SquareUser className="w-4 h-4 mr-2" />
                  Position
                </p>
                <p className="text-sm ml-6">{employee.position}</p>
              </div>

              <div>
                <p className="font-bold text-sm flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  Department
                </p>
                <p className="text-sm ml-6">{employee.department}</p>
              </div>

              <div>
                <p className="font-bold text-sm flex items-center">
                  <FileBadge2 className="w-4 h-4 mr-2" />
                  Promotion History
                </p>
                <p className="text-sm ml-6">{employee.promotionHistory}</p>
              </div>

              <div>
                <p className="font-bold text-sm flex items-center">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Status
                </p>
                <p className="text-sm ml-6">{employee.status}</p>
              </div>

              <div>
                <p className="font-bold text-sm flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  Company
                </p>
                <p className="text-sm ml-6">{user.company?.companyName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
