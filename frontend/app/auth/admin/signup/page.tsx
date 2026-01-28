"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerAdmin } from "@/lib/auth/authService";

export default function SignUpPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.agree) {
      alert("You must agree to the terms");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await registerAdmin({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
      });

      alert("Account created successfully. Please login.");
      router.push("/auth/admin/login");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side */}
      <div
        className="hidden md:flex w-1/2 items-center justify-center relative"
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

      {/* Right side */}
      <div className="flex flex-col w-full md:w-1/2 p-8 md:p-16 bg-white">
        <Image src="/logo.png" alt="HRIS Logo" width={80} height={80} />

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-[var(--color-accent)]">
            Sign Up
          </h2>
          <p>Create an account for a better experience</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-black)] mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-black)] mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-black)] mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-black)] mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {/* Agree checkbox */}
          <label className="flex items-center space-x-2 text-sm text-[var(--text-muted)]">
            <input
              type="checkbox"
              name="agree"
              checked={formData.agree}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <span>I agree with the terms of use</span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link
            href="/auth/admin/login"
            className="hover:underline text-[var(--color-secondary)]"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
