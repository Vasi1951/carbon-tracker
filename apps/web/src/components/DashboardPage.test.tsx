import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';
import DashboardPage from './DashboardPage';

expect.extend(toHaveNoViolations);

describe('DashboardPage', () => {
  const mockProps = {
    dashboard: {
      totalKgCO2e: 150,
      breakdown: [
        { category: 'TRANSPORT', amount: 100, percentage: 66.6 },
        { category: 'FOOD', amount: 50, percentage: 33.4 },
      ],
      trend: 'stable' as const,
    },
    goal: { target: 200, projectedDate: '2026-12-31' },
    insight: {
      tip: 'Walk instead of drive',
      estimatedSavingKg: 10,
      difficulty: 'easy' as const,
      category: 'TRANSPORT',
      rationale: 'Driving emits CO2.',
      actionableSteps: ['Walk', 'Bike']
    },
    insightDismissed: false,
    setInsightDismissed: jest.fn(),
    activities: [],
    targetGoal: 200,
    setTargetGoal: jest.fn(),
    goalTimeframe: 'month' as const,
    setGoalTimeframe: jest.fn(),
    handleSetGoal: jest.fn(),
    setIsModalOpen: jest.fn(),
    handleDeleteAccount: jest.fn(),
    triggerRef: { current: null },
  };

  it('renders correctly without accessibility violations', async () => {
    const { container } = render(<DashboardPage {...mockProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('displays the AI tip correctly', () => {
    render(<DashboardPage {...mockProps} />);
    expect(screen.getByText('Walk instead of drive')).toBeInTheDocument();
    expect(screen.getByText('Walk')).toBeInTheDocument(); // actionable step
    expect(screen.getByText('Bike')).toBeInTheDocument(); // actionable step
  });

  it('displays the carbon breakdown', () => {
    render(<DashboardPage {...mockProps} />);
    expect(screen.getByText(/TRANSPORT:/)).toBeInTheDocument();
    expect(screen.getByText(/FOOD:/)).toBeInTheDocument();
  });
});
