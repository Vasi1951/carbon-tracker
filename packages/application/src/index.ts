import type { CarbonFootprintRecord } from '@carbon-tracker/shared-types';
import { CarbonFootprintCalculator } from '@carbon-tracker/domain';

// Port Interfaces
export * from './ports/IActivityRepository';
export * from './ports/IEmissionFactorRepository';
export * from './ports/IUserGoalRepository';
export * from './ports/ICacheService';
export * from './ports/IEventBus';
export * from './ports/IInsightsProvider';

// Use Cases
export * from './use-cases/RecordActivityUseCase';
export * from './use-cases/GetUserDashboardUseCase';
export * from './use-cases/SetCarbonGoalUseCase';

// Legacy Port (Backwards Compatibility)
export interface CarbonRepository {
  save(record: CarbonFootprintRecord): Promise<void>;
  findById(id: string): Promise<CarbonFootprintRecord | null>;
}

// Legacy Use Case (Backwards Compatibility)
export class TrackCarbonFootprint {
  constructor(private readonly repository: CarbonRepository) {}

  public async execute(amount: number, activity: string): Promise<CarbonFootprintRecord> {
    const calculator = new CarbonFootprintCalculator();
    const calculatedAmount = calculator.calculate({ amount, activity });
    const record: CarbonFootprintRecord = {
      id: 'mock-id-123',
      amount: calculatedAmount,
      activity,
      createdAt: new Date(),
    };
    await this.repository.save(record);
    return record;
  }
}
