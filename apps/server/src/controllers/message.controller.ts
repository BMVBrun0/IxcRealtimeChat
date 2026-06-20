import { Request, Response } from "express";
import { getAuthenticatedUser } from "../types/auth";
import { getConversationMessages } from "../services/message.service";

export const getMessages = async (request: Request, response: Response) => {
  const messages = await getConversationMessages(getAuthenticatedUser(request), request.params.userId);

  response.status(200).json({
    success: true,
    data: messages
  });
};
