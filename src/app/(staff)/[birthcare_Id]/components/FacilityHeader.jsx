"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "@/lib/axios";

export default function FacilityHeader({ title = "", facility = null }) {
  const { birthcare_Id } = useParams();
  const [birthCareInfo, setBirthCareInfo] = useState(facility);

  useEffect(() => {
    if (birthCareInfo || !birthcare_Id) return;
    let cancelled = false;
    const fetchInfo = async () => {
      try {
        const res = await axios.get(`/api/birthcare/${birthcare_Id}`);
        const data = res?.data?.data || res?.data || null;
        if (!cancelled && data) setBirthCareInfo(data);
      } catch (e) {
        // Silent fail; keep header but without facility data
        console.error("FacilityHeader fetch failed", e);
      }
    };
    fetchInfo();
    return () => {
      cancelled = true;
    };
  }, [birthcare_Id, birthCareInfo]);

  const name = birthCareInfo?.name?.toUpperCase() || "BIRTH CARE FACILITY";
  const desc = birthCareInfo?.description || "";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
      <div className="p-8 text-center border-b border-gray-200">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8v2a1 1 0 001 1h4a1 1 0 001-1v-2a1 1 0 00-1-1h-4a1 1 0 00-1 1z" />
            </svg>
          </div>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-1">{name}</h1>
        {desc ? (
          <p className="text-sm text-gray-600 mb-4">{desc}</p>
        ) : (
          <div className="mb-4" />
        )}
        <div className="border-t border-b border-gray-300 py-3">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
      </div>
    </div>
  );
}
