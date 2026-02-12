import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const COLORS = [
  "#ef4444", "#f59e0b", "#10b981", "#3b82f6", 
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"
];

export const getOrCreate = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (existing) {
      // Update last active
      await ctx.db.patch(existing._id, {
        lastActiveAt: Date.now(),
      });
      return existing._id;
    }

    // Create new user with random color
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const userId = await ctx.db.insert("users", {
      username: args.username,
      color,
      lastActiveAt: Date.now(),
    });
    
    return userId;
  },
});

export const getActiveUsers = query({
  handler: async (ctx) => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return await ctx.db
      .query("users")
      .filter((q) => q.gte(q.field("lastActiveAt"), fiveMinutesAgo))
      .collect();
  },
});

export const updateActivity = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      lastActiveAt: Date.now(),
    });
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
