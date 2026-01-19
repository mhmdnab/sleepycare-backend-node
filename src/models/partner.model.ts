import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPartner extends Document {
  _id: Types.ObjectId;
  name: string;
  icon: string;
  created_at: Date;
  updated_at: Date;
}

const partnerSchema = new Schema<IPartner>(
  {
    name: { type: String, required: true },
    icon: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    collection: 'partners',
  }
);

export const Partner = mongoose.model<IPartner>('Partner', partnerSchema);
