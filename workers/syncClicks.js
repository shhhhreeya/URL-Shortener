const prisma = require("../prisma/client");
const redisClient = require("../redis/client");

async function syncClicks() {
  try {
    const keys = await redisClient.keys("clicks:*");

    console.log(`Found ${keys.length} click counters`);

    for (const key of keys) {
      const shortId = key.replace("clicks:", "");

      const clicks = Number(
        await redisClient.get(key)
      );

      if (!clicks) continue;

      await prisma.url.update({
        where: {
          shortId,
        },
        data: {
          clicks: {
            increment: clicks,
          },
        },
      });

      await redisClient.del(key);

      console.log(
        `Synced ${clicks} clicks for ${shortId}`
      );
    }
  } catch (error) {
    console.error(error);
  }
}

module.exports = syncClicks;