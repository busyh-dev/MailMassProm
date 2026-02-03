// ===========================================
// API ROUTE: pages/api/auth/register.js
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
    const { email, password, name } = req.body;

    // Validazione input
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Tutti i campi sono richiesti',
        errors: {
          email: !email ? 'Email richiesta' : '',
          password: !password ? 'Password richiesta' : '',
          name: !name ? 'Nome richiesto' : ''
        }
      });
    }

    // Validazione email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email non valido',
        errors: { email: 'Email non valida' }
      });
    }

    // Validazione password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password troppo debole',
        errors: { password: 'Password deve essere di almeno 8 caratteri' }
      });
    }

    // Controlla se utente esiste già
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Utente già registrato',
        errors: { email: 'Email già in uso' }
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crea nuovo utente
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name.trim(),
        password: hashedPassword,
        isAdmin: false
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true
      }
    });

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

    // Log registrazione
    console.log(`Nuovo utente registrato: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Registrazione completata con successo',
      user,
      token
    });

  } catch (error) {
    console.error('Errore registrazione:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      errors: { general: 'Riprova più tardi' }
    });
  }
}