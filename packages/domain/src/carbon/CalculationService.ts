import Activity from './Activity';
import EmissionFactor from './EmissionFactor';
import CarbonFootprint from './CarbonFootprint';

/**
 * Domain Service that encapsulates calculation rules for carbon footprint.
 */
export default class CalculationService {
  /**
   * Calculates the carbon emission in kgCO2e for a single activity.
   * @param activity - The domain Activity.
   * @param factor - The emission factor to use.
   * @returns Calculated and rounded emission value.
   */
  public calculate(activity: Activity, factor: EmissionFactor): number {
    if (activity.category !== factor.category) {
      throw new Error('Activity category and factor category must match');
    }
    const rawValue = activity.amount * factor.co2ePerUnit;
    return Math.round(rawValue * 100) / 100;
  }

  /**
   * Performs a batch calculation on a list of activities.
   * @param activities - List of Activities to calculate.
   * @param factorMap - Map linking category keys to EmissionFactor.
   * @returns CarbonFootprint aggregate representing the batch.
   */
  public batchCalculate(
    activities: Activity[],
    factorMap: Map<string, EmissionFactor>
  ): CarbonFootprint {
    const footprint = new CarbonFootprint();
    for (const act of activities) {
      const factor = factorMap.get(act.category);
      if (!factor) {
        throw new Error(`Missing factor for category: ${act.category}`);
      }
      footprint.addActivity(act, factor);
    }
    return footprint;
  }
}
