import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";
import { Server } from "socket.io";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { configurePassport } from "./config/passport";
import { errorHandler } from "./middlewares/error-handler";
import { apiRouter } from "./routes";
import { registerChatSocket } from "./sockets/register-chat-socket";
import { setSocketServer } from "./sockets/socket-bus";

export const createHttpServer = async () => {
  await connectDatabase();
  configurePassport();

  const app = express();
  const uploadsDirectory = env.uploadsRoot;

  await fs.mkdir(path.join(uploadsDirectory, "avatars"), { recursive: true });

  app.use(
    cors({
      origin: env.clientOrigins,
      credentials: true
    })
  );
  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: "cross-origin"
      }
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));
  app.use(passport.initialize());
  app.use("/uploads", express.static(uploadsDirectory));

  app.use("/api/v1", apiRouter);
  app.use(errorHandler);

  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: env.clientOrigins,
      credentials: true
    }
  });

  setSocketServer(io);
  registerChatSocket(io);

  return {
    app,
    httpServer,
    io
  };
};
