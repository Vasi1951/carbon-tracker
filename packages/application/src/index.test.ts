import { describe, it, expect, vi } from 'vitest';
import { TrackCarbonFootprint, CarbonRepository } from './index';

describe('TrackCarbonFootprint Legacy UseCase', () => {
  it('should calculate footprint and save record', async () => {
    const mockRepo: CarbonRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
    };
    const useCase = new TrackCarbonFootprint(mockRepo);
    const result = await useCase.execute(100, 'driving');

    expect(result.amount).toBe(120); // 100 * 1.2 from the domain calculator
    expect(result.activity).toBe('driving');
    expect(result.id).toBe('mock-id-123');
    expect(mockRepo.save).toHaveBeenCalledWith(result);
  });
});
