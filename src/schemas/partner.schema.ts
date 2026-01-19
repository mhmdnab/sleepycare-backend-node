import { z } from 'zod';

export const partnerCreateSchema = z.object({
  name: z.string().min(1),
  icon: z.string().min(1),
});

export const partnerUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().min(1).optional(),
});

export type PartnerCreate = z.infer<typeof partnerCreateSchema>;
export type PartnerUpdate = z.infer<typeof partnerUpdateSchema>;

export interface PartnerRead {
  id: string;
  name: string;
  icon: string;
  created_at: string;
  updated_at: string;
}
