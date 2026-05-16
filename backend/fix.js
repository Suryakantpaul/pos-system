const fs = require('fs');

const content = `import { Request, Response } from "express";
import Order from "../models/Order";
import Product from "../models/ProductModel";
import { AuthRequest } from "../middleware/authMiddleware";

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items, paymentMethod } = req.body;
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        res.status(404).json({ success: false, message: "Product not found: " + item.productId });
        return;
      }
      if (product.stock < item.quantity) {
        res.status(400).json({ success: false, message: "Insufficient stock for " + product.name });
        return;
      }
      product.stock -= item.quantity;
      await product.save();
      subtotal += product.price * item.quantity;
      orderItems.push({ product: product._id, name: product.name, sku: product.sku, price: product.price, quantity: item.quantity });
    }

    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const order = await Order.create({
      items: orderItems,
      subtotal,
      tax,
      total,
      paymentMethod: paymentMethod || "cash",
      cashier: req.user?.id,
    });

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
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
};`;

fs.writeFileSync('src/controllers/orderController.ts', content, {encoding: 'utf8'});
console.log('Done!');