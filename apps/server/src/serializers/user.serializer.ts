import { env } from "../config/env";
import { UserDocument } from "../models/User";

const normalizeAvatarUrl = (value: string | null) => {
  if (!value) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${env.serverPublicUrl}${value}`;
};

export const serializeUser = (user: UserDocument) => {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    avatarColor: user.avatarColor,
    avatarUrl: normalizeAvatarUrl(user.avatarUrl),
    status: user.status,
    lastSeen: user.lastSeen
  };
};
