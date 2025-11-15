import React from 'react'
import NextTrip1 from "../assets/Post/Buiscuit.webp";
import NextTrip2 from "../assets/Post/dry fruts.jpg";
import NextTrip3 from "../assets/Post/Tea.jpg";

const arr = [
  {
    image: NextTrip1,
    title: "Biscuit",
    description:
      "A biscuit is a flour-based baked food item. Biscuits are typically hard, flat, and unleavened.",
  },
  {
    image: NextTrip2,
    title: "Dry fruits",
    description:
      "Dry fruits are dehydrated fruits that retain most of their nutritional benefits.",
  },
  {
    image: NextTrip3,
    title: "TEA",
    description:
      "Tea is made from the leaves of the Camellia sinensis plant.",
  },
];

const Upcoming = () => {
  return (
    <>
      <div className="flex flex-col mt-12 max-w-[1200px] mx-auto px-4">
        <h1 className="font-bold text-[30px] text-slate-800 mb-12">
          Coming Soon
        </h1>

        {/* Always 3 per row */}
        <div className="grid grid-cols-3 gap-5">
          {arr.map((item, index) => (
            <div
              key={index}
              className="relative rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:scale-[0.98] transition duration-300 cursor-pointer"
            >
              {/* Responsive image height */}
              <img
                src={item.image}
                alt={item.title}
                className="
                  object-cover w-full
                  h-24        /* smaller mobile */
                  sm:h-28
                  md:h-40    
                  lg:h-60    
                "
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-3 text-white">
                
                {/* Responsive Title */}
                <h2 className="font-semibold 
                  text-sm    /* mobile small */
                  sm:text-base 
                  md:text-lg 
                  lg:text-xl  /* laptop large */
                ">
                  {item.title}
                </h2>

                {/* Responsive Description */}
                <p className="
                  text-[10px] hidden      /* hide on small mobile */
                  sm:block sm:text-xs 
                  md:text-sm 
                  lg:text-base
                  text-gray-200
                ">
                  {item.description}
                </p>

              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Upcoming;
