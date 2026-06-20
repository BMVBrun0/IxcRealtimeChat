import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UserDocument } from "../models/User";

export interface AccessTokenPayload {
  sub: string;
  username: string;
}

export const createAccessToken = (user: UserDocument) => {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username
    },
    env.jwtSecret,
    {
      expiresIn: "7d"
    }
  );
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.jwtSecret) as AccessTokenPayload;
};
