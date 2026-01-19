import { Router } from 'express';

import authRoutes from './auth.routes';
import productsRoutes from './products.routes';
import categoriesRoutes from './categories.routes';
import partnersRoutes from './partners.routes';
import cartRoutes from './cart.routes';
import ordersRoutes from './orders.routes';
import transactionsRoutes from './transactions.routes';

import adminProductsRoutes from './admin/products.routes';
import adminCategoriesRoutes from './admin/categories.routes';
import adminOrdersRoutes from './admin/orders.routes';
import adminUsersRoutes from './admin/users.routes';
import adminPartnersRoutes from './admin/partners.routes';
import adminUploadRoutes from './admin/upload.routes';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// Admin routes
router.use('/admin/categories', adminCategoriesRoutes);
router.use('/admin/products', adminProductsRoutes);
router.use('/admin/orders', adminOrdersRoutes);
router.use('/admin/users', adminUsersRoutes);
router.use('/admin/partners', adminPartnersRoutes);
router.use('/admin/upload', adminUploadRoutes);

// Public routes
router.use('/partners', partnersRoutes);
router.use('/categories', categoriesRoutes);
router.use('/products', productsRoutes);

// Protected user routes
router.use('/cart', cartRoutes);
router.use('/orders', ordersRoutes);
router.use('/transactions', transactionsRoutes);

export default router;
