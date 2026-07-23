import { createClient } from "redis";

let client,connecting;
export function redisConfigured(){return !!process.env.REDIS_URL}
export async function redisClient(){
  if(!redisConfigured())return null;
  if(client?.isReady)return client;
  if(!connecting){
    client=createClient({url:process.env.REDIS_URL,socket:{connectTimeout:5000,reconnectStrategy:retries=>Math.min(5000,100*2**retries)}});
    client.on("error",error=>console.error(JSON.stringify({level:"error",message:"redis_error",error:error.message})));
    connecting=client.connect().finally(()=>{connecting=null});
  }
  await connecting;return client;
}
export async function redisReady(){
  const connected=await redisClient();if(!connected)return false;
  return await connected.ping()==="PONG";
}
export async function redisSubscriber(){
  const connected=await redisClient();if(!connected)return null;
  const subscriber=connected.duplicate();subscriber.on("error",error=>console.error(JSON.stringify({level:"error",message:"redis_subscriber_error",error:error.message})));await subscriber.connect();return subscriber;
}
