import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { z } from 'zod';
import { ActivityCategory } from '@carbon-tracker/shared-types';
import {
  RecordActivityUseCase,
  GetUserDashboardUseCase,
  SetCarbonGoalUseCase,
} from '@carbon-tracker/application';
import {
  PrismaActivityRepository,
  PrismaEmissionFactorRepository,
  PrismaUserGoalRepository,
  RedisCacheService,
  CloudPubSubEventBus,
  GeminiInsightsAdapter,
} from '@carbon-tracker/infrastructure';
import { PrismaClient } from '@prisma/client';
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err: unknown) => { next(err); });
  };
}

export function createRouter(
  prisma: PrismaClient,
  cache: RedisCacheService,
  eventBus: CloudPubSubEventBus,
  geminiAdapter: GeminiInsightsAdapter
): Router {
  const router = Router();
  const activityRepo = new PrismaActivityRepository(prisma);
  const factorRepo = new PrismaEmissionFactorRepository(prisma);
  const goalRepo = new PrismaUserGoalRepository(prisma);

  const recordUseCase = new RecordActivityUseCase(activityRepo, factorRepo, eventBus);
  const dashboardUseCase = new GetUserDashboardUseCase(activityRepo, factorRepo, goalRepo, cache);
  const goalUseCase = new SetCarbonGoalUseCase(activityRepo, factorRepo, goalRepo);

  router.post('/activities', asyncHandler((req, res) => handlePostActivities(req, res, recordUseCase)));
  router.get('/dashboard', asyncHandler((req, res) => handleGetDashboard(req, res, dashboardUseCase)));
  router.post('/goals', asyncHandler((req, res) => handlePostGoals(req, res, goalUseCase)));
  router.get('/insights', asyncHandler((req, res) => handleGetInsights(req, res, activityRepo, goalRepo, geminiAdapter)));
  router.get('/factors', asyncHandler((req, res) => handleGetFactors(req, res, prisma, cache)));
  router.delete('/account', asyncHandler((req, res) => handleDeleteAccount(req, res, prisma)));

  router.get('/seed', asyncHandler(async (req, res) => {
    const factorsData = [
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
    ] as any;
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
    res.json({ success: true, count: factorsData.length });
  }));

  return router;
}

async function handlePostActivities(
  req: Request,
  res: Response,
  recordUseCase: RecordActivityUseCase
): Promise<unknown> {
  const schema = z.object({
    category: z.nativeEnum(ActivityCategory),
    amount: z.number().positive(),
    unit: z.string().min(1),
    date: z.string().datetime(),
    description: z.string().min(1),
  });
  const parsed = schema.parse(req.body);
  const userId = 'default-user';
  const result = await recordUseCase.execute({ userId, ...parsed });
  if (!result.success) return res.status(400).json({ error: result.error.message });
  return res.status(201).json(result.value);
}

async function handleGetDashboard(
  req: Request,
  res: Response,
  dashboardUseCase: GetUserDashboardUseCase
): Promise<unknown> {
  const period = typeof req.query.period === 'string' ? req.query.period : 'week';
  if (!['day', 'week', 'month', 'year'].includes(period)) {
    return res.status(400).json({ error: 'Invalid period parameter' });
  }
  const userId = 'default-user';
  const result = await dashboardUseCase.execute({
    userId,
    period: period as 'day' | 'week' | 'month' | 'year',
  });
  if (!result.success) return res.status(500).json({ error: result.error.message });
  return res.json(result.value);
}

async function handlePostGoals(
  req: Request,
  res: Response,
  goalUseCase: SetCarbonGoalUseCase
): Promise<unknown> {
  const schema = z.object({
    targetKgCO2e: z.number().positive(),
    timeframe: z.enum(['week', 'month', 'year']),
  });
  const parsed = schema.parse(req.body);
  const userId = 'default-user';
  const result = await goalUseCase.execute({ userId, ...parsed });
  if (!result.success) return res.status(400).json({ error: result.error.message });
  return res.status(201).json(result.value);
}

async function handleGetInsights(
  req: Request,
  res: Response,
  activityRepo: PrismaActivityRepository,
  goalRepo: PrismaUserGoalRepository,
  geminiAdapter: GeminiInsightsAdapter
): Promise<unknown> {
  const userId = 'default-user';
  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - 30);
  const activities = await activityRepo.findByUserAndPeriod(userId, start, now);
  const goal = await goalRepo.getCurrentGoal(userId);
  const result = await geminiAdapter.generatePersonalizedTips(activities, goal ? [goal] : []);
  if (!result.success) return res.status(500).json({ error: result.error.message });
  return res.json(result.value);
}

async function handleGetFactors(
  req: Request,
  res: Response,
  prisma: PrismaClient,
  cache: RedisCacheService
): Promise<unknown> {
  const cacheKey = 'factors:all';
  const cached = await cache.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));
  const factors = await prisma.emissionFactor.findMany();
  await cache.set(cacheKey, JSON.stringify(factors), 24 * 3600);
  return res.json(factors);
}

async function handleDeleteAccount(
  req: Request,
  res: Response,
  prisma: PrismaClient
): Promise<unknown> {
  const userId = 'default-user';
  await prisma.activity.deleteMany({ where: { userId } });
  await prisma.userGoal.deleteMany({ where: { userId } });
  return res.json({ success: true, message: 'Account and associated data deleted successfully' });
}
