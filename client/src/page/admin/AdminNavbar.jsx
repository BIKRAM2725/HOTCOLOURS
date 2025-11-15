// AdminNavbar.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { MdCreate } from "react-icons/md";
import { TbTruckDelivery, TbTruckReturn } from "react-icons/tb";
import { AiFillClockCircle } from "react-icons/ai";
import { IoCreate } from "react-icons/io5";
import { IoClose } from "react-icons/io5";

const navbarMenu = [
  { id: 1, name: "Admin Details", link: "/admin/details", icon: <FaUser /> },
  { id: 2, name: "Manage Post", link: "/admin/item", icon: <MdCreate /> },
  { id: 3, name: "Manage Category", link: "/admin/create-category", icon: <IoCreate /> },
  { id: 4, name: "All Orders", link: "/admin/orders", icon: <TbTruckDelivery /> },
  { id: 5, name: "Return Order", link: "/admin/return-orders", icon: <TbTruckReturn /> },
  { id: 6, name: "Activation", link: "/admin/activation", icon: <AiFillClockCircle /> },
];

const AdminNavbar = ({ variant = "sidebar", onClose } = {}) => {
  const location = useLocation();
  const isSidebar = variant === "sidebar";

  // classes tuned for sidebar vs inline usage
  const containerClass = isSidebar
    ? "bg-gradient-to-b from-gray-900 to-gray-800 text-white w-64 min-h-screen p-6 shadow-lg rounded-r-2xl"
    : "bg-white text-gray-800 w-full rounded-lg p-4 shadow-md";

  const itemDefault =
    "flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:translate-x-1";
  const itemActive = isSidebar ? "bg-indigo-600 shadow-md scale-105 text-white" : "bg-indigo-50 shadow-sm text-indigo-700";

  return (
    <nav className={containerClass} aria-label="Admin navigation">
      <div className="flex items-center justify-between mb-4">
        {isSidebar ? (
          <h1 className="text-2xl font-bold text-white tracking-wide">Admin</h1>
        ) : (
          <div className="flex items-center justify-between w-full">
            <h3 className="text-lg font-semibold">Admin Menu</h3>
            {/* show a close button for inline/mobile variant */}
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <IoClose className="text-xl" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-2">
        {navbarMenu.map((item) => {
          const active = location.pathname === item.link;
          return (
            <Link
              key={item.id}
              to={item.link}
              className={`${itemDefault} ${active ? itemActive : ""}`}
              onClick={() => {
                // close mobile menu if a handler was supplied
                if (onClose) onClose();
              }}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default AdminNavbar;
