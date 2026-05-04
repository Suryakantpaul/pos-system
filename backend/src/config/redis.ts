import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", () => {});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    console.log("✅ Redis connected successfully");
  } catch (error) {
    console.log("⚠️  Redis not available - running without cache");
  }
};

export const getCache = async (key: string): Promise<string | null> => {
  try { return await redisClient.get(key); } catch { return null; }
};

export const setCache = async (key: string, value: string, ttl = 300): Promise<void> => {
  try { await redisClient.setEx(key, ttl, value); } catch {}
};

export const deleteCache = async (key: string): Promise<void> => {
  try { await redisClient.del(key); } catch {}
};

export default redisClient;