"use client";

import { useAuth } from "@/hooks/auth.jsx";
import Navigation from "@/app/(admin)/Navigation.jsx";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const AppLayout = ({ children }) => {
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();

  // Redirect non-admin users to homepage
  useEffect(() => {
    if (user && user.system_role_id !== 1) {
      router.push("/");
    }
  }, [user, router]);

  // Show loading state while user data is being fetched
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation user={null} />
        <main className="lg:ml-72 transition-all duration-300 pt-16 lg:pt-0">
          <div className="min-h-screen bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-white py-8">
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#BF3853] mx-auto"></div>
                <p className="mt-4 text-gray-700 font-semibold">Loading...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Prevent rendering for non-admin users until redirect occurs
  if (user.system_role_id !== 1) {
    return null;
  }

  // Render admin layout for users with system_role_id === 1
  return (
    <div className="min-h-screen bg-white">
      <Navigation user={user} />
      <main className="lg:ml-72 transition-all duration-300 pt-16 lg:pt-0">{children}</main>
    </div>
  );
};

export default AppLayout;
