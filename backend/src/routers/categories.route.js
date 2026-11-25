import { Router } from 'express';
import { list } from '../controllers/categories.controller.js';

const categoriesRoute = Router();

categoriesRoute.get('/', list);

export default categoriesRoute;
