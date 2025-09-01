# Fast Web Code Editor

A modern web-based code editor with AI integration.

## Structure

- `frontend/` - React/Vite frontend application
- `backend/` - Node.js/Express backend server

## Deployment

### Frontend (Vercel)
```bash
cd frontend
npm install
npm run build
vercel --prod
```

### Backend (Railway)
```bash
cd backend
npm install
npm start
```

## Environment Variables

Frontend:
- `VITE_MISTRAL_API_KEY` - Your Mistral AI API key

## Features

- Real-time code editing
- AI-powered code assistance
- Live preview
- File management
- Terminal integration