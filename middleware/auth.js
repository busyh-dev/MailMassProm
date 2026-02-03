// ===========================================
// AUTH MIDDLEWARE: middleware/auth.js
// ===========================================

import { AuthService } from '../lib/email/auth';

export function authMiddleware(handler) {
  return async (req, res) => {
    try {
      // Estrai token
      const token = AuthService.extractTokenFromRequest(req);
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token di accesso richiesto'
        });
      }

      // Verifica token e ottieni utente
      const user = await AuthService.getUserFromToken(token);
      
      // Aggiungi utente alla richiesta
      req.user = user;
      req.userId = user.id;

      // Continua con il handler
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
  };
}

export function adminMiddleware(handler) {
  return authMiddleware(async (req, res) => {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Accesso riservato agli amministratori'
      });
    }

    return handler(req, res);
  });
}