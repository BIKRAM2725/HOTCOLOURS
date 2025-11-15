import React from "react";
import { useCart } from "../context/CartContext";
import { FaTrashAlt } from "react-icons/fa";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, totalPrice } = useCart();

  if (!cart?.items?.length)
    return (
      <div className="flex justify-center items-center h-[calc(100vh-80px)] text-gray-600 text-xl">
        Your cart is empty.
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      <div className="flex flex-col gap-4">
        {cart.items.map((item) => (
          <div
            key={item.product._id}
            className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl"
          >
            <img
              src={item.product.images?.[0]}
              alt={item.product.title}
              className="w-24 h-24 object-cover rounded-xl"
            />
            <div className="flex-1">
              <h2 className="font-semibold">{item.product.title}</h2>
              <p className="text-indigo-600 font-bold mt-1">
                ₹ {item.product.price} x {item.quantity}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={item.quantity}
                min={1}
                className="w-16 border rounded px-2 py-1 text-center"
                onChange={(e) =>
                  updateQuantity(item.product._id, parseInt(e.target.value))
                }
              />
              <button
                onClick={() => removeFromCart(item.product._id)}
                className="text-red-500 hover:text-red-700"
              >
                <FaTrashAlt />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between items-center">
        <h2 className="text-xl font-bold">Total: ₹ {totalPrice}</h2>
        <button className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all">
          <a href="/checkout">Checkout</a>
        </button>
      </div>
    </div>
  );
}
