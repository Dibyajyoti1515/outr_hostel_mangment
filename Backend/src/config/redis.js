const Redis = require('ioredis');
const logger = require('../utils/logger');

let redis;

const getRedis = () => {
    if (!redis) {
        redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            retryStrategy: (times) => {
                if (times > 3) {
                    logger.warn('Redis retry limit reached, falling back to DB');
                    return null;
                }
                return Math.min(times * 50, 2000);
            },
        });

        redis.on('connect', () => logger.info('Redis connected'));
        redis.on('error', (err) => logger.warn('Redis error (non-fatal):', err.message));
    }
    return redis;
};

// Safe get with fallback
const cacheGet = async (key) => {
    try {
        const r = getRedis();
        return await r.get(key);
    } catch {
        return null;
    }
};

const cacheSet = async (key, value, ttlSeconds = 300) => {
    try {
        const r = getRedis();
        await r.setex(key, ttlSeconds, value);
    } catch {
        // non-fatal
    }
};

const cacheDel = async (...keys) => {
    try {
        const r = getRedis();
        await r.del(...keys);
    } catch {
        // non-fatal
    }
};

module.exports = { getRedis, cacheGet, cacheSet, cacheDel };