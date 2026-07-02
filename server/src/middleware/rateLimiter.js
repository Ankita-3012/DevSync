const requests = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;       // 5 AI review calls per user per minute

const rateLimiter = (req, res, next) => {
  const userId = req.user.userId;
  const now = Date.now();
  const userRequests = requests.get(userId) || [];

  const recent = userRequests.filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    return res.status(429).json({ message: 'Too many requests — please wait before requesting another review' });
  }

  recent.push(now);
  requests.set(userId, recent);
  next();
};

module.exports = { rateLimiter };