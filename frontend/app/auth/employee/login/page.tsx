"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { loginEmployee } from "@/lib/auth/authService";
import { setCookie } from "cookies-next";

export default function EmployeeLoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    employeeCode: "",
    password: "",
    remember: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await loginEmployee({
        employeeCode: formData.employeeCode,
        password: formData.password,
      });

      // Console log ini membantu debugging role apa yang dikirim backend
      console.log("Response Employee:", res);

      if (res.token) {
        // A. Simpan token untuk API
        localStorage.setItem("token", res.token);

        // B. Simpan role di Cookie agar Middleware bisa memvalidasi akses
        // Menggunakan fallback "EMPLOYEE" sesuai data di database kamu
        const userRole = res.user?.role || res.role || "EMPLOYEE"; 

        setCookie("user_role", userRole, { 
          maxAge: 60 * 60 * 24, // Berlaku 24 jam
          path: "/", 
        });

        // C. Redirect ke dashboard employee
        router.push("/dashboard/employee");
      }
    } catch (err: any) {
      // Menangkap pesan error dari backend
      setError(err.response?.data?.message || "Login gagal, silakan cek kembali kode karyawan Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE - Illustration */}
      <div
        className="hidden md:flex w-1/2 items-center justify-center"
        style={{ background: "var(--gradient-blue)" }}
      >
        <Image
          src="/logo1.png"
          alt="HRIS Illustration"
          width={600}
          height={600}
          className="object-contain max-h-[80%]"
          priority
        />
      </div>

      {/* RIGHT SIDE - Form */}
      <div className="flex flex-col w-full md:w-1/2 p-8 md:p-16 bg-white">
        <div className="mb-6">
          <Image src="/logo.png" alt="HRIS Logo" width={80} height={80} />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-[var(--color-accent)]">
            Sign In with Employee Code
          </h2>
          <p className="text-gray-500">
            Welcome back to HRIS cmlabs!
          </p>
        </div>

        {error && (
          <div className="mb-4 text-center text-red-500 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold">Employee Code</label>
            <input
              type="text"
              name="employeeCode"
              value={formData.employeeCode}
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
              <input
                type="checkbox"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
              />
              Remember Me
            </label>

            <Link
              href="/auth/forgot-password"
              className="text-blue-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn-primary w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}