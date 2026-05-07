import { Request, Response } from "express";
import Product from "../models/ProductModel";
import { getCache, setCache, deleteCache } from "../config/redis";

const CACHE_KEY = "products:all";
const CACHE_TTL = 300;

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;
    const cacheKey = category || search ? CACHE_KEY + ":" + category + ":" + search : CACHE_KEY;

    const cached = await getCache(cacheKey);
    if (cached) {
      res.status(200).json({ success: true, products: JSON.parse(cached), fromCache: true });
      return;
    }

    const filter: any = { isActive: true };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    await setCache(cacheKey, JSON.stringify(products), CACHE_TTL);
    res.status(200).json({ success: true, products, fromCache: false });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.create(req.body);
    await deleteCache(CACHE_KEY);
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }
    await deleteCache(CACHE_KEY);
    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }
    await deleteCache(CACHE_KEY);
    res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};