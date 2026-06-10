import type { CarbonFootprintRecord } from '@carbon-tracker/shared-types';

export class CarbonFootprintCalculator {
  public calculate(record: Omit<CarbonFootprintRecord, 'id' | 'createdAt'>): number {
    const factor = 1.2;
    return record.amount * factor;
  }
}

export { default as Activity } from './carbon/Activity';
export { default as EmissionFactor } from './carbon/EmissionFactor';
export { default as CarbonFootprint } from './carbon/CarbonFootprint';
export { default as CalculationService } from './carbon/CalculationService';
export { default as ValidationService } from './carbon/ValidationService';
