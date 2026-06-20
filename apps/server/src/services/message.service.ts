import { Types } from "mongoose";
import { Message } from "../models/Message";
import { UserDocument } from "../models/User";
import { serializeMessage } from "../serializers/message.serializer";
import { serializeUser } from "../serializers/user.serializer";
import { createConversationKey } from "../utils/conversation";

export const getConversationMessages = async (currentUser: UserDocument, otherUserId: string) => {
  const conversationKey = createConversationKey(currentUser.id, otherUserId);

  const messages = await Message.find({
    conversationKey
  })
    .sort({ createdAt: 1 })
    .populate("senderId")
    .populate("receiverId")
    .limit(200);

  return messages.map((message) =>
    serializeMessage(
      {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt
      },
      serializeUser(message.senderId as unknown as UserDocument),
      serializeUser(message.receiverId as unknown as UserDocument)
    )
  );
};

export const createConversationMessage = async (payload: {
  sender: UserDocument;
  receiver: UserDocument;
  content: string;
}) => {
  const created = await Message.create({
    conversationKey: createConversationKey(payload.sender.id, payload.receiver.id),
    senderId: new Types.ObjectId(payload.sender.id),
    receiverId: new Types.ObjectId(payload.receiver.id),
    content: payload.content.trim()
  });

  return serializeMessage(
    {
      id: created.id,
      content: created.content,
      createdAt: created.createdAt
    },
    serializeUser(payload.sender),
    serializeUser(payload.receiver)
  );
};
