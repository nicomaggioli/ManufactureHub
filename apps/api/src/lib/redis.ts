import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

const connection: IORedis | null = redisUrl
  ? new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    })
  : null;

if (connection) {
  connection.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  connection.on('connect', () => {
    console.log('[Redis] Connected');
  });
} else {
  console.log('[Redis] REDIS_URL not set – running without Redis');
}

export default connection;
