import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPasswordResetToken extends Document {
  _id: Types.ObjectId;
  user_id: Types.ObjectId;
  token: string;
  expires_at: Date;
  used: boolean;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    expires_at: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  {
    collection: 'password_reset_tokens',
  }
);

passwordResetTokenSchema.index({ token: 1 }, { unique: true });

export const PasswordResetToken = mongoose.model<IPasswordResetToken>(
  'PasswordResetToken',
  passwordResetTokenSchema
);
