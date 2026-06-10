import React from 'react';
import { DashboardData, GoalData, InsightTip, ActivityRecord } from '../types';

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
  handleLogout: () => void;
  handleDeleteAccount: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export default function DashboardPage({
  dashboard, goal, insight, insightDismissed, setInsightDismissed,
  activities, targetGoal, setTargetGoal, goalTimeframe, setGoalTimeframe,
  handleSetGoal, setIsModalOpen, handleLogout, handleDeleteAccount, triggerRef
}: DashboardPageProps): React.JSX.Element {
  return (
    <div className="dashboard-container">
      <style>{`
        body { margin: 0; background: #121214; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #e1e1e6; }
        .header { display: flex; justify-content: space-between; align-items: center; padding: 20px 40px; background: #1e1e24; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .header-brand { font-size: 22px; font-weight: 700; color: #fff; }
        .user-menu { display: flex; align-items: center; gap: 16px; }
        .btn-text { background: none; border: none; color: #a4a4b2; font-size: 14px; cursor: pointer; }
        .btn-text:hover { color: #fff; }
        .btn-danger-outline { background: none; border: 1px solid rgba(255, 107, 107, 0.3); color: #ff6b6b; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
        .btn-danger-outline:hover { background: rgba(255, 107, 107, 0.1); }
        .main-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 32px; padding: 40px; max-width: 1400px; margin: 0 auto; }
        .card { background: #1e1e24; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 24px; margin-bottom: 24px; }
        .card-title { font-size: 18px; font-weight: 600; margin: 0 0 20px 0; color: #fff; }
        .btn-action { background: #633bbc; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; }
        .btn-action:hover { background: #7a4ad8; }
        .progress-bar-container { background: #121214; border-radius: 8px; height: 16px; width: 100%; overflow: hidden; margin-top: 10px; }
        .progress-bar-fill { height: 100%; border-radius: 8px; transition: width 0.3s ease; }
        .tip-card { border-left: 4px solid #9b70ff; background: rgba(155, 112, 255, 0.05); }
        .tip-difficulty { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .difficulty-easy { background: rgba(78, 203, 113, 0.15); color: #4ecb71; }
        .difficulty-medium { background: rgba(255, 168, 0, 0.15); color: #ffa800; }
        .difficulty-hard { background: rgba(255, 107, 107, 0.15); color: #ff6b6b; }
      `}</style>
      <header className="header">
        <span className="header-brand">CarbonTwin</span>
        <div className="user-menu">
          <button ref={triggerRef as any} className="btn-action" onClick={() => { setIsModalOpen(true); }} aria-haspopup="dialog">+ Add Activity</button>
          <button className="btn-text" onClick={handleLogout}>Logout</button>
          <button className="btn-danger-outline" onClick={handleDeleteAccount} aria-label="Delete user account (GDPR erasure request)">Delete Account</button>
        </div>
      </header>
      <div className="main-layout">
        <main>
          {insight && !insightDismissed && (
            <section className="card tip-card" aria-labelledby="tip-title">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className={`tip-difficulty difficulty-${insight.difficulty}`}>{insight.difficulty}</span>
                  <h2 id="tip-title" style={{ fontSize: '18px', margin: '10px 0 6px 0', color: '#fff' }}>{insight.tip}</h2>
                  <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#a4a4b2' }}>{insight.rationale}</p>
                  <span style={{ fontSize: '13px', color: '#9b70ff', fontWeight: 600 }}>Estimated Saving: {String(insight.estimatedSavingKg)} kgCO₂e</span>
                </div>
                <button className="btn-text" onClick={() => { setInsightDismissed(true); }} aria-label="Dismiss AI tip" style={{ fontSize: '18px', padding: '0 4px' }}>&times;</button>
              </div>
            </section>
          )}

          <section className="card">
            <h2 className="card-title">Carbon Emission Breakdown</h2>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', minHeight: '220px' }}>
              {dashboard && dashboard.breakdown.length > 0 ? (
                <>
                  <svg width="200" height="200" viewBox="0 0 200 200" aria-label="Donut Chart of Emissions">
                    <circle cx="100" cy="100" r="80" fill="none" stroke="#2a2a35" strokeWidth="20" />
                    {(() => {
                      let accumulated = 0;
                      const colors = ['#9b70ff', '#4ecb71', '#ffa800', '#ff6b6b'];
                      return dashboard.breakdown.map((cat, idx) => {
                        const strokeDasharray = `${String((cat.percentage / 100) * 502.6)} 502.6`;
                        const strokeDashoffset = String(-accumulated);
                        accumulated += (cat.percentage / 100) * 502.6;
                        return (
                          <circle
                            key={cat.category}
                            cx="100" cy="100" r="80" fill="none"
                            stroke={colors[idx % colors.length]} strokeWidth="20"
                            strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
                            transform="rotate(-90 100 100)"
                          />
                        );
                      });
                    })()}
                    <circle cx="100" cy="100" r="60" fill="#1e1e24" />
                  </svg>
                  <div>
                    {dashboard.breakdown.map((cat, idx) => {
                      const colors = ['#9b70ff', '#4ecb71', '#ffa800', '#ff6b6b'];
                      return (
                        <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '2px', background: colors[idx % colors.length] }} />
                          <span style={{ fontSize: '14px' }}>{cat.category}: <strong>{String(cat.amount.toFixed(1))} kgCO₂e</strong> ({String(cat.percentage.toFixed(0))}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p style={{ color: '#a4a4b2' }}>No activities recorded yet. Use the button to log your first emissions.</p>
              )}
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">Recent Activity Logs</h2>
            {activities.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {activities.map((a) => (
                  <li key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div>
                      <strong style={{ color: '#fff' }}>{a.description}</strong>
                      <div style={{ fontSize: '12px', color: '#a4a4b2' }}>{a.category} &bull; {String(a.amount)} {a.unit}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}><span style={{ fontWeight: 600 }}>{a.date.split('T')[0]}</span></div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#a4a4b2' }}>No recent activity logs.</p>
            )}
          </section>
        </main>

        <aside>
          <section className="card">
            <h2 className="card-title">Active Goals</h2>
            {dashboard && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                  <span>Month's Emissions:</span><strong>{String(dashboard.totalKgCO2e.toFixed(1))} kgCO₂e</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span>Goal Target:</span><strong>{String(targetGoal)} kgCO₂e</strong>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${String(Math.min((dashboard.totalKgCO2e / targetGoal) * 100, 100))}%`,
                      background: dashboard.totalKgCO2e > targetGoal ? '#ff6b6b' : '#4ecb71',
                    }}
                  />
                </div>
                {dashboard.totalKgCO2e > targetGoal && (
                  <p style={{ color: '#ff6b6b', fontSize: '13px', margin: '8px 0 0 0' }}>Warning: You have exceeded your budget!</p>
                )}
                {goal && (
                  <div style={{ fontSize: '12px', color: '#a4a4b2', marginTop: '12px' }}>
                    Goal Achievement: {new Date(goal.projectedDate).toLocaleDateString()}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="card">
            <h2 className="card-title">Set Carbon Goal</h2>
            <form onSubmit={handleSetGoal}>
              <div className="form-group">
                <label htmlFor="goal-target">Target Limit (kgCO₂e)</label>
                <input
                  id="goal-target" type="number" className="form-control"
                  value={targetGoal} onChange={(e) => { setTargetGoal(parseInt(e.target.value, 10) || 0); }} min="1" required
                />
              </div>
              <div className="form-group">
                <label htmlFor="goal-timeframe">Timeframe</label>
                <select
                  id="goal-timeframe" className="form-control"
                  value={goalTimeframe} onChange={(e) => { setGoalTimeframe(e.target.value as 'week' | 'month' | 'year'); }}
                >
                  <option value="week">Weekly</option><option value="month">Monthly</option><option value="year">Yearly</option>
                </select>
              </div>
              <button type="submit" className="btn-action" style={{ width: '100%' }}>Update Goal</button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}
