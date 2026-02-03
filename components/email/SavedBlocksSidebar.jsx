// components/email/SavedBlocksSidebar.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function SavedBlocksSidebar({ user }) {
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    if (user) {
      // Carica i blocchi salvati per l'utente
      supabase
        .from("saved_blocks")
        .select("*")
        .eq("user_id", user.id)
        .then(({ data }) => {
          setBlocks(data || []);
        });
    }
  }, [user]);

  return (
    <div className="w-72 bg-white p-4 shadow-lg">
      <h3 className="text-xl font-semibold mb-4">Blocchi salvati</h3>
      <div>
        {blocks.map((block) => (
          <div key={block.id} className="mb-4">
            <h4 className="font-medium">{block.name}</h4>
            <div
              dangerouslySetInnerHTML={{ __html: block.html }}
              className="border border-gray-300 p-2 rounded-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

