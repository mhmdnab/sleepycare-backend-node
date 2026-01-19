import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICart extends Document {
  _id: Types.ObjectId;
  user_id: Types.ObjectId;
  product_id: Types.ObjectId;
  quantity: number;
}

const cartSchema = new Schema<ICart>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  {
    collection: 'carts',
  }
);

cartSchema.index({ user_id: 1 });

export const Cart = mongoose.model<ICart>('Cart', cartSchema);
