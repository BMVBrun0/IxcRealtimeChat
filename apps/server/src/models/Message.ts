import { Schema, model, models, Types } from "mongoose";

export interface IMessage {
  conversationKey: string;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationKey: {
      type: String,
      required: true,
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

messageSchema.index({ conversationKey: 1, createdAt: 1 });

export const Message = models.Message || model<IMessage>("Message", messageSchema);
