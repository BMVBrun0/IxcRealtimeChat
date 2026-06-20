import bcrypt from "bcryptjs";
import { HydratedDocument, Schema, model, models } from "mongoose";

export type UserStatus = "online" | "offline";

export interface IUser {
  name: string;
  username: string;
  password: string;
  avatarColor: string;
  avatarUrl: string | null;
  status: UserStatus;
  lastSeen: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      unique: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    avatarColor: {
      type: String,
      required: true
    },
    avatarUrl: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline"
    },
    lastSeen: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

userSchema.pre("save", async function savePassword(next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

export type UserDocument = HydratedDocument<IUser>;

export const User = models.User || model<IUser>("User", userSchema);
