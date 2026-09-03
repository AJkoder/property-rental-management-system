import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  ArrowRight,
  Users,
  ClipboardCheck,
  Wallet,
} from 'lucide-react';

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
      setError(
        err.response?.data?.error ||
          'Login failed. Please check your email and password.'
      );
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

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--brand)]">
            <Building2 className="h-5 w-5 text-white" />
          </div>

          <span className="font-['Fraunces'] text-lg font-semibold text-[color:var(--ink)]">
            Property Manager
          </span>
        </div>

        {/* Main message */}
        <div className="relative">

          <h1 className="max-w-md font-['Fraunces'] text-[40px] font-semibold leading-[1.15] text-[color:var(--ink)]">
            Everything you need to manage your properties.
          </h1>

          <p className="mt-3 max-w-sm text-[15px] leading-6 text-[color:var(--ink-soft)]">
            Keep your properties, tenants, rent and maintenance work
            organized in one place.
          </p>

          <div className="mt-8 space-y-2.5">

            {/* Feature 1 */}
            <div className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3.5 py-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--gold-tint)]">
                <Users className="h-4 w-4 text-[color:var(--gold)]" />
              </div>

              <div>
                <p className="text-sm font-medium text-[color:var(--ink)]">
                  Manage your tenants
                </p>

                <p className="text-xs text-[color:var(--ink-faint)]">
                  Keep tenant information organized
                </p>
              </div>

            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3.5 py-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--gold-tint)]">
                <ClipboardCheck className="h-4 w-4 text-[color:var(--gold)]" />
              </div>

              <div>
                <p className="text-sm font-medium text-[color:var(--ink)]">
                  Stay on top of maintenance
                </p>

                <p className="text-xs text-[color:var(--ink-faint)]">
                  Track issues from report to resolution
                </p>
              </div>

            </div>

          </div>
        </div>

        {/* Bottom note */}
        <p className="relative flex items-center gap-2 text-xs text-[color:var(--ink-faint)]">
          <Wallet className="h-4 w-4" />
          Your property operations, all in one place
        </p>

      </div>

      {/* Right login panel */}
      <div className="flex w-full items-center justify-center overflow-y-auto px-6 lg:w-1/2">

        <div className="w-full max-w-sm py-8">

          {/* Mobile logo */}
          <div className="mb-7 flex items-center gap-2.5 lg:hidden">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--brand)]">
              <Building2 className="h-5 w-5 text-white" />
            </div>

            <span className="font-['Fraunces'] text-lg font-semibold text-[color:var(--ink)]">
              Property Manager
            </span>

          </div>

          {/* Heading */}
          <h2 className="font-['Fraunces'] text-[26px] font-semibold text-[color:var(--ink)]">
            Welcome back
          </h2>

          <p className="mt-1 mb-5 text-sm text-[color:var(--ink-soft)]">
            Sign in to continue managing your properties
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[color:var(--ink)]">
                Email
              </label>

              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3.5 py-2.5 text-sm text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-faint)] focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/25"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">

                <label className="block text-sm font-medium text-[color:var(--ink)]">
                  Password
                </label>

              </div>

              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3.5 py-2.5 text-sm text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-faint)] focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/25"
                placeholder="Enter your password"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-[color:var(--red-tint)] px-3.5 py-2.5 text-sm text-[color:var(--red)]">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--brand)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[color:var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}

              {!loading && (
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              )}
            </button>

          </form>

          {/* Signup link */}
          <p className="mt-5 text-center text-sm text-[color:var(--ink-soft)]">
            Don't have an account?{' '}

            <Link
              to="/signup"
              className="font-medium text-[color:var(--brand)] hover:text-[color:var(--brand-dark)]"
            >
              Create one
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}