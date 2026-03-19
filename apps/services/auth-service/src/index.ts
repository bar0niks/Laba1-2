import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import { USER_ROLES, type AuthResponse, type LoginRequest, type RegisterRequest } from "@gym/shared";
import { config } from "./config";
import { pool } from "./db";

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  role: "admin" | "client";
}

const app = express();
app.use(cors());
app.use(express.json());

const asyncHandler =
  (
    handler: (
      req: express.Request,
      res: express.Response
    ) => Promise<express.Response | void>
  ) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    void handler(req, res).catch(next);
  };

const mapUser = (user: UserRow) => ({
  id: user.id,
  email: user.email,
  fullName: user.full_name,
  role: user.role
});

const signToken = (user: UserRow) =>
  jwt.sign(mapUser(user), config.jwtSecret, { expiresIn: "12h" });

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "auth-service" });
});

app.post("/auth/register", asyncHandler(async (req, res) => {
  const body = req.body as RegisterRequest;

  if (!body.email || !body.password || !body.fullName || !body.phone) {
    return res.status(400).json({ message: "Некорректные данные регистрации." });
  }

  const existing = await pool.query<UserRow>(
    "select id, email, password_hash, full_name, role from users where email = $1",
    [body.email]
  );

  if (existing.rowCount) {
    return res.status(409).json({ message: "Пользователь уже существует." });
  }

  const passwordHash = await bcrypt.hash(body.password, 10);
  const client = await pool.connect();

  try {
    await client.query("begin");
    const userResult = await client.query<UserRow>(
      `insert into users (email, password_hash, full_name, role)
       values ($1, $2, $3, $4)
       returning id, email, password_hash, full_name, role`,
      [body.email, passwordHash, body.fullName, USER_ROLES.CLIENT]
    );

    const user = userResult.rows[0];

    await client.query(
      `insert into client_profiles (user_id, phone, emergency_contact, goals)
       values ($1, $2, $3, $4)`,
      [user.id, body.phone, "Не указан", "Поддержание формы"]
    );

    await client.query(
      `insert into memberships (user_id, plan_name, valid_until, visits_left)
       values ($1, $2, current_date + interval '30 day', $3)`,
      [user.id, "Базовый", 12]
    );

    await client.query("commit");

    const response: AuthResponse = {
      token: signToken(user),
      user: mapUser(user)
    };

    return res.status(201).json(response);
  } catch (error) {
    await client.query("rollback");
    return res.status(500).json({ message: "Не удалось зарегистрировать пользователя." });
  } finally {
    client.release();
  }
}));

app.post("/auth/login", asyncHandler(async (req, res) => {
  const body = req.body as LoginRequest;

  const result = await pool.query<UserRow>(
    "select id, email, password_hash, full_name, role from users where email = $1",
    [body.email]
  );

  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({ message: "Неверный email или пароль." });
  }

  const isValid = await bcrypt.compare(body.password, user.password_hash);

  if (!isValid) {
    return res.status(401).json({ message: "Неверный email или пароль." });
  }

  const response: AuthResponse = {
    token: signToken(user),
    user: mapUser(user)
  };

  return res.json(response);
}));

app.get("/auth/validate", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Токен отсутствует." });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return res.json(payload);
  } catch {
    return res.status(401).json({ message: "Токен недействителен." });
  }
});

app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    return res.status(500).json({
      message: error.message || "Внутренняя ошибка auth-service."
    });
  }
);

app.listen(config.port, () => {
  console.log(`auth-service listening on ${config.port}`);
});
