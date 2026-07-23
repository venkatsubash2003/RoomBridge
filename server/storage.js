import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "./config.js";

const allowed = new Map([
  ["image/jpeg",10_000_000],["image/png",10_000_000],["image/webp",10_000_000],
  ["application/pdf",20_000_000],["video/mp4",100_000_000]
]);
const extensions = new Map([["image/jpeg","jpg"],["image/png","png"],["image/webp","webp"],["application/pdf","pdf"],["video/mp4","mp4"]]);
const client = config.objectStorage.bucket ? new S3Client({
  region:config.objectStorage.region,endpoint:config.objectStorage.endpoint||undefined,
  forcePathStyle:config.objectStorage.forcePathStyle,
  credentials:process.env.OBJECT_STORAGE_ACCESS_KEY&&process.env.OBJECT_STORAGE_SECRET_KEY?{accessKeyId:process.env.OBJECT_STORAGE_ACCESS_KEY,secretAccessKey:process.env.OBJECT_STORAGE_SECRET_KEY}:undefined
}) : null;

export function validateUpload({purpose,contentType,byteSize,filename}) {
  if(!["listing_media","message_attachment","verification_document","lease_document"].includes(purpose))throw new Error("Invalid upload purpose");
  const max=allowed.get(contentType);if(!max)throw new Error("Unsupported file type");
  if(!Number.isInteger(Number(byteSize))||Number(byteSize)<1||Number(byteSize)>max)throw new Error(`File exceeds the ${Math.round(max/1_000_000)} MB limit`);
  if(typeof filename!=="string"||filename.length<1||filename.length>255)throw new Error("Invalid filename");
}

export function storageConfigured(){return !!client}
export function objectKey(userId,purpose,contentType){return `${purpose}/${userId}/${randomUUID()}.${extensions.get(contentType)}`}
export async function signUpload(key,contentType,byteSize){
  if(!client)throw new Error("Object storage is not configured");
  return getSignedUrl(client,new PutObjectCommand({Bucket:config.objectStorage.bucket,Key:key,ContentType:contentType,ContentLength:Number(byteSize),ServerSideEncryption:"AES256"}),{expiresIn:600});
}
export async function verifyObject(key){
  if(!client)throw new Error("Object storage is not configured");
  return client.send(new HeadObjectCommand({Bucket:config.objectStorage.bucket,Key:key}));
}
export async function signDownload(key,filename){
  if(!client)throw new Error("Object storage is not configured");
  return getSignedUrl(client,new GetObjectCommand({Bucket:config.objectStorage.bucket,Key:key,ResponseContentDisposition:`attachment; filename="${String(filename).replace(/["\r\n]/g,"_")}"`}),{expiresIn:300});
}
