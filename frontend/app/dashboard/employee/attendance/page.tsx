"use client";

import React, { useEffect, useState } from "react";
import { CirclePlus } from "lucide-react";
import {
  getAttendances,
  createAttendance,
} from "@/lib/attendance/attendanceService";
import { AttendanceUI } from "@/lib/attendance/attendanceMapper";

export default function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceUI[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);


  // input modal
  const [workType, setWorkType] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    const res = await getAttendances();
    setAttendanceData(res);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoto(e.target.files?.[0] || null);
  };

  const handleSubmit = async () => {
    try {
      setSubmitError("");
      setLoading(true);
  
      const formData = new FormData();
      formData.append("workType", workType);
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
  
      if (photo) formData.append("proof", photo);
  
      await createAttendance(formData);
  
      alert("Attendance berhasil!");
  
      setShowModal(false);
      fetchAttendance();
  
      // reset form
      setWorkType("");
      setLatitude("");
      setLongitude("");
      setPhoto(null);
  
    } catch (error: any) {
  
      console.log("ERROR RESPONSE:", error?.response);
  
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed submit attendance";
  
      setSubmitError(message);
  
    } finally {
      setLoading(false);
    }
  };
  
  

  return (
    <div className="p-6 dashboard-container">
      {/* CARD */}
      <div className="card card-shadow border border-gray-200">
        {/* HEADER */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-black">
            Attendance Information
          </h2>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center font-bold px-4 py-2 rounded-md text-white"
            style={{ background: "#2D8EFF" }}
          >
            <CirclePlus className="w-4 h-4 mr-2" /> Add Data
          </button>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead
              className="text-white text-center font-bold"
              style={{ background: "var(--color-primary)" }}
            >
              <tr>
                <th className="p-3 border w-12">No.</th>
                <th className="p-3 border">Full Name</th>
                <th className="p-3 border">Employee ID</th>
                <th className="p-3 border">Company</th>
                <th className="p-3 border">Work Schedule</th>
                <th className="p-3 border">Date</th>
                <th className="p-3 border">Check-In</th>
                <th className="p-3 border">Check-Out</th>
                <th className="p-3 border">Work Type</th>
                <th className="p-3 border">Location</th>
                <th className="p-3 border">Latitude</th>
                <th className="p-3 border">Longitude</th>
                <th className="p-3 border">Distance</th>
                <th className="p-3 border">Attendance</th>
                <th className="p-3 border">Proof</th>
                <th className="p-3 border">Status</th>
              </tr>
            </thead>

            <tbody>
              {attendanceData.map((row, i) => (
                <tr
                  key={row.id}
                  className="border text-center hover:bg-gray-100 bg-white"
                >
                  <td className="p-3 border">{i + 1}</td>
                  <td className="p-3 border">{row.fullName}</td>
                  <td className="p-3 border">{row.employeeCode}</td>
                  <td className="p-3 border">{row.companyName}</td>
                  <td className="p-3 border">{row.shiftName}</td>
                  <td className="p-3 border">{row.date}</td>
                  <td className="p-3 border">
                    {row.checkInTime ?? "-"}
                  </td>
                  <td className="p-3 border">
                    {row.checkOutTime ?? "-"}
                  </td>
                  <td className="p-3 border">{row.workType}</td>
                  <td className="p-3 border">
                    {row.locationStatus ?? "-"}
                  </td>
                  <td className="p-3 border">
                    {row.latitude ?? "-"}
                  </td>
                  <td className="p-3 border">
                    {row.longitude ?? "-"}
                  </td>
                  <td className="p-3 border">
                    {row.distance ?? "-"}
                  </td>
                  <td className="p-3 border">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        row.attendanceStatus === "ALPHA"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {row.attendanceStatus}
                    </span>
                  </td>
                  <td className="p-3 border">
                    {row.proofUrl ? (
                      <img
                        src={row.proofUrl}
                        className="w-10 h-10 rounded object-cover mx-auto border"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-3 border">
                    {row.approvalStatus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[900px] shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-black">
                Add Attendance Employee
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-6 p-6">
            {submitError && (
              <div className="mx-6 mt-4 bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-md text-sm">
                {submitError}
              </div>
            )}
              <div className="space-y-5">
                <div>
                  <label className="font-bold">Work Type</label>
                  <div className="mt-2 space-y-2">
                    <label className="flex gap-2">
                      <input
                        type="radio"
                        value="WFO"
                        checked={workType === "WFO"}
                        onChange={() => setWorkType("WFO")}
                      />
                      WFO
                    </label>
                    <label className="flex gap-2">
                      <input
                        type="radio"
                        value="WFA"
                        checked={workType === "WFA"}
                        onChange={() => setWorkType("WFA")}
                      />
                      WFA
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-bold">Take Photo</label>
                  <input type="file" onChange={handlePhoto} />
                </div>
              </div>

              <div>
                <label className="font-bold">Location</label>
                <iframe
                  src={`https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
                  className="w-full h-40 border"
                />
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <input
                    placeholder="Latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="input"
                  />
                  <input
                    placeholder="Longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2 rounded-md text-white font-bold"
                style={{ background: "var(--color-primary)" }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
