import nodemailer from "nodemailer"; // pour envoyer des mail
import { v4 as uuidv4 } from "uuid"; // genere des tokens

export class EmailService {
  private transporter;

  constructor() {
    // Configuration Mailtrap (peut être changer par un autre service )
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  // genère le token avec uuid
  generateVerificationToken(): string {
    return uuidv4();
  }
  async sendVerificationEmail(
    email: string,
    firstName: string,
    token: string
  ): Promise<void> {
    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
    // envoi lemail avec une url et le token en supplément a la fin

    const mailOptions = {
      from: "noreply@qualiextra.com",
      to: email,
      subject: "Vérification de votre compte Qualiextra",
      html: `
        <h1>Bienvenue ${firstName} !</h1>
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">
          Vérifier mon email
        </a>
      `,
      // corps du mail
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email de vérification envoyé à ${email}`);
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      throw new Error("Impossible d'envoyer l'email de vérification");
      // envoi l'email avec le transporter défini plus haut 
    }
  }
}
