import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaChevronDown, FaTimes, FaWhatsapp, FaClock, FaCalendarAlt, FaPlayCircle, FaUsers, FaVideo, FaBookOpen } from 'react-icons/fa';
import { useStudent } from '../context/StudentContext';
import { useSettings } from '../context/SettingsContext';
import { api, assetUrl, errMsg } from '../lib/api';
import { buy } from '../lib/checkout';
import { inr, discount, videoEmbed, fmtDateTime, fmtDate, fmtMins } from '../lib/format';
import { Tilt } from './Effects';
import Icon from './Icon';

/* ---------------- Countdown ---------------- */
export function useCountdown(target) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(new Date(target).getTime() - now, 0);
  return { done: diff <= 0, d: Math.floor(diff / 86400000), h: Math.floor(diff / 3600000) % 24, m: Math.floor(diff / 60000) % 60, s: Math.floor(diff / 1000) % 60 };
}

export function Countdown({ to, dark = true, size = 'lg' }) {
  const c = useCountdown(to);
  if (c.done) return null;
  const box = size === 'lg' ? 'h-16 w-16 text-2xl md:h-20 md:w-20 md:text-3xl' : 'h-12 w-12 text-lg';
  return (
    <div className="flex gap-2.5">
      {[['Days', c.d], ['Hours', c.h], ['Mins', c.m], ['Secs', c.s]].map(([l, v]) => (
        <div key={l} className="text-center">
          <div className={`${box} flex items-center justify-center rounded-2xl font-extrabold tabular-nums ${dark ? 'glass text-white' : 'bg-brand-950 text-white shadow-lg'}`}>{String(v).padStart(2, '0')}</div>
          <div className={`mt-1.5 text-[11px] font-semibold uppercase tracking-wider ${dark ? 'text-brand-200' : 'text-slate-500'}`}>{l}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Simple building blocks ---------------- */
export function CheckList({ items = [], cols = 2, dark = false }) {
  if (!items.length) return null;
  return (
    <ul className={`grid gap-3 ${cols === 2 ? 'sm:grid-cols-2' : ''}`}>
      {items.map((x) => (
        <li key={x} className={`flex items-start gap-3 ${dark ? 'text-brand-50' : 'text-slate-700'}`}>
          <FaCheckCircle className="mt-1 shrink-0 text-emerald-500" /> <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

export function Faqs({ items = [] }) {
  const [open, setOpen] = useState(0);
  if (!items.length) return null;
  return (
    <div className="space-y-3">
      {items.map((f, i) => (
        <div key={i} className="card overflow-hidden">
          <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-slate-900">
            {f.q}
            <FaChevronDown className={`shrink-0 text-brand-600 transition ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && <p className="whitespace-pre-line px-6 pb-5 text-slate-600">{f.a}</p>}
        </div>
      ))}
    </div>
  );
}

export function PriceTag({ price, mrp, light = false }) {
  const off = discount(price, mrp);
  return (
    <div className="flex flex-wrap items-baseline gap-3">
      <span className={`text-4xl font-extrabold ${light ? 'text-white' : 'text-slate-900'}`}>{inr(price)}</span>
      {off > 0 && (
        <>
          <span className={`text-lg line-through ${light ? 'text-brand-200' : 'text-slate-400'}`}>{inr(mrp)}</span>
          <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white">{off}% OFF</span>
        </>
      )}
    </div>
  );
}

export function Person({ p, label = 'Your Instructor' }) {
  if (!p?.name) return null;
  return (
    <div className="card flex flex-col gap-6 p-6 sm:flex-row sm:items-center md:p-8">
      {p.photo ? (
        <img src={assetUrl(p.photo)} alt={p.name} className="h-28 w-28 shrink-0 rounded-2xl object-cover shadow-lg" />
      ) : (
        <div className="icon-3d h-28 w-28 shrink-0 bg-gradient-to-br from-brand-500 to-brand-800 text-4xl font-extrabold">{p.name[0]}</div>
      )}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">{label}</div>
        <h3 className="mt-1 text-2xl">{p.name}</h3>
        {p.title && <div className="font-medium text-slate-500">{p.title}</div>}
        {p.bio && <p className="mt-3 whitespace-pre-line text-slate-600">{p.bio}</p>}
      </div>
    </div>
  );
}

export function VideoPlayer({ url, title }) {
  const v = videoEmbed(url);
  if (!v) return <div className="flex aspect-video items-center justify-center rounded-2xl bg-slate-900 text-sm text-slate-400">Video will be available soon</div>;
  return (
    <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl">
      {v.type === 'video' ? (
        <video src={v.src} controls controlsList="nodownload" className="h-full w-full" />
      ) : (
        <iframe src={v.src} title={title} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
      )}
    </div>
  );
}

export function Modal({ onClose, children, wide = false }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`relative w-full ${wide ? 'max-w-4xl' : 'max-w-md'} rounded-3xl bg-white p-6 shadow-2xl md:p-8`}>
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Close"><FaTimes /></button>
        {children}
      </div>
    </div>
  );
}

/** Shown when Razorpay isn't configured: pay by UPI/bank and admin approves */
export function ManualPaymentModal({ info, title, onClose }) {
  const { settings } = useSettings();
  const wa = (settings.whatsapp || '').replace(/\D/g, '');
  const msg = encodeURIComponent(`Hello, I have placed an order for "${title}" (Order ID: ${info.orderId}, Amount: ${inr(info.amount)}). Sharing payment details.`);
  return (
    <Modal onClose={onClose}>
      <div className="icon-3d mb-4 h-14 w-14 bg-gradient-to-br from-amber-400 to-orange-600 text-2xl">₹</div>
      <h3 className="text-xl">Complete your payment</h3>
      <p className="mt-1 text-sm text-slate-500">Your order is reserved. Access will be activated after payment verification.</p>
      <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">Course</span><b className="text-right text-slate-900">{title}</b></div>
        <div className="mt-2 flex justify-between"><span className="text-slate-500">Amount</span><b className="text-slate-900">{inr(info.amount)}</b></div>
        <div className="mt-2 flex justify-between"><span className="text-slate-500">Order ID</span><code className="text-xs">{String(info.orderId).slice(-8).toUpperCase()}</code></div>
      </div>
      <p className="mt-4 whitespace-pre-line text-sm text-slate-700">{settings.paymentInstructions}</p>
      {wa && (
        <a href={`https://wa.me/${wa}?text=${msg}`} target="_blank" rel="noreferrer" className="btn mt-5 w-full bg-[#25D366] text-white hover:bg-[#1ebe5b]">
          <FaWhatsapp className="text-lg" /> Send payment details on WhatsApp
        </a>
      )}
      <Link to="/dashboard" className="btn btn-outline mt-3 w-full">Go to my dashboard</Link>
    </Modal>
  );
}

/** Enroll / Buy button for courses and batches: handles login, payment and enrolled state */
export function PurchaseButton({ kind, item, className = '', label }) {
  const { student } = useStudent();
  const nav = useNavigate();
  const loc = useLocation();
  const [state, setState] = useState({ enrolled: false, pending: false, loading: !!student });
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(null);

  useEffect(() => {
    if (!student || !item?._id) return setState({ enrolled: false, pending: false, loading: false });
    api
      .get(`/student/enrollment?kind=${kind}&id=${item._id}`)
      .then((r) => setState({ ...r.data, loading: false }))
      .catch(() => setState((s) => ({ ...s, loading: false })));
  }, [student, item?._id, kind]);

  const goTo = kind === 'course' ? `/learn/${item.slug}/watch` : '/dashboard?tab=classes';

  const onClick = async () => {
    if (!student) return nav(`/register?next=${encodeURIComponent(loc.pathname)}`);
    if (state.enrolled) return nav(goTo);
    setBusy(true);
    try {
      const r = await buy(kind, item._id);
      if (r.status === 'enrolled' || r.status === 'paid') {
        toast.success('You are enrolled! 🎉');
        setState({ enrolled: true, pending: false });
        nav(goTo);
      } else if (r.status === 'manual') {
        setState({ enrolled: false, pending: true, pendingOrder: { orderId: r.orderId, amount: r.amount } });
        setManual(r);
      }
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const text = state.loading
    ? 'Checking...'
    : state.enrolled
      ? kind === 'course' ? 'Go to Course →' : 'Go to My Classes →'
      : state.pending
        ? 'Payment pending – view details'
        : busy
          ? 'Please wait...'
          : label || (item.price > 0 ? `Enroll Now – ${inr(item.price)}` : 'Enroll for Free');

  return (
    <>
      <button
        onClick={state.pending && !state.enrolled ? () => setManual(state.pendingOrder || { orderId: '-', amount: item.price }) : onClick}
        disabled={busy || state.loading}
        className={`btn ${state.enrolled ? 'btn-primary' : 'btn-accent'} py-4 text-base ${className}`}
      >
        {text}
      </button>
      {manual && <ManualPaymentModal info={manual} title={item.title} onClose={() => setManual(null)} />}
    </>
  );
}

/* ---------------- Cards ---------------- */
const cover = (img, icon, g = 'from-brand-600 to-brand-900') =>
  img ? (
    <img src={assetUrl(img)} alt="" loading="lazy" className="h-48 w-full object-cover transition duration-500 group-hover:scale-105" />
  ) : (
    <div className={`relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br ${g}`}>
      <div className="grid-lines absolute inset-0 opacity-40" />
      <div className="icon-3d relative h-20 w-20 rotate-[-8deg] border border-white/30 bg-white/15 text-4xl backdrop-blur transition duration-500 group-hover:rotate-0 group-hover:scale-110">
        <Icon name={icon} />
      </div>
    </div>
  );

export function OnlineCourseCard({ c }) {
  const off = discount(c.price, c.mrp);
  return (
    <Tilt as={Link} to={`/learn/${c.slug}`} className="card group flex h-full flex-col overflow-hidden hover:shadow-2xl hover:shadow-brand-900/15">
      <div className="relative overflow-hidden">
        {cover(c.thumbnail, 'software', 'from-indigo-600 to-purple-800')}
        {off > 0 && <span className="absolute left-4 top-4 rounded-full bg-accent-500 px-3 py-1 text-xs font-bold text-white shadow-lg">{off}% OFF</span>}
        <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur"><FaPlayCircle /> Recorded</span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <span className="chip mb-3 self-start">{c.category}</span>
        <h3 className="text-lg leading-snug group-hover:text-brand-700">{c.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-slate-500">{c.subtitle}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><FaBookOpen /> {c.lessonsCount} lessons</span>
          {c.totalMinutes > 0 && <span className="flex items-center gap-1.5"><FaClock /> {fmtMins(c.totalMinutes)}</span>}
        </div>
        <div className="mt-auto flex items-baseline gap-2 border-t border-slate-100 pt-4">
          <span className="text-xl font-extrabold text-slate-900">{inr(c.price)}</span>
          {off > 0 && <span className="text-sm text-slate-400 line-through">{inr(c.mrp)}</span>}
        </div>
      </div>
    </Tilt>
  );
}

export function BatchCard({ b }) {
  return (
    <Tilt as={Link} to={`/batches/${b.slug}`} className="card group flex h-full flex-col overflow-hidden hover:shadow-2xl hover:shadow-brand-900/15">
      <div className="relative overflow-hidden">
        {cover(b.thumbnail, 'users', 'from-emerald-500 to-teal-800')}
        <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
        </span>
        {b.seatsLeft !== null && b.seatsLeft <= 10 && <span className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-bold text-red-600">Only {b.seatsLeft} seats left</span>}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg leading-snug group-hover:text-brand-700">{b.title}</h3>
        <div className="mt-3 space-y-1.5 text-sm text-slate-600">
          {b.startDate && <div className="flex items-center gap-2"><FaCalendarAlt className="text-brand-500" /> Starts {fmtDate(b.startDate)}</div>}
          {b.schedule && <div className="flex items-center gap-2"><FaClock className="text-brand-500" /> {b.schedule}</div>}
          <div className="flex items-center gap-2"><FaVideo className="text-brand-500" /> {b.mode} · {b.platform}</div>
        </div>
        <div className="mt-auto flex items-baseline gap-2 border-t border-slate-100 pt-4">
          <span className="text-xl font-extrabold text-slate-900">{inr(b.price)}</span>
          {discount(b.price, b.mrp) > 0 && <span className="text-sm text-slate-400 line-through">{inr(b.mrp)}</span>}
        </div>
      </div>
    </Tilt>
  );
}

export function WebinarCard({ w }) {
  const ended = new Date(w.startsAt).getTime() + w.durationMins * 60000 < Date.now();
  return (
    <Tilt as={Link} to={`/webinars/${w.slug}`} className="card group flex h-full flex-col overflow-hidden hover:shadow-2xl hover:shadow-brand-900/15">
      <div className="relative overflow-hidden">
        {cover(w.banner, 'chart', 'from-orange-500 to-rose-700')}
        <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold shadow-lg ${ended ? 'bg-slate-700 text-white' : 'bg-white text-rose-600'}`}>
          {ended ? 'Ended' : w.price > 0 ? inr(w.price) : 'FREE'}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-accent-600"><FaCalendarAlt /> {fmtDateTime(w.startsAt)}</div>
        <h3 className="text-lg leading-snug group-hover:text-brand-700">{w.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-slate-500">{w.subtitle}</p>
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
          <span className="flex items-center gap-1.5 text-slate-500"><FaUsers /> {w.registeredCount} registered</span>
          <span className="font-semibold text-brand-600">{ended ? 'View' : 'Register →'}</span>
        </div>
      </div>
    </Tilt>
  );
}
