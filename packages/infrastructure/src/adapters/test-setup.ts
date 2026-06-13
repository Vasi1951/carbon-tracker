import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { RedisCacheService } from './RedisCacheService';
import { beforeAll, afterAll } from 'vitest';

export async function setupTestContainers(): Promise<{ pgContainer: StartedPostgreSqlContainer; redisContainer: StartedRedisContainer; prisma: PrismaClient; cache: RedisCacheService }> {
  const pgContainer = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('carbon_tracker')
    .withUsername('postgres')
    .withPassword('password')
    .start();

  const pgUrl = pgContainer.getConnectionUri();
  process.env.DATABASE_URL = pgUrl;

  const path = require('path');
  const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');
  execSync(`npx prisma db push --schema ${schemaPath}`, {
    env: { ...process.env, DATABASE_URL: pgUrl },
  });

  const prisma = new PrismaClient({ datasources: { db: { url: pgUrl } } });

  const redisContainer = await new RedisContainer('redis:7-alpine').start();
  const redisUrl = `redis://${redisContainer.getHost()}:${String(redisContainer.getMappedPort(6379))}`;
  const cache = new RedisCacheService(redisUrl);

  return { pgContainer, redisContainer, prisma, cache };
}

export async function teardownTestContainers(
  pgContainer?: StartedPostgreSqlContainer,
  redisContainer?: StartedRedisContainer,
  prisma?: PrismaClient,
  cache?: RedisCacheService
): Promise<void> {
  if (prisma) await prisma.$disconnect();
  if (cache) await cache.disconnect();
  if (pgContainer) await pgContainer.stop();
  if (redisContainer) await redisContainer.stop();
}

export function useTestContainers() {
  const context: {
    pgContainer?: StartedPostgreSqlContainer;
    redisContainer?: StartedRedisContainer;
    prisma?: PrismaClient;
    cache?: RedisCacheService;
  } = {};

  beforeAll(async () => {
    const setup = await setupTestContainers();
    context.pgContainer = setup.pgContainer;
    context.redisContainer = setup.redisContainer;
    context.prisma = setup.prisma;
    context.cache = setup.cache;
  }, 180000);

  afterAll(async () => {
    await teardownTestContainers(context.pgContainer, context.redisContainer, context.prisma, context.cache);
  });

  return context as Required<typeof context>;
}
