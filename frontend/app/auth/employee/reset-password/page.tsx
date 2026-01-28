"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Reset password link sent to:", email);
    alert(`If ${email} exists, a reset link will be sent.`);
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
              No worries! Enter your email address below, and we’ll send you a link
              to reset your password.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-sm font-semibold mb-1"
                style={{ color: "var(--color-black)" }}
              >
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

            {/* Reset Button */}
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

      {/* Right Side (Gradient + Illustration) */}
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
