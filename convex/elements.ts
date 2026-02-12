import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("elements").collect();
  },
});

export const create = mutation({
  args: {
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
    fillColor: v.optional(v.string()),
    strokeColor: v.optional(v.string()),
    strokeWidth: v.optional(v.number()),
    points: v.optional(v.array(v.number())),
    text: v.optional(v.string()),
    fontSize: v.optional(v.number()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const elementId = await ctx.db.insert("elements", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    return elementId;
  },
});

export const update = mutation({
  args: {
    id: v.id("elements"),
    x: v.optional(v.number()),
    y: v.optional(v.number()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    rotation: v.optional(v.number()),
    fillColor: v.optional(v.string()),
    strokeColor: v.optional(v.string()),
    strokeWidth: v.optional(v.number()),
    points: v.optional(v.array(v.number())),
    text: v.optional(v.string()),
    fontSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("elements") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
