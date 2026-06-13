import { Activity, CalculationService } from '@carbon-tracker/domain';
import { Result, ok, fail, ActivityCategory } from '@carbon-tracker/shared-types';
import { IActivityRepository } from '../ports/IActivityRepository';
import { IEmissionFactorRepository } from '../ports/IEmissionFactorRepository';
import { IEventBus } from '../ports/IEventBus';
import crypto from 'crypto';

export interface RecordActivityInput {
  userId: string;
  category: ActivityCategory;
  amount: number;
  unit: string;
  date: string;
  description: string;
}

export interface RecordActivityOutput {
  activityId: string;
  kgCO2e: number;
  message: string;
}

/**
 * Use case for recording a new carbon tracking activity.
 */
export class RecordActivityUseCase {
  private readonly calc = new CalculationService();
  constructor(
    private readonly activityRepo: IActivityRepository,
    private readonly factorRepo: IEmissionFactorRepository,
    private readonly eventBus: IEventBus
  ) {}

  /**
   * Executes the record activity use case.
   * @param input - The activity data to record.
   * @returns A result containing the recorded activity output.
   */
  public async execute(input: RecordActivityInput): Promise<Result<RecordActivityOutput>> {
    try {
      const id = crypto.randomUUID();
      const activity = new Activity(
        id,
        input.category,
        input.amount,
        input.unit,
        input.date,
        input.description
      );
      (activity as unknown as Record<string, unknown>).userId = input.userId;
      const factor = await this.factorRepo.findByCategoryAndRegion(input.category, 'US');
      if (!factor) return fail(new Error(`Emission factor not found for ${input.category}`));
      const kgCO2e = this.calc.calculate(activity, factor);
      await this.activityRepo.save(activity);
      await this.eventBus.publish({
        type: 'ActivityRecorded',
        payload: { userId: input.userId, activityId: id, kgCO2e },
      });
      return ok({ activityId: id, kgCO2e, message: 'Activity recorded successfully' });
    } catch (err) {
      return fail(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
