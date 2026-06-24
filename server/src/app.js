const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// health check route — proves the server is alive, useful for deploy checks later
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = app;