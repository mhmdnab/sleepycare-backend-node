import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  category_id: Types.ObjectId | null;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    image_url: { type: String, default: null },
    category_id: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  },
  {
    collection: 'products',
  }
);

productSchema.index({ name: 1 }, { unique: true });

export const Product = mongoose.model<IProduct>('Product', productSchema);
