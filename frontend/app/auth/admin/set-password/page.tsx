"use client";

import Link from "next/link";
import Image from "next/image";

export default function ResetSuccessPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side (content) */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-8 md:p-16">
        <div className="w-full max-w-md text-center space-y-6">
          {/* Title */}
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-accent)]">
              Your password has been successfully reset
            </h2>

            {/* Description */}
            <p className="text-[var(--color-black)] text-sm mt-2">
              You can now log in with your new password.
              If you encounter any issues, please contact support!
            </p>
          </div>

          {/* Login Button */}
          <Link
            href="/auth/admin/login"
            className="btn-primary block"
          >
            Login Now
          </Link>
        </div>
      </div>

      {/* Right side (gradient background + image) */}
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
            className="object-contain max-h-[80%]"
            priority
          />
        </div>
      </div>
    </div>
  );
}
