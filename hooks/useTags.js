import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

/**
 * Hook personalizzato per gestire i Tag dell’utente
 * Include funzioni CRUD (crea, leggi, aggiorna, elimina)
 */
export const useTags = () => {
  const { user } = useAuth();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔹 Carica tutti i tag dell’utente loggato
  const loadTags = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user.id)
        .order("label", { ascending: true });

      if (fetchError) throw fetchError;

      setTags(data || []);
    } catch (err) {
      console.error("❌ Errore caricamento tag:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Crea un nuovo tag
  const createTag = async (tagData) => {
    if (!user) return { success: false, error: 'Utente non autenticato' };
  
    try {
      // 🔍 Controlla se esiste già
      const { data: existing } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .eq('value', tagData.value.toLowerCase().trim())
        .maybeSingle();
  
      if (existing) {
        // 🔁 Se esiste già, ritorna come "success" invece di errore
        return {
          success: true,
          message: `Il tag "${existing.label}" esiste già.`,
          data: existing,
          alreadyExists: true, // 👈 flag utile per il frontend
        };
      }
  
      // ✅ Inserisci solo se non esiste
      const { data, error: insertError } = await supabase
        .from('tags')
        .insert([
          {
            user_id: user.id,
            value: tagData.value.toLowerCase().trim(),
            label: tagData.label.trim(),
            color: tagData.color || '#3b82f6',
          },
        ])
        .select()
        .single();
  
      if (insertError) throw insertError;
  
      setTags((prev) => [...prev, data]);
      return { success: true, data };
    } catch (err) {
      console.error('❌ Errore creazione tag:', err);
      return { success: false, error: err.message };
    }
  };
  
  // 🔹 Aggiorna un tag esistente
  const updateTag = async (tagId, updates) => {
    if (!user) return { success: false, error: "Utente non autenticato" };

    try {
      const { data, error: updateError } = await supabase
        .from("tags")
        .update(updates)
        .eq("id", tagId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setTags((prev) => prev.map((tag) => (tag.id === tagId ? data : tag)));
      return { success: true, data };
    } catch (err) {
      console.error("❌ Errore aggiornamento tag:", err);
      return { success: false, error: err.message };
    }
  };

  // 🔹 Elimina un tag
  const deleteTag = async (tagId) => {
    if (!user) return { success: false, error: "Utente non autenticato" };

    try {
      const { error: deleteError } = await supabase
        .from("tags")
        .delete()
        .eq("id", tagId)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      setTags((prev) => prev.filter((tag) => tag.id !== tagId));
      return { success: true };
    } catch (err) {
      console.error("❌ Errore eliminazione tag:", err);
      return { success: false, error: err.message };
    }
  };

  // 🔹 Carica i tag al montaggio
  useEffect(() => {
    loadTags();
  }, [user]);

  return {
    tags,
    loading,
    error,
    loadTags,
    createTag,
    updateTag,
    deleteTag,
  };
};

