import { describe, it, expect } from 'vitest';
import { ActivityCategory } from '@carbon-tracker/shared-types';
import Activity from './Activity';
import EmissionFactor from './EmissionFactor';
import CarbonFootprint from './CarbonFootprint';
import CalculationService from './CalculationService';
import ValidationService from './ValidationService';
import { VALID_UUID, createTestActivity, createTestFactor } from './test-utils';

describe('Activity Entity', () => {
  it('should create a valid Activity instance', () => {
    const activity = createTestActivity();
    expect(activity).toBeDefined();
    expect(activity.isValidDateRange('2020-01-01', '2030-01-01')).toBe(true);
  });

  it('should throw error for non-positive amount', () => {
    expect(() => createTestActivity({ amount: 0 })).toThrow('Amount must be positive');
    expect(() => createTestActivity({ amount: -1 })).toThrow('Amount must be positive');
  });

  it('should throw error for future date', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString();
    expect(() => createTestActivity({ date: futureDate })).toThrow('Date cannot be in the future');
  });

  it('should throw error for invalid date format', () => {
    expect(() => createTestActivity({ date: 'invalid-date' })).toThrow('Invalid ISO Date');
  });

  it('should throw error for invalid UUID', () => {
    expect(() => createTestActivity({ id: 'invalid-uuid' })).toThrow('Invalid UUID');
  });

  it('should throw error for empty unit or description', () => {
    expect(() => createTestActivity({ unit: '' })).toThrow('Unit is required');
    expect(() => createTestActivity({ description: '' })).toThrow('Description is required');
  });
});

describe('EmissionFactor Value Object', () => {
  it('should create a valid EmissionFactor instance', () => {
    const factor = createTestFactor();
    expect(factor).toBeDefined();
    expect(factor.toString()).toContain('TRANSPORT:0.12kgCO2e/unit');
  });

  it('should throw for invalid CO2e unit', () => {
    expect(() => createTestFactor({ co2ePerUnit: -0.01 })).toThrow('CO2e per unit must be non-negative');
  });

  it('should throw for invalid year', () => {
    expect(() => createTestFactor({ year: 1999 })).toThrow('Year must be between 2000 and 2030');
    expect(() => createTestFactor({ year: 2031 })).toThrow('Year must be between 2000 and 2030');
  });

  it('should throw for empty source or region', () => {
    expect(() => createTestFactor({ source: '' })).toThrow('Source is required');
    expect(() => createTestFactor({ region: ' ' })).toThrow('Region is required');
  });

  it('should compare equality correctly', () => {
    const factor1 = createTestFactor();
    const factor2 = createTestFactor();
    const factor3 = createTestFactor({ co2ePerUnit: 0.15 });
    expect(factor1.equals(factor2)).toBe(true);
    expect(factor1.equals(factor3)).toBe(false);
  });
});

describe('CalculationService', () => {
  const service = new CalculationService();

  it('should calculate transport footprint correctly with 2 decimal precision', () => {
    const activity = createTestActivity({ amount: 12.345 });
    const factor = createTestFactor({ co2ePerUnit: 0.123 });
    const result = service.calculate(activity, factor);
    expect(result).toBe(1.52);
  });

  it('should throw if category mismatch', () => {
    const activity = createTestActivity();
    const factor = createTestFactor({ category: ActivityCategory.FOOD });
    expect(() => service.calculate(activity, factor)).toThrow('Activity category and factor category must match');
  });

  it('should handle massive numbers correctly', () => {
    const activity = createTestActivity({ amount: 1e9 });
    const factor = createTestFactor({ co2ePerUnit: 1.5 });
    expect(service.calculate(activity, factor)).toBe(1.5e9);
  });

  it('should perform batch calculate', () => {
    const act1 = createTestActivity();
    const act2 = createTestActivity({ id: '223e4567-e89b-12d3-a456-426614174001', category: ActivityCategory.FOOD, amount: 5 });
    const factor1 = createTestFactor();
    const factor2 = createTestFactor({ category: ActivityCategory.FOOD, co2ePerUnit: 2.5 });

    const map = new Map<string, EmissionFactor>();
    map.set(ActivityCategory.TRANSPORT, factor1);
    map.set(ActivityCategory.FOOD, factor2);

    const footprint = service.batchCalculate([act1, act2], map);
    expect(footprint.totalKgCO2e).toBe(13.7);
  });

  it('should throw in batch calculate if factor missing', () => {
    const act1 = createTestActivity();
    const map = new Map<string, EmissionFactor>();
    expect(() => service.batchCalculate([act1], map)).toThrow('Missing factor for category: TRANSPORT');
  });
});

describe('CarbonFootprint Aggregate Root', () => {
  const setupFootprint = (factorOptions?: any) => {
    const footprint = new CarbonFootprint();
    const act = createTestActivity();
    const factor = createTestFactor(factorOptions);
    return { footprint, act, factor };
  };

  it('should add and remove activities and maintain totals', () => {
    const { footprint, act, factor } = setupFootprint();

    footprint.addActivity(act, factor);
    expect(footprint.totalKgCO2e).toBe(1.2);

    expect(() => {
      footprint.addActivity(act, factor);
    }).toThrow('Activity already exists in footprint');

    footprint.removeActivity(act.id);
    expect(footprint.totalKgCO2e).toBe(0);

    expect(() => {
      footprint.removeActivity(act.id);
    }).toThrow('Activity not found in footprint');
  });

  it('should throw if activity and factor category mismatch', () => {
    const { footprint, act, factor } = setupFootprint({ category: ActivityCategory.FOOD });
    expect(() => {
      footprint.addActivity(act, factor);
    }).toThrow('Activity category and factor category must match');
  });

  it('should throw if recalculating with a missing factor', () => {
    const { footprint, act } = setupFootprint();
    footprint.activities.push(act);
    expect(() => {
      footprint.recalculate();
    }).toThrow('Missing emission factor for activity');
  });
});

describe('ValidationService', () => {
  const service = new ValidationService();

  it('should parse valid input into Activity', () => {
    const payload = {
      id: VALID_UUID,
      category: 'TRANSPORT',
      amount: 15.5,
      unit: 'liters',
      date: new Date().toISOString(),
      description: 'Fuel refuel',
    };
    const activity = service.validateActivityInput(payload);
    expect(activity).toBeDefined();
    expect(activity.amount).toBe(15.5);
  });

  it('should throw for invalid payload input', () => {
    const payload = {
      id: 'invalid-uuid',
      category: 'TRANSPORT',
      amount: -10,
      unit: '',
      date: 'invalid-date',
      description: '',
    };
    expect(() => service.validateActivityInput(payload)).toThrow();
  });
});

describe('Property-Based Test (Random valid generators)', () => {
  const service = new CalculationService();

  it('should assert that calculated values are always positive for random valid parameters', () => {
    for (let i = 0; i < 50; i++) {
      const amount = Math.random() * 1000 + 0.1;
      const co2ePerUnit = Math.random() * 5;
      const activity = createTestActivity({ amount });
      const factor = createTestFactor({ co2ePerUnit });
      const calculated = service.calculate(activity, factor);
      expect(calculated).toBeGreaterThanOrEqual(0);
    }
  });
});
