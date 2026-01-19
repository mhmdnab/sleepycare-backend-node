import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getCurrentUser, requireAdmin } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Order } from '../../models/order.model';
import { orderUpdateStatusSchema } from '../../schemas/order.schema';
import { toOrderRead } from '../orders.routes';

const router = Router();

// All admin order routes require admin authentication
router.use(getCurrentUser, requireAdmin);

// GET /admin/orders
router.get('/', async (req: Request, res: Response) => {
  try {
    const orders = await Order.find();
    return res.status(200).json(orders.map(toOrderRead));
  } catch (error) {
    console.error('List orders error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// PUT /admin/orders/:orderId
router.put(
  '/:orderId',
  validate(orderUpdateStatusSchema),
  async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ detail: 'Invalid order ID' });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ detail: 'Order not found' });
      }

      order.status = status;
      await order.save();

      return res.status(200).json(toOrderRead(order));
    } catch (error) {
      console.error('Update order status error:', error);
      return res.status(500).json({ detail: 'Internal server error' });
    }
  }
);

export default router;
