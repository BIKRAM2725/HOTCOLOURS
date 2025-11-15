import React, { useState } from "react";
import bannerImg from "../assets/rectangle-2.png";
import { useNavigate } from "react-router-dom";

function Banner() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/search?query=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div
      className="w-full bg-cover bg-center relative
                 h-[300px] sm:h-[380px] md:h-[500px]"
      style={{ backgroundImage: `url(${bannerImg})` }}
    >
      <div className="absolute inset-0 bg-black opacity-40"></div>

      <div className="relative z-10 flex flex-col items-center justify-center text-white h-full px-4">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 text-center">
          Enjoy Your Food, Enjoy the Spices.
        </h1>
        <p className="text-sm sm:text-base md:text-xl text-center max-w-2xl">
          Add Magic to Meals.
        </p>

        {/* ================================
              SEARCH BOX (Responsive)
           ================================= */}
        <div
          className="mt-5 bg-white rounded-lg shadow-md border border-slate-600
                     w-[90%] max-w-[880px]
                     flex flex-col sm:flex-row items-center 
                     px-3 py-3 gap-3"
        >
          <input
            type="text"
            placeholder="Search Destination..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            className="border border-slate-300 h-[45px]
                       w-full sm:flex-1
                       text-black p-2 rounded-md focus:outline-none"
          />

          <button
            onClick={handleSearch}
            className="h-[45px] w-full sm:w-[110px]
                       bg-blue-600 text-white rounded-md font-semibold
                       hover:bg-blue-700 transition"
          >
            Search
          </button>
        </div>

        {/* ================================
               MOBILE ONLY SECTION
               (Add mobile-only elements here if needed)
               Visible below 640px (sm breakpoint)
           ================================= */}
        <div className="sm:hidden text-white text-xs mt-2 opacity-80">
          {/* Mobile-only area (currently empty on purpose) */}
          {/* You can add mobile shortcuts, hints, or small text here */}
        </div>
      </div>
    </div>
  );
}

export default Banner;
