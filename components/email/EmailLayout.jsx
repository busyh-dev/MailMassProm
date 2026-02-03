// components/email/EmailLayout.jsx
import { useState } from "react";
import {
  LayoutDashboard,
  Mail,
  Users,
  FileText,
  Settings,
} from "lucide-react";

export default function EmailLayout({ children, activeTab }) {
  return (
    <div className="flex h-screen bg-gray-100">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-6">MailMassProm</h2>

        <nav className="space-y-2">
          <a
            href="/dashboard"
            className={`flex items-center gap-2 p-2 rounded-lg ${
              activeTab === "dashboard"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </a>

          <a
            href="/campagne"
            className={`flex items-center gap-2 p-2 rounded-lg ${
              activeTab === "campaigns"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Mail className="w-5 h-5" />
            Campagne
          </a>

          <a
            href="/contatti"
            className={`flex items-center gap-2 p-2 rounded-lg ${
              activeTab === "contacts"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Users className="w-5 h-5" />
            Contatti
          </a>

          <a
            href="/logs"
            className={`flex items-center gap-2 p-2 rounded-lg ${
              activeTab === "logs"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FileText className="w-5 h-5" />
            Log
          </a>

          <a
            href="/settings"
            className={`flex items-center gap-2 p-2 rounded-lg ${
              activeTab === "settings"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Settings className="w-5 h-5" />
            Impostazioni
          </a>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
