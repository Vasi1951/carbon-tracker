import { describe, it, expect } from 'vitest';
import { useTestContainers } from './test-setup';

describe('Database Migration Tests', () => {
  const context = useTestContainers();

  it('should successfully apply schema migrations', async () => {
    const { prisma } = context;
    if (!prisma) throw new Error('Prisma not initialized');

    // The setup function runs `npx prisma db push`, so here we just verify
    // that a basic query works, confirming schema creation.
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    expect(result).toBeDefined();
    
    // We can also verify we can write to the UserGoal table
    const goal = await prisma.userGoal.create({
      data: {
        id: 'migration-test-goal',
        userId: 'test-user',
        targetKgCO2e: 100,
        timeframe: 'week',
        createdAt: new Date(),
      }
    });

    expect(goal).toBeDefined();
    expect(goal.userId).toBe('test-user');

    // Clean up
    await prisma.userGoal.delete({
      where: { id: 'migration-test-goal' }
    });
  });
});
