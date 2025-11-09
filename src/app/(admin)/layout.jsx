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

  // Prevent rendering for non-admin users until redirect occurs
  if (!user || user.system_role_id !== 1) {
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
