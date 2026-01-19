import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getCurrentUser, requireAdmin } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Partner, IPartner } from '../../models/partner.model';
import { partnerCreateSchema, partnerUpdateSchema, PartnerRead } from '../../schemas/partner.schema';

const router = Router();

function toPartnerRead(partner: IPartner): PartnerRead {
  return {
    id: partner._id.toString(),
    name: partner.name,
    icon: partner.icon,
    created_at: partner.created_at.toISOString(),
    updated_at: partner.updated_at.toISOString(),
  };
}

// All admin partner routes require admin authentication
router.use(getCurrentUser, requireAdmin);

// GET /admin/partners
router.get('/', async (req: Request, res: Response) => {
  try {
    const partners = await Partner.find();
    return res.status(200).json(partners.map(toPartnerRead));
  } catch (error) {
    console.error('List partners error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /admin/partners/:partnerId
router.get('/:partnerId', async (req: Request, res: Response) => {
  try {
    const { partnerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      return res.status(400).json({ detail: 'Invalid partner ID' });
    }

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ detail: 'Partner not found' });
    }

    return res.status(200).json(toPartnerRead(partner));
  } catch (error) {
    console.error('Get partner error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// POST /admin/partners
router.post('/', validate(partnerCreateSchema), async (req: Request, res: Response) => {
  try {
    const { name, icon } = req.body;

    const partner = new Partner({
      name,
      icon,
      created_at: new Date(),
      updated_at: new Date(),
    });
    await partner.save();

    return res.status(201).json(toPartnerRead(partner));
  } catch (error) {
    console.error('Create partner error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// PUT /admin/partners/:partnerId
router.put(
  '/:partnerId',
  validate(partnerUpdateSchema),
  async (req: Request, res: Response) => {
    try {
      const { partnerId } = req.params;
      const { name, icon } = req.body;

      if (!mongoose.Types.ObjectId.isValid(partnerId)) {
        return res.status(400).json({ detail: 'Invalid partner ID' });
      }

      const partner = await Partner.findById(partnerId);
      if (!partner) {
        return res.status(404).json({ detail: 'Partner not found' });
      }

      if (name !== undefined) partner.name = name;
      if (icon !== undefined) partner.icon = icon;
      partner.updated_at = new Date();

      await partner.save();
      return res.status(200).json(toPartnerRead(partner));
    } catch (error) {
      console.error('Update partner error:', error);
      return res.status(500).json({ detail: 'Internal server error' });
    }
  }
);

// DELETE /admin/partners/:partnerId
router.delete('/:partnerId', async (req: Request, res: Response) => {
  try {
    const { partnerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      return res.status(400).json({ detail: 'Invalid partner ID' });
    }

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ detail: 'Partner not found' });
    }

    await partner.deleteOne();
    return res.status(204).send();
  } catch (error) {
    console.error('Delete partner error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
