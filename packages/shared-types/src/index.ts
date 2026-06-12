import { z } from 'zod';

export enum ActivityCategory {
  TRANSPORT = 'TRANSPORT',
  FOOD = 'FOOD',
  ENERGY = 'ENERGY',
  CONSUMPTION = 'CONSUMPTION',
}

export const ActivityZodSchema = z.object({
  id: z.string().uuid('Invalid UUID'),
  category: z.nativeEnum(ActivityCategory),
  amount: z.number().positive('Amount must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  date: z
    .string()
    .datetime('Invalid ISO Date')
    .refine(
      (val) => {
        return new Date(val).getTime() <= Date.now();
      },
      {
        message: 'Date cannot be in the future',
      }
    ),
  description: z.string().min(1, 'Description is required'),
});

export type ActivityInput = z.infer<typeof ActivityZodSchema>;

export interface CarbonFootprintRecord {
  id: string;
  amount: number;
  activity: string;
  createdAt: Date;
}

export interface Goal {
  id: string;
  userId: string;
  targetKgCO2e: number;
  timeframe: string;
  createdAt: Date;
}

export interface Insight {
  tip: string;
  estimatedSavingKg: number;
  difficulty: string;
  category: string;
  rationale: string;
  actionableSteps?: string[];
}

export * from './result';
