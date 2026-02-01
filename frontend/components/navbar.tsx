"use client";

import { useState, useEffect } from "react";
import { Bell, Search, ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { logout, getEmployeeProfile, getAdminProfile} from "@/lib//auth/authService"; 
import { deleteCookie } from "cookies-next";
import { mapCompanyToUI } from "@/lib/company/companyMapper";

interface NavbarProps {
  role: "admin" | "employee";
}

export default function Navbar({ role }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState("Dashboard");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const pathname = usePathname();
  const showSearchBar =
  (role === "admin" &&
    (pathname.includes("/dashboard/admin/employee") ||
     pathname.includes("/dashboard/admin/attendance"))) ||

  (role === "employee" &&
    pathname.includes("/dashboard/employee/attendance"));

  const router = useRouter();

  // 🔹 Sembunyikan Navbar di halaman Profile & Company
  const hideNavbar =
    pathname?.includes("/profile/") || pathname?.includes("/company/");

  // 🔹 Efek untuk mengambil data Profil (Foto)
  useEffect(() => {
    const fetchNavbarData = async () => {
      try {
        if (role === "admin") {
          // Ambil profil admin
          const res = await getAdminProfile();
          
          // Cek jika admin memiliki data company
          if (res.user?.company) {
            // Gunakan mapper untuk mendapatkan URL logo yang lengkap
            const mappedCompany = mapCompanyToUI(res.user.company);
            if (mappedCompany.logoUrl) {
              setProfilePhoto(mappedCompany.logoUrl);
            }
          }
        } else {
          // Logika lama untuk Employee
          const res = await getEmployeeProfile();
          if (res.user?.Employee?.length > 0) {
            const emp = res.user.Employee[0];
            if (emp.photo) {
              setProfilePhoto(`http://localhost:8000/uploads/photoEmployee/${emp.photo}`);
            }
          }
        }
      } catch (err) {
        console.error("Gagal memuat data di navbar:", err);
      }
    };
  
    fetchNavbarData();
  }, [role]); // Tambahkan role sebagai dependency

  // 🔹 Efek untuk menentukan Judul Halaman
  useEffect(() => {
    // --- Untuk halaman Admin ---
    if (role === "admin") {
      if (pathname === "/dashboard/admin" || pathname === "/dashboard/admin/") {
        setPageTitle("Dashboard");
      } else if (pathname.includes("/dashboard/admin/employee")) {
        setPageTitle("Employee");
      } else if (pathname.includes("/dashboard/admin/attendance")) {
        setPageTitle("Attendance");
      } else if (pathname.includes("/dashboard/admin/leaves")) {
        setPageTitle("Leaves");
      } else if (pathname.includes("/dashboard/admin/workschedule")) {
        setPageTitle("Work Schedule");
      } else if (pathname.includes("/dashboard/admin/transactions")) {
        setPageTitle("Transactions");
      } else if (pathname.includes("/dashboard/admin/shift")) {
        setPageTitle("Shift");
      } else if (pathname.includes("/dashboard/admin/leave-type")) {
        setPageTitle("Leave Type");
      } else if (pathname.includes("/dashboard/admin/leave-request")) {
        setPageTitle("Leave Request");
      }else if (pathname.includes("/profile/admin")) {
        setPageTitle("My Profile");
      } else if (pathname.includes("/company/admin")) {
        setPageTitle("My Company");
      } else {
        setPageTitle("Dashboard");
      }
    }

    // --- Untuk halaman Employee ---
    if (role === "employee") {
      if (pathname === "/dashboard/employee" || pathname === "/dashboard/employee/") {
        setPageTitle("Dashboard");
      } else if (pathname.includes("/dashboard/employee/attendance")) {
        setPageTitle("Attendance");
      } else if (pathname.includes("/dashboard/employee/leaves")) {
        setPageTitle("Leaves");
      } else if (pathname.includes("/dashboard/employee/workschedule")) {
        setPageTitle("Work Schedule");
      } else if (pathname.includes("/dashboard/employee/transactions")) {
        setPageTitle("Transactions");
      } else if (pathname.includes("/dashboard/employee/shift")) {
        setPageTitle("Shift");
      } else if (pathname.includes("/profile/employee")) {
        setPageTitle("My Profile");
      } else if (pathname.includes("/company/employee")) {
        setPageTitle("My Company");
      } else {
        setPageTitle("Dashboard");
      }
    }
  }, [pathname, role]);

  // 🔹 Navigasi berdasarkan role dan halaman
  const handleNavigation = (page: string) => {
    let targetPath = "";
    if (role === "admin") {
      if (page === "profile") targetPath = "/profile/admin";
      else if (page === "company") targetPath = "/company/admin";
      else targetPath = `/dashboard/admin/${page}`;
    } else if (role === "employee") {
      if (page === "profile") targetPath = "/profile/employee";
      else if (page === "company") targetPath = "/company/employee";
      else targetPath = `/dashboard/employee/${page}`;
    }

    router.push(targetPath);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      localStorage.removeItem("token");
      deleteCookie("user_role");
      router.push("/");
    }
  };

  if (hideNavbar) return null;

  return (
    <div className="flex items-center justify-between px-6 py-2 bg-white shadow border-b sticky top-0 z-50">
      {/* Kiri: Judul Halaman */}
      <h2 className="text-xl font-bold" style={{ color: "var(--color-accent)" }}>
        {pageTitle}
      </h2>

      {showSearchBar && (
      <div className="flex-1 flex justify-center">
        <input
          type="text"
          placeholder="Search name..."
          value={searchTerm}
          onChange={(e) => {
            const value = e.target.value;
            setSearchTerm(value);

            router.replace(`${pathname}?search=${encodeURIComponent(value)}`);
          }}
          className="relative max-w-sm w-full border rounded-full pl-4 pr-10 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      )}


      {/* Kanan: Notifikasi + Avatar */}
      <div className="flex items-center space-x-4">
        <Bell className="w-6 h-6 text-gray-600 cursor-pointer" />

        {/* Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-1 focus:outline-none"
          >
            {/* FOTO DINAMIS DI SINI */}
            <img
              src={profilePhoto || "/noprofile.jpg"}
              alt="User Avatar"
              // Gunakan object-contain jika ingin logo terlihat utuh, 
              // atau object-cover jika ingin memenuhi lingkaran
              className="w-9 h-9 rounded-full border bg-white shadow object-contain p-1" 
            />
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border overflow-hidden z-50">
              <ul className="flex flex-col">
                <li>
                  <button
                    onClick={() => handleNavigation("profile")}
                    className="w-full text-center px-4 py-2 bg-gray-100 text-blue-900 hover:bg-gray-200"
                  >
                    My Profile
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation("company")}
                    className="w-full text-center px-4 py-2 bg-gray-100 text-blue-900 hover:bg-gray-200"
                  >
                    My Company
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full text-center px-4 py-2 bg-red-700 text-white font-semibold hover:bg-red-600"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}