import {Router} from 'express';
import { registerUser,loginUser,logoutUser } from '../controllers/auth.controller.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.middleware.js';

const router= Router();

router.post('/register',registerUser);
router.post('/login',loginUser);
router.post('/logout',logoutUser);

router.get("/me", authMiddleware, (req: AuthenticatedRequest, res) => {
    res.json({
        message: "Protected route accessed",
        user: req.user,
    });
});

export default router;