"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation"; // Import hooks untuk URL & Navigasi
import { resetPassword } from "@/lib/auth/authService"; // Import service reset

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Ambil token dan email dari URL query string
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validasi dasar
    if (!token || !email) {
      alert("Link tidak valid atau token kadaluarsa.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      // Panggil backend service
      await resetPassword({
        token,
        email,
        password: formData.newPassword,
      });

      alert("Password has been reset successfully! Silakan login kembali.");
      router.push("/auth/employee/login"); // Redirect ke login
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side (form) */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-8 md:p-16">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--color-accent)" }}>
              Set a new password
            </h2>
            <p className="text-sm" style={{ color: "var(--color-black)" }}>
              Enter your new password below to complete the reset process.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">New Password</label>
              <input
                type="password"
                name="newPassword"
                placeholder="Enter Your New Password"
                value={formData.newPassword}
                onChange={handleChange}
                className="input"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Your New Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Processing..." : "Reset Password"}
            </button>
          </form>

          <div className="text-center">
            <Link href="/auth/employee/login" className="inline-flex items-center space-x-2 font-semibold hover:underline" style={{ color: "var(--color-primary)" }}>
              <span>⬅️</span>
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="hidden md:flex w-1/2 items-center justify-center relative" style={{ background: "var(--gradient-blue)" }}>
        <Image src="/logo1.png" alt="HRIS" width={600} height={600} className="object-contain max-h-[80%] opacity-90" priority />
      </div>
    </div>
  );
}