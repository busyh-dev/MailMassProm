import React from "react";
import { X } from "lucide-react";

export default function PreviewModal({ show, html, onClose }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl w-[95%] max-w-4xl h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Preview Email</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        {/* Preview */}
        <div className="overflow-auto p-6 bg-gray-50">
          <div
            className="bg-white rounded-lg shadow p-6 max-w-[650px] mx-auto"
            dangerouslySetInnerHTML={{ __html: html }} // ✅ Renderizza il contenuto email
          />
        </div>
      </div>
    </div>
  );
}
