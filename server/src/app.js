const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');
const roomRoutes = require('./routes/roomRoutes');
const commentRoutes = require('./routes/commentRoutes');
const aiReviewRoutes = require('./routes/aiReviewRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// health check route — proves the server is alive, useful for deploy checks later
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/rooms/:roomCode/comments', commentRoutes);
app.use('/api/rooms/:roomCode/ai-review', aiReviewRoutes);
app.use(errorHandler);

module.exports = app;