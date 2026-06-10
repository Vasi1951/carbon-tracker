import { Goal } from '@carbon-tracker/shared-types';

export interface IUserGoalRepository {
  saveGoal(goal: Goal): Promise<void>;
  getCurrentGoal(userId: string): Promise<Goal | null>;
}
