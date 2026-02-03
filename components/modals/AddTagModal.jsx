import React, { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { useTags } from "../../hooks/useTags"; // ✅ percorso corretto

const AddTagModal = ({ show, onClose, onAdd }) => {
  const { tags, createTag } = useTags(); // ✅ otteniamo anche i tag esistenti
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [saving, setSaving] = useState(false);

  if (!show) return null;

  const handleSubmit = async () => {
    if (!label.trim()) {
      toast.error("⚠️ Il nome del tag è obbligatorio!");
      return;
    }
  
    setSaving(true);
    try {
      const result = await createTag({
        label,
        value: label.trim().toLowerCase().replace(/\s+/g, "-"),
        color,
      });
  
      if (result.success) {
        if (result.alreadyExists) {
          toast(`🔁 Il tag "${result.data.label}" esiste già`, {
            icon: "ℹ️",
          });
        } else {
          toast.success("✅ Tag creato con successo!");
        }
  
        // 🔥 NON chiamare onAdd, il tag è già stato creato da createTag()
        // onAdd?.(result.data); <-- RIMUOVI QUESTA RIGA
        
        setLabel("");
        setColor("#3b82f6");
        onClose(); // Chiudi il modale, il parent farà fetchTags()
      } else {
        toast.error(`❌ ${result.error || "Errore durante la creazione del tag"}`);
      }
    } catch (err) {
      console.error("💥 Errore handleSubmit:", err);
      toast.error("❌ Errore imprevisto durante il salvataggio del tag.");
    } finally {
      setSaving(false);
    }
  };

  const colorOptions = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
    "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6",
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl border border-gray-200 animate-zoomIn">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Nuovo Tag</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form contenuto */}
        <div className="space-y-4">
          {/* Nome Tag */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome del Tag
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Es. Cliente Premium"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Colori */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Colore
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  className={`w-8 h-8 rounded-full border-2 transition ${
                    color === c ? "border-blue-600 scale-110" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Pulsanti */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            {saving ? "Salvataggio..." : "Crea Tag"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTagModal;

