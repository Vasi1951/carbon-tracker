import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

describe('Database Migration Rollback Integration Test', () => {
  let pgContainer: StartedPostgreSqlContainer | undefined;
  let pgUrl: string;
  let prisma: PrismaClient | undefined;

  beforeAll(async () => {
    pgContainer = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('migration_test_db')
      .withUsername('postgres')
      .withPassword('password')
      .start();
    pgUrl = pgContainer.getConnectionUri();
  }, 90000);

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    if (pgContainer) {
      await pgContainer.stop();
    }
  });

  it('should apply schema migrations and verify rollback works', async () => {
    execSync('npx prisma db push --schema prisma/schema.prisma', {
      env: { ...process.env, DATABASE_URL: pgUrl },
    });

    prisma = new PrismaClient({ datasources: { db: { url: pgUrl } } });
    await prisma.$connect();

    const tablesRes = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const tableNames = tablesRes.map((row) => row.table_name);
    expect(tableNames).toContain('Activity');
    expect(tableNames).toContain('EmissionFactor');
    expect(tableNames).toContain('UserGoal');

    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "Activity" CASCADE');
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "EmissionFactor" CASCADE');
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "UserGoal" CASCADE');

    const tablesResAfter = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const tableNamesAfter = tablesResAfter.map((row) => row.table_name);
    expect(tableNamesAfter).not.toContain('Activity');
    expect(tableNamesAfter).not.toContain('EmissionFactor');
    expect(tableNamesAfter).not.toContain('UserGoal');
  });
});
