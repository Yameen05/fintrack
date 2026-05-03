import { useState, useEffect } from 'react';
import { transactionApi, budgetApi, insightApi } from '../services/api';
import { MonthlySummary, Transaction, CATEGORIES } from '../types';
import { useAuth } from '../hooks/useAuth';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    description: '', amount: '', type: 'EXPENSE',
    category: 'Food', date: new Date().toISOString().split('T')[0], notes: ''
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'budgets' | 'insights'>('overview');

  const fetchData = async () => {
    try {
      const [summaryRes, txRes] = await Promise.all([
        budgetApi.getSummary(year, month),
        transactionApi.getByMonth(year, month),
      ]);
      setSummary(summaryRes.data);
      setTransactions(txRes.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, [month, year]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await transactionApi.create({ ...form, amount: parseFloat(form.amount) });
      setShowForm(false);
      setForm({ description: '', amount: '', type: 'EXPENSE', category: 'Food', date: new Date().toISOString().split('T')[0], notes: '' });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleGetInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await insightApi.getInsights(year, month);
      setInsights(res.data.insights);
      setActiveTab('insights');
    } catch (e) { setInsights('Failed to load insights.'); }
    finally { setLoadingInsights(false); }
  };

  const pieData = summary
    ? Object.entries(summary.expensesByCategory).map(([name, value]) => ({ name, value }))
    : [];

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div style={s.container}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sidebarLogo}>₿ FinTrack</div>
        <nav style={s.nav}>
          {(['overview','transactions','budgets','insights'] as const).map(tab => (
            <button key={tab} style={{ ...s.navBtn, ...(activeTab === tab ? s.navBtnActive : {}) }}
              onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
        <button style={s.logoutBtn} onClick={logout}>Sign Out</button>
      </aside>

      {/* Main */}
      <main style={s.main}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h2 style={s.greeting}>Hey, {user?.name?.split(' ')[0]} 👋</h2>
            <p style={s.subGreeting}>Here's your financial overview</p>
          </div>
          <div style={s.headerRight}>
            <select style={s.select} value={month} onChange={e => setMonth(Number(e.target.value))}>
              {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select style={s.select} value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
            </select>
            <button style={s.addBtn} onClick={() => setShowForm(true)}>+ Add</button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && summary && (
          <div>
            <div style={s.statsGrid}>
              <StatCard label="Total Income" value={`$${summary.totalIncome.toFixed(2)}`} color="#10b981" />
              <StatCard label="Total Expenses" value={`$${summary.totalExpenses.toFixed(2)}`} color="#ef4444" />
              <StatCard label="Net Balance" value={`$${summary.netBalance.toFixed(2)}`}
                color={summary.netBalance >= 0 ? '#10b981' : '#ef4444'} />
              <StatCard label="Transactions" value={String(transactions.length)} color="#6366f1" />
            </div>

            <div style={s.chartsRow}>
              {pieData.length > 0 && (
                <div style={s.chartCard}>
                  <h3 style={s.chartTitle}>Expenses by Category</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(val: any) => `$${Number(val).toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={s.legend}>
                    {pieData.map((d, i) => (
                      <span key={i} style={s.legendItem}>
                        <span style={{ ...s.legendDot, background: COLORS[i % COLORS.length] }} />
                        {d.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {summary.budgets.length > 0 && (
                <div style={s.chartCard}>
                  <h3 style={s.chartTitle}>Budget Usage</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={summary.budgets} layout="vertical">
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <YAxis type="category" dataKey="category" tick={{ fill: '#9ca3af', fontSize: 11 }} width={80} />
                      <Tooltip formatter={(val: any) => `${Number(val).toFixed(1)}%`} />
                      <Bar dataKey="percentageUsed" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <button style={s.insightBtn} onClick={handleGetInsights} disabled={loadingInsights}>
              {loadingInsights ? '⏳ Analyzing...' : '✨ Get AI Spending Insights'}
            </button>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div style={s.tableCard}>
            <h3 style={s.sectionTitle}>Transactions — {monthNames[month - 1]} {year}</h3>
            {transactions.length === 0
              ? <p style={s.empty}>No transactions yet. Click + Add to get started.</p>
              : (
                <table style={s.table}>
                  <thead>
                    <tr>{['Date','Description','Category','Type','Amount',''].map(h =>
                      <th key={h} style={s.th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => (
                      <tr key={t.id} style={s.tr}>
                        <td style={s.td}>{t.date}</td>
                        <td style={s.td}>{t.description}</td>
                        <td style={s.td}><span style={s.badge}>{t.category}</span></td>
                        <td style={s.td}>
                          <span style={{ ...s.typeBadge, color: t.type === 'INCOME' ? '#10b981' : '#ef4444' }}>
                            {t.type}
                          </span>
                        </td>
                        <td style={{ ...s.td, fontWeight: 600, color: t.type === 'INCOME' ? '#10b981' : '#ef4444' }}>
                          {t.type === 'INCOME' ? '+' : '-'}${t.amount.toFixed(2)}
                        </td>
                        <td style={s.td}>
                          <button style={s.deleteBtn}
                            onClick={async () => { await transactionApi.delete(t.id); fetchData(); }}>
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        )}

        {/* Budgets Tab */}
        {activeTab === 'budgets' && summary && (
          <div>
            <h3 style={s.sectionTitle}>Budgets — {monthNames[month - 1]} {year}</h3>
            {summary.budgets.length === 0
              ? <p style={s.empty}>No budgets set for this month.</p>
              : (
                <div style={s.budgetGrid}>
                  {summary.budgets.map(b => (
                    <div key={b.id} style={s.budgetCard}>
                      <div style={s.budgetHeader}>
                        <span style={s.budgetCat}>{b.category}</span>
                        <span style={{ color: b.percentageUsed > 90 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                          {b.percentageUsed.toFixed(0)}%
                        </span>
                      </div>
                      <div style={s.progressBg}>
                        <div style={{
                          ...s.progressBar,
                          width: `${Math.min(b.percentageUsed, 100)}%`,
                          background: b.percentageUsed > 90 ? '#ef4444' : b.percentageUsed > 70 ? '#f59e0b' : '#6366f1'
                        }} />
                      </div>
                      <div style={s.budgetAmounts}>
                        <span>${b.spentAmount.toFixed(2)} spent</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>of ${b.limitAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div style={s.insightsCard}>
            <h3 style={s.sectionTitle}>✨ AI Spending Insights</h3>
            {insights
              ? <pre style={s.insightsText}>{insights}</pre>
              : <div style={s.insightsEmpty}>
                  <p style={s.empty}>Click the button below to get personalized advice from AI.</p>
                  <button style={s.insightBtn} onClick={handleGetInsights} disabled={loadingInsights}>
                    {loadingInsights ? '⏳ Analyzing...' : '✨ Generate Insights'}
                  </button>
                </div>
            }
          </div>
        )}
      </main>

      {/* Add Transaction Modal */}
      {showForm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{ color: '#fff', marginTop: 0 }}>Add Transaction</h3>
            <form onSubmit={handleAddTransaction} style={s.modalForm}>
              <input style={s.input} placeholder="Description" required
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <input style={s.input} type="number" placeholder="Amount" required min="0" step="0.01"
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              <select style={s.input} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
              <select style={s.input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <input style={s.input} type="date" value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })} />
              <textarea style={{ ...s.input, resize: 'none' }} placeholder="Notes (optional)" rows={2}
                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={s.addBtn} type="submit">Add</button>
                <button style={{ ...s.addBtn, background: 'rgba(255,255,255,0.1)' }}
                  type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const StatCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div style={s.statCard}>
    <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 8px', fontSize: 13 }}>{label}</p>
    <p style={{ color, margin: 0, fontSize: 26, fontWeight: 700 }}>{value}</p>
  </div>
);

const s: Record<string, React.CSSProperties> = {
  container: { display: 'flex', minHeight: '100vh', background: '#0d0d1a', color: '#fff', fontFamily: 'system-ui' },
  sidebar: { width: 220, background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', padding: '32px 16px' },
  sidebarLogo: { fontSize: 20, fontWeight: 700, marginBottom: 40, paddingLeft: 12 },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  navBtn: { padding: '10px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', textAlign: 'left', fontWeight: 500, fontSize: 14 },
  navBtnActive: { background: 'rgba(99,102,241,0.2)', color: '#818cf8' },
  logoutBtn: { padding: '10px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', textAlign: 'left', fontSize: 14 },
  main: { flex: 1, padding: '32px 40px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  greeting: { margin: 0, fontSize: 24, fontWeight: 700 },
  subGreeting: { margin: '4px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  headerRight: { display: 'flex', gap: 10, alignItems: 'center' },
  select: { padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: 13 },
  addBtn: { padding: '8px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  statCard: { background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '20px 24px', border: '1px solid rgba(255,255,255,0.07)' },
  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 },
  chartCard: { background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 24, border: '1px solid rgba(255,255,255,0.07)' },
  chartTitle: { margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)' },
  legend: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  legendDot: { width: 8, height: 8, borderRadius: '50%' },
  insightBtn: { padding: '12px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  tableCard: { background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 24, border: '1px solid rgba(255,255,255,0.07)' },
  sectionTitle: { margin: '0 0 20px', fontSize: 16, fontWeight: 600 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '8px 12px', fontSize: 12, color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.07)', fontWeight: 500 },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.05)' },
  td: { padding: '12px', fontSize: 13 },
  badge: { background: 'rgba(99,102,241,0.2)', color: '#818cf8', padding: '2px 8px', borderRadius: 4, fontSize: 11 },
  typeBadge: { fontWeight: 600, fontSize: 12 },
  deleteBtn: { background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 13 },
  empty: { color: 'rgba(255,255,255,0.3)', fontSize: 14 },
  budgetGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 },
  budgetCard: { background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.07)' },
  budgetHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 12 },
  budgetCat: { fontWeight: 600, fontSize: 14 },
  progressBg: { background: 'rgba(255,255,255,0.07)', borderRadius: 4, height: 6, marginBottom: 8 },
  progressBar: { height: '100%', borderRadius: 4, transition: 'width 0.3s' },
  budgetAmounts: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  insightsCard: { background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 24, border: '1px solid rgba(255,255,255,0.07)' },
  insightsText: { color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'system-ui', fontSize: 14 },
  insightsEmpty: { textAlign: 'center', paddingTop: 40 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#1a1a2e', borderRadius: 16, padding: 32, width: 420, border: '1px solid rgba(255,255,255,0.1)' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: 10 },
  input: { padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' },
};
