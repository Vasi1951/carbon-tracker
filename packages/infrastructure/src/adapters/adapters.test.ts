import { describe, it, expect } from 'vitest';
import { useTestContainers } from './test-setup';
import { PrismaActivityRepository } from './PrismaActivityRepository';
import { Activity } from '@carbon-tracker/domain';
import { ActivityCategory } from '@carbon-tracker/shared-types';

describe('Infrastructure Integration Tests with Testcontainers', () => {
  const context = useTestContainers();

  it('should save and retrieve activities from PrismaActivityRepository', async () => {
    const { prisma } = context;
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
    const { cache } = context;
    if (!cache) throw new Error('Cache not initialized');
    await cache.set('test-key', 'test-value', 10);
    const val = await cache.get('test-key');
    expect(val).toBe('test-value');

    await cache.del('test-key');
    const valAfter = await cache.get('test-key');
    expect(valAfter).toBeNull();
  });
});
