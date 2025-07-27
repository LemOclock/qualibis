import { Body, Controller, Get, Post, Query, Route, Tags, SuccessResponse, Response } from 'tsoa';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CreateUserRequest, LoginRequest, User } from '../types/auth';
import { generateToken } from '../utils/jwt';
import { EmailService } from '../services/EmailService';
import { TempEmailService } from '../services/TempEmailService';

const prisma = new PrismaClient();
const emailService = new EmailService();

@Route('auth')
@Tags('Authentication')
export class AuthController extends Controller {
  @Post('register')
  @SuccessResponse(201, 'Utilisateur créé avec succès')
  @Response(400, 'Données invalides')
  @Response(409, 'Email déjà utilisé')
  public async register(@Body() requestBody: CreateUserRequest): Promise<{ message: string; userId: string }> {
    const { firstName, lastName, email, password } = requestBody;

    if (!firstName || !lastName || !email || !password) {
      this.setStatus(400);
      throw new Error('Tous les champs sont requis');
    }

    // Vérification email temporaire
    const emailValidation = TempEmailService.validateEmail(email);
    if (!emailValidation.isValid) {
      this.setStatus(400);
      throw new Error(emailValidation.error!);
    }

    try {
      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        this.setStatus(409);
        throw new Error('Un compte avec cet email existe déjà');
      }

      // Hash du mot de passe
      const hashedPassword = await bcrypt.hash(password, 12);

      // Génération du token de vérification
      const verificationToken = emailService.generateVerificationToken();

      // Création de l'utilisateur
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          emailVerificationToken: verificationToken,
          isEmailVerified: false,
        },
      });

      // Envoi de l'email de vérification
      await emailService.sendVerificationEmail(email, firstName, verificationToken);

      this.setStatus(201);
      return {
        message: 'Compte créé avec succès. Veuillez vérifier votre email avant de vous connecter.',
        userId: user.id
      };

    } catch (error: any) {
      if (error.message.includes('déjà') || error.message.includes('temporaire')) {
        throw error;
      }
      console.error('Erreur lors de l\'inscription:', error);
      this.setStatus(500);
      throw new Error('Erreur interne du serveur');
    }
  }

  @Post('login')
  @SuccessResponse(200, 'Connexion réussie')
  @Response(400, 'Données invalides')
  @Response(401, 'Identifiants incorrects')
  @Response(403, 'Email non vérifié')
  public async login(@Body() requestBody: LoginRequest): Promise<{ token: string; user: Omit<User, 'password'> }> {
    const { email, password } = requestBody;

    if (!email || !password) {
      this.setStatus(400);
      throw new Error('Email et mot de passe requis');
    }

    try {
      // Recherche de l'utilisateur
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        this.setStatus(401);
        throw new Error('Identifiants incorrects');
      }

      // Vérification du mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.setStatus(401);
        throw new Error('Identifiants incorrects');
      }

      // Vérification que l'email est vérifié
      if (!user.isEmailVerified) {
        this.setStatus(403);
        throw new Error('Veuillez vérifier votre email avant de vous connecter');
      }

      // Génération du token JWT
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Retour des données utilisateur (sans le mot de passe)
      const { password: _, emailVerificationToken: __, ...userWithoutPassword } = user;

      return {
        token,
        user: userWithoutPassword
      };

    } catch (error: any) {
      if (error.message.includes('Identifiants') || error.message.includes('vérifier')) {
        throw error;
      }
      console.error('Erreur lors de la connexion:', error);
      this.setStatus(500);
      throw new Error('Erreur interne du serveur');
    }
  }

  /**
   * Vérification d'email via token
   */
  @Get('verify-email')
  @SuccessResponse(200, 'Email vérifié avec succès')
  @Response(400, 'Token manquant ou invalide')
  public async verifyEmail(@Query() token: string): Promise<{ message: string }> {
    if (!token) {
      this.setStatus(400);
      throw new Error('Token de vérification requis');
    }

    try {
      // Recherche de l'utilisateur avec ce token
      const user = await prisma.user.findFirst({
        where: {
          emailVerificationToken: token,
          isEmailVerified: false
        }
      });

      if (!user) {
        this.setStatus(400);
        throw new Error('Token de vérification invalide ou déjà utilisé');
      }

      // Mise à jour de l'utilisateur
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null
        }
      });

      return { message: 'Email vérifié avec succès ! Vous pouvez maintenant vous connecter.' };

    } catch (error: any) {
      if (error.message.includes('Token')) {
        throw error;
      }
      console.error('Erreur lors de la vérification:', error);
      this.setStatus(500);
      throw new Error('Erreur interne du serveur');
    }
  }
}