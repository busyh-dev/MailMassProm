import { X } from "lucide-react";
import { motion } from "framer-motion";

export default function TemplatePreviewModal({
  template,
  show,
  onClose,
  onApply
}) {
  if (!show || !template) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto p-6"
      >
        <h2 className="text-xl font-bold mb-4">{template.name}</h2>

        <div
          className="border p-4 rounded-lg bg-gray-50"
          dangerouslySetInnerHTML={{ __html: template.html }}
        />

        {/* FOOTER */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Chiudi
          </button>

          <button
            onClick={onApply}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Usa Template
          </button>
        </div>
      </motion.div>
    </div>
  );
}
