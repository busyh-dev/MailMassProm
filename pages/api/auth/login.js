// ===========================================
// API ROUTE: pages/api/auth/login.js
// ===========================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../lib/email/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { email, password } = req.body;

    // Validazione input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e password sono richieste',
        errors: {
          email: !email ? 'Email richiesta' : '',
          password: !password ? 'Password richiesta' : ''
        }
      });
    }

    // Cerca utente nel database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide',
        errors: { email: 'Email non trovata' }
      });
    }

    // Verifica password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide',
        errors: { password: 'Password non corretta' }
      });
    }

    // Genera JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        isAdmin: user.isAdmin 
      },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '7d' }
    );

    // Aggiorna last login (opzionale)
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    });

    // Dati utente senza password
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // Log login
    console.log(`Login effettuato: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Login effettuato con successo',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Errore login:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      errors: { general: 'Riprova più tardi' }
    });
  }
}