import React from 'react';
import { DashboardData, GoalData, InsightTip, ActivityRecord } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Leaf, Zap, Trash2, TrendingUp, AlertTriangle, Target, CheckCircle2, Activity, PieChart as PieChartIcon } from 'lucide-react';

interface DashboardPageProps {
  dashboard: DashboardData | null;
  goal: GoalData | null;
  insight: InsightTip | null;
  insightDismissed: boolean;
  setInsightDismissed: React.Dispatch<React.SetStateAction<boolean>>;
  activities: ActivityRecord[];
  targetGoal: number;
  setTargetGoal: React.Dispatch<React.SetStateAction<number>>;
  goalTimeframe: 'week' | 'month' | 'year';
  setGoalTimeframe: React.Dispatch<React.SetStateAction<'week' | 'month' | 'year'>>;
  handleSetGoal: (e: React.FormEvent) => void;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleDeleteAccount: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const DashboardPage = React.memo(function DashboardPage({
  dashboard, goal, insight, insightDismissed, setInsightDismissed,
  activities, targetGoal, setTargetGoal, goalTimeframe, setGoalTimeframe,
  handleSetGoal, setIsModalOpen, handleDeleteAccount, triggerRef
}: DashboardPageProps): React.JSX.Element {
  
  const percentage = dashboard ? Math.min((dashboard.totalKgCO2e / targetGoal) * 100, 100) : 0;
  const isWarning = dashboard && dashboard.totalKgCO2e > targetGoal;

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="header-title">
          <Leaf className="text-primary-color" size={28} color="#6366f1" />
          CarbonTwin
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button ref={triggerRef as any} className="btn-action" onClick={() => setIsModalOpen(true)} aria-haspopup="dialog">
            <Zap size={18} /> Add Activity
          </button>
          <button className="btn-danger" onClick={handleDeleteAccount} aria-label="Delete user account">
            <Trash2 size={18} />
          </button>
        </div>
      </header>
      
      <div className="dashboard-grid">
        <main className="dashboard-main">
          {insight && !insightDismissed && (
            <section className="glass-card ai-insight" aria-labelledby="tip-title">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: '100%' }}>
                  <span className={`badge badge-${insight.difficulty.toLowerCase()}`}>
                    {insight.difficulty}
                  </span>
                  <h2 id="tip-title" style={{ fontSize: '1.25rem', margin: '0.75rem 0', color: 'var(--text-primary)' }}>
                    {insight.tip}
                  </h2>
                  <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>{insight.rationale}</p>
                  
                  {insight.actionableSteps && insight.actionableSteps.length > 0 && (
                    <div style={{ margin: '1rem 0' }}>
                      <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle2 size={18} color="var(--success-color)" /> Actionable Steps:
                      </h3>
                      <ul className="ai-insight-steps">
                        {insight.actionableSteps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <span style={{ fontSize: '0.875rem', color: 'var(--success-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={16} /> Estimated Saving: {String(insight.estimatedSavingKg)} kgCO₂e
                  </span>
                </div>
                <button className="btn-outline" onClick={() => setInsightDismissed(true)} aria-label="Dismiss AI tip" style={{ border: 'none', padding: '4px 8px' }}>
                  &times;
                </button>
              </div>
            </section>
          )}

          <section className="glass-card">
            <h2 className="card-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChartIcon size={20} /> Carbon Emission Breakdown
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', alignItems: 'center', minHeight: '260px' }}>
              {dashboard && dashboard.breakdown.length > 0 ? (
                <>
                  <div style={{ width: '240px', height: '240px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboard.breakdown}
                          cx="50%" cy="50%"
                          innerRadius={60} outerRadius={80}
                          paddingAngle={5} dataKey="percentage"
                          stroke="none"
                        >
                          {dashboard.breakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--card-border)', borderRadius: '8px' }} itemStyle={{ color: 'var(--text-primary)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    {dashboard.breakdown.map((cat, idx) => (
                      <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: COLORS[idx % COLORS.length] }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>{cat.category}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{String(cat.amount.toFixed(1))} kgCO₂e</div>
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{String(cat.percentage.toFixed(0))}%</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', width: '100%' }}>No activities recorded yet. Add an activity to see your breakdown.</p>
              )}
            </div>
          </section>

          <section className="glass-card">
            <h2 className="card-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} /> Recent Activity Logs
            </h2>
            {activities.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {activities.map((a) => (
                  <div key={a.id} className="activity-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="activity-icon">
                        <Zap size={18} color="var(--primary-color)" />
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{a.description}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{a.category} &bull; {String(a.amount)} {a.unit}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {a.date.split('T')[0]}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No recent activity logs.</p>
            )}
          </section>
        </main>

        <aside className="dashboard-sidebar">
          <section className="glass-card">
            <h2 className="card-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={20} /> Active Goals
            </h2>
            {dashboard && (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div className="stat-label">Month's Emissions</div>
                  <div className="stat-value" style={{ color: isWarning ? 'var(--danger-color)' : 'var(--text-primary)' }}>
                    {String(dashboard.totalKgCO2e.toFixed(1))} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>kgCO₂e</span>
                  </div>
                </div>
                
                <div className="progress-container">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${String(percentage)}%`,
                      background: isWarning ? 'var(--danger-color)' : 'linear-gradient(90deg, var(--primary-color), #c084fc)'
                    }}
                  />
                </div>
                
                <div className="progress-text">
                  <span>0</span>
                  <span>Target: {String(targetGoal)} kgCO₂e</span>
                </div>

                {isWarning && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger-color)', fontSize: '0.875rem', marginTop: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                    <AlertTriangle size={16} /> You have exceeded your budget!
                  </div>
                )}
                
                {goal && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '1rem', textAlign: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
                    Goal Achievement: {new Date(goal.projectedDate).toLocaleDateString()}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="glass-card">
            <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Set Carbon Goal</h2>
            <form onSubmit={handleSetGoal}>
              <div className="form-group">
                <label htmlFor="goal-target">Target Limit (kgCO₂e)</label>
                <input
                  id="goal-target" type="number"
                  value={targetGoal} onChange={(e) => { setTargetGoal(parseInt(e.target.value, 10) || 0); }} min="1" required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="goal-timeframe">Timeframe</label>
                <select
                  id="goal-timeframe"
                  value={goalTimeframe} onChange={(e) => { setGoalTimeframe(e.target.value as 'week' | 'month' | 'year'); }}
                >
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>
              <button type="submit" className="btn-action" style={{ width: '100%', justifyContent: 'center' }}>
                Update Goal
              </button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
});

export default DashboardPage;
