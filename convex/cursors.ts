import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const update = mutation({
  args: {
    userId: v.id("users"),
    x: v.number(),
    y: v.number(),
  },
  handler: async (ctx, args) => {
    // Try to find existing cursor
    const existing = await ctx.db
      .query("cursors")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        x: args.x,
        y: args.y,
        lastSeenAt: Date.now(),
      });
    } else {
      await ctx.db.insert("cursors", {
        userId: args.userId,
        x: args.x,
        y: args.y,
        lastSeenAt: Date.now(),
      });
    }
  },
});

export const list = query({
  handler: async (ctx) => {
    const fiveSecondsAgo = Date.now() - 5000;
    return await ctx.db
      .query("cursors")
      .filter((q) => q.gte(q.field("lastSeenAt"), fiveSecondsAgo))
      .collect();
  },
});
