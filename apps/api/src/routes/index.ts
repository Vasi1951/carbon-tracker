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
import { validateRequest } from '../middlewares/validateRequest.middleware';
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

  const activitySchema = z.object({
    category: z.nativeEnum(ActivityCategory),
    amount: z.number().positive(),
    unit: z.string().min(1),
    date: z.string().datetime(),
    description: z.string().min(1),
  });

  const goalSchema = z.object({
    targetKgCO2e: z.number().positive(),
    timeframe: z.enum(['week', 'month', 'year']),
  });

  router.post('/activities', validateRequest(activitySchema), asyncHandler((req, res) => handlePostActivities(req, res, recordUseCase)));
  router.get('/dashboard', asyncHandler((req, res) => handleGetDashboard(req, res, dashboardUseCase)));
  router.post('/goals', validateRequest(goalSchema), asyncHandler((req, res) => handlePostGoals(req, res, goalUseCase)));
  router.get('/insights', asyncHandler((req, res) => handleGetInsights(req, res, activityRepo, goalRepo, geminiAdapter)));
  router.get('/factors', asyncHandler((req, res) => handleGetFactors(req, res, prisma, cache)));
  router.delete('/account', asyncHandler((req, res) => handleDeleteAccount(req, res, prisma)));

  router.get('/seed', asyncHandler(async (req, res) => {
    const { factorsData } = await import('./seedData.js');
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
  const parsed = req.body as { category: ActivityCategory; amount: number; unit: string; date: string; description: string };
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
  const parsed = req.body as { targetKgCO2e: number; timeframe: 'week' | 'month' | 'year' };
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
