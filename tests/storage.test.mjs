import test from "node:test";
import assert from "node:assert/strict";
import { validateUpload, objectKey } from "../server/storage.js";

test("upload policy accepts bounded private media", () => {
  assert.doesNotThrow(()=>validateUpload({purpose:"listing_media",contentType:"image/jpeg",byteSize:2_000_000,filename:"room.jpg"}));
  assert.match(objectKey("user-1","listing_media","image/jpeg"),/^listing_media\/user-1\/[a-f0-9-]+\.jpg$/);
});

test("upload policy rejects executable and oversized content", () => {
  assert.throws(()=>validateUpload({purpose:"listing_media",contentType:"application/x-msdownload",byteSize:10,filename:"bad.exe"}));
  assert.throws(()=>validateUpload({purpose:"verification_document",contentType:"application/pdf",byteSize:30_000_000,filename:"large.pdf"}));
});
