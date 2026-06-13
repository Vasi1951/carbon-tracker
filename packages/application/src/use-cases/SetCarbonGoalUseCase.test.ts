import { describe, it, expect } from 'vitest';
import { SetCarbonGoalUseCase } from './SetCarbonGoalUseCase';
import { createMockRepos } from './test-utils';

describe('SetCarbonGoalUseCase', () => {
  it('should save a carbon goal', async () => {
    const { mockActivityRepo, mockFactorRepo, mockGoalRepo } = createMockRepos();

    const useCase = new SetCarbonGoalUseCase(mockActivityRepo, mockFactorRepo, mockGoalRepo);

    const result = await useCase.execute({ userId: 'user1', targetKgCO2e: 100, timeframe: 'week' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.target).toBe(100);
      expect(mockGoalRepo.saveGoal).toHaveBeenCalled();
    }
  });

  it('should fail when given invalid target', async () => {
    const { mockActivityRepo, mockFactorRepo, mockGoalRepo } = createMockRepos();

    const useCase = new SetCarbonGoalUseCase(mockActivityRepo, mockFactorRepo, mockGoalRepo);

    const result = await useCase.execute({ userId: 'user1', targetKgCO2e: -10, timeframe: 'week' });
    expect(result.success).toBe(false);
  });
});
