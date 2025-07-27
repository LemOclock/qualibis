import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Vérifier si un admin existe déjà
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    console.log("Un administrateur existe déjà :", existingAdmin.email);
    return;
  }

  // Créer un utilisateur admin par défaut
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.create({
    data: {
      firstName: "Admin",
      lastName: "Qualiextra",
      email: "admin@qualiextra.com",
      password: hashedPassword,
      role: "ADMIN",
      isEmailVerified: true,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
