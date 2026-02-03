import { X } from "lucide-react";
import { motion } from "framer-motion";

export default function TemplateLibraryModal({
  templates,
  show,
  onClose,
  onSelect,
  templateCategory,
  setTemplateCategory,
  templateSearch,
  setTemplateSearch
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* HEADER */}
        <div className="p-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Libreria Template</h2>
            <p className="text-white/80 text-sm">Scegli un template predefinito</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* FILTRI */}
        <div className="p-4 bg-gray-50 flex gap-4 items-center">
          <input
            type="text"
            placeholder="Cerca template..."
            className="flex-1 px-3 py-2 border rounded-lg"
            value={templateSearch}
            onChange={(e) => setTemplateSearch(e.target.value)}
          />
          <select
            className="px-3 py-2 border rounded-lg"
            value={templateCategory}
            onChange={(e) => setTemplateCategory(e.target.value)}
          >
            <option value="all">Tutti</option>
            <option value="welcome">Welcome</option>
            <option value="newsletter">Newsletter</option>
            <option value="promotions">Promozioni</option>
          </select>
        </div>

        {/* GRID TEMPLATE */}
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates
              .filter(
                (t) =>
                  (templateCategory === "all" || t.category === templateCategory) &&
                  t.name.toLowerCase().includes(templateSearch.toLowerCase())
              )
              .map((t) => (
                <div
                  key={t.id}
                  className="border rounded-lg shadow-sm bg-white cursor-pointer hover:shadow-xl overflow-hidden"
                  onClick={() => onSelect(t)}
                >
                  <img src={t.thumbnail} className="h-40 w-full object-cover" />
                  <div className="p-4">
                    <h3 className="font-bold">{t.name}</h3>
                    <p className="text-sm text-gray-500">{t.description}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
