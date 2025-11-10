"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/auth.jsx";
import { Menu, X } from "lucide-react";
import IconLogo from "@/components/IconLogo.jsx";

const Navigation = ({ user }) => {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
      if (window.innerWidth >= 1024) {
        setIsOpen(true); // Sidebar always open at lg and above
      } else {
        setIsOpen(false); // Sidebar closed by default on mobile
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNavClick = () => {
    if (isMobile) setIsOpen(false); // Close sidebar on link click in mobile view
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleSubmenu = (index) => {
    setActiveSubmenu(activeSubmenu === index ? null : index);
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      badge: null,
    },
    {
      name: "Birthcare Applications",
      href: "/birthcare-applications",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      badge: null,
    },
    {
      name: "Transactions",
      href: "/transactions",
      icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
      badge: null,
    },
    {
      name: "User Management",
      href: "/users",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
      badge: null,
    },
  ];

  return (
    <>
      {/* Top Navigation Bar - Only on mobile (<1024px) */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#FDB3C2]/40 to-[#F891A5]/30 backdrop-blur-md border-b border-[#E56D85]/20 shadow-sm h-16 flex items-center justify-between px-4">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-[#FDB3C2]/30 transition-colors"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? (
                <X size={24} className="text-[#A41F39]" />
              ) : (
                <Menu size={24} className="text-[#A41F39]" />
              )}
            </button>
          </div>

          {/* User Profile in Top Bar */}
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="flex items-center p-2 rounded-lg hover:bg-[#FDB3C2]/30 transition-colors"
            >
              <div className="flex-shrink-0">
                {user?.profile_image_url ? (
                  <img
                    src={user.profile_image_url}
                    alt="Profile"
                    className="h-10 w-10 rounded-full object-cover shadow-sm border-2 border-white/20"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full flex items-center justify-center font-medium bg-gradient-to-br from-[#BF3853] to-[#A41F39] text-white shadow-sm">
                    {user?.firstname?.charAt(0) || "U"}
                  </div>
                )}
              </div>
            </button>

            {/* Dropdown - Triggered by click */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 rounded-lg shadow-lg overflow-hidden z-50 bg-white w-48">
                <div className="py-1">
                  <div className="px-4 py-2 text-xs text-gray-500">
                    Signed in as{" "}
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => {
                      handleNavClick();
                      setIsDropdownOpen(false); // Close dropdown on link click
                    }}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-[#FDB3C2]/20 hover:text-[#A41F39]"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Your Profile
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsDropdownOpen(false); // Close dropdown on logout
                    }}
                    className="flex items-center cursor-pointer w-full px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-[#FDB3C2]/20 hover:text-[#A41F39]"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-3 bottom-3 left-0 z-40 bg-gradient-to-br from-[#BF3853] to-[#A41F39] shadow-xl transition-transform duration-300 ease-in-out ml-3 mr-3 rounded-3xl ${
          isMobile
            ? isOpen
              ? "translate-x-0 w-72"
              : "-translate-x-full w-72"
            : "translate-x-0 w-72" // Always visible at lg and above
        } ${isMobile ? "mt-16 mx-0 rounded-none" : "mt-0"}`} // Adjust for mobile - no margins/rounding on mobile
      >
        <div className="flex flex-col h-full">
          {/* Header Section */}
          <div className={`bg-gradient-to-b from-[#E56D85] to-[#BF3853] border-b border-[#E56D85]/20 p-6 ${!isMobile ? 'rounded-t-3xl' : ''}`}>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#923649] to-[#E56D85] shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-white truncate">
                  Admin Panel
                </h1>
                <p className="text-sm text-white/90 font-medium">
                  BirthCare System
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item, index) => (
                <li key={item.name}>
                  {item.submenu ? (
                    <>
                      <button
                        onClick={() => toggleSubmenu(index)}
                        className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors ${
                          pathname.startsWith(item.href)
                            ? "bg-indigo-50 text-indigo-600"
                            : "hover:bg-gray-50 hover:text-indigo-500"
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`${pathname.startsWith(item.href) ? 'bg-white text-[#A41F39]' : 'bg-white/20 text-white'} w-8 h-8 mr-3 rounded-lg flex items-center justify-center`}>
                            <svg
                              className="w-4 h-4"
                              fill={pathname.startsWith(item.href) ? 'currentColor' : 'none'}
                              stroke={pathname.startsWith(item.href) ? 'none' : 'currentColor'}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d={item.icon}
                              />
                            </svg>
                          </div>
                          <span className="font-medium">{item.name}</span>
                          {item.badge && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-800">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <svg
                          className={`w-4 h-4 transform transition-transform duration-200 ${
                            activeSubmenu === index ? "rotate-90" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>

                      {activeSubmenu === index && (
                        <ul className="ml-8 mt-1 space-y-1 text-gray-600">
                          {item.submenu.map((subItem) => (
                            <li key={subItem.name}>
                              <Link
                                href={subItem.href}
                                onClick={() => {
                                  handleNavClick();
                                  setActiveSubmenu(null); // Close submenu on link click
                                }}
                                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                                  pathname === subItem.href
                                    ? "bg-indigo-50 text-indigo-600"
                                    : "hover:bg-gray-50 hover:text-indigo-500"
                                }`}
                              >
                                {subItem.icon && (
                                  <svg
                                    className="w-4 h-4 mr-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d={subItem.icon}
                                    />
                                  </svg>
                                )}
                                {subItem.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={handleNavClick}
                      className={`flex items-center px-4 py-3 rounded-lg transition-colors mx-2 ${
                        pathname === item.href
                          ? "bg-white text-[#A41F39] font-medium shadow-sm"
                          : "text-white/90 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      <div className={`${pathname === item.href ? 'bg-white text-[#A41F39]' : 'bg-white/30 text-white'} w-8 h-8 mr-3 rounded-lg flex items-center justify-center`}>
                        <svg
                          className="w-4 h-4"
                          fill={pathname === item.href ? 'currentColor' : 'none'}
                          stroke={pathname === item.href ? 'none' : 'currentColor'}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={item.icon}
                          />
                        </svg>
                      </div>
                      <span className="font-medium">{item.name}</span>
                      {item.badge && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white/20 text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* User Profile - Only at lg and above */}
          {!isMobile && (
            <div className={`px-6 py-4 border-t border-white/20 ${!isMobile ? 'rounded-b-3xl' : ''}`}>
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className="flex items-center w-full p-3 rounded-lg text-white/90 hover:bg-white/20 hover:text-white transition-colors"
                >
                  <div className="flex-shrink-0">
                    {user?.profile_image_url ? (
                      <img
                        src={user.profile_image_url}
                        alt="Profile"
                        className="h-10 w-10 rounded-full object-cover shadow-sm border-2 border-white/20"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full flex items-center justify-center font-medium bg-white/30 text-white shadow-sm">
                        {user?.firstname?.charAt(0) || "U"}
                      </div>
                    )}
                  </div>
                  <div className="ml-3 text-left">
                    <p className="text-sm font-medium">
                      {user?.firstname}
                    </p>
                    <p className="text-xs opacity-80">
                      Administrator
                    </p>
                  </div>
                  <svg
                    className={`ml-auto h-5 w-5 opacity-60 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown - Triggered by click */}
                {isDropdownOpen && (
                  <div className="absolute bottom-full left-0 right-0 rounded-lg shadow-lg overflow-hidden z-50 bg-white">
                    <div className="py-1">
                      <div className="px-4 py-2 text-xs text-gray-500">
                        Signed in as{" "}
                        <span className="font-medium">{user?.email}</span>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => {
                          handleNavClick();
                          setIsDropdownOpen(false); // Close dropdown on link click
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-indigo-600"
                      >
                        <svg
                          className="w-5 h-5 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Your Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false); // Close dropdown on logout
                        }}
                        className="flex items-center cursor-pointer w-full px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-red-600"
                      >
                        <svg
                          className="w-5 h-5 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay - Only on mobile when sidebar is open */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Navigation;
