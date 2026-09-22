// ===========================================
// API ROUTE: pages/api/auth/session-check.js
// Gestione Sessioni Attive, IP e Controllo Conflitti Concorrenti
// ===========================================

import { createClient } from "@supabase/supabase-js";
import { prisma } from "../../../lib/email/prisma";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://khvtqienmkobtadtmgsg.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
  const city = req.headers['x-vercel-ip-city'];
  const country = req.headers['x-vercel-ip-country'];
  if (city || country) {
    const cityStr = city ? decodeURIComponent(city) : '';
    const countryStr = country ? decodeURIComponent(country) : '';
    return [cityStr, countryStr].filter(Boolean).join(', ');
  }

  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.')) {
    return 'Rete Locale (PC / LAN)';
  }

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
      try {
        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();
        if (prof) {
          targetUserId = prof.id;
        }
      } catch (_) {}

      if (!targetUserId) {
        try {
          const userObj = await prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() }
          });
          if (userObj) targetUserId = userObj.id;
        } catch (_) {}
      }
    }

    if (!targetUserId) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }

    // =========================================================================
    // ACTION 1: CHECK (Verifica presenza di una sessione attiva su altra connessione)
    // =========================================================================
    if (action === 'check') {
      const location = await getLocationFromIp(clientIp, req);
      const timeoutThreshold = new Date(Date.now() - 15 * 60 * 1000).toISOString(); // 15 minuti inattività

      let activeSession = null;
      let checkedSuccessfully = false;

      // 1. Supabase Check in user_sessions
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
          checkedSuccessfully = true;
          const session = data[0];

          // Verifica se è una sessione diversa (per token o per IP)
          const isDifferentToken = sessionId && session.session_token !== sessionId;
          const isDifferentIp = session.ip_address && session.ip_address !== clientIp;

          if (isDifferentToken || isDifferentIp || !sessionId) {
            activeSession = {
              sessionId: session.session_token || session.id,
              ipAddress: session.ip_address || clientIp,
              location: session.location || 'Posizione remota',
              userAgent: session.user_agent || 'Browser remoto',
              lastActivity: session.last_activity
            };
          }
        }
      } catch (_) {}

      // 2. Fallback in profiles (Supabase)
      if (!checkedSuccessfully && !activeSession) {
        try {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('active_session_token, last_active_ip, last_active_location, last_active_agent, last_active_at')
            .eq('id', targetUserId)
            .maybeSingle();

          if (profile && profile.active_session_token && profile.last_active_at) {
            const lastActiveTime = new Date(profile.last_active_at).getTime();
            const isRecent = (Date.now() - lastActiveTime) < (15 * 60 * 1000);

            if (isRecent) {
              const isDiffToken = sessionId && profile.active_session_token !== sessionId;
              const isDiffIp = profile.last_active_ip && profile.last_active_ip !== clientIp;

              if (isDiffToken || isDiffIp || !sessionId) {
                checkedSuccessfully = true;
                activeSession = {
                  sessionId: profile.active_session_token,
                  ipAddress: profile.last_active_ip || clientIp,
                  location: profile.last_active_location || 'Posizione remota',
                  userAgent: profile.last_active_agent || 'Browser remoto',
                  lastActivity: profile.last_active_at
                };
              }
            }
          }
        } catch (_) {}
      }

      // 3. Fallback in Prisma UserSession
      if (!checkedSuccessfully && !activeSession) {
        try {
          const cutoff = new Date(Date.now() - 15 * 60 * 1000);
          const prismaSession = await prisma.userSession.findFirst({
            where: {
              userId: targetUserId,
              isActive: true,
              lastActivity: { gt: cutoff }
            },
            orderBy: { lastActivity: 'desc' }
          });

          if (prismaSession) {
            const isDiffToken = sessionId && prismaSession.sessionToken !== sessionId;
            const isDiffIp = prismaSession.ipAddress && prismaSession.ipAddress !== clientIp;

            if (isDiffToken || isDiffIp || !sessionId) {
              activeSession = {
                sessionId: prismaSession.sessionToken || prismaSession.id,
                ipAddress: prismaSession.ipAddress || clientIp,
                location: prismaSession.location || 'Posizione remota',
                userAgent: prismaSession.userAgent || 'Browser remoto',
                lastActivity: prismaSession.lastActivity
              };
            }
          }
        } catch (_) {}
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
    // ACTION 2: REGISTER / OVERRIDE (Registra la nuova sessione e disattiva le precedenti)
    // =========================================================================
    if (action === 'register' || action === 'override') {
      const location = await getLocationFromIp(clientIp, req);
      const newSessionId = sessionId || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const nowIso = new Date().toISOString();

      // 1. Aggiorna Supabase user_sessions
      try {
        await supabaseAdmin
          .from('user_sessions')
          .update({ is_active: false })
          .eq('user_id', targetUserId);

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
      } catch (_) {}

      // 2. Aggiorna Supabase profiles
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
      } catch (_) {}

      // 3. Aggiorna Prisma UserSession (se usata)
      try {
        await prisma.userSession.updateMany({
          where: { userId: targetUserId },
          data: { isActive: false }
        });

        await prisma.userSession.create({
          data: {
            userId: targetUserId,
            sessionToken: newSessionId,
            ipAddress: clientIp,
            userAgent: userAgent,
            location: location,
            isActive: true,
            lastActivity: new Date()
          }
        });
      } catch (_) {}

      return res.status(200).json({
        success: true,
        sessionId: newSessionId,
        ipAddress: clientIp,
        location
      });
    }

    // =========================================================================
    // ACTION 3: HEARTBEAT (Verifica che la sessione corrente sia ancora valida)
    // =========================================================================
    if (action === 'heartbeat') {
      if (!sessionId) {
        return res.status(400).json({ success: false, message: 'sessionId richiesto' });
      }

      const nowIso = new Date().toISOString();
      let isValid = true;
      let tested = false;

      // Supabase user_sessions
      try {
        const { data: session, error } = await supabaseAdmin
          .from('user_sessions')
          .select('is_active, session_token')
          .eq('user_id', targetUserId)
          .eq('session_token', sessionId)
          .maybeSingle();

        if (!error && session) {
          tested = true;
          if (!session.is_active) {
            isValid = false;
          } else {
            await supabaseAdmin
              .from('user_sessions')
              .update({ last_activity: nowIso })
              .eq('user_id', targetUserId)
              .eq('session_token', sessionId);
          }
        }
      } catch (_) {}

      // Supabase profiles fallback
      if (!tested) {
        try {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('active_session_token')
            .eq('id', targetUserId)
            .maybeSingle();

          if (profile && profile.active_session_token) {
            tested = true;
            if (profile.active_session_token !== sessionId) {
              isValid = false;
            } else {
              await supabaseAdmin
                .from('profiles')
                .update({ last_active_at: nowIso })
                .eq('id', targetUserId);
            }
          }
        } catch (_) {}
      }

      // Prisma fallback
      if (!tested) {
        try {
          const prismaSess = await prisma.userSession.findFirst({
            where: { userId: targetUserId, sessionToken: sessionId }
          });
          if (prismaSess) {
            tested = true;
            if (!prismaSess.isActive) {
              isValid = false;
            } else {
              await prisma.userSession.update({
                where: { id: prismaSess.id },
                data: { lastActivity: new Date() }
              });
            }
          }
        } catch (_) {}
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
    // ACTION 4: LOGOUT (Rende inattiva la piattaforma per quell'utente)
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
      } catch (_) {}

      try {
        await supabaseAdmin
          .from('profiles')
          .update({ active_session_token: null })
          .eq('id', targetUserId);
      } catch (_) {}

      try {
        if (sessionId) {
          await prisma.userSession.updateMany({
            where: { userId: targetUserId, sessionToken: sessionId },
            data: { isActive: false }
          });
        } else {
          await prisma.userSession.updateMany({
            where: { userId: targetUserId },
            data: { isActive: false }
          });
        }
      } catch (_) {}

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

