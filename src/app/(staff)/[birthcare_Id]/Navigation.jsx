"use client";

import { useState, useEffect } from "react";
import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/auth.jsx";
import { Menu, X } from "lucide-react";
import IconLogo from "@/components/IconLogo.jsx";

const Navigation = ({ user }) => {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { birthcare_Id } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState({});
  const [facility, setFacility] = useState(null);

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

  // Fetch facility data
  useEffect(() => {
    const fetchFacility = async () => {
      try {
        const response = await axios.get(`/api/birthcare/${birthcare_Id}`);
        setFacility(response.data.data);
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error("Error fetching facility:", error);
        }
        // 404 means no facility found
        setFacility(null);
      }
    };

    if (birthcare_Id) {
      fetchFacility();
    }
  }, [birthcare_Id]);

  const handleNavClick = () => {
    if (isMobile) setIsOpen(false); // Close sidebar on link click in mobile view
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleSubMenu = (itemLabel) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [itemLabel]: !prev[itemLabel]
    }));
  };

  // Define all navigation links with required permissions
  const allNavLinks = [
    {
      href: `/${birthcare_Id}/dashboard`,
      label: "Dashboard",
      permission: null,
      icon: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
    },
    {
      href: `/${birthcare_Id}/patients`,
      label: "Patient",
      permission: null,
      icon: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-8 8c0-2.67 5.33-8 8-8s8 5.33 8 8H4z",
      hasSubItems: true,
      subItems: [
        {
          href: `/${birthcare_Id}/patients`,
          label: "List",
          permission: "manage_patients",
          icon: "M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4H4zM10 18v-4h3v4h-3zM16 18v-4h3v4h-3zM4 12v-2h16v2H4z",
        },
        {
          href: `/${birthcare_Id}/patient-documents`,
          label: "Documents",
          permission: "manage_patient_documents",
          icon: "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z",
        },
        {
          href: `/${birthcare_Id}/patient-chart`,
          label: "Chart",
          permission: "manage_patient_chart",
          icon: "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z",
        },
        {
          href: `/${birthcare_Id}/admission-list`,
          label: "Admission",
          permission: "manage_patient_admission",
          icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
        },
        {
          href: `/${birthcare_Id}/patient-discharge`,
          label: "Discharge",
          permission: "manage_patient_discharge",
          icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z M16 12l4-4-4-4v3H8v2h8v3z",
          hasSubItems: true,
          subItems: [
            {
              href: `/${birthcare_Id}/patient-discharge/mother`,
              label: "Mother",
              permission: "manage_patient_discharge",
              icon: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-8 8c0-2.67 5.33-8 8-8s8 5.33 8 8H4z",
            },
            {
              href: `/${birthcare_Id}/patient-discharge/newborn`,
              label: "Newborn",
              permission: "manage_patient_discharge",
              icon: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-8 8c0-2.67 5.33-8 8-8s8 5.33 8 8H4z",
            },
          ],
        },
        {
          href: `/${birthcare_Id}/referrals`,
          label: "Referrals",
          permission: "manage_referrals",
          icon: "M16 1l-4 4h3v9h-3l4 4 4-4h-3V5h3l-4-4zM9 3H5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h4V9H5V5h4V3z",
        },
      ],
    },
    {
      href: `/${birthcare_Id}/prenatal`,
      label: "Prenatal",
      permission: null,
      icon: "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z",
      hasSubItems: true,
      subItems: [
        {
          href: `/${birthcare_Id}/prenatal-chart`,
          label: "Schedule",
          permission: "manage_prenatal_schedule",
          icon: "M16 4h2c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h2V2h8v2zM8 6v2h8V6h-2V4h-4v2H8zM6 8v10h12V8H6z",
        },
        {
          href: `/${birthcare_Id}/prenatal-forms`,
          label: "Forms",
          permission: "manage_prenatal_forms",
          icon: "M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM12 2.75c.41 0 .75.34.75.75s-.34.75-.75.75-.75-.34-.75-.75.34-.75.75-.75zM10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z",
        },
        {
          href: `/${birthcare_Id}/prenatal-visits-log`,
          label: "Visit Logs",
          permission: "manage_prenatal_visits_log",
          icon: "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-3 17l-5-5 1.41-1.41L10 12.17l7.59-7.59L19 6l-9 9zM12 18h-2v-2h2v2zm0-4h-2V8h2v6z",
        },
      ],
    },
    {
      href: `/${birthcare_Id}/rooms`,
      label: "Room Management",
      permission: "manage_rooms",
      icon: "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h8v2zm0-4h-8v-2h8v2zm0-4h-8V9h8v2z",
    },
    {
      href: `/${birthcare_Id}/labor-monitoring`,
      label: "Labor Monitoring",
      permission: "manage_labor_monitoring",
      icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.81 5.05-1.37 8.2-.23 1.33-.47 2.41-.66 3.18-.19.77-.33 1.28-.4 1.53l-.13.48h-4.16l-.13-.48c-.07-.25-.21-.76-.4-1.53-.19-.77-.43-1.85-.66-3.18-.56-3.15-1.22-6.62-1.37-8.2H16.64z",
    },
    {
      href: `/${birthcare_Id}/newborn-records`,
      label: "Newborn",
      permission: null,
      icon: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-8 8c0-2.67 5.33-8 8-8s8 5.33 8 8H4z",
      hasSubItems: true,
      subItems: [
        {
          href: `/${birthcare_Id}/newborn-records/birth-details`,
          label: "Birth Details & APGAR Score",
          permission: "manage_birth_details",
          icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z",
        },
        {
          href: `/${birthcare_Id}/newborn-records/screening-results`,
          label: "Newborn Screening",
          permission: "manage_screening_results",
          icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
        },
        {
          href: `/${birthcare_Id}/newborn-records/certificate-live-birth`,
          label: "Certificate of Live Birth",
          permission: "manage_certificate_live_birth",
          icon: "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z",
        },
      ],
    },
    {
      href: `/${birthcare_Id}/billing`,
      label: "Billing",
      permission: null,
      icon: "M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z",
      hasSubItems: true,
      subItems: [
        {
          href: `/${birthcare_Id}/item-charges`,
          label: "Item Charges",
          permission: "manage_item_charges",
          icon: "M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z",
        },
        {
          href: `/${birthcare_Id}/patient-charges`,
          label: "Patient Charges",
          permission: "manage_patient_charges",
          icon: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-8 8c0-2.67 5.33-8 8-8s8 5.33 8 8H4z",
        },
        {
          href: `/${birthcare_Id}/payments`,
          label: "Payments",
          permission: null,
          icon: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z",
          hasSubItems: true,
          subItems: [
            {
              href: `/${birthcare_Id}/payments`,
              label: "Payments",
              permission: "manage_payments",
            icon: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z",
            },
            {
              href: `/${birthcare_Id}/payments/reports`,
              label: "Reports",
              permission: "manage_payments",
            icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z",
            },
          ],
        },
      ],
    },
    {
      href: `/${birthcare_Id}/map`,
      label: "Map",
      permission: "manage_map",
      icon: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    },
    {
      href: `/${birthcare_Id}/role`,
      label: "Role",
      permission: "manage_role",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    },
    {
      href: `/${birthcare_Id}/staff`,
      label: "Staff",
      permission: "manage_staff",
      icon: "M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4H4zM10 18v-4h3v4h-3zM16 18v-4h3v4h-3zM4 12v-2h16v2H4z",
    },
  ];

  // Filter nav links: owners (system_role_id === 2) get all links, staff (system_role_id === 3) get permission-based links
  const navLinks =
    user.system_role_id === 2
      ? allNavLinks // Owners see all links
      : allNavLinks
          .filter((link) => {
            // If link has subItems, don't require permission on the group
            if (link.hasSubItems) return true;
            if (!link.permission) return true;
            return user.permissions.includes(link.permission);
          })
          .map((link) => {
            // Also filter subItems based on permissions
            if (link.hasSubItems && link.subItems) {
              const filteredSub = link.subItems
                .filter((subItem) => {
                  if (subItem.hasSubItems) return true; // group subItem, evaluate later
                  if (!subItem.permission) return true;
                  return user.permissions.includes(subItem.permission);
                })
                .map((subItem) => {
                  // Filter nested subItems
                  if (subItem.hasSubItems && subItem.subItems) {
                    const nestedFiltered = subItem.subItems.filter((nestedItem) => {
                      if (!nestedItem.permission) return true;
                      return user.permissions.includes(nestedItem.permission);
                    });
                    // Only keep this group if it has any visible nested items
                    if (nestedFiltered.length === 0) return null;
                    return { ...subItem, subItems: nestedFiltered };
                  }
                  return subItem;
                })
                .filter(Boolean); // remove empty groups
              return { ...link, subItems: filteredSub };
            }
            return link;
          })
          // Finally, remove any top-level groups that ended up empty
          .filter((link) => !link.hasSubItems || (link.subItems && link.subItems.length > 0));

  return (
    <>
      {/* Top Navigation Bar - Only on mobile (<1024px) */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm h-16 flex items-center justify-between px-4">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-white transition-colors"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? (
                <X size={24} className="text-gray-600" />
              ) : (
                <Menu size={24} className="text-gray-600" />
              )}
            </button>
          </div>

          {/* User Profile in Top Bar */}
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="flex items-center p-2 rounded-lg hover:bg-white transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full flex items-center justify-center font-medium bg-gradient-to-br from-[#BF3853] to-[#A41F39] text-white shadow-sm">
                  {user?.firstname?.charAt(0) || "U"}
                </div>
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
            <div className="flex items-center justify-center space-x-3">
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
                  {facility?.name || "Staff Panel"}
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
              {navLinks.map((item) => (
                <li key={item.label}>
                  {item.hasSubItems ? (
                    <div>
                      {/* Parent item with dropdown */}
                      <button
                        onClick={() => toggleSubMenu(item.label)}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors mx-2 ${
                          pathname.startsWith(item.href)
                            ? "bg-white text-[#A41F39] font-medium shadow-sm"
                            : "text-white/90 hover:bg-white/20 hover:text-white"
                      }`}
                      >
                        <div className="flex items-center">
                          <div className={`${pathname.startsWith(item.href) ? 'bg-white text-[#A41F39]' : 'bg-white/30 text-white'} w-8 h-8 mr-3 rounded-lg flex items-center justify-center`}>
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
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${
                            openSubMenus[item.label] ? "rotate-90" : ""
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
                      
                      {/* Sub-navigation items */}
                      {openSubMenus[item.label] && (
                        <ul className="mt-2 ml-4 space-y-1 border-l border-white/30 pl-4">
                          {item.subItems.map((subItem) => (
                            <li key={subItem.label}>
                              {subItem.hasSubItems ? (
                                <div>
                                  {/* Sub-item with its own dropdown */}
                                  <button
                                    onClick={() => toggleSubMenu(`${item.label}-${subItem.label}`)}
                                    className={`flex items-center justify-between w-full px-3 py-2 rounded-md transition-colors text-sm ${
                                      pathname.startsWith(subItem.href)
                                        ? "bg-white text-[#A41F39] font-medium"
                                        : "text-white/80 hover:bg-white/20 hover:text-white"
                                    }`}
                                  >
                                    <div className="flex items-center">
                                      <div className={`${pathname.startsWith(subItem.href) ? 'bg-white text-[#A41F39]' : 'bg-white/20 text-white'} w-7 h-7 mr-3 rounded-md flex items-center justify-center`}>
                                        <svg
                                          className="w-3.5 h-3.5"
                                          fill={pathname.startsWith(subItem.href) ? 'currentColor' : 'none'}
                                          stroke={pathname.startsWith(subItem.href) ? 'none' : 'currentColor'}
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d={subItem.icon}
                                          />
                                        </svg>
                                      </div>
                                      <span className="font-medium">{subItem.label}</span>
                                    </div>
                                    <svg
                                      className={`w-3 h-3 transition-transform duration-200 ${
                                        openSubMenus[`${item.label}-${subItem.label}`] ? "rotate-90" : ""
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
                                  
                                  {/* Nested sub-items */}
                                          {openSubMenus[`${item.label}-${subItem.label}`] && (
                                            <ul className="mt-1 ml-4 space-y-1 border-l border-white/30 pl-3">
                                      {subItem.subItems.map((nestedItem) => (
                                        <li key={nestedItem.label}>
                                          <Link
                                            href={nestedItem.href}
                                            onClick={handleNavClick}
                                            className={`flex items-center px-2 py-1.5 rounded-md transition-colors text-xs ${
                                              pathname === nestedItem.href
                                                ? "bg-white text-[#A41F39] font-medium"
                                                : "text-white/80 hover:bg-white/20 hover:text-white"
                                            }`}
                                          >
                                            <div className={`${pathname === nestedItem.href ? 'bg-white text-[#A41F39]' : 'bg-white/20 text-white'} w-6 h-6 mr-2 rounded flex items-center justify-center`}>
                                              <svg
                                                className="w-3 h-3"
                                                fill={pathname === nestedItem.href ? 'currentColor' : 'none'}
                                                stroke={pathname === nestedItem.href ? 'none' : 'currentColor'}
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d={nestedItem.icon}
                                                />
                                              </svg>
                                            </div>
                                            <span className="font-medium">{nestedItem.label}</span>
                                          </Link>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ) : (
                                <Link
                                  href={subItem.href}
                                  onClick={handleNavClick}
                                    className={`flex items-center px-3 py-2 rounded-md transition-colors text-sm ${
                                      pathname === subItem.href
                                        ? "bg-white text-[#A41F39] font-medium"
                                        : "text-white/80 hover:bg-white/20 hover:text-white"
                                    }`}
                                >
                                  <div className={`${pathname === subItem.href ? 'bg-white text-[#A41F39]' : 'bg-white/20 text-white'} w-7 h-7 mr-3 rounded-md flex items-center justify-center`}>
                                    <svg
                                      className="w-3.5 h-3.5"
                                      fill={pathname === subItem.href ? 'currentColor' : 'none'}
                                      stroke={pathname === subItem.href ? 'none' : 'currentColor'}
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d={subItem.icon}
                                      />
                                    </svg>
                                  </div>
                                  <span className="font-medium">{subItem.label}</span>
                                </Link>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    // Regular navigation item without sub-items
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
                      <span className="font-medium">{item.label}</span>
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
                    <div className="h-10 w-10 rounded-full flex items-center justify-center font-medium bg-white/30 text-white shadow-sm">
                      {user?.firstname?.charAt(0) || "U"}
                    </div>
                  </div>
                  <div className="ml-3 text-left">
                    <p className="text-sm font-medium">
                      {user?.firstname}
                    </p>
                    <p className="text-xs opacity-80">
                      {user.system_role_id === 2 ? "Owner" : "Staff Member"}
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
                  <div className="absolute bottom-full left-0 right-0 rounded-lg shadow-lg overflow-hidden z-50 bg-white/95 backdrop-blur-md border border-white/20">
                    <div className="py-1">
                      <div className="px-4 py-2 text-xs text-gray-600">
                        Signed in as{" "}
                        <span className="font-medium text-gray-800">{user?.email}</span>
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false); // Close dropdown on logout
                        }}
                        className="flex items-center cursor-pointer w-full px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-100 hover:text-[#A41F39]"
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
