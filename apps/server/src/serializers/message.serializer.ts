type SerializableUser = {
  id: string;
  name: string;
  username: string;
  avatarColor: string;
  status: string;
  lastSeen: Date | null;
};

type SerializableMessage = {
  id: string;
  content: string;
  createdAt: Date;
  sender: SerializableUser;
  receiver: SerializableUser;
};

export const serializeMessage = (
  message: {
    id: string;
    content: string;
    createdAt: Date;
  },
  sender: SerializableUser,
  receiver: SerializableUser
): SerializableMessage => {
  return {
    id: message.id,
    content: message.content,
    createdAt: message.createdAt,
    sender,
    receiver
  };
};
