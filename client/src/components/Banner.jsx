// src/components/Banner.jsx
import React, { useEffect, useState } from "react";

import Banner1 from "../assets/banner1.jpg";
import Banner2 from "../assets/banner2.jpg";
import Banner3 from "../assets/banner3.jpg";

function Banner() {
  const [index, setIndex] = useState(0);
  const images = [Banner1, Banner2, Banner3];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div
      className="
        w-full
        h-[180px]      
        sm:h-[260px]   
        md:h-[350px]  
        lg:h-[500px]  
        xl:h-[550px]  
        relative 
        overflow-hidden
      "
    >
      {/* Image container */}
      {images.map((img, i) => (
        <img
          key={i}
          src={img}
          alt={`banner-${i}`}
          className={`
            absolute inset-0 w-full h-full object-cover object-center
            transition-opacity duration-1000
            ${i === index ? "opacity-100" : "opacity-0"}
          `}
        />
      ))}

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2.5 w-2.5 rounded-full transition 
              ${i === index ? "bg-white" : "bg-gray-500"}
            `}
          />
        ))}
      </div>
    </div>
  );
}

export default Banner;
