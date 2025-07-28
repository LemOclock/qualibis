import express, { Application } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { RegisterRoutes } from "./routes";
import swaggerUi from "swagger-ui-express";
import * as swaggerDocument from "../dist/swagger.json";
import {
  authenticate,
  requireAdmin,
  requireOwnershipOrAdmin,
  AuthenticatedRequest,
} from "./middleware/auth";
import cors from "cors";

dotenv.config();

const app: Application = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("API en ligne");
});

app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middlewares d'authentification
app.use("/api/users/private", authenticate);

// Middleware d'authentification et d'autorisation pour /api/users sauf /api/users/private
app.use("/api/users", (req: AuthenticatedRequest, res, next) => {
  if (req.path.startsWith("/private")) {
    // Ne rien faire, laisser le middleware spécifique s'appliquer
    return next();
  }
  // Routes qui nécessitent une authentification
  if (req.method === "GET" && req.path === "/") {
    // Liste des utilisateurs - Admin uniquement
    return authenticate(req, res, (err) => {
      if (err) return next(err);
      requireAdmin(req, res, next);
    });
  } else if (req.method === "DELETE") {
    // Suppression - Admin uniquement
    return authenticate(req, res, (err) => {
      if (err) return next(err);
      requireAdmin(req, res, next);
    });
  } else if (req.method === "GET" || req.method === "PUT") {
    // Consultation/modification - Propriétaire ou Admin
    return authenticate(req, res, (err) => {
      if (err) return next(err);
      requireOwnershipOrAdmin(req, res, next);
    });
  }
  next();
});

import { Router } from "express";
const apiRouter = Router();
RegisterRoutes(apiRouter);
app.use("/api", apiRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` http://localhost:${PORT}`);
  console.log(`SwaggUI http://localhost:${PORT}/doc`);
});

export default app;
