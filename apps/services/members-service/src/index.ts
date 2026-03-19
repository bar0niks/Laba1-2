import cors from "cors";
import express from "express";
import {
  type ClientProfile,
  type DashboardResponse,
  type Membership,
  type VisitEntry
} from "@gym/shared";
import { config } from "./config";
import { pool } from "./db";

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

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "members-service" });
});

app.get("/clients/:userId/dashboard", asyncHandler(async (req, res) => {
  const userId = Number(req.params.userId);

  const [userResult, profileResult, membershipResult, visitsResult] = await Promise.all([
    pool.query(
      "select id, email, full_name, role from users where id = $1",
      [userId]
    ),
    pool.query<ClientProfile>(
      `select user_id as "userId", phone, emergency_contact as "emergencyContact", goals
       from client_profiles where user_id = $1`,
      [userId]
    ),
    pool.query<Membership>(
      `select id, user_id as "userId", plan_name as "planName", valid_until::text as "validUntil", visits_left as "visitsLeft"
       from memberships where user_id = $1`,
      [userId]
    ),
    pool.query<VisitEntry>(
      `select id, user_id as "userId", visited_at::text as "visitedAt", trainer, notes
       from visit_entries where user_id = $1 order by visited_at desc`,
      [userId]
    )
  ]);

  const user = userResult.rows[0];
  const profile = profileResult.rows[0];

  if (!user || !profile) {
    return res.status(404).json({ message: "Клиент не найден." });
  }

  const dashboard: DashboardResponse = {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role
    },
    profile,
    membership: membershipResult.rows[0] ?? null,
    visits: visitsResult.rows
  };

  return res.json(dashboard);
}));

app.put("/clients/:userId/profile", asyncHandler(async (req, res) => {
  const userId = Number(req.params.userId);
  const { emergencyContact, goals } = req.body as {
    emergencyContact?: string;
    goals?: string;
  };

  const result = await pool.query<ClientProfile>(
    `update client_profiles
     set emergency_contact = coalesce($2, emergency_contact),
         goals = coalesce($3, goals)
     where user_id = $1
     returning user_id as "userId", phone, emergency_contact as "emergencyContact", goals`,
    [userId, emergencyContact, goals]
  );

  if (!result.rowCount) {
    return res.status(404).json({ message: "Профиль не найден." });
  }

  return res.json(result.rows[0]);
}));

app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    return res.status(500).json({
      message: error.message || "Внутренняя ошибка members-service."
    });
  }
);

app.listen(config.port, () => {
  console.log(`members-service listening on ${config.port}`);
});
