import { NextFunction, Request, Response } from "express";
import passport from "passport";
import { createUser, setUserOffline } from "../services/user.service";
import { createAccessToken } from "../utils/jwt";
import { serializeUser } from "../serializers/user.serializer";
import { getAuthenticatedUser } from "../types/auth";
import { UserDocument } from "../models/User";
import { emitUsersRefresh } from "../sockets/socket-bus";

export const register = async (request: Request, response: Response) => {
  const user = await createUser(request.body);
  emitUsersRefresh();

  response.status(201).json({
    success: true,
    message: "Cadastro realizado com sucesso.",
    data: {
      token: createAccessToken(user),
      user: serializeUser(user)
    }
  });
};

export const login = (request: Request, response: Response, next: NextFunction) => {
  passport.authenticate("local", { session: false }, (error: Error | null, user: Express.User | false, info?: { message?: string }) => {
    if (error) {
      next(error);
      return;
    }

    if (!user) {
      response.status(401).json({
        success: false,
        message: info?.message ?? "Usuário ou senha inválidos."
      });
      return;
    }

    const typedUser = user as UserDocument;

    response.status(200).json({
      success: true,
      message: "Login realizado com sucesso.",
      data: {
        token: createAccessToken(typedUser),
        user: serializeUser(typedUser)
      }
    });
  })(request, response, next);
};

export const me = async (request: Request, response: Response) => {
  response.status(200).json({
    success: true,
    data: serializeUser(getAuthenticatedUser(request))
  });
};

export const logout = async (request: Request, response: Response) => {
  await setUserOffline(getAuthenticatedUser(request).id);
  emitUsersRefresh();

  response.status(200).json({
    success: true,
    message: "Logout realizado com sucesso.",
    data: null
  });
};
