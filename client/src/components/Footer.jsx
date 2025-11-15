import React from "react";
import { FaFacebookF, FaInstagram, FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();
  const email = "hotcolours.official@gmail.com";
  const phone = "+91 73840 37119";
  const fbUrl = "https://www.facebook.com/hotcolours.official";
  const igUrl = "https://www.instagram.com/hotcolours.official";

  return (
    <footer className="bg-gray-900 text-gray-300 pt-10 pb-6 mt-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">

        {/* Brand / About */}
        <div>
          <h2 className="text-2xl font-bold text-white">Hotcolours</h2>
          <p className="text-gray-400 mt-3 text-sm leading-relaxed">
            Hotcolours — premium Indian spices & handcrafted masalas. We source quality ingredients,
            craft small-batch blends, and pack for freshness. Add magic to meals with aromatic, authentic flavours.
          </p>

          <div className="mt-4">
            <span className="inline-block text-xs text-gray-400">Email</span>
            <div className="mt-1">
              <a
                href={`mailto:${email}`}
                className="text-sm text-white hover:underline block"
                aria-label={`Email ${email}`}
              >
                {email}
              </a>
            </div>
            <span className="inline-block text-xs text-gray-400 mt-2">Phone</span>
            <div className="mt-1">
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className="text-sm text-white hover:underline block"
                aria-label={`Call ${phone}`}
              >
                {phone}
              </a>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/" className="hover:text-white transition" aria-label="Home link">
                Home
              </Link>
            </li>
            <li>
              <Link to="/shop" className="hover:text-white transition" aria-label="Shop link">
                Shop
              </Link>
            </li>
            <li>
              <Link to="/user/orders" className="hover:text-white transition" aria-label="Your orders">
                Your Orders
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-white transition" aria-label="About us">
                About Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Support */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Customer Support</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/contact" className="hover:text-white transition" aria-label="Contact us">
                Contact Us
              </Link>
            </li>
            <li>
              <Link to="/return-policy" className="hover:text-white transition" aria-label="Return and refund policy">
                Return & Refund Policy
              </Link>
            </li>
            <li>
              <Link to="/privacy-policy" className="hover:text-white transition" aria-label="Privacy policy">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-white transition" aria-label="Terms and conditions">
                Terms & Conditions
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact & Social */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Get in Touch</h3>

          <div className="flex items-center gap-3 text-sm">
            <FaPhoneAlt className="text-gray-400" />
            <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-white" aria-label={`Call ${phone}`}>
              {phone}
            </a>
          </div>

          <div className="flex items-center gap-3 text-sm mt-3">
            <FaEnvelope className="text-gray-400" />
            <a href={`mailto:${email}`} className="hover:text-white" aria-label={`Email ${email}`}>
              {email}
            </a>
          </div>

          <div className="flex gap-4 mt-5">
            <a
              href={fbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-gray-800 rounded-full hover:bg-indigo-600 transition"
              aria-label="Hotcolours on Facebook"
            >
              <FaFacebookF className="text-white" />
            </a>

            <a
              href={igUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-gray-800 rounded-full hover:bg-pink-500 transition"
              aria-label="Hotcolours on Instagram"
            >
              <FaInstagram className="text-white" />
            </a>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            We monitor messages on email, Facebook and Instagram (same inbox). Expect a reply within 1 business day.
          </p>
        </div>
      </div>

      {/* Bottom line */}
      <div className="border-t border-gray-700 mt-8 pt-4 text-center text-sm text-gray-400">
        © {year} Hotcolours — All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;
