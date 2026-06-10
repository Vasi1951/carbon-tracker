import { describe, it, expect } from 'vitest';
import { ActivityCategory } from '@carbon-tracker/shared-types';
import {
  PrismaCarbonRepository,
  CloudPubSubEventBus,
  GeminiInsightsAdapter,
  SecretManagerService,
} from './index';

describe('PrismaCarbonRepository (Legacy stub)', () => {
  it('should save and find record', async () => {
    const repo = new PrismaCarbonRepository();
    const record = {
      id: 'legacy-1',
      amount: 120,
      activity: 'driving',
      createdAt: new Date(),
    };
    await repo.save(record);
    const found = await repo.findById('legacy-1');
    expect(found).toEqual(record);

    const missing = await repo.findById('missing');
    expect(missing).toBeNull();
  });
});

describe('CloudPubSubEventBus', () => {
  it('should support in-memory mode when GCP credentials are not found', async () => {
    const bus = new CloudPubSubEventBus();
    const event = {
      type: 'ActivityRecorded' as const,
      payload: { userId: 'user-1', activityId: 'act-1', kgCO2e: 10 },
    };
    await bus.publish(event);
    expect(bus.mockEvents.length).toBe(1);
    expect(bus.mockEvents[0]).toEqual(event);
  });
});

describe('GeminiInsightsAdapter', () => {
  it('should fall back to static tips when apiKey is not set', async () => {
    const adapter = new GeminiInsightsAdapter('mock-key');
    const result = await adapter.generatePersonalizedTips([], []);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.tip).toBeDefined();
      expect(result.value.estimatedSavingKg).toBeGreaterThan(0);
    }
  });
});

describe('SecretManagerService', () => {
  it('should fall back to environment variables when client is not initialized', async () => {
    process.env.TEST_SECRET_VALUE = 'supersecret';
    const service = new SecretManagerService();
    const val = await service.getSecret('TEST_SECRET_VALUE');
    expect(val).toBe('supersecret');
  });

  it('should throw when secret is not found in Secret Manager or environment', async () => {
    const service = new SecretManagerService();
    await expect(service.getSecret('MISSING_SECRET_KEY')).rejects.toThrow();
  });
});
