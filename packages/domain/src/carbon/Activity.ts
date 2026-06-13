import { ActivityCategory } from '@carbon-tracker/shared-types';

/**
 * Represents a carbon-producing activity.
 */
export default class Activity {
  /**
   * Creates an instance of Activity.
   * @param id - Unique identifier (UUID).
   * @param category - Category of the activity.
   * @param amount - Numeric amount (must be positive).
   * @param unit - Measurement unit.
   * @param date - Date of the activity (ISO format).
   * @param description - Short description.
   */
  constructor(
    public readonly id: string,
    public readonly category: ActivityCategory,
    public readonly amount: number,
    public readonly unit: string,
    public readonly date: string,
    public readonly description: string
  ) {
    this.validate();
  }

  /**
   * Validates the Activity instance against its invariants.
   * @throws Error if any validation check fails.
   */
  public validate(): void {
    if (this.amount <= 0) {
      throw new Error('Amount must be positive');
    }
    const dateMs = new Date(this.date).getTime();
    if (isNaN(dateMs)) {
      throw new Error('Invalid ISO Date');
    }
    if (dateMs > Date.now() + 24 * 60 * 60 * 1000) {
      throw new Error('Date cannot be in the future');
    }
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(this.id)) {
      throw new Error('Invalid UUID');
    }
    if (this.unit.trim().length === 0) {
      throw new Error('Unit is required');
    }
    if (this.description.trim().length === 0) {
      throw new Error('Description is required');
    }
  }

  /**
   * Checks if the activity date falls within a given range.
   * @param start - Start of date range (ISO format).
   * @param end - End of date range (ISO format).
   * @returns True if date falls within the range, false otherwise.
   */
  public isValidDateRange(start: string, end: string): boolean {
    const actDate = new Date(this.date).getTime();
    return actDate >= new Date(start).getTime() && actDate <= new Date(end).getTime();
  }
}
