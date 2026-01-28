"use client";

import Link from "next/link";
import Image from "next/image";

export default function CheckEmailPage() {
  const userEmail = "username@gmail.com"; // dummy → nanti bisa diganti dengan state/context

  return (
    <div className="min-h-screen flex">
      
      {/* Left side */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-8 md:p-16">
        <div className="w-full max-w-md text-center space-y-6">

          {/* Title */}
          <div className="flex flex-col items-center justify-center text-center">
            <h2
              className="text-2xl md:text-3xl font-bold mb-2"
              style={{ color: "var(--color-accent)" }}
            >
              Please, check your email
            </h2>

            <p style={{ color: "var(--color-black)" }} className="text-sm">
              We sent a password reset link to your email{" "}
              <span className="font-reguler" style={{ color: "var(--color-black)" }}>
                {userEmail}
              </span>{" "}
              which is valid for 24 hours after you receive the email.
              Please check your inbox!
            </p>
          </div>

          {/* Open Gmail Button */}
          <a
            href="https://mail.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary block text-center"
          >
            Open Gmail
          </a>

          {/* Resend link */}
          <p className="text-sm" style={{ color: "var(--color-black)" }}>
            Didn’t receive the email?{" "}
            <button
              type="button"
              onClick={() => alert("Resend email clicked (dummy)")}
              className="hover:underline"
              style={{ color: "var(--color-secondary)" }}
            >
              Click here to resend!
            </button>
          </p>

          {/* Back to login */}
          <div className="text-center">
            <Link
              href="/auth/admin/login"
              className="inline-flex items-center space-x-2 font-semibold hover:underline"
              style={{ color: "var(--color-primary)" }}
            >
              <span>⬅️</span>
              <span>Back to Login</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Right side */}
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
