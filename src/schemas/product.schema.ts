import { z } from 'zod';

export const productCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  price: z.number().min(0),
  stock: z.number().int().min(0),
  image_url: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
});

export const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  image_url: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
});

export type ProductCreate = z.infer<typeof productCreateSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;

export interface ProductRead {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  category_id: string | null;
}
