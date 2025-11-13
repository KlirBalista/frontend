import Link from "next/link";
import AuthCard from "@/app/(auth)/AuthCard.jsx";
import ApplicationLogo from "@/components/ApplicationLogo.jsx";

export const metadata = {
  title: "BirthCare",
};

const Layout = ({ children }) => {
  return (
    <div>
      <div className="text-gray-900 antialiased">{children}</div>
    </div>
  );
};

export default Layout;
