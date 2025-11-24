import React, { forwardRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

const Sticker = forwardRef(({ order }, ref) => {
  if (!order) return null;

  const orderId = order._id.slice(-6).toUpperCase();

  // Frontend base URL (for QR)
  const FRONTEND_BASE =
    process.env.REACT_APP_BASE_URL || "https://hotcolours-c44r.vercel.app";

  const qrValue = `${FRONTEND_BASE}/track/${order._id}`;

  return (
    <div
      ref={ref}
      className="p-4 w-[360px] h-[210px] bg-white border border-gray-300 rounded-xl shadow-lg flex justify-between font-sans"
    >
      {/* Left side - order info */}
      <div className="flex flex-col justify-between h-full">
        <div>
          <h2 className="text-[20px] font-bold text-[#d12e2e] mb-1 tracking-wide">
            HotColours
          </h2>
          <h3 className="text-[15px] font-medium mb-2 uppercase tracking-wide text-gray-700">
            Shipping Label
          </h3>

          <p className="text-[10px] mb-1">
            <span className="font-semibold">Order:</span> #{orderId}
          </p>
          <p className="text-[10px] mb-1">
            <span className="font-semibold">Name:</span>{" "}
            {order.address.firstName} {order.address.lastName}
          </p>
          <p className="text-[10px] leading-snug">
            <span className="font-semibold">Address:</span>{" "}
            {order.address.localAddress}, {order.address.city},{" "}
            {order.address.state} - {order.address.pincode}
          </p>
        </div>

        <p className="text-xs text-gray-500 mt-2 italic tracking-wide">
          Heat. Hue. Heritage — HotColours™
        </p>
      </div>

      {/* Right side - QR code */}
      <div className="flex items-center justify-center">
        <QRCodeCanvas
          value={qrValue}
          size={90}
          bgColor="#ffffff"
          fgColor="#000000"
          level="H"
          includeMargin={false}
        />
      </div>
    </div>
  );
});

export default Sticker;
