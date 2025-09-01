const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const PREVIEW_DIR = path.join(__dirname, 'preview');

app.use(cors());
app.use(express.json());

// Serve static preview files
app.use('/preview', express.static(PREVIEW_DIR));

// Ensure preview directory exists
if (!fs.existsSync(PREVIEW_DIR)) {
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
}

app.post('/api/execute', (req, res) => {
  const { command, workingDir } = req.body;
  
  if (!command) {
    return res.json({ error: 'No command provided' });
  }

  let execCommand = command;
  // Add host flag and port for dev commands for Codespaces
  if (command.includes('npm run dev') && !command.includes('--host')) {
    execCommand = command + ' -- --host 0.0.0.0 --port 5174';
  }

  const cwd = workingDir || path.join(__dirname, 'preview');
  
  exec(execCommand, { cwd, timeout: 30000 }, (error, stdout, stderr) => {
    const output = stdout || stderr || (error ? error.message : 'Command executed');
    // Check if this started a dev server and extract port
    let serverUrl = null;
    if (command.includes('npm run dev') && !error) {
      const portMatch = output.match(/localhost:(\d+)/) || output.match(/port\s+(\d+)/);
      const port = portMatch ? portMatch[1] : '5174';
      // Generate Codespaces URL for the port
      serverUrl = `https://${process.env.CODESPACE_NAME}-${port}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`;
    }
    
    res.json({
      output: output,
      success: !error,
      cwd: cwd,
      serverUrl: serverUrl
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
    
    // Always save files to preview directory (for consistency)
    files.forEach(file => {
      const filePath = path.join(PREVIEW_DIR, file.name);
      const fileDir = path.dirname(filePath);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      fs.writeFileSync(filePath, file.content);
    });
    
    res.json({ success: true, previewUrl: `http://localhost:${PORT}/preview/index.html` });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// File sync endpoint
app.post('/api/sync-files', (req, res) => {
  const { files } = req.body;
  
  try {
    const workspaceDir = '/tmp/workspace';
    if (!fs.existsSync(workspaceDir)) {
      fs.mkdirSync(workspaceDir, { recursive: true });
    }
    
    files.forEach(file => {
      const filePath = path.join(workspaceDir, file.name);
      fs.writeFileSync(filePath, file.content);
    });
    
    res.json({ success: true, message: 'Files synced' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Command execution server running on port ${PORT}`);
});