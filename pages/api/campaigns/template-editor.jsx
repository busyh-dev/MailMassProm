// pages/campaigns/template-editor.jsx
import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import dynamic from "next/dynamic";
import { supabase } from "../../lib/supabaseClient";

// Import dinamico dell'editor con drag & drop
// const DragDropEmailEditor = dynamic(
//   () => import("../../components/email/DragDropEmailEditor"),
//   { ssr: false }
// );

export default function TemplateEditorPage() {
  const [user, setUser] = useState(null);

  // Recupera l'utente loggato
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });
  }, []);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        ⏳ Caricamento...
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}> {/* ✅ Qui c'è DndProvider */}
      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 overflow-auto bg-gray-100">
          <DragDropEmailEditor user={user} /> {/* <DragDropEmailEditor> è il figlio */}
        </div>
      </div>
    </DndProvider>
  );
}
