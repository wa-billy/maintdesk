import { Router } from 'express';
import { ok } from '../utils/http.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import authRoute from './auth.route.js';
import ticketsRoute from './tickets.route.js';
import categoriesRoute from './categories.route.js';
import dashboardRoute from './dashboard.route.js';
import adminRouter from './admin/index.js';

const router = Router();

router.get('/health', (req, res) => ok(res, null, 'API ทำงานปกติ'));

router.use('/auth', authRoute);
router.use('/tickets', authenticate, ticketsRoute);
router.use('/categories', authenticate, categoriesRoute);
router.use('/dashboard', authenticate, dashboardRoute);
router.use('/admin', authenticate, authorize('admin'), adminRouter);

export default router;
