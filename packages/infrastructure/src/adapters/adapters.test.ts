import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { PrismaActivityRepository } from './PrismaActivityRepository';
import { RedisCacheService } from './RedisCacheService';
import { Activity } from '@carbon-tracker/domain';
import { ActivityCategory } from '@carbon-tracker/shared-types';

describe('Infrastructure Integration Tests with Testcontainers', () => {
  let pgContainer: StartedPostgreSqlContainer | undefined;
  let redisContainer: StartedRedisContainer | undefined;
  let prisma: PrismaClient | undefined;
  let cache: RedisCacheService | undefined;

  beforeAll(async () => {
    pgContainer = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('carbon_tracker')
      .withUsername('postgres')
      .withPassword('password')
      .start();

    const pgUrl = pgContainer.getConnectionUri();
    process.env.DATABASE_URL = pgUrl;

    execSync('npx prisma db push --schema prisma/schema.prisma', {
      env: { ...process.env, DATABASE_URL: pgUrl },
    });

    prisma = new PrismaClient({ datasources: { db: { url: pgUrl } } });

    redisContainer = await new RedisContainer('redis:7-alpine').start();
    const redisUrl = `redis://${redisContainer.getHost()}:${String(redisContainer.getMappedPort(6379))}`;
    cache = new RedisCacheService(redisUrl);
  }, 180000);

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
    if (cache) await cache.disconnect();
    if (pgContainer) await pgContainer.stop();
    if (redisContainer) await redisContainer.stop();
  });

  it('should save and retrieve activities from PrismaActivityRepository', async () => {
    if (!prisma) throw new Error('Prisma not initialized');
    const repo = new PrismaActivityRepository(prisma);
    const act = new Activity(
      '00000000-0000-0000-0000-000000000001',
      ActivityCategory.TRANSPORT,
      12.5,
      'km',
      new Date().toISOString(),
      'Test Drive'
    );
    (act as unknown as Record<string, unknown>).userId = 'user-test';

    await repo.save(act);

    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 1);
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 1);

    const found = await repo.findByUserAndPeriod('user-test', periodStart, periodEnd);
    expect(found.length).toBe(1);
    expect(found[0].description).toBe('Test Drive');

    await repo.delete(act.id);
    const foundAfter = await repo.findByUserAndPeriod('user-test', periodStart, periodEnd);
    expect(foundAfter.length).toBe(0);
  });

  it('should set and get values from RedisCacheService', async () => {
    if (!cache) throw new Error('Cache not initialized');
    await cache.set('test-key', 'test-value', 10);
    const val = await cache.get('test-key');
    expect(val).toBe('test-value');

    await cache.del('test-key');
    const valAfter = await cache.get('test-key');
    expect(valAfter).toBeNull();
  });
});
