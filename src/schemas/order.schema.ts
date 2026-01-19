import { z } from 'zod';

export const orderItemInSchema = z.object({
  product_id: z.string(),
  quantity: z.number().int().min(1),
  unit_price: z.number().min(0),
});

export const orderCreateSchema = z.object({
  items: z.array(orderItemInSchema),
});

export const orderUpdateStatusSchema = z.object({
  status: z.string(),
});

export type OrderItemIn = z.infer<typeof orderItemInSchema>;
export type OrderCreate = z.infer<typeof orderCreateSchema>;
export type OrderUpdateStatus = z.infer<typeof orderUpdateStatusSchema>;

export interface OrderItemOut {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface OrderRead {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  items: OrderItemOut[];
}
