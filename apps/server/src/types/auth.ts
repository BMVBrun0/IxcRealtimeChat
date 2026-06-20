import { Request } from "express";
import { UserDocument } from "../models/User";

declare global {
  namespace Express {
    interface User extends UserDocument {}

    interface Request {
      user?: UserDocument;
    }
  }
}

export const getAuthenticatedUser = (request: Request): UserDocument => {
  if (!request.user) {
    throw new Error("Authenticated user is not available on request.");
  }

  return request.user;
};
