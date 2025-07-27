
1. **Installer les dépendances**
   ```sh
   npm install
   ```

2. **Créer la base de données PostgreSQL**
   - Connecte-toi à PostgreSQL et exécute :
     ```sql
     CREATE DATABASE qualiextra;
     ```

3. **Configurer les variables d'environnement**
   - Copie `.env.example` en `.env` et adapte les valeurs (surtout `DATABASE_URL`, `SMTP_*`, `JWT_SECRET`).

4. **Appliquer les migrations Prisma**
   ```sh
   npx prisma migrate dev
   ```


5. **Créer un administrateur par défaut**
   -
   (`admin@qualiextra.com` / mot de passe `admin123`), lance :
   ```sh
   npx ts-node prisma/seed.ts
   ```


6. **Démarrer le serveur**
   ```sh
   npm run build
   npm run dev
   ```

Le serveur sera accessible sur http://localhost:3000

SwaggerUI accessible sur http://localhost:3000/doc/

PS: j'ai du faire mes test avec postman pour certaines routes je n'ai pas pu le faire sur swaggerUI j'ai pas réussi à ajouter le token dans authorization
