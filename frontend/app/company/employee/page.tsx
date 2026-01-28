"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CircleArrowLeft } from "lucide-react";

import { getEmployeeCompany } from "@/lib/company/companyService";
import { CompanyUI, mapCompanyToUI } from "@/lib/company/companyMapper";

export default function EmployeeCompanyPage() {
  const [company, setCompany] = useState<CompanyUI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      const res = await getEmployeeCompany();
      if (res) {
        setCompany(mapCompanyToUI(res));
      }
      setLoading(false);
    };

    fetchCompany();
  }, []);

  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  if (!company) {
    return (
      <div className="p-6 text-center text-gray-500">
        You are not assigned to any company
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Header */}
      <header
        className="flex items-center text-white px-6 py-4"
        style={{ background: "var(--gradient-blue)" }}
      >
        <Link href="/dashboard/employee" className="flex items-center">
          <CircleArrowLeft className="w-6 h-6 mr-2" />
        </Link>
        <h1 className="text-xl font-semibold">My Company</h1>
      </header>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto bg-white border rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-6 text-[var(--color-accent)]">
            Company Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border rounded-lg p-6">

            {/* LEFT */}
            <div className="flex flex-col items-center space-y-4">
              <div className="w-32 h-32 rounded-full bg-gray-100 overflow-hidden border">
                {company.logoUrl ? (
                  <Image
                    src={company.logoUrl}
                    alt="Company Logo"
                    width={128}
                    height={128}
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    No Logo
                  </div>
                )}
              </div>

              <div className="w-full">
                <label className="text-sm font-semibold">Company Name</label>
                <input
                  value={company.name}
                  readOnly
                  className="input bg-gray-100"
                />
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Location</label>
                <div className="w-full h-52 rounded overflow-hidden border">
                  <iframe
                    src={`https://www.google.com/maps?q=${company.latitude},${company.longitude}&z=15&output=embed`}
                    className="w-full h-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  value={company.latitude}
                  readOnly
                  className="input bg-gray-100"
                />
                <input
                  value={company.longitude}
                  readOnly
                  className="input bg-gray-100"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
