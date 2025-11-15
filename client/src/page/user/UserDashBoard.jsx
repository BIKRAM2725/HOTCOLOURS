// UserDashboard.jsx
import React, { useState } from "react";
import UserNavbar from "./UserNavbar";
import UserDetails from "./UserDetails";
import { FaBars, FaTimes } from "react-icons/fa";

const UserDashboard = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Drawer width (change if needed)
  const drawerWidthClass = "w-[80%] max-w-xs";

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-gray-100 to-gray-200">
      {/* Desktop sidebar (visible md+) */}
      <aside className="hidden md:block">
        <UserNavbar />
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative">

        {/* ============================
            MOBILE HEADER (left menu button)
            ============================ */}
        <header className="md:hidden bg-white shadow sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              aria-label="Open menu"
              className="p-2 rounded-md hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(true)}
            >
              <FaBars />
            </button>

            <div className="text-lg font-semibold">Dashboard</div>

            <div className="w-8" />
          </div>
        </header>

        {/* ============================
            LEFT-SIDE DRAWER (MOBILE MENU)
            - Slides from LEFT
            - Closes on backdrop click
            ============================ */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer sliding from LEFT */}
            <aside
              className={`fixed left-0 top-0 h-full z-50 transform translate-x-0 transition-transform duration-300 bg-white shadow-lg overflow-auto ${drawerWidthClass}`}
              role="dialog"
              aria-modal="true"
              aria-label="User menu"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="p-2 rounded-md hover:bg-gray-100"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-4">
                <UserNavbar />
              </div>
            </aside>
          </>
        )}

        {/* Main user details section */}
        <UserDetails />
      </main>
    </div>
  );
};

export default UserDashboard;
