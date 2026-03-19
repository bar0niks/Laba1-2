import path from "node:path";
import axios from "axios";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { type LoginRequest, type RegisterRequest } from "@gym/shared";
import { config } from "./config";

interface JwtPayload {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

const app = express();
const swaggerDocument = YAML.load(
  path.resolve(process.cwd(), "docs/swagger.yaml")
);

app.use(cors());
app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const authClient = axios.create({ baseURL: config.authServiceUrl });
const membersClient = axios.create({ baseURL: config.membersServiceUrl });

const asyncHandler =
  (
    handler: (
      req: Request,
      res: Response
    ) => Promise<Response | void>
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res).catch(next);
  };

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Требуется авторизация." });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    (req as Request & { user: JwtPayload }).user = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Недействительный токен." });
  }
};

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api-gateway" });
});

app.post("/api/auth/register", asyncHandler(async (req, res) => {
  const response = await authClient.post("/auth/register", req.body as RegisterRequest);
  res.status(response.status).json(response.data);
}));

app.post("/api/auth/login", asyncHandler(async (req, res) => {
  const response = await authClient.post("/auth/login", req.body as LoginRequest);
  res.status(response.status).json(response.data);
}));

app.get("/api/auth/me", requireAuth, asyncHandler(async (req, res) => {
  const user = (req as Request & { user: JwtPayload }).user;
  const response = await membersClient.get(`/clients/${user.id}/dashboard`);
  res.json(response.data);
}));

app.put("/api/clients/me", requireAuth, asyncHandler(async (req, res) => {
  const user = (req as Request & { user: JwtPayload }).user;
  const response = await membersClient.put(`/clients/${user.id}/profile`, req.body);
  res.json(response.data);
}));

app.use(
  (
    error: {
      response?: { status: number; data: unknown };
      message?: string;
    },
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      message: error.message ?? "Внутренняя ошибка шлюза."
    });
  }
);

app.listen(config.port, () => {
  console.log(`api-gateway listening on ${config.port}`);
});
