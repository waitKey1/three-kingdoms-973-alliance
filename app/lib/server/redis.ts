import { createClient, type RedisClientType } from "redis";

const globalForRedis = globalThis as unknown as {
  redis973?: RedisClientType;
  redis973Promise?: Promise<RedisClientType>;
};

export async function getRedis() {
  if (globalForRedis.redis973?.isOpen) return globalForRedis.redis973;
  if (!globalForRedis.redis973Promise) {
    const client = createClient({
      url: process.env.REDIS_URL ?? "redis://127.0.0.1:63800",
      socket: { connectTimeout: 1_500, reconnectStrategy: false },
    });
    client.on("error", (error) => console.error("Redis connection error:", error instanceof Error ? error.message : "unknown"));
    globalForRedis.redis973Promise = client.connect().then(() => {
      globalForRedis.redis973 = client as RedisClientType;
      return client as RedisClientType;
    }).catch((error) => {
      globalForRedis.redis973Promise = undefined;
      throw error;
    });
  }
  return globalForRedis.redis973Promise;
}

export async function clearPublicCache() {
  try {
    const redis = await getRedis();
    const keys = await redis.keys("public:*");
    if (keys.length) await redis.del(keys);
  } catch {
    // Database writes must remain successful even if cache invalidation is unavailable.
  }
}
