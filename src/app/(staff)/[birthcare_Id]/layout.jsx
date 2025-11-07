"use client";

import { useAuth } from "@/hooks/auth.jsx";
import Loading from "@/components/Loading.jsx";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Navigation from "./Navigation";

const AppLayout = ({ children }) => {
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const { birthcare_Id } = useParams();

  useEffect(() => {
    if (!user) return; // Wait for user to load

    // Redirect if user is neither role 2 nor role 3
    if (user.system_role_id !== 2 && user.system_role_id !== 3) {
      router.push("/");
      return;
    }

    // Get facility and check status
    const facility = user.system_role_id === 3 
      ? user?.birth_care_staff?.birth_care 
      : user?.birth_care;

    // Block access if facility is rejected
    if (facility?.status === 'rejected') {
      router.push("/");
      return;
    }

    // Check birthcare match based on role
    const birthcareId =
      user.system_role_id === 3
        ? user?.birth_care_staff?.birth_care_id
        : user?.birth_care?.id;

    if (birthcareId && parseInt(birthcare_Id) !== birthcareId) {
      router.push(`/${birthcareId}/dashboard`);
    }
  }, [user, router, birthcare_Id]);

  if (!user) {
    return <Loading />;
  }

  if (user.system_role_id !== 2 && user.system_role_id !== 3) {
    return null;
  }

  return (
    <div className={`min-h-screen bg-gray-100 transition-all duration-300`} id="app-layout">
      <Navigation user={user} />
      <main className="lg:ml-80 transition-all duration-300 pt-16 lg:pt-0 lg:mr-3 min-h-screen">
        <div className="p-4 lg:p-6 h-full">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 h-[calc(100vh-8rem)] lg:h-[calc(100vh-3rem)]">
            <div className="p-6 lg:p-8 h-full overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
