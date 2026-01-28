"use client";

import Link from "next/link";
import Image from "next/image";

export default function ResetExpiredPage() {
  return (
    <div className="min-h-screen flex">
      
      {/* Left side */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-8 md:p-16">
        <div className="w-full max-w-md text-center space-y-6">
          
          {/* Title */}
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--color-accent)" }}>
              Link reset password is expired
            </h2>

            <p className="text-sm mt-2" style={{ color: "var(--color-black)" }}>
              The password reset link has expired.  
              Please request a new link to reset your password.
            </p>
          </div>

          {/* Back to Login Button */}
          <Link
            href="/auth/employee/login"
            className="btn-primary block"
          >
            Back to Login
          </Link>

        </div>
      </div>

      {/* Right side (blue gradient) */}
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
