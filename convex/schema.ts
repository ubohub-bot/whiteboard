import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    color: v.string(),
    lastActiveAt: v.number(),
  }).index("by_username", ["username"]),

  elements: defineTable({
    type: v.union(
      v.literal("rectangle"),
      v.literal("circle"),
      v.literal("line"),
      v.literal("drawing"),
      v.literal("sticky"),
      v.literal("text")
    ),
    x: v.number(),
    y: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    rotation: v.optional(v.number()),
    // Shape properties
    fillColor: v.optional(v.string()),
    strokeColor: v.optional(v.string()),
    strokeWidth: v.optional(v.number()),
    // Drawing properties
    points: v.optional(v.array(v.number())),
    // Text/sticky properties
    text: v.optional(v.string()),
    fontSize: v.optional(v.number()),
    // Creator
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  cursors: defineTable({
    userId: v.id("users"),
    x: v.number(),
    y: v.number(),
    lastSeenAt: v.number(),
  }).index("by_user", ["userId"]),
});
