import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getCurrentUser } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { Order, IOrder, IOrderItem } from '../models/order.model';
import { Product } from '../models/product.model';
import { orderCreateSchema, OrderRead, OrderItemOut } from '../schemas/order.schema';

const router = Router();

export function toOrderRead(order: IOrder): OrderRead {
  return {
    id: order._id.toString(),
    user_id: order.user_id.toString(),
    status: order.status,
    total_amount: order.total_amount,
    created_at: order.created_at.toISOString(),
    items: order.items.map((item: IOrderItem): OrderItemOut => ({
      product_id: item.product_id.toString(),
      quantity: item.quantity,
      unit_price: item.unit_price,
    })),
  };
}

function ensureUserRole(req: Request, res: Response): boolean {
  if (req.user?.role !== 'user') {
    res.status(403).json({ detail: 'Forbidden' });
    return false;
  }
  return true;
}

// All order routes require authentication
router.use(getCurrentUser);

// POST /orders
router.post('/', validate(orderCreateSchema), async (req: Request, res: Response) => {
  if (!ensureUserRole(req, res)) return;

  try {
    const { items } = req.body;
    const orderItems: IOrderItem[] = [];
    let total = 0;

    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.product_id)) {
        return res.status(400).json({ detail: `Invalid product ID: ${item.product_id}` });
      }

      const product = await Product.findById(item.product_id);
      if (!product) {
        return res.status(404).json({ detail: `Product ${item.product_id} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ detail: `Insufficient stock for ${product.name}` });
      }

      // Decrement stock
      product.stock -= item.quantity;
      await product.save();

      orderItems.push({
        product_id: product._id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      });

      total += item.quantity * item.unit_price;
    }

    const order = new Order({
      user_id: req.user!._id,
      items: orderItems,
      total_amount: total,
    });
    await order.save();

    return res.status(201).json(toOrderRead(order));
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /orders
router.get('/', async (req: Request, res: Response) => {
  if (!ensureUserRole(req, res)) return;

  try {
    const orders = await Order.find({ user_id: req.user!._id });
    return res.status(200).json(orders.map(toOrderRead));
  } catch (error) {
    console.error('List orders error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
