import { Request, Response } from "express";
import { getAuthenticatedUser } from "../types/auth";
import { buildUserList, updateUserAvatar } from "../services/user.service";
import { serializeUser } from "../serializers/user.serializer";

export const listUsers = async (request: Request, response: Response) => {
  const users = await buildUserList(getAuthenticatedUser(request));

  response.status(200).json({
    success: true,
    data: users
  });
};

export const updateProfileAvatarController = async (request: Request, response: Response) => {
  if (!request.file) {
    response.status(400).json({
      success: false,
      message: "Selecione uma imagem para atualizar a foto de perfil."
    });
    return;
  }

  const user = await updateUserAvatar(getAuthenticatedUser(request), request.file);

  response.status(200).json({
    success: true,
    message: "Foto de perfil atualizada com sucesso.",
    data: serializeUser(user)
  });
};
