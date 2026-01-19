import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getCurrentUser } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { Transaction, ITransaction } from '../models/transaction.model';
import { Order } from '../models/order.model';
import { transactionCreateSchema, TransactionRead } from '../schemas/transaction.schema';

const router = Router();

function toTransactionRead(transaction: ITransaction): TransactionRead {
  return {
    id: transaction._id.toString(),
    order_id: transaction.order_id.toString(),
    user_id: transaction.user_id.toString(),
    amount: transaction.amount,
    payment_method: transaction.payment_method,
    status: transaction.status,
    created_at: transaction.created_at.toISOString(),
  };
}

function ensureUserRole(req: Request, res: Response): boolean {
  if (req.user?.role !== 'user') {
    res.status(403).json({ detail: 'Forbidden' });
    return false;
  }
  return true;
}

// All transaction routes require authentication
router.use(getCurrentUser);

// POST /transactions
router.post('/', validate(transactionCreateSchema), async (req: Request, res: Response) => {
  if (!ensureUserRole(req, res)) return;

  try {
    const { order_id, amount, payment_method, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(order_id)) {
      return res.status(400).json({ detail: 'Invalid order ID' });
    }

    const order = await Order.findById(order_id);
    if (!order || !order.user_id.equals(req.user!._id)) {
      return res.status(404).json({ detail: 'Order not found' });
    }

    const transaction = new Transaction({
      order_id: order._id,
      user_id: req.user!._id,
      amount,
      payment_method,
      status,
    });
    await transaction.save();

    return res.status(201).json(toTransactionRead(transaction));
  } catch (error) {
    console.error('Create transaction error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /transactions
router.get('/', async (req: Request, res: Response) => {
  if (!ensureUserRole(req, res)) return;

  try {
    const transactions = await Transaction.find({ user_id: req.user!._id });
    return res.status(200).json(transactions.map(toTransactionRead));
  } catch (error) {
    console.error('List transactions error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
