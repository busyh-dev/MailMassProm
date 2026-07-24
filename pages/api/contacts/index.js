import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

// const SUPABASE_URL = "https://qvgpbxjzvkbetxmmapfq.supabase.co";
// const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2Z3BieGp6dmtiZXR4bW1hcGZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODI4MTk4NiwiZXhwIjoyMDczODU3OTg2fQ.QYNA4jbr57MTiTyAXOhE5IpIsp4iu9J9Z1Z68H4tzBQ";

// const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  console.log('🟢 API /contacts called');
  console.log('🟢 Method:', req.method);

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Metodo non consentito",
    });
  }

  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "user_id è obbligatorio",
    });
  }

  try {
    let data = [];
    let from = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: chunk, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .range(from, from + limit - 1);

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      if (chunk && chunk.length > 0) {
        data = data.concat(chunk);
        from += limit;
      }
      
      if (!chunk || chunk.length < limit) {
        hasMore = false;
      }
    }

    console.log('✅ Contacts loaded:', data?.length || 0);

    return res.status(200).json({
      success: true,
      data: data || [],
    });
  } catch (err) {
    console.error("💥 Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Errore durante il caricamento",
    });
  }
}