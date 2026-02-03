import TiptapEditor from "../TiptapEditor";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabaseClient";

export default function BlockRenderer({ block, index, onUpdateBlock, user }) {
  const saveBlock = async () => {
    if (!user?.id) {
      toast.error("Errore: Utente non autenticato");
      return;
    }

    const name = prompt("Nome del blocco:");
    if (!name || name.trim() === "") {
      toast.error("Il nome è obbligatorio");
      return;
    }

    const html = block.content;
    if (!html || html.trim() === "") {
      toast.error("Il blocco non contiene contenuto");
      return;
    }

    const { error } = await supabase.from("campaign_blocks").insert([
      {
        user_id: user.id,
        name,
        description: block.type,
        html,
      },
    ]);

    if (error) {
      console.error("Errore salvataggio blocco:", error);
      toast.error("Errore durante il salvataggio");
      return;
    }

    toast.success("✅ Blocco salvato correttamente!");
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      {block.type === "header" && (
        <TiptapEditor
          content={block.content || "<h2>Header</h2>"}
          onChange={(html) => onUpdateBlock(index, { ...block, content: html })}
        />
      )}

      {block.type === "text" && (
        <TiptapEditor
          content={block.content || "<p>Inserisci testo...</p>"}
          onChange={(html) => onUpdateBlock(index, { ...block, content: html })}
        />
      )}

      {block.type === "image" && (
        <TiptapEditor
          content={block.content || "<p>Carica immagine...</p>"}
          onChange={(html) => onUpdateBlock(index, { ...block, content: html })}
        />
      )}

      {block.type === "divider" && <hr />}

      {block.type === "footer" && (
        <p className="text-xs text-gray-500">Footer</p>
      )}

      {/* ✅ Pulsante salva come blocco */}
      <button
        className="mt-3 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition"
        onClick={saveBlock}
      >
        ⭐ Salva come blocco
      </button>
    </div>
  );
}
