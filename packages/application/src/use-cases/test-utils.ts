import { vi } from 'vitest';
import type { IActivityRepository } from '../ports/IActivityRepository';
import type { IEmissionFactorRepository } from '../ports/IEmissionFactorRepository';
import type { IUserGoalRepository } from '../ports/IUserGoalRepository';
import type { ICacheService } from '../ports/ICacheService';
import type { IEventBus } from '../ports/IEventBus';

export function createMockRepos() {
  const mockActivityRepo: IActivityRepository = {
    save: vi.fn().mockResolvedValue(undefined),
    findByUserAndPeriod: vi.fn().mockResolvedValue([]),
    delete: vi.fn(),
  };
  const mockFactorRepo: IEmissionFactorRepository = {
    findByCategoryAndRegion: vi.fn().mockResolvedValue(null),
    cacheFactors: vi.fn().mockResolvedValue(undefined),
  };
  const mockGoalRepo: IUserGoalRepository = {
    saveGoal: vi.fn().mockResolvedValue(undefined),
    getCurrentGoal: vi.fn().mockResolvedValue(null),
  };
  const mockCache: ICacheService = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
  };
  const mockEventBus: IEventBus = {
    publish: vi.fn().mockResolvedValue(undefined),
  };

  return { mockActivityRepo, mockFactorRepo, mockGoalRepo, mockCache, mockEventBus };
}
