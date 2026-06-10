import type { CarbonFootprintRecord } from '@carbon-tracker/shared-types';
import type { CarbonRepository } from '@carbon-tracker/application';

// Legacy Port Adapter (Backwards Compatibility)
export class PrismaCarbonRepository implements CarbonRepository {
  private readonly records = new Map<string, CarbonFootprintRecord>();

  public save(record: CarbonFootprintRecord): Promise<void> {
    this.records.set(record.id, record);
    return Promise.resolve();
  }

  public findById(id: string): Promise<CarbonFootprintRecord | null> {
    return Promise.resolve(this.records.get(id) ?? null);
  }
}

// Adapters
export * from './adapters/PrismaActivityRepository';
export * from './adapters/PrismaEmissionFactorRepository';
export * from './adapters/PrismaUserGoalRepository';
export * from './adapters/RedisCacheService';
export * from './adapters/CloudPubSubEventBus';
export * from './adapters/GeminiInsightsAdapter';

// Services
export * from './services/SecretManagerService';
