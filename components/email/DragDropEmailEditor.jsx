// components/email/DragDropEmailEditor.jsx
"use client";

import React, { useState, useEffect } from "react";
import SidebarBlocks from "./builder/SidebarBlocks";
import CanvasEditor from "./builder/CanvasEditor";
import PreviewModal from "./PreviewModal";
import toast from "react-hot-toast";

export default function DragDropEmailEditor({ user }) {
  const [blocks, setBlocks] = useState([]);
  const [savedTemplates, setSavedTemplates] = useState([]);

  // Preview & Test Email
  const [showPreview, setShowPreview] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  // ➕ Aggiunge un blocco al canvas
  const addBlock = (block) => {
    setBlocks((prev) => [...prev, block]);
  };

  // ✏️ Aggiorna block specifico
  const updateBlock = (index, newContent) => {
    const updated = [...blocks];
    updated[index].content = newContent;
    setBlocks(updated);
  };

  // 🔄 Render HTML finale
  const renderFinalHTML = () => blocks.map((b) => b.content).join("");

  // 💾 Salvataggio template nel DB
  const saveTemplate = async () => {
    if (!user?.id) return toast.error("Utente non autenticato!");

    const htmlOutput = renderFinalHTML();

    try {
      const res = await fetch("/api/campaigns/save-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          name: `Template ${new Date().toLocaleString()}`,
          html: htmlOutput,
        }),
      });

      if (!res.ok) throw new Error("Errore salvataggio template");

      toast.success("✅ Template salvato con successo!");
    } catch (err) {
      console.error("❌ Errore salvataggio template:", err);
      toast.error("Errore durante il salvataggio.");
    }
  };

  // ✉️ INVIO EMAIL DI TEST
  const sendTestEmail = async (email) => {
    if (!email) return;

    setSendingTest(true);

    try {
      const htmlOutput = renderFinalHTML();

      const res = await fetch("/api/campaigns/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email, html: htmlOutput }),
      });

      const result = await res.json();

      if (!result.success) throw new Error(result.error);

      toast.success("✅ Email test inviata!");
    } catch (err) {
      console.error("Errore invio email:", err);
      toast.error("Errore invio test email.");
    }

    setSendingTest(false);
  };

  // 🗃️ Recupera i template salvati
  const fetchSavedTemplates = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/campaigns/get-templates?user_id=${user.id}`);
      const data = await res.json();
      setSavedTemplates(data.templates);
    } catch (err) {
      console.error("Errore recupero template:", err);
      toast.error("Errore nel recupero dei template.");
    }
  };

  // 🔄 Duplicare template
  const duplicateTemplate = async (templateId) => {
    try {
      const template = savedTemplates.find((t) => t.id === templateId);
      if (!template) return;

      await fetch("/api/campaigns/save-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          name: `${template.name} (Copia)`,
          html: template.html,
        }),
      });

      toast.success("✅ Template duplicato!");
      fetchSavedTemplates(); // Ricarica la lista dei template
    } catch (err) {
      console.error("Errore duplicazione template:", err);
      toast.error("Errore nella duplicazione del template.");
    }
  };

  useEffect(() => {
    fetchSavedTemplates(); // Recupera i template salvati al caricamento
  }, [user?.id]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 📌 SIDEBAR BLOCCHI */}
      <SidebarBlocks onAddBlock={addBlock} />

      {/* 🎨 CANVAS & TOOLBAR */}
      <div className="flex-1 flex flex-col p-4">
        
        {/* TOP TOOLBAR */}
        <div className="flex justify-end gap-3 mb-4">

          {/* 👁️ Preview */}
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            onClick={() => setShowPreview(true)}
          >
            👁️ Preview
          </button>

          {/* ✉️ Invia Test */}
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
            onClick={() => {
              const email = prompt("📩 Inserisci l'email per inviare un test:");
              if (email) sendTestEmail(email);
            }}
            disabled={sendingTest}
          >
            {sendingTest ? "⏳ Invio..." : "✉️ Invia Test"}
          </button>

          {/* 💾 Salva Template */}
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            onClick={saveTemplate}
          >
            💾 Salva Template
          </button>
        </div>

        {/* CANVAS */}
        <CanvasEditor blocks={blocks} onUpdateBlock={updateBlock} />
      </div>

      {/* ✅ MODAL PREVIEW */}
      <PreviewModal
        show={showPreview}
        html={renderFinalHTML()}
        onClose={() => setShowPreview(false)}
      />

      {/* 🚀 Lista Template Salvati */}
      <div className="absolute top-10 right-10 bg-white p-4 rounded-lg shadow-md max-w-xs">
        <h3 className="text-lg font-semibold">Template Salvati</h3>
        <div className="mt-2 space-y-2">
          {savedTemplates.length === 0 && <p>Nessun template salvato</p>}
          {savedTemplates.map((template) => (
            <div key={template.id} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{template.name}</span>
              <button
                onClick={() => duplicateTemplate(template.id)}
                className="text-sm text-blue-500 hover:underline"
              >
                Duplicare
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

