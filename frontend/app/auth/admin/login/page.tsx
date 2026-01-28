"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { loginAdmin } from "@/lib/auth/authService";
import { setCookie } from "cookies-next";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ 
    email: "", 
    password: "",
    remember: false 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Tambahkan fungsi handleChange ini agar input bisa diketik
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === "checkbox" ? checked : value 
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await loginAdmin({
        email: formData.email,
        password: formData.password
      });
      
      console.log("Response Admin:", res);

      if (res.token) {
        // 1. Simpan token untuk kebutuhan API
        localStorage.setItem("token", res.token);
        
        // 2. Ambil role secara dinamis dari response backend
        // Ini akan mengambil "ADMIN" atau "SUPERADMIN" sesuai database kamu
        const userRole = res.user?.role || res.role || "ADMIN";
        
        // 3. Simpan role di Cookie untuk Middleware
        setCookie("user_role", userRole, { 
          maxAge: 60 * 60 * 24, 
          path: "/" 
        });

        // 4. Redirect cerdas
        if (userRole === "ADMIN" || userRole === "SUPERADMIN") {
          router.push("/dashboard/admin");
        } else {
          router.push("/dashboard/employee");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login Admin Gagal");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE */}
      <div className="hidden md:flex w-1/2 items-center justify-center" style={{ background: "var(--gradient-blue)" }}>
        <Image src="/logo1.png" alt="Illustration" width={600} height={1000} className="object-contain max-h-[80%]" priority />
      </div>

      {/* RIGHT SIDE */}
      <div className="flex flex-col w-full md:w-1/2 p-8 md:p-16 bg-white">
        <div className="mb-6">
          <Image src="/logo.png" alt="HRIS Logo" width={80} height={80} />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-secondary">Sign In</h2>
          <p className="text-gray-500">Welcome back to HRIS cmlabs!</p>
        </div>

        {error && (
          <div className="mb-4 text-red-500 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input border w-full p-2 rounded"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input border w-full p-2 rounded"
              required
            />
          </div>

          <div className="flex justify-between text-sm">
            <label className="flex gap-2 items-center">
              <input type="checkbox" name="remember" checked={formData.remember} onChange={handleChange} />
              Remember Me
            </label>
            <Link href="/auth/forgot-password" title="Forgot Password" className="text-blue-600 hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="btn-primary w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Don’t have an account?{" "}
          <Link href="/auth/admin/signup" className="text-blue-600 hover:underline">Sign Up here</Link>
        </p>
      </div>
    </div>
  );
}