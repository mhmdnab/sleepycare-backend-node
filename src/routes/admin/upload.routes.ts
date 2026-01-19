import { Router, Request, Response } from 'express';
import multer from 'multer';
import { getCurrentUser, requireAdmin } from '../../middleware/auth.middleware';
import { r2Client } from '../../services/storage.service';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All admin upload routes require admin authentication
router.use(getCurrentUser, requireAdmin);

// POST /admin/upload/presigned-url
router.post('/presigned-url', async (req: Request, res: Response) => {
  try {
    const { filename, content_type } = req.body;

    if (!filename) {
      return res.status(422).json({ detail: 'Filename is required' });
    }

    const contentType = content_type || 'image/jpeg';
    const result = await r2Client.generatePresignedUrl(filename, contentType);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Generate presigned URL error:', error);
    return res.status(500).json({ detail: error.message || 'Internal server error' });
  }
});

// POST /admin/upload/image
router.post('/image', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(422).json({ detail: 'File is required' });
    }

    const contentType = req.file.mimetype || 'image/jpeg';
    const fileUrl = await r2Client.uploadFile(
      req.file.buffer,
      req.file.originalname || 'image.jpg',
      contentType
    );

    return res.status(200).json({ file_url: fileUrl });
  } catch (error: any) {
    console.error('Upload image error:', error);
    return res.status(500).json({ detail: `Failed to upload image: ${error.message}` });
  }
});

export default router;
