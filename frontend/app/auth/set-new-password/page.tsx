"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
// Import service yang baru saja kamu tunjukkan
import { forgotPassword } from "@/lib/auth/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Memanggil service dengan payload { email }
      await forgotPassword({ email });
      
      setMessage({
        type: "success",
        text: `Instruksi reset password telah dikirim ke ${email}. Silakan cek email Anda.`,
      });
      setEmail(""); // Kosongkan input setelah berhasil
    } catch (err: any) {
      // Menangkap pesan error dari backend
      const errorMessage = err.response?.data?.message || "Terjadi kesalahan saat mengirim email.";
      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-8 md:p-16">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--color-accent)" }}>
              Forgot your password?
            </h2>
            <p className="text-sm" style={{ color: "var(--color-black)" }}>
              No worries! Enter your email address below, and we’ll send you a link to reset your password.
            </p>
          </div>

          {/* Alert Message */}
          {message && (
            <div className={`p-3 rounded-md text-sm ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--color-black)" }}>
                Email
              </label>
              <input
                type="email"
                placeholder="Enter Your Email"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="input"
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className={`btn-primary w-full ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
              disabled={loading}
            >
              {loading ? "Sending..." : "Reset Password"}
            </button>
          </form>

          <div className="text-center">
            <Link
              href="/auth/employee/login"
              className="inline-flex items-center space-x-2 font-semibold hover:underline"
              style={{ color: "var(--color-primary)" }}
            >
              <span>⬅️</span>
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="hidden md:flex w-1/2 items-center justify-center relative" style={{ background: "var(--gradient-blue)" }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/logo1.png"
            alt="HRIS Illustration"
            width={600}
            height={600}
            className="object-contain max-h-[80%] opacity-90"
            priority
          />
        </div>
      </div>
    </div>
  );
}