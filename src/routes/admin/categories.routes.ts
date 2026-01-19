import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { getCurrentUser, requireAdmin } from '../../middleware/auth.middleware';
import { Category, ICategory } from '../../models/category.model';
import { CategoryRead } from '../../schemas/category.schema';
import { r2Client } from '../../services/storage.service';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

function toCategoryRead(category: ICategory): CategoryRead {
  return {
    id: category._id.toString(),
    name: category.name,
    description: category.description,
    icon: category.icon,
  };
}

// All admin category routes require admin authentication
router.use(getCurrentUser, requireAdmin);

// POST /admin/categories
router.post('/', upload.single('icon'), async (req: Request, res: Response) => {
  try {
    const { name, description, icon_base64 } = req.body;

    if (!name) {
      return res.status(422).json({ detail: 'Name is required' });
    }

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({ detail: 'Category already exists' });
    }

    let iconUrl: string | null = null;

    // Handle file upload
    if (req.file) {
      const contentType = req.file.mimetype || 'image/jpeg';
      iconUrl = await r2Client.uploadFile(req.file.buffer, req.file.originalname, contentType);
    } else if (icon_base64) {
      // Handle base64 upload
      let encoded = icon_base64;
      let contentType = 'image/jpeg';

      if (icon_base64.includes(',')) {
        const [header, data] = icon_base64.split(',', 2);
        encoded = data;
        if (header.includes('image/')) {
          contentType = header.split(';')[0].split(':')[1];
        }
      }

      const fileContent = Buffer.from(encoded, 'base64');
      iconUrl = await r2Client.uploadFile(fileContent, `category_${name}.jpg`, contentType);
    }

    const category = new Category({
      name,
      description: description || null,
      icon: iconUrl,
    });
    await category.save();

    return res.status(201).json(toCategoryRead(category));
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /admin/categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await Category.find();
    return res.status(200).json(categories.map(toCategoryRead));
  } catch (error) {
    console.error('List categories error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// PUT /admin/categories/:categoryId
router.put('/:categoryId', upload.single('icon'), async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const { name, description, icon_base64 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ detail: 'Invalid category ID' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ detail: 'Category not found' });
    }

    // Update fields if provided
    if (name) category.name = name;
    if (description !== undefined) category.description = description;

    // Handle icon update
    if (req.file) {
      // Delete old icon if exists
      if (category.icon) {
        await r2Client.deleteFile(category.icon);
      }
      const contentType = req.file.mimetype || 'image/jpeg';
      category.icon = await r2Client.uploadFile(
        req.file.buffer,
        req.file.originalname,
        contentType
      );
    } else if (icon_base64) {
      // Delete old icon if exists
      if (category.icon) {
        await r2Client.deleteFile(category.icon);
      }

      let encoded = icon_base64;
      let contentType = 'image/jpeg';

      if (icon_base64.includes(',')) {
        const [header, data] = icon_base64.split(',', 2);
        encoded = data;
        if (header.includes('image/')) {
          contentType = header.split(';')[0].split(':')[1];
        }
      }

      const fileContent = Buffer.from(encoded, 'base64');
      category.icon = await r2Client.uploadFile(
        fileContent,
        `category_${category.name}.jpg`,
        contentType
      );
    }

    await category.save();
    return res.status(200).json(toCategoryRead(category));
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// DELETE /admin/categories/:categoryId
router.delete('/:categoryId', async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ detail: 'Invalid category ID' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ detail: 'Category not found' });
    }

    // Delete icon from R2 if exists
    if (category.icon) {
      await r2Client.deleteFile(category.icon);
    }

    await category.deleteOne();
    return res.status(204).send();
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
