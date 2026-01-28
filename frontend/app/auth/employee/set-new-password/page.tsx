"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    console.log("Password reset:", formData.newPassword);
    alert("Password has been reset successfully (dummy).");
  };

  return (
    <div className="min-h-screen flex">

      {/* Left side (form) */}
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
              Ensure it’s strong and secure.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* New Password */}
            <div>
              <label
                className="block text-sm font-semibold mb-1"
                style={{ color: "var(--color-black)" }}
              >
                New Password
              </label>

              <input
                type="password"
                name="newPassword"
                placeholder="Enter Your New Password"
                value={formData.newPassword}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                className="block text-sm font-semibold mb-1"
                style={{ color: "var(--color-black)" }}
              >
                Confirm Password
              </label>

              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Your New Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            {/* Submit */}
            <button type="submit" className="btn-primary">
              Reset Password
            </button>
          </form>

          {/* Back to login */}
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

      {/* Right side (gradient + image) */}
      <div
        className="hidden md:flex w-1/2 items-center justify-center relative"
        style={{ background: "var(--gradient-blue)" }}
      >
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
