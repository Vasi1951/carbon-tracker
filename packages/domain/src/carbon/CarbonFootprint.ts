import Activity from './Activity';
import EmissionFactor from './EmissionFactor';

/**
 * Aggregate Root representing the total carbon footprint for a collection of activities.
 */
export default class CarbonFootprint {
  public readonly activities: Activity[] = [];
  private readonly factorMap = new Map<string, EmissionFactor>();
  public totalKgCO2e = 0;
  public calculatedAt: Date = new Date();

  /**
   * Adds an activity and its corresponding emission factor to the aggregate.
   * @param activity - The domain Activity.
   * @param factor - The emission factor for this activity.
   */
  public addActivity(activity: Activity, factor: EmissionFactor): void {
    if (activity.category !== factor.category) {
      throw new Error('Activity category and factor category must match');
    }
    const exists = this.activities.some((act) => act.id === activity.id);
    if (exists) {
      throw new Error('Activity already exists in footprint');
    }
    this.activities.push(activity);
    this.factorMap.set(activity.id, factor);
    this.recalculate();
  }

  /**
   * Removes an activity from the aggregate.
   * @param id - The ID of the activity to remove.
   */
  public removeActivity(id: string): void {
    const idx = this.activities.findIndex((act) => act.id === id);
    if (idx === -1) {
      throw new Error('Activity not found in footprint');
    }
    this.activities.splice(idx, 1);
    this.factorMap.delete(id);
    this.recalculate();
  }

  /**
   * Recalculates the total Kg CO2e emissions for all activities.
   */
  public recalculate(): void {
    let sum = 0;
    for (const act of this.activities) {
      const factor = this.factorMap.get(act.id);
      if (!factor) {
        throw new Error(`Missing emission factor for activity: ${act.id}`);
      }
      const rawValue = act.amount * factor.co2ePerUnit;
      const rounded = Math.round(rawValue * 100) / 100;
      sum += rounded;
    }
    this.totalKgCO2e = Math.round(sum * 100) / 100;
    this.calculatedAt = new Date();
  }
}
