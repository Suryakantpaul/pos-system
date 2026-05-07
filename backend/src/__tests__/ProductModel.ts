import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "../routes/authRoutes";
import productRoutes from "../routes/productRoutes";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

let token: string;

beforeAll(async () => {
  await mongoose.connect("mongodb://localhost:27017/pos-test-products");

  const res = await request(app)
    .post("/api/auth/signup")
    .send({
      name: "Test Admin",
      email: "admin@test.com",
      password: "123456",
      role: "admin",
    });
  token = res.body.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe("Product API", () => {
  let productId: string;

  it("should create a product", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Product",
        sku: "TEST-001",
        price: 9.99,
        stock: 10,
        category: "electronics",
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    productId = res.body.product._id;
  });

  it("should get all products", async () => {
    const res = await request(app)
      .get("/api/products")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products).toBeDefined();
  });

  it("should get a single product", async () => {
    const res = await request(app)
      .get(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should update a product", async () => {
    const res = await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ price: 19.99 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});