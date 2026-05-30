import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate, Link, useLocation } from "react-router-dom";
import { Settings, MapPin, Image as ImageIcon, Video, LogOut, Type, MonitorPlay, Activity, Menu, ChevronLeft, ChevronRight, Palette } from "lucide-react";
import { cn } from "../../lib/utils";

import AdminGeneral from "./AdminGeneral";
import AdminLocation from "./AdminLocation";
import AdminMedia from "./AdminMedia";
import AdminThemes from "./AdminThemes";
import AdminAudio from "./AdminAudio";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("jasma_auth") !== "true") {
      navigate("/login");
    }
  }, [navigate]);

  const navItems = [
    { name: "Data Masjid", path: "/admin", icon: Settings },
    { name: "Lokasi & Waktu", path: "/admin/location", icon: MapPin },
    { name: "Waktu Jeda", path: "/admin/audio", icon: Activity },
    { name: "Desain Tampilan", path: "/admin/themes", icon: Palette },
    { name: "Media & Slides", path: "/admin/media", icon: ImageIcon },
    { name: "Preview Layar", path: "/", icon: MonitorPlay, external: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar with dynamic transition classes */}
      <aside 
        className={cn(
          "bg-white border-r border-gray-200 flex flex-col fixed h-full z-20 transition-all duration-300 ease-in-out shadow-sm",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Sidebar Header with Toggle Control */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between overflow-hidden">
          {sidebarOpen ? (
            <h1 className="text-lg font-bold font-sans text-gray-950 leading-tight truncate">
              Panel Admin<br />
              <span className="text-blue-600 text-xs font-semibold">Jasma Digital</span>
            </h1>
          ) : (
            <div className="text-center w-full">
              <span className="text-blue-600 text-xs font-extrabold font-mono uppercase bg-blue-50 py-1 px-1.5 rounded">J</span>
            </div>
          )}
          
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-300 transition shrink-0"
            title={sidebarOpen ? "Minimize Sidebar" : "Expand Sidebar"}
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5 mx-auto" />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.name}>
                  {item.external ? (
                    <a 
                      href={item.path} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition",
                        !sidebarOpen && "justify-center"
                      )}
                      title={item.name}
                    >
                      <item.icon className="w-5 h-5 text-gray-500 shrink-0" />
                      {sidebarOpen && <span className="font-medium text-sm">{item.name}</span>}
                    </a>
                  ) : (
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition",
                        isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100",
                        !sidebarOpen && "justify-center"
                      )}
                      title={item.name}
                    >
                      <item.icon
                        className={cn(
                          "w-5 h-5 shrink-0",
                          isActive ? "text-blue-600" : "text-gray-500"
                        )}
                      />
                      {sidebarOpen && (
                        <span className={cn("font-medium text-sm truncate", isActive && "font-semibold")}>
                          {item.name}
                        </span>
                      )}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              localStorage.removeItem("jasma_auth");
              navigate("/login");
            }}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-red-600 hover:bg-red-50 transition",
              !sidebarOpen && "justify-center"
            )}
            title="Keluar"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="font-semibold text-sm">Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Pane with matching margin shift transition */}
      <main 
        className={cn(
          "flex-1 p-8 transition-all duration-300 ease-in-out",
          sidebarOpen ? "ml-64" : "ml-20"
        )}
      >
        {/* Mobile floating restore trigger button if sidebar collapses to menu */}
        {!sidebarOpen && (
          <div className="mb-4 flex items-center md:hidden">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded bg-white shadow border border-gray-200 text-gray-700 flex items-center gap-1 text-xs font-semibold"
            >
              <Menu className="w-4 h-4" /> Buka Menu
            </button>
          </div>
        )}

         <Routes>
          <Route path="/" element={<AdminGeneral />} />
          <Route path="/location" element={<AdminLocation />} />
          <Route path="/audio" element={<AdminAudio />} />
          <Route path="/themes" element={<AdminThemes />} />
          <Route path="/media" element={<AdminMedia />} />
        </Routes>
      </main>
    </div>
  );
}
