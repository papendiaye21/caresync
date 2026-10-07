import "./loadEnv.js";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import passport from "passport";
import { loadEnv } from "./config/env.js";
import { createAuthRouter } from "./routes/auth.js";
import { createPatientsRouter } from "./routes/patients.js";
import { createAppointmentsRouter } from "./routes/appointments.js";
import { createEncountersRouter } from "./routes/encounters.js";
import { createPrescriptionsRouter } from "./routes/prescriptions.js";
import { createClinicRouter } from "./routes/clinic.js";
import { createUploadsRouter } from "./routes/uploads.js";
import { createAiRouter } from "./routes/ai.js";
import { createMapsRouter } from "./routes/maps.js";
import { attachSocket } from "./socket.js";
import { processDueJobs } from "./services/notifications.js";

const env = loadEnv();
const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.WEB_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(passport.initialize());

const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "caresync-api" });
});

app.use("/api", apiLimiter);
app.use("/api/auth", createAuthRouter(env));
app.use("/api/patients", createPatientsRouter(env));
app.use("/api/appointments", createAppointmentsRouter(env));
app.use("/api/encounters", createEncountersRouter(env));
app.use("/api/prescriptions", createPrescriptionsRouter(env));
app.use("/api/clinic", createClinicRouter(env));
app.use("/api/uploads", createUploadsRouter(env));
app.use("/api/ai", createAiRouter(env));
app.use("/api/maps", createMapsRouter(env));

const server = http.createServer(app);
attachSocket(server, env);

setInterval(() => {
  processDueJobs(env).catch((err) =>
    console.error("[notifications] worker error", err)
  );
}, 60_000);

server.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
