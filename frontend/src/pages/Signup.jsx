import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, ArrowRight, Users, ClipboardCheck, Wallet } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('manager');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(name, email, password, role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
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
              'radial-gradient(circle at 75% 15%, rgba(251,191,36,0.4) 0%, transparent 40%), radial-gradient(circle at 15% 80%, rgba(129,140,248,0.5) 0%, transparent 45%)',
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
            Built for the way property teams actually work.
          </h1>
          <p className="mt-4 max-w-sm text-indigo-200">
            Whether you manage the portfolio or fix what's broken, everything you need is in one place.
          </p>

          <div className="mt-10 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/20">
                  <Users className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">For property managers</p>
                  <p className="text-xs text-indigo-300">Full portfolio visibility and control</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/20">
                  <ClipboardCheck className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">For contractors</p>
                  <p className="text-xs text-indigo-300">Only the jobs assigned to you, nothing else</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-indigo-300">
          <Wallet className="h-4 w-4" />
          Free to get started, no credit card required
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center px-6 py-10 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-950">
              <Building2 className="h-5 w-5 text-amber-400" />
            </div>
            <span className="text-lg font-semibold text-slate-900">Property Manager</span>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900">Create your account</h2>
          <p className="mt-1 mb-6 text-sm text-slate-500">Start managing your properties today</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Jane Doe"
              />
            </div>

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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">I am a</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('manager')}
                  className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${
                    role === 'manager'
                      ? 'border-indigo-950 bg-indigo-950 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  Property Manager
                </button>
                <button
                  type="button"
                  onClick={() => setRole('contractor')}
                  className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${
                    role === 'contractor'
                      ? 'border-indigo-950 bg-indigo-950 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  Contractor
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
              {!loading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}