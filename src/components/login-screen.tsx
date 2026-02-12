"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Card className="p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">✏️ Whiteboard</h1>
          <p className="text-neutral-600">
            Collaborative real-time drawing space
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Choose a username
            </label>
            <Input
              type="text"
              placeholder="Enter your name..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              maxLength={20}
            />
          </div>

          <Button type="submit" className="w-full" disabled={!username.trim()}>
            Join Whiteboard
          </Button>
        </form>

        <p className="text-xs text-neutral-500 text-center mt-6">
          You'll be assigned a random color. Everyone can see your cursor and edits in real-time!
        </p>
      </Card>
    </div>
  );
}
