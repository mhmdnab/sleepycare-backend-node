import { Router, Request, Response } from 'express';
import { Category, ICategory } from '../models/category.model';
import { CategoryRead } from '../schemas/category.schema';

const router = Router();

function toCategoryRead(category: ICategory): CategoryRead {
  return {
    id: category._id.toString(),
    name: category.name,
    description: category.description,
    icon: category.icon,
  };
}

// GET /categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await Category.find();
    return res.status(200).json(categories.map(toCategoryRead));
  } catch (error) {
    console.error('List categories error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
