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

httpServer.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
