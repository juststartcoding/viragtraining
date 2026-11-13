import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaCheckCircle } from 'react-icons/fa';
import { useStudent } from '../../context/StudentContext';
import { errMsg } from '../../lib/api';
import { Seo } from '../../components/ui';
import { Logo } from '../../components/Layout';
import { Cube } from '../../components/Effects';

// Only allow in-site redirects after login
const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard');

function Shell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hero-grid relative hidden overflow-hidden bg-brand-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="orb -left-20 top-20 h-96 w-96 bg-brand-500/40" />
        <div className="orb bottom-0 right-0 h-80 w-80 bg-accent-500/25" />
        <Link to="/" className="relative"><Logo light /></Link>
        <div className="relative">
          <Cube size={110} className="mb-10" />
          <h2 className="text-4xl leading-tight text-white">Learn skills that get you <span className="text-gradient">hired</span>.</h2>
          <ul className="mt-8 space-y-3 text-brand-100">
            {['Access your courses anytime', 'Join live classes in one click', 'Track progress & earn certificates'].map((x) => (
              <li key={x} className="flex items-center gap-3"><FaCheckCircle className="text-emerald-400" /> {x}</li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-brand-200">© Virag Training Solutions</p>
      </div>
      <div className="flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-block lg:hidden"><Logo /></Link>
          <h1 className="text-3xl">{title}</h1>
          <p className="mt-2 text-slate-500">{subtitle}</p>
          <div className="card mt-8 p-6 md:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function StudentLogin() {
  const { student, login } = useStudent();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const next = safeNext(params.get('next'));
  const [f, setF] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  if (student) return <Navigate to={next} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(f.email, f.password);
      nav(next, { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Welcome back 👋" subtitle="Login to continue learning.">
      <Seo title="Student Login" />
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Email</label><input className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div><label className="label">Password</label><input className="input" type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        <button disabled={busy} className="btn btn-primary w-full py-3.5">{busy ? 'Logging in...' : 'Login'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">New here? <Link to={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-600">Create an account</Link></p>
      <p className="mt-2 text-center text-xs text-slate-400">Forgot password? Contact us on WhatsApp to reset it.</p>
    </Shell>
  );
}

export function StudentRegister() {
  const { student, register } = useStudent();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const next = safeNext(params.get('next'));
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  if (student) return <Navigate to={next} replace />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(f);
      toast.success('Account created!');
      nav(next, { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Create your account" subtitle="It takes less than a minute.">
      <Seo title="Create Account" />
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Full name</label><input className="input" required maxLength={100} value={f.name} onChange={set('name')} /></div>
        <div><label className="label">Email</label><input className="input" type="email" required value={f.email} onChange={set('email')} /></div>
        <div><label className="label">WhatsApp number</label><input className="input" type="tel" required value={f.phone} onChange={set('phone')} placeholder="+91 98xxxxxxx" /></div>
        <div><label className="label">Password</label><input className="input" type="password" required minLength={6} value={f.password} onChange={set('password')} placeholder="Min 6 characters" /></div>
        <button disabled={busy} className="btn btn-accent w-full py-3.5">{busy ? 'Creating account...' : 'Create account & continue'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link to={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-600">Login</Link></p>
    </Shell>
  );
}
