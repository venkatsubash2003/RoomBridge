import { config } from "./config.js";
import { redisClient } from "./redis.js";
const buckets = new Map();

export function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  return String(config.trustProxy&&forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress || "unknown").trim();
}

export async function rateLimit(req, res, { key, limit, windowMs }) {
  const now = Date.now();
  const bucketKey = `${key}:${clientIp(req)}`;
  let bucket;
  const redis=await redisClient();
  if(redis){
    const window=Math.floor(now/windowMs),redisKey=`roombridge:rate:${bucketKey}:${window}`,count=await redis.incr(redisKey);
    if(count===1)await redis.pExpire(redisKey,windowMs);
    bucket={count,resetAt:(window+1)*windowMs};
  }else{
    bucket=buckets.get(bucketKey);
    if(!bucket||bucket.resetAt<=now)bucket={count:0,resetAt:now+windowMs};
    bucket.count+=1;buckets.set(bucketKey,bucket);
  }
  res.setHeader("RateLimit-Limit", limit);
  res.setHeader("RateLimit-Remaining", Math.max(0, limit - bucket.count));
  res.setHeader("RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));
  if (bucket.count <= limit) return true;
  res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000));
  res.writeHead(429, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Too many requests. Try again later.", code: "rate_limited" }));
  return false;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}, 60_000).unref();
