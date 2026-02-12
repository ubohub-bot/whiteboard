"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { LoginScreen } from "@/components/login-screen";
import { Whiteboard } from "@/components/whiteboard";

export default function Home() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [username, setUsername] = useState<string>("");

  const getOrCreateUser = useMutation(api.users.getOrCreate);
  const user = useQuery(
    api.users.getUser,
    userId ? { userId } : "skip"
  );

  // Check for saved user in localStorage
  useEffect(() => {
    const savedUserId = localStorage.getItem("whiteboard_userId");
    const savedUsername = localStorage.getItem("whiteboard_username");
    if (savedUserId && savedUsername) {
      setUserId(savedUserId as Id<"users">);
      setUsername(savedUsername);
    }
  }, []);

  const handleLogin = async (name: string) => {
    try {
      const id = await getOrCreateUser({ username: name });
      setUserId(id);
      setUsername(name);
      localStorage.setItem("whiteboard_userId", id);
      localStorage.setItem("whiteboard_username", name);
    } catch (error) {
      console.error("Failed to login:", error);
    }
  };

  if (!userId || !user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <Whiteboard
      userId={userId}
      username={username}
      userColor={user.color}
    />
  );
}
