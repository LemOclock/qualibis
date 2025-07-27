import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { JwtPayload } from '../types/auth';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// Middleware pour vérifier l'authentification
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant ou invalide' });
    } // recupère le token dans authorization sinn retourne erreur 

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }
}; // recup le token après le brearer verifie et le place dans req.user 

// Middleware pour vérifier les droits admin
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès refusé - Droits administrateur requis' });
  }
  next();
}; 

// Middleware pour vérifier l'accès aux ressources utilisateur
export const requireOwnershipOrAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.params.id;
  
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  
  // Admin peut accéder à tout, utilisateur seulement à ses propres données
  if (req.user.role === 'ADMIN' || req.user.userId === userId) {
    next();
  } else {
    return res.status(403).json({ error: 'Accès refusé - Vous ne pouvez accéder qu\'à vos propres données' });
  }
}; 