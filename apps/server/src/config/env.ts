import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeOrigins = (value: string | undefined) => {
  return (value ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const resolveServerPublicUrl = () => {
  if (process.env.SERVER_PUBLIC_URL) {
    return process.env.SERVER_PUBLIC_URL;
  }

  return `http://localhost:${toNumber(process.env.PORT, 4000)}`;
};

export const env = {
  appName: "IXC Chat Realtime",
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: toNumber(process.env.PORT, 4000),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/ixc-chat",
  jwtSecret: process.env.JWT_SECRET ?? "7e4d8c8f5a0c4d0e9c4c6f4a2f9e1b6c3d8a7f5b9e2c1d4a6f8b0c3d5e7f9a1",
  clientOrigins: normalizeOrigins(process.env.CLIENT_ORIGIN),
  clusterEnabled: process.env.CLUSTER_ENABLED === "true",
  clusterWorkers: toNumber(process.env.CLUSTER_WORKERS, 0),
  serverPublicUrl: resolveServerPublicUrl(),
  uploadsRoot: process.env.UPLOADS_DIR
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.resolve(process.cwd(), "uploads")
};

export const isProduction = env.nodeEnv === "production";
