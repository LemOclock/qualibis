import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Put,
  Route,
  Tags,
  SuccessResponse,
  Response,
  Request,
} from "tsoa";
import { PrismaClient } from "@prisma/client";
import { User, UpdateUserRequest } from "../types/auth";
import { AuthenticatedRequest } from "../middleware/auth";

const prisma = new PrismaClient(); // prisma client pour interagir avc la BDD

@Route("users")
@Tags("Users") // tag pour regrouper les routes dans swaggerUI
export class UserController extends Controller {
  @Get("private")
  @SuccessResponse(200, "Accès autorisé")
  public async getPrivateMessage(
    @Request() request: AuthenticatedRequest
  ): Promise<{ message: string }> {
    const user = request.user!;

    // Récupération des informations utilisateur
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    return {
      message: `Hello ${userData?.firstName || "Utilisateur"}`,
    };
  }

  @Get()
  @SuccessResponse(200, "Liste des utilisateurs")
  @Response(403, "Accès refusé")
  public async getAllUsers(): Promise<Omit<User, "password">[]> {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return users;
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      this.setStatus(500);
      throw new Error("Erreur interne du serveur");
    }
  }

  @Get("{id}")
  @SuccessResponse(200, "Détails utilisateur")
  @Response(403, "Accès refusé")
  @Response(404, "Utilisateur non trouvé")
  public async getUserById(
    @Path() id: string,
    @Request() request: AuthenticatedRequest
  ): Promise<Omit<User, "password">> {
    const currentUser = request.user!;

    // Vérifier les droits d'accès
    if (currentUser.role !== "ADMIN" && currentUser.userId !== id) {
      this.setStatus(403);
      throw new Error(
        "Accès refusé - Vous ne pouvez accéder qu'à vos propres données"
      );
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        this.setStatus(404);
        throw new Error("Utilisateur non trouvé");
      }

      return user;
    } catch (error: any) {
      if (error.message.includes("non trouvé")) {
        throw error;
      }
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      this.setStatus(500);
      throw new Error("Erreur interne du serveur");
    }
  }

 
  @Put("{id}")
  @SuccessResponse(200, "Utilisateur modifié")
  @Response(403, "Accès refusé")
  @Response(404, "Utilisateur non trouvé")
  public async updateUser(
    @Path() id: string,
    @Body() requestBody: UpdateUserRequest,
    @Request() request: AuthenticatedRequest
  ): Promise<Omit<User, "password">> {
    const currentUser = request.user!;

    // Vérifier les droits d'accès
    if (currentUser.role !== "ADMIN" && currentUser.userId !== id) {
      this.setStatus(403);
      throw new Error(
        "Accès refusé - Vous ne pouvez modifier que vos propres données"
      );
    }

    try {
      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        this.setStatus(404);
        throw new Error("Utilisateur non trouvé");
      }

      // Mise à jour
      const updatedUser = await prisma.user.update({
        where: { id },
        data: requestBody,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    } catch (error: any) {
      if (error.message.includes("non trouvé")) {
        throw error;
      }
      console.error("Erreur lors de la mise à jour:", error);
      this.setStatus(500);
      throw new Error("Erreur interne du serveur");
    }
  }


  @Delete("{id}")
  @SuccessResponse(200, "Utilisateur supprimé")
  @Response(403, "Accès refusé")
  @Response(404, "Utilisateur non trouvé")
  public async deleteUser(@Path() id: string): Promise<{ message: string }> {
    try {
      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        this.setStatus(404);
        throw new Error("Utilisateur non trouvé");
      }

      // Suppression
      await prisma.user.delete({
        where: { id },
      });

      return { message: "Utilisateur supprimé avec succès" };
    } catch (error: any) {
      if (error.message.includes("non trouvé")) {
        throw error;
      }
      console.error("Erreur lors de la suppression:", error);
      this.setStatus(500);
      throw new Error("Erreur interne du serveur");
    }
  }
}
