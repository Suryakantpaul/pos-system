import { Router } from "express";
import { createOrder, getOrders, getOrder } from "../controllers/orderController";
import { protect, requireRole } from "../middleware/authMiddleware";

const router = Router();

router.post("/", protect, createOrder);
router.get("/", protect, requireRole("admin", "manager"), getOrders);
router.get("/:id", protect, getOrder);

export default router;