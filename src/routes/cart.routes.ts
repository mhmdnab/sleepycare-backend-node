import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getCurrentUser } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { Cart, ICart } from '../models/cart.model';
import { Product } from '../models/product.model';
import { cartItemCreateSchema, cartItemUpdateSchema, CartItemRead } from '../schemas/cart.schema';

const router = Router();

function toCartRead(cart: ICart): CartItemRead {
  return {
    id: cart._id.toString(),
    user_id: cart.user_id.toString(),
    product_id: cart.product_id.toString(),
    quantity: cart.quantity,
  };
}

function ensureUserRole(req: Request, res: Response): boolean {
  if (req.user?.role !== 'user') {
    res.status(403).json({ detail: 'Forbidden' });
    return false;
  }
  return true;
}

// All cart routes require authentication
router.use(getCurrentUser);

// GET /cart
router.get('/', async (req: Request, res: Response) => {
  if (!ensureUserRole(req, res)) return;

  try {
    const items = await Cart.find({ user_id: req.user!._id });
    return res.status(200).json(items.map(toCartRead));
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /cart
router.post('/', validate(cartItemCreateSchema), async (req: Request, res: Response) => {
  if (!ensureUserRole(req, res)) return;

  try {
    const { product_id, quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(product_id)) {
      return res.status(400).json({ detail: 'Invalid product ID' });
    }

    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ detail: 'Product not found' });
    }

    // Check if item already exists in cart
    const existing = await Cart.findOne({
      user_id: req.user!._id,
      product_id: product._id,
    });

    if (existing) {
      existing.quantity += quantity;
      await existing.save();
      return res.status(201).json(toCartRead(existing));
    }

    const cartItem = new Cart({
      user_id: req.user!._id,
      product_id: product._id,
      quantity,
    });
    await cartItem.save();

    return res.status(201).json(toCartRead(cartItem));
  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// PUT /cart/:cartItemId
router.put('/:cartItemId', validate(cartItemUpdateSchema), async (req: Request, res: Response) => {
  if (!ensureUserRole(req, res)) return;

  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(cartItemId)) {
      return res.status(400).json({ detail: 'Invalid cart item ID' });
    }

    const cartItem = await Cart.findById(cartItemId);
    if (!cartItem || !cartItem.user_id.equals(req.user!._id)) {
      return res.status(404).json({ detail: 'Cart item not found' });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    return res.status(200).json(toCartRead(cartItem));
  } catch (error) {
    console.error('Update cart item error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// DELETE /cart/:cartItemId
router.delete('/:cartItemId', async (req: Request, res: Response) => {
  if (!ensureUserRole(req, res)) return;

  try {
    const { cartItemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(cartItemId)) {
      return res.status(400).json({ detail: 'Invalid cart item ID' });
    }

    const cartItem = await Cart.findById(cartItemId);
    if (!cartItem || !cartItem.user_id.equals(req.user!._id)) {
      return res.status(404).json({ detail: 'Cart item not found' });
    }

    await cartItem.deleteOne();

    return res.status(204).send();
  } catch (error) {
    console.error('Delete cart item error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
