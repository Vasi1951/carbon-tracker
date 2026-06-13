import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { PrismaClient } from '@prisma/client';
import {
  RedisCacheService,
  CloudPubSubEventBus,
  GeminiInsightsAdapter,
} from '@carbon-tracker/infrastructure';
import { createRouter } from './routes';
import { responseTimerMiddleware } from './middlewares/responseTimer.middleware';
import { createRateLimiter } from './middlewares/rateLimiter.middleware';

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  },
}));
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:3000', 'https://carbon-web-663154056506.us-central1.run.app'];
app.use(cors({ origin: allowedOrigins }));
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

import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
app.use(
  '/api/v1',
  createRouter(prisma, cache, eventBus, geminiAdapter)
);

const port = process.env.PORT ?? 3001;
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.warn(`Server running on port ${String(port)}`);
  });
}

export { app, prisma, cache };
