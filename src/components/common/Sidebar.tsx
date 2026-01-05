import { Box, FileText, Home, User, Users, CreditCard, Wrench, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: <Home /> },
  { to: "/productos", label: "Productos", icon: <Box /> },
  { to: "/repuestos", label: "Repuestos", icon: <Settings /> },
  { to: "/cotizaciones", label: "Cotizaciones", icon: <FileText /> },
  { to: "/ventas", label: "Ventas", icon: <CreditCard /> },
  { to: "/reparaciones", label: "Reparaciones", icon: <Wrench /> },
  { to: "/clientes", label: "Clientes", icon: <Users /> },
  { to: "/perfil", label: "Perfil", icon: <User /> },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4 fixed left-0 top-0 overflow-y-auto z-40">
      <nav className="flex flex-col gap-2">
        {items.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            className={({ isActive }) =>
              `flex items-center gap-3 p-2 rounded-lg ${
                isActive ? "bg-primary-50 text-primary-700" : ""
              }`
            }
          >
            <span className="w-5 h-5 text-gray-600">{i.icon}</span>
            <span>{i.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
