import { Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/Order";
import Product from "../models/Product";
import { AuthRequest } from "../middleware/authMiddleware";

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items, paymentMethod } = req.body;
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) {
        await session.abortTransaction();
        res.status(404).json({ success: false, message: "Product not found" });
        return;
      }
      if (product.stock < item.quantity) {
        await session.abortTransaction();
        res.status(400).json({ success: false, message: "Insufficient stock for " + product.name });
        return;
      }
      product.stock -= item.quantity;
      await product.save({ session });
      subtotal += product.price * item.quantity;
      orderItems.push({ product: product._id, name: product.name, sku: product.sku, price: product.price, quantity: item.quantity });
    }
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    const [order] = await Order.create([{ items: orderItems, subtotal, tax, total, paymentMethod: paymentMethod || "cash", cashier: req.user?.id }], { session });
    await session.commitTransaction();
    res.status(201).json({ success: true, order });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: "Transaction failed", error });
  } finally {
    session.endSession();
  }
};

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.find().populate("cashier", "name email").sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

export const getOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id).populate("cashier", "name email");
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};