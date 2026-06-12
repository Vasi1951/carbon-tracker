export interface ActivityRecord {
  id: string;
  category: 'TRANSPORT' | 'FOOD' | 'ENERGY' | 'CONSUMPTION';
  amount: number;
  unit: string;
  date: string;
  description: string;
}

export interface DashboardData {
  totalKgCO2e: number;
  breakdown: Array<{ category: string; amount: number; percentage: number }>;
  trend: 'up' | 'down' | 'stable';
}

export interface GoalData {
  goalId?: string;
  target: number;
  projectedDate: string;
}

export interface InsightTip {
  tip: string;
  estimatedSavingKg: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  rationale: string;
  actionableSteps?: string[];
}
