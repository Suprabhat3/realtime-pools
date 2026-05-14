import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "./auth-api";

let socket: Socket | null = null;

export const getRealtimeSocket = (): Socket => {
  if (!socket) {
    socket = io(API_BASE_URL, {
      transports: ["websocket"],
      withCredentials: true
    });
  }

  return socket;
};
