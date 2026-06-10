import { Request, Response, NextFunction } from 'express';
import { RedisCacheService } from '@carbon-tracker/infrastructure';
import { AuthenticatedRequest } from './auth.middleware';

export function createRateLimiter(cacheService: RedisCacheService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const runLimiter = async (): Promise<void> => {
      const ip = req.ip || 'unknown-ip';
      const ipKey = `rate:ip:${ip}`;
      const ipCount = await incrAndExpire(cacheService, ipKey, 60);

      if (ipCount > 100) {
        res.status(429).json({ error: 'Too many requests per IP' });
        return;
      }

      const user = (req as AuthenticatedRequest).user;
      if (user && user.id) {
        const userKey = `rate:user:${user.id}`;
        const userCount = await incrAndExpire(cacheService, userKey, 60);
        if (userCount > 1000) {
          res.status(429).json({ error: 'Too many requests per user' });
          return;
        }
      }

      next();
    };

    runLimiter().catch((err: unknown) => { next(err); });
  };
}

async function incrAndExpire(cache: RedisCacheService, key: string, ttl: number): Promise<number> {
  const current = await cache.get(key);
  if (!current) {
    await cache.set(key, '1', ttl);
    return 1;
  }
  const nextVal = parseInt(current, 10) + 1;
  await cache.set(key, String(nextVal), ttl);
  return nextVal;
}
