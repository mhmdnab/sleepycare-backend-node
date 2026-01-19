import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  order_id: Types.ObjectId;
  user_id: Types.ObjectId;
  amount: number;
  payment_method: string;
  status: string;
  created_at: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    payment_method: { type: String, required: true },
    status: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
  },
  {
    collection: 'transactions',
  }
);

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
