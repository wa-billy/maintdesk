import { Router } from "express";
import { login, me } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const authRoute = Router();

authRoute.post('/login', login);
authRoute.get('/me', authenticate, me);

export default authRoute;