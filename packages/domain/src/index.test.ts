import { describe, it, expect } from 'vitest';
import { CarbonFootprintCalculator } from './index';

describe('CarbonFootprintCalculator', () => {
  it('should calculate footprint by multiplying amount by 1.2', () => {
    const calculator = new CarbonFootprintCalculator();
    const result = calculator.calculate({
      amount: 100,
      activity: 'driving',
    });
    expect(result).toBe(120);
  });
});
