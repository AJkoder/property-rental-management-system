import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, ArrowRight, ShieldCheck, Wrench, TrendingUp } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left branded panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(251,191,36,0.4) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(129,140,248,0.5) 0%, transparent 45%)',
          }}
        />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <Building2 className="h-5 w-5 text-amber-400" />
          </div>
          <span className="text-lg font-semibold text-white">Property Manager</span>
        </div>

        <div className="relative">
          <h1 className="max-w-md text-4xl font-semibold leading-tight text-white">
            Run your entire portfolio from one place.
          </h1>
          <p className="mt-4 max-w-sm text-indigo-200">
            Units, maintenance, rent, and alerts — no more spreadsheets or sticky notes.
          </p>

          <div className="mt-10 flex flex-col gap-4">
            {[
              { icon: Building2, text: 'Track every unit and tenant in one dashboard' },
              { icon: Wrench, text: 'Maintenance requests from report to resolved' },
              { icon: TrendingUp, text: 'Rent collection, alerts, and reports on autopilot' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-xl bg-white/5 p-3 backdrop-blur">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/20">
                  <Icon className="h-4 w-4 text-amber-400" />
                </div>
                <span className="text-sm text-indigo-100">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-indigo-300">
          <ShieldCheck className="h-4 w-4" />
          Server-side role enforcement on every action
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-950">
              <Building2 className="h-5 w-5 text-amber-400" />
            </div>
            <span className="text-lg font-semibold text-slate-900">Property Manager</span>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
          <p className="mt-1 mb-8 text-sm text-slate-500">Sign in to manage your properties</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && (
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-indigo-700 hover:underline">
              Sign up
            </Link>
          </p>

          <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Demo credentials</p>
            <p className="mt-1 text-xs text-slate-400">manager@test.com · test123</p>
          </div>
        </div>
      </div>
    </div>
  );
}