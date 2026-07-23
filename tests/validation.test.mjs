import test from "node:test";
import assert from "node:assert/strict";
import { registration, login, profile, ValidationError } from "../server/validation.js";

test("registration normalizes valid identity input", () => {
  assert.deepEqual(registration({ name:"  Test User ", email:"TEST@example.com", password:"RoomBridge123" }), {
    name:"Test User", email:"test@example.com", password:"RoomBridge123"
  });
});

test("registration rejects weak passwords and invalid email", () => {
  assert.throws(() => registration({ name:"Test", email:"invalid", password:"short" }), ValidationError);
  assert.throws(() => registration({ name:"Test", email:"test@example.com", password:"abcdefghijkl" }), ValidationError);
});

test("registration rejects markup in display names", () => {
  assert.throws(() => registration({ name:"<img>", email:"test@example.com", password:"RoomBridge123" }), ValidationError);
});

test("login does not impose registration strength on existing passwords", () => {
  assert.equal(login({ email:"TEST@example.com", password:"legacy" }).email, "test@example.com");
});

test("profile bounds budget and user-controlled arrays", () => {
  assert.throws(() => profile({ budget:-1 }), ValidationError);
  assert.equal(profile({ budget:"1200", languages:Array(20).fill("English") }).languages.length, 10);
});
