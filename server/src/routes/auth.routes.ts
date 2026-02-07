import {Router} from 'express';
import { refreshTokenHandler, registerUser,loginUser,logoutUser,getMeUser } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router= Router();

router.post('/register',registerUser);
router.post('/login',loginUser);

router.post('/refresh',refreshTokenHandler);

router.post('/logout', authMiddleware, logoutUser);

router.get("/me", authMiddleware, getMeUser);

export default router;