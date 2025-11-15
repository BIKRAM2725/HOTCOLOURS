import React, { forwardRef } from "react";

const Invoice = forwardRef(({ order }, ref) => {
  if (!order) return null;

  const today = new Date().toLocaleDateString();

  return (
    <div
      ref={ref}
      className="p-8 w-[700px] mx-auto bg-white text-gray-800 shadow-lg rounded-lg font-sans border border-gray-200"
    >
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#d12e2e] tracking-wide">
            HotColours
          </h1>
          <p className="text-sm text-gray-600">Heat. Hue. Heritage</p>
          <p className="text-xs text-gray-500">
          Bishnupur Nadia, Krishnagar, West Bengal - 741103
          </p>
          <p className="text-xs text-gray-500">📞 +91 7384037119 | ✉️ hotcolours.official@gmail.com</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold">INVOICE</h2>
          <p className="text-sm text-gray-600">Date: {today}</p>
          <p className="text-sm text-gray-600">Invoice #: {order._id.slice(-6).toUpperCase()}</p>
        </div>
      </div>

      {/* Customer Details */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold border-b pb-1 mb-2 text-gray-700">
          Billing Information
        </h3>
        <p className="text-sm">
          <strong>Customer:</strong> {order.address.firstName}{" "}
          {order.address.lastName}
        </p>
        <p className="text-sm">
          <strong>Address:</strong> {order.address.localAddress},{" "}
          {order.address.city}, {order.address.state} -{" "}
          {order.address.pincode}
        </p>
        <p className="text-sm">
          <strong>Payment Method:</strong> {order.paymentMethod}
        </p>
      </div>

      {/* Item Table */}
      <table className="w-full text-sm border-collapse mb-6">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="border p-2 text-left">Item</th>
            <th className="border p-2 text-center">Qty</th>
            <th className="border p-2 text-center">Price</th>
            <th className="border p-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item._id} className="border-b hover:bg-gray-50">
              <td className="border p-2">{item.product.title}</td>
              <td className="border p-2 text-center">{item.quantity}</td>
              <td className="border p-2 text-center">
                ₹{item.priceAtPurchase.toFixed(2)}
              </td>
              <td className="border p-2 text-right">
                ₹{(item.quantity * item.priceAtPurchase).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total Section */}
      <div className="flex justify-end mb-8">
        <div className="w-1/3 text-sm">
          <div className="flex justify-between py-1">
            <span>Subtotal</span>
            <span>₹{order.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 border-t font-semibold text-lg">
            <span>Total</span>
            <span>₹{order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 border-t pt-4">
        <p>Thank you for shopping with <strong>HotColours</strong>!</p>
        <p>For support, contact us at hotcolours.official@gmail.com</p>
        {/* <p className="mt-1 text-[10px] italic">
          This is a computer-generated invoice and does not require a signature.
        </p> */}
      </div>
    </div>
  );
});

export default Invoice;
