"use client";

import { useAuth } from "@/hooks/auth.jsx";
import Navigation from "@/app/(owner)/Navigation.jsx";
import Loading from "@/components/Loading.jsx";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const AppLayout = ({ children }) => {
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Redirect non-owner users to homepage (keeping original role logic)
  useEffect(() => {
    if (user && user.system_role_id !== 2) {
      router.push("/");
    }
  }, [user, router]);

  // Show loading state while user data is being fetched
  if (!user) {
    return <Loading />;
  }

  // Prevent rendering for non-owner users until redirect occurs
  if (user.system_role_id !== 2) {
    return null;
  }

  // Render owner layout with new navigation design
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
