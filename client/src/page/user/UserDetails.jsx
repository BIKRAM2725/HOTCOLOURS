import React from "react";
import { useAuth } from "../../context/UserContext";
import { FaUserCircle } from "react-icons/fa";

const UserDetails = () => {
  const [auth] = useAuth();
  const user = auth?.user;

  if (!user) {
    return (
      <div className="flex justify-center items-center h-full">
        <h2 className="text-lg font-semibold text-gray-500">No user logged in</h2>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl rounded-2xl p-8 max-w-lg mx-auto mt-10 border border-gray-200">
      <div className="flex flex-col items-center mb-6">
        <FaUserCircle className="text-6xl text-indigo-500 mb-3" />
        <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
        <p className="text-gray-500 text-sm">{user.email}</p>
      </div>

      <div className="border-t border-gray-200 mt-4 pt-4 space-y-3">
        <div className="flex justify-between text-gray-700">
          <span className="font-semibold">Role:</span>
          <span className="capitalize">{user.role}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span className="font-semibold">User ID:</span>
          <span className="text-sm text-gray-500">{user.id || user._id}</span>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
