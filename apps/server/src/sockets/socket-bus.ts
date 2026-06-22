import { Server } from "socket.io";

let ioInstance: Server | null = null;

export const setSocketServer = (io: Server) => {
  ioInstance = io;
};

export const getSocketServer = () => ioInstance;

export const emitUsersRefresh = () => {
  ioInstance?.emit("users:refresh");
};
