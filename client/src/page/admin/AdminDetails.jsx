import React from "react";
import { useAuth } from "../../context/UserContext";
import { FaUserCircle } from "react-icons/fa";

/**
 * AdminDetails Component
 * - Mobile + Desktop responsive
 * - Clean card layout
 * - Safe user.id reading
 * - Works correctly inside a menu page layout
 */

const AdminDetails = () => {
  const [auth] = useAuth();
  const admin = auth?.user || null;

  if (!admin) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <h2 className="text-lg font-semibold text-gray-500">No admin logged in</h2>
      </div>
    );
  }

  const adminId = admin.id || admin._id || admin.uid || admin._uid || "N/A";

  return (
    <section className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-gray-200 w-full max-w-xl mx-auto">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
          <FaUserCircle className="text-6xl text-indigo-500" />
        </div>

        <h2 className="text-2xl font-bold text-gray-800">
          {admin.name || "Admin"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {admin.email || "No Email"}
        </p>
      </div>

      {/* Details Grid */}
      <div className="w-full mt-8 border-t border-gray-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col text-left">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Role</span>
          <span className="font-medium text-gray-700 capitalize">
            {admin.role || "admin"}
          </span>
        </div>

        <div className="flex flex-col text-left break-all">
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            Admin ID
          </span>
          <span className="text-sm text-gray-700">{adminId}</span>
        </div>
      </div>

      {/* Optional field */}
      {admin?.createdAt && (
        <p className="mt-4 text-xs text-gray-400 text-center">
          Joined on {new Date(admin.createdAt).toLocaleDateString()}
        </p>
      )}
    </section>
  );
};

export default AdminDetails;
