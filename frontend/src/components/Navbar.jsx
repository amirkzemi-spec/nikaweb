import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const menuItems = [
    { to: "/", label: "Home" },
    { to: "/countries", label: "Countries" },
    { to: "/visas", label: "Visas" },
    { to: "/blog", label: "Blog" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <nav className="bg-white shadow-soft sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">

        {/* Logo */}
        <div className="text-xl font-bold text-brand-700">
          Nika Visa AI
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {menuItems.map((item, i) => (
            <Link
              key={i}
              to={item.to}
              className="text-gray-700 hover:text-brand-600 transition"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden block text-3xl text-brand-700"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white border-t py-4 px-6 space-y-4 animate-slideUp shadow-soft">

          {menuItems.map((item, i) => (
            <Link
              key={i}
              to={item.to}
              className="block text-lg text-gray-700 hover:text-brand-600"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}

        </div>
      )}
    </nav>
  );
}
