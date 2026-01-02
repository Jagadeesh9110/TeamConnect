import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get("/me", authMiddleware, (req: AuthenticatedRequest, res) => {
    res.json({
        message: "Protected route accessed",
        user: req.user,
    });
});


export default router;
