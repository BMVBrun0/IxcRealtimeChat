import { io } from "socket.io-client";
import { SOCKET_BASE_URL } from "./constants";

export const createChatSocket = (token: string) => {
  return io(SOCKET_BASE_URL, {
    transports: ["websocket", "polling"],
    auth: {
      token
    }
  });
};
