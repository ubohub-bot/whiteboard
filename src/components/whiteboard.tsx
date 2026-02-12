"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Pencil,
  Square,
  Circle,
  Minus,
  StickyNote,
  Type,
  Move,
  Users,
} from "lucide-react";

interface WhiteboardProps {
  userId: Id<"users">;
  username: string;
  userColor: string;
}

type Tool =
  | "select"
  | "draw"
  | "rectangle"
  | "circle"
  | "line"
  | "sticky"
  | "text";

export function Whiteboard({ userId, username, userColor }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [isDrawing, setIsDrawing] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [currentPoints, setCurrentPoints] = useState<number[]>([]);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  // Convex queries and mutations
  const elements = useQuery(api.elements.list) || [];
  const activeUsers = useQuery(api.users.getActiveUsers) || [];
  const cursors = useQuery(api.cursors.list) || [];
  
  const createElement = useMutation(api.elements.create);
  const updateCursor = useMutation(api.cursors.update);
  const updateActivity = useMutation(api.users.updateActivity);

  // Update activity every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      updateActivity({ userId });
    }, 30000);
    return () => clearInterval(interval);
  }, [userId, updateActivity]);

  // Handle mouse move for cursor sync
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - panOffset.x;
      const y = e.clientY - rect.top - panOffset.y;

      // Update cursor position
      updateCursor({ userId, x, y });

      // Handle panning
      if (isPanning) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy });
        setPanStart({ x: e.clientX, y: e.clientY });
        return;
      }

      // Handle drawing
      if (isDrawing && tool === "draw") {
        setCurrentPoints([...currentPoints, x, y]);
      }
    },
    [userId, updateCursor, isPanning, panStart, panOffset, isDrawing, tool, currentPoints]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - panOffset.x;
      const y = e.clientY - rect.top - panOffset.y;

      // Space key or middle mouse for panning
      if (e.button === 1 || e.shiftKey) {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        return;
      }

      if (tool === "draw") {
        setIsDrawing(true);
        setCurrentPoints([x, y]);
      } else if (tool !== "select") {
        setIsDrawing(true);
        setStartPos({ x, y });
      }
    },
    [tool, panOffset]
  );

  const handleMouseUp = useCallback(
    async (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - panOffset.x;
      const y = e.clientY - rect.top - panOffset.y;

      if (isPanning) {
        setIsPanning(false);
        return;
      }

      if (!isDrawing) return;

      // Create element based on tool
      if (tool === "draw" && currentPoints.length > 2) {
        await createElement({
          type: "drawing",
          x: 0,
          y: 0,
          points: currentPoints,
          strokeColor: userColor,
          strokeWidth: 3,
          userId,
        });
      } else if (tool === "rectangle") {
        const width = Math.abs(x - startPos.x);
        const height = Math.abs(y - startPos.y);
        await createElement({
          type: "rectangle",
          x: Math.min(startPos.x, x),
          y: Math.min(startPos.y, y),
          width,
          height,
          fillColor: userColor + "33",
          strokeColor: userColor,
          strokeWidth: 2,
          userId,
        });
      } else if (tool === "circle") {
        const radius = Math.sqrt(
          Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2)
        );
        await createElement({
          type: "circle",
          x: startPos.x,
          y: startPos.y,
          width: radius * 2,
          height: radius * 2,
          fillColor: userColor + "33",
          strokeColor: userColor,
          strokeWidth: 2,
          userId,
        });
      } else if (tool === "line") {
        await createElement({
          type: "line",
          x: startPos.x,
          y: startPos.y,
          width: x - startPos.x,
          height: y - startPos.y,
          strokeColor: userColor,
          strokeWidth: 3,
          userId,
        });
      } else if (tool === "sticky") {
        await createElement({
          type: "sticky",
          x,
          y,
          width: 200,
          height: 200,
          fillColor: "#fef08a",
          text: "New note...",
          fontSize: 16,
          userId,
        });
      } else if (tool === "text") {
        await createElement({
          type: "text",
          x,
          y,
          text: "Click to edit",
          fontSize: 20,
          strokeColor: userColor,
          userId,
        });
      }

      setIsDrawing(false);
      setCurrentPoints([]);
    },
    [
      tool,
      isDrawing,
      currentPoints,
      startPos,
      userColor,
      userId,
      createElement,
      isPanning,
      panOffset,
    ]
  );

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply pan offset
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);

    // Draw elements
    elements.forEach((element) => {
      if (element.type === "rectangle") {
        ctx.fillStyle = element.fillColor || "#000";
        ctx.strokeStyle = element.strokeColor || "#000";
        ctx.lineWidth = element.strokeWidth || 1;
        ctx.fillRect(element.x, element.y, element.width || 0, element.height || 0);
        ctx.strokeRect(element.x, element.y, element.width || 0, element.height || 0);
      } else if (element.type === "circle") {
        const radius = (element.width || 0) / 2;
        ctx.fillStyle = element.fillColor || "#000";
        ctx.strokeStyle = element.strokeColor || "#000";
        ctx.lineWidth = element.strokeWidth || 1;
        ctx.beginPath();
        ctx.arc(element.x + radius, element.y + radius, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (element.type === "line") {
        ctx.strokeStyle = element.strokeColor || "#000";
        ctx.lineWidth = element.strokeWidth || 1;
        ctx.beginPath();
        ctx.moveTo(element.x, element.y);
        ctx.lineTo(element.x + (element.width || 0), element.y + (element.height || 0));
        ctx.stroke();
      } else if (element.type === "drawing" && element.points) {
        ctx.strokeStyle = element.strokeColor || "#000";
        ctx.lineWidth = element.strokeWidth || 1;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        for (let i = 0; i < element.points.length - 1; i += 2) {
          if (i === 0) {
            ctx.moveTo(element.points[i], element.points[i + 1]);
          } else {
            ctx.lineTo(element.points[i], element.points[i + 1]);
          }
        }
        ctx.stroke();
      } else if (element.type === "sticky") {
        ctx.fillStyle = element.fillColor || "#fef08a";
        ctx.fillRect(element.x, element.y, element.width || 200, element.height || 200);
        ctx.strokeStyle = "#ca8a04";
        ctx.lineWidth = 2;
        ctx.strokeRect(element.x, element.y, element.width || 200, element.height || 200);
        ctx.fillStyle = "#000";
        ctx.font = `${element.fontSize || 16}px sans-serif`;
        ctx.fillText(element.text || "", element.x + 10, element.y + 30, (element.width || 200) - 20);
      } else if (element.type === "text") {
        ctx.fillStyle = element.strokeColor || "#000";
        ctx.font = `${element.fontSize || 20}px sans-serif`;
        ctx.fillText(element.text || "", element.x, element.y);
      }
    });

    // Draw current drawing
    if (isDrawing && tool === "draw" && currentPoints.length > 2) {
      ctx.strokeStyle = userColor;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i < currentPoints.length - 1; i += 2) {
        if (i === 0) {
          ctx.moveTo(currentPoints[i], currentPoints[i + 1]);
        } else {
          ctx.lineTo(currentPoints[i], currentPoints[i + 1]);
        }
      }
      ctx.stroke();
    }

    // Draw cursors
    cursors.forEach((cursor) => {
      if (cursor.userId === userId) return; // Don't draw own cursor
      
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }, [elements, cursors, panOffset, isDrawing, currentPoints, tool, userColor, userId]);

  const tools = [
    { id: "select", icon: Move, label: "Select" },
    { id: "draw", icon: Pencil, label: "Draw" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "line", icon: Minus, label: "Line" },
    { id: "sticky", icon: StickyNote, label: "Sticky Note" },
    { id: "text", icon: Type, label: "Text" },
  ];

  return (
    <div className="h-screen flex flex-col bg-neutral-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-neutral-200 p-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-lg">✏️ Whiteboard</h1>
          <Badge style={{ backgroundColor: userColor, color: "#fff" }}>
            {username}
          </Badge>
        </div>

        <div className="flex gap-1 ml-auto">
          {tools.map((t) => (
            <Button
              key={t.id}
              variant={tool === t.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setTool(t.id as Tool)}
              title={t.label}
            >
              <t.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-neutral-600" />
          <span className="text-sm text-neutral-600">
            {activeUsers.length} online
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={typeof window !== "undefined" ? window.innerWidth : 1920}
          height={typeof window !== "undefined" ? window.innerHeight - 64 : 1080}
          className="cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        />
      </div>

      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-2 text-xs text-neutral-600">
        <div>Pan: Shift + Drag or Middle Mouse</div>
        <div>Current tool: {tool}</div>
      </div>
    </div>
  );
}
