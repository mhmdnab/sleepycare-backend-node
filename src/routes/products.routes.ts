import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product, IProduct } from '../models/product.model';
import { ProductRead } from '../schemas/product.schema';

const router = Router();

function toProductRead(product: IProduct): ProductRead {
  return {
    id: product._id.toString(),
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    image_url: product.image_url,
    category_id: product.category_id ? product.category_id.toString() : null,
  };
}

// GET /products
router.get('/', async (req: Request, res: Response) => {
  try {
    const products = await Product.find();
    return res.status(200).json(products.map(toProductRead));
  } catch (error) {
    console.error('List products error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /products/category/:categoryId
router.get('/category/:categoryId', async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ detail: 'Invalid category ID' });
    }
    const products = await Product.find({ category_id: new mongoose.Types.ObjectId(categoryId) });
    return res.status(200).json(products.map(toProductRead));
  } catch (error) {
    console.error('List products by category error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /products/:productId
router.get('/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ detail: 'Invalid product ID' });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ detail: 'Product not found' });
    }
    return res.status(200).json(toProductRead(product));
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
