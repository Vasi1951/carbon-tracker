import { describe, it, expect } from 'vitest';
import { ActivityCategory } from '@carbon-tracker/shared-types';
import Activity from './Activity';
import EmissionFactor from './EmissionFactor';
import CarbonFootprint from './CarbonFootprint';
import CalculationService from './CalculationService';
import ValidationService from './ValidationService';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

describe('Activity Entity', () => {
  it('should create a valid Activity instance', () => {
    const activity = new Activity(
      VALID_UUID,
      ActivityCategory.TRANSPORT,
      10,
      'km',
      new Date().toISOString(),
      'Commute to office'
    );
    expect(activity).toBeDefined();
    expect(activity.isValidDateRange('2020-01-01', '2030-01-01')).toBe(true);
  });

  it('should throw error for non-positive amount', () => {
    expect(
      () =>
        new Activity(VALID_UUID, ActivityCategory.TRANSPORT, 0, 'km', new Date().toISOString(), 'x')
    ).toThrow('Amount must be positive');
    expect(
      () =>
        new Activity(
          VALID_UUID,
          ActivityCategory.TRANSPORT,
          -1,
          'km',
          new Date().toISOString(),
          'x'
        )
    ).toThrow('Amount must be positive');
  });

  it('should throw error for future date', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    expect(
      () => new Activity(VALID_UUID, ActivityCategory.TRANSPORT, 10, 'km', futureDate, 'x')
    ).toThrow('Date cannot be in the future');
  });

  it('should throw error for invalid date format', () => {
    expect(
      () => new Activity(VALID_UUID, ActivityCategory.TRANSPORT, 10, 'km', 'invalid-date', 'x')
    ).toThrow('Invalid ISO Date');
  });

  it('should throw error for invalid UUID', () => {
    expect(
      () =>
        new Activity(
          'invalid-uuid',
          ActivityCategory.TRANSPORT,
          10,
          'km',
          new Date().toISOString(),
          'x'
        )
    ).toThrow('Invalid UUID');
  });

  it('should throw error for empty unit or description', () => {
    expect(
      () =>
        new Activity(VALID_UUID, ActivityCategory.TRANSPORT, 10, '', new Date().toISOString(), 'x')
    ).toThrow('Unit is required');
    expect(
      () =>
        new Activity(VALID_UUID, ActivityCategory.TRANSPORT, 10, 'km', new Date().toISOString(), '')
    ).toThrow('Description is required');
  });
});

describe('EmissionFactor Value Object', () => {
  it('should create a valid EmissionFactor instance', () => {
    const factor = new EmissionFactor(0.12, 'EPA', 'US', 2024, ActivityCategory.TRANSPORT);
    expect(factor).toBeDefined();
    expect(factor.toString()).toContain('TRANSPORT:0.12kgCO2e/unit');
  });

  it('should throw for invalid CO2e unit', () => {
    expect(() => new EmissionFactor(-0.01, 'EPA', 'US', 2024, ActivityCategory.TRANSPORT)).toThrow(
      'CO2e per unit must be non-negative'
    );
  });

  it('should throw for invalid year', () => {
    expect(() => new EmissionFactor(0.1, 'EPA', 'US', 1999, ActivityCategory.TRANSPORT)).toThrow(
      'Year must be between 2000 and 2030'
    );
    expect(() => new EmissionFactor(0.1, 'EPA', 'US', 2031, ActivityCategory.TRANSPORT)).toThrow(
      'Year must be between 2000 and 2030'
    );
  });

  it('should throw for empty source or region', () => {
    expect(() => new EmissionFactor(0.1, '', 'US', 2024, ActivityCategory.TRANSPORT)).toThrow(
      'Source is required'
    );
    expect(() => new EmissionFactor(0.1, 'EPA', ' ', 2024, ActivityCategory.TRANSPORT)).toThrow(
      'Region is required'
    );
  });

  it('should compare equality correctly', () => {
    const factor1 = new EmissionFactor(0.12, 'EPA', 'US', 2024, ActivityCategory.TRANSPORT);
    const factor2 = new EmissionFactor(0.12, 'EPA', 'US', 2024, ActivityCategory.TRANSPORT);
    const factor3 = new EmissionFactor(0.15, 'EPA', 'US', 2024, ActivityCategory.TRANSPORT);
    expect(factor1.equals(factor2)).toBe(true);
    expect(factor1.equals(factor3)).toBe(false);
  });
});

describe('CalculationService', () => {
  const service = new CalculationService();

  it('should calculate transport footprint correctly with 2 decimal precision', () => {
    const activity = new Activity(
      VALID_UUID,
      ActivityCategory.TRANSPORT,
      12.345,
      'km',
      new Date().toISOString(),
      'x'
    );
    const factor = new EmissionFactor(0.123, 'EPA', 'US', 2024, ActivityCategory.TRANSPORT);
    const result = service.calculate(activity, factor);
    expect(result).toBe(1.52);
  });

  it('should throw if category mismatch', () => {
    const activity = new Activity(
      VALID_UUID,
      ActivityCategory.TRANSPORT,
      10,
      'km',
      new Date().toISOString(),
      'x'
    );
    const factor = new EmissionFactor(0.1, 'EPA', 'US', 2024, ActivityCategory.FOOD);
    expect(() => service.calculate(activity, factor)).toThrow(
      'Activity category and factor category must match'
    );
  });

  it('should handle massive numbers correctly', () => {
    const activity = new Activity(
      VALID_UUID,
      ActivityCategory.TRANSPORT,
      1e9,
      'km',
      new Date().toISOString(),
      'x'
    );
    const factor = new EmissionFactor(1.5, 'EPA', 'US', 2024, ActivityCategory.TRANSPORT);
    expect(service.calculate(activity, factor)).toBe(1.5e9);
  });

  it('should perform batch calculate', () => {
    const act1 = new Activity(
      VALID_UUID,
      ActivityCategory.TRANSPORT,
      10,
      'km',
      new Date().toISOString(),
      'x'
    );
    const act2 = new Activity(
      '223e4567-e89b-12d3-a456-426614174001',
      ActivityCategory.FOOD,
      5,
      'kg',
      new Date().toISOString(),
      'y'
    );

    const factor1 = new EmissionFactor(0.12, 'EPA', 'US', 2024, ActivityCategory.TRANSPORT);
    const factor2 = new EmissionFactor(2.5, 'EPA', 'US', 2024, ActivityCategory.FOOD);

    const map = new Map<string, EmissionFactor>();
    map.set(ActivityCategory.TRANSPORT, factor1);
    map.set(ActivityCategory.FOOD, factor2);

    const footprint = service.batchCalculate([act1, act2], map);
    expect(footprint.totalKgCO2e).toBe(13.7);
  });

  it('should throw in batch calculate if factor missing', () => {
    const act1 = new Activity(
      VALID_UUID,
      ActivityCategory.TRANSPORT,
      10,
      'km',
      new Date().toISOString(),
      'x'
    );
    const map = new Map<string, EmissionFactor>();
    expect(() => service.batchCalculate([act1], map)).toThrow(
      'Missing factor for category: TRANSPORT'
    );
  });
});

describe('CarbonFootprint Aggregate Root', () => {
  it('should add and remove activities and maintain totals', () => {
    const footprint = new CarbonFootprint();
    const act = new Activity(
      VALID_UUID,
      ActivityCategory.TRANSPORT,
      10,
      'km',
      new Date().toISOString(),
      'x'
    );
    const factor = new EmissionFactor(0.12, 'EPA', 'US', 2024, ActivityCategory.TRANSPORT);

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
    const footprint = new CarbonFootprint();
    const act = new Activity(
      VALID_UUID,
      ActivityCategory.TRANSPORT,
      10,
      'km',
      new Date().toISOString(),
      'x'
    );
    const factor = new EmissionFactor(0.12, 'EPA', 'US', 2024, ActivityCategory.FOOD);
    expect(() => {
      footprint.addActivity(act, factor);
    }).toThrow('Activity category and factor category must match');
  });

  it('should throw if recalculating with a missing factor', () => {
    const footprint = new CarbonFootprint();
    const act = new Activity(
      VALID_UUID,
      ActivityCategory.TRANSPORT,
      10,
      'km',
      new Date().toISOString(),
      'x'
    );
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
      const activity = new Activity(
        VALID_UUID,
        ActivityCategory.TRANSPORT,
        amount,
        'km',
        new Date().toISOString(),
        'test'
      );
      const factor = new EmissionFactor(
        co2ePerUnit,
        'test-src',
        'US',
        2024,
        ActivityCategory.TRANSPORT
      );
      const calculated = service.calculate(activity, factor);
      expect(calculated).toBeGreaterThanOrEqual(0);
    }
  });
});
