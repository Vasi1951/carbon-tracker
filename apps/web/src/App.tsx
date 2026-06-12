import React, { useState, useEffect, useRef, Suspense } from 'react';
import { ActivityRecord, DashboardData, GoalData, InsightTip } from './types';

// Lazy loaded components for code splitting
const DashboardPage = React.lazy(() => import('./components/DashboardPage'));
const AddActivityModal = React.lazy(() => import('./components/AddActivityModal'));

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function App(): React.JSX.Element {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [goal, setGoal] = useState<GoalData | null>(null);
  const [insight, setInsight] = useState<InsightTip | null>(null);
  const [insightDismissed, setInsightDismissed] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [category, setCategory] = useState<'TRANSPORT' | 'FOOD' | 'ENERGY' | 'CONSUMPTION'>('TRANSPORT');
  const [amount, setAmount] = useState<string>('');
  const [unit, setUnit] = useState<string>('km');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const [targetGoal, setTargetGoal] = useState<number>(150);
  const [goalTimeframe, setGoalTimeframe] = useState<'week' | 'month' | 'year'>('month');

  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    void fetchDashboard();
    void fetchInsights();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/dashboard?period=month`);
      if (res.ok) {
        const data = (await res.json()) as DashboardData;
        setDashboard(data);
      }
    } catch {
      // Ignored for resilience
    }
  };

  const fetchInsights = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/insights`);
      if (res.ok) {
        const data = (await res.json()) as InsightTip;
        setInsight(data);
      }
    } catch {
      // Ignored for resilience
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete your account? This action is irreversible.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/account`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setActivities([]);
        setDashboard(null);
        setGoal(null);
        setInsight(null);
      }
    } catch {
      alert('Failed to delete account.');
    }
  };

  const validateActivity = (amtVal: string, unitVal: string, descVal: string): number | null => {
    const amtNum = parseFloat(amtVal);
    if (isNaN(amtNum) || amtNum <= 0) {
      setFormError('Amount must be a positive number');
      return null;
    }
    if (!unitVal.trim()) {
      setFormError('Unit is required');
      return null;
    }
    if (!descVal.trim()) {
      setFormError('Description is required');
      return null;
    }
    return amtNum;
  };

  const saveActivity = async (newActivity: Omit<ActivityRecord, 'id'>, prevActivities: ActivityRecord[]) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newActivity),
      });

      if (!res.ok) throw new Error('Failed to record activity');

      setIsModalOpen(false);
      setAmount('');
      setDescription('');
      void fetchDashboard();
      void fetchInsights();
    } catch {
      setFormError('Failed to save activity to server. Rolling back.');
      setActivities(prevActivities);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const amtNum = validateActivity(amount, unit, description);
    if (amtNum === null) return;

    const newActivity: Omit<ActivityRecord, 'id'> = {
      category, amount: amtNum, unit, date: new Date(date).toISOString(), description,
    };

    const prevActivities = [...activities];
    setActivities((prev) => [{ id: Math.random().toString(), ...newActivity }, ...prev]);
    await saveActivity(newActivity, prevActivities);
  };

  const handleSetGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/v1/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetKgCO2e: targetGoal, timeframe: goalTimeframe }),
      });
      if (res.ok) {
        const data = (await res.json()) as GoalData;
        setGoal(data);
        void fetchDashboard();
      }
    } catch {
      alert('Failed to update carbon goal.');
    }
  };


  return (
    <Suspense fallback={<div style={{color: 'white', textAlign: 'center', marginTop: '20vh'}}>Loading...</div>}>
      <DashboardPage
        dashboard={dashboard}
        goal={goal}
        insight={insight}
        insightDismissed={insightDismissed}
        setInsightDismissed={setInsightDismissed}
        activities={activities}
        targetGoal={targetGoal}
        setTargetGoal={setTargetGoal}
        goalTimeframe={goalTimeframe}
        setGoalTimeframe={setGoalTimeframe}
        handleSetGoal={handleSetGoal}
        setIsModalOpen={setIsModalOpen}
        handleDeleteAccount={handleDeleteAccount}
        triggerRef={triggerButtonRef}
      />
      
      {isModalOpen && (
        <AddActivityModal
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          category={category}
          setCategory={setCategory}
          amount={amount}
          setAmount={setAmount}
          unit={unit}
          setUnit={setUnit}
          date={date}
          setDate={setDate}
          description={description}
          setDescription={setDescription}
          formError={formError}
          handleAddActivity={handleAddActivity}
          triggerRef={triggerButtonRef}
        />
      )}
    </Suspense>
  );
}
