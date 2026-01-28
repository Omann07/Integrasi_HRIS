"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CircleArrowLeft, Upload, Pencil } from "lucide-react";

import {
  getMyCompany,
  createCompany,
  updateCompany,
} from "@/lib/company/companyService";
import { CompanyUI, mapCompanyToUI } from "@/lib/company/companyMapper";

export default function AdminCompanyPage() {
  const [company, setCompany] = useState<CompanyUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // FORM STATE
  const [companyName, setCompanyName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState(300);

  // LOGO STATE
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasCompany = company !== null;

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    setLoading(true);
    const res = await getMyCompany();

    if (res) {
      const mapped = mapCompanyToUI(res);
      setCompany(mapped);
      setCompanyName(mapped.name);
      setLatitude(mapped.latitude);
      setLongitude(mapped.longitude);
      setRadius(mapped.radius);
      setPreviewUrl(mapped.logoUrl);
    }

    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!companyName.trim()) {
      alert("Company name wajib diisi");
      return;
    }

    if (!latitude || !longitude) {
      alert("Latitude & Longitude wajib diisi");
      return;
    }

    if (isNaN(Number(latitude)) || isNaN(Number(longitude))) {
      alert("Latitude & Longitude harus angka");
      return;
    }

    if (radius <= 0) {
      alert("Radius harus lebih dari 0");
      return;
    }

    const formData = new FormData();
    formData.append("companyName", companyName);
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);
    formData.append("radius", String(radius));

    if (selectedFile) {
      formData.append("logo", selectedFile);
    }

    if (hasCompany) {
      await updateCompany(formData);
    } else {
      await createCompany(formData);
    }

    await fetchCompany();
    setIsEditing(false);
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* HEADER */}
      <header
        className="flex items-center px-6 py-4 text-white"
        style={{ background: "var(--gradient-blue)" }}
      >
        <Link href="/dashboard/admin">
          <CircleArrowLeft className="w-6 h-6 mr-2" />
        </Link>
        <h1 className="text-xl font-semibold">My Company</h1>
      </header>

      {/* CONTENT */}
      <div className="p-6">
        <div className="max-w-5xl mx-auto bg-white rounded-lg p-6 shadow border">
          <h2 className="text-lg font-bold mb-8 text-[var(--color-accent)]">
            My Company Management
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* LEFT */}
            <div className="flex flex-col items-center space-y-6">
              {/* LOGO = UPLOAD */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-44 h-44 bg-gray-100 rounded-full flex items-center justify-center
                           overflow-hidden border relative cursor-pointer hover:opacity-80">
                {previewUrl ? (
                  <Image src={previewUrl} alt="Logo" fill className="object-cover" />
                ) : (
                  <Upload className="w-12 h-12 text-gray-400" />
                )}

                <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100
                                flex items-center justify-center text-white text-sm font-semibold">
                  Change Logo
                </div>
              </div>

              <input
                type="file"
                hidden
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
              />

              <div className="w-full space-y-2">
                <label className="text-sm font-bold">Company Name</label>
                <input
                  value={companyName}
                  readOnly={hasCompany}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={`input w-full ${hasCompany ? "bg-gray-50" : ""}`}
                />
              </div>
              <div className="w-full space-y-2">
                <label className="text-sm font-bold">Radius Attendance</label>
                <input
                  value={radius}
                  readOnly={hasCompany}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={`input w-full ${hasCompany ? "bg-gray-50" : ""}`}
                />
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-6">
              <div>
                <label className="text-sm font-bold">Location</label>
                <div className="h-52 border rounded overflow-hidden">
                  <iframe
                    src={`https://maps.google.com/maps?q=${latitude || -7.9},${longitude || 112.6}&z=15&output=embed`}
                    className="w-full h-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  value={latitude}
                  readOnly={hasCompany}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="input"
                  placeholder="-6.175062962395454"
                />
                <input
                  value={longitude}
                  readOnly={hasCompany}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="input"
                  placeholder="106.82759875762943"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => (hasCompany ? setIsEditing(true) : handleSave())}
              className="btn-primary px-10 py-2"
            >
              {hasCompany ? "Edit" : "Add"}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL EDIT */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl">
            <div className="px-6 py-4 border-b font-bold">Edit Company</div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* LEFT - LOGO & NAME */}
              <div className="flex flex-col items-center space-y-4">
                {/* COMPANY NAME */}
                <div className="w-full">
                  <label className="text-sm font-bold">Company Name</label>
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="input w-full"
                  />
                </div>
                {/* LOGO CLICKABLE */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-36 h-36 bg-gray-100 rounded-full flex items-center justify-center
                            overflow-hidden border relative cursor-pointer hover:opacity-80"
                >
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="Logo"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Upload className="w-10 h-10 text-gray-400" />
                  )}

                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100
                                  flex items-center justify-center text-white text-xs font-semibold">
                    Change Logo
                  </div>
                </div>

                {/* FILE INPUT (REUSE) */}
                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              {/* RIGHT - COORDS */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold">Location</label>
                  <div className="h-32 border rounded overflow-hidden">
                    <iframe
                      src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
                      className="w-full h-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="input"
                    placeholder="Latitude"
                  />
                  <input
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="input"
                    placeholder="Longitude"
                  />
                </div>
                <div className="w-full">
                <label className="text-sm font-bold">Radius</label>
                <input
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="input"
                  type="number"
                  placeholder="Radius"
                />
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button
                onClick={() => setIsEditing(false)}
                className="border px-6 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn-primary px-8 py-2"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
