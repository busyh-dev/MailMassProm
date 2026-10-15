import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { campaign_id, recipient } = req.query;

  if (campaign_id) {
    try {
      let isFirstOpen = true;

      // Se destinatario fornito, verifichiamo se aveva già aperto per non falsare i contatori unici
      if (recipient && recipient !== 'bulk') {
        const targetEmail = decodeURIComponent(recipient).toLowerCase().trim();
        try {
          const { data: existingLog } = await supabase
            .from('campaign_logs')
            .select('opened_at, status')
            .eq('campaign_id', campaign_id)
            .eq('recipient_email', targetEmail)
            .maybeSingle();

          if (existingLog?.opened_at || existingLog?.status === 'opened') {
            isFirstOpen = false;
          }

          const now = new Date().toISOString();

          // 1. Aggiorna campaign_recipients (apertura del singolo destinatario)
          await supabase
            .from('campaign_recipients')
            .update({ 
              opened_at: now
            })
            .eq('campaign_id', campaign_id)
            .eq('email', targetEmail);

          // 2. Aggiorna campaign_logs (apertura del singolo destinatario)
          await supabase
            .from('campaign_logs')
            .update({ 
              status: 'opened',
              opened_at: now
            })
            .eq('campaign_id', campaign_id)
            .eq('recipient_email', targetEmail);
        } catch (cErr) {
          console.warn('⚠️ Avviso aggiornamento log destinatario:', cErr.message);
        }
      }

      // 3. Incrementa opened_count della campagna (se primo open o invio bulk)
      if (isFirstOpen) {
        const { error: rpcError } = await supabase.rpc('increment_opened_count', { p_campaign_id: campaign_id });

        // Fallback manuale se l'RPC fallisce
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

        // 4. Aggiorna anche la tabella email_logs se presente
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
        } catch (_) {}
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
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.send(pixel);
}