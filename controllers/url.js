const prisma = require("../prisma/client");
const encodeBase62 = require("../utils/base62");
const redisClient = require("../redis/client");

async function handleGenerateShortURL(req, res) {
  const originalURL = req.body?.url;

  if (!originalURL) {
    return res.status(400).json({
      error: "redirectURL is required",
    });
  }

  try {
    new URL(originalURL);
  } catch {
    return res.status(400).json({
      error: "Invalid URL format",
    });
  }

  try {
    // Create row first
    const createdUrl = await prisma.url.create({
      data: {
        redirectURL: originalURL,
        shortId: "temp", // temporary value
      },
    });

    // Generate Base62 from DB id
    const shortId = encodeBase62(Number(createdUrl.id));

    // Save actual shortId
    await prisma.url.update({
      where: {
        id: createdUrl.id,
      },
      data: {
        shortId,
      },
    });

    return res.status(201).json({
      id: shortId,
      shortURL: `${req.protocol}://${req.get("host")}/${shortId}`,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
}

async function handleRedirectShortURL(req, res) {
  const { shortId } = req.params;

  try {
    // Check Redis first
    const cachedURL = await redisClient.get(shortId);

    if (cachedURL) {
      console.log("CACHE HIT");

      await redisClient.incr(`clicks:${shortId}`);

      return res.redirect(cachedURL);
    }

    console.log("CACHE MISS");

    // Fetch from Postgres
    const existingURL = await prisma.url.findUnique({
      where: {
        shortId,
      },
    });

    if (!existingURL) {
      return res.status(404).json({
        error: "Short URL not found",
      });
    }

    // Store in Redis for 1 hour
    await redisClient.set(
      shortId,
      existingURL.redirectURL,
      {
        EX: 3600,
      }
    );

    // Increment click counter
    await redisClient.incr(`clicks:${shortId}`);

    return res.redirect(existingURL.redirectURL);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
}

async function handleGetAnalytics(req, res) {
  const { shortId } = req.params;

  try {
    const existingURL = await prisma.url.findUnique({
      where: {
        shortId,
      },
    });

    if (!existingURL) {
      return res.status(404).json({
        error: "Short URL not found",
      });
    }

    const redisClicks =
      await redisClient.get(`clicks:${shortId}`);

    const totalClicks =
      Number(redisClicks || 0);

    return res.json({
      shortId,
      redirectURL: existingURL.redirectURL,
      totalClicks,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
}

module.exports = {
  handleGenerateShortURL,
  handleRedirectShortURL,
  handleGetAnalytics,
};