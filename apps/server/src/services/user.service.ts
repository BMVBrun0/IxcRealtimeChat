import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { env } from "../config/env";
import { Message } from "../models/Message";
import { User, UserDocument } from "../models/User";
import { serializeUser } from "../serializers/user.serializer";
import { createAvatarColor } from "../utils/avatar";
import { createConversationKey } from "../utils/conversation";

const avatarsDirectory = path.join(env.uploadsRoot, "avatars");

const buildAvatarRelativePath = (filename: string) => `/uploads/avatars/${filename}`;

const ensureAvatarDirectory = async () => {
  await fs.mkdir(avatarsDirectory, { recursive: true });
};

const isManagedAvatar = (value: string | null) => {
  return Boolean(value?.startsWith("/uploads/avatars/"));
};

export const createUser = async (payload: {
  name: string;
  username: string;
  password: string;
}) => {
  const normalizedUsername = payload.username.toLowerCase();
  const existingUser = await User.exists({ username: normalizedUsername });

  if (existingUser) {
    const error = new Error("Este nome de usuário já está em uso.") as Error & { statusCode?: number };
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    ...payload,
    username: normalizedUsername,
    avatarColor: createAvatarColor(payload.username),
    avatarUrl: null
  });

  return user;
};

export const getUserById = async (userId: string) => {
  return User.findById(userId);
};

export const setUserOnline = async (userId: string) => {
  await User.findByIdAndUpdate(userId, {
    status: "online"
  });
};

export const setUserOffline = async (userId: string) => {
  await User.findByIdAndUpdate(userId, {
    status: "offline",
    lastSeen: new Date()
  });
};

export const buildUserList = async (currentUser: UserDocument) => {
  const users = await User.find({ _id: { $ne: currentUser.id } });

  const enriched = await Promise.all(
    users.map(async (user) => {
      const conversationKey = createConversationKey(currentUser.id, user.id);
      const latestMessage = await Message.findOne({
        conversationKey
      }).sort({ createdAt: -1 });

      const unreadQuery: {
        conversationKey: string;
        receiverId: string;
        senderId: string;
        createdAt?: { $gt: Date };
      } = {
        conversationKey,
        receiverId: currentUser.id,
        senderId: user.id
      };

      if (currentUser.lastSeen) {
        unreadQuery.createdAt = { $gt: currentUser.lastSeen };
      }

      const unreadCount = await Message.countDocuments(unreadQuery);

      return {
        ...serializeUser(user),
        lastMessageSnippet: latestMessage?.content ?? "Disponível para conversar",
        lastMessageAt: latestMessage?.createdAt ?? null,
        unreadCount
      };
    })
  );

  return enriched.sort((left, right) => {
    const leftTime = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0;
    const rightTime = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0;

    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    if (left.status !== right.status) {
      return left.status === "online" ? -1 : 1;
    }

    return left.name.localeCompare(right.name, "pt-BR");
  });
};

export const updateUserAvatar = async (user: UserDocument, file: Express.Multer.File) => {
  await ensureAvatarDirectory();

  const filename = `user-${user.id}-${Date.now()}.webp`;
  const outputPath = path.join(avatarsDirectory, filename);
  const relativePath = buildAvatarRelativePath(filename);

  await sharp(file.buffer)
    .rotate()
    .resize(1920, 1920, {
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({
      quality: 76,
      effort: 4
    })
    .toFile(outputPath);

  if (isManagedAvatar(user.avatarUrl)) {
    const currentPath = path.join(env.uploadsRoot, user.avatarUrl!.replace(/^\/uploads\//, ""));
    await fs.unlink(currentPath).catch(() => undefined);
  }

  user.avatarUrl = relativePath;
  await user.save();

  return user;
};
