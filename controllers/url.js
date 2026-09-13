const prisma = require('../prisma/client');
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

  const createdUrl = await prisma.url.create({
  data: {
    redirectURL: originalURL,
  },
});

const shortId = encodeBase62(Number(createdUrl.id));

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
}

async function handleRedirectShortURL(req, res) {
  const { shortId } = req.params;

  try {

    // 1. Check Redis first
    const cachedURL = await redisClient.get(shortId);

    if (cachedURL) {
      console.log("CACHE HIT:", shortId);

      // Increment clicks in DB
      await prisma.url.update({
        where: {
          shortId,
        },
        data: {
          clicks: {
            increment: 1,
          },
        },
      });

      return res.redirect(cachedURL);
    }

    console.log("CACHE MISS:", shortId);

    // 2. Query Postgres
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

    // 3. Store in Redis for 1 hour
    await redisClient.set(
      shortId,
      existingURL.redirectURL,
      {
        EX: 3600,
      }
    );

    // 4. Increment clicks
    await prisma.url.update({
      where: {
        shortId,
      },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });

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

  return res.json({
    shortId,
    redirectURL: existingURL.redirectURL,
    totalClicks: existingURL.clicks,
  });
}

module.exports = {
    handleGenerateShortURL,
    handleRedirectShortURL,
    handleGetAnalytics
};