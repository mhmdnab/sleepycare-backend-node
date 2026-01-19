import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string | null;
  icon: string | null;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    icon: { type: String, default: null },
  },
  {
    collection: 'categories',
  }
);

categorySchema.index({ name: 1 }, { unique: true });

export const Category = mongoose.model<ICategory>('Category', categorySchema);
