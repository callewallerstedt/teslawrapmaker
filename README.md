# TeslaWraps - Custom Car Wrap Designer

A web application for designing and previewing custom car wraps in real-time.

## Features

- **Car Model Selection**: Choose from various Tesla models
- **UV Map Editor**: Upload and position images on UV texture maps
- **Live 3D Preview**: See your design in real-time with Three.js
- **Download**: Export your final wrap as a high-resolution texture
- **Community Gallery**: Share and browse wraps created by others

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **3D Rendering**: Three.js, React Three Fiber
- **Image Processing**: Sharp (server-side)
- **Canvas Editing**: Fabric.js
- **Storage**: In-memory (can be upgraded to Vercel Blob or Supabase)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
/app
  /api          - API routes
  /design/[id]  - Design editor page
  /community    - Community gallery
  /wrap/[id]    - Wrap detail page
/components    - React components
/lib           - Utilities and types
/public        - Static assets (models, UV maps)
```

## Notes

- Placeholder car models and UV maps are referenced but not included
- In production, replace in-memory storage with a proper database
- Add actual GLB/OBJ model files to `/public/models`
- Add UV texture maps to `/public/uvmaps`









