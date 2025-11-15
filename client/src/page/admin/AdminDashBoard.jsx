// AdminDashBoard.tsx
import React, { useState } from "react";
import AdminDetails from "./AdminDetails";
import AdminNavbar from "../admin/AdminNavbar";

/**
 * AdminDashBoard (page)
 * - Renders AdminNavbar (sidebar on desktop; mobile menu toggle handled here)
 * - Shows AdminDetails in the main content area
 */
const AdminDashBoard = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-200">
      <div className="flex">
        {/* Sidebar (visible on md+) */}
        <aside className="hidden md:block">
          <AdminNavbar />
        </aside>

        {/* Main area */}
        <div className="flex-1 min-h-screen relative">
          {/* Mobile header */}
          <header className="md:hidden bg-white shadow sticky top-0 z-40">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="text-lg font-semibold">Admin</div>
              <button
                aria-label="Toggle menu"
                className="p-2 rounded-md hover:bg-gray-100"
                onClick={() => setOpen((v) => !v)}
              >
                Menu
              </button>
            </div>
          </header>

          {/* Mobile slide-over / inline menu */}
          {open && (
            // simple overlay + panel
            <div className="md:hidden fixed inset-0 z-50">
              <div
                className="absolute inset-0 bg-black/30"
                onClick={() => setOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute left-4 right-4 top-16 p-4">
                <AdminNavbar variant="inline" onClose={() => setOpen(false)} />
              </div>
            </div>
          )}

          <main className="p-4 sm:p-8 md:p-10">
            <div className="max-w-4xl mx-auto">
              <AdminDetails />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashBoard;
