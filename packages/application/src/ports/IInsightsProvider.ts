import { Activity } from '@carbon-tracker/domain';
import { Goal, Insight, Result } from '@carbon-tracker/shared-types';

export interface IInsightsProvider {
  generatePersonalizedTips(
    userHistory: Activity[],
    goals: Goal[]
  ): Promise<Result<Insight>>;
}
