# ✏️ Whiteboard

A real-time collaborative whiteboard where multiple users can draw, create shapes, add sticky notes, and see each other's cursors live.

## Features

- 🎨 **Freehand Drawing** - Smooth pen drawing
- 🔷 **Shapes** - Rectangles, circles, and lines
- 📝 **Sticky Notes** - Add yellow post-it style notes
- ✍️ **Text** - Place text anywhere on the canvas
- 🖱️ **Real-time Cursors** - See where everyone is pointing
- ♾️ **Infinite Canvas** - Pan with Shift+Drag or middle mouse
- 🌈 **Auto Colors** - Each user gets a random color
- 👥 **Collaborative** - Changes sync instantly across all users

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Convex (real-time database)
- **Canvas**: HTML5 Canvas API
- **Deployment**: Vercel

## Live Demo

🌐 **https://whiteboard-eta-inky.vercel.app**

## How to Use

1. **Enter a username** - Just pick any name, no password needed
2. **Choose a tool** from the toolbar:
   - Select (move/select elements)
   - Draw (freehand drawing)
   - Rectangle
   - Circle
   - Line
   - Sticky Note
   - Text
3. **Pan around** - Hold Shift and drag, or use middle mouse button
4. **Collaborate** - Share the URL with others and draw together!

## Local Development

### 1. Clone and install

```bash
git clone https://github.com/ubohub-bot/whiteboard.git
cd whiteboard
npm install
```

### 2. Set up Convex

```bash
npx convex dev
```

This creates a Convex project and adds environment variables to `.env.local`.

### 3. Run dev server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Convex Dashboard

View your database and real-time updates:
🔗 https://dashboard.convex.dev/d/adept-kangaroo-901

## Deploy

Configured for Vercel. Environment variables needed:
- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`

Push to GitHub and connect to Vercel, or use the Vercel CLI:

```bash
vercel --prod
```

## Keyboard Shortcuts

- **Shift + Drag**: Pan around the canvas
- **Middle Mouse**: Pan around the canvas

## Future Ideas

- Drag to move elements
- Layers / z-index control
- Undo/redo
- Export to image
- Zoom in/out
- More colors and brush sizes
- Eraser tool
- Selection and multi-select
- Permissions (view-only vs edit)

---

**Project created**: 2026-02-12  
**Status**: Active  
**Live**: https://whiteboard-eta-inky.vercel.app
