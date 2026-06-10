import { EmissionFactor } from '@carbon-tracker/domain';
import { IEmissionFactorRepository } from '@carbon-tracker/application';
import { ActivityCategory } from '@carbon-tracker/shared-types';
import { PrismaClient } from '@prisma/client';

export class PrismaEmissionFactorRepository implements IEmissionFactorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async findByCategoryAndRegion(
    category: ActivityCategory,
    region: string
  ): Promise<EmissionFactor | null> {
    const record = await this.prisma.emissionFactor.findFirst({
      where: { category, region },
      orderBy: { year: 'desc' },
    });
    if (!record) return null;
    return new EmissionFactor(
      record.co2ePerUnit,
      record.source,
      record.region,
      record.year,
      record.category as ActivityCategory
    );
  }

  public async cacheFactors(factors: EmissionFactor[]): Promise<void> {
    for (const f of factors) {
      await this.prisma.emissionFactor.upsert({
        where: {
          category_region_year: {
            category: f.category,
            region: f.region,
            year: f.year,
          },
        },
        update: {
          co2ePerUnit: f.co2ePerUnit,
          source: f.source,
        },
        create: {
          category: f.category,
          region: f.region,
          year: f.year,
          co2ePerUnit: f.co2ePerUnit,
          source: f.source,
        },
      });
    }
  }
}
