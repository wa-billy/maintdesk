import { Router } from 'express';
import categoriesRoute from './categories.route.js';
import ticketsRoute from './tickets.route.js';
import usersRoute from './users.route.js';

const adminRouter = Router();

adminRouter.use('/users', usersRoute);
adminRouter.use('/categories', categoriesRoute);
adminRouter.use('/tickets', ticketsRoute);

export default adminRouter;
