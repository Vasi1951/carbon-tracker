import { EmissionFactor } from '@carbon-tracker/domain';
import { ActivityCategory } from '@carbon-tracker/shared-types';

export interface IEmissionFactorRepository {
  findByCategoryAndRegion(
    category: ActivityCategory,
    region: string
  ): Promise<EmissionFactor | null>;
  cacheFactors(factors: EmissionFactor[]): Promise<void>;
}
