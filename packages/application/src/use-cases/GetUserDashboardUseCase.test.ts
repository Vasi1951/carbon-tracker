import { describe, it, expect, vi } from 'vitest';
import { GetUserDashboardUseCase } from './GetUserDashboardUseCase';
import { createMockRepos } from './test-utils';
import { ActivityCategory } from '@carbon-tracker/shared-types';
import { Activity, EmissionFactor } from '@carbon-tracker/domain';

describe('GetUserDashboardUseCase', () => {
  it('should return dashboard data from cache if available', async () => {
    const { mockActivityRepo, mockFactorRepo, mockGoalRepo, mockCache } = createMockRepos();
    mockCache.get = vi.fn().mockResolvedValue(JSON.stringify({ cached: true }));

    const useCase = new GetUserDashboardUseCase(mockActivityRepo, mockFactorRepo, mockGoalRepo, mockCache);

    const result = await useCase.execute({ userId: 'user1', period: 'week' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({ cached: true });
    }
  });

  it('should calculate and return dashboard data when cache is missed', async () => {
    const { mockActivityRepo, mockFactorRepo, mockGoalRepo, mockCache } = createMockRepos();
    mockActivityRepo.findByUserAndPeriod = vi.fn().mockResolvedValue([
      new Activity('00000000-0000-0000-0000-000000000001', ActivityCategory.TRANSPORT, 10, 'km', new Date().toISOString(), 'test'),
    ]);
    mockFactorRepo.findByCategoryAndRegion = vi.fn().mockResolvedValue(
      new EmissionFactor(1.5, 'EPA', 'Global', 2024, ActivityCategory.TRANSPORT)
    );

    const useCase = new GetUserDashboardUseCase(mockActivityRepo, mockFactorRepo, mockGoalRepo, mockCache);

    const result = await useCase.execute({ userId: 'user1', period: 'week' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.totalKgCO2e).toBe(15);
      expect(mockCache.set).toHaveBeenCalled();
    }
  });

  it('should handle repository errors gracefully', async () => {
    const { mockActivityRepo, mockFactorRepo, mockGoalRepo, mockCache } = createMockRepos();
    mockActivityRepo.findByUserAndPeriod = vi.fn().mockRejectedValue(new Error('DB Error'));

    const useCase = new GetUserDashboardUseCase(mockActivityRepo, mockFactorRepo, mockGoalRepo, mockCache);

    const result = await useCase.execute({ userId: 'user1', period: 'week' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('DB Error');
    }
  });
});
