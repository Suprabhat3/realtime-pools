import type { Server } from "socket.io";

let io: Server | null = null;

export const setSocketServer = (instance: Server) => {
  io = instance;
};

export const getSocketServer = (): Server => {
  if (!io) {
    throw new Error("Socket server is not initialized");
  }

  return io;
};
