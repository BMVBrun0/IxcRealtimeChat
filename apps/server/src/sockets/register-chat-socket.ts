import { Server } from "socket.io";
import { User, UserDocument } from "../models/User";
import { serializeUser } from "../serializers/user.serializer";
import { createConversationMessage } from "../services/message.service";
import { setUserOffline, setUserOnline } from "../services/user.service";
import { verifyAccessToken } from "../utils/jwt";
import { sendMessageSchema } from "../validations/message.validation";

const getUserRoom = (userId: string) => `user:${userId}`;

const emitPresence = (io: Server, userId: string, status: "online" | "offline", lastSeen: Date | null) => {
  io.emit("presence:update", {
    userId,
    status,
    lastSeen
  });
};

export const registerChatSocket = (io: Server) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (typeof token !== "string" || token.length === 0) {
        next(new Error("Não autorizado."));
        return;
      }

      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub);
      if (!user) {
        next(new Error("Não autorizado."));
        return;
      }

      socket.data.user = user;
      next();
    } catch {
      next(new Error("Não autorizado."));
    }
  });

  io.on("connection", async (socket) => {
    const currentUser = socket.data.user as UserDocument;
    const currentUserRoom = getUserRoom(currentUser.id);

    socket.join(currentUserRoom);
    await setUserOnline(currentUser.id);
    emitPresence(io, currentUser.id, "online", currentUser.lastSeen);

    socket.on("chat:send", async (payload, acknowledge) => {
      const result = sendMessageSchema.safeParse(payload);

      if (!result.success) {
        acknowledge?.({
          success: false,
          message: result.error.issues[0]?.message ?? "Mensagem inválida."
        });
        return;
      }

      const receiver = await User.findById(result.data.receiverId);
      if (!receiver) {
        acknowledge?.({
          success: false,
          message: "Usuário de destino não encontrado."
        });
        return;
      }

      const message = await createConversationMessage({
        sender: currentUser,
        receiver,
        content: result.data.content
      });

      io.to(getUserRoom(currentUser.id)).to(getUserRoom(receiver.id)).emit("chat:message", message);

      acknowledge?.({
        success: true,
        data: message
      });
    });

    socket.on("disconnect", async () => {
      const remainingSockets = await io.in(currentUserRoom).fetchSockets();

      if (remainingSockets.length === 0) {
        await setUserOffline(currentUser.id);
        emitPresence(io, currentUser.id, "offline", new Date());
      }
    });
  });
};
