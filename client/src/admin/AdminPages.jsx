import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FaTachometerAlt, FaGraduationCap, FaLaptopCode, FaCogs, FaBriefcase, FaComments, FaInbox, FaSlidersH,
  FaUserShield, FaSignOutAlt, FaExternalLinkAlt, FaBars, FaTrash, FaPlus, FaPhoneAlt, FaWhatsapp,
  FaPlayCircle, FaChalkboard, FaVideo, FaUsers, FaReceipt,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { api, errMsg, useApi } from '../lib/api';
import { Loader } from '../components/ui';
import { Logo } from '../components/Layout';
import { ImageField } from './Fields';
import { LmsOverview } from './LmsAdmin';

const MENU = [
  { to: '/admin', label: 'Dashboard', icon: FaTachometerAlt, end: true },
  { to: '/admin/enquiries', label: 'Enquiries', icon: FaInbox },
  { heading: 'LMS & Sales' },
  { to: '/admin/r/onlineCourses', label: 'Online Courses', icon: FaPlayCircle },
  { to: '/admin/r/batches', label: 'Live Batches', icon: FaVideo },
  { to: '/admin/r/webinars', label: 'Webinars', icon: FaChalkboard },
  { to: '/admin/students', label: 'Students', icon: FaUsers },
  { to: '/admin/orders', label: 'Orders', icon: FaReceipt },
  { heading: 'Website' },
  { to: '/admin/r/courses', label: 'Courses', icon: FaGraduationCap },
  { to: '/admin/r/products', label: 'Software Products', icon: FaLaptopCode },
  { to: '/admin/r/services', label: 'Services', icon: FaCogs },
  { to: '/admin/r/portfolio', label: 'Portfolio', icon: FaBriefcase },
  { to: '/admin/r/testimonials', label: 'Testimonials', icon: FaComments },
  { to: '/admin/settings', label: 'Site Settings', icon: FaSlidersH },
  { to: '/admin/account', label: 'Account', icon: FaUserShield },
];

/* ---------------- Login ---------------- */
export function AdminLogin() {
  const { admin, login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  if (admin) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(form.email, form.password);
      nav('/admin');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hero-grid flex min-h-screen items-center justify-center bg-brand-950 p-4">
      <title>Admin Login | Virag Training Solutions</title>
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
        <Logo />
        <h1 className="mt-8 text-2xl">Admin login</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to manage your website.</p>
        <label className="label mt-6">Email</label>
        <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label className="label mt-4">Password</label>
        <input className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button disabled={busy} className="btn btn-primary mt-6 w-full">{busy ? 'Signing in...' : 'Sign in'}</button>
        <Link to="/" className="mt-4 block text-center text-sm text-slate-500 hover:text-brand-600">← Back to website</Link>
      </form>
    </div>
  );
}

/* ---------------- Layout (protected) ---------------- */
export function AdminLayout() {
  const { admin, checking, logout } = useAuth();
  const [open, setOpen] = useState(false);
  if (checking) return <Loader className="min-h-screen items-center" />;
  if (!admin) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen bg-slate-50">
      <title>Admin | Virag Training Solutions</title>
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto bg-brand-950 p-5 transition lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link to="/admin"><Logo light /></Link>
        <nav className="mt-6 space-y-1">
          {MENU.map(({ to, label, icon: I, end, heading }) => heading ? (
            <div key={heading} className="px-4 pb-1 pt-5 text-[11px] font-bold uppercase tracking-wider text-brand-300/60">{heading}</div>
          ) : (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white/10 text-white' : 'text-brand-200 hover:bg-white/5 hover:text-white'}`}>
              <I /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-8">
          <button className="text-xl lg:hidden" onClick={() => setOpen(true)} aria-label="Menu"><FaBars /></button>
          <div className="hidden text-sm text-slate-500 lg:block">Welcome, <b className="text-slate-800">{admin.name}</b></div>
          <div className="flex gap-2">
            <a href="/" target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"><FaExternalLinkAlt /> View site</a>
            <button onClick={logout} className="btn btn-danger btn-sm"><FaSignOutAlt /> Logout</button>
          </div>
        </header>
        <main className="p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
const STATUS_STYLE = {
  new: 'bg-blue-50 text-blue-700',
  contacted: 'bg-amber-50 text-amber-700',
  converted: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-slate-100 text-slate-500',
};

export function Dashboard() {
  const { data, loading } = useApi('/stats');
  if (loading || !data) return <Loader />;
  const cards = [
    ['New Enquiries', data.newEnquiries, '/admin/enquiries', 'from-accent-500 to-rose-500'],
    ['Courses', data.courses, '/admin/r/courses', 'from-brand-500 to-brand-800'],
    ['Software Products', data.products, '/admin/r/products', 'from-indigo-500 to-purple-700'],
    ['Services', data.services, '/admin/r/services', 'from-sky-500 to-blue-700'],
    ['Portfolio', data.portfolio, '/admin/r/portfolio', 'from-emerald-500 to-teal-700'],
    ['Testimonials', data.testimonials, '/admin/r/testimonials', 'from-fuchsia-500 to-pink-700'],
  ];
  return (
    <div>
      <h1 className="mb-6 text-2xl">Dashboard</h1>
      <LmsOverview />
      <h2 className="mb-4 text-lg">Website content</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, n, to, g]) => (
          <Link key={label} to={to} className={`rounded-2xl bg-gradient-to-br ${g} p-6 text-white shadow-lg transition hover:-translate-y-0.5`}>
            <div className="text-sm text-white/80">{label}</div>
            <div className="mt-2 text-4xl font-extrabold">{n}</div>
          </Link>
        ))}
      </div>
      <div className="card mt-8 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg">Latest enquiries</h2>
          <Link to="/admin/enquiries" className="text-sm font-semibold text-brand-600">View all ({data.enquiries})</Link>
        </div>
        {data.latest.length ? (
          <ul className="divide-y divide-slate-100">
            {data.latest.map((e) => (
              <li key={e._id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div><b className="text-slate-900">{e.name}</b> <span className="text-slate-500">· {e.phone} · {e.interest || 'General'}</span></div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[e.status]}`}>{e.status}</span>
                  <span className="text-xs text-slate-400">{new Date(e.createdAt).toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-slate-400">No enquiries yet.</p>}
      </div>
    </div>
  );
}

/* ---------------- Enquiries ---------------- */
export function Enquiries() {
  const [status, setStatus] = useState('');
  const { data, loading, reload } = useApi(`/enquiries${status ? `?status=${status}` : ''}`, []);

  const update = async (id, patch) => {
    try {
      await api.patch(`/enquiries/${id}`, patch);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  const remove = async (id) => {
    if (!confirm('Delete this enquiry?')) return;
    await api.delete(`/enquiries/${id}`);
    reload();
  };

  const exportCsv = () => {
    const cols = ['createdAt', 'name', 'phone', 'email', 'interest', 'message', 'status', 'notes', 'source'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [cols.join(','), ...data.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl">Enquiries</h1>
        <div className="flex gap-3">
          <select className="input w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {Object.keys(STATUS_STYLE).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={exportCsv} className="btn btn-outline" disabled={!data.length}>Export CSV</button>
        </div>
      </div>
      {loading ? <Loader /> : data.length ? (
        <div className="space-y-3">
          {data.map((e) => {
            const wa = e.phone.replace(/\D/g, '');
            return (
              <div key={e._id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-slate-900">{e.name}</b>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[e.status]}`}>{e.status}</span>
                      {e.interest && <span className="chip">{e.interest}</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-4 text-sm text-slate-500">
                      <a href={`tel:${e.phone}`} className="flex items-center gap-1 hover:text-brand-600"><FaPhoneAlt className="text-xs" /> {e.phone}</a>
                      <a href={`https://wa.me/${wa.length === 10 ? '91' + wa : wa}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-green-600"><FaWhatsapp /> WhatsApp</a>
                      {e.email && <a href={`mailto:${e.email}`} className="hover:text-brand-600">{e.email}</a>}
                      <span>{new Date(e.createdAt).toLocaleString()}</span>
                    </div>
                    {e.message && <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{e.message}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <select className="input py-1.5" value={e.status} onChange={(ev) => update(e._id, { status: ev.target.value })}>
                      {Object.keys(STATUS_STYLE).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => remove(e._id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Delete"><FaTrash /></button>
                  </div>
                </div>
                <input className="input mt-3 text-xs" placeholder="Internal notes (press Enter to save)" defaultValue={e.notes}
                  onKeyDown={(ev) => ev.key === 'Enter' && update(e._id, { notes: ev.currentTarget.value }).then(() => toast.success('Note saved'))} />
              </div>
            );
          })}
        </div>
      ) : <p className="card py-16 text-center text-slate-400">No enquiries found.</p>}
    </div>
  );
}

/* ---------------- Site settings ---------------- */
const SETTING_GROUPS = [
  { title: 'General', fields: [['siteName', 'Site name'], ['tagline', 'Tagline'], ['logo', 'Logo (optional)', 'image']] },
  { title: 'Contact', fields: [['phone', 'Phone'], ['whatsapp', 'WhatsApp number (with country code, e.g. 919876543210)'], ['email', 'Email'], ['workingHours', 'Working hours'], ['address', 'Address', 'textarea'], ['paymentInstructions', 'Manual payment instructions (UPI ID / bank details – shown when Razorpay is not configured)', 'textarea'], ['mapEmbedUrl', 'Google Maps embed URL (https://www.google.com/maps/embed?...)']] },
  { title: 'Courses', fields: [['showCourseFees', 'Show course fees on the website (when off, visitors see “Get fee details” and are asked to enquire)', 'checkbox']] },
  {
    title: 'SEO & Analytics',
    fields: [
      ['seoImage', 'Default share image for WhatsApp / Facebook previews (1200×630 recommended)', 'image'],
      ['googleVerification', 'Google Search Console verification code (only the content="…" value of the HTML tag)'],
      ['bingVerification', 'Bing Webmaster verification code (content of msvalidate.01)'],
      ['ga4Id', 'Google Analytics 4 Measurement ID (G-XXXXXXXXXX)'],
      ['clarityId', 'Microsoft Clarity project ID'],
      ['metaPixelId', 'Meta (Facebook) Pixel ID (numbers only)'],
    ],
  },
  { title: 'Home page hero', fields: [['heroTitle', 'Hero title'], ['heroSubtitle', 'Hero subtitle', 'textarea'], ['heroImage', 'Hero image (optional)', 'image']] },
  { title: 'About page', fields: [['aboutTitle', 'About heading'], ['aboutText', 'About text', 'textarea'], ['mission', 'Mission', 'textarea'], ['vision', 'Vision', 'textarea']] },
];
const SOCIALS = ['facebook', 'instagram', 'linkedin', 'youtube', 'twitter'];

export function SiteSettings() {
  const { reload: reloadPublic } = useSettings();
  const { data, loading } = useApi('/settings');
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (data) setForm({ ...data, socials: data.socials || {}, stats: data.stats || [] });
  }, [data]);
  if (loading || !form) return <Loader />;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', form);
      toast.success('Settings saved');
      reloadPublic();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Site settings</h1>
        <button disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Save changes'}</button>
      </div>
      {SETTING_GROUPS.map((g) => (
        <section key={g.title} className="card p-6">
          <h2 className="mb-4 text-lg">{g.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {g.fields.map(([k, label, type]) => (
              <div key={k} className={type === 'textarea' || type === 'checkbox' || k === 'mapEmbedUrl' ? 'sm:col-span-2' : ''}>
                {type !== 'checkbox' && <label className="label">{label}</label>}
                {type === 'checkbox' ? (
                  <label className="flex cursor-pointer items-center gap-3 text-sm">
                    <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={!!form[k]} onChange={(e) => set(k, e.target.checked)} />
                    {label}
                  </label>
                ) : type === 'image' ? <ImageField value={form[k]} onChange={(v) => set(k, v)} />
                  : type === 'textarea' ? <textarea className="input" rows={4} value={form[k] || ''} onChange={(e) => set(k, e.target.value)} />
                  : <input className="input" value={form[k] || ''} onChange={(e) => set(k, e.target.value)} />}
              </div>
            ))}
          </div>
        </section>
      ))}
      <section className="card p-6">
        <h2 className="mb-4 text-lg">Stats / counters</h2>
        <div className="space-y-3">
          {form.stats.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input className="input w-32" placeholder="1000+" value={s.value} onChange={(e) => set('stats', form.stats.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
              <input className="input" placeholder="Students Trained" value={s.label} onChange={(e) => set('stats', form.stats.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <button type="button" className="btn btn-danger btn-sm" onClick={() => set('stats', form.stats.filter((_, j) => j !== i))} aria-label="Remove"><FaTrash /></button>
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => set('stats', [...form.stats, { label: '', value: '' }])}><FaPlus /> Add stat</button>
        </div>
      </section>
      <section className="card p-6">
        <h2 className="mb-4 text-lg">Social media links</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIALS.map((k) => (
            <div key={k}>
              <label className="label capitalize">{k}</label>
              <input className="input" type="url" placeholder="https://" value={form.socials[k] || ''} onChange={(e) => set('socials', { ...form.socials, [k]: e.target.value })} />
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}

/* ---------------- Account ---------------- */
export function Account() {
  const { admin } = useAuth();
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const submit = async (e) => {
    e.preventDefault();
    if (f.newPassword !== f.confirm) return toast.error('Passwords do not match');
    try {
      await api.put('/auth/password', f);
      toast.success('Password updated');
      setF({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(errMsg(err));
    }
  };
  return (
    <form onSubmit={submit} className="card max-w-md p-6">
      <h1 className="text-2xl">Account</h1>
      <p className="mt-1 text-sm text-slate-500">{admin.email}</p>
      {[['currentPassword', 'Current password'], ['newPassword', 'New password (min 8 chars)'], ['confirm', 'Confirm new password']].map(([k, l]) => (
        <div key={k} className="mt-4">
          <label className="label">{l}</label>
          <input className="input" type="password" required minLength={k === 'currentPassword' ? 1 : 8} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
        </div>
      ))}
      <button className="btn btn-primary mt-6">Update password</button>
    </form>
  );
}
