import { redisClient } from "./redis.js";

export async function cacheGet(key){
  const redis=await redisClient();if(!redis)return null;
  const value=await redis.get(`roombridge:cache:${key}`);return value?JSON.parse(value):null;
}
export async function cacheSet(key,value,ttlSeconds=30){
  const redis=await redisClient();if(!redis)return;
  await redis.set(`roombridge:cache:${key}`,JSON.stringify(value),{EX:ttlSeconds});
}
export async function cacheDeletePrefix(prefix){
  const redis=await redisClient();if(!redis)return;
  for await(const key of redis.scanIterator({MATCH:`roombridge:cache:${prefix}*`,COUNT:100}))await redis.del(key);
}
