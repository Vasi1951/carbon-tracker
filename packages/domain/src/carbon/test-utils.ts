import { ActivityCategory } from '@carbon-tracker/shared-types';
import Activity from './Activity';
import EmissionFactor from './EmissionFactor';

export const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

export function createTestActivity(overrides?: Partial<{ id: string; category: ActivityCategory; amount: number; unit: string; date: string; description: string }>): Activity {
  return new Activity(
    overrides?.id ?? VALID_UUID,
    overrides?.category ?? ActivityCategory.TRANSPORT,
    overrides?.amount ?? 10,
    overrides?.unit ?? 'km',
    overrides?.date ?? new Date().toISOString(),
    overrides?.description ?? 'test description'
  );
}

export function createTestFactor(overrides?: Partial<{ co2ePerUnit: number; source: string; region: string; year: number; category: ActivityCategory }>): EmissionFactor {
  return new EmissionFactor(
    overrides?.co2ePerUnit ?? 0.12,
    overrides?.source ?? 'EPA',
    overrides?.region ?? 'US',
    overrides?.year ?? 2024,
    overrides?.category ?? ActivityCategory.TRANSPORT
  );
}
