import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOrderItem {
  product_id: Types.ObjectId;
  quantity: number;
  unit_price: number;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  user_id: Types.ObjectId;
  status: string;
  total_amount: number;
  created_at: Date;
  items: IOrderItem[];
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, default: 'pending' },
    total_amount: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    items: { type: [orderItemSchema], default: [] },
  },
  {
    collection: 'orders',
  }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
