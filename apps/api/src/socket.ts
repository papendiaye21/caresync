import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import type { Env } from "./config/env.js";
import { verifyAccessToken } from "./services/jwt.js";

/**
 * Socket.io rooms (Phase 2+ chat):
 * - `clinic:{clinicId}` — clinic-wide broadcasts (alerts, schedules).
 * - `user:{userId}` — direct user channel for notifications.
 *
 * Handshake: client passes `auth: { token: "<JWT access token>" }`.
 */
export function attachSocket(httpServer: HttpServer, env: Env): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.WEB_ORIGIN,
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const raw = socket.handshake.auth;
    const token =
      typeof raw === "object" &&
      raw !== null &&
      "token" in raw &&
      typeof (raw as { token?: unknown }).token === "string"
        ? (raw as { token: string }).token
        : null;
    if (!token) {
      next(new Error("Unauthorized"));
      return;
    }
    try {
      const payload = verifyAccessToken(env, token);
      socket.data.auth = payload;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const auth = socket.data.auth as ReturnType<typeof verifyAccessToken>;
    if (!auth) {
      socket.disconnect(true);
      return;
    }
    socket.join(`clinic:${auth.clinicId}`);
    socket.join(`user:${auth.sub}`);
    socket.emit("ready", { clinicId: auth.clinicId });
  });

  return io;
}
