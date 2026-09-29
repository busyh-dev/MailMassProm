import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { campaign_id, recipient, url } = req.query;

  if (campaign_id) {
    try {
      // 1. Tenta di eseguire l'RPC per incrementare clicked_count
      const { error: rpcError } = await supabase.rpc('increment_clicked_count', { p_campaign_id: campaign_id });

      // Fallback manuale se l'RPC non esiste o fallisce nel DB
      if (rpcError) {
        const { data: campaign } = await supabase
          .from('campaigns')
          .select('clicked_count')
          .eq('id', campaign_id)
          .single();

        if (campaign) {
          const currentCount = campaign.clicked_count || 0;
          await supabase
            .from('campaigns')
            .update({ clicked_count: currentCount + 1 })
            .eq('id', campaign_id);
        }
      }

      // 2. Aggiorna campaign_logs e campaign_recipients per il singolo destinatario
      if (recipient && recipient !== 'bulk') {
        try {
          const targetEmail = decodeURIComponent(recipient).toLowerCase().trim();
          await supabase
            .from('campaign_recipients')
            .update({
              opened: true,
              read: true,
              read_at: new Date().toISOString()
            })
            .eq('campaign_id', campaign_id)
            .eq('email', targetEmail);

          await supabase
            .from('campaign_logs')
            .update({
              clicked: true,
              clicked_at: new Date().toISOString()
            })
            .eq('campaign_id', campaign_id)
            .eq('recipient_email', targetEmail);
        } catch (cErr) {
          // Ignora se non presente
        }
      }
    } catch (err) {
      console.error('Errore tracking click:', err);
    }
  }

  // ✅ Redirect 302 all'URL originale di destinazione
  if (url) {
    const targetUrl = decodeURIComponent(url);
    return res.redirect(302, targetUrl);
  }

  res.status(200).end();
}