import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Partner, IPartner } from '../models/partner.model';
import { PartnerRead } from '../schemas/partner.schema';

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

// GET /partners
router.get('/', async (req: Request, res: Response) => {
  try {
    const partners = await Partner.find();
    return res.status(200).json(partners.map(toPartnerRead));
  } catch (error) {
    console.error('List partners error:', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
});

// GET /partners/:partnerId
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

export default router;
