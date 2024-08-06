// server.js
const express = require('express');
const osc = require('node-osc');
const path = require('path');
const app = express();
const port = 3000;

let oscClient;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/api/connect', (req, res) => {
  try {
    const { ip, port } = req.body;
    oscClient = new osc.Client(ip, parseInt(port));
    res.json({ success: true });
  } catch (error) {
    console.error('Error connecting to OSC client:', error);
    res.status(500).json({ success: false, error: 'Failed to connect to OSC client' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

app.post('/api/send', (req, res) => {
  try {
    const { address, value } = req.body;
    if (!oscClient) {
      throw new Error('OSC client not connected');
    }
    if (value === undefined || value === null) {
      throw new Error('Cannot send undefined or null value');
    }
    oscClient.send(address, value);
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending OSC message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
