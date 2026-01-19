import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password_hash: string | null;
  role: 'user' | 'admin';
  provider: string;
  provider_user_id: string | null;
  created_at: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password_hash: { type: String, default: null },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    provider: { type: String, default: 'local' },
    provider_user_id: { type: String, default: null },
    created_at: { type: Date, default: Date.now },
  },
  {
    collection: 'users',
  }
);

userSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.model<IUser>('User', userSchema);
