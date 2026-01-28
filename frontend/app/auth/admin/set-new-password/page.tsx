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

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token || !email) {
      alert("Invalid or missing reset token");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await resetPassword({
        token,
        email,
        password: newPassword,
      });

      alert("Password reset successfully. Please login.");
      router.push("/auth/admin/login");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-8 md:p-16">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center text-center">
            <h2
              className="text-2xl md:text-3xl font-bold mb-2"
              style={{ color: "var(--color-accent)" }}
            >
              Set a new password
            </h2>

            <p className="text-sm">
              Enter your new password below to complete the reset process.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
              required
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              required
            />

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="text-center">
            <Link href="/auth/admin/login" className="font-semibold hover:underline">
              ⬅️ Back to Login
            </Link>
          </div>
        </div>
      </div>

      <div
        className="hidden md:flex w-1/2 items-center justify-center"
        style={{ background: "var(--gradient-blue)" }}
      >
        <Image src="/logo1.png" alt="Logo" width={600} height={600} />
      </div>
    </div>
  );
}
