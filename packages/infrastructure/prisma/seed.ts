import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const factorsData = [
  // TRANSPORT (15 factors)
  { category: 'TRANSPORT', region: 'US', year: 2020, co2ePerUnit: 0.25, source: 'EPA' },
  { category: 'TRANSPORT', region: 'US', year: 2021, co2ePerUnit: 0.24, source: 'EPA' },
  { category: 'TRANSPORT', region: 'US', year: 2022, co2ePerUnit: 0.23, source: 'EPA' },
  { category: 'TRANSPORT', region: 'US', year: 2023, co2ePerUnit: 0.22, source: 'EPA' },
  { category: 'TRANSPORT', region: 'US', year: 2024, co2ePerUnit: 0.21, source: 'EPA' },
  { category: 'TRANSPORT', region: 'EU', year: 2020, co2ePerUnit: 0.18, source: 'EEA' },
  { category: 'TRANSPORT', region: 'EU', year: 2021, co2ePerUnit: 0.17, source: 'EEA' },
  { category: 'TRANSPORT', region: 'EU', year: 2022, co2ePerUnit: 0.16, source: 'EEA' },
  { category: 'TRANSPORT', region: 'EU', year: 2023, co2ePerUnit: 0.15, source: 'EEA' },
  { category: 'TRANSPORT', region: 'EU', year: 2024, co2ePerUnit: 0.14, source: 'EEA' },
  { category: 'TRANSPORT', region: 'UK', year: 2020, co2ePerUnit: 0.2, source: 'DEFRA' },
  { category: 'TRANSPORT', region: 'UK', year: 2021, co2ePerUnit: 0.19, source: 'DEFRA' },
  { category: 'TRANSPORT', region: 'UK', year: 2022, co2ePerUnit: 0.18, source: 'DEFRA' },
  { category: 'TRANSPORT', region: 'UK', year: 2023, co2ePerUnit: 0.17, source: 'DEFRA' },
  { category: 'TRANSPORT', region: 'UK', year: 2024, co2ePerUnit: 0.16, source: 'DEFRA' },

  // FOOD (12 factors)
  { category: 'FOOD', region: 'US', year: 2020, co2ePerUnit: 6.5, source: 'USDA' },
  { category: 'FOOD', region: 'US', year: 2021, co2ePerUnit: 6.4, source: 'USDA' },
  { category: 'FOOD', region: 'US', year: 2022, co2ePerUnit: 6.3, source: 'USDA' },
  { category: 'FOOD', region: 'US', year: 2023, co2ePerUnit: 6.2, source: 'USDA' },
  { category: 'FOOD', region: 'US', year: 2024, co2ePerUnit: 6.0, source: 'USDA' },
  { category: 'FOOD', region: 'EU', year: 2021, co2ePerUnit: 5.5, source: 'Eurostat' },
  { category: 'FOOD', region: 'EU', year: 2022, co2ePerUnit: 5.4, source: 'Eurostat' },
  { category: 'FOOD', region: 'EU', year: 2023, co2ePerUnit: 5.3, source: 'Eurostat' },
  { category: 'FOOD', region: 'EU', year: 2024, co2ePerUnit: 5.2, source: 'Eurostat' },
  { category: 'FOOD', region: 'GLOBAL', year: 2022, co2ePerUnit: 5.8, source: 'FAO' },
  { category: 'FOOD', region: 'GLOBAL', year: 2023, co2ePerUnit: 5.7, source: 'FAO' },
  { category: 'FOOD', region: 'GLOBAL', year: 2024, co2ePerUnit: 5.6, source: 'FAO' },

  // ENERGY (12 factors)
  { category: 'ENERGY', region: 'US', year: 2020, co2ePerUnit: 0.45, source: 'EIA' },
  { category: 'ENERGY', region: 'US', year: 2021, co2ePerUnit: 0.43, source: 'EIA' },
  { category: 'ENERGY', region: 'US', year: 2022, co2ePerUnit: 0.41, source: 'EIA' },
  { category: 'ENERGY', region: 'US', year: 2023, co2ePerUnit: 0.39, source: 'EIA' },
  { category: 'ENERGY', region: 'US', year: 2024, co2ePerUnit: 0.37, source: 'EIA' },
  { category: 'ENERGY', region: 'EU', year: 2021, co2ePerUnit: 0.28, source: 'EEA' },
  { category: 'ENERGY', region: 'EU', year: 2022, co2ePerUnit: 0.26, source: 'EEA' },
  { category: 'ENERGY', region: 'EU', year: 2023, co2ePerUnit: 0.24, source: 'EEA' },
  { category: 'ENERGY', region: 'EU', year: 2024, co2ePerUnit: 0.22, source: 'EEA' },
  { category: 'ENERGY', region: 'GLOBAL', year: 2022, co2ePerUnit: 0.48, source: 'IEA' },
  { category: 'ENERGY', region: 'GLOBAL', year: 2023, co2ePerUnit: 0.46, source: 'IEA' },
  { category: 'ENERGY', region: 'GLOBAL', year: 2024, co2ePerUnit: 0.44, source: 'IEA' },

  // CONSUMPTION (11 factors)
  { category: 'CONSUMPTION', region: 'US', year: 2020, co2ePerUnit: 1.8, source: 'EPA' },
  { category: 'CONSUMPTION', region: 'US', year: 2021, co2ePerUnit: 1.75, source: 'EPA' },
  { category: 'CONSUMPTION', region: 'US', year: 2022, co2ePerUnit: 1.7, source: 'EPA' },
  { category: 'CONSUMPTION', region: 'US', year: 2023, co2ePerUnit: 1.65, source: 'EPA' },
  { category: 'CONSUMPTION', region: 'US', year: 2024, co2ePerUnit: 1.6, source: 'EPA' },
  { category: 'CONSUMPTION', region: 'EU', year: 2021, co2ePerUnit: 1.4, source: 'EEA' },
  { category: 'CONSUMPTION', region: 'EU', year: 2022, co2ePerUnit: 1.35, source: 'EEA' },
  { category: 'CONSUMPTION', region: 'EU', year: 2023, co2ePerUnit: 1.3, source: 'EEA' },
  { category: 'CONSUMPTION', region: 'EU', year: 2024, co2ePerUnit: 1.25, source: 'EEA' },
  { category: 'CONSUMPTION', region: 'GLOBAL', year: 2023, co2ePerUnit: 1.5, source: 'IPCC' },
  { category: 'CONSUMPTION', region: 'GLOBAL', year: 2024, co2ePerUnit: 1.45, source: 'IPCC' },
];

async function main() {
  console.warn('Seeding emission factors...');
  for (const factor of factorsData) {
    await prisma.emissionFactor.upsert({
      where: {
        category_region_year: {
          category: factor.category,
          region: factor.region,
          year: factor.year,
        },
      },
      update: {
        co2ePerUnit: factor.co2ePerUnit,
        source: factor.source,
      },
      create: factor,
    });
  }
  console.warn(`Successfully seeded ${String(factorsData.length)} emission factors.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e: unknown) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
