const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const PREVIEW_DIR = path.join(__dirname, 'preview');

app.use(cors({
  origin: 'https://frontend-i-coder.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Serve static preview files
app.use('/preview', express.static(PREVIEW_DIR));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Backend is running', endpoints: ['/api/execute', '/api/save-preview', '/api/sync-files'] });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Ensure preview directory exists
if (!fs.existsSync(PREVIEW_DIR)) {
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
}

app.post('/api/execute', (req, res) => {
  const { command, workingDir } = req.body;
  
  if (!command) {
    return res.json({ error: 'No command provided' });
  }

  const cwd = workingDir || path.join(__dirname, 'preview');
  
  exec(command, { cwd, timeout: 30000 }, (error, stdout, stderr) => {
    const output = stdout || stderr || (error ? error.message : 'Command executed');
    
    res.json({
      output: output,
      success: !error,
      cwd: cwd
    });
  });
});

// Save files for preview
app.post('/api/save-preview', (req, res) => {
  const { files, clearFirst } = req.body;
  
  try {
    // Always clear preview directory first
    if (clearFirst) {
      if (fs.existsSync(PREVIEW_DIR)) {
        fs.rmSync(PREVIEW_DIR, { recursive: true, force: true });
      }
      fs.mkdirSync(PREVIEW_DIR, { recursive: true });
    }
    
    // Always save files to preview directory
    if (files && Array.isArray(files)) {
      files.forEach(file => {
        if (file && file.name && typeof file.content === 'string') {
          const filePath = path.join(PREVIEW_DIR, file.name);
          const fileDir = path.dirname(filePath);
          if (!fs.existsSync(fileDir)) {
            fs.mkdirSync(fileDir, { recursive: true });
          }
          fs.writeFileSync(filePath, file.content);
        }
      });
    }
    
    res.json({ success: true, previewUrl: `https://bckend-for-i-coder-production.up.railway.app/preview/index.html` });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// File sync endpoint
app.post('/api/sync-files', (req, res) => {
  const { files } = req.body;
  
  try {
    const workspaceDir = path.join(__dirname, 'workspace');
    if (!fs.existsSync(workspaceDir)) {
      fs.mkdirSync(workspaceDir, { recursive: true });
    }
    
    if (files && Array.isArray(files)) {
      files.forEach(file => {
        if (file && file.name && typeof file.content === 'string') {
          const filePath = path.join(workspaceDir, file.name);
          fs.writeFileSync(filePath, file.content);
        }
      });
    }
    
    res.json({ success: true, message: 'Files synced' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Command execution server running on port ${PORT}`);
});