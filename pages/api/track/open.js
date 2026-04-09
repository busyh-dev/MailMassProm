import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { campaign_id, recipient } = req.query;

  if (campaign_id) {
    try {
      // ✅ Incrementa opened_count nella campagna
      await supabase.rpc('increment_opened_count', { p_campaign_id: campaign_id });

      // ✅ Aggiorna campaign_logs
      if (recipient && recipient !== 'bulk') {
        await supabase
          .from('campaign_logs')
          .update({ 
            status: 'opened',
            opened_at: new Date().toISOString()
          })
          .eq('campaign_id', campaign_id)
          .eq('recipient_email', decodeURIComponent(recipient));
      }
    } catch (err) {
      console.error('Errore tracking apertura:', err);
    }
  }

  // ✅ Ritorna pixel 1x1 trasparente
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.send(pixel);
}