import React from 'react'
import NextTrip1 from "../assets/Post/Buiscuit.webp";
import NextTrip2 from "../assets/Post/dry fruts.jpg";
import NextTrip3 from "../assets/Post/Tea.jpg";


const arr = [
  {
    image: NextTrip1,
    title: "Biscuit",
    description: "A biscuit is a flour-based baked food item. Biscuits are typically hard, flat, and unleavened. ",
  },
  {
    image: NextTrip2,
    title: "Dry fruits ",
    description: "Dry fruits are dehydrated fruits that retain most of their nutritional benefits.",
  },
  {
    image: NextTrip3,
    title: "TEA",
    description: "Tea is a popular beverage made from the leaves of the Camellia sinensis plant,",
  },
];

const Upcoming = () => {
   return (
    <>
      <div className=" flex flex-col mt-12 w-[1200px] mx-auto ">
        <h1 className="font-bold text-[30px] text-slate-800 mb-12">
          Coming soon
        </h1>
      </div>
      <div className="flex gap-5 justify-center">
        {arr.map((link, index) => {
          return (
            <div
              key={index}
              className="relative rounded-xl overflow-hidden hover:shadow-lg hover:scale-95 transition duration-300 cursor-pointer flex flex-col justify-center items-center "
            >
              <img
                className="rounded-lg object-cover h-60 w-[24rem]"
                src={link.image}
                alt={link.name}
              />
              <div className='absolute inset-0 flex flex-col justify-end text-white pl-3 bg-black bg-opacity-40 '>
                 <h2 className="text-lg font-semibold mt-2">{link.title}</h2>
                 <h2 className="text-gray-500 mb-2">{ link.description }</h2>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Upcoming;