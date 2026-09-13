const { redisClient } = require("../redis/client");

async function rateLimiter(req, res, next) {
  const ip = req.ip;

  const key = `rate:${ip}`;

  const requests = await redisClient.incr(key);

  if (requests === 1) {
    await redisClient.expire(key, 60);
  }

  if (requests > 100) {
    return res.status(429).json({
      error: "Too many requests",
    });
  }

  next();
}

module.exports = rateLimiter;