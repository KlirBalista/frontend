"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/auth";

const LoginLinks = () => {
  const { user } = useAuth({ middleware: "guest" });
  var birthcare_Id = null;
  console.log(user);

  if (user?.system_role_id === 3) {
    birthcare_Id = user?.birth_care_staff.birth_care_id;
  }

  return (
    <div className="flex items-center gap-3">
      {user ? (
        <>
          {user.system_role_id === 1 ? (
            <Link
              href="/dashboard"
              className="px-6 py-2.5 bg-[#A41F39] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#A41F39]/50 transition-all duration-300 hover:scale-105"
            >
              Dashboard
            </Link>
          ) : user.system_role_id === 2 ? (
            <Link
              href="/facility-dashboard"
              className="px-6 py-2.5 bg-[#A41F39] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#A41F39]/50 transition-all duration-300 hover:scale-105"
            >
              Dashboard
            </Link>
          ) : user.system_role_id === 3 ? (
            <Link
              href={`/${birthcare_Id}/dashboard`}
              className="px-6 py-2.5 bg-[#A41F39] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#A41F39]/50 transition-all duration-300 hover:scale-105"
            >
              Dashboard
            </Link>
          ) : null}
        </>
      ) : (
        <>
          <Link 
            href="/login" 
            className="px-4 py-2.5 font-semibold text-gray-700 hover:text-[#E56D85] transition-all duration-300"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-6 py-2.5 bg-[#A41F39] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#A41F39]/50 transition-all duration-300 hover:scale-105"
          >
            Register
          </Link>
        </>
      )}
    </div>
  );
};

export default LoginLinks;
