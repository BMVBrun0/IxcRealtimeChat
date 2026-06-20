import { connectDatabase } from "../config/database";
import { Message } from "../models/Message";
import { User } from "../models/User";
import { createConversationKey } from "../utils/conversation";
import { createAvatarColor } from "../utils/avatar";

const password = "Demo123!";

const bootstrap = async () => {
  await connectDatabase();

  const users = [
    {
      name: "Cláudia",
      username: "claudia",
      avatarColor: createAvatarColor("claudia")
    },
    {
      name: "Brenda",
      username: "brenda",
      avatarColor: createAvatarColor("brenda")
    },
    {
      name: "Fulano de Tal",
      username: "fulano",
      avatarColor: createAvatarColor("fulano")
    }
  ];

  for (const user of users) {
    const existing = await User.findOne({ username: user.username }).select("+password");

    if (!existing) {
      await User.create({
        ...user,
        password
      });
    }
  }

  const claudia = await User.findOne({ username: "claudia" });
  const fulano = await User.findOne({ username: "fulano" });

  if (claudia && fulano) {
    const conversationKey = createConversationKey(claudia.id, fulano.id);
    const existingMessages = await Message.countDocuments({ conversationKey });

    if (existingMessages === 0) {
      await Message.create([
        {
          conversationKey,
          senderId: claudia._id,
          receiverId: fulano._id,
          content: "Oi... Tudo bem?"
        },
        {
          conversationKey,
          senderId: fulano._id,
          receiverId: claudia._id,
          content: "Sim e você?"
        }
      ]);
    }
  }

  console.log("Seed finalizada.");
  process.exit(0);
};

void bootstrap();
