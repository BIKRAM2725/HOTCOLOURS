import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaList, FaUser } from "react-icons/fa";

const navbarMenu = [
  { id: 1, name: "User Details", link: "/user", icon: <FaUser /> },
  { id: 2, name: "Your Orders", link: "/user/orders", icon: <FaList /> },
];

const UserNavbar = () => {
  const location = useLocation();

  return (
    <nav
      className="bg-gradient-to-b from-gray-900 to-gray-800 text-white w-64 min-h-screen p-6 shadow-lg rounded-r-2xl"
      aria-label="User navigation"
    >
      <h1 className="text-2xl font-bold mb-8 text-center tracking-wide">Dashboard</h1>

      <div className="flex flex-col space-y-2">
        {navbarMenu.map((item) => {
          const active = location.pathname === item.link;
          return (
            <Link
              key={item.id}
              to={item.link}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                active ? "bg-indigo-600 shadow-md scale-105" : "hover:bg-gray-700 hover:scale-[1.02]"
              }`}
              aria-current={active ? "page" : undefined}
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

export default UserNavbar;
