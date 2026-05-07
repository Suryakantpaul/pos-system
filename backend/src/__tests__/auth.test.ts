import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "../routes/authRoutes";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

beforeAll(async () => {
  await mongoose.connect("mongodb://localhost:27017/pos-test");
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe("Auth API", () => {
  it("should signup a new user", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        name: "Test User",
        email: "test@pos.com",
        password: "123456",
        role: "cashier",
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it("should login with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@pos.com",
        password: "123456",
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it("should fail login with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@pos.com",
        password: "wrongpassword",
      });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});