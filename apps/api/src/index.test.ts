import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';
import { execSync } from 'child_process';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { RedisCacheService } from '@carbon-tracker/infrastructure';

let pgContainer: StartedPostgreSqlContainer | undefined;
let redisContainer: StartedRedisContainer | undefined;
let app: Express | undefined;
let prisma: PrismaClient | undefined;
let cache: RedisCacheService | undefined;

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const testToken = jwt.sign({ id: 'user-1', role: 'USER' }, JWT_SECRET);

beforeAll(async () => {
  pgContainer = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('carbon_tracker_api')
    .withUsername('postgres')
    .withPassword('password')
    .start();

  const pgUrl = pgContainer.getConnectionUri();
  process.env.DATABASE_URL = pgUrl;

  execSync('npx prisma db push --schema ../../packages/infrastructure/prisma/schema.prisma', {
    env: { ...process.env, DATABASE_URL: pgUrl },
  });

  redisContainer = await new RedisContainer('redis:7-alpine').start();
  const redisUrl = `redis://${redisContainer.getHost()}:${String(redisContainer.getMappedPort(6379))}`;
  process.env.REDIS_URL = redisUrl;

  const mod = (await import('./index.js')) as {
    app: Express;
    prisma: PrismaClient;
    cache: RedisCacheService;
  };
  app = mod.app;
  prisma = mod.prisma;
  cache = mod.cache;

  await prisma.emissionFactor.create({
    data: {
      category: 'TRANSPORT',
      co2ePerUnit: 0.25,
      source: 'EPA',
      region: 'US',
      year: 2024,
    },
  });
}, 90000);

beforeEach(async () => {
  if (prisma) {
    await prisma.activity.deleteMany();
    await prisma.userGoal.deleteMany();
  }
  if (cache) {
    await cache.del('factors:all');
    await cache.del('rate:ip:127.0.0.1');
    await cache.del('rate:ip:::ffff:127.0.0.1');
    await cache.del('rate:ip:::1');
    await cache.del('rate:user:user-1');
  }
});

afterAll(async () => {
  if (prisma) await prisma.$disconnect();
  if (cache) await cache.disconnect();
  if (pgContainer) await pgContainer.stop();
  if (redisContainer) await redisContainer.stop();
});

describe('REST API Authentication Middleware', () => {
  it('should return 401 when Authorization header is missing', async () => {
    if (!app) throw new Error('App not initialized');
    const res = await request(app).get('/api/v1/dashboard');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized: Missing token' });
  });

  it('should return 401 when token is invalid', async () => {
    if (!app) throw new Error('App not initialized');
    const res = await request(app)
      .get('/api/v1/dashboard')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized: Invalid token' });
  });
});

describe('REST API Rate Limiter', () => {
  it('should enforce 100 req/min rate limit and return 429 when exceeded', async () => {
    if (!app || !cache) throw new Error('App or cache not initialized');
    await cache.set('rate:ip:127.0.0.1', '101', 60);
    await cache.set('rate:ip:::ffff:127.0.0.1', '101', 60);
    await cache.set('rate:ip:::1', '101', 60);

    const res = await request(app)
      .get('/api/v1/dashboard')
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: 'Too many requests per IP' });
  });
});

describe('REST API Endpoints', () => {
  it('should record an activity via POST /api/v1/activities', async () => {
    if (!app) throw new Error('App not initialized');
    const payload = {
      category: 'TRANSPORT',
      amount: 15,
      unit: 'km',
      date: new Date().toISOString(),
      description: 'Commute',
    };

    const res = await request(app)
      .post('/api/v1/activities')
      .set('Authorization', `Bearer ${testToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect((res.body as Record<string, unknown>).activityId).toBeDefined();
    expect((res.body as Record<string, unknown>).kgCO2e).toBeDefined();
  });

  it('should fail recording activity on invalid schema (negative amount)', async () => {
    if (!app) throw new Error('App not initialized');
    const payload = {
      category: 'TRANSPORT',
      amount: -10,
      unit: 'km',
      date: new Date().toISOString(),
      description: 'Commute',
    };

    const res = await request(app)
      .post('/api/v1/activities')
      .set('Authorization', `Bearer ${testToken}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('should return dashboard data via GET /api/v1/dashboard', async () => {
    if (!app) throw new Error('App not initialized');
    const res = await request(app)
      .get('/api/v1/dashboard')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect((res.body as Record<string, unknown>).totalKgCO2e).toBeDefined();
    expect((res.body as Record<string, unknown>).breakdown).toBeDefined();
    expect((res.body as Record<string, unknown>).trend).toBeDefined();
  });

  it('should set carbon goal via POST /api/v1/goals', async () => {
    if (!app) throw new Error('App not initialized');
    const payload = {
      targetKgCO2e: 120,
      timeframe: 'month',
    };

    const res = await request(app)
      .post('/api/v1/goals')
      .set('Authorization', `Bearer ${testToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect((res.body as Record<string, unknown>).goalId).toBeDefined();
    expect((res.body as Record<string, unknown>).target).toBe(120);
    expect((res.body as Record<string, unknown>).projectedDate).toBeDefined();
  });

  it('should return insights tips via GET /api/v1/insights', async () => {
    if (!app) throw new Error('App not initialized');
    const res = await request(app)
      .get('/api/v1/insights')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect((res.body as Record<string, unknown>).tip).toBeDefined();
    expect((res.body as Record<string, unknown>).estimatedSavingKg).toBeDefined();
  });

  it('should list emission factors via GET /api/v1/factors', async () => {
    if (!app) throw new Error('App not initialized');
    const res = await request(app)
      .get('/api/v1/factors')
      .set('Authorization', `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect((res.body as unknown[]).length).toBeGreaterThan(0);
  });
});
