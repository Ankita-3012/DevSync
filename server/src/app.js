const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');
const roomRoutes = require('./routes/roomRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// health check route — proves the server is alive, useful for deploy checks later
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use(errorHandler);
app.use('/api/rooms', roomRoutes);

module.exports = app;