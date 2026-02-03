// ===========================================
// API ROUTE: pages/api/auth/me.js
// ===========================================

import jwt from 'jsonwebtoken';
import { prisma } from '../../../lib/email/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // Estrai token dall'header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token di accesso mancante'
      });
    }

    const token = authHeader.substring(7); // Rimuovi 'Bearer '

    // Verifica token JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Token non valido o scaduto'
      });
    }

    // Trova utente nel database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Errore verifica utente:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
}
