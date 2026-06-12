import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createRouter } from './index';
import { PrismaClient } from '@prisma/client';
import { RedisCacheService, CloudPubSubEventBus, GeminiInsightsAdapter } from '@carbon-tracker/infrastructure';

// Mock dependencies
const mockPrisma = {
  activity: {
    create: vi.fn(),
    findMany: vi.fn(),
    aggregate: vi.fn(),
  },
  emissionFactor: {
    findUnique: vi.fn(),
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
        .send({ amount: -10, category: 'INVALID' }); // Invalid amount and category
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 if emission factor not found', async () => {
      vi.spyOn(mockPrisma.emissionFactor, 'findUnique').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/activities')
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
      const res = await request(app).get('/api/v1/dashboard?period=century');
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
        .send({ targetKgCO2e: 100, timeframe: 'month' });

      expect(res.status).toBe(201);
      expect(res.body.targetKgCO2e).toBe(100);
    });
  });
});
