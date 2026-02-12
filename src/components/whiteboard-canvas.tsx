"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Stage, Layer, Line, Rect, Circle as KonvaCircle, Text as KonvaText } from "react-konva";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextEditDialog } from "@/components/text-edit-dialog";
import {
  Pencil,
  Square,
  Circle,
  Minus,
  StickyNote,
  Type,
  Move,
  Users,
  Trash2,
} from "lucide-react";
import Konva from "konva";

interface WhiteboardCanvasProps {
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

export function WhiteboardCanvas({ userId, username, userColor }: WhiteboardCanvasProps) {
  const [tool, setTool] = useState<Tool>("select");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<number[]>([]);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const stageRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  const [editingElement, setEditingElement] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Convex
  const elements = useQuery(api.elements.list) || [];
  const activeUsers = useQuery(api.users.getActiveUsers) || [];
  const cursors = useQuery(api.cursors.list) || [];
  
  const createElement = useMutation(api.elements.create);
  const updateElement = useMutation(api.elements.update);
  const deleteElement = useMutation(api.elements.remove);
  const updateCursor = useMutation(api.cursors.update);
  const updateActivity = useMutation(api.users.updateActivity);

  // Update dimensions on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const updateDimensions = () => {
        // Use visualViewport for better mobile support
        const vw = window.visualViewport?.width || window.innerWidth;
        const vh = window.visualViewport?.height || window.innerHeight;
        setDimensions({
          width: vw,
          height: vh - 56, // Account for toolbar (smaller on mobile)
        });
      };

      updateDimensions();

      window.addEventListener("resize", updateDimensions);
      window.visualViewport?.addEventListener("resize", updateDimensions);
      
      return () => {
        window.removeEventListener("resize", updateDimensions);
        window.visualViewport?.removeEventListener("resize", updateDimensions);
      };
    }
  }, []);

  // Update activity
  useEffect(() => {
    const interval = setInterval(() => {
      updateActivity({ userId });
    }, 30000);
    return () => clearInterval(interval);
  }, [userId, updateActivity]);

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: any) => {
      if (tool === "select") return;

      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      const x = (point.x - stagePos.x) / stageScale;
      const y = (point.y - stagePos.y) / stageScale;

      setIsDrawing(true);

      if (tool === "draw") {
        setCurrentLine([x, y]);
      } else if (tool === "sticky") {
        createElement({
          type: "sticky",
          x,
          y,
          width: 200,
          height: 200,
          fillColor: "#fef08a",
          text: "Double-click to edit",
          fontSize: 16,
          userId,
        });
      } else if (tool === "text") {
        createElement({
          type: "text",
          x,
          y,
          text: "Double-click to edit",
          fontSize: 24,
          strokeColor: userColor,
          userId,
        });
      }
    },
    [tool, stagePos, stageScale, userColor, userId, createElement]
  );

  const handleMouseMove = useCallback(
    (e: any) => {
      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      const x = (point.x - stagePos.x) / stageScale;
      const y = (point.y - stagePos.y) / stageScale;

      // Update cursor
      updateCursor({ userId, x, y });

      if (!isDrawing) return;

      if (tool === "draw") {
        setCurrentLine([...currentLine, x, y]);
      }
    },
    [isDrawing, tool, currentLine, stagePos, stageScale, userId, updateCursor]
  );

  const handleMouseUp = useCallback(
    async (e: any) => {
      if (!isDrawing) return;
      setIsDrawing(false);

      if (tool === "draw" && currentLine.length > 2) {
        await createElement({
          type: "drawing",
          x: 0,
          y: 0,
          points: currentLine,
          strokeColor: userColor,
          strokeWidth: 3,
          userId,
        });
        setCurrentLine([]);
      }
    },
    [isDrawing, tool, currentLine, userColor, userId, createElement]
  );

  // Handle element drag
  const handleDragEnd = useCallback(
    (e: any, elementId: Id<"elements">) => {
      updateElement({
        id: elementId,
        x: e.target.x(),
        y: e.target.y(),
      });
    },
    [updateElement]
  );

  // Handle text edit
  const handleTextDblClick = useCallback(
    (element: any) => {
      setEditingElement(element);
      setEditDialogOpen(true);
    },
    []
  );

  const handleTextSave = useCallback(
    (text: string) => {
      if (editingElement) {
        updateElement({
          id: editingElement._id,
          text,
        });
      }
    },
    [editingElement, updateElement]
  );

  const tools = [
    { id: "select", icon: Move, label: "Select & Move" },
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
      <div className="bg-white border-b border-neutral-200 p-2 sm:p-3 flex items-center gap-2 sm:gap-4 overflow-x-auto">
        <div className="flex items-center gap-2 flex-shrink-0">
          <h1 className="font-semibold text-sm sm:text-lg">✏️</h1>
          <Badge style={{ backgroundColor: userColor, color: "#fff" }} className="text-xs">
            {username}
          </Badge>
        </div>

        <div className="flex gap-1 flex-shrink-0">
          {tools.map((t) => (
            <Button
              key={t.id}
              variant={tool === t.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setTool(t.id as Tool)}
              title={t.label}
              className="h-8 w-8 p-0"
            >
              <t.icon className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1 ml-auto flex-shrink-0">
          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-neutral-600" />
          <span className="text-xs sm:text-sm text-neutral-600">
            {activeUsers.length}
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          draggable={tool === "select"}
          onDragEnd={(e) => {
            setStagePos({ x: e.target.x(), y: e.target.y() });
          }}
        >
          <Layer>
            {/* Render existing elements */}
            {elements.map((element) => {
              if (element.type === "drawing" && element.points) {
                return (
                  <Line
                    key={element._id}
                    points={element.points}
                    stroke={element.strokeColor}
                    strokeWidth={element.strokeWidth}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    draggable={tool === "select"}
                  />
                );
              } else if (element.type === "rectangle") {
                return (
                  <Rect
                    key={element._id}
                    x={element.x}
                    y={element.y}
                    width={element.width}
                    height={element.height}
                    fill={element.fillColor}
                    stroke={element.strokeColor}
                    strokeWidth={element.strokeWidth}
                    draggable={tool === "select"}
                    onDragEnd={(e) => handleDragEnd(e, element._id)}
                  />
                );
              } else if (element.type === "circle") {
                const radius = (element.width || 0) / 2;
                return (
                  <KonvaCircle
                    key={element._id}
                    x={element.x + radius}
                    y={element.y + radius}
                    radius={radius}
                    fill={element.fillColor}
                    stroke={element.strokeColor}
                    strokeWidth={element.strokeWidth}
                    draggable={tool === "select"}
                    onDragEnd={(e) => handleDragEnd(e, element._id)}
                  />
                );
              } else if (element.type === "sticky") {
                return (
                  <React.Fragment key={element._id}>
                    <Rect
                      x={element.x}
                      y={element.y}
                      width={element.width || 200}
                      height={element.height || 200}
                      fill={element.fillColor}
                      stroke="#ca8a04"
                      strokeWidth={2}
                      draggable={tool === "select"}
                      onDragEnd={(e) => handleDragEnd(e, element._id)}
                      onDblClick={() => handleTextDblClick(element)}
                    />
                    <KonvaText
                      x={element.x + 10}
                      y={element.y + 10}
                      text={element.text}
                      fontSize={element.fontSize}
                      width={(element.width || 200) - 20}
                      listening={false}
                    />
                  </React.Fragment>
                );
              } else if (element.type === "text") {
                return (
                  <KonvaText
                    key={element._id}
                    x={element.x}
                    y={element.y}
                    text={element.text}
                    fontSize={element.fontSize}
                    fill={element.strokeColor}
                    draggable={tool === "select"}
                    onDragEnd={(e) => handleDragEnd(e, element._id)}
                    onDblClick={() => handleTextDblClick(element)}
                  />
                );
              }
              return null;
            })}

            {/* Current drawing line */}
            {isDrawing && tool === "draw" && currentLine.length > 2 && (
              <Line
                points={currentLine}
                stroke={userColor}
                strokeWidth={3}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
              />
            )}

            {/* Cursors */}
            {cursors.map((cursor) => {
              if (cursor.userId === userId) return null;
              return (
                <KonvaCircle
                  key={cursor.userId}
                  x={cursor.x}
                  y={cursor.y}
                  radius={6}
                  fill="#000"
                  listening={false}
                />
              );
            })}
          </Layer>
        </Stage>

        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-2 text-xs text-neutral-600 space-y-1 hidden sm:block">
          <div><strong>Pan:</strong> Drag in Select mode</div>
          <div><strong>Move:</strong> Select + drag element</div>
          <div><strong>Edit:</strong> Double-tap/click text</div>
          <div className="pt-1 border-t">Current: <strong>{tool}</strong></div>
        </div>
      </div>

      <TextEditDialog
        open={editDialogOpen}
        initialText={editingElement?.text || ""}
        onSave={handleTextSave}
        onClose={() => setEditDialogOpen(false)}
      />
    </div>
  );
}
