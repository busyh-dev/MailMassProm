// ===========================================
// API ROUTE: pages/api/auth/session-check.js
// Gestione Sessioni IP e Controllo Conflitti
// ===========================================

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper per estrarre l'IP reale del client
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (ip) return ip;
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';
}

// Helper per determinare la posizione dall'IP
async function getLocationFromIp(ip, req) {
  // Controlla header Vercel se disponibili
  const city = req.headers['x-vercel-ip-city'];
  const country = req.headers['x-vercel-ip-country'];
  if (city || country) {
    const cityStr = city ? decodeURIComponent(city) : '';
    const countryStr = country ? decodeURIComponent(country) : '';
    return [cityStr, countryStr].filter(Boolean).join(', ');
  }

  // IP Locali o privati
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.')) {
    return 'Rete Locale (PC / LAN)';
  }

  // Fallback con API di geolocalizzazione (timeout rapido 1.5s)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,country`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        return [data.city, data.country].filter(Boolean).join(', ');
      }
    }
  } catch (e) {
    // Ignora timeout o errori di rete esterni
  }

  return 'Posizione sconosciuta';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { action, userId, sessionId, email } = req.body;
    const clientIp = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'Browser Sconosciuto';

    if (!userId && !email) {
      return res.status(400).json({ success: false, message: 'userId o email richiesti' });
    }

    // Risoluzione ID utente se fornita solo l'email
    let targetUserId = userId;
    if (!targetUserId && email) {
      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();
      if (prof) {
        targetUserId = prof.id;
      }
    }

    if (!targetUserId) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }

    // =========================================================================
    // ACTION 1: CHECK (Verifica presenza sessione attiva su IP diverso)
    // =========================================================================
    if (action === 'check') {
      const location = await getLocationFromIp(clientIp, req);
      const timeoutThreshold = new Date(Date.now() - 15 * 60 * 1000).toISOString(); // 15 minuti di inattività

      // Tentativo 1: Tabella user_sessions (se esiste)
      let activeSession = null;
      let checkError = null;

      try {
        const { data, error } = await supabaseAdmin
          .from('user_sessions')
          .select('*')
          .eq('user_id', targetUserId)
          .eq('is_active', true)
          .gt('last_activity', timeoutThreshold)
          .order('last_activity', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const session = data[0];
          // Se la sessione attiva è su un IP diverso, segnala il conflitto
          if (session.ip_address && session.ip_address !== clientIp) {
            activeSession = {
              sessionId: session.session_token || session.id,
              ipAddress: session.ip_address,
              location: session.location || 'Posizione remota',
              userAgent: session.user_agent || 'Browser remoto',
              lastActivity: session.last_activity
            };
          }
        } else {
          checkError = error;
        }
      } catch (err) {
        checkError = err;
      }

      // Tentativo 2 (Fallback): Tabella profiles
      if (checkError || !activeSession) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('active_session_token, last_active_ip, last_active_location, last_active_agent, last_active_at')
          .eq('id', targetUserId)
          .maybeSingle();

        if (profile && profile.active_session_token && profile.last_active_at) {
          const lastActiveTime = new Date(profile.last_active_at).getTime();
          const isRecent = (Date.now() - lastActiveTime) < (15 * 60 * 1000); // Negli ultimi 15 min

          if (isRecent && profile.last_active_ip && profile.last_active_ip !== clientIp) {
            activeSession = {
              sessionId: profile.active_session_token,
              ipAddress: profile.last_active_ip,
              location: profile.last_active_location || 'Posizione remota',
              userAgent: profile.last_active_agent || 'Browser remoto',
              lastActivity: profile.last_active_at
            };
          }
        }
      }

      if (activeSession) {
        return res.status(200).json({
          success: true,
          hasConflict: true,
          activeSession,
          currentClient: {
            ipAddress: clientIp,
            location
          }
        });
      }

      return res.status(200).json({
        success: true,
        hasConflict: false,
        currentClient: {
          ipAddress: clientIp,
          location
        }
      });
    }

    // =========================================================================
    // ACTION 2: REGISTER / OVERRIDE (Registra la nuova sessione e disattiva la vecchia)
    // =========================================================================
    if (action === 'register' || action === 'override') {
      const location = await getLocationFromIp(clientIp, req);
      const newSessionId = sessionId || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const nowIso = new Date().toISOString();

      // 1. Prova aggiornamento/inserimento in user_sessions
      try {
        // Disattiva tutte le sessioni precedenti dell'utente
        await supabaseAdmin
          .from('user_sessions')
          .update({ is_active: false })
          .eq('user_id', targetUserId);

        // Inserisci nuova sessione attiva
        await supabaseAdmin
          .from('user_sessions')
          .insert({
            user_id: targetUserId,
            session_token: newSessionId,
            ip_address: clientIp,
            user_agent: userAgent,
            location: location,
            is_active: true,
            last_activity: nowIso,
            created_at: nowIso
          });
      } catch (err) {
        // Ignora se la tabella user_sessions non esiste ancora in DB
      }

      // 2. Aggiorna sempre anche profiles per retrocompatibilità e fallback
      try {
        await supabaseAdmin
          .from('profiles')
          .update({
            active_session_token: newSessionId,
            last_active_ip: clientIp,
            last_active_location: location,
            last_active_agent: userAgent,
            last_active_at: nowIso
          })
          .eq('id', targetUserId);
      } catch (err) {
        console.warn('⚠️ Impossibile aggiornare campi sessione in profiles:', err.message);
      }

      return res.status(200).json({
        success: true,
        sessionId: newSessionId,
        ipAddress: clientIp,
        location
      });
    }

    // =========================================================================
    // ACTION 3: HEARTBEAT (Verifica se la sessione client è ancora attiva)
    // =========================================================================
    if (action === 'heartbeat') {
      if (!sessionId) {
        return res.status(400).json({ success: false, message: 'sessionId richiesto' });
      }

      const nowIso = new Date().toISOString();
      let isValid = true;
      let testedTable = false;

      // Check in user_sessions
      try {
        const { data: sessions, error } = await supabaseAdmin
          .from('user_sessions')
          .select('is_active, session_token')
          .eq('user_id', targetUserId)
          .eq('session_token', sessionId)
          .maybeSingle();

        if (!error && sessions) {
          testedTable = true;
          if (!sessions.is_active) {
            isValid = false;
          } else {
            // Aggiorna l'attività
            await supabaseAdmin
              .from('user_sessions')
              .update({ last_activity: nowIso })
              .eq('user_id', targetUserId)
              .eq('session_token', sessionId);
          }
        }
      } catch (err) {
        // Fallback
      }

      // Fallback check in profiles
      if (!testedTable) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('active_session_token')
          .eq('id', targetUserId)
          .maybeSingle();

        if (profile && profile.active_session_token) {
          if (profile.active_session_token !== sessionId) {
            isValid = false;
          } else {
            await supabaseAdmin
              .from('profiles')
              .update({ last_active_at: nowIso })
              .eq('id', targetUserId);
          }
        }
      }

      if (!isValid) {
        return res.status(200).json({
          success: true,
          valid: false,
          reason: 'session_overridden',
          message: 'La sessione è stata terminata da un altro dispositivo.'
        });
      }

      return res.status(200).json({ success: true, valid: true });
    }

    // =========================================================================
    // ACTION 4: LOGOUT (Disattiva la sessione)
    // =========================================================================
    if (action === 'logout') {
      try {
        if (sessionId) {
          await supabaseAdmin
            .from('user_sessions')
            .update({ is_active: false })
            .eq('user_id', targetUserId)
            .eq('session_token', sessionId);
        } else {
          await supabaseAdmin
            .from('user_sessions')
            .update({ is_active: false })
            .eq('user_id', targetUserId);
        }
      } catch (err) {}

      try {
        await supabaseAdmin
          .from('profiles')
          .update({ active_session_token: null })
          .eq('id', targetUserId);
      } catch (err) {}

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ success: false, message: 'Azione non valida' });

  } catch (error) {
    console.error('❌ Errore API session-check:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore interno del server durante il controllo sessione'
    });
  }
}
