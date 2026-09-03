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
    <div className="flex h-screen w-screen overflow-hidden bg-[color:var(--bg)]">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-[color:var(--border)] p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(circle at 80% 15%, rgba(109,94,242,0.25) 0%, transparent 40%), radial-gradient(circle at 15% 85%, rgba(227,179,65,0.15) 0%, transparent 45%)',
          }}
        />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--brand)]">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="font-['Fraunces'] text-lg font-semibold text-[color:var(--ink)]">Property Manager</span>
        </div>

        <div className="relative">
          <h1 className="max-w-md font-['Fraunces'] text-[40px] font-semibold leading-[1.15] text-[color:var(--ink)]">
            Built for the way property teams actually work.
          </h1>
          <p className="mt-3 max-w-sm text-[15px] text-[color:var(--ink-soft)]">
            Whether you manage the portfolio or fix what's broken, everything you need is in one place.
          </p>

          <div className="mt-8 space-y-2.5">
            <div className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3.5 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--gold-tint)]">
                <Users className="h-4 w-4 text-[color:var(--gold)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[color:var(--ink)]">For property managers</p>
                <p className="text-xs text-[color:var(--ink-faint)]">Full portfolio visibility and control</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3.5 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--gold-tint)]">
                <ClipboardCheck className="h-4 w-4 text-[color:var(--gold)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[color:var(--ink)]">For contractors</p>
                <p className="text-xs text-[color:var(--ink-faint)]">Only the jobs assigned to you, nothing else</p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative flex items-center gap-2 text-xs text-[color:var(--ink-faint)]">
          <Wallet className="h-4 w-4" />
          Free to get started, no credit card required
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center overflow-y-auto px-6 lg:w-1/2">
        <div className="w-full max-w-sm py-8">
          <div className="mb-5 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--brand)]">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-['Fraunces'] text-lg font-semibold text-[color:var(--ink)]">
              Property Manager
            </span>
          </div>

          <h2 className="font-['Fraunces'] text-[26px] font-semibold text-[color:var(--ink)]">Create your account</h2>
          <p className="mt-1 mb-5 text-sm text-[color:var(--ink-soft)]">Start managing your properties today</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[color:var(--ink)]">Full name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3.5 py-2.5 text-sm text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-faint)] focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/25"
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[color:var(--ink)]">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3.5 py-2.5 text-sm text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-faint)] focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/25"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[color:var(--ink)]">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3.5 py-2.5 text-sm text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-faint)] focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/25"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[color:var(--ink)]">I am a</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('manager')}
                  aria-pressed={role === 'manager'}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                    role === 'manager'
                      ? 'border-[color:var(--brand)] bg-[color:var(--brand)] text-white'
                      : 'border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--ink-soft)] hover:border-[color:var(--ink-faint)]'
                  }`}
                >
                  Property Manager
                </button>
                <button
                  type="button"
                  onClick={() => setRole('contractor')}
                  aria-pressed={role === 'contractor'}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                    role === 'contractor'
                      ? 'border-[color:var(--brand)] bg-[color:var(--brand)] text-white'
                      : 'border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--ink-soft)] hover:border-[color:var(--ink-faint)]'
                  }`}
                >
                  Contractor
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-[color:var(--red-tint)] px-3.5 py-2.5 text-sm text-[color:var(--red)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--brand)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[color:var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
              {!loading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[color:var(--ink-soft)]">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[color:var(--brand)] hover:text-[color:var(--brand-dark)]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}