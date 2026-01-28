"use client";

import { useState, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { resetPassword } from "@/lib/auth/authService";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token || !email) {
      alert("Invalid or expired reset link");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await resetPassword({ token, email, password });
      router.push("/auth/reset-success");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-8 md:p-16">
        <div className="w-full max-w-md space-y-6">
          {/* Title */}
          <div className="flex flex-col items-center text-center">
            <h2
              className="text-2xl md:text-3xl font-bold mb-2"
              style={{ color: "var(--color-accent)" }}
            >
              Set a new password
            </h2>

            <p className="text-sm" style={{ color: "var(--color-black)" }}>
              Enter your new password below to complete the reset process.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter Your New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm Your New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          {/* Back to login */}
          <div className="text-center">
            <Link
              href="/auth/admin/login"
              className="font-semibold hover:underline"
              style={{ color: "var(--color-primary)" }}
            >
              ⬅️ Back to Login
            </Link>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div
        className="hidden md:flex w-1/2 items-center justify-center relative"
        style={{ background: "var(--gradient-blue)" }}
      >
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
  );
}
