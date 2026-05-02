import { Router } from "express";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";
import { protect, requireRole } from "../middleware/authMiddleware";

const router = Router();

router.get("/", protect, getProducts);
router.get("/:id", protect, getProduct);
router.post("/", protect, requireRole("admin", "manager"), createProduct);
router.put("/:id", protect, requireRole("admin", "manager"), updateProduct);
router.delete("/:id", protect, requireRole("admin"), deleteProduct);

export default router;