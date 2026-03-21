const redis = require('redis');
const logger = require('./logger');

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  logger.error('REDIS_URL is not defined.');
  process.exit(1);
}

const redisClient = redis.createClient({
  url: redisUrl,
});

redisClient.on('connect', () => logger.info('Redis Client Connected'));
redisClient.on('error', (err) => logger.error(`Redis Connection Error: ${err}`));

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.error(`Failed to connect to Redis: ${err.message}`);
    process.exit(1);
  }
};

module.exports = { redisClient, connectRedis };