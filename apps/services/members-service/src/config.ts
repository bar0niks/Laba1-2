import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 3002),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgres://gym:gym@postgres:5432/gym_crm"
};

