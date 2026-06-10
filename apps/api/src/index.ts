import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import {
  RedisCacheService,
  CloudPubSubEventBus,
  GeminiInsightsAdapter,
} from '@carbon-tracker/infrastructure';
import { createRouter } from './routes';
import { responseTimerMiddleware } from './middlewares/responseTimer.middleware';
import { authMiddleware } from './middlewares/auth.middleware';
import { createRateLimiter } from './middlewares/rateLimiter.middleware';
import { TrackCarbonFootprint } from '@carbon-tracker/application';
import { PrismaCarbonRepository } from '@carbon-tracker/infrastructure';

const app = express();

app.use(helmet());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(
  compression({
    filter: (req, res) => {
      const type = res.getHeader('Content-Type');
      return type && typeof type === 'string' && type.includes('json')
        ? compression.filter(req, res)
        : false;
    },
  })
);
app.use(express.json());
app.use(responseTimerMiddleware);

const prisma = new PrismaClient();
const cache = new RedisCacheService(process.env.REDIS_URL || 'redis://localhost:6379');
const eventBus = new CloudPubSubEventBus();
const geminiAdapter = new GeminiInsightsAdapter(process.env.GEMINI_API_KEY || 'mock-key');

const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

app.use(createRateLimiter(cache));
app.use(
  '/api/v1',
  authMiddleware(jwtSecret),
  createRouter(prisma, cache, eventBus, geminiAdapter)
);

app.post('/auth/signup', (req, res) => {
  const { email, name } = req.body as { email?: string; name?: string };
  const token = jwt.sign({ id: email || 'user-1', role: 'USER', name: name || 'User' }, jwtSecret);
  res.status(201).json({ token, user: { email, name } });
});

app.post('/auth/login', (req, res) => {
  const { email } = req.body as { email?: string };
  const token = jwt.sign({ id: email || 'user-1', role: 'USER', name: 'User' }, jwtSecret);
  res.json({ token, user: { email, name: 'User' } });
});

const legacyRepo = new PrismaCarbonRepository();
const trackCarbonFootprint = new TrackCarbonFootprint(legacyRepo);
app.post('/track', (req, res) => {
  const { amount, activity } = req.body as { amount: number; activity: string };
  trackCarbonFootprint
    .execute(amount, activity)
    .then((record) => res.status(201).json(record))
    .catch((err: unknown) =>
      res.status(500).json({ error: err instanceof Error ? err.message : 'Internal Server Error' })
    );
});

const port = process.env.PORT ?? 3001;
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.warn(`Server running on port ${String(port)}`);
  });
}

export { app, prisma, cache };
