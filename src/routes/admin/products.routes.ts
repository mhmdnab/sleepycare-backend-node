import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { getCurrentUser, requireAdmin } from '../../middleware/auth.middleware';
import { Product, IProduct } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { ProductRead } from '../../schemas/product.schema';
import { r2Client } from '../../services/storage.service';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

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

// All admin product routes require admin authentication
router.use(getCurrentUser, requireAdmin);

// POST /admin/products
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, category_id, image_base64, image_url } = req.body;

    // Validate required fields (FormData sends strings, so check for empty strings too)
    if (!name || !price || !stock) {
      return res.status(422).json({ detail: 'Missing required fields: name, price, and stock are required' });
    }

    if (category_id && mongoose.Types.ObjectId.isValid(category_id)) {
      const category = await Category.findById(category_id);
      if (!category) {
        return res.status(400).json({ detail: 'Invalid category' });
      }
    }

    let imageUrl: string | null = null;

    // Handle file upload
    if (req.file) {
      const contentType = req.file.mimetype || 'image/jpeg';
      imageUrl = await r2Client.uploadFile(req.file.buffer, req.file.originalname, contentType);
    } else if (image_base64) {
      // Handle base64 upload
      let encoded = image_base64;
      let contentType = 'image/jpeg';

      if (image_base64.includes(',')) {
        const [header, data] = image_base64.split(',', 2);
        encoded = data;
        if (header.includes('image/')) {
          contentType = header.split(';')[0].split(':')[1];
        }
      }

      const fileContent = Buffer.from(encoded, 'base64');
      imageUrl = await r2Client.uploadFile(fileContent, `product_${name}.jpg`, contentType);
    } else if (image_url) {
      // Handle direct image URL (e.g., from presigned upload)
      imageUrl = image_url;
    }

    const product = new Product({
      name,
      description: description || null,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      image_url: imageUrl,
      category_id: category_id ? new mongoose.Types.ObjectId(category_id) : null,
    });
    await product.save();

    return res.status(201).json(toProductRead(product));
  } catch (error: any) {
    console.error('Create product error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ detail: 'Product with this name already exists' });
    }
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /admin/products
router.get('/', async (req: Request, res: Response) => {
  try {
    const products = await Product.find();
    return res.status(200).json(products.map(toProductRead));
  } catch (error) {
    console.error('List products error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /admin/products/category/:categoryId
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

// PUT /admin/products/:productId
router.put('/:productId', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { name, description, price, stock, category_id, image_base64, image_url } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ detail: 'Invalid product ID' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ detail: 'Product not found !' });
    }

    // Update fields if provided (check for non-empty strings from FormData)
    if (name) product.name = name;
    if (description !== undefined) product.description = description || null;
    if (price) product.price = parseFloat(price);
    if (stock) product.stock = parseInt(stock, 10);
    if (category_id) {
      product.category_id = new mongoose.Types.ObjectId(category_id);
    }

    // Handle image update
    if (req.file) {
      // Delete old image if exists
      if (product.image_url) {
        await r2Client.deleteFile(product.image_url);
      }
      const contentType = req.file.mimetype || 'image/jpeg';
      product.image_url = await r2Client.uploadFile(
        req.file.buffer,
        req.file.originalname,
        contentType
      );
    } else if (image_base64) {
      // Delete old image if exists
      if (product.image_url) {
        await r2Client.deleteFile(product.image_url);
      }

      let encoded = image_base64;
      let contentType = 'image/jpeg';

      if (image_base64.includes(',')) {
        const [header, data] = image_base64.split(',', 2);
        encoded = data;
        if (header.includes('image/')) {
          contentType = header.split(';')[0].split(':')[1];
        }
      }

      const fileContent = Buffer.from(encoded, 'base64');
      product.image_url = await r2Client.uploadFile(
        fileContent,
        `product_${product.name}.jpg`,
        contentType
      );
    } else if (image_url) {
      // Handle direct image URL (e.g., from presigned upload)
      if (product.image_url && product.image_url !== image_url) {
        await r2Client.deleteFile(product.image_url);
      }
      product.image_url = image_url;
    }

    await product.save();
    return res.status(200).json(toProductRead(product));
  } catch (error: any) {
    console.error('Update product error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ detail: 'Product with this name already exists' });
    }
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// DELETE /admin/products/:productId
router.delete('/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ detail: 'Invalid product ID' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ detail: 'Product not found' });
    }

    await product.deleteOne();
    return res.status(204).send();
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
