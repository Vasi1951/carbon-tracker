import { describe, it, expect, vi } from 'vitest';
import { RecordActivityUseCase } from './RecordActivityUseCase';
import { createMockRepos } from './test-utils';
import { ActivityCategory } from '@carbon-tracker/shared-types';
import { EmissionFactor } from '@carbon-tracker/domain';

describe('RecordActivityUseCase', () => {
  const validRequest = {
    userId: 'user-1',
    category: ActivityCategory.TRANSPORT,
    amount: 10,
    unit: 'km',
    date: new Date().toISOString(),
    description: 'Test ride',
  };

  it('should successfully record an activity', async () => {
    const { mockActivityRepo, mockFactorRepo, mockEventBus } = createMockRepos();
    mockFactorRepo.findByCategoryAndRegion = vi.fn().mockResolvedValue(
      new EmissionFactor(1.5, 'EPA', 'Global', 2024, ActivityCategory.TRANSPORT)
    );

    const useCase = new RecordActivityUseCase(mockActivityRepo, mockFactorRepo, mockEventBus);

    const result = await useCase.execute(validRequest);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.kgCO2e).toBe(15);
      expect(mockActivityRepo.save).toHaveBeenCalled();
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ActivityRecorded' })
      );
    }
  });

  it('should fail if emission factor is not found', async () => {
    const { mockActivityRepo, mockFactorRepo, mockEventBus } = createMockRepos();
    mockFactorRepo.findByCategoryAndRegion = vi.fn().mockResolvedValue(null);

    const useCase = new RecordActivityUseCase(mockActivityRepo, mockFactorRepo, mockEventBus);

    const result = await useCase.execute(validRequest);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('Emission factor not found');
    }
  });

  it('should fail if validation throws an error', async () => {
    const { mockActivityRepo, mockFactorRepo, mockEventBus } = createMockRepos();
    mockFactorRepo.findByCategoryAndRegion = vi.fn().mockResolvedValue(
      new EmissionFactor(1.5, 'EPA', 'Global', 2024, ActivityCategory.TRANSPORT)
    );

    const useCase = new RecordActivityUseCase(mockActivityRepo, mockFactorRepo, mockEventBus);

    const result = await useCase.execute({
      ...validRequest,
      amount: -10, // Invalid amount
    });

    expect(result.success).toBe(false);
  });
});
