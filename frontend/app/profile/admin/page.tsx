"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CircleArrowLeft, ClipboardList, Building2 } from "lucide-react";

import { mapCompanyToUI, CompanyUI } from "@/lib/company/companyMapper";
import {
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
} from "@/lib/auth/authService";

export default function AdminProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // profile form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getAdminProfile();
        setUser(res.user);
        setStatus(res.status);
  
        // Inisialisasi form
        setName(res.user.name);
        setEmail(res.user.email);
  
        // Jika user punya data company, kita map untuk ambil logoUrl
        if (res.user.company) {
          const mappedCompany = mapCompanyToUI(res.user.company);
          // Kita bisa simpan logoUrl ini ke state baru atau tambahkan ke objek user
          setCompanyLogo(mappedCompany.logoUrl);
        }
      } catch (err) {
        console.error("Gagal ambil profile", err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchProfile();
  }, []);
  
  // Tambahkan state baru untuk menyimpan URL Logo
  const [companyLogo, setCompanyLogo] = useState<string | undefined>(undefined);

  /* ==========================
      HANDLER
  ========================== */

  const handleUpdateProfile = async () => {
    try {
      await updateAdminProfile({ name, email });
      alert("Profile berhasil diperbarui");

      const res = await getAdminProfile();
      setUser(res.user);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Gagal update profile");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await changeAdminPassword({
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
  if (!user) return <div className="p-6">Profile tidak ditemukan</div>;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header
        className="flex items-center text-white px-6 py-4"
        style={{ background: "var(--gradient-blue)" }}
      >
        <Link href="/dashboard/admin" className="flex items-center">
          <CircleArrowLeft className="w-6 h-6 mr-2 text-white" />
        </Link>
        <h1 className="text-xl font-bold text-white">My Profile</h1>
      </header>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="md:col-span-2 space-y-6">
            {/* EDIT PROFILE */}
            <div className="bg-white rounded-lg card-shadow p-6">
              <h2 className="text-lg font-bold mb-4 text-[var(--color-accent)]">
                Edit Profile
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="input-label font-bold">Full Name</label>
                  <input
                    type="text"
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="input-label font-bold">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="input-label font-bold">Status</label>
                  <input
                    type="text"
                    readOnly
                    className="input"
                    value={status ? "Active" : "Inactive"}
                  />
                </div>

                <div>
                  <label className="input-label font-bold">Company</label>
                  <input
                    type="text"
                    readOnly
                    className="input"
                    value={user.company?.companyName ?? "-"}
                  />
                </div>

                {/* 🔵 BUTTON UPDATE PROFILE */}
                <div className="pt-4">
                  <button
                    onClick={handleUpdateProfile}
                    className="btn-primary"
                  >
                    Update Profile
                  </button>
                </div>
              </div>
            </div>

            {/* CHANGE PASSWORD */}
            <div className="bg-white rounded-lg card-shadow p-6">
              <h2 className="text-lg font-bold mb-4 text-[var(--color-accent)]">
                Change Password
              </h2>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="input-label font-bold">
                    Current Password <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="password"
                    className="input"
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
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />

                  {/* ❗ TETAP */}
                  <p className="text-xs italic mt-2 leading-relaxed text-gray-500">
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {/* 🔵 BUTTON UPDATE PASSWORD */}
                <div className="pt-4">
                  <button type="submit" className="btn-primary">
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="bg-white rounded-lg card-shadow p-6 text-center">
            <div className="flex flex-col items-center space-y-3">
            <div className="relative w-24 h-24 mb-2">
              <Image
                src={companyLogo || "/profile1.jpeg"} // Gunakan logo company jika ada
                alt="Company Logo"
                fill
                className="rounded-full border object-cover"
              />
            </div>

              <h3 className="font-semibold text-lg">{user.name}</h3>
              <p className="text-sm">{user.email}</p>

              <span className="text-xs px-3 py-1 rounded-full bg-[var(--color-secondary)] text-[var(--color-primary)]">
                {user.role}
              </span>
            </div>

            <div className="border-t mt-4 pt-4 text-left space-y-2">
              <div>
                <p className="font-bold text-sm flex items-center">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Status
                </p>
                <p className="text-sm ml-6">
                  {status ? "Active" : "Inactive"}
                </p>
              </div>

              <div>
                <p className="font-bold text-sm flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  Company
                </p>
                <p className="text-sm ml-6">
                  {user.company?.companyName ?? "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
