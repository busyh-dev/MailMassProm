import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { campaign_id, recipient } = req.query;

  if (campaign_id) {
    try {
      // 1. Tenta di eseguire l'RPC per incrementare opened_count
      const { error: rpcError } = await supabase.rpc('increment_opened_count', { p_campaign_id: campaign_id });

      // Fallback manuale se l'RPC non esiste o fallisce nel DB
      if (rpcError) {
        const { data: campaign } = await supabase
          .from('campaigns')
          .select('opened_count')
          .eq('id', campaign_id)
          .single();

        if (campaign) {
          const currentCount = campaign.opened_count || 0;
          await supabase
            .from('campaigns')
            .update({ opened_count: currentCount + 1 })
            .eq('id', campaign_id);
        }
      }

      // 2. Aggiorna anche la tabella email_logs se presente
      try {
        const { data: emailLog } = await supabase
          .from('email_logs')
          .select('opened_count')
          .eq('campaign_id', campaign_id)
          .single();

        if (emailLog) {
          await supabase
            .from('email_logs')
            .update({ opened_count: (emailLog.opened_count || 0) + 1 })
            .eq('campaign_id', campaign_id);
        }
      } catch (logErr) {
        // Ignora se non presente
      }

      // 3. Aggiorna campaign_logs per il singolo destinatario
      if (recipient && recipient !== 'bulk') {
        try {
          await supabase
            .from('campaign_logs')
            .update({ 
              status: 'opened',
              opened_at: new Date().toISOString()
            })
            .eq('campaign_id', campaign_id)
            .eq('recipient_email', decodeURIComponent(recipient));
        } catch (cErr) {
          // Ignora se non presente
        }
      }
    } catch (err) {
      console.error('Errore tracking apertura:', err);
    }
  }

  // ✅ Ritorna il pixel 1x1 trasparente GIF senza caching
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.send(pixel);
}