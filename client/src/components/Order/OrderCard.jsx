import React, { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Invoice from "../../components/Invoice";
import Sticker from "../../components/Sticker";

export default function OrderCard({ order, index, onStatusUpdate }) {
  const invoiceRef = useRef();
  const stickerRef = useRef();

  const downloadPDF = async (ref, filename) => {
    if (!ref.current) return;

    const element = ref.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  };

  const handleDownloadInvoice = () => downloadPDF(invoiceRef, `Invoice_Order_${order._id}.pdf`);
  const handleDownloadSticker = () => downloadPDF(stickerRef, `Sticker_Order_${order._id}.pdf`);

  const commonButtonClass =
    "px-3 py-1 text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed";

  const renderActions = (status) => {
    switch (status) {
      case "Pending":
        return (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => onStatusUpdate(order._id, "Accepted")} className={`${commonButtonClass} bg-green-500`}>Accept</button>
            <button onClick={() => onStatusUpdate(order._id, "Cancelled")} className={`${commonButtonClass} bg-red-500`}>Cancel</button>
            <button className={`${commonButtonClass} bg-blue-500`} disabled>Ship</button>
          </div>
        );
      case "Accepted":
        return (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => onStatusUpdate(order._id, "Shipped")} className={`${commonButtonClass} bg-blue-500`}>Ship</button>
            <button onClick={() => onStatusUpdate(order._id, "Cancelled")} className={`${commonButtonClass} bg-red-500`}>Cancel</button>
            <button className={`${commonButtonClass} bg-indigo-500`} disabled>Deliver</button>
          </div>
        );
      case "Shipped":
        return (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => onStatusUpdate(order._id, "Delivered")} className={`${commonButtonClass} bg-indigo-500`}>Deliver</button>
            <button className={`${commonButtonClass} bg-red-500`} disabled>Cancel</button>
          </div>
        );
      default:
        return <span className="px-3 py-1 rounded bg-gray-200 text-gray-600">{order.status}</span>;
    }
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-5 border border-gray-200 relative">
      <div className="flex justify-between items-center border-b pb-3 mb-3">
        <h2 className="text-lg font-semibold text-gray-700">Order #{index + 1}</h2>
        {renderActions(order.status)}
      </div>

      <div className="mb-3">
        <h3 className="font-medium text-gray-700">Customer Info</h3>
        <p className="text-sm text-gray-600">{order.address.firstName} {order.address.lastName} • {order.address.mobileNo}</p>
        <p className="text-sm text-gray-600">{order.address.localAddress}, {order.address.city}, {order.address.state} - {order.address.pincode}</p>
      </div>

      <div className="border-t pt-3 mt-3">
        <h3 className="font-medium text-gray-700 mb-2">Items</h3>
        {order.items.map((item) => (
          <div key={item._id} className="flex items-center justify-between mb-2 border-b pb-2">
            <div className="flex items-center gap-3">
              <img src={item.product.images[0]} alt={item.product.title} className="w-16 h-16 object-cover rounded-md border" />
              <div>
                <p className="text-gray-800 font-medium">{item.product.title}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>
            </div>
            <p className="text-gray-800 font-semibold">₹{item.priceAtPurchase}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-4 text-sm">
        <p className="text-gray-700">Payment: <span className="font-medium">{order.paymentMethod}</span></p>
        <p className="font-bold text-gray-900">₹{order.total}</p>
      </div>

      <div className="flex gap-2 mt-3">
        <button onClick={handleDownloadInvoice} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Download Invoice</button>
        <button onClick={handleDownloadSticker} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">Download Sticker</button>
      </div>

      {/* Off-screen render for PDF generation */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <Invoice ref={invoiceRef} order={order} />
        <Sticker ref={stickerRef} order={order} />
      </div>
    </div>
  );
}
