"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    // Vérifier si un admin existe déjà
    const existingAdmin = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    });
    if (existingAdmin) {
        console.log('Un administrateur existe déjà :', existingAdmin.email);
        return;
    }
    // Créer un utilisateur admin par défaut
    const hashedPassword = await bcryptjs_1.default.hash('admin123', 12);
    const admin = await prisma.user.create({
        data: {
            firstName: 'Admin',
            lastName: 'Qualiextra',
            email: 'admin@qualiextra.com',
            password: hashedPassword,
            role: 'ADMIN',
            isEmailVerified: true, // Admin pré-vérifié
        },
    });
    console.log('Administrateur créé avec succès :');
    console.log('Email:', admin.email);
    console.log('Mot de passe: admin123');
    console.log('⚠️  Pensez à changer le mot de passe après la première connexion !');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
