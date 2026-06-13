import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createRouter } from './index';
import jwt from 'jsonwebtoken';

const testToken = jwt.sign({ id: 'user-1' }, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
import { PrismaClient } from '@prisma/client';
import { RedisCacheService, CloudPubSubEventBus, GeminiInsightsAdapter } from '@carbon-tracker/infrastructure';

// Mock dependencies
const mockPrisma = {
  activity: {
    create: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    aggregate: vi.fn(),
  },
  emissionFactor: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
  },
  userGoal: {
    upsert: vi.fn(),
    findFirst: vi.fn(),
  }
} as unknown as PrismaClient;

const mockCache = {
  get: vi.fn(),
  set: vi.fn(),
} as unknown as RedisCacheService;

const mockEventBus = {
  publish: vi.fn(),
} as unknown as CloudPubSubEventBus;

const mockGemini = {
  generatePersonalizedTips: vi.fn(),
} as unknown as GeminiInsightsAdapter;

const app = express();
app.use(express.json());
app.use('/api/v1', createRouter(mockPrisma, mockCache, mockEventBus, mockGemini));

describe('API Routes Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/activities', () => {
    it('should validate inputs and return 400 for invalid data', async () => {
      const res = await request(app)
        .post('/api/v1/activities')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ amount: -10, category: 'INVALID' }); // Invalid amount and category
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 if emission factor not found', async () => {
      vi.spyOn(mockPrisma.emissionFactor, 'findFirst').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/activities')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          category: 'TRANSPORT',
          amount: 10,
          unit: 'km',
          date: new Date().toISOString(),
          description: 'Driving to work'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Emission factor not found/);
    });
  });

  describe('GET /api/v1/dashboard', () => {
    it('should return 400 for invalid period', async () => {
      const res = await request(app).get('/api/v1/dashboard?period=century').set('Authorization', `Bearer ${testToken}`);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/goals', () => {
    it('should create a goal successfully', async () => {
      vi.spyOn(mockPrisma.userGoal, 'upsert').mockResolvedValue({
        id: '123',
        userId: 'default-user',
        targetKgCO2e: 100,
        timeframe: 'month',
        createdAt: new Date(),
      });

      const res = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ targetKgCO2e: 100, timeframe: 'month' });

      expect(res.status).toBe(201);
      expect(res.body.target).toBe(100);
    });
  });
});
