import React, { useState } from 'react';

interface AuthPageProps {
  onLogin: (token: string) => void;
  API_BASE: string;
}

export default function AuthPage({ onLogin, API_BASE }: AuthPageProps): React.JSX.Element {
  const [isSignup, setIsSignup] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const validateAuth = (emailVal: string, passwordVal: string): boolean => {
    if (!emailVal.includes('@')) {
      setAuthError('Invalid email address');
      return false;
    }
    if (passwordVal.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!validateAuth(email, password)) return;

    try {
      const endpoint = isSignup ? '/auth/signup' : '/auth/login';
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = (await res.json()) as { token: string; error?: string };
      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed');
        return;
      }
      onLogin(data.token);
    } catch {
      setAuthError('Failed to connect to authentication server');
    }
  };

  return (
    <div className="auth-container">
      <style>{`
        body {
          margin: 0;
          background: radial-gradient(circle at top right, #1a1a2e, #121214);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #e1e1e6;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .auth-card {
          background: rgba(30, 30, 38, 0.75);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 40px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          text-align: center;
        }
        .auth-tabs {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .auth-tab {
          background: none;
          border: none;
          color: #a4a4b2;
          padding: 12px 24px;
          font-size: 16px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
        }
        .auth-tab.active {
          color: #9b70ff;
          border-bottom-color: #9b70ff;
          font-weight: 600;
        }
        .form-group {
          margin-bottom: 20px;
          text-align: left;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #a4a4b2;
          font-size: 14px;
        }
        .form-control {
          width: 100%;
          background: #121214;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #e1e1e6;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 15px;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .form-control:focus {
          outline: none;
          border-color: #9b70ff;
          box-shadow: 0 0 0 2px rgba(155, 112, 255, 0.25);
        }
        .btn-primary {
          width: 100%;
          background: #633bbc;
          color: #fff;
          border: none;
          padding: 14px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-primary:hover {
          background: #7a4ad8;
        }
        .btn-primary:focus-visible {
          outline: 3px solid #9b70ff;
        }
        .error-msg {
          color: #ff6b6b;
          font-size: 14px;
          margin-bottom: 16px;
          text-align: left;
        }
      `}</style>
      <main className="auth-card" aria-labelledby="auth-title">
        <h1 id="auth-title" style={{ fontSize: '28px', margin: '0 0 10px 0', color: '#fff' }}>CarbonTwin</h1>
        <p style={{ color: '#a4a4b2', margin: '0 0 30px 0' }}>Track and reduce your personal emissions footprint.</p>
        <div className="auth-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={!isSignup}
            className={`auth-tab ${!isSignup ? 'active' : ''}`}
            onClick={() => { setIsSignup(false); }}
          >
            Sign In
          </button>
          <button
            role="tab"
            aria-selected={isSignup}
            className={`auth-tab ${isSignup ? 'active' : ''}`}
            onClick={() => { setIsSignup(true); }}
          >
            Register
          </button>
        </div>
        {authError && <div className="error-msg" role="alert">{authError}</div>}
        <form onSubmit={(e) => { void handleAuthSubmit(e); }}>
          {isSignup && (
            <div className="form-group">
              <label htmlFor="auth-name">Name</label>
              <input
                id="auth-name"
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => { setName(e.target.value); }}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => { setEmail(e.target.value); }}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => { setPassword(e.target.value); }}
              required
            />
          </div>
          <button type="submit" className="btn-primary">
            {isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </main>
    </div>
  );
}
