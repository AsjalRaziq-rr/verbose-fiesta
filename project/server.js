const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Command execution endpoint
app.post('/api/execute', (req, res) => {
  const { command } = req.body;
  
  if (!command) {
    return res.json({ error: 'No command provided' });
  }

  exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
    res.json({
      output: stdout || stderr || (error ? error.message : 'Command executed'),
      success: !error
    });
  });
});

app.listen(PORT, () => {
  console.log(`Command execution server running on port ${PORT}`);
});