import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import { ENV } from "./config/env";
import { connectRedis } from "./config/redis";
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import orderRoutes from "./routes/orderRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "POS Backend is running!" });
});

const start = async () => {
  await connectDB();
  await connectRedis();
  app.listen(ENV.PORT, () => {
    console.log("Server running on port " + ENV.PORT);
  });
};

start();
