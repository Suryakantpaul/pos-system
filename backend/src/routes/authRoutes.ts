import { Router } from "express";
import { signup, login, getMe, forgotPassword } from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.get("/me", protect, getMe);

export default router;