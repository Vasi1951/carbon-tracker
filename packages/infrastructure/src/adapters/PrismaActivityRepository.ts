import { Activity } from '@carbon-tracker/domain';
import { IActivityRepository } from '@carbon-tracker/application';
import { PrismaClient } from '@prisma/client';
import { ActivityCategory } from '@carbon-tracker/shared-types';

export class PrismaActivityRepository implements IActivityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async save(activity: Activity): Promise<void> {
    const activityRecord = activity as unknown as Record<string, unknown>;
    const userId = (activityRecord.userId as string) || 'default-user';
    const data = {
      userId,
      category: activity.category,
      amount: activity.amount,
      unit: activity.unit,
      date: new Date(activity.date),
      description: activity.description,
    };
    await this.prisma.activity.upsert({
      where: { id: activity.id },
      update: data,
      create: {
        id: activity.id,
        ...data,
      },
    });
  }

  public async findByUserAndPeriod(userId: string, start: Date, end: Date): Promise<Activity[]> {
    const records = await this.prisma.activity.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { date: 'asc' },
    });
    return records.map((r) => {
      const act = new Activity(
        r.id,
        r.category as ActivityCategory,
        r.amount,
        r.unit,
        r.date.toISOString(),
        r.description
      );
      const actRecord = act as unknown as Record<string, unknown>;
      actRecord.userId = r.userId;
      return act;
    });
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.activity.delete({
      where: { id },
    });
  }
}
