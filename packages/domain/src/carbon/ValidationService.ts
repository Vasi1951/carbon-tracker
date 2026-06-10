import { ActivityZodSchema } from '@carbon-tracker/shared-types';
import Activity from './Activity';

/**
 * Domain Service for validating raw input structures.
 */
export default class ValidationService {
  /**
   * Validates raw input against the Zod schema and maps it to a domain Activity.
   * @param data - The raw data payload.
   * @returns A validated domain Activity instance.
   */
  public validateActivityInput(data: unknown): Activity {
    const parsed = ActivityZodSchema.parse(data);
    return new Activity(
      parsed.id,
      parsed.category,
      parsed.amount,
      parsed.unit,
      parsed.date,
      parsed.description
    );
  }
}
