import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getCurrentUser, requireAdmin } from '../../middleware/auth.middleware';
import { User, IUser } from '../../models/user.model';
import { Order } from '../../models/order.model';
import { UserRead } from '../../schemas/user.schema';

const router = Router();

function toUserRead(user: IUser): UserRead {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    provider: user.provider,
    created_at: user.created_at.toISOString(),
  };
}

// All admin user routes require admin authentication
router.use(getCurrentUser, requireAdmin);

// GET /admin/users
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    return res.status(200).json(users.map(toUserRead));
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /admin/users/:userId
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ detail: 'Invalid user ID' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }

    return res.status(200).json(toUserRead(user));
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /admin/users/:userId/orders-count
router.get('/:userId/orders-count', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ detail: 'Invalid user ID' });
    }

    const count = await Order.countDocuments({ user_id: new mongoose.Types.ObjectId(userId) });
    return res.status(200).json({ user_id: userId, orders_count: count });
  } catch (error) {
    console.error('Get user orders count error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
