'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { decodeTokenRole } from '@/app/lib/auth';
import { getApiBase } from '@/app/lib/api';


export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Change Password Modal state ──
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [changePwError, setChangePwError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {

      const formData = new URLSearchParams();
      formData.append('username', identifier);
      formData.append('password', password);

      const res = await fetch(`${getApiBase()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Invalid credentials. Please try again.');
        setLoading(false);
        return;
      }

      // Store token in localStorage
      localStorage.setItem('jb_token', data.access_token);

      if (data.must_change_password) {
        // Show forced password change modal
        setToken(data.access_token);
        setLoading(false);
        setShowChangePassword(true);
      } else {
        // Redirect based on role
        router.push(decodeTokenRole(data.access_token) === 'admin' ? '/admin' : '/home');
      }
    } catch {
      setError('Could not connect to server. Please try again.');
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePwError('');

    if (newPassword.length < 8) {
      setChangePwError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePwError('Passwords do not match.');
      return;
    }

    setChangePwLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ new_password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setChangePwError(data.detail || 'Failed to update password.');
        setChangePwLoading(false);
        return;
      }

      router.push(decodeTokenRole(token) === 'admin' ? '/admin' : '/home');
    } catch {
      setChangePwError('Could not connect to server. Please try again.');
      setChangePwLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-decor" />
      <div className="login-grid" />

      {/* Forced Change Password Modal — cannot be dismissed */}
      {showChangePassword && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-box" style={{ maxWidth: 480 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <ShieldCheck size={40} color="var(--gold)" style={{ marginBottom: 12 }} />
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                Set Your Password
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                You are using a temporary password. Please create a new personal password to continue.
              </p>
            </div>

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-field">
                <label htmlFor="new-password">New Password</label>
                <div className="field-wrap">
                  <span className="field-icon"><Lock size={15} /></span>
                  <input
                    id="new-password"
                    type={showNewPass ? 'text' : 'password'}
                    className="field-input"
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="field-toggle" onClick={() => setShowNewPass(s => !s)}>
                    {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="field-wrap">
                  <span className="field-icon"><Lock size={15} /></span>
                  <input
                    id="confirm-password"
                    type="password"
                    className="field-input"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {changePwError && (
                <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', margin: 0 }}>{changePwError}</p>
              )}

              <button type="submit" className="btn-login" disabled={changePwLoading}>
                {changePwLoading ? 'Updating…' : 'Set New Password & Continue'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Login form */}
      <div className="login-right">
        <div className="login-form-box fade-in">
          <h2>Welcome back</h2>
          <p>Sign in to access the marketplace</p>

          <form onSubmit={handleLogin}>
            <div className="form-field">
              <label htmlFor="identifier">Email or Phone</label>
              <div className="field-wrap">
                <span className="field-icon"><Mail size={15} /></span>
                <input
                  id="identifier"
                  type="text"
                  className="field-input"
                  placeholder="Email address or phone number"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <div className="field-wrap">
                <span className="field-icon"><Lock size={15} /></span>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="field-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="field-toggle"
                  onClick={() => setShowPass(s => !s)}
                  aria-label="Toggle password"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', margin: '0 0 8px' }}>{error}</p>
            )}

            <button
              id="login-btn"
              type="submit"
              className="btn-login"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="login-divider">
            <div className="divider-line" />
            <span>or</span>
            <div className="divider-line" />
          </div>

          <p className="login-footer">
            Don&apos;t have an account? <a onClick={() => router.push('/home')}>Request Access</a>
          </p>
        </div>
      </div>
    </div>
  );
}
