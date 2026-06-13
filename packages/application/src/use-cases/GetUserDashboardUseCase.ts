import { CalculationService, EmissionFactor, Activity } from '@carbon-tracker/domain';
import { Result, ok, fail, ActivityCategory, Goal } from '@carbon-tracker/shared-types';
import { IActivityRepository } from '../ports/IActivityRepository';
import { IEmissionFactorRepository } from '../ports/IEmissionFactorRepository';
import { IUserGoalRepository } from '../ports/IUserGoalRepository';
import { ICacheService } from '../ports/ICacheService';

export interface GetDashboardInput {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year';
}

export interface DashboardOutput {
  totalKgCO2e: number;
  breakdown: Array<{ category: ActivityCategory; amount: number; percentage: number }>;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Use case to retrieve the user's dashboard data, including footprint and trends.
 */
export class GetUserDashboardUseCase {
  private readonly calc = new CalculationService();
  constructor(
    private readonly activityRepo: IActivityRepository,
    private readonly factorRepo: IEmissionFactorRepository,
    private readonly goalRepo: IUserGoalRepository,
    private readonly cache: ICacheService
  ) {}

  /**
   * Executes the dashboard retrieval use case.
   * @param input - The dashboard request input.
   * @returns A result containing the dashboard output.
   */
  public async execute(input: GetDashboardInput): Promise<Result<DashboardOutput>> {
    try {
      const cacheKey = `dashboard:${input.userId}:${input.period}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) return ok(JSON.parse(cached) as DashboardOutput);

      const start = this.getPeriodStartDate(input.period, new Date());
      const activities = await this.activityRepo.findByUserAndPeriod(
        input.userId,
        start,
        new Date()
      );
      const factorMap = await this.getFactorMap();

      const footprint = this.calc.batchCalculate(activities, factorMap);
      const total = footprint.totalKgCO2e;
      const breakdown = this.getBreakdown(footprint, factorMap, total);

      const goal = await this.goalRepo.getCurrentGoal(input.userId);
      const trend = this.determineTrend(total, goal);

      const output: DashboardOutput = { totalKgCO2e: total, breakdown, trend };
      await this.cache.set(cacheKey, JSON.stringify(output), 300);
      return ok(output);
    } catch (err) {
      return fail(err instanceof Error ? err : new Error(String(err)));
    }
  }

  private getPeriodStartDate(period: 'day' | 'week' | 'month' | 'year', now: Date): Date {
    const start = new Date(now);
    if (period === 'day') start.setDate(now.getDate() - 1);
    else if (period === 'week') start.setDate(now.getDate() - 7);
    else if (period === 'month') start.setMonth(now.getMonth() - 1);
    else start.setFullYear(now.getFullYear() - 1);
    return start;
  }

  private async getFactorMap(): Promise<Map<ActivityCategory, EmissionFactor>> {
    const factorMap = new Map<ActivityCategory, EmissionFactor>();
    for (const cat of Object.values(ActivityCategory)) {
      const f = await this.factorRepo.findByCategoryAndRegion(cat, 'US');
      if (f) factorMap.set(cat, f);
    }
    return factorMap;
  }

  private getBreakdown(
    footprint: { activities: Activity[] },
    factorMap: Map<ActivityCategory, EmissionFactor>,
    total: number
  ): Array<{ category: ActivityCategory; amount: number; percentage: number }> {
    return Object.values(ActivityCategory)
      .map((cat) => {
        const catActs = footprint.activities.filter((a) => a.category === cat);
        const amount = catActs.reduce((sum, a) => {
          const f = factorMap.get(cat);
          return sum + (f ? Math.round(a.amount * f.co2ePerUnit * 100) / 100 : 0);
        }, 0);
        const roundedAmount = Math.round(amount * 100) / 100;
        return {
          category: cat,
          amount: roundedAmount,
          percentage: total > 0 ? Math.round((roundedAmount / total) * 100) : 0,
        };
      })
      .filter((b) => b.amount > 0);
  }

  private determineTrend(total: number, goal: Goal | null): 'up' | 'down' | 'stable' {
    if (!goal) return 'stable';
    if (total > goal.targetKgCO2e) return 'up';
    if (total < goal.targetKgCO2e * 0.9) return 'down';
    return 'stable';
  }
}
