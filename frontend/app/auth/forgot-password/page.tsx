"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { forgotPassword } from "@/lib/auth/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      await forgotPassword({ email });
      alert("If this email exists, a reset link has been sent.");
      setEmail("");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to send reset link");
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
              Forgot your password?
            </h2>

            <p className="text-sm" style={{ color: "var(--color-black)" }}>
              Enter your email address and we’ll send you a reset link.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">
                Email
              </label>

              <input
                type="email"
                placeholder="Enter Your Email"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                className="input"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Sending..." : "Reset Password"}
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
