import { EventEmitter } from "node:events";
import { redisClient, redisConfigured, redisSubscriber } from "./redis.js";

const local=new EventEmitter();local.setMaxListeners(10_000);
let subscribed;
async function ensureSubscriber(){
  if(!redisConfigured()||subscribed)return;
  subscribed=(async()=>{const subscriber=await redisSubscriber();await subscriber.subscribe("roombridge:events",message=>{try{const event=JSON.parse(message);local.emit(event.userId,event)}catch(error){console.error(JSON.stringify({level:"error",message:"realtime_event_invalid",error:error.message}))}})})().catch(error=>{subscribed=null;throw error});
  return subscribed;
}
export async function subscribeUser(userId,listener){
  await ensureSubscriber();local.on(userId,listener);return()=>local.off(userId,listener);
}
export async function publishUser(userId,event,payload){
  const message={userId,event,payload};
  if(redisConfigured()){const redis=await redisClient();await redis.publish("roombridge:events",JSON.stringify(message))}
  else local.emit(userId,message);
}
