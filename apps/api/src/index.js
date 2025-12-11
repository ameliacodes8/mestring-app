import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { authMiddleware } from "./middleware/auth.js";
import choresRouter from "./routes/chores.js";
import goalsRouter from "./routes/goals.js";
import choreTemplatesRouter from "./routes/choreTemplates.js";
import choreInstancesRouter from "./routes/choreInstances.js";

const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// Protected routes (require Supabase JWT)
app.use(authMiddleware);
app.use("/chores", choresRouter);
app.use("/goals", goalsRouter);
app.use("/chore-templates", choreTemplatesRouter);
app.use("/chore-instances", choreInstancesRouter);

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  socket.on("join-family", (familyId) => {
    socket.join(`family:${familyId}`);
  });
});

export function emitFamily(io, familyId, event, payload) {
  io.to(`family:${familyId}`).emit(event, payload);
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () =>
  console.log(`API listening on http://localhost:${PORT}`)
);
