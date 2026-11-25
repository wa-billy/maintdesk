import { Router } from 'express';
import { summary } from '../controllers/dashboard.controller.js';

const dashboardRoute = Router();

dashboardRoute.get('/summary', summary);

export default dashboardRoute;
