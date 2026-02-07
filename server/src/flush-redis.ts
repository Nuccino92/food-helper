import "dotenv/config";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.error("Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN");
  process.exit(1);
}

const redis = new Redis({ url, token });

const target = process.argv[2]; // "all", "abuse", or "ratelimit"

async function flush() {
  switch (target) {
    case "abuse": {
      const keys = await redis.keys("abuse:lock:*");
      for (const key of keys) await redis.del(key);
      console.log(`Cleared ${keys.length} abuse lock(s)`);
      break;
    }
    case "ratelimit": {
      const keys = await redis.keys("ratelimit:*");
      for (const key of keys) await redis.del(key);
      console.log(`Cleared ${keys.length} rate limit key(s)`);
      break;
    }
    case "all": {
      await redis.flushdb();
      console.log("Flushed entire Redis database");
      break;
    }
    default:
      console.log("Usage: npm run flush <target>");
      console.log("  abuse      - Clear abuse locks only");
      console.log("  ratelimit  - Clear rate limit keys only");
      console.log("  all        - Flush entire Redis database");
      process.exit(1);
  }
}

flush().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
