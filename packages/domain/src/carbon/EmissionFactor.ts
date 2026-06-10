import { ActivityCategory } from '@carbon-tracker/shared-types';

/**
 * Value Object representing a carbon emission factor.
 */
export default class EmissionFactor {
  /**
   * Creates an instance of EmissionFactor.
   * @param co2ePerUnit - CO2e emissions per unit (must be non-negative).
   * @param source - Source of the emission factor database.
   * @param region - Region code.
   * @param year - Year of publication (2000-2030).
   * @param category - Category of the activity this factor applies to.
   */
  constructor(
    public readonly co2ePerUnit: number,
    public readonly source: string,
    public readonly region: string,
    public readonly year: number,
    public readonly category: ActivityCategory
  ) {
    this.validate();
  }

  /**
   * Validates invariants.
   * @throws Error if any validation check fails.
   */
  private validate(): void {
    if (this.co2ePerUnit < 0) {
      throw new Error('CO2e per unit must be non-negative');
    }
    const minYear = 2000;
    const maxYear = 2030;
    if (this.year < minYear || this.year > maxYear) {
      throw new Error('Year must be between 2000 and 2030');
    }
    if (this.source.trim().length === 0) {
      throw new Error('Source is required');
    }
    if (this.region.trim().length === 0) {
      throw new Error('Region is required');
    }
  }

  /**
   * Compares equality with another EmissionFactor.
   * @param other - The other factor to compare.
   * @returns True if all properties are equal, false otherwise.
   */
  public equals(other: EmissionFactor): boolean {
    return (
      this.co2ePerUnit === other.co2ePerUnit &&
      this.source === other.source &&
      this.region === other.region &&
      this.year === other.year &&
      this.category === other.category
    );
  }

  public toString(): string {
    return `${this.category}:${String(this.co2ePerUnit)}kgCO2e/unit (${this.source}-${this.region}-${String(this.year)})`;
  }
}
