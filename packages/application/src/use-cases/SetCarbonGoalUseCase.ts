import { CalculationService, EmissionFactor } from '@carbon-tracker/domain';
import { Result, ok, fail, ActivityCategory, Goal } from '@carbon-tracker/shared-types';
import { IActivityRepository } from '../ports/IActivityRepository';
import { IEmissionFactorRepository } from '../ports/IEmissionFactorRepository';
import { IUserGoalRepository } from '../ports/IUserGoalRepository';
import crypto from 'crypto';

export interface SetCarbonGoalInput {
  userId: string;
  targetKgCO2e: number;
  timeframe: 'week' | 'month' | 'year';
}

export interface SetCarbonGoalOutput {
  goalId: string;
  target: number;
  projectedDate: string;
}

/**
 * Use case to set a new carbon footprint goal.
 */
export class SetCarbonGoalUseCase {
  private readonly calc = new CalculationService();
  constructor(
    private readonly activityRepo: IActivityRepository,
    private readonly factorRepo: IEmissionFactorRepository,
    private readonly goalRepo: IUserGoalRepository
  ) {}

  /**
   * Executes the goal setting use case.
   * @param input - The goal data to be processed.
   * @returns A result containing the saved goal output.
   */
  public async execute(input: SetCarbonGoalInput): Promise<Result<SetCarbonGoalOutput>> {
    try {
      if (input.targetKgCO2e <= 0) {
        return fail(new Error('Target must be positive'));
      }
      const average = await this.getCurrentAverage(input.userId);
      if (average > 0 && input.targetKgCO2e < 0.1 * average) {
        return fail(new Error('Goal target is too aggressive'));
      }
      return await this.saveNewGoal(input);
    } catch (err) {
      return fail(err instanceof Error ? err : new Error(String(err)));
    }
  }

  /**
   * Saves the new goal to the repository.
   * @param input - The user goal input.
   * @returns A result containing the goal output.
   */
  private async saveNewGoal(input: SetCarbonGoalInput): Promise<Result<SetCarbonGoalOutput>> {
    const goalId = crypto.randomUUID();
    const goal: Goal = {
      id: goalId,
      userId: input.userId,
      targetKgCO2e: input.targetKgCO2e,
      timeframe: input.timeframe,
      createdAt: new Date(),
    };
    await this.goalRepo.saveGoal(goal);
    const projectedDate = this.getProjectedDate(input.timeframe);
    return ok({
      goalId,
      target: input.targetKgCO2e,
      projectedDate: projectedDate.toISOString(),
    });
  }

  /**
   * Retrieves the current average carbon footprint for the user.
   * @param userId - The user identifier.
   * @returns The average footprint value.
   */
  private async getCurrentAverage(userId: string): Promise<number> {
    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - 30);
    const activities = await this.activityRepo.findByUserAndPeriod(userId, start, now);
    if (activities.length === 0) return 0;
    const factorMap = new Map<ActivityCategory, EmissionFactor>();
    for (const cat of Object.values(ActivityCategory)) {
      const f = await this.factorRepo.findByCategoryAndRegion(cat, 'US');
      if (f) factorMap.set(cat, f);
    }
    const footprint = this.calc.batchCalculate(activities, factorMap);
    return footprint.totalKgCO2e / activities.length;
  }

  /**
   * Calculates the projected date based on the timeframe.
   * @param timeframe - The goal timeframe.
   * @returns The calculated date.
   */
  private getProjectedDate(timeframe: 'week' | 'month' | 'year'): Date {
    const date = new Date();
    if (timeframe === 'week') date.setDate(date.getDate() + 7);
    else if (timeframe === 'month') date.setDate(date.getDate() + 30);
    else date.setDate(date.getDate() + 365);
    return date;
  }
}
