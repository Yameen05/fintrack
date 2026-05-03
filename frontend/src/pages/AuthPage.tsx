import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = isLogin
        ? await authApi.login({ email: form.email, password: form.password })
        : await authApi.register(form);
      login(res.data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>₿</span>
          <h1 style={styles.logoText}>FinTrack</h1>
        </div>
        <p style={styles.tagline}>Your money, tracked intelligently.</p>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(isLogin ? styles.activeTab : {}) }}
            onClick={() => setIsLogin(true)}
          >Login</button>
          <button
            style={{ ...styles.tab, ...(!isLogin ? styles.activeTab : {}) }}
            onClick={() => setIsLogin(false)}
          >Register</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <input
              style={styles.input}
              placeholder="Full Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          )}
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: '48px 40px',
    width: 400,
    color: '#fff',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 },
  logoIcon: { fontSize: 32 },
  logoText: { margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' },
  tagline: { color: 'rgba(255,255,255,0.5)', marginBottom: 32, marginTop: 4 },
  tabs: { display: 'flex', gap: 8, marginBottom: 24 },
  tab: {
    flex: 1, padding: '10px', borderRadius: 8, border: 'none',
    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer', fontWeight: 500, fontSize: 14, transition: 'all 0.2s',
  },
  activeTab: { background: 'rgba(99,102,241,0.4)', color: '#fff' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: {
    padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: 14,
    outline: 'none',
  },
  button: {
    marginTop: 8, padding: '14px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer',
  },
  error: { color: '#f87171', fontSize: 13, margin: 0 },
};
