import { Goal } from '@carbon-tracker/shared-types';
import { IUserGoalRepository } from '@carbon-tracker/application';
import { PrismaClient } from '@prisma/client';

export class PrismaUserGoalRepository implements IUserGoalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async saveGoal(goal: Goal): Promise<void> {
    const data = {
      userId: goal.userId,
      targetKgCO2e: goal.targetKgCO2e,
      timeframe: goal.timeframe,
      createdAt: goal.createdAt,
    };
    await this.prisma.userGoal.upsert({
      where: { id: goal.id },
      update: data,
      create: {
        id: goal.id,
        ...data,
      },
    });
  }

  public async getCurrentGoal(userId: string): Promise<Goal | null> {
    const record = await this.prisma.userGoal.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) return null;
    return {
      id: record.id,
      userId: record.userId,
      targetKgCO2e: record.targetKgCO2e,
      timeframe: record.timeframe,
      createdAt: record.createdAt,
    };
  }
}
