import { Router } from "express";
import {
    refreshTokenHandler,
    registerUser,
    loginUser,
    logoutUser,
    getMeUser,
    verifyEmail,
    resendVerificationEmail,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

router.post("/refresh", refreshTokenHandler);

router.post("/logout", authMiddleware, logoutUser);

router.get("/me", authMiddleware, getMeUser);

export default router;