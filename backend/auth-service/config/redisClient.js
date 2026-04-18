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

const acquireLock = async (key, ttlSeconds = 10) => {
  const result = await redisClient.set(`lock:${key}`, '1', {
    NX: true,
    EX: ttlSeconds,
  });
  return result === 'OK';
};

const releaseLock = async (key) => {
  await redisClient.del(`lock:${key}`);
};

module.exports = { redisClient, connectRedis, acquireLock, releaseLock };