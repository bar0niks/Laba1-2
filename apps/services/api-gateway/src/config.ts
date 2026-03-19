import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 3000),
  authServiceUrl: process.env.AUTH_SERVICE_URL ?? "http://auth-service:3001",
  membersServiceUrl:
    process.env.MEMBERS_SERVICE_URL ?? "http://members-service:3002",
  jwtSecret: process.env.JWT_SECRET ?? "super-secret-jwt-key"
};

