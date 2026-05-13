import dotenv from "dotenv";
import { createServer } from "node:http";
import { Server } from "socket.io";

dotenv.config();

import { createApp } from "./app";
import { allowedOrigins, env } from "./config/env";
import { setSocketServer } from "./modules/realtime/socket";

const app = createApp();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

setSocketServer(io);

io.on("connection", (socket) => {
  socket.on("poll:join-owner", ({ pollId }: { pollId: string }) => {
    socket.join(`poll:${pollId}:owner`);
  });

  socket.on("poll:leave-owner", ({ pollId }: { pollId: string }) => {
    socket.leave(`poll:${pollId}:owner`);
  });
});

const server = httpServer.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});

// ── Graceful shutdown ──────────────────────────────────────────────────────
// On Windows, Ctrl+C in PowerShell kills the shell but orphans child Node
// processes which keep holding the port. Catching SIGINT here and calling
// server.close() + process.exit() ensures the TCP socket is released before
// the process exits, so the port is immediately available on restart.

const shutdown = (signal: string) => {
  console.log(`\n[${signal}] Shutting down gracefully…`);

  // Close all keep-alive connections immediately (Node 18.2+)
  if (typeof (server as any).closeAllConnections === "function") {
    (server as any).closeAllConnections();
  }

  server.close(() => {
    console.log("HTTP server closed. Port released.");
    process.exit(0);
  });

  // Force-exit after 3 s if something hangs
  setTimeout(() => {
    console.error("Forced exit after timeout.");
    process.exit(1);
  }, 3000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
