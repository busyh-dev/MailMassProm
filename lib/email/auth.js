// ===========================================
// AUTH SERVICE: lib/email/auth.js
// ===========================================

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export class AuthService {
  static async register(email, password, name) {
    try {
      // Validazioni
      if (!email || !password || !name) {
        throw new Error('Tutti i campi sono richiesti');
      }

      if (password.length < 8) {
        throw new Error('Password deve essere di almeno 8 caratteri');
      }

      // Controlla se utente esiste
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        throw new Error('Email già in uso');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Crea utente
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

      // Genera token
      const token = this.generateToken(user.id, user.email, user.isAdmin);

      return { user, token };
    } catch (error) {
      throw new Error(`Errore registrazione: ${error.message}`);
    }
  }

  static async login(email, password) {
    try {
      // Validazioni
      if (!email || !password) {
        throw new Error('Email e password sono richieste');
      }

      // Trova utente
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        throw new Error('Credenziali non valide');
      }

      // Verifica password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Credenziali non valide');
      }

      // Genera token
      const token = this.generateToken(user.id, user.email, user.isAdmin);

      // Restituisci dati senza password
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      return { user: userResponse, token };
    } catch (error) {
      throw new Error(`Errore login: ${error.message}`);
    }
  }

  static generateToken(userId, email, isAdmin = false) {
    return jwt.sign(
      { 
        userId, 
        email, 
        isAdmin,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '7d' }
    );
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.NEXTAUTH_SECRET);
    } catch (error) {
      throw new Error('Token non valido o scaduto');
    }
  }

  static async getUserFromToken(token) {
    try {
      const decoded = this.verifyToken(token);
      
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
        throw new Error('Utente non trovato');
      }

      return user;
    } catch (error) {
      throw new Error(`Errore verifica token: ${error.message}`);
    }
  }

  static extractTokenFromRequest(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}